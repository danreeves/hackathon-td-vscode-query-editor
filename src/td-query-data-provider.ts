import { EventEmitter } from "vscode";
import fetch, { Response } from "node-fetch";

interface ApiQuery {
  id: string;
  name: string;
  database: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
  type: string;
  updated_at: string;
}

interface Query {
  id: string;
  name: string;
  database: string;
  type: string;
  owner: string;
}

function responseToQuery(data: ApiQuery): Query {
  const { id, name, type } = data;
  const owner = (data && data.user && data.user.name) || "";
  const database = (data && data.database && data.database.name) || "";
  return {
    id,
    name,
    type,
    owner,
    database
  };
}

export class TDQueriesDataProvider {
  apiKey: string | undefined;
  queries: Query[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  _get(path: string): Promise<Response> {
    return fetch(`https://console-development.treasuredata.com${path}`, {
      method: "GET",
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  _patch(path: string, body: Object): Promise<Response> {
    return fetch(`https://console-development.treasuredata.com${path}`, {
      method: "PATCH",
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(body)
    });
  }

  async fetchList(): Promise<Query[]> {
    const response = await this._get("/v4/queries?minimalConnectorConfig=true");
    const data = await response.json();
    return data
      .sort((a: ApiQuery, b: ApiQuery) =>
        Date.parse(a.updated_at) > Date.parse(b.updated_at) ? -1 : 1
      )
      .map(responseToQuery);
  }

  async fetchQuery(id: string): Promise<string> {
    const response = await this._get(`/v4/queries/${id}`);
    const data = await response.json();
    return data.query_string;
  }

  async patchQuery(id: string, patch: Object): Promise<boolean> {
    const response = await this._patch(`/v4/queries/${id}`, patch);
    if (response.ok) {
      return true;
    }
    return false;
  }
}
