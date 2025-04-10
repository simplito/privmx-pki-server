import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import * as userApi from "./UserApiTypes";

export class UserApiClient implements userApi.IUserApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("user/" + method, params);
    }
    
    addApiKey(model: userApi.AddApiKeyModel, challenge?: types.auth.ChallengeModel): Promise<userApi.AddApiKeyResult> {
        return this.request("addApiKey",  {...model, ...(challenge || {})});
    }
    
    deleteApiKey(model: userApi.DeleteApiKeyModel, challenge?: types.auth.ChallengeModel): Promise<types.core.OK> {
        return this.request("deleteApiKey", {...model, ...(challenge || {})});
    }
    
    updateApiKey(model: userApi.UpdateApiKeyModel, challenge?: types.auth.ChallengeModel): Promise<types.core.OK> {
        return this.request("updateApiKey", {...model, ...(challenge || {})});
    }
    
    getApiKey(model: userApi.GetApiKeyModel): Promise<userApi.GetApiKeyResult> {
        return this.request("getApiKey", model);
    }
    
    listApiKeys(): Promise<userApi.ListApiKeysResult> {
        return this.request("listUserTokens", {});
    }
}
