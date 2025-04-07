import { ApiValidator } from "../../ApiValidator";

export class PkiApiValidator extends ApiValidator {
    constructor() {
        super();
        
        this.registerMethod("getCurrentKey", this.builder.createObject({
            userId: this.userId,
            instanceId: this.eccPub,
            contextId: this.contextId,
        }));
        
        this.registerMethod("getKeyAt", this.builder.createObject({
            userId: this.userId,
            instanceId: this.eccPub,
            contextId: this.contextId,
            date: this.timestamp,
        }));
        
        this.registerMethod("getKeyHistory", this.builder.createObject({
            userId: this.userId,
            instanceId: this.eccPub,
            contextId: this.contextId,
        }));
        
        this.registerMethod("verifyKey", this.builder.createObject({
            userId: this.userId,
            instanceId: this.eccPub,
            contextId: this.contextId,
            userPubKey: this.pubKey,
            date: this.timestamp,
        }));
        
        this.registerMethod("verifyHostById", this.builder.createObject({
            instanceId: this.eccPub,
            hostUrl: this.url,
        }));
        
        this.registerMethod("verifyHostByPub", this.builder.createObject({
            hostPubKey: this.eccPub,
            hostUrl: this.url,
        }));
        
        this.registerMethod("getHost", this.builder.createObject({
            instanceId: this.builder.optional(this.eccPub),
            hostUrl: this.builder.optional(this.url),
        }));
    }
}
