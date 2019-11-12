import {
  Uri,
  FileSystemProvider,
  Event,
  FileChangeEvent,
  EventEmitter,
  Disposable,
  FileStat,
  FileType
} from "vscode";
import { TDQueriesDataProvider } from "./td-query-data-provider";

// Globals that TypeScript doesn't like :)
declare var TextEncoder: any;
declare var TextDecoder: any;

const ID_FROM_PATH_REGEX = /\/(\d+)/;

function idFromUri(uri: Uri): string | undefined {
  const { path } = uri;
  const matches = path.match(ID_FROM_PATH_REGEX);
  if (!matches) {
    return undefined;
  }
  const [_, id] = matches;
  return id;
}

/**
 * This is responsible for letting VS Code open the query as a file in the editor window
 */
export class TDQueriesFileProvider implements FileSystemProvider {
  readonly onDidChangeFile: Event<FileChangeEvent[]> = new EventEmitter<
    FileChangeEvent[]
  >().event;

  constructor(public dataProvider: TDQueriesDataProvider) {
    this.dataProvider = dataProvider;
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    const id = idFromUri(uri);
    let contents = "";
    if (id) {
      contents = await this.dataProvider.fetchQuery(id);
    }
    const encoder = new TextEncoder();
    return encoder.encode(contents);
  }

  writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void {
    const id = idFromUri(uri);
    const decoder = new TextDecoder("utf-8");
    const query_string = decoder.decode(content);
    if (id) {
      this.dataProvider.patchQuery(id, { query_string });
    }
  }

  delete(uri: Uri): void {
    console.log("TDQueriesFileProvider delete");
  }

  rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }): void {
    console.log("TDQueriesFileProvider rename");
  }

  // // // // // // // // // // // // //
  // Ignore all the methods after this
  // // // // // // // // // // // // //

  stat(uri: Uri): QueryFileStat {
    return new QueryFileStat(uri.path);
  }

  readDirectory(): [string, FileType][] {
    return [];
  }

  createDirectory() {
    // Unimplemented
  }

  watch(uri: Uri): Disposable {
    // ignore, fires for all changes...
    return new Disposable(() => {});
  }
}

/**
 * Not really used for anything
 */
export class QueryFileStat implements FileStat {
  type: FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  data?: Uint8Array;

  constructor(name: string) {
    this.type = FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}
