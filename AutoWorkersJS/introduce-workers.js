
const generator = require("@babel/generator");
const babel = require('@babel/core');
const t = babel.types;


function refactorError(msg) {
    return {
        message: msg,
        code: null
    };
}


function buildGlobalsMap(globals) {
    let globalsMap = '{';
    globals.forEach((global) => {
        globalsMap += `${global}: ${global},`;
    });
    return globalsMap + '}';
}


function nodeIsArrayAccess(node, code) {
    let nodeStr = code.substring(node.start, node.end)
    return nodeStr.includes('[');
}


function renameGlobals(node, globals) {
    node.traverse({
        enter(path) {
            if (path.isIdentifier() && globals.includes(path.node.name)) {
                path.node.name = 'global.env.' + path.node.name;
            }
        },
    });
}


function recursiveFunctionCheck(node, requiredFunctions, allFunctions) {
    node.traverse({
        enter(path) {
            if (path.node.type === "CallExpression") {
                let fName = path.node.callee.name;
                if (!requiredFunctions.has(fName)) {
                    requiredFunctions.add(fName);
                    let fNode = allFunctions[fName];
                    if (fNode) {
                        recursiveFunctionCheck(fNode, requiredFunctions, allFunctions);
                    }
                }
            }
        },
    });
}


function formatCode(rootLoop, code) {
    let spaceSize = rootLoop.node.loc.end.column - 1;
    let spacing = " ".repeat(spaceSize);
    code = code.replace(/\r?\n|\r/g, '');
    code = code.replace(/  /g, ' ');
    code = code.replace(/;/g, ';\n' + spacing);
    code = spacing + code;
    return code;
}


function getAllFunctions(code) {
    const fullAst = babel.parse(code);
    let allFunctions = {};
    babel.traverse(fullAst, {
        enter(path) {
            if (path.node.type === "FunctionDeclaration") {
                let name = path.node.id.name;
                if (name) {
                    allFunctions[name] = path;
                }
            }
        }
    });
    return allFunctions;
}


function tryDoRefactor(code, fileCode, allFunctions) {
    let rootLoop;
    let loopBody;
    let index = 0;
    let arrayName;
    let iterName;
    let unknownFuncs = new Set();
    let requiredFunctions = new Set();
    let locals = new Set();
    let variables = new Set();
    let mutations = new Set();
    if (!allFunctions) allFunctions = getAllFunctions(fileCode);

    // Extract info from selected code
    const ast = babel.parse(code);
    babel.traverse(ast, {
        enter(path) {
            if (path.node.type === "Identifier") {
                let id = path.node.name;

                // First id is itterator name
                if (!iterName) iterName = id;

                // Store identifiers
                switch(path.parent.type) {
                    case 'CallExpression':
                        let isCallee = path.parent.callee.name === id;
                        if (isCallee) {
                            requiredFunctions.add(id);
                            let func = allFunctions[id];
                            if (func) {
                                // Recursively add functions used by the the required function
                                recursiveFunctionCheck(func, requiredFunctions, allFunctions);
                            } else {
                                unknownFuncs.add(id);
                            }
                        } else {
                            variables.add(id);
                        }
                        break;
                    case 'AssignmentExpression':
                        variables.add(id);
                        if (path.parent.left.name === id) {
                            mutations.add(id);
                        }
                        break;
                    case 'VariableDeclarator':
                        locals.add(id);
                        break;
                    case 'MemberExpression':
                        let isObj = path.parent.object.name === id;
                        if (nodeIsArrayAccess(path.parent, code)) {
                            variables.add(id);
                            if (!arrayName && isObj) arrayName = id;
                        } else if (isObj){
                            variables.add(id);
                        }
                        break;
                    default:
                        variables.add(id);
                }
            }
            if (index == 1 && path.type === "ForStatement") {
                rootLoop = path;
            }
            if (!loopBody && path.type === "BlockStatement") {
                loopBody = path.node.body;
            }
            index += 1;
        },
    });

    // Format collected data
    variables.delete(iterName);
    locals.delete(iterName);
    unknownFuncs = Array.from(unknownFuncs);
    variables = Array.from(variables);
    locals = Array.from(locals);
    mutations = Array.from(mutations);
    requiredFunctions = Array.from(requiredFunctions);
    let globals = variables.filter(x => !locals.includes(x));
    let globalsMap = buildGlobalsMap(globals);
    let mutatedGlobals = mutations.filter(x => globals.includes(x));
    // console.log("mutations", mutations);
    // console.log("mutatedGlobals", mutatedGlobals);
    // console.log("vars", variables);
    // console.log("locals", locals);
    // console.log("globals", globals);
    // console.log("Functions", requiredFunctions);
    // console.log("iterName", iterName);
    // console.log("arName", arrayName);

    // Check the selection is valid for refactoring
    if (!rootLoop) {
        return refactorError("Cannot refactor: Please select a for loop");
    }
    if (!arrayName) { 
        return refactorError("Cannot refactor: This loop does not operate on an array");
    }
    if (unknownFuncs.length) {
        return refactorError(`Cannot refactor: Cannot serialize '${unknownFuncs[0]}()'`);
    }
    if (mutatedGlobals.length) {
        return refactorError(`Cannot refactor: The shared variable '${mutatedGlobals[0]}' is modified.`);
    }

    //Create template for refactored code
    let codeTemplate = 
        `let tasks = new Parallel(Array.from(Array(${arrayName}.length).keys()),{env:${globalsMap}});` +
        `tasks.require(${requiredFunctions.join(', ')});` +
        `function doTask(${iterName}) {` +
        `};` +
        `${arrayName} = tasks.map(doTask);`;
    
    const newAst = babel.parse(codeTemplate);

    // Add loop body to new ast
    let taskFunc = null;
    babel.traverse(newAst, {
        enter(path) {
            if (taskFunc) path.skip();

            if (path.type === "BlockStatement") {
                taskFunc = path;
                taskFunc.node.body = loopBody;
                let returnIdent = t.identifier(`global.env.${arrayName}[${iterName}]`);
                taskFunc.node.body.push(t.returnStatement(returnIdent));
            }
        },
    });

    // Rename globals
    renameGlobals(taskFunc, globals);

    // Generate new code from AST
    const result = generator.default(newAst, codeTemplate);
    let finalCode = formatCode(rootLoop, result.code);
    return {
        message: "Success!",
        code: finalCode
    }
}

function doRefactor(code, fileCode, allFunctions = null) {
    try{ 
        return tryDoRefactor(code, fileCode, allFunctions);
    } catch(err) {
        return refactorError("Cannot refactor");
    }
}

exports.getAllFunctions = getAllFunctions;
exports.doRefactor = doRefactor;
