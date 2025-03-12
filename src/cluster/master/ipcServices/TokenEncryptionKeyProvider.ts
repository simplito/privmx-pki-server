import { CacheWithTTL } from "../../../utils/CacheWithTTL";
import { IpcService } from "../Decorators";
import { ApiMethod } from "../../../api/Decorators";
import * as db from "../../../db/Model";
import { TokenEncryptionKeyRepository } from "../../../service/TokenEncryptionKey";
import { DateUtils } from "../../../utils/DateUtils";
import { ConfigService } from "../../../service/ConfigService";

@IpcService
export class TokenEncryptionKeyProvider {
    
    constructor(
        private cacheWithTTL: CacheWithTTL<db.TokenEncryptionKey>,
        private tokenEncryptionKeyRepository: TokenEncryptionKeyRepository,
        private configService: ConfigService,
    ) {
    }
    
    @ApiMethod({})
    async getCurrentKey() {
        const key = this.cacheWithTTL.get("current");
        if (key && key.usageExpiryDate > DateUtils.now()) {
            return key;
        }
        
        const latestKey = await this.tokenEncryptionKeyRepository.getLatestKey();
        if (latestKey && latestKey.usageExpiryDate > DateUtils.now()) {
            this.cacheWithTTL.setWithExpires("current", latestKey, latestKey.usageExpiryDate);
            this.cacheWithTTL.setWithExpires(latestKey._id, latestKey, latestKey.expiryDate);
            return latestKey;
        }
        
        const newKey = await this.tokenEncryptionKeyRepository.addCipherKey(this.configService.values.cipherKeyTTL, this.configService.values.refreshTokenLifetime);
        this.cacheWithTTL.setWithExpires("current", newKey, newKey.usageExpiryDate);
        this.cacheWithTTL.setWithExpires(newKey._id, newKey, newKey.expiryDate);
        return newKey;
    }
    
    @ApiMethod({})
    async getKey(id: db.TokenEncryptionKeyId) {
        const key = this.cacheWithTTL.get(id);
        if (key) {
            return key;
        }
        const cipherKey = await this.tokenEncryptionKeyRepository.get(id);
        if (cipherKey && cipherKey.expiryDate > DateUtils.now()) {
            this.cacheWithTTL.setWithExpires(id, cipherKey, cipherKey.expiryDate);
            return cipherKey;
        }
        return null;
    }
    
    async deleteExpired() {
        this.cacheWithTTL.deleteExpired();
        await this.tokenEncryptionKeyRepository.deleteExpiredKeys();
    }
}
