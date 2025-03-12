import { BaseApi } from "../../BaseApi";
import * as types from "../../../types";
import * as db from "../../../db/Model";
import { ApiMethod } from "../../Decorators";
import { AuthApiValidator } from "./AuthApiValidator";
import { RegistrationService } from "../../../service/RegistrationService";
import { AuthorizationService } from "../../../requestScopeService/AuthorizationService";
import { AppException } from "../../AppException";
import { Utils } from "../../../utils/Utils";
import { SrpAuthenticationService } from "../../../service/SrpAuthenticationService";
import { MailValidator } from "../../../service/mail/MailValidator";
import * as authApi from "./AuthApiTypes";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { SecondFactorService } from "../../../service/SecondFactorService";
import { UserService } from "../../../service/UserService";

export class AuthApi extends BaseApi implements authApi.IAuthApi {
    
    constructor(
        private authorizationService: AuthorizationService,
        private userService: UserService,
        private registrationService: RegistrationService,
        private srpAuthenticationService: SrpAuthenticationService,
        private mailValidator: MailValidator,
        private authorizationHolder: AuthorizationHolder,
        private secondFactorService: SecondFactorService,
    ) {
        super(new AuthApiValidator());
    }
    
    @ApiMethod({})
    async bindAccessToken(model: authApi.BindAccessTokenModel): Promise<types.core.OK> {
        await this.authorizationService.bindAccessToken(model.accessToken);
        return "OK";
    }
    
    @ApiMethod({})
    async getSrpInfo(): Promise<authApi.SrpInfoResult> {
        const groups = this.srpAuthenticationService.getSrpInfo();
        return {groups};
    }
    
    @ApiMethod({errorCodes: ["INVALID_EMAIL"]})
    async srpRegister(model: authApi.SrpRegisterModel): Promise<authApi.RegisterResult> {
        const credentials: db.SrpCredentials = {
            type: "srp",
            group: model.group,
            salt: model.salt,
            verifier: model.verifier,
            pbkdf: model.pbkdf2Params,
        };
        await this.mailValidator.validateEmail(model.email);
        const user = await this.registrationService.registerUser(Utils.prepareEmail(model.email), credentials);
        return {emailVerificationRequired: !user.activated};
    }
    
    @ApiMethod({
        errorCodes: ["SRP_NOT_ENABLED_FOR_THIS_ACCOUNT"],
        additionalCost: 100,
    })
    async startSrpLogin(model: authApi.StartSrpLoginModel): Promise<authApi.StartSrpLoginResult> {
        const firstStepSrpLoginResult = await this.authorizationService.startSrpLogin(Utils.prepareEmail(model.email));
        return firstStepSrpLoginResult;
    }
    
    @ApiMethod({})
    async startCredentialsReset(model: authApi.StartCredentialsResetModel): Promise<types.core.OK> {
        await this.userService.sendEmailWithCredentialsResetTokenIfUserExists(Utils.prepareEmail(model.email));
        return "OK";
    }
    
    @ApiMethod({errorCodes: ["TOKEN_DOES_NOT_EXIST"]})
    async checkResetCredentialsToken(model: authApi.CheckResetCredentialsTokenModel): Promise<types.core.OK> {
        await this.userService.checkResetCredentialsToken(model.token);
        return "OK";
    }
    
    @ApiMethod({errorCodes: ["TOKEN_DOES_NOT_EXIST"]})
    async resetPassword(model: authApi.ResetPasswordModel): Promise<types.core.OK> {
        await this.userService.resetCredentialsWithToken(model.token, model.newPassword);
        return "OK";
    }
    
    @ApiMethod({errorCodes: ["TOKEN_DOES_NOT_EXIST"]})
    async resetSrpCredentials(model: authApi.ResetSrpCredentialsModel): Promise<types.core.OK> {
        const credentials: db.SrpCredentials = {
            type: "srp",
            group: model.group,
            salt: model.salt,
            verifier: model.verifier,
            pbkdf: model.pbkdf2Params,
        };
        await this.userService.resetCredentialsWithToken(model.token, credentials);
        return "OK";
    }
    
    @ApiMethod({errorCodes: ["EMAIL_ALREADY_IN_USE", "OPEN_REGISTRATION_DISABLED", "TOKEN_DOES_NOT_EXIST", "INVALID_EMAIL"]})
    async register(model: authApi.RegisterModel): Promise<authApi.RegisterResult> {
        await this.mailValidator.validateEmail(model.email);
        const user = await this.registrationService.registerUser(Utils.prepareEmail(model.email), model.password);
        return {emailVerificationRequired: !user.activated};
    }
    
