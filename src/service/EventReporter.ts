import { AppException } from "../api/AppException";
import { Logger } from "../utils/Logger";
import { ErrorService } from "./ErrorService";
import { HttpClientError } from "../api/HttpError";

export class EventReporter {
    
    constructor(
        private logger: Logger,
        private errorService: ErrorService,
    ) {
    }
    
    reportSuccessfulApiRequest(method?: string) {
        this.logger.log(`api;${method};success`);
    }
    
    report2FARequiredApiRequest(method?: string) {
        this.logger.log(`api;${method};2fa-required`);
    }
    
    reportUnsuccessfulApiRequest(rayId: string, e: unknown, method?: string) {
        this.logger.error(`api;${method};error RayId=${rayId}`, e);
        if (!(e instanceof AppException) && !(e instanceof HttpClientError)) {
            this.errorService.sendErrorMail(rayId, e);
        }
    }
    
    reportError(rayId: string, e: unknown, url?: string) {
        this.logger.error(`Error during processing request RayId=${rayId}`, url, e);
        this.errorService.sendErrorMail(rayId, e);
    }
}
