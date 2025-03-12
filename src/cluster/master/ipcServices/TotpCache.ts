import { CacheWithTTL } from "../../../utils/CacheWithTTL";
import { IpcService } from "../Decorators";
import * as types from "../../../types";
import { DateUtils } from "../../../utils/DateUtils";
import { ApiMethod } from "../../../api/Decorators";

interface TotpInfo {
    attempts: number;
};

@IpcService
export class TotpCache {
    
    constructor(
        private cacheWithTTL: CacheWithTTL<TotpInfo>,
    ) {
    }
    
    @ApiMethod({})
    async addUnsucessfulTotpAttempt(user: types.user.UserId) {
        const entry = this.cacheWithTTL.get(user);
        if (entry) {
            entry.attempts++;
        }
        else {
            this.cacheWithTTL.set(user, {attempts: 1}, DateUtils.getSeconds(90));
        }
    }
    
    @ApiMethod({})
    async getTotpAttempts(user: types.user.UserId) {
        const entry = this.cacheWithTTL.get(user);
        return (entry) ? entry.attempts : 0;
    }
    
    deleteExpired() {
        this.cacheWithTTL.deleteExpired();
    }
}
