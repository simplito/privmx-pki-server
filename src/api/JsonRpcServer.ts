import { API_ERROR_CODES, AppException } from "./AppException";
import { HttpUtils } from "../utils/HttpUtils";
import { Utils } from "../utils/Utils";
import { HttpRequest } from "../CommonTypes";
import { EventReporter } from "../service/EventReporter";
import { HttpClientError } from "./HttpError";
import * as types from "../types";
import { SecondFactorRequired } from "./SecondFactorRequired";

export type ApiExecutor = (method: string, params: unknown, token?: string) => unknown;

export interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: JsonRpcId;
    method: string;
    params: unknown;
    token?: types.core.AccessToken;
}
export type JsonRpcId = string|number;
export type JsonRpcResponse = JsonRpcSuccessResponse|JsonRpcErrorResponse;
export interface JsonRpcSuccessResponse {
    jsonrpc: "2.0";
    id?: JsonRpcId;
    result: unknown;
}
export interface JsonRpcErrorResponse {
    jsonrpc: "2.0";
    id?: JsonRpcId;
    error: JsonRpcError;
}
export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

export class JsonRpcServer {
    
    constructor(
        private executor: ApiExecutor,
        private eventReporter: EventReporter,
    ) {
    }
    
    async processRequest(req: HttpRequest): Promise<JsonRpcResponse> {
        if (req.method !== "POST") {
            const error = API_ERROR_CODES.ONLY_POST_METHOD_ALLOWED;
            return {jsonrpc: "2.0", id: 0, error: error};
        }
        return this.withJsonRpcProccessor(req.rayId, async requestInfoHolder => {
            if (req.headers["content-type"] !== "application/json") {
                throw new AppException("PARSE_ERROR", "Invalid Content-Type");
            }
            const body = await HttpUtils.readBody(req);
            return this.processBuffer(requestInfoHolder, body);
        });
    }
    
    async processMessage(message: Buffer): Promise<JsonRpcResponse> {
        return this.withJsonRpcProccessor("WebSocket", requestInfoHolder => {
            return this.processBuffer(requestInfoHolder, message);
        });
    }
    
    async withJsonRpcProccessor(rayId: string, processor: (requestInfoHolder: {id?: unknown, method?: string}) => Promise<unknown>): Promise<JsonRpcResponse> {
        const requestInfoHolder: {id?: JsonRpcId, method?: string} = {};
        try {
            const result = await processor(requestInfoHolder);
            this.eventReporter.reportSuccessfulApiRequest(requestInfoHolder.method);
            return {jsonrpc: "2.0", id: requestInfoHolder.id, result: result};
        }
        catch (e) {
            if (e instanceof SecondFactorRequired) {
                this.eventReporter.report2FARequiredApiRequest(requestInfoHolder.method);
                return {jsonrpc: "2.0", id: requestInfoHolder.id, result: e.challenge};
            }
            this.eventReporter.reportUnsuccessfulApiRequest(rayId, e, requestInfoHolder.method);
            if (e instanceof HttpClientError) {
                throw e;
            }
            const error: JsonRpcError = e instanceof AppException ?
                {code: e.code, message: e.message, data: e.data} :
                API_ERROR_CODES.INTERNAL_ERROR;
            return {jsonrpc: "2.0", id: requestInfoHolder.id, error: error};
        }
    }
    
    private async processBuffer(requestInfoHolder: {id?: unknown, method?: string}, buf: Buffer) {
        const parseResult =  Utils.try(() => JSON.parse(buf.toString("utf8")));
        if (parseResult.success === false) {
            throw new AppException("PARSE_ERROR");
        }
        const jReq = parseResult.result;
        if (!this.isJsonRpcRequest(jReq)) {
            throw new AppException("INVALID_REQUEST");
        }
        requestInfoHolder.id = jReq.id;
        requestInfoHolder.method = jReq.method;
        return this.executor(jReq.method, jReq.params, jReq.token);
    }
    
    private isJsonRpcRequest(x: any): x is JsonRpcRequest {
        return x && typeof(x) === "object" &&
            "jsonrpc" in x && x.jsonrpc === "2.0" &&
            "id" in x && (typeof(x.id) === "string" || typeof(x.id) === "number") &&
            "method" in x && typeof(x.method) === "string" &&
            "params" in x;
    }
}
