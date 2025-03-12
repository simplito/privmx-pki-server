import { HttpRequest, WebSocketInfo } from "../CommonTypes";
import { HttpUtils } from "../utils/HttpUtils";
import { AuthorizationHolder } from "./AuthorizationHolder";
import * as types from "../types";
import { Crypto } from "../utils/Crypto";
import { UserRepository } from "../service/UserRepository";
import * as db from "../db/Model";
import { OauthTokenService } from "../service/OauthTokenService";
import { DateUtils } from "../utils/DateUtils";
import { Utils } from "../utils/Utils";
import { SessionRepository } from "../service/SessionRepository";
import { ApiKeyRepository } from "../service/ApiKeyRepository";
import { ConfigService } from "../service/ConfigService";
import { RequestSignature, SignatureInfo } from "../utils/RequestSignature";
import { SignatureVerificationService } from "../service/SignatureVerificationService";
import { Hex } from "../utils/Hex";
import { ResponseHeadersHolder } from "./ResponseHeadersHolder";

export class AuthorizationDetector {
    
    constructor(
        private request: HttpRequest,
        private authorizationHolder: AuthorizationHolder,
        private userRepository: UserRepository,
        private oauthTokenService: OauthTokenService,
        private sessionRepository: SessionRepository,
        private apiKeyRepository: ApiKeyRepository,
        private configService: ConfigService,
        private signatureVerificationService: SignatureVerificationService,
        private responseHeadersHolder: ResponseHeadersHolder,
        private webSocketInfo: WebSocketInfo|null,
    ) {
    }
    
    async detectAuthorization() {
        if (await this.tryAuthorizeFromAuthorizationHeader()) {
            return;
        }
    }
    
    async parseTokenAndTryAuthorizeAsGivenToken(accessToken: types.core.AccessToken) {
        const result = await Utils.tryPromise(() => this.oauthTokenService.decodeAccessToken(accessToken));
        if (!result.success) {
            return false;
        }
        const oauth2AccessTokenData = result.result;
        if (!oauth2AccessTokenData) {
            return false;
        }
        return this.tryAuthorizeAsGivenToken(oauth2AccessTokenData);
    }
    
    async detectWebSocketAuthorization() {
        if (!this.webSocketInfo || !this.webSocketInfo.authorization) {
            return;
        }
        this.authorizationHolder.setAsWebSocketConnection(this.webSocketInfo);
        const authorizationInfo = this.webSocketInfo.authorization;
        if (authorizationInfo.type == "accessToken") {
            await this.tryAuthorizeAsGivenToken(authorizationInfo);
        }
    }
    
    private async tryAuthorizeAsGivenToken(authorizationInfo: types.auth.OAuth2AccessToken) {
        if (authorizationInfo.expires < DateUtils.now()) {
            return false;
        }
        const info = await this.fetchTokenInfo(authorizationInfo);
        if (!info) {
            return false;
        }
        const {tokenInfo, user} = info;
        if (tokenInfo.seq !== authorizationInfo.seq) {
            return false;
        }
        if (tokenInfo.ipAddress && tokenInfo.ipAddress !== HttpUtils.getIpAddress(this.request, this.configService.values.ipAddressHeaderName)) {
            return false;
        }
        if (tokenInfo.sessionLimited && this.authorizationHolder.getAgentId() !== tokenInfo.sessionLimited) {
            return false;
        }
        this.authorizationHolder.authorizeAsTokenWithScope(tokenInfo.scope, authorizationInfo.seq, authorizationInfo.sessionId, tokenInfo.userId, authorizationInfo.expires, tokenInfo.clientId, user);
        return true;
    }
    
