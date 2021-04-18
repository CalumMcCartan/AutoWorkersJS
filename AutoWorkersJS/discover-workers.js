
const vscode = require('vscode');
const introduceWorkers = require('./introduce-workers.js');
const babel = require('@babel/core');


class DiscoveryTreeItem {
	constructor(loopObj) {
		let loop = loopObj.loop;
		this.label = `Line ${loop.node.loc.start.line}`;
		this.description = loopObj.message;
		this.tooltip = `${this.label} - ${this.description}`;
		this.command = {
			command: "autoworkersjs.selectLoop",
			title: "Select",
			arguments: [loop],
			tooltip: "Select Loop"
		};
		this.collapsibleState = vscode.TreeItemCollapsibleState.None;
	}
}

class DiscoveryTree {
	constructor(code) {
		this.code = code;
	}
	getTreeItem(item) {
		return item;
	}
	getChildren() {
		let loops = this.getLoops();
		return Promise.resolve(loops);
	}
	getLoops() {
		let loopObjs = searchLoops(this.code);
		let loops = [];
		loopObjs.forEach((loopObj) => {
			loops.push(new DiscoveryTreeItem(loopObj));
		});
		return loops;
	}
}


function searchLoops(code) {
    const ast = babel.parse(code);
    let allLoops = [];

    babel.traverse(ast, {
        enter(path) {
            if (path.node.type === "ForStatement") {
                let loopCode = code.substring(path.node.start, path.node.end);
				let allFunctions = introduceWorkers.getAllFunctions(code);
                let refactored = introduceWorkers.doRefactor(loopCode, code, allFunctions);
				let canRefactor = !!refactored.code;
				allLoops.push({
					loop: path,
					canRefactor: canRefactor,
					message: canRefactor ? "Ready to refactor!" : refactored.message
				});
            }
        },
    });

    return allLoops;
}


exports.searchLoops = searchLoops;
exports.DiscoveryTree = DiscoveryTree;
