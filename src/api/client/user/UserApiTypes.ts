import * as types from "../../../types";

export interface GetProfileResult {
    /** User's profile info */
    profile: types.user.User;
}

export interface SetProfileModel {
    /** User's name */
    name: types.user.Username;
}

export interface GetInfoResult {
    /** User's profile info */
    profile: types.user.User;
}

export interface ResendSecondFactorCodeModel {
    /** Challenge ID */
    challengeId: types.core.ChallengeId
}

export interface ChangePasswordModel {
    /** Current user password */
    currentPassword: types.core.PlainPassword,
    /** New user password */
    newPassword: types.core.PlainPassword
}

export interface ConfirmSrpCredentialsChangeModel {
    /** Token ID */
    credentialsChangeToken: types.core.TokenId;
    /** A calculated by user */
    A: types.core.Hexadecimal;
    /** M1 calculated by user */
    M1: types.core.Hexadecimal;
    /** SRP group chosen during registration */
    group: types.core.SrpGroupName;
    /** Salt used to generate SRP verifier */
    salt: types.core.Hexadecimal;
    /** User SRP verifier */
    verifier: types.core.Hexadecimal;
    /** Password mixing params */
    pbkdf2Params: types.auth.Pbkdf2Params;
}

export interface StartSrpCredentialsChangeResult {
    /** Token ID */
    credentialsChangeToken: types.core.TokenId;
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

export interface SubscribeToChannelModel {
    /** Channels list */
    channels: types.core.ChannelName[];
}

export interface UnsubscribeFromChannelModel {
    /** Channels list */
    channels: types.core.ChannelName[];
}

export type AddApiKeyModel = AddApiKeyWithPubKeyModel|AddApiKeyWithSecretModel;
export interface AddApiKeyWithPubKeyModel {
    /** Type of API key */
    type: "pubKey";
    /** ApiKey name */
    name: types.auth.ApiKeyName;
    /** ED25519 PEM encoded public key */
    clientPubKey: types.core.PubKey;
    /** ApiKey max scope, affects possible requests and scope of tokens created using this key */
    maxScope: types.core.Scope[];
}
export interface AddApiKeyWithSecretModel {
    /** Type of API key */
    type: "secret";
    /** ApiKey name */
    name: types.auth.ApiKeyName;
    /** Client secret used for authorization */
    clientSecret: types.auth.ClientSecret;
    /** ApiKey max scope, affects possible requests and scope of tokens created using this key */
    maxScope: types.core.Scope[];
}
export interface AddApiKeyResult {
    /** ApiKey ID */
    apiKeyId: types.auth.ClientId;
}

export interface DeleteApiKeyModel {
    /** ApiKey ID */
    apiKeyId: types.auth.ClientId;
}

export interface UpdateApiKeyModel {
    /** ApiKey ID */
    apiKeyId: types.auth.ClientId;
    /** ApiKey name */
    name?: types.auth.ApiKeyName,
    /** ApiKey status  */
    enabled?: boolean,
    /** ApiKey max scope */
    maxScope?: types.core.Scope[],
}

export interface GetApiKeyModel {
    /** ApiKey ID */
    apiKeyId: types.auth.ClientId;
}

export interface GetApiKeyResult {
    /** ApiKey info */
    apiKey: types.auth.ApiKeyRecord
}

export interface ListApiKeysResult {
    /** list of ApiKeys */
    list: types.auth.ApiKeyRecord[]
}

export interface ChallengeInfo {
    /** Method info */
    info: string,
    /** Challenge ID */
    challengeId: types.core.ChallengeId,
}

export type EnableSecondFactorModel = EmailSecondFactorEnableModel | TotpSecondFactorEnableModel;

export interface EmailSecondFactorEnableModel {
    /** Type of used 2FA method */
    type: "email";
}
export interface TotpSecondFactorEnableModel {
    /** Type of used 2FA method */
    type: "totp";
    /** Application secret code */
    secret: types.user.SecondFactorSecret;
}

export type DisableSecondFactorResult = ChallengeInfo

export type EnableSecondFactorResult = ChallengeInfo

export interface ConfirmEnablingOfSecondFactorModel {
    /** Authorization data */
    authorizationData: types.core.SecondFactorAuthorizationCode,
    /** Challenge ID */
    challengeId: types.core.ChallengeId;
    /** Wheter device should be remebered or not */
    rememberDevice: boolean
}

export interface ConfirmDisablingOfSecondFactorModel  {
    /** Authorization data */
    authorizationData: types.core.SecondFactorAuthorizationCode,
    /** Challenge ID */
    challengeId: types.core.ChallengeId,
}

export interface IUserApi {
    
