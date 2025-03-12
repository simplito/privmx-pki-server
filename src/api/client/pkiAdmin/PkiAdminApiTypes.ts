import * as types from "../../../types";

export interface SetKeyModel {
    userId: string, userPubKey: string, host: string, contextId: string
}

export interface DeleteKeyModel {
    userId: string, host: string, contextId: string
}

export interface IPkiAdminApi {
    
    /**
     * Sets a new public key for a user or updates an existing one.
     * @param userId
     * @param userPubKey
     * @param host
     * @param contextId
     */
    setKey(model: SetKeyModel): Promise<types.core.OK>;
    
    /**
     *  Deletes a user’s public key
     * @param userId
     * @param host
     * @param contextId
     */
    deleteKey(model: DeleteKeyModel): Promise<types.core.OK>;
    
}
