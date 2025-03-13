import { BaseApi } from "../../BaseApi";
import * as types from "../../../types";
import { ApiMethod } from "../../Decorators";
import { PkiAdminApiValidator } from "./PkiAdminApiValidator";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { UserIdentityService } from "../../../service/UserIdentityService";
import * as PkiAdminApiTypes from "./PkiAdminApiTypes";
import { IPkiAdminApi } from "./PkiAdminApiTypes";
import { AppException } from "../../AppException";

export class PkiAdminApi extends BaseApi implements IPkiAdminApi {
    
    constructor(
        private userIdentityService: UserIdentityService,
        private authorizationHolder: AuthorizationHolder,
    ) {
        super(new PkiAdminApiValidator());
    }
    
    protected validateAccess(method: string): void {
        this.validateClientAccess(this.authorizationHolder, "useridentity", method);
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["KEY_ALREADY_EXISTS"],
    })
    async setKey(model: PkiAdminApiTypes.SetKeyModel): Promise<types.core.OK> {
        const check = await this.userIdentityService.getCurrentKey(model.userId, model.host, model.contextId);
        if (check?.userPubKey === model.userPubKey) {
            throw new AppException("KEY_ALREADY_EXISTS");
        }
        await this.userIdentityService.setKey(model.userId, model.userPubKey, model.host, model.contextId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["NO_KEY_FOR_USER"],
    })
    async deleteKey(model: PkiAdminApiTypes.DeleteKeyModel): Promise<types.core.OK> {
        const exists = await this.userIdentityService.getCurrentKey(model.userId, model.host, model.contextId);
        if (!exists) {
            throw new AppException("NO_KEY_FOR_USER");
        }
        await this.userIdentityService.deleteKey(model.userId, model.host, model.contextId);
        return "OK";
    }
}
