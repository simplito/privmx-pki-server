import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import * as types from "../types";
import { MongoDbManager } from "../db/MongoDbManager";
import { UserRepository } from "./UserRepository";
import { Crypto } from "../utils/Crypto";
export interface ApiKeyAndUser {
    apikey: db.ApiKey|null;
    user: db.User|null;
};
export class ApiKeyRepository extends BaseRepository<db.ApiKey> {
    
    static readonly COLLECTION_NAME = "api_key";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, ApiKeyRepository.COLLECTION_NAME);
    }
    
    async create(userId: types.user.UserId, name: types.auth.ApiKeyName, scopes: types.core.Scope[], publicKey: types.core.PubKey|undefined) {
        const apiKey: db.ApiKey = {
            _id: this.generateId(),
            user: userId,
            clientSecret: publicKey ? this.getApiKeySecretFromPubKey(publicKey) : this.generateSecret(),
            name: name,
            publicKey: publicKey,
            maxScope: scopes,
            enabled: true,
        };
        await this.insert(apiKey);
        return apiKey;
    }

    async addApiKey(model: {maxScope: types.core.Scope[], userId: types.user.UserId, clientSecret: types.auth.ClientSecret, name: types.auth.ApiKeyName, pubKey?: types.core.PubKey}) {
        const apiKey: db.ApiKey = {
            _id: this.generateId(),
            user: model.userId,
            clientSecret: model.clientSecret,
            name: model.name,
            publicKey: model.pubKey,
            maxScope: model.maxScope,
            enabled: true,
        };
        await this.insert(apiKey);
        return apiKey;
    }
    
    async updateApikey(model: {apiKeyId: types.auth.ClientId, name?: types.auth.ApiKeyName, enabled?: boolean, maxScope?: types.core.Scope[]}) {
        const fieldsToUpdate: {
            name?: types.auth.ApiKeyName,
            description?: string,
            enabled?: boolean,
            maxScope?: types.core.Scope[],
        } = {};
        if (model.name !== undefined) {
            fieldsToUpdate.name = model.name;
        }
        if (model.enabled !== undefined) {
            fieldsToUpdate.enabled = model.enabled;
        }
        if (model.maxScope) {
            fieldsToUpdate.maxScope = model.maxScope;
        }
        const result = await this.getCollection().updateOne(
            {
                _id: model.apiKeyId,
            },
            {
                $set: {...fieldsToUpdate},
            },
        );
        return (result.matchedCount) ? true : false;
    }
    
    async getAllUserApiKeys(userId: types.user.UserId) {
        return await this.getCollection().find({userId: userId}).toArray() as db.ApiKey[];
    }
    
    async getApiKeyAndUser(apiKeyId: types.auth.ClientId): Promise<ApiKeyAndUser> {
        const pipeline: any[] = [
            {
                $match: {
                    "_id": apiKeyId,
                },
            },
            {
                $lookup: {
                    from: UserRepository.COLLECTION_NAME,
                    localField: "user",
                    foreignField: "_id",
                    as: "users",
                },
            },
        ];
        const ele = (await this.getCollection().aggregate(pipeline).toArray())[0] as db.ApiKey&{users: db.User[]};
        if (!ele) {
            return {apikey: null, user: null};
        }
        const {users, ...apiKey} = ele;
        return {apikey: apiKey, user: users[0]};
    }

    private generateSecret() {
        return Crypto.randomBytes(16).toString("hex") as types.auth.ClientSecret;
    }
    
    private getApiKeySecretFromPubKey(pubKey: types.core.PubKey) {
        return Crypto.md5(Buffer.from(pubKey, "utf8")).toString("hex") as types.auth.ClientSecret;
    }
}
