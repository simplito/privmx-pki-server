import * as types from "../../../types";

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

export interface IUserApi {
    
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
}
