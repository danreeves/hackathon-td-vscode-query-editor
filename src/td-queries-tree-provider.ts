import {
  TreeDataProvider,
  TreeItem,
  TextDocument,
  Uri,
  EndOfLine,
  Position,
  TextLine,
  TreeItemCollapsibleState,
  Range
} from "vscode";
import { TDQueriesDataProvider } from "./td-query-data-provider";

/**
 * This is responsible for loading the queries to dusplay in the list
 */
export class TDQueriesTreeProvider implements TreeDataProvider<Query> {
  constructor(public dataProvider: TDQueriesDataProvider) {
    this.dataProvider = dataProvider;
  }

  async getChildren(element: Query | undefined): Promise<Query[]> {
    const data = await this.dataProvider.fetchList();
    const queryList = data.map(
      q => new Query(q.id, q.name, q.type, q.owner, q.database)
    );
    return queryList;
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
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly owner: string,
    public readonly database: string
  ) {
    super(name, TreeItemCollapsibleState.None);
    this.document = new QueryDocument(
      Uri.parse(`tdQuery://hackathon/${id}-${name}.sql`), // URI
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
    return `hello this is text
    
    aaaaaaaaaaaaaaaaaaaaaaaaaa
    affffffffffffffffffffffffffffffffffffffffffff
    bbbbbbbbb
    `;
  }
}
