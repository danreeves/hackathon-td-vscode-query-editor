import { EventEmitter } from "vscode";
import fetch, { Response } from "node-fetch";

interface Query {
  id: string;
  name: string;
  database: string;
  type: string;
  owner: string;
}

function responseToQuery(data: any): Query {
  const { id, name, type } = data;
  const owner = data && data.user && data.user.name;
  const database = data && data.database && data.database.name;
  return {
    id,
    name,
    type,
    owner,
    database
  };
}

export class TDQueriesDataProvider {
  _emitter = new EventEmitter();
  apiKey: string | undefined;
  queries: Query[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  _get(path: string): Promise<Response> {
    return fetch(`https://console-development.treasuredata.com${path}`, {
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  async fetchList(): Promise<Query[]> {
    const response = await this._get("/v4/queries?minimalConnectorConfig=true");
    const data = await response.json();
    return data.map(responseToQuery);
  }

  async fetchQuery(id: string): Promise<string> {
    const response = await this._get(`/v4/queries/${id}`);
    const data = await response.json();
    return data.query_string;
  }
}
