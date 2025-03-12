import { WebSocketExtended } from "../../CommonTypes";
import * as types from "../../types";
import * as WebSocket from "ws";

export class WebSocketInnerManager {
    
    private servers: WebSocket.Server[] = [];
    
    registerServer(server: WebSocket.Server) {
        this.servers.push(server);
    }
    
    async notifyUsers(users: types.user.UserId[], event: types.notification.Event): Promise<void> {
        if (users != null && users.length == 0) {
            return;
        }
        for (const server of this.servers) {
            for (const client of server.clients) {
                const ws = <WebSocketExtended>client;
                const tokenInfo = ws.additionalSocketInfo.tokenInfo;
                const channels = ws.additionalSocketInfo.channels;
                if (tokenInfo && ("userId" in tokenInfo) && users.includes(tokenInfo.userId) && channels.includes(event.channel)) {
                    ws.send(JSON.stringify(event));
                }
            }
        }
    }
    
    async deleteAllUserSessions(user: types.user.UserId) {
        for (const server of this.servers) {
            for (const client of server.clients) {
                const ws = <WebSocketExtended>client;
                const authorizationInfo = ws.additionalSocketInfo.authorization;
                if (authorizationInfo && ("userId" in authorizationInfo) && authorizationInfo.userId === user) {
                    ws.additionalSocketInfo.tokenInfo = undefined;
                }
            }
        }
    };
    
    async deleteAllUserCredentialsSessions(user: types.user.UserId) {
        for (const server of this.servers) {
            for (const client of server.clients) {
                const ws = <WebSocketExtended>client;
                const authorizationInfo = ws.additionalSocketInfo.authorization;
                if (authorizationInfo && ("userId" in authorizationInfo) && authorizationInfo.userId === user &&  ws.additionalSocketInfo.tokenInfo && !ws.additionalSocketInfo.tokenInfo.clientId) {
                    ws.additionalSocketInfo.tokenInfo = undefined;
                }
            }
        }
    };
    
    async deleteAllApiKeySessions(apiKeyId: types.auth.ClientId) {
        for (const server of this.servers) {
            for (const client of server.clients) {
                const ws = <WebSocketExtended>client;
                if ( ws.additionalSocketInfo.tokenInfo && ws.additionalSocketInfo.tokenInfo.clientId === apiKeyId) {
                    ws.additionalSocketInfo.tokenInfo = undefined;
                }
            }
        }
    };
}
