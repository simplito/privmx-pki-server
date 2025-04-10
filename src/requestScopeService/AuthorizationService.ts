import * as types from "../types";
import * as db from "../db/Model";
import { AppException } from "../api/AppException";
import { UserService } from "../service/UserService";
import { AuthorizationHolder } from "./AuthorizationHolder";
import { HttpRequest, WebSocketInfo } from "../CommonTypes";
import { HttpUtils } from "../utils/HttpUtils";
import { SessionRepository } from "../service/SessionRepository";
import { ConfigService } from "../service/ConfigService";
import { UserRepository } from "../service/UserRepository";
import { Utils } from "../utils/Utils";
import { EventRepository } from "../service/EventRepository";
import { DateUtils } from "../utils/DateUtils";
import { IpRateLimiterService } from "../requestScopeService/IpRateLimiterService";
import { OAuthTokenModel, OauthTokenService } from "../service/OauthTokenService";
import { ApiKeyRepository } from "../service/ApiKeyRepository";
import { OAuth2Token, ScopeObject } from "../types/auth";
import { SignatureVerificationService } from "../service/SignatureVerificationService";
import { TokenEncodingService } from "../service/TokenEncodingService";

export class AuthorizationService {
    
    constructor(
        private request: HttpRequest,
        private authorizationHolder: AuthorizationHolder,
        private sessionRepository: SessionRepository,
        private userService: UserService,
        private configService: ConfigService,
        private userRepository: UserRepository,
        private eventRepository: EventRepository,
        private webSocketInfo: WebSocketInfo|null,
        private ipRateLimiterService: IpRateLimiterService,
        private oauthTokenService: OauthTokenService,
        private apiKeyRepository: ApiKeyRepository,
        private signatureVerificationService: SignatureVerificationService,
        private tokenEncodingService: TokenEncodingService,
    ) {
    }
    
    async getAccessTokenFromClientCredentials(_requestParamsHash: string, clientId: types.auth.ClientId, clientSecret: types.auth.ClientSecret, scope: types.core.Scope[], _deviceId: types.core.AgentId|undefined, _challengeModel: types.auth.ChallengeModel|undefined) {
        const {apikey, user} = await this.apiKeyRepository.getApiKeyAndUser(clientId);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        this.userService.validateUserStatus(user);
        if (!apikey || !apikey.enabled || apikey.clientSecret !== clientSecret) {
            throw new AppException("INVALID_CREDENTIALS");
        }
        return this.getTokenFromApiKey(apikey, user, scope);
    }
    
    async getAccessTokenFromSignature(_requestParamsHash: string, clientId: types.auth.ClientId, scope: types.core.Scope[], timestamp: types.core.Timestamp, nonce: string, signature: types.core.Base64, _challengeModel: types.auth.ChallengeModel|undefined, _deviceId: types.core.AgentId|undefined, data?: string) {
        const {apikey, user} = await this.apiKeyRepository.getApiKeyAndUser(clientId);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        this.userService.validateUserStatus(user);
        if (!apikey || !apikey.enabled) {
            throw new AppException("INVALID_CREDENTIALS");
        }
        if (!await this.isValidClientSignature(apikey, timestamp, nonce, signature, data)) {
            throw new AppException("UNAUTHORIZED");
        }
        return this.getTokenFromApiKey(apikey, user, scope);
    }
    
    async getTokenFromApiKey(apiKey: db.ApiKey, user: db.User, scope: types.core.Scope[]) {
        const key = await this.tokenEncodingService.getKeyToEncode();
        const convertedScope = this.userService.convertScope(scope, key.refreshTokenTTL);
        const session = await this.prepareTokenSession(key.refreshTokenTTL, convertedScope, user, apiKey, undefined);
        const connectionId = (convertedScope.connectionLimited && this.webSocketInfo) ? this.webSocketInfo.connectionId : undefined;
        
        const tokenModel: OAuthTokenModel = {
            sessionId: session._id,
            seq: session.seq,
            connectionId,
        };
        
        const {accessToken, refreshToken} = await this.getTokenPair(tokenModel, key, convertedScope.expiresIn);
        
        return {
            accessToken,
            refreshToken,
            sessionName: session.name,
            scope: convertedScope.scope,
        };
    }
    
