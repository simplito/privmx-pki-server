import { ApiValidator } from "../../ApiValidator";

export class AuthApiValidator extends ApiValidator {
    constructor() {
        super();
        
        this.registerMethod("register", this.builder.createObject({
            email: this.builder.email,
            password: this.password,
            organizationName: this.builder.optional(this.organizationName),
            token: this.builder.optional(this.tokenId),
        }));
        
        this.registerMethod("validateAccountToken", this.builder.createObject({
            token: this.tokenId,
        }));
        
        this.registerMethod("resendAccountValidationToken", this.builder.createObject({
            email: this.builder.email,
        }));
        
        this.registerMethod("checkInvitation", this.builder.createObject({
            token: this.tokenId,
        }));
        
        this.registerMethod("startCredentialsReset", this.builder.createObject({
            email: this.builder.email,
        }));
        
        this.registerMethod("checkResetCredentialsToken", this.builder.createObject({
            token: this.tokenId,
        }));
        
        this.registerMethod("resetPassword", this.builder.createObject({
            token: this.tokenId,
            newPassword: this.password,
        }));
        
        this.registerMethod("resetSrpCredentials", this.builder.createObject({
            token: this.tokenId,
            group: this.srpGroup,
            salt: this.hexadecimal,
            verifier: this.hexadecimal,
            pbkdf2Params: this.builder.createObject({
                rounds: this.builder.min(this.builder.int, 100000),
                salt: this.hexadecimal,
            }),
        }));
        
        this.registerMethod("getSrpInfo", this.builder.empty);
        
        this.registerMethod("srpRegister", this.builder.createObject({
            email: this.builder.email,
            group: this.srpGroup,
            salt: this.hexadecimal,
            verifier: this.hexadecimal,
            pbkdf2Params: this.builder.createObject({
                rounds: this.builder.int,
                salt: this.hexadecimal,
            }),
            organizationName: this.builder.optional(this.organizationName),
            token: this.builder.optional(this.tokenId),
        }));
        
        this.registerMethod("startSrpLogin", this.builder.createObject({
            email: this.builder.email,
        }));
        
        this.registerMethod("verifyLicense", this.builder.createObject({
            licenseId: this.id,
        }));
        
        this.registerMethod("token", this.builder.createOneOf([
            this.builder.createObject({
                grantType: this.builder.createConst("client_credentials"),
                clientId: this.apiKeyId,
                clientSecret: this.apiKeySecret,
                scope: this.scopeList,
            }),
            this.builder.createObject({
                grantType: this.builder.createConst("refresh_token"),
                refreshToken: this.builder.maxLength(this.builder.string, 1024),
            }),
            this.builder.createObject({
                grantType: this.builder.createConst("client_signature"),
                clientId: this.apiKeyId,
                scope: this.scopeList,
                nonce: this.builder.maxLength(this.builder.string, 64),
                timestamp: this.timestamp,
                signature: this.builder.maxLength(this.builder.string, 4096),
                data: this.builder.optional(this.builder.maxLength(this.builder.string, 512)),
            }),
        ]));
        
        this.registerMethod("loginForToken", this.builder.createObject({
            email: this.builder.email,
            password: this.password,
            scope: this.builder.optional(this.scopeList),
            rememberDevice: this.builder.optional(this.builder.bool),
        }));
        
        this.registerMethod("bindAccessToken", this.builder.createObject({
            accessToken: this.oauth2Token,
        }));
        
        this.registerMethod("forkToken", this.builder.createObject({
            refreshToken: this.oauth2Token,
            sessionName: this.sessionName,
        }));
        
        this.registerMethod("confirmSrpLoginForToken", this.builder.createObject({
            loginToken: this.tokenId,
            A: this.hexadecimal,
            M1: this.hexadecimal,
            scope: this.builder.optional(this.scopeList),
            rememberDevice: this.builder.optional(this.builder.bool),
        }));
        
        this.registerMethod("resendSecondFactorCode", this.builder.createObject({
            email: this.email,
            challengeId: this.id,
        }));
    }
}
