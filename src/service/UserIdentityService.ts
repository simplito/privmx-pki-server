import { UserIdentity } from "../api/client/pki/PkiApiTypes";
import * as types from "../types";

import { UserIdentityRepository } from "./UserIdentityRepository";

export class UserIdentityService {
    
    constructor(
        private userIdentityRepository: UserIdentityRepository,
    ) {
    }
    
    async setKey(userId: string, userPubKey: string, host: string, contextId: string): Promise<void> {
        await this.userIdentityRepository.setKey(userId, userPubKey, host, contextId);
    }
    
    async deleteKey(userId: string, host: string, contextId: string): Promise<types.core.OK> {
        const result = await this.userIdentityRepository.deleteKey(userId, host, contextId);
        if (result) {
            return Promise.resolve("OK");
        }
        throw new Error("Cannot add info about user pub key deletion");
        
    }
    
    async getCurrentKey(userId: string, host: string, contextId: string): Promise<UserIdentity|null> {
        const result = await this.userIdentityRepository.getCurrentKey(userId, host, contextId);
        return result;
    }
    
    async getKeyAt(userId: string, host: string, contextId: string, date: number): Promise<UserIdentity|null> {
        const result = await this.userIdentityRepository.getKeyAt(userId, host, contextId, date);
        return result;
    };
    
    async getKeyHistory(userId: string, host: string, contextId: string): Promise<UserIdentity[]> {
        const result = await this.userIdentityRepository.getKeyHistory(userId, host, contextId);
        if (!result) {
            return [];
        }
        if (result && Array.isArray(result)) {
            return result;
        }
        return [result];
        
    }
    
    async verifyKey(userId: string, userPubKey: string, host: string, contextId: string, date: number): Promise<boolean> {
        const result = await this.userIdentityRepository.verifyKey(userId, host, contextId, userPubKey, date);
        if (!result) {
            return false;
        }
        return (userId === result.userId && userPubKey === result.userPubKey && host === result.host && contextId === result.contextId);
    }
}
