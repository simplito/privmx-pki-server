import { ApiMethod } from "../../../api/Decorators";
import * as types from "../../../types";
import { ConfigService } from "../../../service/ConfigService";
import { DateUtils } from "../../../utils/DateUtils";
import { IpcService } from "../Decorators";
import { LoginRateInfo, LoginLimiterRequestModel, BanIpAdressModel, IpMapEntry, UnbanIpAdressModel, PayAdditionalCostModel } from "../IpcServicesTypes/IpRateLimiterTypes";

@IpcService
export class IpRateLimiter {
    
    private ipMap: Map<types.core.IpAddress, IpMapEntry>;
    
    constructor(
        private configService: ConfigService,
    ) {
        this.ipMap = new Map();
    }
    
    @ApiMethod({})
    async canPerformRequest(ip: types.core.IpAddress): Promise<boolean> {
        return this.canPerformRequestWithCost(ip, this.configService.values.apiRateLimit.requestCost);
    }
    
    @ApiMethod({})
    async payAdditionalCostIfPossible(model: PayAdditionalCostModel): Promise<boolean> {
        return this.canPerformRequestWithCost(model.ip, model.cost);
    }
    
    @ApiMethod({})
    async increaseLoginCount(model: LoginLimiterRequestModel): Promise<void> {
        const entry = this.getEntry(model.ip);
        entry.increaseLoginCount(model.userId);
    }
    
    @ApiMethod({})
    async getLoginRateInfo(model: LoginLimiterRequestModel): Promise<LoginRateInfo> {
        const entry = this.getEntry(model.ip);
        return entry.getLoginInfo(model.userId);
    }
    
    @ApiMethod({})
    async resetLoginCount(model: LoginLimiterRequestModel): Promise<void> {
        const entry = this.getEntry(model.ip);
        entry.resetLoginCount(model.userId);
    }
    
    @ApiMethod({})
    async banIpAdress(model: BanIpAdressModel): Promise<void> {
        const entry = this.getEntry(model.ip);
        entry.ban(model.banDuration);
    }
    
    @ApiMethod({})
    async unbanIpAdress(model: UnbanIpAdressModel): Promise<void> {
        const entry = this.getEntry(model.ip);
        entry.unban();
    }
    
    private get whitelist() {
        return this.configService.values.apiRateLimit.whitelist;
    }
    
    canPerformRequestWithCost(ip: types.core.IpAddress, cost: number): boolean {
        if (this.whitelist.includes(ip)) {
            return true;
        }
        const entry = this.getEntry(ip);
        if (entry.banned && DateUtils.now() < entry.banned) {
            return false;
        }
        const paymentPerformed = entry.payIfPossible(cost);
        return paymentPerformed;
    }
    
    async addCreditsAndRemoveInactive(): Promise<void> {
        const inactive: types.core.IpAddress[] = [];
        for (const [ip, ipEntry] of this.ipMap.entries()) {
            if (this.isEntryInactive(ipEntry)) {
                inactive.push(ip);
            }
            else {
                ipEntry.addCredits(this.configService.values.apiRateLimit.creditAddon);
            }
        }
        for (const ip of inactive) {
            this.ipMap.delete(ip);
        }
    }
    
    private isEntryInactive(ipEntry: IpMapEntry) {
        return ipEntry.getCredits() >= this.configService.values.apiRateLimit.maxCredit && ipEntry.getLastActivityTime() + this.configService.values.apiRateLimit.inactiveTime < DateUtils.now();
    }
    
    private getEntry(ip: types.core.IpAddress) {
        if (!this.ipMap.has(ip)) {
            const cfg = this.configService.values.apiRateLimit;
            this.ipMap.set(ip, new IpMapEntry(cfg.initialCredit, cfg.maxCredit));
        }
        return <IpMapEntry> this.ipMap.get(ip);
    }
}
