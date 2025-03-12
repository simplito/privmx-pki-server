import * as types from "../types";
import { ConfigService } from "./ConfigService";

export class UrlService {
    
    constructor(
        private configService: ConfigService,
    ) {
    }
    
    createEmailVerificationLink(token: types.core.TokenId) {
        return this.concatUrl(this.configService.values.uiBaseUrl, `/user/activateAccount/${token}`);
    }
    
    createPasswordChangeLink(token: types.core.TokenId) {
        return this.concatUrl(this.configService.values.uiBaseUrl, `/user/resetPassword/${token}`);
    }
    
    private concatUrl(a: string, b: string) {
        if (a.endsWith("/") && b.startsWith("/")) {
            return (a + b.slice(0)) as types.core.Url;
        }
        if (!a.endsWith("/") && !b.startsWith("/")) {
            return (a + "/" + b) as types.core.Url;
        }
        return (a + b) as types.core.Url;
    }
}
