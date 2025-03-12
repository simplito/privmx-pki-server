import { Logger } from "../../utils/Logger";
import { IpcRequest, IpcResponseError, IpcResponseSuccess } from "./Ipc";
import { MethodExecutor } from "./MethodExecutor";

export class IpcExecutor {
    
    constructor(
        private methodExecutor: MethodExecutor,
        private logger: Logger,
    ) {
    }
    
    async execute(data: IpcRequest) {
        try {
            const result = await this.methodExecutor.execute(data.method, data.params);
            const response: IpcResponseSuccess = {id: data.id, result: typeof(result) === "undefined" ? null : result};
            return response;
        }
        catch (e) {
            this.logger.error("Error during processing request", data.id, data.method, e);
            const response: IpcResponseError = {id: data.id, error: "" + e};
            return response;
        }
    }
}
