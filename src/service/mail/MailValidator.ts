import { AppException } from "../../api/AppException";
import * as types from "../../types";
import { DnsService } from "../DnsService";

export class MailValidator {
    
    private whiteList: string[] = [];
    private blackList: string[] = [];
    
    constructor(
        private dnsService: DnsService,
    ) {}
    
    async validateEmail(email: types.core.Email) {
        const domain = email.split("@")[1];
        if (this.whiteList.includes(domain)) {
            return;
        }
        if (this.blackList.includes(domain) || domain.endsWith(".local") || !(await this.dnsService.hasMxRecords(domain))) {
            throw new AppException("INVALID_EMAIL");
        }
    }
    
    public setBlacklist(blackList: string[]) {
        this.blackList = blackList;
    }
    
    public setWhitelist(whiteList: string[]) {
        this.whiteList = whiteList;
    }
}