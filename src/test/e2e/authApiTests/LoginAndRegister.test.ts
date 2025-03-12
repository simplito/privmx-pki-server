import assert from "assert";
import { Test, shouldThrowErrorWithCode } from "../BaseTestSet";
import { testData } from "../../datasets/testData";
import * as types from "../../../types";
import { ClientSideLoginResult, ClientSrpCredentials, clientSideLogin, clientSideRegister } from "../../commonTestMethods";
import { Hex } from "../../../utils/Hex";
import { JsonRpcClient } from "../../../utils/JsonRpcClient";
import { ClientSignatureJsonRpcClient } from "../../../utils/ClientSignatureClient";
import { Crypto } from "../../../utils/Crypto";
import { UserApiClient } from "../../../api/client/user/UserApiClient";
import { ServerResponse } from "../../../CommonTypes";
import { BaseTestSetWithSession } from "../BaseTestSetWithSession";
import * as authenticator from "authenticator";

export class LoginAndRegisterTests extends BaseTestSetWithSession {
    
    private newUserEmail: types.core.Email = "testuser@example.com" as types.core.Email;
    private newUserPassword: types.core.PlainPassword = "pazzword" as types.core.PlainPassword;
    private pbkdf2RoundsNumber: number = 150000;
    private clientSrpCredentials?: ClientSrpCredentials;
    private clientSideLoginResult?: ClientSideLoginResult;
    private loginToken?: types.core.SrpToken;
    private secondFactorChallengeId?: types.core.ChallengeId;
    private oauthAccessToken?: types.core.AccessToken;
    private oauthRefreshToken?: types.core.RefreshToken;
    private oldOauthAccessToken?: types.core.AccessToken;
    private oldOauthRefreshToken?: types.core.RefreshToken;
    private apiKeyId?: types.auth.ClientId;
    private apiKeySecret?: types.auth.ClientSecret;
    private userApi?: UserApiClient;
    private apiKeyPublicKey?: types.core.PubKey;
    private apiKeyPrivateKey?: types.core.PrivKey;
    private challenge?: types.auth.SecondFactorRequired;
    
    @Test()
    async shouldLogin() {
        await this.shouldNotBeLogged();
        await this.login();
        await this.shouldMatchAdminProfile();
    }
    
    @Test({
        config: {
            openRegistrationEnabled: true,
        },
    })
    async shouldRegister() {
        await this.sendRegisterForm();
        await this.verifyEmailAddress();
        await this.loginOnNewUserAccount();
    }
    
    @Test({
        config: {
            openRegistrationEnabled: true,
        },
    })
    async shouldRegisterAndLoginUsingSrp() {
        await this.performSrpRegistration();
        await this.verifyEmailAddress();
        await this.startSrpLogin();
        await this.confirmSrpLogin();
    }
    
    @Test()
    async shouldLoginUsingEmailAsSecondFactor() {
        await this.login();
        await this.enableEmail2FA();
        await this.confirmEnableEmail2FA();
        await this.loginWithEmail2FA();
        await this.disable2FA();
        await this.confirmDisable2FA();
        await this.login();
    }
    
    @Test()
    async secondFactorTooFastRequestsTest() {
        await this.login();
        await this.enableTotp2FA();
        await this.confirmEnableTotp2FA();
        await this.loginWithoutConfirmingSecondStepYet();
        await this.shouldFailWithTooManyAttemptsInShortTime();
    }
    
    @Test({
        config: {
            apiRateLimit: {
                totpRateLimiterEnabled: false,
                totpUnsuccessfulAttemptsLimit: 2,
            },
        },
    })
    async secondFactorBanTest() {
        await this.login();
        await this.enableTotp2FA();
        await this.confirmEnableTotp2FA();
        await this.loginWithoutConfirmingSecondStepYet();
        await this.shouldGetBannedForTooManyUnsuccesfullAttempts();
    }
    
