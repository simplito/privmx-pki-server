import { ApiValidator } from "../../ApiValidator";

export class PkiAdminApiValidator extends ApiValidator {
    constructor() {
        super();
        
        this.registerMethod("setKey", this.builder.createObject({
            userId: this.userId,
            userPubKey: this.pubKey,
            host: this.url,
            contextId: this.contextId,
        }));
        
        this.registerMethod("deleteKey", this.builder.createObject({
            userId: this.userId,
            host: this.url,
            contextId: this.contextId,
        }));
    }
}
