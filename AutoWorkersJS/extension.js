const vscode = require('vscode');
const introduceWorkers = require('./introduce-workers.js');
const discoverWorkers = require('./discover-workers.js');


function activate(context) {

	let introduceWorkerCommand = vscode.commands.registerCommand('autoworkersjs.introduceWorkers', function () {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Editor does not exist');
			return;
		}

		const selectedCode = editor.document.getText(editor.selection);
		const fileText = editor.document.getText();

		try {
			const refactor = introduceWorkers.doRefactor(selectedCode, fileText);
			if (refactor.code) {
				editor.edit((edit) => {
					edit.replace(editor.selection, refactor.code);
				});
			}
			vscode.window.showInformationMessage(refactor.message);
		} catch(err) {
			console.log("Error!", err);
			vscode.window.showInformationMessage("Error: Please select a for loop");
		}
	});


	let discoverWorkerCommand = vscode.commands.registerCommand('autoworkersjs.discoverWorkers', function () {
		const editor = vscode.window.activeTextEditor;
		const code = editor.document.getText();
		try {
			vscode.window.createTreeView('discoverWorkersJs', {
				treeDataProvider: new discoverWorkers.DiscoveryTree(code)
			});
		} catch(err) {
			vscode.window.showInformationMessage(err.message);
		}
	});


	let selectLoop = vscode.commands.registerCommand('autoworkersjs.selectLoop', function (loop) {
		const editor = vscode.window.activeTextEditor;
		try {
			let loc = loop.node.loc;
			let start = new vscode.Position(loc.start.line - 1, 0);
			let end = new vscode.Position(loc.end.line, 0);
			editor.selection = new vscode.Selection(start, end);
			editor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
		} catch(err) {
			vscode.window.showInformationMessage("Provide a loop object to use this command");
			vscode.window.showInformationMessage(err.message);
		}
	});

	context.subscriptions.push(selectLoop);
	context.subscriptions.push(introduceWorkerCommand);
	context.subscriptions.push(discoverWorkerCommand);
}


function deactivate() {}

module.exports = {
	activate,
	deactivate
}
