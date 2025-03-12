import { Requester } from "../../../CommonTypes";
import * as types from "../../../types";
import * as authApi from "./AuthApiTypes";

export class AuthApiClient implements authApi.IAuthApi {
    
    constructor(private requester: Requester) {
    }
    
    private request<T>(method: string, params: unknown): Promise<T> {
        return this.requester.request("auth/" + method, params);
    }
    
    startCredentialsReset(model: authApi.StartCredentialsResetModel): Promise<types.core.OK> {
        return this.request("startCredentialsReset", model);
    }
    
    checkResetCredentialsToken(model: authApi.CheckResetCredentialsTokenModel): Promise<types.core.OK> {
        return this.request("checkResetCredentialsToken", model);
    }
    
    resetPassword(model: authApi.ResetPasswordModel): Promise<types.core.OK> {
        return this.request("resetPassword", model);
    }
    
    resetSrpCredentials(model: authApi.ResetSrpCredentialsModel): Promise<types.core.OK> {
        return this.request("resetSrpCredentials", model);
    }
    
    register(model: authApi.RegisterModel): Promise<authApi.RegisterResult> {
        return this.request("register", model);
    }
    
    validateAccountToken(model: authApi.ValidateAccountTokenModel): Promise<types.core.OK> {
        return this.request("validateAccountToken", model);
    }
    
    resendAccountValidationToken(model: authApi.ResendAccountValidationTokenModel): Promise<types.core.OK> {
        return this.request("resendAccountValidationToken", model);
    }
    
    srpRegister(model: authApi.SrpRegisterModel): Promise<authApi.RegisterResult> {
        return this.request("srpRegister", model);
    }
    
    getSrpInfo(): Promise<authApi.SrpInfoResult> {
        return this.request("getSrpInfo", {});
    }
    
    startSrpLogin(model: authApi.StartSrpLoginModel): Promise<authApi.StartSrpLoginResult> {
        return this.request("startSrpLogin", model);
    }
    
    token(model: authApi.TokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.AccessTokenResult> {
        return this.request("token", {...model, ...(challenge || {})});
    }
    
    loginForToken(model: authApi.LoginForTokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.LoginForTokenResult> {
        return this.request("loginForToken", {...model, ...(challenge || {})});
    }
    
    bindAccessToken(model: authApi.BindAccessTokenModel): Promise<types.core.OK> {
        return this.request("bindAccessToken", model);
    }
    
    forkToken(model: authApi.ForkTokenModel): Promise<authApi.ForkTokenResult> {
        return this.request("forkToken", model);
    }
    
    confirmSrpLoginForToken(model: authApi.ConfirmSrpLoginForTokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.ConfirmSrpLoginForTokenResult> {
        return this.request("confirmSrpLoginForToken", {...model, ...(challenge || {})});
    }
    
    resendSecondFactorCode(model: authApi.ResendSecondFactorCodeModel): Promise<types.core.OK> {
        return this.request("resendSecondFactorCode", model);
    }
}
