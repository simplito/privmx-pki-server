import { CacheWithTTL } from "../../../utils/CacheWithTTL";
import { IpcService } from "../Decorators";
import * as types from "../../../types";
import { ApiMethod } from "../../../api/Decorators";
import { SrpGroupName } from "privmx-srp";
import { Crypto } from "../../../utils/Crypto";
import * as bs58 from "bs58check";
import { ConfigService } from "../../../service/ConfigService";

export interface SrpSessionTokenData {
    email: types.core.LEmail;
    group: SrpGroupName;
    b: types.core.Hexadecimal;
    B: types.core.Hexadecimal;
    v: types.core.Hexadecimal;
}

@IpcService
export class SrpHandleCache {
    
    constructor(
        private cacheWithTTL: CacheWithTTL<SrpSessionTokenData>,
        private configService: ConfigService,
    ) {
    }
    
    @ApiMethod({})
    async saveSrpSession(srpSessionData: SrpSessionTokenData) {
        const id = this.generateId();
        this.cacheWithTTL.set(id, srpSessionData, this.configService.values.srpTokenTTL);
        return id;
    }
    
    @ApiMethod({})
    async getSrpSession(key: types.core.SrpToken) {
        return this.cacheWithTTL.get(key);
    }
    
    @ApiMethod({})
    async delete(key: types.core.SrpToken) {
        this.cacheWithTTL.delete(key);
    }
    
    deleteExpired() {
        this.cacheWithTTL.deleteExpired();
    }
    
    private generateId() {
        return bs58.encode(Crypto.randomBytes(32)) as types.core.SrpToken;
    }
}