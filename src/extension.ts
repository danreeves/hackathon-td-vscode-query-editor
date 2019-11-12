import * as vscode from "vscode";
import { TDQueriesTreeProvider } from "./td-queries-tree-provider";
import { TDQueriesFileProvider } from "./td-query-file-provider";

const API_STORAGE_KEY = "TD_API_KEY";

export function activate(context: vscode.ExtensionContext) {
  console.log("Initialising Treasure Data");

  async function authenticate() {
    const currentApiKey = context.globalState.get(API_STORAGE_KEY, "");
    const apiKey = await vscode.window.showInputBox({
      value: currentApiKey,
      prompt: "Enter your TD API key"
    });
    context.globalState.update(API_STORAGE_KEY, apiKey);
    if (apiKey) {
      vscode.window.showInformationMessage("Authenticated with Treasure Data!");
    } else {
      vscode.window.showInformationMessage(
        "Deauthenticated from Treasure Data!"
      );
    }
  }

  async function runQuery() {
    vscode.window.showInformationMessage("Running query...");
  }

  vscode.commands.registerCommand("extension.authenticate", authenticate);
  vscode.commands.registerCommand("extension.runQuery", runQuery);
  const queriesExplorer = vscode.window.createTreeView("tdQueries", {
    canSelectMany: false,
    showCollapseAll: false,
    treeDataProvider: new TDQueriesTreeProvider()
  });

  queriesExplorer.onDidChangeSelection(function({ selection }) {
    const [query] = selection;
    vscode.window.showTextDocument(query.document);
  });

  vscode.workspace.registerFileSystemProvider(
    "tdQuery",
    new TDQueriesFileProvider()
  );
}

export function deactivate() {}
