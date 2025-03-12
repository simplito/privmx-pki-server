import * as db from "../db/Model";
import * as types from "../types";

export interface ISecondFactorService {
    prepareChallenge(user: db.User, data: db.SecondFactor, requestParamsHash: string): ChallengeResult;
    enableUserSecondFactor(userId: types.user.UserId, challengeData: types.auth.SecondFactorChallengeData, deviceId: types.core.AgentId|null): Promise<void>;
    validateChallenge(challengeId: types.core.ChallengeId, userId: types.user.UserId, secondFactorChallenge: types.auth.SecondFactorChallengeData, code: string, ip: types.core.IpAddress, requestParamsHash: string, deviceToRemember: types.core.AgentId|null): Promise<void>;
    resendCodeToUser(user: db.User, challengeId: types.core.ChallengeId, challengeData: types.auth.SecondFactorChallengeData): Promise<void>;
}

export type SecondFactorCodeValidationResult = {isValid: true}|{isValid: false, duplicated?: boolean};

export interface ChallengeResult {
    info: string;
    data: types.auth.SecondFactorChallengeData;
    ttl: types.core.Timespan;
}

export type SecondFactorServiceType = "totp"|"email";

export class SecondFactorProvider {
    
    constructor(
        private secondFactorProviderList: Map<SecondFactorServiceType, ISecondFactorService>,
    ) {
    }
    
    prepareChallenge(user: db.User, data: db.SecondFactor, requestParamsHash: string) {
        return this.getService(data.type).prepareChallenge(user, data, requestParamsHash);
    }
    
    async enableUserSecondFactor(userId: types.user.UserId, secondFactor: types.auth.SecondFactorChallengeData, deviceId: types.core.AgentId|null) {
        return this.getService(secondFactor.type).enableUserSecondFactor(userId, secondFactor, deviceId);
    }
    
    async validateChallenge(challengeId: types.core.ChallengeId, userId: types.user.UserId, secondFactor: types.auth.SecondFactorChallengeData, code: string, ip: types.core.IpAddress, requestParamsHash: string, deviceToRemember: types.core.AgentId|null) {
        return this.getService(secondFactor.type).validateChallenge(challengeId, userId, secondFactor, code, ip, requestParamsHash, deviceToRemember);
    }
    
    resendCodeToUser(user: db.User, challengeId: types.core.ChallengeId, challengeData: types.auth.SecondFactorChallengeData) {
        return this.getService(challengeData.type).resendCodeToUser(user, challengeId, challengeData);
    }
    
    private getService(type: SecondFactorServiceType) {
        const service = this.secondFactorProviderList.get(type);
        if (!service) {
            throw new Error(`Unsupported second factor service type ${type}`);
        }
        return service;
    }
}
