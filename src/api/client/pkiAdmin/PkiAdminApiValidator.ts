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

        this.registerMethod("setHost", this.builder.createObject({
            hostPubKey: this.eccPub,
            hostUrl: this.url
        }));

        this.registerMethod("addHostUrl", this.builder.createObject({
            instanceId: this.eccPub,
            hostUrl: this.url
        }));

        this.registerMethod("removeHostUrl", this.builder.createObject({
            instanceId: this.eccPub,
            hostUrl: this.url
        }));

        this.registerMethod("deleteHost", this.builder.createObject({
            instanceId: this.eccPub
        }));

        this.registerMethod("listHosts", this.builder.empty);
    }
}