    private async fetchTokenInfo(authorizationInfo:  types.auth.OAuth2AccessToken) {
        if (this.webSocketInfo && authorizationInfo.connectionId) {
            const webSocketTokenInfo = authorizationInfo.connectionId === this.webSocketInfo.connectionId ? this.webSocketInfo.tokenInfo : null;
            if (webSocketTokenInfo) {
                if (this.configService.values.checkDevsAndKeysForToken) {
                    const {apikey, user} = (webSocketTokenInfo.clientId) ? await this.apiKeyRepository.getApiKeyAndUser(webSocketTokenInfo.clientId) : {user: await this.userRepository.get(webSocketTokenInfo.userId), apikey: null};
                    return this.isValidUserAndApiKey(authorizationInfo, webSocketTokenInfo, apikey, user) ? {user, tokenInfo: webSocketTokenInfo} : null;
                }
                else {
                    return {user: undefined, tokenInfo: webSocketTokenInfo};
                }
            }
            return null;
        }
        if (this.configService.values.checkDevsAndKeysForToken) {
            const {session, apikey, user} = await this.sessionRepository.getSessionAndClientAndUser(authorizationInfo.sessionId);
            if (!session || !session.tokenInfo) {
                return null;
            }
            if (!this.isValidUserAndApiKey(authorizationInfo, session.tokenInfo, apikey, user)) {
                return null;
            }
            return {user, tokenInfo: session.tokenInfo};
        }
        const session = await this.sessionRepository.get(authorizationInfo.sessionId);
        return session && session.tokenInfo ? {user: undefined, tokenInfo: session.tokenInfo} : null;
    }
    
    private isValidUserAndApiKey(authorizationInfo: types.auth.OAuth2AccessToken, tokenInfo: db.TokenSessionInfo|null, apikey: db.ApiKey|null, user: db.User|null): user is db.User {
        if (!user || user.blocked || !user.activated) {
            return false;
        }
        if (!tokenInfo || !tokenInfo.clientId && user.lastPasswordChange > authorizationInfo.createDate) {
            return false;
        }
        if (tokenInfo.clientId && (!apikey || !apikey.enabled)) {
            return false;
        }
        return true;
    }
    
    private async tryAuthorizeFromAuthorizationHeader() {
        const auth = HttpUtils.parseAuthorizationHeader(this.request.headers.authorization || "");
        if (!auth) {
            return false;
        }
        if (auth.method === "Bearer") {
            return await this.parseTokenAndTryAuthorizeAsGivenToken(auth.data as types.core.AccessToken);
        }
        else if (auth.method === "Basic") {
            return await this.tryAuthorizeAsApiKeyWithClientCredentials(auth.data);
        }
        else if (auth.method === RequestSignature.PMX_HMAC_SHA256) {
            return await this.tryAuthorizeAsApiKeyWithSignature(auth.data);
        }
        return false;
    }
    
    private async tryAuthorizeAsApiKeyWithSignature(pmxSignature: string) {
        const info = await this.parsePmxHmacSig(pmxSignature);
        if (info === false) {
            return false;
        }
        const {user, apikey} = await this.apiKeyRepository.getApiKeyAndUser(info.clientId);
        if (!apikey || !apikey.enabled) {
            return false;
        }
        if (!user || user.blocked || !user.activated) {
            return false;
        }
        const verifed = await this.signatureVerificationService.verify({
            apiKey: apikey,
            request: this.request,
            nonce: info.nonce,
            timestamp: info.timestamp as types.core.Timestamp,
            requestBody: await HttpUtils.readBody(this.request),
            signature: info.signature,
        });
        if (!verifed) {
            return false;
        }
        this.authorizationHolder.authorizeAsApiKey(apikey.maxScope, apikey.user, apikey._id);
        return true;
    }
    
    private async parsePmxHmacSig(value: string): Promise<false|SignatureInfo> {
        const info = RequestSignature.parseHeader(value);
        if (info === false || info.version !== "1") {
            return false;
        }
        return info;
    }
    
    private async tryAuthorizeAsApiKeyWithClientCredentials(encodedClient: string) {
        const credentials = HttpUtils.parseHttpBasicDataAsClientCredentials(encodedClient);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
            return false;
        }
        
        const {user, apikey} = await this.apiKeyRepository.getApiKeyAndUser(credentials.clientId);
        if (!apikey || !apikey.enabled || apikey.publicKey || apikey.clientSecret !== credentials.clientSecret) {
            return false;
        }
        if (!user || user.blocked || !user.activated) {
            return false;
        }
        this.authorizationHolder.authorizeAsApiKey(apikey.maxScope, apikey.user, apikey._id);
        return true;
    }
    
    async checkOrAssignAgentId() {
        const agentId = HttpUtils.getCookies(this.request).find(cookie => cookie.name == "agentId")?.value;
        if (agentId) {
            this.authorizationHolder.setAgentId(agentId as types.core.AgentId);
        }
        else {
            const id = Hex.buf2Hex(Crypto.randomBytes(32));
            this.responseHeadersHolder.setSecureCookie("agentId", id);
            this.authorizationHolder.setAgentId(id as types.core.AgentId);
        }
    }
}
