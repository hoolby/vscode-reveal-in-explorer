import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import * as fs from "fs";

// Create output channel for logging
const outputChannel = vscode.window.createOutputChannel("Reveal in Explorer");

function log(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  outputChannel.appendLine(`[${timestamp}] ${message}`);
}

function isWSL(): boolean {
  try {
    if (process.platform !== "linux") {
      return false;
    }
    const version = fs.readFileSync("/proc/version", "utf8").toLowerCase();
    return version.includes("microsoft") || version.includes("wsl");
  } catch (e) {
    return false;
  }
}

async function getWindowsPath(wslPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(`wslpath -w "${wslPath}"`, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  log("Extension activated");

  // Command: Reveal in System Explorer
  const revealDisposable = vscode.commands.registerCommand(
    "revealInSystemExplorer",
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        log("Reveal: No file to reveal");
        vscode.window.showWarningMessage("No file to reveal.");
        return;
      }

      log(`Reveal: Attempting to reveal ${targetUri.fsPath}`);

      if (isWSL()) {
        log("Reveal: Detected WSL environment");
        try {
          const winPath = await getWindowsPath(targetUri.fsPath);
          log(`Reveal: Converted to Windows path: ${winPath}`);
          
          // Escape backslashes for shell execution
          const escapedPath = winPath.replace(/\\/g, "\\\\");
          const command = `explorer.exe /select,"${escapedPath}"`;
          
          log(`Reveal: Executing: ${command}`);
          cp.exec(command);
        } catch (error) {
          log(`Reveal: WSL Error - ${error}`);
          vscode.commands.executeCommand("revealFileInOS", targetUri);
        }
      } else {
        log("Reveal: Standard environment");
        try {
          await vscode.commands.executeCommand("revealFileInOS", targetUri);
        } catch (error) {
          log(`Reveal: Error - ${error}`);
          vscode.window.showErrorMessage(`Failed to reveal file: ${error}`);
        }
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
        return;
      }

      log(`OpenFolder: Target ${targetUri.fsPath}`);
      const folderPath = path.dirname(targetUri.fsPath);

      if (isWSL()) {
        try {
            const winPath = await getWindowsPath(folderPath);
            log(`OpenFolder: Windows path: ${winPath}`);
            const escapedPath = winPath.replace(/\\/g, "\\\\");
            const command = `explorer.exe "${escapedPath}"`;
            log(`OpenFolder: Executing: ${command}`);
            cp.exec(command);
        } catch (e) {
            log(`OpenFolder: WSL Error - ${e}`);
            vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(folderPath));
        }
      } else {
        // Fallback or standard
        try {
            await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(folderPath));
        } catch(e) {
            log(`OpenFolder: Error - ${e}`);
            await vscode.env.openExternal(vscode.Uri.file(folderPath));
        }
      }
    }
  );

  // Command: Copy File Name
  const copyFileNameDisposable = vscode.commands.registerCommand(
    "copyFileName",
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
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
