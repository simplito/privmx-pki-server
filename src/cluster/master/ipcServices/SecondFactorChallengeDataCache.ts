import { CacheWithTTL } from "../../../utils/CacheWithTTL";
import { IpcService } from "../Decorators";
import { DateUtils } from "../../../utils/DateUtils";
import { ApiMethod } from "../../../api/Decorators";
import * as types from "../../../types";

export interface UserChallenges {
    challenges: Map<types.core.ChallengeId, ChallengeData>;
}

export interface ChallengeData {
    challengeId: types.core.ChallengeId;
    data: types.auth.SecondFactorChallengeData;
    expires: types.core.Timestamp;
    createDate: types.core.Timestamp;
}

@IpcService
export class SecondFactorChallengeDataCache {
    
    constructor(
        private cacheWithTTL: CacheWithTTL<UserChallenges>,
    ) {
    }
    
    @ApiMethod({})
    async getChallenge(model: {userId: types.user.UserId, challengeId: types.core.ChallengeId}) {
        const entry = this.cacheWithTTL.getAndRefresh(model.userId);
        const challenge = entry ? entry.challenges.get(model.challengeId) : null;
        return challenge && challenge.expires > DateUtils.now() ? challenge.data : undefined;
    }
    
    @ApiMethod({})
    async saveChallenge(model: {userId: types.user.UserId, challengeId: types.core.ChallengeId, data: types.auth.SecondFactorChallengeData, ttl: types.core.Timespan}) {
        const newChallenge: ChallengeData = {challengeId: model.challengeId, data: model.data, createDate: DateUtils.now(), expires: DateUtils.getExpirationDate(model.ttl)};
        const entry = this.cacheWithTTL.getAndRefresh(model.userId);
        if (!entry) {
            this.cacheWithTTL.set(model.userId, {challenges: new Map([[model.challengeId, newChallenge]])}, model.ttl);
        }
        else {
            if (entry.challenges.size > 9) {
                this.removeOldestChallenge(entry.challenges);
            }
            entry.challenges.set(model.challengeId, newChallenge);
        }
    }
    
    @ApiMethod({})
    async modifyChallenge(model: {userId: types.user.UserId, challengeId: types.core.ChallengeId, data: types.auth.SecondFactorChallengeData}) {
        const entry = this.cacheWithTTL.getAndRefresh(model.userId);
        if (!entry) {
            return false;
        }
        const challenge = entry.challenges.get(model.challengeId);
        if (!challenge || challenge.expires < DateUtils.now()) {
            return false;
        }
        challenge.data = model.data;
        return true;
    }
    
    @ApiMethod({})
    async deleteChallenge(model: {userId: types.user.UserId, challengeId: types.core.ChallengeId}) {
        const entry = this.cacheWithTTL.get(model.userId);
        if (!entry) {
            return;
        }
        entry.challenges.delete(model.challengeId);
    }
    
    deleteExpired() {
        this.cacheWithTTL.deleteExpired();
    }
    
    private removeOldestChallenge(challenges: Map<types.core.ChallengeId, ChallengeData>) {
        if (challenges.size === 0) {
            return;
        };
        let minCreateDate = Infinity;
        let minChallengeId: types.core.ChallengeId|null = null;
        for (const challenge of challenges.values()) {
            if (challenge.createDate < minCreateDate) {
                minCreateDate = challenge.createDate;
                minChallengeId = challenge.challengeId;
            }
        }
        if (minChallengeId) {
            challenges.delete(minChallengeId);
        }
    }
}
