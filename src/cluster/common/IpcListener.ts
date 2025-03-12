import { IpcResponse } from "./Ipc";
import { DeferredMap } from "./DeferredMap";
import { Logger } from "../../utils/Logger";

export class IpcListener {
    
    constructor(
        private ipcRequestMap: DeferredMap,
        private logger: Logger,
    ) {
    }
    
    onMessage(message: IpcResponse) {
        const defer = this.ipcRequestMap.pop(message.id);
        if (!defer) {
            this.logger.error("Invalid id of ipc response message");
            return;
        }
        if ("result" in message) {
            defer.resolve(message.result);
        }
        else {
            defer.reject(message.error);
        }
    }
}
