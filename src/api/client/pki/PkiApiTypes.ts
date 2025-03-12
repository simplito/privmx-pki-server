export interface UserIdentity {
    host: string;
    contextId: string;
    userId: string;
    userPubKey?: string;
    createDate: number;
    customData?: any;
}

export interface GetCurrentKeyModel {
    userId: string, host: string, contextId: string
}

export interface GetKeyAtModel {
    userId: string, host: string, contextId: string, date: number
}

export interface GetKeyHistoryModel {
    userId: string, host: string, contextId: string
}

export interface VerifyKeyModel {
    userId: string, host: string, contextId: string, userPubKey: string, date: number
}

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
    
}
