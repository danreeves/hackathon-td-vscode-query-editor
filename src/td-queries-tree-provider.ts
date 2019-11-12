import {
  TreeDataProvider,
  TreeItem,
  TextDocument,
  Uri,
  EndOfLine,
  Position,
  TextLine,
  TreeItemCollapsibleState,
  Range,
  Event,
  EventEmitter
} from "vscode";
import { TDQueriesDataProvider } from "./td-query-data-provider";

/**
 * This is responsible for loading the queries to dusplay in the list
 */
export class TDQueriesTreeProvider implements TreeDataProvider<Query> {
  constructor(public dataProvider: TDQueriesDataProvider) {
    this.dataProvider = dataProvider;
    this.dataProvider.emitter.event(({ type, data }) => {
      if (type === "saved") {
        const { name, id } = data;
        const newQuery = this._newQueries.find(query => {
          return query.name === name;
        });
        if (!newQuery) {
          return;
        }
        newQuery.id = id;
        this._cachedQueries.unshift(newQuery);
        this._newQueries = this._newQueries.filter(query => {
          return query.name !== name;
        });
        this._emitter.fire(null);
      }
    });
  }

  readonly _emitter = new EventEmitter<Query | null | undefined>();

  readonly onDidChangeTreeData: Event<Query | null | undefined> = this._emitter
    .event;

  _newQueries: Query[] = [];
  _cachedQueries: Query[] = [];

  newQuery(name: string, type: string, database: string) {
    const newQuery = new Query(undefined, name, type, undefined, database);
    this._newQueries.push(newQuery);
    this._emitter.fire(null);
    return newQuery;
  }

  refresh() {
    this._cachedQueries = [];
    this._emitter.fire(null);
  }

  async getChildren(element: Query | undefined): Promise<Query[]> {
    let queryList = this._cachedQueries;
    if (!this._cachedQueries.length) {
      const data = await this.dataProvider.fetchList();
      queryList = data.map(
        q => new Query(q.id, q.name, q.type, q.owner, q.database)
      );
      this._cachedQueries = queryList;
    }
    return this._newQueries.concat(queryList);
  }

  getTreeItem(element: Query): TreeItem {
    return element;
  }
}

/**
 * This defines the item in the sidebar.
 */
export class Query extends TreeItem {
  document: QueryDocument;

  // Name and Description displayed in the sidebar
  constructor(
    public id: string | undefined,
    public name: string,
    public type: string,
    public owner: string | undefined,
    public database: string
  ) {
    super(name, TreeItemCollapsibleState.None);
    this.document = new QueryDocument(
      Uri.parse(`tdQuery://hackathon/${name}.sql#${id}|${type}|${database}`), // URI
      name, // File name
      false, // Is closed?
      EndOfLine.CRLF, // Line ending type
      false, // Is dirty?
      false, // Is untitled?
      "sql", // Language ID
      1, // Line count
      1 // Version number
    );
  }

  // Hover tooltip in sidebar
  get tooltip(): string {
    return `ID: ${this.id}
Owner: ${this.owner}
Database: ${this.database}`;
  }

  // Used to conditionally enable commands such a Run query when the active item is of type tdQuery
  contextValue = "tdQuery";
}

export class QueryDocument implements TextDocument {
  constructor(
    public uri: Uri,
    public fileName: string,
    public isClosed: boolean,
    public eol: EndOfLine,
    public isDirty: boolean,
    public isUntitled: boolean,
    public languageId: string,
    public lineCount: number,
    public version: number
  ) {}

  async save(): Promise<boolean> {
    return false;
  }

  positionAt(offset: number): Position {
    return new Position(0, 0);
  }

  offsetAt(position: Position): number {
    return 0;
  }

  lineAt(positionOrNumber: Position | number): TextLine {
    return {
      text: "",
      lineNumber: 0,
      range: new Range(new Position(0, 0), new Position(0, 0)),
      rangeIncludingLineBreak: new Range(
        new Position(0, 0),
        new Position(0, 0)
      ),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: true
    };
  }

  validatePosition(position: Position): Position {
    return new Position(0, 0);
  }

  validateRange(range: Range): Range {
    return new Range(new Position(0, 0), new Position(0, 0));
  }

  getWordRangeAtPosition(
    position: Position,
    regex?: RegExp
  ): Range | undefined {
    return undefined;
  }

  getText(range?: Range): string {
    return "";
  }
}
