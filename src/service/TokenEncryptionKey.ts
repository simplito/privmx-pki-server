import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import * as types from "../types";
import { MongoDbManager } from "../db/MongoDbManager";
import { Crypto } from "../utils/Crypto";
import { DateUtils } from "../utils/DateUtils";
import { Hex } from "../utils/Hex";

export class TokenEncryptionKeyRepository extends BaseRepository<db.TokenEncryptionKey> {
    
    static readonly COLLECTION_NAME = "cipher_key";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, TokenEncryptionKeyRepository.COLLECTION_NAME);
    }
    
    async addCipherKey(usageTTL: types.core.Timespan, refreshTokenTTL: types.core.Timespan) {
        const now = DateUtils.now();
        const cipherKey: db.TokenEncryptionKey = {
            _id: this.generateId(),
            key: this.generateKey(),
            createDate: now,
            usageExpiryDate: DateUtils.getExpirationDate(usageTTL, now),
            expiryDate: DateUtils.increaseTimestamp(DateUtils.getExpirationDate(refreshTokenTTL, now), usageTTL),
            refreshTokenTTL: refreshTokenTTL,
        };
        await this.getCollection().insertOne(cipherKey);
        return cipherKey;
    }
    
    async getLatestKey() {
        return (await this.getCollection().find({}).sort({createDate: -1}).limit(1).toArray())[0];
    }
    
    async deleteExpiredKeys() {
        await this.getCollection().deleteMany({expiryDate: {$lt: DateUtils.now()}});
    }
    
    generateId() {
        return Hex.buf2Hex(Crypto.randomBytes(16)) as db.TokenEncryptionKeyId;
    }
    
    generateKey() {
        return Hex.buf2Hex(Crypto.randomBytes(32)) as db.EncryptionKey;
    }
}
