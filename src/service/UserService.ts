import { AppException } from "../api/AppException";
import * as types from "../types";
import { UserRepository } from "./UserRepository";
import * as db from "../db/Model";
import { LoggedUserDoesNotExist } from "../error/LoggedUserDoesNotExist";
import { ApiKeyRepository } from "./ApiKeyRepository";
import { Crypto } from "../utils/Crypto";
import { SessionRepository } from "./SessionRepository";
import { WebSocketService } from "./WebSocketService";
import { ConfigService } from "./ConfigService";
import { Scope } from "../types/core";

export class UserService {
    
    constructor(
        private userRepository: UserRepository,
        private apiKeyRepository: ApiKeyRepository,
        private sessionRepository: SessionRepository,
        private webSocketService: WebSocketService,
        private configService: ConfigService,
    ) {
    }
    
    async getUser(id: types.user.UserId) {
        const user = await this.userRepository.get(id);
        if (!user) {
            throw new LoggedUserDoesNotExist(id);
        }
        return user;
    }
    
    validateUserStatus(user: db.User) {
        if (!user.enabled) {
            throw new AppException("ACCOUNT_DISABLED");
        }
    }
    
    async createFirstApiKey(initializationToken: types.auth.InitializationToken, name: types.auth.ApiKeyName) {
        const apiKeyCount = await this.apiKeyRepository.getApiKeyCount();
        const configInitializationToken = this.configService.values.initializationToken;
        if (apiKeyCount !== 0) {
            throw new AppException("FIRST_API_KEY_ALREADY_EXISTS");
        }
        if (!configInitializationToken || initializationToken !== configInitializationToken) {
            throw new AppException("INITIALIZATION_TOKEN_MISSMATCH");
        }
        const availUsers = await this.userRepository.getAll();
        if (availUsers.length > 0) {
            const user = (await this.userRepository.getAll())[0];
            const apiKey = (await this.apiKeyRepository.getAllUserApiKeys(user._id))[0];
            return {apiKeyId: apiKey._id, apiKeySecret: apiKey.clientSecret};
        }
        else {
            const user = await this.userRepository.create(true);
            const convertedScope = this.convertScope(["read" as Scope], "disabled");
            const apiKey = await this.apiKeyRepository.create(user._id as types.user.UserId, name as types.auth.ApiKeyName, convertedScope.scope, undefined);
            return {apiKeyId: apiKey._id, apiKeySecret: apiKey.clientSecret};
        }
    }
    
    async addApiKeyWithPubkey(maxScope: types.core.Scope[], userId: types.user.UserId, pubKey: types.core.PubKey, name: types.auth.ApiKeyName)  {
        const keys = await this.apiKeyRepository.getAllUserApiKeys(userId);
        if (keys.length > 9) {
            throw new AppException("TOO_MANY_API_KEYS");
        }
        const convertedScope = this.convertScope(maxScope, "disabled");
        const clientSecret = this.getApiKeySecretFromPubKey(pubKey);
        return await this.apiKeyRepository.addApiKey({maxScope: convertedScope.scope, userId, clientSecret, name, pubKey});
    }
    
    async addApiKey(maxScope: types.core.Scope[], userId: types.user.UserId, name: types.auth.ApiKeyName, clientSecret: types.auth.ClientSecret)  {
        const keys = await this.apiKeyRepository.getAllUserApiKeys(userId);
        if (keys.length > 9) {
            throw new AppException("TOO_MANY_API_KEYS");
        }
        const convertedScope = this.convertScope(maxScope, "disabled");
        return await this.apiKeyRepository.addApiKey({maxScope: convertedScope.scope, userId, clientSecret, name});
    }
    
    private getApiKeySecretFromPubKey(pubKey: types.core.PubKey) {
        return Crypto.md5(Buffer.from(pubKey, "utf8")).toString("hex") as types.auth.ClientSecret;
    }
    
    async deleteApiKey(userId: types.user.UserId, apiKeyId: types.auth.ClientId) {
        await this.getApiKeyAndValidateAccess(userId, apiKeyId);
        await this.sessionRepository.deleteAllApiKeySessions(apiKeyId);
        await this.webSocketService.deleteAllApiKeySessions(apiKeyId);
        await this.apiKeyRepository.delete(apiKeyId);
    }
    
    async updateApiKey(userId: types.user.UserId, model: {apiKeyId: types.auth.ClientId, name?: types.auth.ApiKeyName, enabled?: boolean, maxScope?: types.core.Scope[]}) {
        await this.getApiKeyAndValidateAccess(userId, model.apiKeyId);
        if (model.enabled === false) {
            await this.sessionRepository.deleteAllApiKeySessions(model.apiKeyId);
            await this.webSocketService.deleteAllApiKeySessions(model.apiKeyId);
        }
        return await this.apiKeyRepository.updateApikey({apiKeyId: model.apiKeyId, name: model.name, enabled: model.enabled, maxScope: model.maxScope ? this.convertScope(model.maxScope, "disabled").scope : undefined});
    }
    
    async getApiKeyAndValidateAccess(userId: types.user.UserId, apiKeyId: types.auth.ClientId) {
        const apiKey = await this.apiKeyRepository.get(apiKeyId);
        if (!apiKey) {
            throw new AppException("API_KEY_DOES_NOT_EXIST");
        }
        if (apiKey.user !== userId) {
            throw new AppException("ACCESS_DENIED");
        }
        return apiKey;
    }
    
    convertScope(scope: types.core.Scope[], expirationPolicy: "disabled"|types.core.Timespan): types.auth.ScopeObject {
        const convertedScope: types.auth.ScopeObject = {
            scope: [],
        };
        for (const s of scope) {
            const [key, arg] = s.split(":");
            if (key === "session") {
                convertedScope.sessionName = arg as types.auth.SessionName;
            }
            else if (key === "ipAddr") {
                convertedScope.ipAddress = arg as types.core.IpAddress;
            }
            else if (key === "agent") {
                convertedScope.agentLimited = true;
            }
            else if (key === "expires") {
                if (expirationPolicy === "disabled") {
                    throw new AppException("INVALID_PARAMS", "expires:NUMBER is not allowed in api keys");
                }
                const timeSpan = Number(arg);
                if (isNaN(timeSpan) || !Number.isInteger(timeSpan)) {
                    throw new AppException("INVALID_PARAMS", "expires:NUMBER is not an integer");
                }
                if (timeSpan > expirationPolicy) {
                    throw new AppException("INVALID_PARAMS", `Maximal ttl is exceeded (max: ${expirationPolicy}ms)`);
                }
                if (timeSpan < 0) {
                    throw new AppException("INVALID_PARAMS", "TTL must be a positive integer");
                }
                convertedScope.expiresIn = timeSpan as types.core.Timespan;
            }
            else if (key === "connection") {
                convertedScope.connectionLimited = true;
            }
            else if (arg === "read" || arg === "write") {
                convertedScope.scope.push(key + ":" + arg as types.core.Scope);
            }
            else if (arg === "read_write") {
                convertedScope.scope.push(key + ":" + "read" as types.core.Scope);
                convertedScope.scope.push(key + ":" + "write" as types.core.Scope);
            }
        }
        return convertedScope;
    };
}
