import { Container } from "../main/Container";
import { Logger } from "../utils/Logger";
import { MongoDbManager } from "../db/MongoDbManager";
import { ApiKeyRepository } from "../service/ApiKeyRepository";
import * as types from "../types";
import { UserService } from "../service/UserService";
import { Scope } from "../types/core";
import { UserRepository } from "../service/UserRepository";
import { ApiKey } from "../db/Model";
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
    const userRepository = container.resolve<UserRepository>("userRepository");
    const apiKeyRepository = container.resolve<ApiKeyRepository>("apiKeyRepository");
    
    const availUsers = await userRepository.getAll();
    if (availUsers.length > 0) {
        const user = (await userRepository.getAll())[0];
        const apiKey = (await apiKeyRepository.getAllUserApiKeys(user._id))[0];
        printKeys(apiKey);
    }
    else {
        const user = await userRepository.create(true);
        const apiKey = await apiKeyRepository.create(user._id as types.user.UserId, "MainKey" as types.auth.ApiKeyName, convertedScope.scope, undefined);
        printKeys(apiKey);
    }
    await container.resolve<MongoDbManager>("dbManager").close();
}

function printKeys(apiKey: ApiKey) {
    /* eslint-disable */
    console.log(`API_KEY_ID=${apiKey._id}`);
    console.log(`API_KEY_SECRET=${apiKey.clientSecret}`);
    /* eslint-enable */
}

go().catch(e => {
    workerLogger.error("Error during initializing", e);
    process.exit(1);
});