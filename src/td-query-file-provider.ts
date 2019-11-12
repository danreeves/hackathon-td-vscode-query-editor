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

// Globals that TypeScript doesn't like :)
declare var TextEncoder: any;
declare var TextDecoder: any;

/**
 * This is responsible for letting VS Code open the query as a file in the editor window
 */
export class TDQueriesFileProvider implements FileSystemProvider {
  readonly onDidChangeFile: Event<FileChangeEvent[]> = new EventEmitter<
    FileChangeEvent[]
  >().event;

  readFile(uri: Uri): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(`SELECT * FROM users
      WHERE id = 1`);
  }

  writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void {
    const decoder = new TextDecoder("utf-8");
    console.log(
      "TDQueriesFileProvider writeFile",
      uri.path,
      decoder.decode(content)
    );
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
