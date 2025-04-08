import * as types from "../../../types";

export interface RegisterModel {
    /** Your email */
    email: types.core.Email;
    /** Your password */
    password: types.core.PlainPassword;
    /** Registration Token or organization invitation Token */
    token?: types.core.TokenId;
}

export interface RegisterResult {
    /** Specifies if you need to verify your email */
    emailVerificationRequired: boolean;
}

export interface ValidateAccountTokenModel {
    /** Token's ID */
    token: types.core.TokenId;
}

export interface ResendAccountValidationTokenModel {
    /** Your email */
    email: types.core.Email;
}

export interface StartCredentialsResetModel {
    /** User email */
    email: types.core.Email;
}

export interface CheckResetCredentialsTokenModel {
    /** Token ID */
    token: types.core.TokenId
}

export interface ResetPasswordModel {
    /** Credentials change Token ID */
    token: types.core.TokenId;
    /** New password */
    newPassword: types.core.PlainPassword;
}
export interface SrpInfoResult {
    /** Available SRP groups */
    groups: Record<types.core.SrpGroupName, types.core.SrpGroup>
}

export interface StartSrpLoginModel {
    /** User email */
    email: types.core.Email
}

export interface StartSrpLoginResult {
    /** Token ID */
    loginToken: types.core.SrpToken;
    /** Group's g*/
    g: types.core.Hexadecimal;
    /** Group's N*/
    N: types.core.Hexadecimal;
    /** One-time server public key */
    B: types.core.Hexadecimal;
    /** Salt used to generate SRP verifier */
    salt: types.core.Hexadecimal;
    /** Password mixing params */
    pbkdf: types.auth.Pbkdf2Params;
}

export interface ConfirmSrpLoginForTokenModel {
    /** Token ID */
    loginToken: types.core.SrpToken;
    /** A calculated by user */
    A: types.core.Hexadecimal;
    /** M1 calculated by user */
    M1: types.core.Hexadecimal;
    /** Requested Token scope. If not given, scope is full read-write and session limited*/
    scope?: types.core.Scope[];
    /** A boolean flag indicating whether the device should bypass 2FA for future logins */
    rememberDevice?: boolean;
}

export interface SrpRegisterModel {
    /** User email */
    email: types.core.Email;
    /** SRP group chosen during registration */
    group: types.core.SrpGroupName;
    /** Salt used to generate SRP verifier */
    salt: types.core.Hexadecimal;
    /** User SRP verifier */
    verifier: types.core.Hexadecimal;
    /** Password mixing params */
    pbkdf2Params: types.auth.Pbkdf2Params;
    /** Registration Token or Organization invitation Token */
    token?: types.core.TokenId;
}

export interface ResetSrpCredentialsModel {
    /** Credentials change Token ID */
    token: types.core.TokenId;
    /** SRP group chosen during registration */
    group: types.core.SrpGroupName;
    /** Salt used to generate SRP verifier */
    salt: types.core.Hexadecimal;
    /** User SRP verifier */
    verifier: types.core.Hexadecimal;
    /** Password mixing params */
    pbkdf2Params: types.auth.Pbkdf2Params;
}

export type TokenModel = TokenClientCredentialsModel|TokenRefreshTokenModel|TokenClientSignatureModel;
export interface TokenRefreshTokenModel {
    /** Token grant type */
    grantType: "refresh_token";
    /** Refresh Token from earlier invocation */
    refreshToken: types.core.RefreshToken;
}

export interface TokenClientCredentialsModel {
    /** Token grant type */
    grantType: "client_credentials";
    /** API Key ID */
    clientId: types.auth.ClientId;
    /** API key secret */
    clientSecret: types.auth.ClientSecret;
    /** Requested Token scope */
    scope: types.core.Scope[];
}

export interface TokenClientSignatureModel {
    /** Token grant type */
    grantType: "client_signature";
    /** API key ID */
    clientId: types.auth.ClientId;
    /** EdDSA signature or Hash */
    signature: types.core.Base64;
    /** Request timestamp */
    timestamp: types.core.Timestamp;
    /** Random value used to generate signature*/
    nonce: string;
    /** Requested Token scope */
    scope: types.core.Scope[];
    /** Optional signed data */
    data?: string;
}

export interface AccessTokenResult {
    /** Access Token used in authorization*/
    accessToken: types.core.AccessToken;
    /** Access Token lifetime in milliseconds */
    accessTokenExpiresIn: types.core.Timespan;
    /** Token type */
    tokenType: "Bearer";
    /** Refresh Token that will be used to generate new Tokens */
    refreshToken: types.core.RefreshToken;
    /** Access Token lifetime in milliseconds */
    refreshTokenExpiresIn: types.core.Timespan;
    /** Created Token scope */
    scope: types.core.Scope[];
    /** Session name */
    sessionName?: types.auth.SessionName;
}

export interface LoginForTokenModel {
    /** User's email */
    email: types.core.Email;
    /** User's password */
    password: types.core.PlainPassword;
    /** Requested Token scope. If not given, scope is full read-write and session limited*/
    scope?: types.core.Scope[];
    /** A boolean flag indicating whether the device should bypass 2FA for future logins */
    rememberDevice?: boolean;
}

export interface BindAccessTokenModel {
    /** Generated earlier Access Token */
    accessToken: types.core.AccessToken;
}
export interface ForkTokenModel {
    /** Refresh Token from earlier invocation */
    refreshToken: types.core.RefreshToken;
    /** New session name */
    sessionName: types.auth.SessionName;
}

export type ConfirmSrpLoginForTokenResult = AccessTokenResult&{
    /** M2 calculated by server */
    M2: types.core.Hexadecimal;
};

export type TokenResult = AccessTokenResult;

export type ForkTokenResult = AccessTokenResult;

export type LoginForTokenResult = AccessTokenResult;

export interface ResendSecondFactorCodeModel {
    /** User's email */
    email: types.core.Email;
    /** Challenge's id */
    challengeId: types.core.ChallengeId;
}

export interface IAuthApi {
    
    /**
    *<p>Retrieve an Oauth Access Token, to be used for authentication of requests.</p>
    <p>Three methods of authentication are supported:</p>
    - ```client_credentials``` - using the client ID and client secret<br>
    - ```client_signature``` - using the client ID user generated signature. The signature is calculated using some fields provided in the request<br>
    - ```refresh_token``` - using a refresh Token that was received from an earlier invocation<br>
    <br>
    <p>The response will contain an Access Token, expiration period (number of milliseconds that the Token is valid) and a refresh Token that can be used to get a new set of Tokens.</p>
    * @param model GrantType and credentials
    * @returns accessToken, refreshToken, expirationTime, scope and sessionName(optional)
    */
    token(model: TokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<TokenResult>;
        
    /**
    * Bind Access Token to websocket, request will be executed with the given Token rights.
    * @param model Access Token
    * @returns OK
    */
    bindAccessToken(model: BindAccessTokenModel): Promise<types.core.OK>;
    
    /**
    * Generates a Token for a new named session. This method can be used only wth Tokens not bounded to the websocket connection.
    * @param model refresh Token and session name
    * @returns accessToken, refreshToken, expirationTime, scope and sessionName(optional)
    */
    forkToken(model: ForkTokenModel): Promise<ForkTokenResult>;
}
