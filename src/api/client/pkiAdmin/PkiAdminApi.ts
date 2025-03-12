import { BaseApi } from "../../BaseApi";
import * as types from "../../../types";
import { ApiMethod } from "../../Decorators";
import { PkiAdminApiValidator } from "./PkiAdminApiValidator";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { UserIdentityService } from "../../../service/UserIdentityService";
import * as PkiAdminApiTypes from "./PkiAdminApiTypes";
import { IPkiAdminApi } from "./PkiAdminApiTypes";

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
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async setKey(model: PkiAdminApiTypes.SetKeyModel): Promise<types.core.OK> {
        await this.userIdentityService.setKey(model.userId, model.userPubKey, model.host, model.contextId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async deleteKey(model: PkiAdminApiTypes.DeleteKeyModel): Promise<types.core.OK> {
        await this.userIdentityService.deleteKey(model.userId, model.host, model.contextId);
        return "OK";
    }
}
