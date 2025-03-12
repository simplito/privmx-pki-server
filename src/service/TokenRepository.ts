import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import { DateUtils } from "../utils/DateUtils";
import { Crypto } from "../utils/Crypto";
import * as bs58 from "bs58";
import * as mongodb from "mongodb";

export class TokenRepository extends BaseRepository<db.Token> {
    
    static readonly COLLECTION_NAME = "token";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, TokenRepository.COLLECTION_NAME);
    }
    
    generateId() {
        return bs58.encode(Crypto.randomBytes(32)) as types.core.TokenId;
    }
    
    async getActiveToken(tokenId: types.core.TokenId) {
        return await this.getCollection().findOne({
            _id: tokenId,
            $or: [
                { expirationDate: { $gt: DateUtils.now() } },
                { expirationDate: { $exists: false } },
            ],
        });
    }
    
    async create(data: db.TokenData, searchable: string[], ttl: types.core.Timespan|null, session?: mongodb.ClientSession) {
        const token: db.Token = {
            _id: this.generateId(),
            createDate: DateUtils.now(),
            data: data,
            searchable: this.normalizeStrings(...searchable),
        };
        if (ttl) {
            token.expirationDate = DateUtils.getExpirationDate(ttl);
        }
        await this.insert(token, session);
        return token;
    }
    
    async findAccountActivationToken(userId: types.user.UserId) {
        return this.getCollection().findOne({"data.type": "activateAccount", "data.user": userId});
    }
    
    /* @ignore-next-line-reference */
    async lock(tokenId: types.core.TokenId) {
        return this.getCollection().findOneAndUpdate({_id: tokenId, locked: {$ne: true}}, {$set: {locked: true}});
    }
    
    /* @ignore-next-line-reference */
    async unlock(tokenId: types.core.TokenId) {
        return this.getCollection().updateOne({_id: tokenId}, {$unset: {locked: 1}});
    }
    
    async checkIfTotpCodeRecentlyUsed(code: string, userId: types.user.UserId) {
        return await this.getCollection().findOne({
            "data.type": "totpCode",
            "data.user": userId,
            "data.code": code,
            "data.usedAt": { $gt: (DateUtils.now() - DateUtils.getSeconds(90))},
        });
    }
    
    async deleteExpiredTokens() {
        await this.getCollection().deleteMany({
            expirationDate: {
                $exists: true,
                $lt: DateUtils.now(),
            },
        });
    }
}
