import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { type IConfig, ICommand, CommandAction, IMessage } from "./app/model";

import { CodeAgent } from "../server/CodeAgent";

export default class ViewLoader {
	private readonly _panel: vscode.WebviewPanel | undefined;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	constructor(fileUri: vscode.Uri, extensionPath: string) {
		this._extensionPath = extensionPath;
		console.log("Initializing ViewLoader with fileUri:", fileUri.fsPath);

		let config = this.getFileContent(fileUri);
		if (config) {
			console.log("Configuration file content loaded successfully.");
			this._panel = vscode.window.createWebviewPanel(
				"configView",
				"Coding assistant with auto_debugger",
				vscode.ViewColumn.Two,
				{
					enableScripts: true,

					localResourceRoots: [
						vscode.Uri.file(path.join(extensionPath, "configViewer")),
					],
				},
			);

			this._panel.webview.html = this.getWebviewContent(config);
			console.log("Webview content set.");
			////////////////////////////////////////////////////////////////
			this._panel.webview.onDidReceiveMessage(
				(message: any) => {
					console.log("Extension received message", message);
					codeAgent.onReceiveMessage(message);

					if (message.command) {
						// Handling messages with 'command'
						switch (message.command) {
							case "doSomething":
								vscode.window.showErrorMessage(message.text);
								return;
							// Handle other messages or commands
						}
					} else if (message.action) {
						// Handling messages with 'action' (assuming ICommand interface)
						switch (message.action) {
							case CommandAction.Save:
								this.saveFileContent(message.fileUri, message.content);
								break;
							// Handle other actions
						}
					}
				},
				undefined,
				this._disposables,
			);
			const codeAgent = new CodeAgent({
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				postMessage: (message: any) =>
					this._panel!.webview.postMessage(message),
			});
			console.log("Started code agent", codeAgent);
		} else {
			console.error("Failed to load configuration file content.");
		}
	}

	private getWebviewContent(config: IConfig): string {
		// Local path to main script run in the webview
		const reactAppPathOnDisk = vscode.Uri.file(
			path.join(this._extensionPath, "configViewer", "configViewer.js"),
		);
		const reactAppUri = this._panel?.webview.asWebviewUri(reactAppPathOnDisk);

		const configJson = JSON.stringify(config);
		console.log("Generated webview HTML content.");

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>AutoDebugger</title>
	
			<meta http-equiv="Content-Security-Policy"
				  content="default-src 'none';
						   img-src https: data:;
						   script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
						   style-src vscode-resource: 'unsafe-inline';">
	
			<script>
			  window.acquireVsCodeApi = acquireVsCodeApi;
			  window.initialData = ${configJson};
			</script>
		</head>
		<body>
			<div id="root" class="bg-gray-900"></div>
	
			<script src="${reactAppUri}"></script>
		</body>
		</html>`;
	  }

	private getFileContent(fileUri: vscode.Uri): IConfig | undefined {
		if (fs.existsSync(fileUri.fsPath)) {
			let content = fs.readFileSync(fileUri.fsPath, "utf8");
			let config: IConfig = JSON.parse(content);
			console.log("File content read successfully:", content);

			return config;
		} else {
			console.error("File does not exist:", fileUri.fsPath);
		}
		return undefined;
	}

	private saveFileContent(fileUri: vscode.Uri, config: IConfig) {
		if (fs.existsSync(fileUri.fsPath)) {
			let content: string = JSON.stringify(config);
			fs.writeFileSync(fileUri.fsPath, content);
			console.log("Configuration saved to", fileUri.fsPath);

			vscode.window.showInformationMessage(
				`👍 Configuration saved to ${fileUri.fsPath}`,
			);
		} else {
			console.error("File does not exist:", fileUri.fsPath);
		}
	}
}
