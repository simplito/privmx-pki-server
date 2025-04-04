import { AppException } from "../api/AppException";
import { UserIdentity } from "../api/client/pki/PkiApiTypes";
import { UserIdentityRepository } from "./UserIdentityRepository";
import * as types from "../types";
export class UserIdentityService {
    
    constructor(
        private userIdentityRepository: UserIdentityRepository,
    ) {
    }
    
    async setKey(userId: string, userPubKey: string, instanceId: types.pki.InstanceId, contextId: string): Promise<void> {
        await this.userIdentityRepository.setKey(userId, userPubKey, instanceId, contextId);
    }
    
    async deleteKey(userId: string, instanceId: types.pki.InstanceId, contextId: string): Promise<void> {
        const result = await this.userIdentityRepository.deleteKey(userId, instanceId, contextId);
        if (!result) {
            throw new AppException("NO_KEY_FOR_USER");
        }      
    }
    
    async getCurrentKey(userId: string, instanceId: types.pki.InstanceId, contextId: string): Promise<UserIdentity|null> {
        const result = await this.userIdentityRepository.getCurrentKey(userId, instanceId, contextId);
        return result;
    }
    
    async getKeyAt(userId: string, instanceId: types.pki.InstanceId, contextId: string, date: number): Promise<UserIdentity|null> {
        const result = await this.userIdentityRepository.getKeyAt(userId, instanceId, contextId, date);
        return result;
    };
    
    async getKeyHistory(userId: string, instanceId: types.pki.InstanceId, contextId: string): Promise<UserIdentity[]> {
        const result = await this.userIdentityRepository.getKeyHistory(userId, instanceId, contextId);
        if (!result) {
            return [];
        }
        if (result && Array.isArray(result)) {
            return result;
        }
        return [result];
        
    }
    
    async verifyKey(userId: string, userPubKey: string, instanceId: types.pki.InstanceId, contextId: string, date: number): Promise<boolean> {
        const result = await this.userIdentityRepository.verifyKey(userId, instanceId, contextId, userPubKey, date);
        if (!result) {
            return false;
        }
        return (userId === result.userId && userPubKey === result.userPubKey && instanceId === result.instanceId && contextId === result.contextId);
    }
}
