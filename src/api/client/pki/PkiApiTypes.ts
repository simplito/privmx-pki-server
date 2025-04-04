import * as types from "../../../types";
export interface UserIdentity {
    instanceId: types.pki.InstanceId;
    contextId: string;
    userId: string;
    userPubKey?: string;
    createDate: number;
    customData?: any;
}

export interface HostIdentity {
    instanceId: types.pki.InstanceId;
    hostPubKey: string;
    addresses: types.pki.HostUrl[];
}

export interface HostIdentityFilter {
    instanceId?: types.pki.InstanceId;
    hostUrl?: types.pki.HostUrl;
};

export interface GetCurrentKeyModel {
    userId: string, instanceId: types.pki.InstanceId, contextId: string
}

export interface GetKeyAtModel {
    userId: string, instanceId: types.pki.InstanceId, contextId: string, date: number
}

export interface GetKeyHistoryModel {
    userId: string, instanceId: types.pki.InstanceId, contextId: string
}

export interface VerifyKeyModel {
    userId: string, instanceId: types.pki.InstanceId, contextId: string, userPubKey: string, date: number
}

export interface VerifyHostByIdModel {
    instanceId: types.pki.InstanceId;
    hostUrl: types.pki.HostUrl;
}
export interface VerifyHostByPubModel {
    hostPubKey: string;
    hostUrl: types.pki.HostUrl;
}

export type GetHostModel = HostIdentityFilter;

export interface IPkiApi {
    
    /**
     * Retrieves the current public key of a user. Returns `null` if no key is found.
     * @param userId
     * @param host
     * @param contextId
     */
    getCurrentKey(model: GetCurrentKeyModel): Promise<UserIdentity>;
    
    /**
     * Returns the public key that was assigned to the user at the specified date. Returns `null` if no key was assigned at that time.
     * @param userId
     * @param host
     * @param contextId
     * @param date
     */
    getKeyAt(model: GetKeyAtModel): Promise<UserIdentity>;
    
    /**
     * Returns the modification history of the user's public key. If a key was deleted, the `pubKey` field is `null`.
     * @param userId
     * @param host
     * @param contextId
     */
    getKeyHistory(model: GetKeyHistoryModel): Promise<UserIdentity[]>;
    
    /**
     * Verifies whether the given public key was assigned to the user at the specified date.
     * @param userId
     * @param host
     * @param contextId
     * @param usePubKey
     * @param date
     */
   verifyKey(model: VerifyKeyModel): Promise<boolean>;

    /**
     * Verifies the HostIdentity by the given instanceId and hostUrl.
     * @param instanceId
     * @param hostPubKey
     * @param addresses
     */
    verifyHostById(model: VerifyHostByIdModel): Promise<boolean>;
 
   /**
     * Verifies the HostIdentity by the given instanceId and hostUrl.
     * @param instanceId
     * @param hostPubKey
     * @param addresses
     */
    verifyHostByPub(model: VerifyHostByPubModel): Promise<boolean>;
    
    /**
     * Gets the HostIdentity by the given filter.
     * @param instanceId
     * @param hostPubKey
     * @param addresses
     */
    getHost(model: GetHostModel): Promise<HostIdentity>;
    
}
