import { HttpRequest, WebSocketExtended } from "../CommonTypes";
import { Logger } from "../utils/Logger";
import { RequestScopeContainerFactory } from "./RequestScopeContainerFactory";
import * as types from "../types";
import * as http from "http";
import * as WebSocket from "ws";
import { Crypto } from "../utils/Crypto";
import { Hex } from "../utils/Hex";

export class WebSocketHandler {
    
    constructor(
        private logger: Logger,
        private requestScopeContainerFactory: RequestScopeContainerFactory,
    ) {}
    
    onWebSocketConnection(socket: WebSocketExtended, request: HttpRequest,  ipAddress: types.core.IpAddress, scope: string) {
        this.logger.log("WebSocket connected");
        const connectionId = this.generateId();
        socket.additionalSocketInfo = {
            connectionId,
            ipAddress,
            isAlive: true,
            channels: [],
        };
        socket.on("pong", () => {
            socket.additionalSocketInfo.isAlive = true;
        });
        socket.on("message", message => {
            socket.additionalSocketInfo.isAlive = true;
            if (!Buffer.isBuffer(message)) {
                this.logger.error("Websocket error: not binary message");
                return;
            }
            
            void (async () => {
                const messageScopeContainer = this.requestScopeContainerFactory.createRequestScopeContainer(request, {} as http.ServerResponse, socket.additionalSocketInfo);
                const interceptors = messageScopeContainer.getWebSocketInterceptors();
                for (const interceptor of interceptors) {
                    const interceptorResult = await interceptor.run();
                    if (interceptorResult) {
                        socket.close(1008, interceptorResult.body.toString());
                        return;
                    }
                }
                const response = await messageScopeContainer.createApiController(scope).jsonRpcProcessMessage(message);
                socket.send(JSON.stringify(response));
            })();
        });
        socket.on("error", e => {
            this.logger.error(e.message + " " + (<any>e).code);
        });
    }
    
    static pingWebSocketServerClients(webSocketServer: WebSocket.WebSocketServer) {
        webSocketServer.clients.forEach((ws: WebSocket.WebSocket) => {
            if (!(<WebSocketExtended>ws).additionalSocketInfo.isAlive) {
                ws.terminate();
                return;
            }
            (<WebSocketExtended>ws).additionalSocketInfo.isAlive = false;
            ws.ping();
        });
    }
    
    private generateId() {
        return Hex.buf2Hex(Crypto.randomBytes(32)) as string as types.core.ConnectionId;
    }
}
