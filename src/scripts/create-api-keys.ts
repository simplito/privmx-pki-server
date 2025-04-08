import { Container } from "../main/Container";
import { Logger } from "../utils/Logger";
import { MongoDbManager } from "../db/MongoDbManager";
import { ApiKeyRepository } from "../service/ApiKeyRepository";
import * as types from "../types";
import { UserService } from "../service/UserService";
import { Scope } from "../types/core";
import { UserRepository } from "../service/UserRepository";
import { ApiUserRepository } from "../service/ApiUserRepository";
const workerLogger = new Logger("Worker");

async function go() {
    const container = Container.setup();
    
    // Load config
    const configService = container.getConfigService();
    configService.loadConfig();
    
    container.registerValue("workerBroadcastService", {});

    // Connect to db
    container.registerMongoDbManager(await MongoDbManager.init(configService.values.db));
    
    const convertedScope = container.resolve<UserService>("userService").convertScope(["read" as Scope], "disabled");
    const user = await container.resolve<ApiUserRepository>("apiUserRepository").create();
    const apiKey = await container.resolve<ApiKeyRepository>("apiKeyRepository").create(user._id as types.user.UserId, "MainKey" as types.auth.ApiKeyName, convertedScope.scope, undefined);
    console.log(`API_KEY_ID=${apiKey._id}`);
    console.log(`API_KEY_SECRET=${apiKey.clientSecret}`);
    
    await container.resolve<MongoDbManager>("dbManager").close();
}

go().catch(e => {
    workerLogger.error("Error during initializing", e);
    process.exit(1);
});