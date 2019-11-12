import { EventEmitter, Event } from "vscode";
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
  databaseName: string;
  databaseId: string;
  type: string;
  owner: string;
}

function responseToQuery(data: ApiQuery): Query {
  const { id, name, type } = data;
  const owner = (data && data.user && data.user.name) || "";
  const databaseName = (data && data.database && data.database.name) || "";
  const databaseId = (data && data.database && data.database.id) || "";
  return {
    id,
    name,
    type,
    owner,
    databaseName,
    databaseId
  };
}

export class TDQueriesDataProvider {
  apiKey: string | undefined;
  queries: Query[] = [];
  emitter: EventEmitter<{ type: string; data: ApiQuery }>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.emitter = new EventEmitter();
  }

  _get(path: string): Promise<Response> {
    console.log("GET", path);
    return fetch(`https://console-development.treasuredata.com${path}`, {
      method: "GET",
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }

  _patch(path: string, body: Object): Promise<Response> {
    console.log("PATCH", path, JSON.stringify(body));
    return fetch(`https://console-development.treasuredata.com${path}`, {
      method: "PATCH",
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8",
        "key-format": "camelCase"
      },
      body: JSON.stringify(body)
    });
  }

  _post(path: string, body: Object): Promise<Response> {
    console.log("POST", path, JSON.stringify(body));
    return fetch(`https://console-development.treasuredata.com${path}`, {
      method: "POST",
      headers: {
        Authorization: "TD1 " + this.apiKey,
        "Content-Type": "application/json; charset=utf-8",
        "key-format": "camelCase"
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
    const d = await response.json();
    console.log(d);
    return false;
  }

  async postQuery(body: Object): Promise<boolean> {
    const response = await this._post(`/v4/queries`, body);
    const data = await response.json();
    if (response.ok) {
      this.emitter.fire({ type: "saved", data });
      return true;
    }
    return false;
  }

  async runQuery(body: any): Promise<boolean> {
    const { id } = body;
    const response = await this._post(`/v4/queries/${id}/jobs`, body);
    const data = await response.json();
    console.log("JOB RESPONSE", data);
    if (response.ok) {
      return true;
    }
    return false;
  }
}
