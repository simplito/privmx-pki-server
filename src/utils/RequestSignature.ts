import { Crypto } from "./Crypto";
import * as types from "../types";
import { HttpRequest } from "../CommonTypes";
import * as db from "../db/Model";

export interface BaseParams {
    clientId: types.auth.ClientId;
    timestamp: number;
    nonce: string;
    httpMethod: string;
    urlPath: string;
    requestBody: Buffer;
}

export interface HmacSignParams extends BaseParams {
    clientSecret: types.auth.ClientSecret;
}

export interface HmacVerifyParams extends HmacSignParams {
    signature: string;
}

export interface EddsaSignParams extends BaseParams {
    clientPrivKey: string;
}

export interface EddsaVerifyParams extends BaseParams {
    publicKey: types.core.PubKey;
    signature: string;
}

export interface SignatureInfo {
    clientId: types.auth.ClientId;
    version: string;
    timestamp: number;
    nonce: string;
    signature: string;
}

export class RequestSignature {
    
    static readonly PMX_HMAC_SHA256 = "pmx-hmac-sha256";
    
    static verify({request, apiKey, nonce, timestamp, signature, requestBody}: {request: HttpRequest|null, apiKey: db.ApiKey, nonce: string, timestamp: number, signature: string, requestBody: Buffer}) {
        if (apiKey.publicKey) {
            return RequestSignature.verifyEddsa({
                clientId: apiKey._id,
                httpMethod: request?.method || "",
                nonce: nonce,
                timestamp: timestamp,
                requestBody: requestBody,
                urlPath: request?.url || "",
                publicKey: apiKey.publicKey,
                signature: signature,
            });
        }
        return RequestSignature.verifyHmac({
            clientId: apiKey._id,
            httpMethod: request?.method || "",
            nonce: nonce,
            timestamp: timestamp,
            requestBody: requestBody,
            urlPath: request?.url || "",
            clientSecret: apiKey.clientSecret,
            signature: signature,
        });
    }
    
    static signHmac(params: HmacSignParams) {
        const dataToSign = RequestSignature.buildRequestSignatureData(params.timestamp, params.nonce, params.httpMethod, params.urlPath, params.requestBody);
        return Crypto.hmacSha256(Buffer.from(params.clientSecret, "utf8"), dataToSign).subarray(0, 20).toString("base64");
    }
    
    static signHmacToHeader(params: HmacSignParams) {
        const signature = RequestSignature.signHmac(params);
        return RequestSignature.createHeader({
            clientId: params.clientId,
            version: "1",
            timestamp: params.timestamp,
            nonce: params.nonce,
            signature: signature,
        });
    }
    
    static verifyHmac(params: HmacVerifyParams) {
        return RequestSignature.signHmac(params) === params.signature;
    }
    
    static signEddsa(params: EddsaSignParams) {
        const dataToSign = RequestSignature.buildRequestSignatureData(params.timestamp, params.nonce, params.httpMethod, params.urlPath, params.requestBody);
        return Crypto.sign(dataToSign, params.clientPrivKey).toString("base64");
    }
    
    static signEddsaToHeader(params: EddsaSignParams) {
        const signature = RequestSignature.signEddsa(params);
        return RequestSignature.createHeader({
            clientId: params.clientId,
            version: "1",
            timestamp: params.timestamp,
            nonce: params.nonce,
            signature: signature,
        });
    }
    
    static verifyEddsa(params: EddsaVerifyParams) {
        const dataToVerify = RequestSignature.buildRequestSignatureData(params.timestamp, params.nonce, params.httpMethod, params.urlPath, params.requestBody);
        return Crypto.verifySignature(dataToVerify, params.publicKey, Buffer.from(params.signature, "base64"));
    }
    
    static createHeader(info: SignatureInfo) {
        return `${info.clientId};1;${info.timestamp};${info.nonce};${info.signature}`;
    }
    
    static parseHeader(value: string): false|SignatureInfo {
        const values = value.split(";");
        if (values.length !== 5) {
            return false;
        }
        const [clientId, version, timestampStr, nonce, signature] = values;
        if (!clientId || !version || !timestampStr || !nonce || !signature) {
            return false;
        }
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp)) {
            return false;
        }
        return {clientId: clientId as types.auth.ClientId, version, timestamp, nonce, signature};
    }
    
    static buildRequestSignatureData(timestamp: number, nonce: string, httpMethod: string, urlPath: string, requestBody: Buffer) {
        const requestData = Buffer.concat([Buffer.from(`${httpMethod.toUpperCase()}\n${urlPath}\n`, "utf8"), requestBody, Buffer.from("\n", "utf8")]);
        const payload = Buffer.concat([Buffer.from(`${timestamp};${nonce};`, "utf8"), requestData]);
        return payload;
    }
}
