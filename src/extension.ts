import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  // Command: Reveal in System Explorer
  const revealDisposable = vscode.commands.registerCommand(
    "revealInSystemExplorer",
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showWarningMessage("No file to reveal.");
        return;
      }

      try {
        await vscode.commands.executeCommand(
          "revealFileInOS",
          targetUri
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reveal file: ${error}`);
      }
    }
  );

  // Command: Open Containing Folder
  const openFolderDisposable = vscode.commands.registerCommand(
    "openContainingFolder",
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showWarningMessage("No file to open.");
        return;
      }

      // Use revealFileInOS on the parent directory to open the folder
      // This works better in WSL/Remote contexts than openExternal
      const folderPath = path.dirname(targetUri.fsPath);
      await vscode.commands.executeCommand(
        "revealFileInOS",
        vscode.Uri.file(folderPath)
      );
    }
  );

  // Command: Copy File Name
  const copyFileNameDisposable = vscode.commands.registerCommand(
    "copyFileName",
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showWarningMessage("No file selected.");
        return;
      }

      const fileName = path.basename(targetUri.fsPath);
      await vscode.env.clipboard.writeText(fileName);
    }
  );

  context.subscriptions.push(revealDisposable);
  context.subscriptions.push(openFolderDisposable);
  context.subscriptions.push(copyFileNameDisposable);
}
