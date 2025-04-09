import * as types from "../../../types";
import { HostIdentity } from "../pki/PkiApiTypes";

export interface SetKeyModel {
    userId: string, userPubKey: string, instanceId: types.pki.InstanceId, contextId: string
}

export interface DeleteKeyModel {
    userId: string, instanceId: types.pki.InstanceId, contextId: string
}

export interface SetHostModel {
    hostPubKey: string, hostUrl: types.pki.HostUrl
}

export interface AddHostUrlModel {
    instanceId: types.pki.InstanceId, hostUrl: types.pki.HostUrl
}

export interface RemoveHostUrlModel {
    instanceId: types.pki.InstanceId, hostUrl: types.pki.HostUrl
}

export interface DeleteHostModel {
    instanceId: types.pki.InstanceId
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
    
    /**
     * Creates host's identity in PKI
     * @param hostPubKey
     * @param hostUrl
     */
    setHost(model: SetHostModel): Promise<types.pki.InstanceId>;
    
    /**
     * Add host's URL
     * @param instanceId
     * @param hostUrl
     */
    addHostUrl(model: AddHostUrlModel): Promise<types.core.OK>;
    
    /**
     * Remove host's URL
     * @param instanceId
     * @param hostUrl
     */
    removeHostUrl(model: RemoveHostUrlModel): Promise<types.core.OK>;
    
    /**
     * Delete host from PKI
     * @param instanceId
     */
    deleteHost(model: DeleteHostModel): Promise<types.core.OK>;
    
    /**
     * List hosts
     */
    listHosts(): Promise<HostIdentity[]>;
}