    async forkToken(token: types.core.RefreshToken, sessionName: types.auth.SessionName) {
        const decodedToken = await Utils.tryPromise(() => this.oauthTokenService.decodeRefreshToken(token));
        if (!decodedToken.success) {
            throw new AppException("INVALID_TOKEN");
        }
        const refreshToken = decodedToken.result;
        
        if (refreshToken.connectionId) {
            throw new AppException("INVALID_REQUEST", "Cannot fork connection limited tokens");
        }
        const key = await this.tokenEncodingService.getKeyToEncode();
        const { tokenInfo: tokenInfoOld, user } = await this.validateToken(refreshToken);
        const tokenInfo: db.TokenSessionInfo = {
            ...tokenInfoOld,
            expiresAt: DateUtils.getExpirationDate(key.refreshTokenTTL),
            seq: 0,
        };
        
        const session = await this.createTokenSession(tokenInfo, user, sessionName);
        
        const tokenModel: OAuthTokenModel = {
            sessionId: session._id,
            seq: tokenInfo.seq,
            connectionId: refreshToken.connectionId,
        };
        const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await this.getTokenPair(tokenModel, key, refreshToken.accessTokenTTL);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            scope: tokenInfo.scope,
        };
    }
    
    async refreshToken(token: types.core.RefreshToken) {
        const decodedToken = await Utils.tryPromise(() => this.oauthTokenService.decodeRefreshToken(token));
        if (!decodedToken.success) {
            throw new AppException("INVALID_TOKEN");
        }
        const refreshToken = decodedToken.result;
        const key = await this.tokenEncodingService.getKeyToEncode();
        const {tokenInfo} = await this.validateToken(refreshToken);
        const tokenModel: OAuthTokenModel = {
            seq: refreshToken.seq + 1,
            sessionId: refreshToken.sessionId,
            connectionId: refreshToken.connectionId,
        };
        const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await this.getTokenPair(tokenModel, key, refreshToken.accessTokenTTL);
        if (refreshToken.connectionId && this.webSocketInfo) {
            tokenInfo.seq++;
        }
        else {
            await this.sessionRepository.increaseSeq(refreshToken.sessionId);
            await this.sessionRepository.refreshTokenExpirationTimeout(refreshToken.sessionId, key.refreshTokenTTL);
        }
        
        return {
            type: "token",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            scope: tokenInfo.scope,
        };
    }
    
    async bindAccessToken(token: types.core.AccessToken) {
        if (!this.webSocketInfo) {
            throw new AppException("METHOD_CALLABLE_WITH_WEBSOCKET_ONLY");
        }
        const decodedToken = await this.oauthTokenService.decodeAccessToken(token);
        await this.validateToken(decodedToken);
        this.webSocketInfo.authorization = decodedToken;
    }
    
    private async createTokenSession(tokenInfo: db.TokenSessionInfo, user: db.User, sessionName: types.auth.SessionName|undefined) {
        void this.ipRateLimiterService.resetLoginCountForThisIp(user._id);
        const pastSessions = await this.sessionRepository.getUserSessionsSortedByCreateDate(user._id);
        if (pastSessions.length >= 16) {
            await this.sessionRepository.delete(pastSessions[0]._id);
        }
        const session = await this.sessionRepository.createSession(user._id, "" as types.core.AgentId, tokenInfo, sessionName);
        const eventData: db.EventData = {
            type: "loginEvent",
            userId: user._id,
            ipAddress: HttpUtils.getIpAddress(this.request, this.configService.values.ipAddressHeaderName),
        };
        await this.eventRepository.registerNewEvent(eventData);
        return session;
    }
    
    private async isValidClientSignature(apiKey: db.ApiKey, timestamp: types.core.Timestamp, nonce: string, signature: types.core.Base64, data?: string) {
        return this.signatureVerificationService.verify({
            apiKey: apiKey,
            request: null,
            nonce: nonce,
            timestamp: timestamp,
            requestBody: Buffer.from(data || ""),
            signature: signature,
        });
    }
    
    private async prepareTokenSession(sessionTTL: types.core.Timespan, scope: ScopeObject, user: db.User, apkiKey: db.ApiKey|undefined, grants: types.core.GrantType[]|undefined) {
        const tokenInfo: db.TokenSessionInfo = {
            seq: 0,
            userId: user._id,
            scope: scope.scope,
            sessionLimited: scope.agentLimited ? this.authorizationHolder.getAgentId() : undefined,
            clientId: apkiKey ? apkiKey._id : undefined,
            grants: grants,
            ipAddress: scope.ipAddress,
            expiresAt: DateUtils.getExpirationDate(sessionTTL),
        };
        if (scope.connectionLimited && this.webSocketInfo) {
            this.webSocketInfo.tokenInfo = tokenInfo;
            return {
                _id: "websocket" as types.auth.SessionId,
                seq: tokenInfo.seq,
                name: "websocket" as types.auth.SessionName,
            };
        }
        else if (scope.sessionName) {
            const namedSession = await this.sessionRepository.getUserSession(user._id, scope.sessionName as types.auth.SessionName);
            if (namedSession) {
                await this.sessionRepository.delete(namedSession._id);
            }
        }
        const session = await this.createTokenSession(tokenInfo, user, scope.sessionName);
        return {
            _id: session._id,
            seq: tokenInfo.seq,
            name: session.name,
        };
    }
    
    private async getTokenPair(token: OAuthTokenModel, key: db.TokenEncryptionKey, accessTokenTTL?: types.core.Timespan) {
        const accessToken = await this.oauthTokenService.encodeAccessToken(token, key, accessTokenTTL);
        const refreshToken = await this.oauthTokenService.encodeRefreshToken(token, key, accessTokenTTL);
        return {accessToken, refreshToken};
    }
    
    private async validateToken(token: OAuth2Token) {
        if (token.expires < DateUtils.now()) {
            throw new AppException("TOKEN_EXPIRED");
        }
        const {tokenInfo, user: dev, apikey: client} = await (async () => {
            if (token.connectionId && this.webSocketInfo) {
                const webSocketTokenInfo = token.connectionId === this.webSocketInfo.connectionId ? this.webSocketInfo.tokenInfo : null;
                if (webSocketTokenInfo) {
                    const {apikey, user} = (webSocketTokenInfo.clientId) ? await this.apiKeyRepository.getApiKeyAndUser(webSocketTokenInfo.clientId) : {user: await this.userRepository.get(webSocketTokenInfo.userId), apikey: null};
                    return {tokenInfo: webSocketTokenInfo, apikey, user};
                }
                else {
                    throw new AppException("SESSION_DOES_NOT_EXIST");
                }
            }
            const {session, apikey, user} = await this.sessionRepository.getSessionAndClientAndUser(token.sessionId);
            return {tokenInfo: session?.tokenInfo, apikey, user};
        })();
        
        if (!dev) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        this.userService.validateUserStatus(dev);
        
        if (!tokenInfo) {
            throw new AppException("SESSION_DOES_NOT_EXIST");
        }
        if (tokenInfo.seq !== token.seq) {
            throw new AppException("TOKEN_EXPIRED");
        }
        if (tokenInfo.clientId) {
            if (!client || !client.enabled) {
                throw new AppException("API_KEY_DOES_NOT_EXIST");
            }
        }
        return {tokenInfo, user: dev, apikey: client};
    }
}
