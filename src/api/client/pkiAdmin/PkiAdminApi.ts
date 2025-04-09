import { BaseApi } from "../../BaseApi";
import * as types from "../../../types";
import { ApiMethod } from "../../Decorators";
import { PkiAdminApiValidator } from "./PkiAdminApiValidator";
import { AuthorizationHolder } from "../../../requestScopeService/AuthorizationHolder";
import { UserIdentityService } from "../../../service/UserIdentityService";
import * as PkiAdminApiTypes from "./PkiAdminApiTypes";
import { IPkiAdminApi } from "./PkiAdminApiTypes";
import { AppException } from "../../AppException";
import { HostIdentityService } from "../../../service/HostIdentityService";
import { HostIdentity } from "../pki/PkiApiTypes";

export class PkiAdminApi extends BaseApi implements IPkiAdminApi {
    
    constructor(
        private userIdentityService: UserIdentityService,
        private hostIdentityService: HostIdentityService,
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
        const check = await this.userIdentityService.getCurrentKey(model.userId, model.instanceId, model.contextId);
        if (check?.userPubKey === model.userPubKey) {
            throw new AppException("KEY_ALREADY_EXISTS");
        }
        await this.userIdentityService.setKey(model.userId, model.userPubKey, model.instanceId, model.contextId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["NO_KEY_FOR_USER"],
    })
    async deleteKey(model: PkiAdminApiTypes.DeleteKeyModel): Promise<types.core.OK> {
        const exists = await this.userIdentityService.getCurrentKey(model.userId, model.instanceId, model.contextId);
        if (!exists) {
            throw new AppException("NO_KEY_FOR_USER");
        }
        await this.userIdentityService.deleteKey(model.userId, model.instanceId, model.contextId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["CANNOT_ADD_HOST"],
    })
    async setHost(model: PkiAdminApiTypes.SetHostModel): Promise<types.pki.InstanceId> {
        return this.hostIdentityService.setHost(model.hostPubKey, model.hostUrl);
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["CANNOT_ADD_URL_TO_THE_HOST"],
    })
    async addHostUrl(model: PkiAdminApiTypes.AddHostUrlModel): Promise<types.core.OK> {
        await this.hostIdentityService.addHostUrl(model.instanceId, model.hostUrl);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["NO_HOST_BY_GIVEN_INSTANCE_ID", "HOST_URL_DOES_NOT_EXIST"],
    })
    async removeHostUrl(model: PkiAdminApiTypes.RemoveHostUrlModel): Promise<types.core.OK> {
        await this.hostIdentityService.removeHostUrl(model.instanceId, model.hostUrl);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
        errorCodes: ["NO_HOST_BY_GIVEN_INSTANCE_ID"],
    })
    async deleteHost(model: PkiAdminApiTypes.DeleteHostModel): Promise<types.core.OK> {
        await this.hostIdentityService.deleteHost(model.instanceId);
        return "OK";
    }
    
    @ApiMethod({
        scope: "ignore",
    })
    async listHosts(): Promise<HostIdentity[]> {
        return this.hostIdentityService.listHosts();
    }
    
}
