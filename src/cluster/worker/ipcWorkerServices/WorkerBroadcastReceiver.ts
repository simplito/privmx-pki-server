import { ApiMethod } from "../../../api/Decorators";
import { WebSocketInnerManager } from "../WebSocketInnerManager";
import * as types from "../../../types";
import { WorkerIpcService } from "../../master/Decorators";

@WorkerIpcService
export class WorkerBroadcastReceiver {
    
    constructor(
        private webSocketInnerManager: WebSocketInnerManager,
    ) {
    }
    
    @ApiMethod({})
    async sendWebsocketNotification(model: {users: types.user.UserId[], event: types.notification.Event}): Promise<void> {
        return this.webSocketInnerManager.notifyUsers(model.users, model.event);
    }
    
    @ApiMethod({})
    async deleteAllUserSessions(model: {user: types.user.UserId}): Promise<void> {
        return this.webSocketInnerManager.deleteAllUserSessions(model.user);
    }
    
    @ApiMethod({})
    async deleteAllUserCredentialsSessions(model: {user: types.user.UserId}): Promise<void> {
        return this.webSocketInnerManager.deleteAllUserCredentialsSessions(model.user);
    }
    
    @ApiMethod({})
    async deleteAllApiKeySessions(model: {apiKeyId: types.auth.ClientId}): Promise<void> {
        return this.webSocketInnerManager.deleteAllApiKeySessions(model.apiKeyId);
    }
    
}
