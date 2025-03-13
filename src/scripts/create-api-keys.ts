import { Container } from "../main/Container";
import { Logger } from "../utils/Logger";
import { MongoDbManager } from "../db/MongoDbManager";
import { ApiKeyRepository } from "../service/ApiKeyRepository";
import * as types from "../types";
import { UserService } from "../service/UserService";
import { Scope } from "../types/core";
const workerLogger = new Logger("Worker");

async function go() {
    const container = Container.setup();
    
    // Load config
    const configService = container.getConfigService();
    configService.loadConfig();
    
    // Connect to db
    container.registerMongoDbManager(await MongoDbManager.init(configService.values.db));
    
    const secret = "asad" as types.auth.ClientSecret;
    const convertedScope = container.resolve<UserService>("userService").convertScope(["read" as Scope], "disabled");

    const apiKey = await container.resolve<ApiKeyRepository>("apiKeyRepository").create("initial_script" as types.user.UserId, "MainKey" as types.auth.ApiKeyName, convertedScope.scope, undefined);
    workerLogger.log("APIKEY", apiKey._id, secret);
    
    await container.resolve<MongoDbManager>("dbManager").close();
}

go().catch(e => {
    workerLogger.error("Error during initializing", e);
    process.exit(1);
});