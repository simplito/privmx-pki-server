import { Utils } from "../utils/Utils";
import * as dns from "dns";

export class DnsService {
    
    async hasMxRecords(domain: string) {
        const mXRecords = await Utils.tryPromise(() => dns.promises.resolveMx(domain));
        if (!mXRecords.success) {
            return false;
        }
        return (mXRecords.result.length !== 0 && mXRecords.result.sort((a, b) => (a > b ? 1 : -1))[0].exchange !== "");
    }
}