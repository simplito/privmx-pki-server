import { AppException } from "../api/AppException";
import * as types from "../types";
import { UserRepository } from "./UserRepository";
import * as db from "../db/Model";
import { TokenRepository } from "./TokenRepository";
import { DbInconsistencyError } from "../error/DbInconsistencyError";
import { LoggedUserDoesNotExist } from "../error/LoggedUserDoesNotExist";
import { UserId } from "../types/user";
import { SrpAuthenticationService } from "../service/SrpAuthenticationService";
import { PasswordService } from "./PasswordService";
import { ConfigService } from "./ConfigService";
import { ApiKeyRepository } from "./ApiKeyRepository";
import { Crypto } from "../utils/Crypto";
import { SessionRepository } from "./SessionRepository";
import { WebSocketService } from "./WebSocketService";
import { MailService } from "./mail/MailService";

export class UserService {
    
    constructor(
        private userRepository: UserRepository,
        private tokenRepository: TokenRepository,
        private srpAuthenticationService: SrpAuthenticationService,
        private passwordService: PasswordService,
        private configService: ConfigService,
        private apiKeyRepository: ApiKeyRepository,
        private sessionRepository: SessionRepository,
        private webSocketService: WebSocketService,
        private mailService: MailService,
    ) {
    }
    
    async activateAccountByToken(tokenId: types.core.TokenId) {
        const token = await this.tokenRepository.getActiveToken(tokenId);
        if (!token || token.data.type !== "activateAccount") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
        const user = await this.userRepository.get(token.data.user);
        if (!user) {
            throw new DbInconsistencyError(`user=${token.data.user} does not exist, from token=${tokenId}`);
        }
        if (!user.activated) {
            await this.userRepository.activateAccount(token.data.user);
        }
        await this.tokenRepository.delete(tokenId);
    }
    
    async resendAccountValidationToken(email: types.core.LEmail) {
        const user = await this.userRepository.getByEmail(email);
        if (!user || user.activated) {
            return;
        }
        const token = await this.tokenRepository.findAccountActivationToken(user._id);
        if (!token) {
            return;
        }
        this.mailService.sendEmailVerificationMail("en" as types.core.Language, user.email, token._id);
    }
    
    async getUser(id: types.user.UserId) {
        const user = await this.userRepository.get(id);
        if (!user) {
            throw new LoggedUserDoesNotExist(id);
        }
        return user;
    }
    
    validateUserStatus(user: db.User) {
        if (user.blocked) {
            throw new AppException("ACCOUNT_BLOCKED");
        }
        if (!user.activated) {
            throw new AppException("ACCOUNT_NOT_ACTIVATED_YET");
        }
    }
    
    async setUserProfile(id: types.user.UserId, name: types.user.Username) {
        const user = await this.userRepository.get(id);
        if (!user) {
            throw new LoggedUserDoesNotExist(id);
        }
        await this.userRepository.updateProfile(user._id, user.email, name);
    }
    
    async enableUserSecondFactor(id: types.user.UserId, secondFactor: db.SecondFactor) {
        const user = await this.userRepository.get(id);
        if (!user) {
            throw new LoggedUserDoesNotExist(id);
        }
        await this.userRepository.enableSecondFactor(user._id, secondFactor);
    }
    
    async disableUserSecondFactor(id: types.user.UserId) {
        const user = await this.userRepository.get(id);
        if (!user) {
            throw new LoggedUserDoesNotExist(id);
        }
        await this.userRepository.disableSecondFactor(user._id);
    }
    
    /* @ignore-next-line-reference */
    async activateUser(userId: types.user.UserId) {
        const user = await this.userRepository.get(userId);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        if (user.activated) {
            throw new AppException("ACCOUNT_ALREADY_ACTIVATED");
        }
        await this.userRepository.activateAccount(userId);
    }
    
    async forgetAllDevices(userId: types.user.UserId) {
        await this.userRepository.removeAllKnownDevices(userId);
    }
    
