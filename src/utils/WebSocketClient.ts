// eslint-disable-next-line max-classes-per-file
import * as WebSocket from "ws";
import { PromiseUtils, Deferred } from "adv-promise";
import { JsonRpcRequest, JsonRpcResponse, JsonRpcSuccessResponse } from "../api/JsonRpcServer";
import { JsonRpcClient, JsonRpcException, JsonRpcRequestOptions } from "./JsonRpcClient";
import * as types from "../types";
export class WebSocketJsonRpcRequester {
    
    private lastId: number = 0;
    private requestMap: Map<string|number, {options: JsonRpcRequestOptions, defer: Deferred<unknown>}> = new Map();
    private notifications: types.notification.Event[] = [];
    
    constructor(private socket: WebSocket.WebSocket) {
        socket.on("message", data => this.handleMessage(data));
    }
    
    async request<T>(method: string, params: unknown) {
        if (this.socket.readyState !== 1) {
            throw new Error("Websocket already in closing/closed state");
        }
        const id = this.lastId++;
        const defer = PromiseUtils.defer<T>();
        this.requestMap.set(id, {
            options: {
                method,
                params,
                url: this.socket.url,
            },
            defer,
        });
        const request: JsonRpcRequest = {
            jsonrpc: "2.0",
            id,
            method,
            params,
        };
        this.socket.send(JSON.stringify(request));
        return defer.promise;
    }
    
    popAllNotifications() {
        const notifications = this.notifications;
        this.notifications = [];
        return notifications;
    }
    
    private handleMessage(data: WebSocket.RawData) {
        const payload = this.getWebSocketDataAsString(data);
        const response = JSON.parse(payload);
        if (!JsonRpcClient.isJsonRpcResponse(response) || response.id === undefined) {
            if (this.isNotification(response)) {
                this.notifications.push(response);
            }
            return;
        }
        const deferAndOptions = this.requestMap.get(response.id);
        if (!deferAndOptions) {
            return;
        }
        const {defer, options} = deferAndOptions;
        this.requestMap.delete(response.id);
        
        if (this.isJsonRpcSuccessResponse(response)) {
            defer.resolve(response.result);
        }
        else {
            defer.reject(new JsonRpcException({type: "json-rpc", cause: response.error}, options, null));
        };
    }
    
    private isNotification(x: any): x is types.notification.Event  {
        return x && typeof(x) === "object" && "type" in x && typeof(x.type) === "string" && "data" in x;
    }
    
    private isJsonRpcSuccessResponse(response: JsonRpcResponse): response is JsonRpcSuccessResponse {
        return "result" in response;
    }
    
    private getWebSocketDataAsString(data: WebSocket.RawData) {
        return Array.isArray(data) ? Buffer.concat(data).toString("utf8") : Buffer.from(data).toString("utf8");
    }
}
export class WebSocketClient {
    
    static connectToWs(url: string) {
        const ws = new WebSocket.WebSocket(url);
        const defer = PromiseUtils.defer<WebSocketJsonRpcRequester>();
        ws.on("open", () => {
            defer.resolve(new WebSocketJsonRpcRequester(ws));
        });
        ws.on("error", e => {
            defer.reject(e);
        });
        return defer.promise;
    }
}

