import { TokenEncodingService } from "./TokenEncodingService";
import * as types from "../types";
import { AppException } from "../api/AppException";
import { DateUtils } from "../utils/DateUtils";
import { ConfigService } from "./ConfigService";
import * as db from "../db/Model";
import { Utils } from "../utils/Utils";

export interface OAuthTokenModel {
    sessionId: types.auth.SessionId;
    seq: number;
    connectionId?: types.core.ConnectionId
}

export class OauthTokenService {
    constructor(
        private tokenEncodingService: TokenEncodingService,
        private configService: ConfigService,
    ) {}
    
    async encodeAccessToken(tokenModel: OAuthTokenModel, key: db.TokenEncryptionKey, accessTokenTtl?: types.core.Timespan) {
        const now = DateUtils.now();
        const expiresIn = accessTokenTtl ? accessTokenTtl : this.configService.values.accessTokenLifetime;
        const token: types.auth.OAuth2AccessToken = {
            ...tokenModel,
            type: "accessToken",
            createDate: now,
            expires: DateUtils.getExpirationDate(expiresIn, now),
        };
        return {expiresIn, expires: token.expires, token: await this.tokenEncodingService.encode(token, key) as types.core.AccessToken};
    }
    
    async encodeRefreshToken(tokenModel: OAuthTokenModel, key: db.TokenEncryptionKey, accessTokenTTL?: types.core.Timespan) {
        const now = DateUtils.now();
        const expiresIn = key.refreshTokenTTL;
        const token: types.auth.OAuth2RefreshToken = {
            ...tokenModel,
            type: "refreshToken",
            createDate: now,
            expires: DateUtils.getExpirationDate(expiresIn, now),
            accessTokenTTL,
        };
        return {expiresIn, expires: token.expires, token: await this.tokenEncodingService.encode(token, key) as types.core.RefreshToken};
    }
    
    async decodeAccessToken(token: types.core.AccessToken): Promise<types.auth.OAuth2AccessToken> {
        const decodedToken = await Utils.tryPromise(() => this.tokenEncodingService.decode(token));
        if (decodedToken.success === false || !this.isOAuth2Token(decodedToken.result) || decodedToken.result.type !== "accessToken") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
        return decodedToken.result;
    }
    
    async decodeRefreshToken(token: types.core.RefreshToken): Promise<types.auth.OAuth2RefreshToken> {
        const decodedToken = await Utils.tryPromise(() => this.tokenEncodingService.decode(token));
        if (decodedToken.success === false || !this.isOAuth2Token(decodedToken.result) || decodedToken.result.type !== "refreshToken") {
            throw new AppException("TOKEN_DOES_NOT_EXIST");
        }
        return decodedToken.result;
    }
    
    private isOAuth2Token(token: unknown): token is types.auth.OAuth2Token {
        return !!token && typeof(token) === "object" &&
            "type" in token && typeof(token.type) === "string" && (token.type === "accessToken" || token.type === "refreshToken") &&
            "expires" in token && typeof(token.expires) === "number" &&
            "createDate" in token && typeof(token.createDate) === "number" &&
            "sessionId" in token && typeof(token.sessionId) === "string" &&
            "seq" in token && typeof(token.seq) === "number" &&
            (!("connectionId" in token) || typeof(token.connectionId) === "string");
    };
}
