import { AppException } from "../api/AppException";
import { SecondFactorChallengeDataCache } from "../cluster/master/ipcServices/SecondFactorChallengeDataCache";
import { UserRepository } from "./UserRepository";
import { SecondFactorProvider } from "./SecondFactorProvider";
import * as types from "../types";
import * as db from "../db/Model";
import { Hex } from "../utils/Hex";
import { Crypto } from "../utils/Crypto";
export class ChallengeService {
    constructor(
        private secondFactorProvider: SecondFactorProvider,
        private userRepository: UserRepository,
        private secondFactorChallengeDataCache: SecondFactorChallengeDataCache,
    ) {}
    
    async validate(userId: types.user.UserId, challengeId: types.core.ChallengeId, authorizationData: string, ip: types.core.IpAddress, requestParamsHash: string, deviceToRemember: types.core.AgentId|null) {
        const challenge = await this.getChallengeData(userId, challengeId);
        if (!challenge) {
            throw new AppException("SECOND_FACTOR_VERIFICATION_FAILED", "invalid challenge");
        }
        await this.secondFactorProvider.validateChallenge(challengeId, userId, challenge, authorizationData, ip, requestParamsHash, deviceToRemember);
    }
    
    async generateChallenge(userId: types.user.UserId, secondFactor: db.SecondFactor, requestParamsHash: string) {
        const user = await this.userRepository.getActiveUser(userId);
        if (!user) {
            throw new AppException("DEVELOPER_DOES_NOT_EXIST");
        }
        const challenge = this.secondFactorProvider.prepareChallenge(user, secondFactor, requestParamsHash);
        const challengeId = this.generateChallengeId();
        await this.secondFactorChallengeDataCache.saveChallenge({userId, challengeId, data: challenge.data, ttl: challenge.ttl});
        return {
            info: challenge.info,
            challengeId,
        };
    }
    
    async getChallengeData(userId: types.user.UserId, challengeId: types.core.ChallengeId) {
        return await this.secondFactorChallengeDataCache.getChallenge({userId, challengeId});
    }
    
    private generateChallengeId() {
        return Hex.buf2Hex(Crypto.randomBytes(32)) as types.core.ChallengeId;
    }
}
