import assert from "assert";
import { BaseTestSet, Test, shouldThrowErrorWithCode as shouldThrowErrorWithCode } from "../BaseTestSet";
import { testData } from "../../datasets/testData";
import { WebSocketClient, WebSocketJsonRpcRequester } from "../../../utils/WebSocketClient";
import * as types from "../../../types";
import { JsonRpcClient } from "../../../utils/JsonRpcClient";
import { AuthApiClient } from "../../../api/client/auth/AuthApiClient";
import { UserApiClient } from "../../../api/client/user/UserApiClient";

export class WebsocketTests extends BaseTestSet {
    
    private ws?: WebSocketJsonRpcRequester;
    private wsAuthApi?: AuthApiClient;
    private wsUserApi?: UserApiClient;
    private oauthAccessToken?: types.core.AccessToken;
    private oauthRefreshToken?: types.core.RefreshToken;
    
    @Test()
    async shouldAuthorizeWebsocketWithAccessTokenUsingClientCredentials() {
        await this.connectToWebsocket();
        await this.shouldNotFetchProfile();
        await this.authorizeWebsocketAsTokenWithClientCredentials();
        await this.bindAccessToken();
        await this.fetchMatchingProfile();
        await this.shouldNotSetProfile();
        await this.tryToGetProfileOutsideWebsocketConnectionAndFail();
        await this.refreshToken();
        await this.tryFetchProfileAndFail();
        await this.bindAccessToken();
        await this.fetchMatchingProfile();
    }
    
    @Test()
    async shouldAuthorizeWebsocketWithAccessTokenUsingLoginForToken() {
        await this.connectToWebsocket();
        await this.shouldNotFetchProfile();
        await this.authorizeWebsocketAsTokenWithLoginForToken();
        await this.bindAccessToken();
        await this.fetchMatchingProfile();
        await this.shouldNotSetProfile();
        await this.tryToGetProfileOutsideWebsocketConnectionAndFail();
        await this.refreshToken();
        await this.tryFetchProfileAndFail();
        await this.bindAccessToken();
        await this.fetchMatchingProfile();
    }
    
    private async authorizeWebsocketAsTokenWithLoginForToken() {
        if (!this.wsAuthApi) {
            throw new Error("wsAuthApi not initialized yet");
        }
        
        const response = await this.wsAuthApi.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
            scope: ["user:read", "connection"] as types.core.Scope[],
        }, undefined);
        
        assert(!!response && "accessToken" in response, "Unexpected resposne from loginForToken");
        
        this.oauthAccessToken = response.accessToken;
        this.oauthRefreshToken = response.refreshToken;
    }
    
    private async tryFetchProfileAndFail() {
        if (!this.wsUserApi) {
            throw new Error("wsUserApi not initialized yet");
        }
        const wsUserApi = this.wsUserApi;
        await shouldThrowErrorWithCode(() => wsUserApi.getProfile(), "UNAUTHORIZED");
    }
    
    private async refreshToken() {
        if (!this.wsAuthApi || !this.oauthRefreshToken) {
            throw new Error("wsAuthApi or oauthAccessToken not initialized yet");
        }
        
        const res = await this.wsAuthApi.token({
            grantType: "refresh_token",
            refreshToken: this.oauthRefreshToken,
        }, undefined);
        
        this.oauthAccessToken = res.accessToken;
        this.oauthRefreshToken = res.refreshToken;
    }
    
    private async bindAccessToken() {
        if (!this.wsAuthApi || !this.oauthAccessToken) {
            throw new Error("wsAuthApi or oauthAccessToken not initialized yet");
        }
        const res = await this.wsAuthApi.bindAccessToken({
            accessToken: this.oauthAccessToken,
        });
        
        assert(res === "OK", "Unexpected return value from function bindAccessToken");
    }
    
    private async fetchMatchingProfile() {
        if (!this.wsUserApi) {
            throw new Error("wsUserApi not initialized yet");
        }
        
        const getProfileResponse2 = await this.wsUserApi.getProfile();
        assert(getProfileResponse2.profile.id === testData.adminId);
    }
    
    private async authorizeWebsocketAsTokenWithClientCredentials() {
        if (!this.wsAuthApi) {
            throw new Error("wsAuthApi not initialized yet");
        }
        
        const response = await this.wsAuthApi.token({
            grantType: "client_credentials",
            clientId: testData.apiKeyId,
            clientSecret: testData.apiKeySecret,
            scope: ["user:read", "connection"] as types.core.Scope[],
        }, undefined);
        
        this.oauthAccessToken = response.accessToken;
        this.oauthRefreshToken = response.refreshToken;
    }
    
    private async shouldNotFetchProfile() {
        const wsUserApi = this.wsUserApi;
        if (!wsUserApi) {
            throw new Error("wsUserApi not initialized yet");
        }
        
        await shouldThrowErrorWithCode(() => wsUserApi.getProfile(), "UNAUTHORIZED");
    }
    
    private async connectToWebsocket() {
        this.ws = await WebSocketClient.connectToWs("ws://" + this.config.host + ":" + this.config.port);
        this.wsAuthApi = new AuthApiClient(this.ws);
        this.wsUserApi = new UserApiClient(this.ws);
    }
    
    private async shouldNotSetProfile() {
        const wsUserApi = this.wsUserApi;
        if (!wsUserApi) {
            throw new Error("wsUserApi not initialized yet");
        }
        
        await shouldThrowErrorWithCode(() => wsUserApi.setProfile({
            name: "Jan" as types.user.Username,
        }), "INSUFFICIENT_SCOPE");
    }
    
    private async tryToGetProfileOutsideWebsocketConnectionAndFail() {
        if (!this.oauthAccessToken) {
            throw new Error("access token not set");
        }
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        const userApi = new UserApiClient(rpcClient);
        
        await shouldThrowErrorWithCode(() => userApi.getProfile(), "UNAUTHORIZED");
    }
}
