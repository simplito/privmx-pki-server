import { ApiValidator } from "../../ApiValidator";

export class UserApiValidator extends ApiValidator {
    constructor() {
        super();
        
        const userName = this.builder.rangeLength(this.builder.string, 2, 128);
        const token = this.builder.rangeLength(this.builder.string, 16, 48);
        const channels = this.builder.createListWithMaxLength(this.channel, 128);
        
        this.registerMethod("checkAuthorization", this.builder.empty);
        
        this.registerMethod("changePassword", this.builder.createObject({
            newPassword: this.password,
            currentPassword: this.password,
        }));
        
        this.registerMethod("enableSecondFactor", this.builder.createOneOf([
            this.builder.createObject({
                type: this.builder.createConst("email"),
            }),
            this.builder.createObject({
                type: this.builder.createConst("totp"),
                secret: this.builder.rangeLength(this.builder.string, 10, 128),
            }),
        ], "type"));
        
        this.registerMethod("confirmEnablingOfSecondFactor", this.builder.createObject({
            challengeId: this.id,
            authorizationData: this.secondFactorAuthorizationCode,
            rememberDevice: this.builder.bool,
        }));
        
        this.registerMethod("disableSecondFactor", this.builder.empty);
        
        this.registerMethod("confirmDisablingOfSecondFactor", this.builder.createObject({
            challengeId: this.id,
            authorizationData: this.secondFactorAuthorizationCode,
        }));
        
        this.registerMethod("resendSecondFactorCode", this.builder.createObject({
            challengeId: this.id,
        }));
        
        this.registerMethod("revokeToken", this.builder.createObject({
            token: token,
        }));
        
        this.registerMethod("getProfile", this.builder.empty);
        
        this.registerMethod("setProfile", this.builder.createObject({
            name: userName,
        }));
        
        this.registerMethod("getInfo", this.builder.empty);
        
        this.registerMethod("startSrpCredentialsChange", this.builder.empty);
        
        this.registerMethod("confirmSrpCredentialsChange", this.builder.createObject({
            credentialsChangeToken: this.tokenId,
            A: this.hexadecimal,
            M1: this.hexadecimal,
            group: this.srpGroup,
            salt: this.hexadecimal,
            verifier: this.hexadecimal,
            pbkdf2Params: this.builder.createObject({
                rounds: this.builder.int,
                salt: this.hexadecimal,
            }),
        }));
        
        this.registerMethod("subscribeToWebSocketChannel", this.builder.createObject({
            channels: channels,
        }));
        
        this.registerMethod("unsubscribeFromWebSocketChannel", this.builder.createObject({
            channels: channels,
        }));
        
        this.registerMethod("listUserTokens", this.listModel);
        
        this.registerMethod("addApiKey", this.builder.createOneOf([
            this.builder.createObject({
                type: this.builder.createConst("secret"),
                name: this.apiKeyName,
                clientSecret: this.apiKeySecret,
                maxScope: this.scopeList,
            }),
            this.builder.createObject({
                type: this.builder.createConst("pubKey"),
                name: this.apiKeyName,
                clientPubKey: this.ed25519PemPublicKey,
                maxScope: this.scopeList,
            }),
        ], "type"));
        
        this.registerMethod("deleteApiKey", this.builder.createObject({
            apiKeyId: this.apiKeyId,
        }));
        
        this.registerMethod("getApiKey", this.builder.createObject({
            apiKeyId: this.apiKeyId,
        }));
        
        this.registerMethod("listApiKeys", this.builder.empty);
        
        this.registerMethod("updateApiKey", this.builder.createObject({
            apiKeyId: this.id,
            name: this.builder.optional(this.apiKeyName),
            enabled: this.builder.optional(this.builder.bool),
            maxScope: this.builder.optional(this.scopeList),
        }));
        
        this.registerMethod("forgetAllDevices", this.builder.empty);
    }
}
