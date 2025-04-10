import { BaseApi } from "../../BaseApi";
import * as userApi from "./UserApiTypes";
import * as types from "../../../types";
import { ApiMethod } from "../../Decorators";
import { UserApiValidator } from "./UserApiValidator";
import { UserService } from "../../../service/UserService";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { AppException } from "../../AppException";
import { ApiKeyRepository } from "../../../service/ApiKeyRepository";
import { ApiKeyConverter } from "./ApiKeyConverter";

export class UserApi extends BaseApi implements userApi.IUserApi {
    
    constructor(
        private userService: UserService,
        private authorizationHolder: AuthorizationHolder,
        private apiKeyRepository: ApiKeyRepository,
        private apiKeyConverter: ApiKeyConverter,
    ) {
        super(new UserApiValidator());
    }
    
    protected validateAccess(method: string): void {
        this.validateClientAccess(this.authorizationHolder, "user", method);
    }
    
    @ApiMethod({
        scope: "ignore",
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
        scope: "ignore",
    })
    async deleteApiKey(model: userApi.DeleteApiKeyModel): Promise<types.core.OK> {
        await this.userService.deleteApiKey(this.authorizationHolder.getUserId(), model.apiKeyId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
    })
    async updateApiKey(model: userApi.UpdateApiKeyModel): Promise<types.core.OK> {
        await this.userService.updateApiKey(this.authorizationHolder.getUserId(), model);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
    })
    async getApiKey(model: userApi.GetApiKeyModel): Promise<userApi.GetApiKeyResult> {
        const apiKey = await this.userService.getApiKeyAndValidateAccess(this.authorizationHolder.getUserId(), model.apiKeyId);
        return {apiKey: this.apiKeyConverter.convertApiKeyToRecord(apiKey)};
    }
    
    @ApiMethod({
        scope: "ignore",
    })
    async listApiKeys(): Promise<userApi.ListApiKeysResult> {
        const keys = await this.apiKeyRepository.getAllUserApiKeys(this.authorizationHolder.getUserId());
        return {list: keys.map(apiKey => this.apiKeyConverter.convertApiKeyToRecord(apiKey))};
    }
}
