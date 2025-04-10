/* eslint-disable max-classes-per-file */

import * as types from "../types";
import * as db from "../db/Model";
import { WebSocketInfo } from "../CommonTypes";
import { ScopeDefinition } from "../api/Decorators";

export interface OauthTokenInfo {
    scope: types.core.Scope[];
    userId: types.user.UserId;
    sessionId: types.auth.SessionId;
    seq: number,
    expires: types.core.Timestamp,
    clientId?: types.auth.ClientId;
    user?: db.User;
}

export interface ApiKeyInfo {
    scope: types.core.Scope[];
    userId: types.user.UserId;
    clientId: types.auth.ClientId;
}

export class AuthorizationInfo {
    
    public readonly type = "user";
    
    constructor(
        public readonly user: types.user.UserId,
        public readonly agentId: types.core.AgentId|null,
        public readonly sessionId: types.auth.SessionId|null,
        public readonly ip: types.core.IpAddress,
    ) {
    }
}

export class AuthorizationHolder {
    private oauthTokenInfo?: OauthTokenInfo;
    private webSocketInfo?: WebSocketInfo;
    private apiKeyInfo?: ApiKeyInfo;
    private agentId?: types.core.AgentId;
    
    isAuthorizedWithScope() {
        return !!this.apiKeyInfo || !!this.oauthTokenInfo;
    }
    
    isAuthorizedKeyOrTokenWithScope(requestedScopes: ScopeDefinition) {
        return this.isAuthorizedApiKeyWithScope(requestedScopes) || this.isAuthorizedAsTokenWithScope(requestedScopes);
    }
    
    isAuthorizedAsTokenWithScope(requestedScopes: ScopeDefinition) {
        const info = this.oauthTokenInfo;
        if (!info) {
            return false;
        }
        return this.doesScopeDefinitionMatchAuthorizedScope(requestedScopes, info.scope);
    }
    
    isAuthorizedApiKeyWithScope(requestedScopes: ScopeDefinition) {
        const info = this.apiKeyInfo;
        if (!info) {
            return false;
        }
        return this.doesScopeDefinitionMatchAuthorizedScope(requestedScopes, info.scope);
    }
    
    doesScopeDefinitionMatchAuthorizedScope(requestedScopes: ScopeDefinition, scope: types.core.Scope[]) {
        return requestedScopes === "ignore" || (requestedScopes.length > 0 && requestedScopes.every(s => scope.includes(s as types.core.Scope)));
    }
    
    getUserId() {
        if (this.oauthTokenInfo) {
            return this.oauthTokenInfo.userId;
        }
        if (this.apiKeyInfo) {
            return this.apiKeyInfo.userId;
        }
        throw new Error("Not authorized as user");
    }
    
    getAgentId() {
        return this.agentId;
    }
    
    authorizeAsTokenWithScope(scope: types.core.Scope[], seq: number, sessionId: types.auth.SessionId,  userId: types.user.UserId, expires: types.core.Timestamp, clientId?: types.auth.ClientId, user?: db.User) {
        this.oauthTokenInfo = {
            scope,
            userId,
            seq,
            sessionId,
            expires,
            clientId,
            user,
        };
    }
    
    authorizeAsApiKey(scope: types.core.Scope[], userId: types.user.UserId, clientId: types.auth.ClientId) {
        this.apiKeyInfo = {
            clientId,
            userId,
            scope,
        };
    }
    
    setAsWebSocketConnection(webSocketInfo: WebSocketInfo) {
        this.webSocketInfo = webSocketInfo;
    }
    
    setAgentId(agentId: types.core.AgentId) {
        this.agentId = agentId;
    }
    
    getWebsocketWebSocketInfo() {
        if (!this.webSocketInfo) {
            throw new Error("Not connected as websocket");
        }
        
        return this.webSocketInfo;
    }
}
