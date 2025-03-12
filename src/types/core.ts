export type OK = "OK";
export type Pong = "pong";
export type Base64 = string&{__base64: never};

export type Base58 = string&{__base58: never};
export type Hexadecimal = string&{__hexadecimal: never};
export type EccPubKey = Base58&{__eccPubKey: never};

export type Timestamp = number&{__timestamp: never};
export type Timespan = number&{__timespan: never};
export type Url = string&{__url: never};
export type Email = string&{__email: never};
/** Email in lowercase */
export type LEmail = Email&{__lemail: never};
export type Uint = number&{__uint: never};
export type PlainPassword = string&{__plainPassword: never};
export type HashedPassword = string&{__hashedPassword: never};
export type EccWif = string&{__eccWif: never};
export type SortOrder = "desc"|"asc";
export type Language = string&{__language: never};
export type TokenId = string&{__tokenId: never};
export type EventId = string&{__eventId: never};
export type Query = string&{__query: never};
export type Scope = string&{__scope: never};
export type SecondFactorAuthorizationCode = string&{__secondFactorAuthorizationCode: never};
export type IpAddress = string&{__ipAdress: never};
export type SrpGroupName = "the1024bit" | "the1536bit" | "the2048bit" | "the3072bit" | "the4096bit" | "the6144bit" | "the8192bit";
export type Comparator = "gte" | "lte" | "gt" | "lt" | "eq";
export type GrantType = "authorization_code" | "refresh_token" | "client_credentials";
export type Filter<T = string> = InArrayFilter<T>|ExactStringFilter<T>|ContainsStringFilter<T>|NumericComparisonFilter<T>|InRangeFilter<T>;
export type SizeInBytes = number&{__sizeInBytes: never};
export type ChannelName = string&{__channelName: never};
export type ApiKey = string&{__apiKey: never};
export type PubKey = string&{__pubKey: never};
export type PrivKey = string&{__privKey: never};
export type ConnectionId = string&{__connectionId: never};
export type AccessToken = string&{__apiAccessToken: never};
export type RefreshToken = string&{__apiRefreshToken: never};
export type OauthAuthorizationCode = string&{__oauthAuthorizationCode: never};
export type AgentId = Hexadecimal&{__agentId: never};
export type ChallengeId = Hexadecimal&{__challengeId: never};
export type DockerRegistryAuth = string&{__dockerRegistryAuth: never};
export type SrpToken = string&{__srpToken: never};
export interface InArrayFilter<T> {
    type: "inArray";
    fieldName: T;
    values: string[];
}

export interface ExactStringFilter<T> {
    type: "exactString";
    fieldName: T;
    value: string;
}

export interface ContainsStringFilter<T> {
    type: "containsString";
    fieldName: T;
    value: string;
}

export interface NumericComparisonFilter<T> {
    type: "numericComparison";
    fieldName: T;
    comparator: Comparator;
    value: number;
}

export interface InRangeFilter<T> {
    type: "inRange";
    fieldName: T;
    min: number;
    max: number;
}
export interface SrpGroup {
    name: SrpGroupName;
    N: Hexadecimal;
    g: Hexadecimal;
}

export interface ListModel {
    /** skip given number of elements */
    skip: number;
    /** the number of elements you want to fetch */
    limit: number;
    /** sorting order */
    sortOrder: SortOrder;
    /** query string */
    query?: Query;
    /** last record id */
    lastId?: string;
}

