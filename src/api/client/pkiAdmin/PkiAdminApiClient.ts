import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import { HostIdentity } from "../pki/PkiApiTypes";
import * as PkiAdminApiTypes from "./PkiAdminApiTypes";

export class PkiAdminApiClient implements PkiAdminApiTypes.IPkiAdminApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("pkiadmin/" + method, params);
    }
    
    setKey(model: PkiAdminApiTypes.SetKeyModel): Promise<types.core.OK> {
        return this.request("setKey", model);
    }
    
    deleteKey(model: PkiAdminApiTypes.DeleteKeyModel): Promise<types.core.OK> {
        return this.request("deleteKey", model);
    }

    setHost(model: PkiAdminApiTypes.SetHostModel): Promise<types.pki.InstanceId> {
        return this.request("setHost", model);
    }

    addHostUrl(model: PkiAdminApiTypes.AddHostUrlModel): Promise<types.core.OK> {
        return this.request("addHostUrl", model);
    }

    removeHostUrl(model: PkiAdminApiTypes.RemoveHostUrlModel): Promise<types.core.OK> {
        return this.request("removeHostUrl", model);
    }

    deleteHost(model: PkiAdminApiTypes.DeleteHostModel): Promise<types.core.OK> {
        return this.request("deleteHost", model);
    }

    listHosts(): Promise<HostIdentity[]> {
        return this.request("listHosts", {});
    }
}
