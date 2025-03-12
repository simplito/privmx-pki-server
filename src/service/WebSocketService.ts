import * as types from "../types";
import { WebSocketInfo } from "../CommonTypes";
import { WorkerBroadcastService } from "../cluster/master/ipcServices/WorkerBroadcastService";

export class WebSocketService {
    
    constructor(
        private workerBroadcastService: WorkerBroadcastService,
    ) {
    }
    
    /* @ignore-next-line-reference */
    async deleteAllUserSessions(user: types.user.UserId): Promise<void> {
        await this.workerBroadcastService.deleteAllUserSessions({user});
    }
    
    async deleteAllUserCredentialsSessions(user: types.user.UserId): Promise<void> {
        await this.workerBroadcastService.deleteAllUserCredentialsSessions({user});
    }
    
    async deleteAllApiKeySessions(apiKeyId: types.auth.ClientId): Promise<void> {
        await this.workerBroadcastService.deleteAllApiKeySessions({apiKeyId});
    }
    
    /* @ignore-next-line-reference */
    async sendWebsocketNotification(users: types.user.UserId[], event: types.notification.Event): Promise<void> {
        await this.workerBroadcastService.sendWebsocketNotification({users, event});
    }
    
    async subscribeWebSocketToChannel(socketInfo: WebSocketInfo, channels: types.core.ChannelName[]) {
        for (const channel of channels) {
            if (!socketInfo.channels.includes(channel)) {
                socketInfo.channels.push(channel);
            }
        }
    }
    
    async unsubscribeWebSocketFromChannel(socketInfo: WebSocketInfo, channels: types.core.ChannelName[]) {
        socketInfo.channels = socketInfo.channels.filter(x => !channels.includes(x));
    }
}
