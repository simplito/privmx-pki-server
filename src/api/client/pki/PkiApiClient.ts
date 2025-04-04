import { Requester } from "../../../CommonTypes";
import * as PkiApiTypes from "./PkiApiTypes";
import { UserIdentity } from "./PkiApiTypes";

export class PkiApiClient implements PkiApiTypes.IPkiApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("pki/" + method, params);
    }
    
    getCurrentKey(model: PkiApiTypes.GetCurrentKeyModel): Promise<UserIdentity> {
        return this.request("getCurrentKey", model);
        
    }
    
    getKeyAt(model: PkiApiTypes.GetKeyAtModel): Promise<UserIdentity> {
        return this.request("getKeyAt", model);
        
    };
    
    getKeyHistory(model: PkiApiTypes.GetKeyHistoryModel): Promise<UserIdentity[]> {
        return this.request("getKeyHistory", model);
        
    }
    
    verifyKey(model: PkiApiTypes.VerifyKeyModel): Promise<boolean> {
        return this.request("verifyKey", model);
    }
    
    verifyHostById(model: PkiApiTypes.VerifyHostByIdModel): Promise<boolean> {
        return this.request("verifyHost", model);
    }

    verifyHostByPub(model: PkiApiTypes.VerifyHostByPubModel): Promise<boolean> {
        return this.request("verifyHost", model);
    }

    getHost(model: PkiApiTypes.GetHostModel): Promise<PkiApiTypes.HostIdentity> {
        return this.request("getHost", model);
    }
}
