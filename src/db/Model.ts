import { ObjectId } from "mongodb";
import * as types from "../types";
import { SrpGroupName } from "privmx-srp";
import { ApiUserId } from "../types/auth";

export type Searchable = string;
export type Ouath2TokenId = string&{__ouath2TokenId: never};
export type TokenEncryptionKeyId = types.core.Hexadecimal&{__cipherKeyId: never};
export type EncryptionKey = types.core.Hexadecimal&{__cipherKey: never};

export interface Session {
    _id: types.auth.SessionId;
    createDate: types.core.Timestamp;
    name: types.auth.SessionName;
    lastAccessDate: types.core.Timestamp;
    user: types.user.UserId;
    deviceId: types.core.AgentId;
    tokenInfo?: TokenSessionInfo;
}

export interface TokenSessionInfo {
    seq: number;
    userId: types.user.UserId;
    scope: types.core.Scope[];
    expiresAt: types.core.Timestamp;
    sessionLimited?: types.core.AgentId;
    clientId?: types.auth.ClientId;
    grants?: types.core.GrantType[];
    ipAddress?: types.core.IpAddress;
}

export type UserCredentials = SrpCredentials|PasswordCredentials;

export interface SrpCredentials {
    type: "srp";
    verifier: types.core.Hexadecimal;
    salt: types.core.Hexadecimal;
    group: SrpGroupName;
    pbkdf: types.auth.Pbkdf2Params;
};

export interface PasswordCredentials {
    type: "password";
    password: types.core.HashedPassword;
}

export type EventData = LoginEventData;

export interface LoginEventData {
    type: "loginEvent";
    userId: types.user.UserId;
    ipAddress: types.core.IpAddress;
}

export interface Event {
    _id: types.core.EventId;
    date: types.core.Timestamp;
    eventData: EventData;
}

export interface User {
    _id: types.user.UserId;
    createDate: types.core.Timestamp;
    lastPasswordChange: types.core.Timestamp;
    modDate: types.core.Timestamp;
    email: types.core.LEmail;
    name: types.user.Username;
    credentials: UserCredentials;
    activated: boolean;
    blocked: boolean;
    searchable: Searchable;
    secondFactor?: SecondFactor;
    possibleLoginAttackTarget?: types.core.Timestamp;
    possibleTotpAttackTarget?: types.core.Timestamp;
}

export type SecondFactor = EmailSecondFactor | TotpSecondFactor;
export type SecondFactorSecret = string&{__secondFactorSecret: never};

export interface EmailSecondFactor {
    type: "email";
    knownDevices: types.core.AgentId[];
}

export interface  TotpSecondFactor {
    type: "totp";
    knownDevices: types.core.AgentId[];
    secret: types.user.SecondFactorSecret;
}

export interface Token {
    _id: types.core.TokenId;
    createDate: types.core.Timestamp;
    expirationDate?: types.core.Timestamp,
    data: TokenData;
    searchable: Searchable;
}
export interface ApiKey {
    _id: types.auth.ClientId;
    name: types.auth.ApiKeyName;
    publicKey?: types.core.PubKey;
    clientSecret: types.auth.ClientSecret;
    user: types.user.UserId;
    maxScope: types.core.Scope[];
    enabled: boolean;
}

export type TokenData = ActivateAccountTokenData|CredentialsResetToken|SrpCredentialsChangeTokenData|TotpCodeTokenData;

export interface SrpCredentialsChangeTokenData {
    type: "srpCredentialsChange";
    user: types.user.UserId;
    group: SrpGroupName;
    b: types.core.Hexadecimal;
    B: types.core.Hexadecimal;
    v: types.core.Hexadecimal;
}

export interface TotpCodeTokenData {
    type: "totpCode";
    code: string;
    user: types.user.UserId;
    usedAt: types.core.Timestamp,
}

export interface ActivateAccountTokenData {
    type: "activateAccount";
    user: types.user.UserId;
}

export interface CredentialsResetToken {
    type: "credentialsReset";
    user: types.user.UserId;
}

export type ManagerId = string&{__managerId: never};

export interface MailTemplate {
    _id: types.mail.MailId;
    name: types.mail.MailName;
    html: {[lang: string]: types.mail.MailTemplateHtml};
    updates: {user: ManagerId; date: types.core.Timestamp;}[];
    searchable: Searchable;
}

export interface MailLog {
    _id: types.mail.MailLogId;
    created: types.core.Timestamp;
    startDate: types.core.Timestamp;
    endDate: types.core.Timestamp;
    options: types.mail.SendExOptions;
    sendingOptions: types.mail.SendMailOptions|null;
    sendMailResult: any;
    error: string|null;
    bounced: types.core.Timestamp|null;
    searchable: Searchable;
}

export interface TokenEncryptionKey {
    _id: TokenEncryptionKeyId;
    key: EncryptionKey;
    createDate: types.core.Timestamp;
    usageExpiryDate: types.core.Timestamp;
    expiryDate: types.core.Timestamp;
    refreshTokenTTL: types.core.Timespan;
}

export interface UserIdentityRecord {
    _id: ObjectId;
    instanceId: types.pki.InstanceId;
    contextId: string;
    userId: string;
    userPubKey?: string;
    createDate: number;
    customData?: unknown;
}

export interface HostIdentityRecord {
    _id?: ObjectId;
    instanceId: types.pki.InstanceId;
    hostPubKey: string;
    addresses: types.pki.HostUrl[];
    createDate: number;
}

export interface ApiUserRecord {
    _id: ObjectId;
    id: ApiUserId;
    created: types.core.Timestamp;
    enabled: boolean;
}

