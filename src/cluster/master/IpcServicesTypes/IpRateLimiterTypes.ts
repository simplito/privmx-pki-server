import * as types from "../../../types";
import { DateUtils } from "../../../utils/DateUtils";

export interface LoginRateInfo {
    lastLoginAttempt?: types.core.Timestamp;
    loginAttemptsCount: number;
}

export interface LoginLimiterRequestModel {
    ip: types.core.IpAddress;
    userId: types.user.UserId;
}

export interface UnbanIpAdressModel {
    ip: types.core.IpAddress;
}

export interface BanIpAdressModel {
    ip: types.core.IpAddress;
    banDuration: types.core.Timespan;
}

export interface PayAdditionalCostModel {
    ip: types.core.IpAddress;
    cost: number;
}

export class IpMapEntry {
    
    private lastActivity: types.core.Timestamp;
    private bannedTo?: types.core.Timestamp;
    private loginRecordsMap: Map<types.user.UserId, LoginRateInfo> = new Map();
    
    constructor(
        private credits: number,
        private maxCredit: number,
    ) {
        this.lastActivity = DateUtils.now();
    }
    
    public get banned() {
        return this.bannedTo;
    }
    
    payIfPossible(cost: number) {
        if (cost > this.credits) {
            return false;
        }
        this.credits = <number>(this.credits - cost);
        this.lastActivity = DateUtils.now();
        return true;
    }
    
    /* @ignore-next-line-reference */
    addCredits(credits: number) {
        this.credits = Math.min(this.credits + credits, this.maxCredit);
    }
    
    getCredits() {
        return this.credits;
    }
    
    getLastActivityTime() {
        return this.lastActivity;
    }
    
    increaseLoginCount(userId: types.user.UserId) {
        const entry = this.getEntry(userId);
        entry.loginAttemptsCount++;
        entry.lastLoginAttempt = DateUtils.now();
    }
    
    getLoginInfo(userId: types.user.UserId) {
        return this.getEntry(userId);
    }
    
    resetLoginCount(userId: types.user.UserId) {
        this.getEntry(userId).loginAttemptsCount = 0;
    }
    
    ban(duration: types.core.Timespan) {
        this.bannedTo = DateUtils.getExpirationDate(duration);
    }
    
    unban() {
        this.bannedTo = undefined;
    }
    
    private getEntry(userId: types.user.UserId) {
        const entry = this.loginRecordsMap.get(userId);
        if (!entry) {
            const loginInfo: LoginRateInfo = {loginAttemptsCount: 0};
            this.loginRecordsMap.set(userId, loginInfo);
            return loginInfo;
        }
        return entry;
    }
}
