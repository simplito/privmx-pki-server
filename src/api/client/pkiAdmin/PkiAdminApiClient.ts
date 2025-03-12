import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import * as PkiAdminApiTypes from "./PkiAdminApiTypes";

export class PkiAdminApiClient implements PkiAdminApiTypes.IPkiAdminApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("pkiadmin/" + method, params);
    }
    
    async setKey(model: PkiAdminApiTypes.SetKeyModel): Promise<types.core.OK> {
        return this.request("setKey", model);
    }
    
    deleteKey(model: PkiAdminApiTypes.DeleteKeyModel): Promise<types.core.OK> {
        return this.request("deleteKey", model);
    }
}
