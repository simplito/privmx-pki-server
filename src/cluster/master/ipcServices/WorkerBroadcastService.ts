import { ApiMethod } from "../../../api/Decorators";
import * as types from "../../../types";
import { IpcService } from "../Decorators";
import { WorkerBroadcastReceiver } from "../../worker/ipcWorkerServices/WorkerBroadcastReceiver";

@IpcService
export class WorkerBroadcastService {
    
    constructor(
        private workerBroadcastReceiver: WorkerBroadcastReceiver,
    ) {
    }
    
    @ApiMethod({})
    async sendWebsocketNotification(model: {users: types.user.UserId[], event: any}): Promise<void> {
        await this.workerBroadcastReceiver.sendWebsocketNotification(model);
    }
    
    @ApiMethod({})
    async deleteAllUserSessions(model: {user: types.user.UserId}): Promise<void> {
        await this.workerBroadcastReceiver.deleteAllUserSessions(model);
    }
    
    @ApiMethod({})
    async deleteAllUserCredentialsSessions(model: {user: types.user.UserId}): Promise<void> {
        await this.workerBroadcastReceiver.deleteAllUserCredentialsSessions(model);
    }
    
    @ApiMethod({})
    async deleteAllApiKeySessions(model: {apiKeyId: types.auth.ClientId}): Promise<void> {
        await this.workerBroadcastReceiver.deleteAllApiKeySessions(model);
    }
}
