import { ApiValidator } from "../../ApiValidator";

export class PkiApiValidator extends ApiValidator {
    constructor() {
        super();
        
        this.registerMethod("getCurrentKey", this.builder.createObject({
            userId: this.userId,
            host: this.url,
            contextId: this.contextId,
        }));
        
        this.registerMethod("getKeyAt", this.builder.createObject({
            userId: this.userId,
            host: this.url,
            contextId: this.contextId,
            date: this.timestamp,
        }));
        
        this.registerMethod("getKeyHistory", this.builder.createObject({
            userId: this.userId,
            host: this.url,
            contextId: this.contextId,
        }));
        
        this.registerMethod("verifyKey", this.builder.createObject({
            userId: this.userId,
            host: this.url,
            contextId: this.contextId,
            userPubKey: this.pubKey,
            date: this.timestamp,
        }));
    }
}
