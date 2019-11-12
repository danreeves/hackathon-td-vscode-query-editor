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

function dataFromUri(
  uri: Uri
): {
  id: string | undefined;
  name: string;
  type: string | undefined;
  databaseId: string | undefined;
} {
  const { fragment, path } = uri;
  const matches = fragment.split("|");
  const [id, type, databaseId] = matches.map(str =>
    str === "undefined" ? undefined : str
  );

  const name = path.replace(/^\//, "").replace(".sql", "");

  return { id, name, type, databaseId };
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
    console.log("READING", uri);
    const { id } = dataFromUri(uri);
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
    const { id, name, databaseId, type } = dataFromUri(uri);
    const decoder = new TextDecoder("utf-8");
    const queryString = decoder.decode(content);
    if (id) {
      this.dataProvider.patchQuery(id, {
        name,
        queryString,
        type,
        databaseId
      });
    } else {
      this.dataProvider.postQuery({
        name,
        queryString,
        type,
        databaseId
      });
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
