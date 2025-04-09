import * as types from "../../../types";

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

export type TokenResult = AccessTokenResult;

export type ForkTokenResult = AccessTokenResult;

export type LoginForTokenResult = AccessTokenResult;

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
