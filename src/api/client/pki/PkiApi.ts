import { BaseApi } from "../../BaseApi";
import * as PkiApiTypes from "./PkiApiTypes";
import { ApiMethod } from "../../Decorators";
import { PkiApiValidator } from "./PkiApiValidator";
import { UserIdentityService } from "../../../service/UserIdentityService";

export class PkiApi extends BaseApi implements PkiApiTypes.IPkiApi {
    
    constructor(
        private userIdentityService: UserIdentityService,
        // private authorizationHolder: AuthorizationHolder,
    ) {
        super(new PkiApiValidator());
    }
    
    protected validateAccess(_method: string): void {
        return;
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async getCurrentKey(model: PkiApiTypes.GetCurrentKeyModel): Promise<PkiApiTypes.UserIdentity> {
        const result = await this.userIdentityService.getCurrentKey(model.userId, model.host, model.contextId);
        if (!result) {
            throw new Error("NO KEY FOR USER");
        }
        return result;
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async getKeyAt(model: PkiApiTypes.GetKeyAtModel): Promise<PkiApiTypes.UserIdentity> {
        const result = await this.userIdentityService.getKeyAt(model.userId, model.host, model.contextId, model.date);
        if (!result) {
            throw new Error("NO KEY FOR USER");
        }
        return result;
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async getKeyHistory(model: PkiApiTypes.GetKeyHistoryModel): Promise<PkiApiTypes.UserIdentity[]> {
        return this.userIdentityService.getKeyHistory(model.userId, model.host, model.contextId);
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["USER_DOES_NOT_EXIST"],
    })
    async verifyKey(model: PkiApiTypes.VerifyKeyModel) {
        return this.userIdentityService.verifyKey(model.userId, model.userPubKey, model.host, model.contextId, model.date);
    }
}
