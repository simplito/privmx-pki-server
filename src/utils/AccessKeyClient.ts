/* eslint-disable max-classes-per-file */

import { Crypto } from "./Crypto";
import { DateUtils } from "./DateUtils";
import { HttpClient, RequestHeaders } from "./HttpClient";
import { JsonRpcClient, JsonRpcRequestOptions } from "./JsonRpcClient";
import { Utils } from "./Utils";

export interface RequestOptions {
    url: string;
    body: Buffer;
    headers?: {[name: string]: string|string[]};
}

export class AccessKeyClient {
    
    static async request(accessPubKey: string, accessKeySecret: string, options: RequestOptions) {
        const timestamp = DateUtils.now();
        const nonce = Crypto.randomBytes(32).toString("base64");
        const dataToSign = Buffer.concat([Buffer.from(`${accessPubKey};1;${timestamp};${nonce};${accessKeySecret};`, "utf8"), options.body]);
        const signature = Crypto.sha256(Buffer.from(dataToSign)).subarray(0, 20).toString("base64");
        const signatureHeader = `${accessPubKey};1;${timestamp};${nonce};${signature}`;
        const request = {
            method: "POST",
            url: options.url,
            body: options.body,
            headers: {
                ...(options.headers || {}),
                "Content-Type": "application/json",
                "X-Access-Sig": signatureHeader,
            },
        };
        return HttpClient.request(request);
    }
}

export class AccessKeyJsonRpcClient {
    
    constructor(
        private url: string,
        private headers: RequestHeaders,
        private accessPubKey: string,
        private accessKeySecret: string,
    ) {
    }
    
    requestFull<T>(method: string, params: unknown) {
        return AccessKeyJsonRpcClient.requestFull<T>(this.accessPubKey, this.accessKeySecret, {url: this.url, method, params, headers: this.headers});
    }
    
    request<T>(method: string, params: unknown) {
        return AccessKeyJsonRpcClient.request<T>(this.accessPubKey, this.accessKeySecret, {url: this.url, method, params, headers: this.headers});
    }
    
    static async requestFull<T>(accessPubKey: string, accessKeySecret: string, options: JsonRpcRequestOptions) {
        const body = JsonRpcClient.createJsonRpcRequestBody(options.method, options.params);
        const httpResponse = await Utils.tryPromise(() => AccessKeyClient.request(accessPubKey, accessKeySecret, {url: options.url, body: body, headers: options.headers}));
        return JsonRpcClient.processHttpResponse<T>(httpResponse, options);
    }
    
    static async request<T>(accessPubKey: string, accessKeySecret: string, options: JsonRpcRequestOptions) {
        const payload = await AccessKeyJsonRpcClient.requestFull<T>(accessPubKey, accessKeySecret, options);
        return payload.result;
    }
}
