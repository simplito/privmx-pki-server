import { HttpRequest, ServerResponse } from "../CommonTypes";
import { HttpUtils } from "../utils/HttpUtils";
import { ConfigService } from "../service/ConfigService";
import { ResponseHeadersHolder } from "./ResponseHeadersHolder";

export class CorsService {
    
    constructor(
        private request: HttpRequest,
        private configService: ConfigService,
        private responseHeadersHolder: ResponseHeadersHolder,
    ) {
    }
    
    addCors(): ServerResponse|void {
        const corsCfg = this.configService.values.cors;
        if (!corsCfg.enabled) {
            return this.onFailedCors();
        }
        const origin = HttpUtils.getFirstHeaderValue(this.request, "origin");
        if (!origin) {
            return this.onFailedCors();
        }
        const allowAll = corsCfg.origins.includes("*");
        if (!corsCfg.origins.includes(origin) && !allowAll) {
            return this.onFailedCors();
        }
        this.responseHeadersHolder.addResponseHeader("Access-Control-Allow-Origin", allowAll ? "*" : origin);
        this.responseHeadersHolder.addResponseHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
        this.responseHeadersHolder.addResponseHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With, X-User-Token, X-Auth-Token, X-Access-Sig");
        return this.onSuccessfullCors();
    }
    
    private onSuccessfullCors(): ServerResponse|void {
        if (this.request.method === "OPTIONS") {
            return {status: 204, body: ""};
        }
    }
    
    private onFailedCors(): ServerResponse|void {
        if (this.request.method === "OPTIONS") {
            return {status: 403, body: "403 Forbidden"};
        }
    }
}
