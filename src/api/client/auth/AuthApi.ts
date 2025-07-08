import { BaseApi } from "../../BaseApi";
import * as types from "../../../types";
import { ApiMethod } from "../../Decorators";
import { AuthApiValidator } from "./AuthApiValidator";
import { AuthorizationService } from "../../../requestScopeService/AuthorizationService";
import { AppException } from "../../AppException";
import { Utils } from "../../../utils/Utils";
import * as authApi from "./AuthApiTypes";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { UserService } from "../../../service/UserService";

export class AuthApi extends BaseApi implements authApi.IAuthApi {
    
    constructor(
        private authorizationService: AuthorizationService,
        private authorizationHolder: AuthorizationHolder,
        private userService: UserService,
        
    ) {
        super(new AuthApiValidator());
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["FIRST_API_KEY_ALREADY_EXISTS",  "INITIALIZATION_TOKEN_MISSMATCH"],
    })
    async createFirstApiKey(model: authApi.CreateFirstApiKeyModel): Promise<authApi.CreateFirstApiKeyResult> {
        return this.userService.createFirstApiKey(model.initializationToken, model.name);
    }
    
    @ApiMethod({})
    async bindAccessToken(model: authApi.BindAccessTokenModel): Promise<types.core.OK> {
        await this.authorizationService.bindAccessToken(model.accessToken);
        return "OK";
    }
    
    @ApiMethod({
        errorCodes: ["INSUFFICIENT_SCOPE", "INVALID_CREDENTIALS", "INVALID_USER_OR_PASSWORD", "ACCOUNT_NOT_ACTIVATED_YET", "ACCOUNT_DISABLED", "API_KEY_DOES_NOT_EXIST", "TOKEN_EXPIRED", "INVALID_TOKEN"],
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
