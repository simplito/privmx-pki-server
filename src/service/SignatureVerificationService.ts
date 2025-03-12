import { HttpRequest } from "../CommonTypes";
import { BaseParams, RequestSignature } from "../utils/RequestSignature";
import * as db from "../db/Model";
import { NonceMap } from "../cluster/master/ipcServices/NonceMap";
import { DateUtils } from "../utils/DateUtils";
import * as types from "../types";

export class SignatureVerificationService {
    
    private static readonly MAX_CLOCK_DESYNCHRONIZATION: types.core.Timespan = DateUtils.getMinutes(10);
    
    constructor(
        private nonceMap: NonceMap,
    ) {}
    
    async verify({request, apiKey, nonce, timestamp, signature, requestBody}: {request: HttpRequest|null, apiKey: db.ApiKey, nonce: string, timestamp: number, signature: string, requestBody: Buffer}) {
        if (!await this.isValidNonce(apiKey._id, nonce)) {
            return false;
        }
        if (!this.isValidTimestamp(timestamp)) {
            return false;
        }
        
        const params: BaseParams = {
            clientId: apiKey._id,
            httpMethod: request?.method || "",
            nonce: nonce,
            timestamp: timestamp,
            requestBody: requestBody,
            urlPath: request?.url || "",
        };
        
        if (apiKey.publicKey) {
            return RequestSignature.verifyEddsa({
                ...params,
                publicKey: apiKey.publicKey,
                signature: signature,
            });
        }
        return RequestSignature.verifyHmac({
            ...params,
            clientSecret: apiKey.clientSecret,
            signature: signature,
        });
    }
    
    async isValidNonce(clientId: types.auth.ClientId, nonce: string) {
        return (nonce.length <= 128 && await this.nonceMap.isValidNonce({clientId, nonce, ttl: (SignatureVerificationService.MAX_CLOCK_DESYNCHRONIZATION * 2) as types.core.Timespan}));
    }
    
    isValidTimestamp(timestamp: number) {
        return (Math.abs(Date.now() - timestamp) < SignatureVerificationService.MAX_CLOCK_DESYNCHRONIZATION);
    }
}
