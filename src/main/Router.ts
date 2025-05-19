import { HttpRequest, ServerResponse } from "../CommonTypes";
import { ConfigService } from "../service/ConfigService";
import { serveAssets } from "./Assets";
import { RequestScopeContainer } from "./RequestScopeContainer";

export class Router {
    
    private allowedPaths = [
        "/assets",
        "/docs",
        "/tsdocs",
    ];
    
    constructor(
       private configService: ConfigService,
    ) {
    }
    
    async processRequest(requestContainer: RequestScopeContainer): Promise<ServerResponse> {
        const req = requestContainer.getRequest();
        if (req.url === "/main") {
            return requestContainer.createApiController("client").jsonRpcProcessRequest();
        }
        if (req.url === "/mgm") {
            return requestContainer.createApiController("mgm").jsonRpcProcessRequest();
        }
        if (req.method === "GET" && (req.url === "/main/tester")) {
            return requestContainer.createApiController("client").testApi();
        }
        if (req.method === "GET" && req.url === "/" && this.configService.values.redirectToDocs) {
            return {status: 302, body: "", headers: {"Location": "/docs/"}};
        }
        if (req.method === "GET" && req.url === "/docs") {
            return {status: 302, body: "", headers: {"Location": "/docs/"}};
        }
        if (req.method === "GET" && this.isAssetsRequest(req)) {
            return serveAssets(this.configService.values.publicDir, req, requestContainer.getResponse());
        }
        return {status: 404, body: "404 Not found"};
    }
    
    private isAssetsRequest(req: HttpRequest) {
        return req.url === "/" || req.url === "/favicon.ico" || req.url === "/changelog.html" || this.allowedPaths.some(x => req.url && req.url.startsWith(x));
    }
}
