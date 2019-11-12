import * as vscode from "vscode";
import { TDQueriesTreeProvider } from "./td-queries-tree-provider";
import { TDQueriesFileProvider } from "./td-query-file-provider";
import { TDQueriesDataProvider } from "./td-query-data-provider";

const API_STORAGE_KEY = "TD_API_KEY";
declare var TextDecoder: any;

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
    const [query] = queriesExplorer.selection;
    console.log("RUNNING", query);
    const { id, name, type, databaseId } = query;
    if (!id) {
      vscode.window.showErrorMessage(
        "You must save a query before running it!"
      );
      return;
    }
    const content = await fileSystemProvider.readFile(query.document.uri);
    const decoder = new TextDecoder("utf-8");
    const queryString = decoder.decode(content);
    const data = {
      id,
      name,
      type,
      queryString,
      databaseId,
      connectorConfigId: null,
      cron: null,
      delay: 0,
      description: null,
      disableResultExport: true,
      draft: false,
      engineVersion: "stable",
      priority: 0,
      retryLimit: 0,
      scheduledTime: null,
      timeZone: "UTC"
    };
    const success = await dataProvider.runQuery(data);
    console.log({ success });
  }

  vscode.commands.registerCommand("extension.authenticate", authenticate);
  vscode.commands.registerCommand("extension.runQuery", runQuery);

  const dataProvider = new TDQueriesDataProvider(
    context.globalState.get(API_STORAGE_KEY, "")
  );
  const treeDataProvider = new TDQueriesTreeProvider(dataProvider);
  const fileSystemProvider = new TDQueriesFileProvider(dataProvider);

  const queriesExplorer = vscode.window.createTreeView("tdQueries", {
    canSelectMany: false,
    showCollapseAll: false,
    treeDataProvider
  });

  queriesExplorer.onDidChangeSelection(function({ selection }) {
    const [query] = selection;
    vscode.window.showTextDocument(query.document);
  });

  vscode.workspace.registerFileSystemProvider("tdQuery", fileSystemProvider);

  async function newQuery() {
    const name = await vscode.window.showInputBox({
      prompt: "Name your query"
    });
    const type = await vscode.window.showQuickPick(["presto", "hive"]);
    const database = await vscode.window.showQuickPick(["11198"]);
    if (name && type && database) {
      const newQuery = treeDataProvider.newQuery(name, type, database);
      queriesExplorer.reveal(newQuery);
    } else {
      vscode.window.showErrorMessage(
        "You need to provide a name, type and database"
      );
    }
  }
  vscode.commands.registerCommand("extension.newQuery", newQuery);

  function refresh() {
    vscode.window.showInformationMessage("Refreshing list...");
    treeDataProvider.refresh();
  }
  vscode.commands.registerCommand("extension.refresh", refresh);
}

export function deactivate() {}
