import { IOC } from "adv-ioc";
import { Scanner } from "adv-ioc/out/Scanner";
import path from "path";
import { ConfigService } from "../service/ConfigService";
import { Router } from "./Router";
import { RequestScopeContainer } from "./RequestScopeContainer";
import { MongoDbManager } from "../db/MongoDbManager";
import { Logger } from "../utils/Logger";
import { ApiResolver, Executor } from "../api/ApiResolver";
import { AuthApi } from "../api/client/auth/AuthApi";
import { EmailSecondFactorService } from "../service/EmailSecondFactorService";
import { SecondFactorServiceType, ISecondFactorService } from "../service/SecondFactorProvider";
import { TotpSecondFactorService } from "../service/TotpSecondFactorService";
import * as cluster from "cluster";
import { DeferredMap } from "../cluster/common/DeferredMap";
import { IpcExecutor } from "../cluster/common/IpcExecutor";
import { IpcListener } from "../cluster/common/IpcListener";
import { IpcMessageProcessor } from "../cluster/common/IpcMessageProcessor";
import { MethodExecutor } from "../cluster/common/MethodExecutor";
import { WorkerIpcRequester } from "../cluster/worker/WorkerIpcRequester";
import { RequestScopeContainerFactory } from "./RequestScopeContainerFactory";
import { App } from "./App";
import { WebSocketInnerManager } from "../cluster/worker/WebSocketInnerManager";
import { WebSocketHandler } from "./WebSocketHandler";
import { IpcServiceDescriptor } from "../cluster/master/Decorators";
import { UserApi } from "../api/client/user/UserApi";
import { MailListsLoader } from "../service/mail/MailListLoader";
import { NodeMailerMailSender } from "../service/mail/NodeMailerMailSender";
import { ApiKeyConverter } from "../api/client/user/ApiKeyConverter";
import { WorkerBroadcastReceiver } from "../cluster/worker/ipcWorkerServices/WorkerBroadcastReceiver";
import { VerifableIOC } from "../CommonTypes";
import { PkiApi } from "../api/client/pki/PkiApi";
import { PkiAdminApi } from "../api/client/pkiAdmin/PkiAdminApi";

export class Container extends IOC implements VerifableIOC {
    
    private constructor() {
        super();
    }
    
    static async init({worker, ipcServicesDescriptors}: {worker: cluster.Worker, ipcServicesDescriptors?: IpcServiceDescriptor[]}) {
        const container = new Container();
        Scanner.registerToIoc(container, path.resolve(__dirname, "../service/"));
        container.registerFactory("logger", (_parent: unknown, parentName: string|null) => {
            return new Logger(parentName || "");
        });
        container.register(MethodExecutor);
        container.register(IpcListener);
        container.register(IpcExecutor);
        container.register(IpcMessageProcessor);
        container.register(WorkerBroadcastReceiver);
        container.register(WebSocketInnerManager);
        container.register(ApiResolver);
        container.register(Router);
        container.register(WebSocketHandler);
        container.register(RequestScopeContainerFactory);
        container.register(App);
        container.register(ApiKeyConverter);
        container.registerWithName("ipcRequestMap", DeferredMap);
        container.registerWithName("ipcRequester", WorkerIpcRequester);
        container.registerWithName("mailSender", NodeMailerMailSender);
        container.registerValue("container", container);
        container.registerValue("worker", worker);
        container.registerIpcServices();
        container.registerSecondFactorProviderList();
        
        const ipcMessageProcessor = container.getIpcMessageProcessor();
        worker.on("message", message => {
            void ipcMessageProcessor.processMessage(message, "master", worker);
        });
        container.initIpcServices(ipcServicesDescriptors ? ipcServicesDescriptors : await container.fetchIpcServicesDescriptors());
        return container;
    }
    
    getMailListsLoader() {
        return this.resolve<MailListsLoader>("mailListsLoader");
    }
    
    getIpcMessageProcessor() {
        return this.resolve<IpcMessageProcessor>("ipcMessageProcessor");
    }
    
    getConfigService() {
        return this.resolve<ConfigService>("configService");
    }
    
    getApiResolver() {
        return this.resolve<ApiResolver<RequestScopeContainer>>("apiResolver");
    }
    
    registerApi<T extends Executor>(scope: string, apiClass: new(...args: any[]) => T, prefix: string) {
        const apiResolver = this.getApiResolver();
        apiResolver.registerApi(scope, apiClass, prefix, (ctx) => ctx.createEx(apiClass));
    }
    
    registerApis() {
        this.registerApi("client", AuthApi, "auth/");
        this.registerApi("client", UserApi, "user/");
        this.registerApi("client", PkiApi, "pki/");
        this.registerApi("client", PkiAdminApi, "pkiadmin/");
    }
    
    registerMongoDbManager(mongoDbManager: MongoDbManager) {
        this.registerValue("dbManager", mongoDbManager);
    }
    
    createApp() {
        return this.create<App>("app");
    }
    
    getListOfRegisteredServices() {
        return Object.keys(this.map);
    }
    
    private registerSecondFactorProviderList() {
        let secondFactorProviderList: Map<SecondFactorServiceType, ISecondFactorService>|null = null;
        this.registerFactory("secondFactorProviderList", () => {
            if (!secondFactorProviderList) {
                secondFactorProviderList = new Map<SecondFactorServiceType, ISecondFactorService>([
                    ["email", this.resolve<EmailSecondFactorService>("emailSecondFactorService")],
                    ["totp", this.resolve<TotpSecondFactorService>("totpSecondFactorService")],
                ]);
            }
            return secondFactorProviderList;
        });
    }
    
    getWorkerBroadcastReceiver() {
        return this.resolve<WorkerBroadcastReceiver>("workerBroadcastReceiver");
    }
    
    private registerIpcServices() {
        const methodExecutor = this.resolve<MethodExecutor>("methodExecutor");
        methodExecutor.registerWithPrefix("workerBroadcastReceiver/", this.getWorkerBroadcastReceiver());
    }
    
    private async fetchIpcServicesDescriptors() {
        const requester = this.resolve<WorkerIpcRequester>("ipcRequester");
        return requester.request<IpcServiceDescriptor[]>("ipcRegistryService/getIpcServiceRegistry", {});
    }
    
    private initIpcServices(descriptors: IpcServiceDescriptor[]) {
        const requester = this.resolve<WorkerIpcRequester>("ipcRequester");
        for (const ipcService of descriptors.filter(descriptor => descriptor.type === "master")) {
            const service: Record<string, any> = {};
            for (const method of ipcService.methods) {
                service[method] = ((m: string) => {
                    return (params: unknown) => {
                        return requester.request(`${ipcService.classNameLower}/${m}`, typeof(params) === "undefined" ? {} : params);
                    };
                })(method);
            }
            this.registerValue(ipcService.classNameLower, service);
        }
    }
}
