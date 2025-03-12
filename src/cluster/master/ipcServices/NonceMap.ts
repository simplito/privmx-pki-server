import { IpcService } from "../Decorators";
import * as types from "../../../types";
import { ApiMethod } from "../../../api/Decorators";
import { CacheWithTTL } from "../../../utils/CacheWithTTL";

@IpcService
export class NonceMap {
    
    constructor(
        private cacheWithTTL: CacheWithTTL<true>,
    ) {
    }
    
    @ApiMethod({})
    async isValidNonce(model: {clientId: types.auth.ClientId, nonce: string, ttl: types.core.Timespan}) {
        const entryKey = model.clientId + model.nonce;
        const entry = this.cacheWithTTL.get(entryKey);
        if (!entry) {
            this.cacheWithTTL.set(entryKey, true, model.ttl);
        }
        return !entry;
    }
    
    deleteExpired() {
        this.cacheWithTTL.deleteExpired();
    }
}
