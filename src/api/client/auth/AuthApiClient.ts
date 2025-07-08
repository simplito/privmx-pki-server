import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import * as authApi from "./AuthApiTypes";

export class AuthApiClient implements authApi.IAuthApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("auth/" + method, params);
    }
    createFirstApiKey(model: authApi.CreateFirstApiKeyModel): Promise<authApi.CreateFirstApiKeyResult> {
        return this.request("createFirstApiKey", model);
    }
    
    token(model: authApi.TokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.AccessTokenResult> {
        return this.request("token", {...model, ...(challenge || {})});
    }
    
    bindAccessToken(model: authApi.BindAccessTokenModel): Promise<types.core.OK> {
        return this.request("bindAccessToken", model);
    }
    
    forkToken(model: authApi.ForkTokenModel): Promise<authApi.ForkTokenResult> {
        return this.request("forkToken", model);
    }
}