    async changePassword(newPassword: types.core.PlainPassword, currentPassword: types.core.PlainPassword, userId: UserId) {
        const user = await this.userRepository.get(userId);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        if (user.credentials.type === "password") {
            if (!(await this.passwordService.checkPassword(currentPassword, user.credentials.password))) {
                throw new AppException("INVALID_PASSWORD");
            }
        }
        else if (user.credentials.type === "srp") {
            if (!(await this.srpAuthenticationService.verifyUserByPassword(user.credentials, user.email, currentPassword))) {
                throw new AppException("INVALID_PASSWORD");
            }
        }
        else {
            throw new Error("Unuspported credentials type");
        }
        const newSrpCredentials = await this.srpAuthenticationService.prepareSrpCredentialsFromPassword(user.email, newPassword);
        await this.userRepository.updateUserCredentials(userId, newSrpCredentials);
        await this.sessionRepository.deleteAllUserCredentialSessions(userId);
        await this.webSocketService.deleteAllUserCredentialsSessions(userId);
    }
    
    async changeSrpCredentials(user: types.user.UserId, passwordChangeTokenId: types.core.TokenId, A: types.core.Hexadecimal, M1: types.core.Hexadecimal, credentials: db.SrpCredentials) {
        const token = await this.tokenRepository.getActiveToken(passwordChangeTokenId);
        if (!token || token.data.type !== "srpCredentialsChange") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
        if (token.data.user != user) {
            await this.tokenRepository.delete(passwordChangeTokenId);
            throw new AppException("ACCESS_DENIED");
        }
        try {
            await this.srpAuthenticationService.secondSrpStep(M1, A, token.data.group, token.data.v, token.data.B, token.data.b);
        }
        catch {
            await this.tokenRepository.delete(passwordChangeTokenId);
            throw new AppException("INVALID_USER_OR_PASSWORD");
        }
        await this.userRepository.updateUserCredentials(user, credentials);
        await this.sessionRepository.deleteAllUserCredentialSessions(user);
        await this.webSocketService.deleteAllUserCredentialsSessions(user);
        await this.tokenRepository.delete(passwordChangeTokenId);
    }
    
    async startSrpCredentialsChange(userId: types.user.UserId) {
        const user = await this.userRepository.get(userId);
        if (!user) {
            throw new DbInconsistencyError("Logged user does not exists");
        }
        if (user.credentials.type !== "srp") {
            throw new AppException("SRP_NOT_ENABLED_FOR_THIS_ACCOUNT");
        }
        const groupName = user.credentials.group;
        const pbkdf = user.credentials.pbkdf;
        const salt = user.credentials.salt;
        const {g, N, B, b} = await this.srpAuthenticationService.initialSrpStep(groupName, user.credentials.verifier);
        const srpTokenData: db.SrpCredentialsChangeTokenData = {
            type: "srpCredentialsChange",
            user: user._id,
            b: b,
            B: B,
            group: groupName,
            v: user.credentials.verifier,
        };
        const token = await this.tokenRepository.create(srpTokenData, [], this.configService.values.srpTokenTTL);
        return {g, N, B, credentialsChangeToken: token._id, pbkdf, salt};
    }
    
    async sendEmailWithCredentialsResetTokenIfUserExists(email: types.core.LEmail) {
        const user = await this.userRepository.getByEmail(email);
        if (!user) {
            return;
        }
        const data: db.CredentialsResetToken = {
            type: "credentialsReset",
            user: user._id,
        };
        const token = await this.tokenRepository.create(data, [user._id], this.configService.values.credentialsResetTokenTTL);
        this.mailService.sendPasswordChangeMail("en" as types.core.Language, email, token._id);
    }
    
    async checkResetCredentialsToken(tokenId: types.core.TokenId) {
        const token = await this.tokenRepository.getActiveToken(tokenId);
        if (!token || token.data.type !== "credentialsReset") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
    }
    
    async resetCredentialsWithToken(tokenId: types.core.TokenId, credentials: types.core.PlainPassword|db.SrpCredentials) {
        const token = await this.tokenRepository.getActiveToken(tokenId);
        if (!token || token.data.type !== "credentialsReset") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
        const user = await this.userRepository.get(token.data.user);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        const newSrpCredentials = (typeof credentials === "string") ? await this.srpAuthenticationService.prepareSrpCredentialsFromPassword(user.email, credentials) : credentials;
        await this.userRepository.updateUserCredentials(token.data.user, newSrpCredentials);
        await this.sessionRepository.deleteAllUserCredentialSessions(token.data.user);
        await this.webSocketService.deleteAllUserCredentialsSessions(token.data.user);
        await this.tokenRepository.delete(tokenId);
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
