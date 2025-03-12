import cluster from "cluster";
import * as Cluster from "cluster";
import { Container } from "../../main/Container";
import { Logger } from "../../utils/Logger";
import { MongoDbManager } from "../../db/MongoDbManager";
const workerLogger = new Logger("Worker");

export function startWorker() {
    const worker = cluster.worker;
    if (!worker) {
        throw new Error("Cannot run WorkerThread outside of worker");
    }
    initWorker(worker).catch(e => {
        workerLogger.error("Error during initializing", e);
        process.exit(1);
    });
}

async function initWorker(worker: Cluster.Worker) {
    const container = await Container.init({worker});
    
    // Load config
    const configService = container.getConfigService();
    configService.loadConfig();
    
    // Load mail white and black lists
    const mailListLoader = container.getMailListsLoader();
    mailListLoader.loadLists();
    
    // Connect to db
    container.registerMongoDbManager(await MongoDbManager.init(configService.values.db));
    
    // Register apis
    container.registerApis();
    
    // Init app
    container.createApp().init();
}