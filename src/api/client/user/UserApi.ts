import { BaseApi } from "../../BaseApi";
import * as userApi from "./UserApiTypes";
import * as types from "../../../types";
import * as db from "../../../db/Model";
import { ApiMethod } from "../../Decorators";
import { UserApiValidator } from "./UserApiValidator";
import { UserService } from "../../../service/UserService";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { AppException } from "../../AppException";
import { UserConverter } from "../../../service/UserConverter";
import { SecondFactorService } from "../../../service/SecondFactorService";
import { WebSocketService } from "../../../service/WebSocketService";
import { ApiKeyRepository } from "../../../service/ApiKeyRepository";
import { ApiKeyConverter } from "./ApiKeyConverter";

export class UserApi extends BaseApi implements userApi.IUserApi {
    
    constructor(
        private secondFactorService: SecondFactorService,
        private userService: UserService,
        private userConverter: UserConverter,
        private authorizationHolder: AuthorizationHolder,
        private webSocketService: WebSocketService,
        private apiKeyRepository: ApiKeyRepository,
        private apiKeyConverter: ApiKeyConverter,
    ) {
        super(new UserApiValidator());
    }
    
    protected validateAccess(method: string): void {
        this.validateClientAccess(this.authorizationHolder, "user", method);
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["SRP_NOT_ENABLED_FOR_THIS_ACCOUNT"],
    })
    async startSrpCredentialsChange(): Promise<userApi.StartSrpCredentialsChangeResult> {
        const startSrpCredentialsChangeResult = await this.userService.startSrpCredentialsChange(this.authorizationHolder.getUserId());
        return startSrpCredentialsChangeResult;
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["TOKEN_DOES_NOT_EXIST", "INVALID_USER_OR_PASSWORD"],
    })
    async confirmSrpCredentialsChange(model: userApi.ConfirmSrpCredentialsChangeModel): Promise<types.core.OK> {
        const credentials: db.SrpCredentials = {
            type: "srp",
            group: model.group,
            salt: model.salt,
            verifier: model.verifier,
            pbkdf: model.pbkdf2Params,
        };
        await this.userService.changeSrpCredentials(this.authorizationHolder.getUserId(), model.credentialsChangeToken, model.A, model.M1, credentials);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["INVALID_PASSWORD"],
    })
    async changePassword(model: userApi.ChangePasswordModel): Promise<types.core.OK> {
        await this.userService.changePassword(model.newPassword, model.currentPassword, this.authorizationHolder.getUserId());
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read"],
    })
    async checkAuthorization(): Promise<types.core.OK> {
        return "OK";
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["SECOND_FACTOR_ALREADY_ENABLED"],
    })
    async enableSecondFactor(model: userApi.EnableSecondFactorModel): Promise<userApi.EnableSecondFactorResult> {
        const challengeInfo = await this.secondFactorService.enable(this.authorizationHolder.getUserId(), model);
        return challengeInfo;
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["TOKEN_DOES_NOT_EXIST", "SECOND_FACTOR_INVALID_CODE", "SECOND_FACTOR_VERIFICATION_FAILED"],
    })
    async confirmEnablingOfSecondFactor(model: userApi.ConfirmEnablingOfSecondFactorModel): Promise<types.core.OK> {
        const authorizationInfo = await this.authorizationHolder.getAuthorizationInfo();
        await this.secondFactorService.confimEnablingOfSecondFactor(authorizationInfo.user, (model.rememberDevice) ? authorizationInfo.agentId : null, model.challengeId, model.authorizationData, authorizationInfo.ip);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["SECOND_FACTOR_ALREADY_DISABLED"],
    })
    async disableSecondFactor(): Promise<userApi.DisableSecondFactorResult> {
        const challengeInfo = await this.secondFactorService.disable(this.authorizationHolder.getUserId());
        return challengeInfo;
    }
    
    @ApiMethod({
        scope: ["write"],
        errorCodes: ["TOKEN_DOES_NOT_EXIST", "SECOND_FACTOR_INVALID_CODE", "SECOND_FACTOR_VERIFICATION_FAILED"],
    })
    async confirmDisablingOfSecondFactor(model: userApi.ConfirmDisablingOfSecondFactorModel): Promise<types.core.OK> {
        const authorizationInfo = await this.authorizationHolder.getAuthorizationInfo();
        await this.secondFactorService.confirmDisablingOfSecondFactor(authorizationInfo.user, model.challengeId, model.authorizationData, authorizationInfo.ip);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["TOKEN_DOES_NOT_EXIST"],
    })
    async resendSecondFactorCode(model: userApi.ResendSecondFactorCodeModel): Promise<types.core.OK> {
        await this.secondFactorService.resendSecondFactorCode(this.authorizationHolder.getUserId(), model.challengeId);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read"],
    })
    async getProfile(): Promise<userApi.GetProfileResult> {
        const user = await this.userService.getUser(this.authorizationHolder.getUserId());
        return {profile: this.userConverter.convertUser(user)};
    }
    
    @ApiMethod({
        scope: ["write"],
    })
    async setProfile(model: userApi.SetProfileModel): Promise<types.core.OK> {
        await this.userService.setUserProfile(this.authorizationHolder.getUserId(), model.name);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read"],
    })
    async getInfo(): Promise<userApi.GetInfoResult> {
        const user = await this.userService.getUser(this.authorizationHolder.getUserId());
        return {
            profile: this.userConverter.convertUser(user),
        };
    }
    
    @ApiMethod({
        scope: ["read"],
    })
    async subscribeToWebSocketChannel(model: userApi.SubscribeToChannelModel): Promise<types.core.OK> {
        if (!this.authorizationHolder.isConnectedWithWebsocket()) {
            throw new AppException("METHOD_CALLABLE_WITH_WEBSOCKET_ONLY");
        }
        
        await this.webSocketService.subscribeWebSocketToChannel(this.authorizationHolder.getWebsocketWebSocketInfo(), model.channels);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read"],
    })
    async unsubscribeFromWebSocketChannel(model: userApi.UnsubscribeFromChannelModel): Promise<types.core.OK> {
        if (!this.authorizationHolder.isConnectedWithWebsocket()) {
            throw new AppException("METHOD_CALLABLE_WITH_WEBSOCKET_ONLY");
        }
        
        await this.webSocketService.unsubscribeWebSocketFromChannel(this.authorizationHolder.getWebsocketWebSocketInfo(), model.channels);
        return "OK";
    }
    
    @ApiMethod({
        secondFactorRequired: true,
        scope: ["write"],
    })
    async addApiKey(model: userApi.AddApiKeyModel): Promise<userApi.AddApiKeyResult> {
        const apiKey = await (async () => {
            if (model.type === "pubKey") {
                return await this.userService.addApiKeyWithPubkey(model.maxScope, this.authorizationHolder.getUserId(), model.clientPubKey, model.name);
            }
            if (model.type === "secret") {
                return await this.userService.addApiKey(model.maxScope, this.authorizationHolder.getUserId(), model.name, model.clientSecret);
            }
            throw new AppException("INVALID_PARAMS", "type");
        })();
        return {apiKeyId: apiKey._id};
    }
    
    @ApiMethod({
        secondFactorRequired: true,
        scope: ["write"],
    })
    async deleteApiKey(model: userApi.DeleteApiKeyModel): Promise<types.core.OK> {
        await this.userService.deleteApiKey(this.authorizationHolder.getUserId(), model.apiKeyId);
        return "OK";
    }
    
    @ApiMethod({
        secondFactorRequired: true,
        scope: ["write"],
    })
    async updateApiKey(model: userApi.UpdateApiKeyModel): Promise<types.core.OK> {
        await this.userService.updateApiKey(this.authorizationHolder.getUserId(), model);
        return "OK";
    }
    
    @ApiMethod({
        scope: ["read", "write"],
    })
    async getApiKey(model: userApi.GetApiKeyModel): Promise<userApi.GetApiKeyResult> {
        const apiKey = await this.userService.getApiKeyAndValidateAccess(this.authorizationHolder.getUserId(), model.apiKeyId);
        return {apiKey: this.apiKeyConverter.convertApiKeyToRecord(apiKey)};
    }
    
    @ApiMethod({
        scope: ["read", "write"],
    })
    async listApiKeys(): Promise<userApi.ListApiKeysResult> {
        const keys = await this.apiKeyRepository.getAllUserApiKeys(this.authorizationHolder.getUserId());
        return {list: keys.map(apiKey => this.apiKeyConverter.convertApiKeyToRecord(apiKey))};
    }
    
    @ApiMethod({
        scope: ["read", "write"],
    })
    async forgetAllDevices(): Promise<types.core.OK> {
        await this.userService.forgetAllDevices(this.authorizationHolder.getUserId());
        return "OK";
    }
}
