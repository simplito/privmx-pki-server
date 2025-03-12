import { IpRateLimiter } from "../cluster/master/ipcServices/IpRateLimiter";
import { LoginRateInfo } from "../cluster/master/IpcServicesTypes/IpRateLimiterTypes";
import * as types from "../types";

export class IpRateLimiterService {
    
    constructor(
        private ipRateLimiter: IpRateLimiter,
        private ip: types.core.IpAddress,
    ) {}
    
    getIp() {
        return this.ip;
    }
    
    canThisIpPerformRequest(): Promise<boolean> {
        return this.ipRateLimiter.canPerformRequest(this.ip);
    }
    
    increaseLoginCountForThisIp(userId: types.user.UserId): Promise<void> {
        return this.ipRateLimiter.increaseLoginCount({ip: this.ip, userId});
    }
    
    getLoginRateInfoForThisIp(userId: types.user.UserId): Promise<LoginRateInfo> {
        return this.ipRateLimiter.getLoginRateInfo({ip: this.ip, userId});
    }
    
    resetLoginCountForThisIp(userId: types.user.UserId): Promise<void> {
        return this.ipRateLimiter.resetLoginCount({ip: this.ip, userId});
    }
    
    banThisIpAdress(banDuration: types.core.Timespan): Promise<void> {
        return this.ipRateLimiter.banIpAdress({ip: this.ip, banDuration: banDuration});
    }
}
