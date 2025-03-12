import assert from "assert";
import { Container } from "../main/Container";
import { RequestScopeContainerFactory } from "../main/RequestScopeContainerFactory";
import { MasterRegistry } from "../cluster/master/MasterRegistry";
import * as cluster from "cluster";
import "q2-test";
import { HttpRequest, VerifableIOC } from "../CommonTypes";
import * as http from "http";
import { MongoDbManager } from "../db/MongoDbManager";

function createContainer() {
    return Container.init({
        worker: new cluster.Worker(),
        ipcServicesDescriptors: [
            {className: "TotpCache", classNameLower: "totpCache", methods: [], type: "master"},
            {className: "TokenEncryptionKeyProvider", classNameLower: "tokenEncryptionKeyProvider", methods: [], type: "master"},
            {className: "WorkerBroadcastService", classNameLower: "workerBroadcastService", methods: [], type: "master"},
            {className: "IpRateLimiter", classNameLower: "ipRateLimiter", methods: [], type: "master"},
            {className: "NonceMap", classNameLower: "nonceMap", methods: [], type: "master"},
            {className: "SecondFactorChallengeDataCache", classNameLower: "secondFactorChallengeDataCache", methods: [], type: "master"},
            {className: "SrpHandleCache", classNameLower: "srpHandleCache", methods: [], type: "master"},
        ],
    });
}

it("ContainerResolveTest", async () => {
    const dbManager: MongoDbManager = {} as MongoDbManager;
    const container = await createContainer();
    container.registerMongoDbManager(dbManager);
    checkDependenciesInIOC(container, ["baseRepository", "teamServerApiClient"]);
});

it("MasterRegistryResolveTest", async () => {
    const dbManager: MongoDbManager = {} as MongoDbManager;
    const registry = await MasterRegistry.init();
    registry.registerMongoDbManager(dbManager);
    checkDependenciesInIOC(registry, []);
});

it("RequestScopeContainerResolveTest", async () => {
    const dbManager: MongoDbManager = {} as MongoDbManager;
    const container = await createContainer();
    container.registerMongoDbManager(dbManager);
    const requestScopeContainerFactory = new RequestScopeContainerFactory(container);
    const requestMock: HttpRequest = {headers: {"x-forwarded-for": "127.0.0.1"}} as unknown as HttpRequest;
    const responseMock: http.ServerResponse = {} as http.ServerResponse;
    const requestScopeContainer = requestScopeContainerFactory.createRequestScopeContainer(requestMock, responseMock, null);
    checkDependenciesInIOC(requestScopeContainer, ["authorizationInfo", "accessKeyInfoAuthorizationInfo"]);
});

function checkDependenciesInIOC(ioc: VerifableIOC, entriesToSkip: string[]) {
    for (const serviceName of ioc.getListOfRegisteredServices()) {
        if (!(entriesToSkip.includes(serviceName))) {
            try {
                ioc.resolve(serviceName);
            }
            catch (e) {
                assert(false, `Could not resolve ${serviceName} ${"" + e}`);
            }
        }
    }
}
