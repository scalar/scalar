// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-scalar" is now active!')

  // Load the bundled scalar-api-reference
  try {
    // The bundled file will be available in the dist folder
    require('./scalar-api-reference.js')
    console.log('Scalar API Reference loaded successfully')
  } catch (error) {
    console.error('Failed to load Scalar API Reference:', error)
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const helloWorldDisposable = vscode.commands.registerCommand('vscode-scalar.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from ME!')
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
      `Scalar API Reference - ${document.fileName.split('/').pop()}`, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      },
    )

    // Function to update the webview content
    const updateWebviewContent = () => {
      const content = document.getText()
      panel.webview.html = getWebviewContent(content, panel.webview, context.extensionUri)
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

function getWebviewContent(openAPIContent: string, webview: vscode.Webview, extensionUri: vscode.Uri) {
  // Get the URI for the bundled scalar-api-reference.js file
  const scalarApiReferenceUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'scalar-api-reference.js'),
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scalar</title>
    <style>
        body {
            margin: 0;
            padding: 0;
        }

        /* Use VS Code theme variables */
        .light-mode {
          --scalar-color-1: var(--vscode-text-foreground, #121212);
          --scalar-color-2: var(--vscode-text-muted-foreground, rgba(0, 0, 0, 0.6));
          --scalar-color-3: var(--vscode-text-disabled-foreground, rgba(0, 0, 0, 0.4));
          --scalar-color-accent: var(--vscode-button-background, #0a85d1);
          --scalar-background-1: var(--vscode-editor-background, #fff);
          --scalar-background-2: var(--vscode-sideBar-background, #f6f5f4);
          --scalar-background-3: var(--vscode-panel-background, #f1ede9);
          --scalar-background-accent: var(--vscode-button-hover-background, #5369d20f);
          --scalar-border-color: var(--vscode-border-color, rgba(0, 0, 0, 0.08));
        }

        .dark-mode {
          --scalar-color-1: var(--vscode-text-foreground, rgba(255, 255, 255, 0.81));
          --scalar-color-2: var(--vscode-text-muted-foreground, rgba(255, 255, 255, 0.443));
          --scalar-color-3: var(--vscode-text-disabled-foreground, rgba(255, 255, 255, 0.282));
          --scalar-color-accent: var(--vscode-button-background, #8ab4f8);
          --scalar-background-1: var(--vscode-editor-background, #202020);
          --scalar-background-2: var(--vscode-sideBar-background, #272727);
          --scalar-background-3: var(--vscode-panel-background, #333333);
          --scalar-background-accent: var(--vscode-button-hover-background, #8ab4f81f);
          --scalar-border-color: var(--vscode-border-color, rgba(255, 255, 255, 0.1));
        }
    </style>
</head>
<body>
    <!-- Mount the Scalar API Reference -->
    <div id="scalar"></div>

    <!-- Load the bundled Scalar API Reference -->
    <script src="${scalarApiReferenceUri}"></script>

    <!-- Initialize the Scalar API Reference -->
    <script>
      Scalar.createApiReference('#scalar', {
        content: ${openAPIContent},
      })
    </script>
</body>
</html>`
}
