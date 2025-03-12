import { Logger } from "../../utils/Logger";
import { IpcChannelMessage, isIpcChannelMessage, isIpcRequest, isIpcResponse} from "./Ipc";
import { IpcExecutor } from "./IpcExecutor";
import { IpcListener } from "./IpcListener";
import * as child from "child_process";

export class IpcMessageProcessor {
    
    constructor(
        private ipcExecutor: IpcExecutor,
        private ipcListener: IpcListener,
        private logger: Logger,
    ) {
    }
    
    async processMessage(message: any, senderName: string, responseChannel: {send(message: child.Serializable): void}) {
        if (!isIpcChannelMessage(message)) {
            this.logger.error(`Invalid ipc channel message from ${senderName}`);
            return;
        }
        if (message.channel === "request") {
            if (!isIpcRequest(message.data)) {
                this.logger.error(`Invalid ipc request message from ${senderName}`);
                return;
            }
            const response = await this.ipcExecutor.execute(message.data);
            const res: IpcChannelMessage = {channel: "response", data: response};
            responseChannel.send(res);
        }
        else if (message.channel === "response") {
            if (!isIpcResponse(message.data)) {
                this.logger.error(`Invalid ipc response message from ${senderName}`, message);
                return;
            }
            this.ipcListener.onMessage(message.data);
        }
        else {
            this.logger.error(`Unsupported channel '${message.channel}' in ipc message from ${senderName}`);
            return;
        }
    }
}
