const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('simple-extension.helloWorld', function () {
        vscode.window.showInformationMessage('Hello World from Simple Extension!');
    });
    
    context.subscriptions.push(
        vscode.commands.registerCommand('yourExtension.showChat', () => {
            const panel = vscode.window.createWebviewPanel(
                'chatSidebar', // Identifies the type of the webview. Used internally
                'Chat', // Title of the panel displayed to the user
                vscode.ViewColumn.Three, // Editor column to show the new webview panel in, set to Three for right side.
                {
                    enableScripts: true // Enable scripts in the webview
                }
            );

            panel.webview.html = getWebviewContent();

            // Register message handler within the scope of the created panel
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'sendMessage':
                            handleSendMessage(message.text);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
}

function handleSendMessage(text) {
    // Handle sending the message, e.g., display it in the chat or send to a server
    console.log('Message from webview:', text);
}

function getWebviewContent() {
    // HTML content for the webview
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat</title>
    </head>
    <body>
        <h1>Chat Interface</h1>
        <div id="chat"></div>
        <input type="text" id="messageInput">
        <button onclick="sendMessage()">Send</button>

        <script>
            const vscode = acquireVsCodeApi();
            function sendMessage() {
                const input = document.getElementById('messageInput');
                vscode.postMessage({
                    command: 'sendMessage',
                    text: input.value
                });
                input.value = '';
            }
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};