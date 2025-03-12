import { Logger } from "../../utils/Logger";
import { ConfigService } from "../ConfigService";
import { MailValidator } from "./MailValidator";
import * as fs from "fs";

export class MailListsLoader {
    
    constructor(
        private mailValidator: MailValidator,
        private configService: ConfigService,
        private logger: Logger,
    ) {}
    
    loadLists() {
        try {
            const whiteListPath = this.configService.values.mailBlackWhiteListDir + "/whitelist.txt";
            const blackListPath = this.configService.values.mailBlackWhiteListDir + "/blacklist.txt";
            
            if (fs.existsSync(whiteListPath)) {
                this.logger.debug("Reading email whitelist file '" + whiteListPath + "'");
                const whitelist = fs.readFileSync(whiteListPath, "utf8").toString().split("\n");
                this.mailValidator.setWhitelist(whitelist);
            }
            if (fs.existsSync(blackListPath)) {
                this.logger.debug("Reading email blacklist file '" + blackListPath + "'");
                const blacklist = fs.readFileSync(blackListPath, "utf8").toString().split("\n");
                this.mailValidator.setBlacklist(blacklist);
            }
        }
        catch (e) {
            this.logger.error("Cannot read mail lists", e);
            throw e;
        }
    }
}
