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
  // Add a sidebar button
//   const sidebarProvider = new SidebarProvider(context.extensionUri);
//   context.subscriptions.push(
//     vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
//   );
// }

// class SidebarProvider implements vscode.WebviewViewProvider {
//   public static readonly viewType = 'myExtension.sidebar';

//   constructor(private readonly _extensionUri: vscode.Uri) { }

//   public resolveWebviewView(webviewView: vscode.WebviewView) {
//     webviewView.webview.options = {
//       enableScripts: true,
//       localResourceRoots: [this._extensionUri],
//     };

//     webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

//     // Handle button click event
//     webviewView.webview.onDidReceiveMessage(data => {
//       switch (data.command) {
//         case 'triggerCommand':
//           vscode.commands.executeCommand("extension.viewconfig");
//           break;
//       }
//     });
//   }

//   private _getHtmlForWebview(webview: vscode.Webview) {
//     const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js'));
  
//     return `<!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>My Extension Sidebar</title>
//                 <link rel="stylesheet" href="https://microsoft.github.io/vscode-codicons/dist/codicon.css">
//             </head>
//             <body>
//                 <button id="myButton"><i class="codicon codicon-gear"></i> Trigger Command</button>
//                 <script src="${scriptUri}"></script>
//             </body>
//             </html>`;
//   }
}

export function deactivate() {}