    /**
    * Check authorization
    * @returns "OK"
    */
    checkAuthorization(): Promise<types.core.OK>;
    
    /**
    * Changes password of user
    * @param model current and new passwords
    * @returns "OK"
    */
    changePassword(model: ChangePasswordModel): Promise<types.core.OK>;
    
    /**
    * Starts process of changing srp credentials
    * @returns srp parameters needed for second step verification and passwordChangeToken
    */
    startSrpCredentialsChange(): Promise<StartSrpCredentialsChangeResult>;
    
    /**
    * Changes srp credentials of user
    * @param model SRP and pbkdf2 credentials
    * @returns "OK"
    */
    confirmSrpCredentialsChange(model: ConfirmSrpCredentialsChangeModel): Promise<types.core.OK>;
    
    /**
    * Enables second factor authentication
    * @param model type of authorization "email" or "totp" and secret (for totp only)
    * @returns "OK"
    */
    enableSecondFactor(model: EnableSecondFactorModel): Promise<EnableSecondFactorResult>;
    
    /**
    * Verifies second factor authentication
    * @param model secondFactorToken, code, rememberDevice
    * @returns "OK"
    */
    confirmEnablingOfSecondFactor(model: ConfirmEnablingOfSecondFactorModel): Promise<types.core.OK>;
    
    /**
    * Disables second factor authentication
    * @returns "OK"
    */
    disableSecondFactor(): Promise<DisableSecondFactorResult>;
    
    /**
    * Verifies second factor authentication
    * @param model secondFactorToken, code
    * @returns "OK"
    */
    confirmDisablingOfSecondFactor(model: ConfirmDisablingOfSecondFactorModel): Promise<types.core.OK>;
    
    /**
    * Re-sends 2FA code
    * @param model tokenId
    * @returns "OK"
    */
    resendSecondFactorCode(model: ResendSecondFactorCodeModel): Promise<types.core.OK>;
    
    /**
    * Gets User's profile
    * @returns profile
    */
    getProfile(): Promise<GetProfileResult>;
    
    /**
    * Sets User's profile
    * @param model User's name
    * @returns "OK"
    */
    setProfile(model: SetProfileModel): Promise<types.core.OK>;
    
    /**
    * Gets User's profile, Organization's profile, and list of Instances
    * @returns User's profile and Organizations
    */
    getInfo(): Promise<GetInfoResult>;
    
    /**
    * Subscribes websocket to channel to receive notifications, list of possible notifications <a href="#notifications">here</a>
    * @param model channel's name
    * @returns User's profile and Organizations
    */
    subscribeToWebSocketChannel(model: SubscribeToChannelModel): Promise<types.core.OK>;
    
    /**
    * Unsubscribes websocket from channel
    * @param model channel's name
    * @returns User's profile and organizations
    */
    unsubscribeFromWebSocketChannel(model: UnsubscribeFromChannelModel): Promise<types.core.OK>;
    
    /**
    * Adds new ApiKey (up to limit of 10)
    * @param model ApiKey name, scope and secret or public key
    * @returns ApiKey ID
    */
    addApiKey(model: AddApiKeyModel): Promise<AddApiKeyResult>;
    
    /**
    * Deletes ApiKey
    * @param model ApiKey ID
    * @returns OK
    */
    deleteApiKey(model: DeleteApiKeyModel): Promise<types.core.OK>;
    
    /**
    * updates given ApiKey
    * @param model ApiKey ID, name, scope, status
    * @returns OK
    */
    updateApiKey(model: UpdateApiKeyModel): Promise<types.core.OK>
    
    /**
    * Returns info about ApiKey
    * @param model ApiKey ID
    * @returns ApiKey info
    */
    getApiKey(model: GetApiKeyModel): Promise<GetApiKeyResult>;
    
    /**
    * lists all ApiKeys
    * @returns list of ApiKeys
    */
    listApiKeys(): Promise<ListApiKeysResult>;
    
    /**
    * removes all remebered devices
    * @returns OK
    */
    forgetAllDevices(): Promise<types.core.OK>;
}
