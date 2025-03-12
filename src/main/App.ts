import * as http from "http";
import { RequestScopeContainerFactory } from "./RequestScopeContainerFactory";
import { Logger } from "../utils/Logger";
import { Utils } from "../utils/Utils";
import { HttpRequest, ServerResponse, WebSocketExtended } from "../CommonTypes";
import { Crypto } from "../utils/Crypto";
import { RequestScopeContainer } from "./RequestScopeContainer";
import * as terminus from "@godaddy/terminus";
import { ConfigService } from "../service/ConfigService";
import { EventReporter } from "../service/EventReporter";
import { Router } from "./Router";
import { JobService } from "../service/JobService";
import { MongoDbManager } from "../db/MongoDbManager";
import * as WebSocket from "ws";
import { DateUtils } from "../utils/DateUtils";
import { WebSocketInnerManager } from "../cluster/worker/WebSocketInnerManager";
import * as types from "../types";
import { HttpUtils } from "../utils/HttpUtils";
import { WebSocketHandler } from "./WebSocketHandler";
import { HttpClientError } from "../api/HttpError";
import { RegistrationService } from "../service/RegistrationService";
export class App {
    
    private httpServer: http.Server;
    
    constructor(
        private requestScopeContainerFactory: RequestScopeContainerFactory,
        private logger: Logger,
        private configService: ConfigService,
        private eventReporter: EventReporter,
        private router: Router,
        private jobService: JobService,
        private dbManager: MongoDbManager,
        private webSocketInnerManager: WebSocketInnerManager,
        private webSocketHandler: WebSocketHandler,
        private registrationService: RegistrationService,
    ) {
        this.httpServer = http.createServer((req, res) => {
            Utils.callAsyncSafely(async () => {
                const eReq = this.enrichRequest(req);
                try {
                    const requestContainer = this.requestScopeContainerFactory.createRequestScopeContainer(eReq, res, null);
                    const interceptors = requestContainer.getHttpInterceptors();
                    for (const interceptor of interceptors) {
                        const interceptorResult = await interceptor.run();
                        if (interceptorResult) {
                            this.applyResult(res, interceptorResult, requestContainer);
                            return;
                        }
                    }
                    const result = await this.router.processRequest(requestContainer);
                    this.applyResult(res, result, requestContainer);
                }
                catch (e) {
                    if (e instanceof HttpClientError) {
                        this.applyHttpError(res, e);
                        return;
                    }
                    this.eventReporter.reportError(eReq.rayId, e, eReq.url);
                    res.writeHead(500);
                    res.end("500 Internal server error");
                }
            });
        });
    }
    
    init() {
        this.httpServer.listen(this.configService.values.port, this.configService.values.host, () => {
            this.logger.log(`Server is running on http://${this.configService.values.host}:${this.configService.values.port}`);
        });
        this.setUpTerminus();
        this.setUpWebsocketServers();
        this.setUpAdmin();
    }
    
    private enrichRequest(req: http.IncomingMessage) {
        const newReq = req as HttpRequest;
        newReq.rayId = Crypto.randomBytes(20).toString("hex");
        return newReq;
    }
    
    private applyHttpError(res: http.ServerResponse<http.IncomingMessage>, error: HttpClientError) {
        res.writeHead(error.status);
        res.end(error.data);
    }
    
    private applyResult(res: http.ServerResponse<http.IncomingMessage>, result: ServerResponse, requestContainer: RequestScopeContainer) {
        if (result.body === true) {
            return;
        }
        res.writeHead(result.status || 200, {
            ...requestContainer.getResponseHeadersHolder().getResponseHeaders(),
            ...(result.headers || {}),
        });
        res.end(result.body);
    }
    
    private setUpWebsocketServers() {
        const mainWss = new WebSocket.Server({noServer: true});
        
        mainWss.on("connection", (ws: WebSocketExtended, request: HttpRequest, ipAddress: types.core.IpAddress) => {
            this.webSocketHandler.onWebSocketConnection(ws, request, ipAddress, "client");
        });
        
        this.httpServer.on("upgrade", (request, socket, head) => {
            const eReq = this.enrichRequest(request);
            mainWss.handleUpgrade(request, socket, head, connection => {
                mainWss.emit("connection", connection, eReq, HttpUtils.getIpAddress(eReq, this.configService.values.ipAddressHeaderName));
            });
        });
        
        this.webSocketInnerManager.registerServer(mainWss);
        this.jobService.addPeriodicJob(
            () => WebSocketHandler.pingWebSocketServerClients(mainWss),
            DateUtils.getSeconds(10),
            "wsAliveRefresher",
        );
    }
    
    private setUpTerminus() {
        const shutdownTimeout = this.configService.values.shutdownTimeout;
        terminus.createTerminus(this.httpServer, {
            signals: ["SIGINT", "SIGTERM"],
            timeout: shutdownTimeout,
            healthChecks: {
                "/health": async () => {
                    return;
                },
                "/ready": async () => {
                    return;
                },
            },
            beforeShutdown: async () => {
                this.logger.log(`Shuting down - waiting max ${shutdownTimeout}ms to finish requests...`);
            },
            onSignal: async () => {
                await this.tryClose();
            },
            onShutdown: async () => {
                this.logger.log("Server gracefully turned off!");
            },
        });
    }
    
    private async tryClose() {
        this.logger.log("Closing db connections...");
        try {
            this.jobService.clearAllJobs();
            await this.dbManager.close();
        }
        catch (e) {
            this.logger.error("Error during closing mongo connection", e);
        }
        this.httpServer.close();
    }
    
    private setUpAdmin() {
        void (async () => {
            try {
                const count = await this.registrationService.getUsersCount();
                if (count === 0) {
                    await this.registrationService.createUser({
                        email: "ad@m.in" as types.core.LEmail,
                        credentials: "admin01" as types.core.PlainPassword,
                        activated: true,
                        // isAdmin: true,
                    });
                }
            }
            catch (e) {
                this.logger.error("Error during creating admin", e);
            }
        })();
    }
    
}