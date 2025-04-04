import { BaseApi } from "../../BaseApi";
import * as PkiApiTypes from "./PkiApiTypes";
import { ApiMethod } from "../../Decorators";
import { PkiApiValidator } from "./PkiApiValidator";
import { UserIdentityService } from "../../../service/UserIdentityService";
import { HostIdentityService } from "../../../service/HostIdentityService";
import { AppException } from "../../AppException";

export class PkiApi extends BaseApi implements PkiApiTypes.IPkiApi {
    
    constructor(
        private userIdentityService: UserIdentityService,
        private hostIdentityService: HostIdentityService
        // private authorizationHolder: AuthorizationHolder,
    ) {
        super(new PkiApiValidator());
    }
    
    protected validateAccess(_method: string): void {
        return;
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["NO_KEY_FOR_USER"],
    })
    async getCurrentKey(model: PkiApiTypes.GetCurrentKeyModel): Promise<PkiApiTypes.UserIdentity> {
        const result = await this.userIdentityService.getCurrentKey(model.userId, model.instanceId, model.contextId);
        if (!result) {
            throw new AppException("NO_KEY_FOR_USER");
        }
        return result;
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["NO_KEY_FOR_USER_AT_GIVEN_TIME"],
    })
    async getKeyAt(model: PkiApiTypes.GetKeyAtModel): Promise<PkiApiTypes.UserIdentity> {
        const result = await this.userIdentityService.getKeyAt(model.userId, model.instanceId, model.contextId, model.date);
        if (!result) {
            throw new AppException("NO_KEY_FOR_USER_AT_GIVEN_TIME");
        }
        return result;
    }

    @ApiMethod({
        scope: ["read"]
    })
    async getKeyHistory(model: PkiApiTypes.GetKeyHistoryModel): Promise<PkiApiTypes.UserIdentity[]> {
        return this.userIdentityService.getKeyHistory(model.userId, model.instanceId, model.contextId);
    }
    
    @ApiMethod({
        scope: ["read"],
        errorCodes: ["NO_KEY_FOR_USER_AT_GIVEN_TIME"],
    })
    async verifyKey(model: PkiApiTypes.VerifyKeyModel) {
        const result = await this.userIdentityService.getKeyAt(model.userId, model.instanceId, model.contextId, model.date);
        if (!result) {
            throw new AppException("NO_KEY_FOR_USER_AT_GIVEN_TIME");
        }
        return this.userIdentityService.verifyKey(model.userId, model.userPubKey, model.instanceId, model.contextId, model.date);
    }

    @ApiMethod({
        scope: ["read"]
    })
    async verifyHost(model: PkiApiTypes.VerifyHostModel): Promise<boolean> {
        return this.hostIdentityService.verifyHostBy(model);
    }

    @ApiMethod({
        scope: ["read"],
        errorCodes: ["CANNOT_FIND_HOST_BY_GIVEN_FILTER"],
    })
    async getHost(model: PkiApiTypes.GetHostModel): Promise<PkiApiTypes.HostIdentity> {
        return this.hostIdentityService.getHost(model);
    }

}
