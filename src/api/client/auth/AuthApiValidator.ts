import { ApiValidator } from "../../ApiValidator";

export class AuthApiValidator extends ApiValidator {
    constructor() {
        super();
        
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
        
        this.registerMethod("bindAccessToken", this.builder.createObject({
            accessToken: this.oauth2Token,
        }));
        
        this.registerMethod("forkToken", this.builder.createObject({
            refreshToken: this.oauth2Token,
            sessionName: this.sessionName,
        }));
    }
}
