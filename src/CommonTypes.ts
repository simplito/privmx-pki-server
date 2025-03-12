import * as http from "http";
import * as types from "./types";
import WebSocket from "ws";
import { OAuth2AccessToken } from "./types/auth";
import { TokenSessionInfo } from "./db/Model";
import type { IOC } from "adv-ioc";
export interface PerNameValidator {
    validate(name: string, data: any): void;
}

export interface Requester {
    request<T>(method: string, params: unknown): Promise<T>;
}

export type Dictionary = {[key: string]: any};

export interface ServerResponse {
    status?: number;
    headers?: http.OutgoingHttpHeaders;
    body: string|Buffer|true;
}

export type WebsocketAuthorizationInfo = OAuth2AccessToken;

export interface WebSocketInfo {
    connectionId: types.core.ConnectionId;
    authorization?: OAuth2AccessToken;
    ipAddress: types.core.IpAddress;
    isAlive: boolean;
    channels: types.core.ChannelName[];
    tokenInfo?: TokenSessionInfo;
};

export interface WebSocketExtended extends WebSocket {
    additionalSocketInfo: WebSocketInfo;
}

export type HttpRequest = http.IncomingMessage&{rayId: string};

export interface VerifableIOC extends IOC {
    getListOfRegisteredServices(): string[];
}
