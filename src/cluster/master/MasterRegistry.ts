import { Scanner } from "adv-ioc/out/Scanner";
import { DeferredMap } from "../common/DeferredMap";
import { IpcExecutor } from "../common/IpcExecutor";
import { IpcListener } from "../common/IpcListener";
import { IpcMessageProcessor } from "../common/IpcMessageProcessor";
import { IpcRequester } from "../common/IpcRequester";
import { MethodExecutor } from "../common/MethodExecutor";
import { WorkersHolder } from "./WorkersHolder";
import { Logger } from "../../utils/Logger";
import { IOC } from "adv-ioc";
import { ConfigService } from "../../service/ConfigService";
import { JobService } from "../../service/JobService";
import { EventReporter } from "../../service/EventReporter";
import { ErrorService } from "../../service/ErrorService";
import { NodeMailerMailSender } from "../../service/mail/NodeMailerMailSender";
import { MongoDbManager } from "../../db/MongoDbManager";
import { MigrationManager } from "../../db/MigrationsManager";
import { TokenRepository } from "../../service/TokenRepository";
import * as path from "path";
import { ipcServiceRegistry } from "./Decorators";
import { CacheWithTTL } from "../../utils/CacheWithTTL";
import { IpRateLimiter } from "./ipcServices/IpRateLimiter";
import { TotpCache } from "./ipcServices/TotpCache";
import { TokenEncryptionKeyRepository } from "../../service/TokenEncryptionKey";
import { NonceMap } from "./ipcServices/NonceMap";
import { TokenEncryptionKeyProvider } from "./ipcServices/TokenEncryptionKeyProvider";
import { SessionRepository } from "../../service/SessionRepository";
import { SecondFactorChallengeDataCache } from "./ipcServices/SecondFactorChallengeDataCache";
import { SrpHandleCache } from "./ipcServices/SrpHandleCache";
import { WorkerBroadcastReceiver } from "../worker/ipcWorkerServices/WorkerBroadcastReceiver";
import { VerifableIOC } from "../../CommonTypes";

export class MasterRegistry extends IOC implements VerifableIOC {
    
    private constructor() {
        super();
    }
    
    static async init() {
        const masterRegistry = new MasterRegistry();
        Scanner.registerToIoc(masterRegistry, path.resolve(__dirname, "./ipcServices/"));
        masterRegistry.registerFactory("logger", (_parent: unknown, parentName: string|null) => {
            return new Logger(parentName || "");
        });
        masterRegistry.register(JobService);
        masterRegistry.register(TokenRepository);
        masterRegistry.register(SessionRepository);
        masterRegistry.register(TokenEncryptionKeyRepository);
        masterRegistry.register(MethodExecutor);
        masterRegistry.register(ConfigService);
        masterRegistry.register(WorkersHolder);
        masterRegistry.register(IpcListener);
        masterRegistry.register(IpcExecutor);
        masterRegistry.register(IpcMessageProcessor);
        masterRegistry.register(EventReporter);
        masterRegistry.register(ErrorService);
        masterRegistry.register(MigrationManager);
        masterRegistry.registerValue("masterRegistry", masterRegistry);
        masterRegistry.registerWithName("ipcRequester", IpcRequester);
        masterRegistry.registerWithName("ipcRequestMap", DeferredMap);
        masterRegistry.registerWithName("mailSender", NodeMailerMailSender);
        masterRegistry.registerFactory("cacheWithTTL", () => new CacheWithTTL());
        masterRegistry.registerValue("workerServices", [
            WorkerBroadcastReceiver,
        ]);
        masterRegistry.initWorkerIpcServices();
        return masterRegistry;
    }
    
    getJobService() {
        return this.resolve<JobService>("jobService");
    }
    
    getWorkersHolder() {
        return this.resolve<WorkersHolder>("workersHolder");
    }
    
    getConfigService() {
        return this.resolve<ConfigService>("configService");
    }
    
    getIpRateLimiter() {
        return this.resolve<IpRateLimiter>("ipRateLimiter");
    }
    
    getTokenRepository() {
        return this.resolve<TokenRepository>("tokenRepository");
    }
    
    getSessionRepository() {
        return this.resolve<SessionRepository>("sessionRepository");
    }
    
    getTokenEncryptionKeyProvider() {
        return this.resolve<TokenEncryptionKeyProvider>("tokenEncryptionKeyProvider");
    }
    
    getTotpCache() {
        return this.resolve<TotpCache>("totpCache");
    }
    
    getNonceMap() {
        return this.resolve<NonceMap>("nonceMap");
    }
    
    getIpcMessageProcessor() {
        return this.resolve<IpcMessageProcessor>("ipcMessageProcessor");
    }
    
    registerMongoDbManager(mongoDbManager: MongoDbManager) {
        this.registerValue("dbManager", mongoDbManager);
    }
    
    getMongoDbManager() {
        return this.resolve<MongoDbManager>("dbManager");
    }
    
    getMigrationManager() {
        return this.resolve<MigrationManager>("migrationManager");
    }
    
    getListOfRegisteredServices() {
        return Object.keys(this.map);
    }
    
    getSecondFactorChallengeDataCache() {
        return this.resolve<SecondFactorChallengeDataCache>("secondFactorChallengeDataCache");
    }
    
    getSrpHandleCache() {
        return this.resolve<SrpHandleCache>("srpHandleCache");
    }
    
    registerIpcServices() {
        const methodExecutor = this.resolve<MethodExecutor>("methodExecutor");
        for (const ipcService of ipcServiceRegistry.filter(ipc => ipc.type === "master")) {
            methodExecutor.registerWithPrefix(ipcService.classNameLower + "/", this.resolve(ipcService.classNameLower));
        }
    }
    
    private initWorkerIpcServices() {
        const requester = this.resolve<IpcRequester>("ipcRequester");
        const request = (method: string, params: unknown) => {
            return Promise.all(this.getWorkersHolder().getWorkers().map(async worker => {
                return {worker, result: await requester.request(worker, method, params)};
            }));
        };
        
        for (const ipcService of ipcServiceRegistry.filter(ipc => ipc.type === "worker")) {
            const service: Record<string, any> = {};
            for (const method of ipcService.methods) {
                service[method] = ((m: string) => {
                    return (params: unknown) => {
                        return request(`${ipcService.classNameLower}/${m}`, typeof(params) === "undefined" ? {} : params);
                    };
                })(method);
            }
            this.registerValue(ipcService.classNameLower, service);
        }
    }
}
