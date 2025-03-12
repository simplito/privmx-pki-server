import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import * as userApi from "./UserApiTypes";

export class UserApiClient implements userApi.IUserApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("user/" + method, params);
    }
    
    checkAuthorization(): Promise<types.core.OK> {
        return this.request("checkAuthorization", {});
    }
    
    changePassword(model: userApi.ChangePasswordModel): Promise<types.core.OK> {
        return this.request("changePassword", model);
    }
    
    startSrpCredentialsChange(): Promise<userApi.StartSrpCredentialsChangeResult> {
        return this.request("startSrpCredentialsChange", {});
    }
    
    confirmSrpCredentialsChange(model: userApi.ConfirmSrpCredentialsChangeModel): Promise<types.core.OK> {
        return this.request("confirmSrpCredentialsChange", model);
    }
    
    enableSecondFactor(model: userApi.EnableSecondFactorModel): Promise<userApi.EnableSecondFactorResult> {
        return this.request("enableSecondFactor", model);
    }
    
    confirmEnablingOfSecondFactor(model: userApi.ConfirmEnablingOfSecondFactorModel): Promise<types.core.OK> {
        return this.request("confirmEnablingOfSecondFactor", model);
    }
    
    disableSecondFactor(): Promise<userApi.DisableSecondFactorResult> {
        return this.request("disableSecondFactor", {});
    }
    
    confirmDisablingOfSecondFactor(model: userApi.ConfirmDisablingOfSecondFactorModel): Promise<types.core.OK> {
        return this.request("confirmDisablingOfSecondFactor", model);
    }
    
    resendSecondFactorCode(model: userApi.ResendSecondFactorCodeModel): Promise<types.core.OK> {
        return this.request("resendSecondFactorCode", model);
    }
    
    getProfile(): Promise<userApi.GetProfileResult> {
        return this.request("getProfile", {});
    }
    
    setProfile(model: userApi.SetProfileModel): Promise<types.core.OK> {
        return this.request("setProfile", model);
    }
    
    getInfo(): Promise<userApi.GetInfoResult> {
        return this.request("getInfo", {});
    }
    subscribeToWebSocketChannel(model: userApi.SubscribeToChannelModel): Promise<types.core.OK> {
        return this.request("subscribeToWebSocketChannel", model);
    }
    
    unsubscribeFromWebSocketChannel(model: userApi.UnsubscribeFromChannelModel): Promise<types.core.OK> {
        return this.request("unsubscribeFromWebSocketChannel", model);
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
    
    forgetAllDevices(): Promise<types.core.OK> {
        return this.request("forgetAllDevices", {});
    }
}