    @ApiMethod({errorCodes: ["TOKEN_DOES_NOT_EXIST"]})
    async validateAccountToken(model: authApi.ValidateAccountTokenModel): Promise<types.core.OK> {
        await this.userService.activateAccountByToken(model.token);
        return "OK";
    }
    
    @ApiMethod({})
    async resendAccountValidationToken(model: authApi.ResendAccountValidationTokenModel): Promise<types.core.OK> {
        await this.userService.resendAccountValidationToken(Utils.prepareEmail(model.email));
        return "OK";
    }
    
    @ApiMethod({})
    async resendSecondFactorCode(model: authApi.ResendSecondFactorCodeModel): Promise<types.core.OK> {
        await this.secondFactorService.resendSecondFactorCodeByEmail(Utils.prepareEmail(model.email), model.challengeId);
        return "OK";
    }
    
    @ApiMethod({
        errorCodes: ["INSUFFICIENT_SCOPE", "INVALID_CREDENTIALS", "INVALID_USER_OR_PASSWORD", "ACCOUNT_NOT_ACTIVATED_YET", "ACCOUNT_BLOCKED", "API_KEY_DOES_NOT_EXIST", "TOKEN_EXPIRED", "INVALID_TOKEN"],
        additionalCost: 100,
    })
    async token(model: authApi.TokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.TokenResult> {
        const requestHash = Utils.getRequestParamsHash("auth/", "token", model);
        const deviceId = this.authorizationHolder.getAgentId();
        const result = await (async () => {
            if (model.grantType === "client_credentials") {
                return await this.authorizationService.getAccessTokenFromClientCredentials(requestHash, model.clientId, model.clientSecret, model.scope ? model.scope : [], deviceId, challenge);
            }
            else if (model.grantType === "refresh_token") {
                return await this.authorizationService.refreshToken(model.refreshToken);
            }
            else if (model.grantType === "client_signature") {
                return await this.authorizationService.getAccessTokenFromSignature(requestHash, model.clientId, model.scope, model.timestamp, model.nonce, model.signature, challenge, deviceId, model.data);
            }
            else {
                throw new AppException("INVALID_PARAMS");
            }
        })();
        return {
            accessToken: result.accessToken.token,
            accessTokenExpiresIn: result.accessToken.expiresIn,
            refreshToken: result.refreshToken.token,
            refreshTokenExpiresIn: result.refreshToken.expiresIn,
            scope: result.scope,
            tokenType: "Bearer",
        };
    }
    
    @ApiMethod({
        additionalCost: 100,
    })
    async loginForToken(model: authApi.LoginForTokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.LoginForTokenResult> {
        const result = await this.authorizationService.getAccessTokenFromCredentials(Utils.getRequestParamsHash("auth/", "loginForToken", model), Utils.prepareEmail(model.email), model.password, challenge, this.authorizationHolder.getAgentId(), !!model.rememberDevice, model.scope);
        return {
            accessToken: result.accessToken.token,
            accessTokenExpiresIn: result.accessToken.expiresIn,
            refreshToken: result.refreshToken.token,
            refreshTokenExpiresIn: result.refreshToken.expiresIn,
            scope: result.scope,
            tokenType: "Bearer",
        };
    }
    
    @ApiMethod({
        errorCodes: ["INVALID_USER_OR_PASSWORD", "TOKEN_DOES_NOT_EXIST", "ACCOUNT_NOT_ACTIVATED_YET"],
    })
    async confirmSrpLoginForToken(model: authApi.ConfirmSrpLoginForTokenModel, challenge: types.auth.ChallengeModel|undefined): Promise<authApi.ConfirmSrpLoginForTokenResult> {
        const result = await this.authorizationService.confirmSrpLoginForToken(Utils.getRequestParamsHash("auth/", "confirmSrpLoginForToken", model), model.M1, model.A, model.loginToken, this.authorizationHolder.getAgentId(), !!model.rememberDevice, model.scope, challenge);
        return {
            M2: result.M2,
            accessToken: result.accessToken.token,
            accessTokenExpiresIn: result.accessToken.expiresIn,
            refreshToken: result.refreshToken.token,
            refreshTokenExpiresIn: result.refreshToken.expiresIn,
            scope: result.scope,
            tokenType: "Bearer",
        };
    }
    
    @ApiMethod({})
    async forkToken(model: authApi.ForkTokenModel): Promise<authApi.ForkTokenResult> {
        const result = await this.authorizationService.forkToken(model.refreshToken, model.sessionName);
        return {
            accessToken: result.accessToken.token,
            accessTokenExpiresIn: result.accessToken.expiresIn,
            refreshToken: result.refreshToken.token,
            refreshTokenExpiresIn: result.refreshToken.expiresIn,
            scope: result.scope,
            tokenType: "Bearer",
        };
    }
}