    @Test()
    async shouldGetInvalidUserOrPasswordErrorOnLoginAtNotExistingUser() {
        await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
            email: "not-existing-account@email.com" as types.core.Email,
            password: "pazz" as types.core.PlainPassword,
        }, undefined), "INVALID_USER_OR_PASSWORD");
    }
    
    @Test()
    async shouldGetInvalidUserOrPasswordErrorOnLoginWithInvalidPassword() {
        await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: "pazz" as types.core.PlainPassword,
        }, undefined), "INVALID_USER_OR_PASSWORD");
    }
    
    @Test()
    async shouldCreateApiKeyAndBeAbleToSendRequest() {
        await this.loginForToken();
        await this.addApiKeyWithSecretUsingToken();
        await this.getProfileWithApiKeyClientCredentials();
        await this.getProfileWithApiKeyClientHmacSignature();
    }
    
    @Test()
    async shouldNotBeAbleToSendRequestAfterApiKeyDisable() {
        await this.loginForToken();
        await this.addApiKeyWithSecretUsingToken();
        await this.getProfileWithApiKeyClientCredentials();
        await this.disableApiKey();
        await this.tryGetProfileWithApiKeyAndFail();
    }
    
    @Test()
    async shouldCreateApiKeyWithPublicKeyAndBeAbleToSendRequest() {
        await this.loginForToken();
        await this.addApiKeyWithPublicKeyUsingToken();
        await this.getProfileWithApiKeyEddsaSignature();
    }
    
    @Test()
    async shouldCreateAccessTokenFromApiKeyAndBeAbleToSendRequest() {
        await this.loginForToken();
        await this.addApiKeyWithSecretUsingToken();
        await this.getAccessTokenWithReadOnlyRightsUsingApiKey();
        await this.getProfileWithAccessToken();
        await this.refreshAccessToken();
        await this.tryGetProfileWithOldTokenAndFail();
        await this.tryRefreshWithOldRefreshTokenAndFail();
        await this.getProfileWithAccessToken();
        await this.tryToSetProfileAndFail();
        await this.disableApiKey();
        await this.tryGetProfileWithAccessTokenAndFailBecauseOfUnauthorize();
    }
    
    @Test()
    async shouldCreateAccessTokenFromSessionAndBeAbleToSendRequest() {
        await this.loginForToken();
        await this.getProfileWithAccessToken();
        await this.refreshAccessToken();
        await this.tryGetProfileWithOldTokenAndFail();
        await this.tryRefreshWithOldRefreshTokenAndFail();
        await this.getProfileWithAccessToken();
    }
    
    @Test({
        config: {
            openRegistrationEnabled: true,
        },
    })
    async shouldRegisterAndLoginUsingSrpWithSecondFactor() {
        await this.performSrpRegistration();
        await this.verifyEmailAddress();
        await this.startSrpLogin();
        await this.confirmSrpLoginForToken();
        await this.enableEmail2FA();
        await this.confirmEnableEmail2FA();
        await this.startSrpLogin();
        await this.confirmSrpLoginForToken2FA();
    }
    
    @Test()
    async shouldEnableSecondFactorAndAddApiKey() {
        await this.login();
        await this.enableEmail2FA();
        await this.confirmEnableEmail2FA();
        await this.getOauthTokenWithSecondFactor();
        await this.addApiKeyWithSecondFactorAuthorization();
    }
    
    private async addApiKeyWithSecondFactorAuthorization() {
        if (!this.userApi) {
            throw new Error("User api not initialized yet");
        }
        
        this.apiKeySecret = "myverylongandsecuresecretforapikey" as types.auth.ClientSecret;
        const res = await this.userApi.addApiKey({
            type: "secret",
            name: "test" as types.auth.ApiKeyName,
            maxScope: ["user:read_write"] as types.core.Scope[],
            clientSecret: this.apiKeySecret,
        });
        
        if (!this.isSecondFactorResult(res)) {
            assert(false, "Unexpected return value: " + JSON.stringify(res, null, 2));
        }
        
        const challenge = res.challenge;
        const authorizationData = await this.helpers.getSecondFactorCodeFromMail();
        
        const res2 = await this.userApi.addApiKey({
            type: "secret",
            name: "test" as types.auth.ApiKeyName,
            maxScope: ["user:read_write"] as types.core.Scope[],
            clientSecret: this.apiKeySecret,
        }, {
            challenge,
            authorizationData,
        });
        assert(!!res2 && "apiKeyId" in res2, "Unexpected return value");
    }
    
    private async confirmSrpLoginForToken2FA() {
        if (!this.clientSideLoginResult || !this.loginToken) {
            throw new Error("SrpLoginConfirm called before srpLoginStart");
        }
        
        const res = await this.apis.auth.confirmSrpLoginForToken({
            A: Hex.bn2Hex(this.clientSideLoginResult.A),
            loginToken: this.loginToken,
            M1: Hex.bn2Hex(this.clientSideLoginResult.M1),
        }, undefined);
        if (!this.isSecondFactorResult(res)) {
            assert(false, "Unexpected return value");
        }
        
        const challenge = res.challenge;
        const authorizationData = await this.helpers.getSecondFactorCodeFromMail();
        
        const res2 = await this.apis.auth.confirmSrpLoginForToken({
            A: Hex.bn2Hex(this.clientSideLoginResult.A),
            loginToken: this.loginToken,
            M1: Hex.bn2Hex(this.clientSideLoginResult.M1),
        }, {
            challenge,
            authorizationData,
        });
        assert(!!res2 && "accessToken" in res2, "Unexpected return value");
        
        this.oauthAccessToken = res2.accessToken;
        this.oauthRefreshToken = res2.refreshToken;
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        this.userApi = new UserApiClient(rpcClient);
    }
    
    private async confirmSrpLoginForToken() {
        if (!this.clientSideLoginResult || !this.loginToken) {
            throw new Error("SrpLoginConfirm called before srpLoginStart");
        }
        
        const res = await this.apis.auth.confirmSrpLoginForToken({
            A: Hex.bn2Hex(this.clientSideLoginResult.A),
            loginToken: this.loginToken,
            M1: Hex.bn2Hex(this.clientSideLoginResult.M1),
        }, undefined);
        
        assert(!!res && "accessToken" in res, "Unexpected return value");
        
        assert(!!res.accessToken, `Unexpecter return value, got: ${JSON.stringify(res, null, 4)}`);
        this.apis.jsonRpcClient.setHeader("Authorization", `Bearer ${res.accessToken}`);
    }
    
    private async getOauthTokenWithSecondFactor() {
        const res = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
            scope: ["user:read_write"] as types.core.Scope[],
        }, undefined);
        if (!this.isSecondFactorResult(res)) {
            assert(false, "Unexpected return value");
        }
        const challenge = res.challenge;
        const authorizationData = await this.helpers.getSecondFactorCodeFromMail();
        
        const res2 = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
            scope: ["user:read_write"] as types.core.Scope[],
        }, {
            challenge,
            authorizationData,
        });
        
        assert(!!res2 && "accessToken" in res2, "Unexpected return value");
        
        this.oauthAccessToken = res2.accessToken;
        this.oauthRefreshToken = res2.refreshToken;
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        this.userApi = new UserApiClient(rpcClient);
        
    }
    
    private async getProfileWithApiKeyEddsaSignature() {
        if (!this.apiKeyId || !this.apiKeyPrivateKey) {
            throw new Error("apiKey id or privkey not set");
        }
        
        const signatureClient = new ClientSignatureJsonRpcClient("http://0.0.0.0:8101/main", {}, this.apiKeyId, this.apiKeyPrivateKey, "eddsa");
        this.userApi = new UserApiClient(signatureClient);
        
        const res = await this.userApi.getProfile();
        
        assert(!!res && res.profile.email === testData.adminEmail, "Unexpected return data");
    }
    
    private async addApiKeyWithPublicKeyUsingToken() {
        if (!this.userApi) {
            throw new Error("User api not initialized yet");
        }
        const {privateKey, publicKey} = Crypto.genKeyPair();
        this.apiKeyPublicKey = publicKey as types.core.PubKey;
        this.apiKeyPrivateKey = privateKey as types.core.PrivKey;
        const res = await this.userApi.addApiKey({
            type: "pubKey",
            name: "test" as types.auth.ApiKeyName,
            maxScope: ["user:read_write"] as types.core.Scope[],
            clientPubKey: this.apiKeyPublicKey,
        });
        this.apiKeyId = res.apiKeyId;
    }
    
    private async tryGetProfileWithApiKeyAndFail() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            throw new Error("apiKey id or secret not set");
        }
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Basic ${btoa(this.apiKeyId + ":" + this.apiKeySecret)}`,
        });
        
        const userApi = new UserApiClient(rpcClient);
        
        await shouldThrowErrorWithCode(() => userApi.getProfile(), "UNAUTHORIZED");
    }
    
    private async disableApiKey() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            throw new Error("apiKey id or secret not set");
        }
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Basic ${btoa(this.apiKeyId + ":" + this.apiKeySecret)}`,
        });
        this.userApi = new UserApiClient(rpcClient);
        
        const res = await this.userApi.updateApiKey({
            apiKeyId: this.apiKeyId,
            enabled: false,
        });
        
        assert(!!res && res === "OK", "Unexpected return data");
    }
    
    private async tryGetProfileWithAccessTokenAndFailBecauseOfUnauthorize() {
        if (!this.oauthAccessToken) {
            throw new Error("oauth access token not set");
        }
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        const userApi = new UserApiClient(rpcClient);
        await shouldThrowErrorWithCode(() => userApi.getProfile(), "UNAUTHORIZED");
    }
    
    private async tryToSetProfileAndFail() {
        if (!this.oauthAccessToken) {
            throw new Error("access token not set");
        }
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        const userApi = new UserApiClient(rpcClient);
        
        await shouldThrowErrorWithCode(() => userApi.setProfile({
            name: "adam" as types.user.Username,
        }), "INSUFFICIENT_SCOPE");
    }
    
    private async tryRefreshWithOldRefreshTokenAndFail() {
        if (!this.oldOauthRefreshToken) {
            throw new Error("old refresh token not set");
        }
        
        const oldRefreshToken = this.oldOauthRefreshToken;
        
        await shouldThrowErrorWithCode(() => this.apis.auth.token({
            grantType: "refresh_token",
            refreshToken: oldRefreshToken,
        }, undefined), "TOKEN_EXPIRED");
    }
    
    private async tryGetProfileWithOldTokenAndFail() {
        if (!this.oldOauthAccessToken) {
            throw new Error("access token not set");
        }
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oldOauthAccessToken}`,
        });
        const userApi = new UserApiClient(rpcClient);
        await shouldThrowErrorWithCode(() => userApi.getProfile(), "UNAUTHORIZED");
    }
    
    private async refreshAccessToken() {
        if (!this.oauthRefreshToken) {
            throw new Error("refresh token not set");
        }
        
        const res = await this.apis.auth.token({
            grantType: "refresh_token",
            refreshToken: this.oauthRefreshToken,
        }, undefined);
        
        assert(!!res, "Unexepcted return value");
        
        this.oldOauthAccessToken = this.oauthAccessToken;
        this.oldOauthRefreshToken = this.oauthRefreshToken;
        
        this.oauthAccessToken = res.accessToken;
        this.oauthRefreshToken = res.refreshToken;
    }
    
    private async getAccessTokenWithReadOnlyRightsUsingApiKey() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            throw new Error("apiKey id or secret not set");
        }
        
        const res = await this.apis.auth.token({
            grantType: "client_credentials",
            clientId: this.apiKeyId,
            clientSecret: this.apiKeySecret,
            scope: ["user:read"] as types.core.Scope[],
        }, undefined);
        
        assert(!!res, "Unexpected return value");
        
        this.oauthAccessToken = res.accessToken;
        this.oauthRefreshToken = res.refreshToken;
    }
    
    private async getProfileWithAccessToken() {
        if (!this.oauthAccessToken) {
            throw new Error("access token not set");
        }
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        this.userApi = new UserApiClient(rpcClient);
        
        const res = await this.userApi.getProfile();
        
        assert(!!res && res.profile.email === testData.adminEmail, "Unexpected return data");
    }
    
    private async loginForToken() {
        const res = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
            scope: ["user:read_write"] as types.core.Scope[],
        }, undefined);
        
        assert(!!res && "accessToken" in res, "Unexpected return value");
        
        this.oauthAccessToken = res.accessToken;
        this.oauthRefreshToken = res.refreshToken;
        
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Bearer ${this.oauthAccessToken}`,
        });
        this.userApi = new UserApiClient(rpcClient);
    }
    
    private async addApiKeyWithSecretUsingToken() {
        if (!this.userApi) {
            throw new Error("User api not initialized yet");
        }
        this.apiKeySecret = "myverylongandsecuresecretforapikey" as types.auth.ClientSecret;
        const res = await this.userApi.addApiKey({
            type: "secret",
            name: "test" as types.auth.ApiKeyName,
            maxScope: ["user:read_write"] as types.core.Scope[],
            clientSecret: this.apiKeySecret,
        });
        this.apiKeyId = res.apiKeyId;
    }
    
    private async getProfileWithApiKeyClientCredentials() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            throw new Error("apiKey id or secret not set");
        }
        const rpcClient = new JsonRpcClient("http://localhost:8101/main", {
            "Authorization": `Basic ${btoa(this.apiKeyId + ":" + this.apiKeySecret)}`,
        });
        this.userApi = new UserApiClient(rpcClient);
        
        const res = await this.userApi.getProfile();
        
        assert(!!res && res.profile.email === testData.adminEmail, "Unexpected return data");
    }
    
    private async getProfileWithApiKeyClientHmacSignature() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            throw new Error("apiKey id or secret not set");
        }
        
        const signatureClient = new ClientSignatureJsonRpcClient("http://0.0.0.0:8101/main", {}, this.apiKeyId, this.apiKeySecret, "hmac");
        this.userApi = new UserApiClient(signatureClient);
        
        const res = await this.userApi.getProfile();
        
        assert(!!res && res.profile.email === testData.adminEmail, "Unexpected return data");
    }
    
    private async shouldFailWithTooManyAttemptsInShortTime() {
        if (!this.challenge) {
            throw new Error("challenge not initialized yet");
        }
        const challenge = this.challenge.challenge;
        await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, {
            authorizationData: "1",
            challenge: challenge,
        }), "SECOND_FACTOR_INVALID_CODE");
        await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, {
            authorizationData: "1",
            challenge: challenge,
        }), "TOO_MANY_TOTP_ATTEMPTS_IN_SHORT_TIME");
    }
    
    private async shouldMatchAdminProfile() {
        const getProfileResponse = await this.apis.user.getProfile();
        assert(getProfileResponse.profile.id === testData.adminId, "profile id does not match dataset");
    }
    
    private async sendRegisterForm() {
        
        const registerResult = await this.apis.auth.register({
            email: this.newUserEmail,
            password: this.newUserPassword,
        });
        assert(!!registerResult.emailVerificationRequired, "Email verificiation  be required");
    }
    
    private async verifyEmailAddress() {
        const token = await this.helpers.getActivationTokenFromMail();
        const validationResult = await this.apis.auth.validateAccountToken({
            token,
        });
        assert(validationResult === "OK", "Invalid token!");
    }
    
    private async loginOnNewUserAccount() {
        const loginResult = await this.apis.auth.loginForToken({
            email: this.newUserEmail,
            password: this.newUserPassword,
        }, undefined);
        assert(!!loginResult.accessToken, `Unexpected return value, got: ${JSON.stringify(loginResult, null, 4)}`);
        this.apis.jsonRpcClient.setHeader("Authorization", `Bearer ${loginResult.accessToken}`);
    }
    
    private async performSrpRegistration() {
        this.clientSrpCredentials = await clientSideRegister(this.newUserEmail, this.newUserPassword, this.pbkdf2RoundsNumber);
        
        const srpRegisterResult = await this.apis.auth.srpRegister({
            email: this.newUserEmail,
            group: this.clientSrpCredentials.groupName,
            pbkdf2Params: {
                rounds: this.pbkdf2RoundsNumber,
                salt: Hex.buf2Hex(this.clientSrpCredentials.pbkdf2Salt),
            },
            salt: Hex.buf2Hex(this.clientSrpCredentials.salt),
            verifier: this.clientSrpCredentials.verifier,
        });
        assert(!!srpRegisterResult.emailVerificationRequired, "Email verificiation should be required");
    }
    
    private async startSrpLogin() {
        if (!this.clientSrpCredentials) {
            throw new Error("Client srp credentialns are not prepared!");
        }
        
        const srpLoginFirstStepResult = await this.apis.auth.startSrpLogin({
            email: this.newUserEmail,
        });
        this.clientSideLoginResult = await clientSideLogin(this.newUserEmail, this.newUserPassword, srpLoginFirstStepResult.B, this.clientSrpCredentials.salt, this.clientSrpCredentials.groupName, this.clientSrpCredentials.pbkdf2Salt, this.pbkdf2RoundsNumber);
        this.loginToken = srpLoginFirstStepResult.loginToken;
    }
    
    private async confirmSrpLogin() {
        if (!this.clientSideLoginResult || !this.loginToken) {
            throw new Error("SrpLoginConfirm called before srpLoginStart");
        }
        
        const confrimSrpLoginResult = await this.apis.auth.confirmSrpLoginForToken({
            A: Hex.bn2Hex(this.clientSideLoginResult.A),
            loginToken: this.loginToken,
            M1: Hex.bn2Hex(this.clientSideLoginResult.M1),
        }, undefined);
        assert(!!confrimSrpLoginResult.accessToken, `Unexpecter return value, got: ${JSON.stringify(confrimSrpLoginResult, null, 4)}`);
        this.apis.jsonRpcClient.setHeader("Authorization", `Bearer ${confrimSrpLoginResult.accessToken}`);
    }
    
    private async enableEmail2FA() {
        const enableSecondFactorResult = await this.apis.user.enableSecondFactor({
            type: "email",
        });
        
        assert(!!enableSecondFactorResult.challengeId, "Token not received");
        this.secondFactorChallengeId = enableSecondFactorResult.challengeId;
    }
    
    private async enableTotp2FA() {
        const enableSecondFactorResult = await this.apis.user.enableSecondFactor({
            type: "totp",
            secret: "JBSWY3DPEHPK3PXP" as types.user.SecondFactorSecret,
        });
        
        assert(!!enableSecondFactorResult.challengeId, "Token not received");
        this.secondFactorChallengeId = enableSecondFactorResult.challengeId;
    }
    
    private async confirmEnableEmail2FA() {
        if (!this.secondFactorChallengeId) {
            throw new Error("confirmEnableSecondFactor called before enableSecondFactor or this.userApi not initialized yet");
        }
        const authorizationData = await this.helpers.getSecondFactorCodeFromMail();
        const confirmEnablingOfSecondFactorResult = await this.apis.user.confirmEnablingOfSecondFactor({
            authorizationData,
            rememberDevice: false,
            challengeId: this.secondFactorChallengeId,
        });
        
        assert(confirmEnablingOfSecondFactorResult === "OK", "confirmEnablingOfSeconfFactor did not return \"OK\"");
    }
    
    private async confirmEnableTotp2FA() {
        if (!this.secondFactorChallengeId) {
            throw new Error("confirmEnableSecondFactor called before enableSecondFactor");
        }
        
        const confirmEnablingOfSecondFactorResult = await this.apis.user.confirmEnablingOfSecondFactor({
            authorizationData: authenticator.generateToken("JBSWY3DPEHPK3PXP") as types.core.SecondFactorAuthorizationCode,
            rememberDevice: false,
            challengeId: this.secondFactorChallengeId,
        });
        
        assert(confirmEnablingOfSecondFactorResult === "OK", "confirmEnablingOfSeconfFactor did not return \"OK\"");
    }
    
    private async disable2FA() {
        const enableSecondFactorResult = await this.apis.user.disableSecondFactor();
        
        assert(!!enableSecondFactorResult.challengeId, "Token not received");
        this.secondFactorChallengeId = enableSecondFactorResult.challengeId;
    }
    
    private async confirmDisable2FA() {
        if (!this.secondFactorChallengeId) {
            throw new Error("confirmDisableSecondFactor called before disableSecondFactor");
        }
        
        const confirmEnablingOfSecondFactorResult = await this.apis.user.confirmDisablingOfSecondFactor({
            authorizationData: await this.helpers.getSecondFactorCodeFromMail(),
            challengeId: this.secondFactorChallengeId,
        });
        
        assert(confirmEnablingOfSecondFactorResult === "OK", "confirmEnablingOfSeconfFactor did not return \"OK\"");
    }
    
    private async loginWithoutConfirmingSecondStepYet() {
        const res = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, undefined);
        
        assert("secondFactorRequired" in res, "Second factor should be required");
        this.challenge = res as unknown as types.auth.SecondFactorRequired;
    }
    
    private async shouldGetBannedForTooManyUnsuccesfullAttempts() {
        if (!this.challenge) {
            throw new Error("challenge not initialized yet");
        }
        const challenge = this.challenge.challenge;
        for (let i = 0 ; i < 2; i++ ) {
            await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
                email: testData.adminEmail,
                password: testData.adminPassword,
            },
            {
                authorizationData: "1" as types.core.SecondFactorAuthorizationCode,
                challenge: challenge,
            }), "SECOND_FACTOR_INVALID_CODE");
        }
        await shouldThrowErrorWithCode(() => this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        },
        {
            authorizationData: "1" as types.core.SecondFactorAuthorizationCode,
            challenge: challenge,
        }), "TOO_MANY_UNSUCCSESSFUL_TOTP_ATTEMPTS");
        try {
            await this.apis.auth.loginForToken({
                email: testData.adminEmail,
                password: testData.adminPassword,
            },
            {
                authorizationData: "1" as types.core.SecondFactorAuthorizationCode,
                challenge: challenge,
            });
            assert(false, "confrimSecondFactor should throw error");
        }
        catch (e) {
            const responseErrorBody = (e as {response: ServerResponse}).response.body.toString();
            assert(!!responseErrorBody && responseErrorBody === "Too Many Requests", `Expected error "Too many requests", got: ${JSON.stringify(e, null, 2)}`);
        }
    }
    
    private isSecondFactorResult(res: unknown): res is types.auth.SecondFactorRequired {
        return !!res && typeof(res) === "object" && "secondFactorRequired" in res && "challenge" in res && res.secondFactorRequired === true;
    }
}
