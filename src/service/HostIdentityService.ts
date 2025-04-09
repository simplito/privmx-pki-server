import { AppException } from "../api/AppException";
import { HostIdentityRepository } from "./HostIdentityRepository";
import * as types from "../types";
import { HostIdentity, HostIdentityFilter } from "../api/client/pki/PkiApiTypes";

export class HostIdentityService {
    
    constructor(
        private hostIdentityRepository: HostIdentityRepository,
    ) {
    }
    
    async setHost(hostPubKey: string, hostUrl: types.pki.HostUrl): Promise<types.pki.InstanceId> {
        const instanceId = hostPubKey as types.pki.InstanceId;
        const result = await this.hostIdentityRepository.setHost(instanceId, hostPubKey, hostUrl);
        if (! result) {
            throw new AppException("CANNOT_ADD_HOST");
        }
        return instanceId;
    }
    
    async addHostUrl(instanceId: types.pki.InstanceId, hostUrl: types.pki.HostUrl): Promise<void> {
        await this.hostIdentityRepository.addHostUrl(instanceId, hostUrl);
    }
    
    async removeHostUrl(instanceId: types.pki.InstanceId, hostUrl: types.pki.HostUrl): Promise<void> {
        await this.hostIdentityRepository.removeHostUrl(instanceId, hostUrl);
    }
    
    async deleteHost(instanceId: types.pki.InstanceId): Promise<void> {
        await this.hostIdentityRepository.deleteHost(instanceId);
    }
    
    async verifyHostBy(model: {hostUrl: types.pki.HostUrl, instanceId?: types.pki.InstanceId, hostPubKey?: string} ): Promise<boolean> {
        return this.hostIdentityRepository.verifyHostBy(model);
    }
    
    async listHosts(): Promise<HostIdentity[]> {
        return (await this.hostIdentityRepository.listHosts()) || [];
    }
    
    async getHost(filter: HostIdentityFilter): Promise<HostIdentity> {
        const result = await this.hostIdentityRepository.getHost(filter);
        if (!result) {
            throw new AppException("CANNOT_FIND_HOST_BY_GIVEN_FILTER");
        }
        return result;
    }
    
}
