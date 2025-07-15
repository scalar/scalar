// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-scalar" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const helloWorldDisposable = vscode.commands.registerCommand('vscode-scalar.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from cursor!')
  })

  // Register the new OpenAPI preview command
  const previewOpenAPIDisposable = vscode.commands.registerCommand('vscode-scalar.previewOpenAPI', () => {
    // Get the currently active text editor
    const activeEditor = vscode.window.activeTextEditor

    if (!activeEditor) {
      vscode.window.showErrorMessage('No active text editor found. Please open an OpenAPI file first.')
      return
    }

    const document = activeEditor.document
    const fileName = document.fileName

    // Check if the file is a JSON or YAML file (common OpenAPI formats)
    if (!fileName.endsWith('.json') && !fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
      vscode.window.showWarningMessage('The current file may not be an OpenAPI document. Previewing anyway...')
    }

    // Create and show a new webview panel
    const panel = vscode.window.createWebviewPanel(
      'openAPIPreview', // Identifies the type of the webview
      `OpenAPI Preview - ${document.fileName.split('/').pop()}`, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )

    // Function to update the webview content
    const updateWebviewContent = () => {
      const content = document.getText()
      panel.webview.html = getWebviewContent(content, fileName)
    }

    // Set initial content
    updateWebviewContent()

    // Listen for document changes
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === document.uri.toString()) {
        updateWebviewContent()
      }
    })

    // Listen for when the panel is disposed
    panel.onDidDispose(
      () => {
        documentChangeListener.dispose()
      },
      null,
      context.subscriptions,
    )

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'alert':
            vscode.window.showInformationMessage(message.text)
            return
        }
      },
      undefined,
      context.subscriptions,
    )
  })

  context.subscriptions.push(helloWorldDisposable, previewOpenAPIDisposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(openAPIContent: string, fileName: string) {
  // Escape the content for safe HTML insertion
  const escapedContent = openAPIContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenAPI Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Monaco', 'Menlo', monospace;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .file-info {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .content {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 14px;
        }
        .no-content {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .status {
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: var(--vscode-notifications-background);
            color: var(--vscode-notifications-foreground);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OpenAPI Preview</h1>
        <div class="file-info">
            <strong>File:</strong> ${fileName.split('/').pop()}
        </div>
        <div class="content">
            ${escapedContent || '<div class="no-content">No content available</div>'}
        </div>
    </div>
    <div class="status" id="status">Live Preview</div>
    <script>
        // Handle communication with the extension
        const vscode = acquireVsCodeApi();

        // Example of sending a message to the extension
        function sendMessage() {
            vscode.postMessage({
                command: 'alert',
                text: 'Hello from webview!'
            });
        }

        // Update status when content changes
        function updateStatus() {
            const status = document.getElementById('status');
            status.textContent = 'Updated: ' + new Date().toLocaleTimeString();
            setTimeout(() => {
                status.textContent = 'Live Preview';
            }, 2000);
        }

        // Listen for content updates (this will be called when the webview is updated)
        updateStatus();
    </script>
</body>
</html>`
}
