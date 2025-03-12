/* eslint-disable max-classes-per-file */

import { Crypto } from "./Crypto";
import { DateUtils } from "./DateUtils";
import { HttpClient, RequestHeaders, RequestResponse } from "./HttpClient";
import { JsonRpcClient, JsonRpcRequestOptions } from "./JsonRpcClient";
import { RequestSignature } from "./RequestSignature";
import { Utils } from "./Utils";
import * as types from "../types";

export interface RequestOptions {
    url: string;
    body: Buffer;
    headers?: {[name: string]: string|string[]};
}

export class ClientSignatureClient {
    
    static async requestHmac(clientId: string, clientSecret: string, options: RequestOptions) {
        const httpMethod = "POST";
        const timestamp = DateUtils.now();
        const nonce = Crypto.randomBytes(32).toString("base64");
        const urlObj = new URL(options.url);
        const signatureHeader = RequestSignature.signHmacToHeader({
            clientId: clientId as types.auth.ClientId,
            clientSecret: clientSecret as types.auth.ClientSecret,
            httpMethod: httpMethod,
            nonce: nonce,
            timestamp: timestamp,
            urlPath: urlObj.pathname,
            requestBody: options.body,
        });
        const request = {
            method: httpMethod,
            url: options.url,
            body: options.body,
            headers: {
                ...(options.headers || {}),
                "Content-Type": "application/json",
                "Authorization": `${RequestSignature.PMX_HMAC_SHA256} ${signatureHeader}`,
            },
        };
        return HttpClient.request(request);
    }
    
    static async requestEddsa(clientId: string, clientPrivKey: string, options: RequestOptions) {
        const httpMethod = "POST";
        const timestamp = DateUtils.now();
        const nonce = Crypto.randomBytes(32).toString("base64");
        const urlObj = new URL(options.url);
        const signatureHeader = RequestSignature.signEddsaToHeader({
            clientId: clientId as types.auth.ClientId,
            clientPrivKey: clientPrivKey,
            httpMethod: httpMethod,
            nonce: nonce,
            timestamp: timestamp,
            urlPath: urlObj.pathname,
            requestBody: options.body,
        });
        const request = {
            method: httpMethod,
            url: options.url,
            body: options.body,
            headers: {
                ...(options.headers || {}),
                "Content-Type": "application/json",
                "Authorization": `${RequestSignature.PMX_HMAC_SHA256} ${signatureHeader}`,
            },
        };
        return HttpClient.request(request);
    }
}

export class ClientSignatureJsonRpcClient {
    
    constructor(
        private url: string,
        private headers: RequestHeaders,
        private clientId: string,
        private clientSecret: string,
        private algorithm: "hmac"|"eddsa",
    ) {
    }
    
    requestFull<T>(method: string, params: unknown) {
        if (this.algorithm === "hmac") {
            return ClientSignatureJsonRpcClient.requestHmacFull<T>(this.clientId, this.clientSecret, {url: this.url, method, params, headers: this.headers});
        }
        return ClientSignatureJsonRpcClient.requestEddsaFull<T>(this.clientId, this.clientSecret, {url: this.url, method, params, headers: this.headers});
    }
    
    request<T>(method: string, params: unknown) {
        if (this.algorithm === "hmac") {
            return ClientSignatureJsonRpcClient.requestHmac<T>(this.clientId, this.clientSecret, {url: this.url, method, params, headers: this.headers});
        }
        return ClientSignatureJsonRpcClient.requestEddsa<T>(this.clientId, this.clientSecret, {url: this.url, method, params, headers: this.headers});
    }
    
    static async requestHmacFull<T>(clientId: string, clientSecret: string, options: JsonRpcRequestOptions) {
        return await ClientSignatureJsonRpcClient.requestFull<T>(clientId, clientSecret, options, ClientSignatureClient.requestHmac);
    }
    
    static async requestEddsaFull<T>(clientId: string, clientPrivKey: string, options: JsonRpcRequestOptions) {
        return await ClientSignatureJsonRpcClient.requestFull<T>(clientId, clientPrivKey, options, ClientSignatureClient.requestEddsa);
    }
    
    static async requestHmac<T>(clientId: string, clientSecret: string, options: JsonRpcRequestOptions) {
        const payload = await ClientSignatureJsonRpcClient.requestHmacFull<T>(clientId, clientSecret, options);
        return payload.result;
    }
    
    static async requestEddsa<T>(clientId: string, clientPrivKey: string, options: JsonRpcRequestOptions) {
        const payload =  await ClientSignatureJsonRpcClient.requestEddsaFull<T>(clientId, clientPrivKey, options);
        return payload.result;
    }
    
    static async requestFull<T>(clientId: string, clientPrivKey: string, options: JsonRpcRequestOptions, request: (clientId: string, clientSecret: string, options: RequestOptions) => Promise<RequestResponse>) {
        const body = JsonRpcClient.createJsonRpcRequestBody(options.method, options.params);
        const httpResponse = await Utils.tryPromise(() => request(clientId, clientPrivKey, {url: options.url, body: body, headers: options.headers}));
        return JsonRpcClient.processHttpResponse<T>(httpResponse, options);
    }
}
