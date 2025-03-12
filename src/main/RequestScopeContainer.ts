import { HttpRequest, ServerResponse, VerifableIOC, WebSocketInfo } from "../CommonTypes";
import { CorsService } from "../requestScopeService/CorsService";
import { Container } from "./Container";
import * as http from "http";
import { IOC } from "adv-ioc";
import { Logger } from "../utils/Logger";
import { ApiResolver } from "../api/ApiResolver";
import { JsonRpcServer } from "../api/JsonRpcServer";
import { ApiController } from "../controller/ApiController";
import { Scanner } from "adv-ioc/out/Scanner";
import path from "path";
import { AuthorizationDetector } from "../requestScopeService/AuthorizationDetector";
import { ResponseHeadersHolder } from "../requestScopeService/ResponseHeadersHolder";
import { HttpUtils } from "../utils/HttpUtils";
import { ConfigService } from "../service/ConfigService";
import { IpRateLimiterService } from "../requestScopeService/IpRateLimiterService";
import * as types from "../types";
import { AuthorizationHolder } from "../requestScopeService/AuthorizationHolder";

export type InterceptorScope = "websocket"|"http";
export interface Interceptor {
    run(): Promise<ServerResponse|void>|ServerResponse|void;
    interceptorScope: InterceptorScope[];
}

export class RequestScopeContainer extends IOC implements VerifableIOC {
    
    constructor(
        container: Container,
        request: HttpRequest,
        response: http.ServerResponse,
        webSocketInfo: WebSocketInfo|null,
    ) {
        super(container);
        this.registerValue("webSocketInfo", webSocketInfo);
        this.registerValue("request", request);
        this.registerValue("response", response);
        this.registerValue("ip", (webSocketInfo) ? webSocketInfo.ipAddress : HttpUtils.getIpAddress(request, this.resolve<ConfigService>("configService").values.ipAddressHeaderName));
        Scanner.registerToIoc(this, path.resolve(__dirname, "../requestScopeService/"));
        this.registerFactory("logger", (_parent: unknown, parentName: string|null) => {
            return new Logger(parentName || "");
        });
        this.registerValue("interceptors", [
            {run: () => this.resolve<AuthorizationDetector>("authorizationDetector").checkOrAssignAgentId(), interceptorScope: ["http"]},
            {run: () => this.resolve<AuthorizationDetector>("authorizationDetector").detectAuthorization(), interceptorScope: ["http"]},
            {run: () => this.resolve<AuthorizationDetector>("authorizationDetector").detectWebSocketAuthorization(), interceptorScope: ["websocket"]},
            {run: () => this.resolve<CorsService>("corsService").addCors(), interceptorScope: ["http"]},
            {
                run: async () => {
                    if (!await this.resolve<IpRateLimiterService>("ipRateLimiterService").canThisIpPerformRequest()) {
                        return {
                            status: 429,
                            body: "Too Many Requests",
                        };
                    }
                    return;
                },
                interceptorScope: ["websocket", "http"],
            },
        ]);
    }
    
    getRequest() {
        return this.resolve<HttpRequest>("request");
    }
    
    getResponse() {
        return this.resolve<http.ServerResponse>("response");
    }
    
    createApiController(scope: string) {
        return this.createEx(ApiController, {
            jsonRpcServer: this.createJsonRpcServer(scope),
        });
    }
    
    createJsonRpcServer(scope: string) {
        const apiResolver = this.resolve<ApiResolver<RequestScopeContainer>>("apiResolver");
        return this.createEx(JsonRpcServer, {executor: async (method: string, params: unknown, token?: types.core.AccessToken) => {
            if (token) {
                await this.getAuthorizationDetector().parseTokenAndTryAuthorizeAsGivenToken(token);
            }
            return await apiResolver.execute(scope, this, method, params, this.getIp(), this.getAuthorizationHolder());
        }});
    }
    
    getResponseHeadersHolder() {
        return this.resolve<ResponseHeadersHolder>("responseHeadersHolder");
    }
    
    getHttpInterceptors() {
        return this.resolve<Interceptor[]>("interceptors").filter(interceptor => interceptor.interceptorScope.includes("http"));
    }
    
    getWebSocketInterceptors() {
        return this.resolve<Interceptor[]>("interceptors").filter(interceptor => interceptor.interceptorScope.includes("websocket"));
    }
    
    getAuthorizationDetector() {
        return this.resolve<AuthorizationDetector>("authorizationDetector");
    }
    
    getListOfRegisteredServices() {
        return Object.keys(this.map);
    }
    
    getAuthorizationHolder() {
        return this.resolve<AuthorizationHolder>("authorizationHolder");
    }
    
    getIp() {
        return this.resolve<types.core.IpAddress>("ip");
    }
}
