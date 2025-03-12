import * as types from ".";

export type SessionId = string&{__sessionId: never};
export type ClientId = string&{__clientId: never};
export type ClientSecret = string&{__clientSecret: never};
export type ApiKeyName = string&{__apiKeyName: never};
export type SessionName = string&{__sessionName: never};

export interface Pbkdf2Params {
    /** Salt used to mix password */
    salt: types.core.Hexadecimal;
    /** Number of pbkdf2 rounds */
    rounds: number;
}

export type OAuth2Token = OAuth2AccessToken|OAuth2RefreshToken;
export interface OAuth2AccessToken {
    type: "accessToken";
    createDate: types.core.Timestamp;
    expires: types.core.Timestamp;
    sessionId: SessionId;
    seq: number;
    connectionId?: types.core.ConnectionId;
}

export interface OAuth2RefreshToken {
    type: "refreshToken";
    createDate: types.core.Timestamp;
    expires: types.core.Timestamp;
    sessionId: SessionId;
    seq: number;
    connectionId?: types.core.ConnectionId;
    accessTokenTTL?: types.core.Timespan;
}

export interface ApiKeyRecord {
    apiKeyId: types.auth.ClientId,
    name: string;
    clientPublicKey?: types.core.PubKey;
    clientSecret?: types.auth.ClientSecret;
    maxScope: types.core.Scope[];
    enabled: boolean
}

export interface ScopeObject {
    scope: types.core.Scope[];
    sessionName?: SessionName;
    ipAddress?: types.core.IpAddress;
    connectionLimited?: boolean;
    agentLimited?: boolean;
    expiresIn?: types.core.Timespan;
}

export interface ChallengeModel {
    challenge: types.core.ChallengeId;
    authorizationData: string;
}

export interface SecondFactorRequired {
    secondFactorRequired: true;
    secondFactorInfo: string;
    challenge: types.core.ChallengeId;
}

export type SecondFactorChallengeData = TotpSecondFactorChallengeData|EmailSecondFactorChallengeData;

export interface TotpSecondFactorChallengeData {
    type: "totp";
    secret: types.user.SecondFactorSecret;
    attempts: number;
    lastAttempt?: types.core.Timestamp;
}

export interface EmailSecondFactorChallengeData {
    type: "email";
    code: types.core.SecondFactorAuthorizationCode;
    sendingsCount: number;
    attempts: number;
    requestParamsHash: string;
}
