// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ViewLoader from "./view/ViewLoader";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-react" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.viewconfig",
    () => {
      const configPath = vscode.Uri.file(context.extensionPath + '/config.json');

      // Create a new instance of ViewLoader with the config file URI and extension path
      const viewLoader = new ViewLoader(configPath, context.extensionPath);
    }
  );

  
  context.subscriptions.push(disposable);

}

export function deactivate() {}
