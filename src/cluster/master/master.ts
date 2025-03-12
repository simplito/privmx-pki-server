import cluster from "cluster";
import { MasterRegistry } from "./MasterRegistry";
import { Logger } from "../../utils/Logger";
import { PromiseUtils } from "../../utils/PromiseUtils";
import { MongoDbManager } from "../../db/MongoDbManager";
import { DateUtils } from "../../utils/DateUtils";
const masterLogger = new Logger("Master");

export function startMaster() {
    if (!cluster.isPrimary) {
        throw new Error("Cannot run MasterThread outside of master");
    }
    initMaster().catch(e => {
        masterLogger.error("Error during initializing", e);
        process.exit(1);
    });
}

async function initMaster() {
    const masterRegistry = await MasterRegistry.init();
    
    // Load config
    const configService = masterRegistry.getConfigService();
    configService.loadConfig();
    
    // Perform migrations
    masterRegistry.registerMongoDbManager(await MongoDbManager.init(configService.values.db));
    await masterRegistry.getMigrationManager().go();
    if ("PMX_MIGRATION" in process.env) {
        await masterRegistry.getMongoDbManager().close();
        return;
    }
    
    // Bind IPC
    masterRegistry.registerIpcServices();
    const ipcMessageProcessor = masterRegistry.getIpcMessageProcessor();
    cluster.on("message", (worker, message) => {
        void ipcMessageProcessor.processMessage(message, `worker ${worker.id}`, worker);
    });
    
    // Start jobs
    const jobService = masterRegistry.getJobService();
    const ipLimiter = masterRegistry.getIpRateLimiter();
    const tokenRepository = masterRegistry.getTokenRepository();
    const tokenEncryptionKeyProvider = masterRegistry.getTokenEncryptionKeyProvider();
    const totpCache = masterRegistry.getTotpCache();
    const nonceMap = masterRegistry.getNonceMap();
    const sessionRepository = masterRegistry.getSessionRepository();
    const challengeCache = masterRegistry.getSecondFactorChallengeDataCache();
    const srpHandleCache = masterRegistry.getSrpHandleCache();
    jobService.addPeriodicJob(async () => ipLimiter.addCreditsAndRemoveInactive(), configService.values.apiRateLimit.addonInterval, "creditRefresh");
    jobService.addPeriodicJob(async () => tokenRepository.deleteExpiredTokens(), configService.values.expiredTokenRemovalInterval, "expiredTokenRemoval");
    jobService.addPeriodicJob(async () => tokenEncryptionKeyProvider.deleteExpired(), DateUtils.getHours(1), "cipherKeyRemoval");
    jobService.addPeriodicJob(async () => totpCache.deleteExpired(), DateUtils.getMinutes(5), "totpCacheRemoval");
    jobService.addPeriodicJob(async () => nonceMap.deleteExpired(), DateUtils.getMinutes(5), "nonceCacheRemoval");
    jobService.addPeriodicJob(async () => sessionRepository.deleteExpiredSessions(), DateUtils.getMinutes(5), "expiredSessionRemoval");
    jobService.addPeriodicJob(async () => challengeCache.deleteExpired(), DateUtils.getMinutes(5), "challengeCacheRemoval");
    jobService.addPeriodicJob(async () => srpHandleCache.deleteExpired(), DateUtils.getMinutes(5), "challengeCacheRemoval");
    
    // Spawn workers
    masterLogger.log(`Master thread started - spawning ${configService.values.workers} workers`);
    const workersHolder = masterRegistry.getWorkersHolder();
    for (let i = 0; i < configService.values.workers; i++) {
        workersHolder.createWorker();
    }
    
    // OnExit handler
    async function onExitSignal() {
        // Wait for all workers to exit
        while (true) {
            if (!workersHolder.hasWorkers()) {
                masterLogger.log("All workers are dead, so bye!");
                process.exit();
            }
            await PromiseUtils.wait(100);
        }
    }
    process.on("SIGINT", () => void onExitSignal());
    process.on("SIGTERM", () => void onExitSignal());
}
