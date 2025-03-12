import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import * as mongodb from "mongodb";
import { DateUtils } from "../utils/DateUtils";
import { Crypto } from "../utils/Crypto";
import * as bs58 from "bs58";
import { UserRepository } from "./UserRepository";
import { ApiKeyRepository } from "./ApiKeyRepository";

export interface SessionAndApiKeyAndUser {
    session: db.Session|null;
    apikey: db.ApiKey|null;
    user: db.User|null;
}

export class SessionRepository extends BaseRepository<db.Session> {
    
    static readonly COLLECTION_NAME = "session";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, SessionRepository.COLLECTION_NAME);
    }
    
    getSessionId() {
        return bs58.encode(Crypto.randomBytes(32)) as types.auth.SessionId;
    }
    
    generateSessionName() {
        return bs58.encode(Crypto.randomBytes(16)) as types.auth.SessionName;
    }
    
    async createSession(userId: types.user.UserId, deviceId: types.core.AgentId, tokenInfo: db.TokenSessionInfo|undefined, name?: types.auth.SessionName, session?: mongodb.ClientSession) {
        const sessionName = (name) ? name : this.generateSessionName();
        const userSession: db.Session = {
            _id: this.getSessionId(),
            name: sessionName,
            lastAccessDate: DateUtils.now(),
            createDate: DateUtils.now(),
            user: userId,
            deviceId: deviceId,
            tokenInfo: tokenInfo,
        };
        await this.insert(userSession, session);
        return userSession;
    }
    
    async increaseSeq(sessionId: types.auth.SessionId) {
        const result = await this.getCollection().updateOne(
            {
                _id: sessionId,
            },
            {
                $inc: {
                    "tokenInfo.seq": 1,
                },
            },
        );
        
        return (result.matchedCount) ? true : false;
    }
    async refreshTokenExpirationTimeout(sessionId: types.auth.SessionId, sessionTTL: types.core.Timespan) {
        const result = await this.getCollection().updateOne(
            {
                _id: sessionId,
            },
            {
                $set: {
                    "tokenInfo.expiresAt": DateUtils.getExpirationDate(sessionTTL),
                },
            },
        );
        
        return (result.matchedCount) ? true : false;
    }
    
    async getSessionAndClientAndUser(sessionId: types.auth.SessionId): Promise<SessionAndApiKeyAndUser> {
        const pipeline: any[] = [
            {
                $match: {
                    "_id": sessionId,
                },
            },
            {
                $lookup: {
                    from: UserRepository.COLLECTION_NAME,
                    localField: "tokenInfo.userId",
                    foreignField: "_id",
                    as: "users",
                },
            },
            {
                $lookup: {
                    from: ApiKeyRepository.COLLECTION_NAME,
                    localField: "tokenInfo.clientId",
                    foreignField: "_id",
                    as: "apiKeys",
                },
            },
        ];
        const ele = (await this.getCollection().aggregate(pipeline).toArray())[0] as db.Session&{users: db.User[], apiKeys: db.ApiKey[]};
        if (!ele) {
            return {session: null, apikey: null, user: null};
        }
        const {apiKeys, users, ...session} = ele;
        return {session: session, apikey: apiKeys[0], user: users[0]};
    }
    
    async getUserSessionsSortedByCreateDate(userId: types.user.UserId) {
        return await this.getCollection().find({user: userId}).sort({createDate: 1}).toArray();
    }
    
    async getUserSession(user: types.user.UserId, sessionName: types.auth.SessionName) {
        return await this.getCollection().findOne({
            user: user,
            name: sessionName,
        });
    }
    
    /* @ignore-next-line-reference */
    async deleteAllUserSessions(userId: types.user.UserId) {
        await this.getCollection().deleteMany({
            user: userId,
        });
    }
    
    async deleteAllUserCredentialSessions(userId: types.user.UserId) {
        await this.getCollection().deleteMany({
            user: userId,
            "tokenInfo.clientId": {
                $exists: false,
            },
        });
    }
    
    async deleteAllApiKeySessions(apiKeyId: types.auth.ClientId) {
        await this.getCollection().deleteMany({
            "tokenInfo.clientId": apiKeyId,
        });
    }
    
    async deleteExpiredSessions() {
        await this.getCollection().deleteMany({"tokenInfo.expiresAt": {$lt: DateUtils.now()}});
    }
}
