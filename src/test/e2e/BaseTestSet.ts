/* eslint-disable no-console */
import { ChildProcess, execSync, spawn } from "child_process";
import { MongoDbManager } from "../../db/MongoDbManager";
import { DateUtils } from "../../utils/DateUtils";
import { Utils } from "../../utils/Utils";
import { HttpClient } from "../../utils/HttpClient";
import path from "path";
import fs from "fs";
import * as mongodb from "mongodb";
import { ConfigService } from "../../service/ConfigService";
import { JsonRpcClientWithSession, JsonRpcException } from "../../utils/JsonRpcClient";
import { ERROR_CODES, ErrorCode } from "../../api/AppException";
import assert from "assert";
import { Deferred, PromiseUtils } from "../../utils/PromiseUtils";
import * as types from "../../types";
import { AuthApiClient } from "../../api/client/auth/AuthApiClient";
import { UserApiClient } from "../../api/client/user/UserApiClient";

interface Collection {
    name: string;
    content: mongodb.Document[];
}

interface TestOptions {
    dataSet?: string;
    config?: object,
}

export async function shouldThrowErrorWithCode(func: () => Promise<unknown>, errorCode: ErrorCode) {
    try {
        await func();
        assert(false, "Executed function did not throw specified errorCode");
    }
    catch (e) {
        assert(JsonRpcException.isJsonRpcError(e, ERROR_CODES[errorCode].code), `Error code does not match, expected: ${JSON.stringify(ERROR_CODES[errorCode], null, 4)}, got: ${JSON.stringify(e, null, 4)}`);
    }
}

export function Test(options?: TestOptions) {
    return (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => {
        if (target.__exportedMethods == null) {
            target.__exportedMethods = [];
        }
        options =  (options) ? options : {} as TestOptions;
        target.__exportedMethods.push({method: propertyKey, options});
    };
}

const DEBUG = process.env.DEBUG === "true";

export function debug(...args: unknown[]) {
    if (DEBUG) {
        console.log(...args);
    }
}
export interface TestMethod {
    method: string;
    options: TestOptions;
}

export interface TestSummary {
    testStatus: boolean;
    time: number;
}

interface BaseConfig {
    host: string;
    port: number;
    db: {
        url: string,
        dbName: string,
    };
}
export class BaseTestSet {
    
    private serverProcess: ChildProcess|null = null;
    private serverProcessDefer: Deferred<number>|null = null;
    private dbManager!: MongoDbManager;
    protected config!: object&BaseConfig;
    private mailWhiteList: string[] = ["m.in", "example.com"];
    private defaultConfig = {
        "workers": 1,
        "db": {
            "url": "mongodb://mongodb:27017",
            "dbName": "privmx_json_rpc_server_template",
        },
        "dbMigrationId": "Migration000Scheme",
        "mail": {
            "port": 1025,
            "host": "fakemail",
        },
        "apiRateLimit": {
            "loginRateLimiterEnabled": false,
        },
        "mailBlackWhiteListDir": "../",
        "host": "0.0.0.0",
        "port": 8101,
    };
    
    protected apis!: {
        jsonRpcClient: JsonRpcClientWithSession,
        user: UserApiClient,
        auth: AuthApiClient,
    };
    
    protected helpers = {
        /** Extracts account acivation from mail, then deletes all mails*/
        getActivationTokenFromMail: async () => {
            return await this.helpers.getValueFromMail(/activateAccount\/([a-zA-Z0-9]+)/g) as types.core.TokenId;
        },
        
        /** Extracts invitation token from mail, then deletes all mails*/
        getInvitationTokenFromMail: async () => {
            return (await this.helpers.getValueFromMail(/signUp\/(.*?)\\"/g)).replace("=\\r\\n", "") as types.core.TokenId;
        },
        
        /** Extracts 2FA code from mail, then deletes all mails*/
        getSecondFactorCodeFromMail: async () => {
            return await this.helpers.getValueFromMail(/<h2>(.*?)<\/h2>/g) as types.core.SecondFactorAuthorizationCode;
        },
        
        /** Extracts value based on regexp from mail, then deletes all mails*/
        getValueFromMail: async (pattern: RegExp) => {
            await PromiseUtils.wait(1000);
            const mailsResponse = await HttpClient.request({
                url: "http://fakemail:8025/api/v2/messages",
                method: "GET",
            });
            
            const mailList = JSON.parse(mailsResponse.body.toString());
            
            assert(mailList.count === 1, `Expected mails: 1, found: ${mailList.count}`);
            
            const deleteStatus = (await HttpClient.request({
                url: "http://fakemail:8025/api/v1/messages",
                method: "DELETE",
            })).status;
            
            assert(deleteStatus === 200, "Could not delete mails after extraction");
            
            const htmlContent = (mailList.items[0].Content.Body.toString() as string).replace(/=\r\n/g, "").replace(/&#x2F;/g, "/");
            const match = pattern.exec(htmlContent);
            
            assert(!!match, "Token not found in mail!");
            const token = match[1];
            
            return token;
        },
    };
    
    async run(test: TestMethod) {
        const startTimestamp = DateUtils.now();
        try {
            await this.connectToDb(this.defaultConfig.db.dbName, this.defaultConfig.db.url);
            const method = (<any> this)[test.method];
            const testStatus = await this.testWrapper(test.method, test.options, () => (method.call(this)));
            const endTimestamp = DateUtils.now();
            const summary: TestSummary = {
                testStatus,
                time: (endTimestamp - startTimestamp) / 1000,
            };
            return summary;
        }
        catch (e) {
            const endTimestamp = DateUtils.now();
            console.log(e);
            return {
                testStatus: false,
                time: (endTimestamp - startTimestamp) / 1000,
            };
        }
        finally {
            await this.cleanup();
        }
    }
    
    private async testWrapper(testName: string, options: TestOptions, test: () => Promise<void>) {
        try {
            debug(testName + " Preparing config..");
            this.prepareConfig(options.config);
            this.prepareMailWhiteList();
            this.loadApis();
            debug(testName + " Dropping database...");
            const dropResult = await this.dbManager.db.dropDatabase();
            debug(testName + " Drop db result", dropResult);
            debug(testName + " Performing migrations...");
            await this.performMigrations();
            debug(testName + " Loading dataset...");
            await this.loadDataset(options.dataSet);
            debug(testName + " Deleting mails...");
            await this.clearMails();
            debug(testName + " Starting server...");
            await this.startServer();
            debug(testName + " Running test...");
            const result = await this.executeTest(test, testName);
            debug(testName + " End");
            return result;
        }
        finally {
            if (this.serverProcess) {
                if (this.serverProcess.pid) {
                    debug("Sending SIGINT to server");
                    process.kill(-this.serverProcess.pid, "SIGINT");
                }
                else {
                    console.log("[WARN] No server pid so cannot send SIGINT");
                }
                this.serverProcess = null;
            }
            else {
                console.log("[WARN] No server cannot send SIGINT");
            }
            if (this.serverProcessDefer) {
                debug("Cleanup Waiting for server to exit...");
                const code = await this.serverProcessDefer.promise;
                this.serverProcessDefer = null;
                debug(`Cleanup Server exit with code ${code}`);
            }
            else {
                console.log("[WARN] No server cannot wait to exit");
            }
        }
    }
    
    private async executeTest(test: () => Promise<void>, testName: string) {
        process.stdout.write("\x1b[33m " + testName + "...");
        try {
            await test();
            console.log("\x1b[32m", "PASSED");
            return true;
        }
        catch (e) {
            console.log("\x1b[31m", "FAILED\n", e);
            return false;
        }
    }
    
    private async clearMails() {
        const mailsResponse = await HttpClient.request({
            url: "http://fakemail:8025/api/v1/messages",
            method: "DELETE",
        });
        assert(mailsResponse.status === 200);
    }
    
    private loadApis() {
        const serverUrl = "http://" + this.config.host + ":" + this.config.port;
        const jsonRpcClient = new JsonRpcClientWithSession(serverUrl + "/main", {});
        this.apis = {
            jsonRpcClient: jsonRpcClient,
            auth: new AuthApiClient(jsonRpcClient),
            user: new UserApiClient(jsonRpcClient),
        };
    }
    
    private async performMigrations() {
        execSync("node out/index.js ../config.json", {
            env: {"PMX_MIGRATION": this.defaultConfig.dbMigrationId},
            stdio: DEBUG ? "inherit" : "ignore",
        });
    }
    
    private async startServer() {
        const serverUrl = "http://" + this.config.host + ":" + this.config.port + "/ready";
        this.serverProcessDefer = PromiseUtils.defer();
        this.serverProcess = spawn("/usr/local/bin/node", ["out/index.js", "../config.json"], {detached: true});
        this.serverProcess.stdout?.on("data", d => debug("--------- [server][out]", d.toString()));
        this.serverProcess.stderr?.on("data", d => debug("--------- [server][err]", d.toString()));
        this.serverProcess.on("exit", code => {
            debug(`Server process exit with code ${code}`);
            this.serverProcessDefer?.resolve(code || 999);
        });
        
        const deadline = DateUtils.getExpirationDate(DateUtils.getSeconds(5));
        while (DateUtils.now() < deadline) {
            const response = await Utils.tryPromise(() => HttpClient.request({url: serverUrl}));
            if (response.success) {
                if (response.result.status === 200) {
                    return;
                }
            }
            await PromiseUtils.wait(100);
        }
        if (this.serverProcess.pid) {
            process.kill(-this.serverProcess.pid, "SIGINT");
        }
        throw new Error("CANNOT CONNECT TO SERVER");
    }
    
    private readDataSet(dataSetName: string): Collection[] {
        const dataSetPath = path.resolve(__dirname, "../../../src/test/datasets/" + dataSetName);;
        const fileNames = fs.readdirSync(dataSetPath);
        const dataSet: Collection[] = [];
        
        for (const fileName of fileNames) {
            const filePath = path.join(dataSetPath, fileName);
            if (path.extname(fileName) !== ".json") {
                continue;
            }
            const collectionName = fileName.slice(0, -5);
            const fileContent = fs.readFileSync(filePath, "utf8");
            const parsedContent = JSON.parse(fileContent);
            dataSet.push({
                name: collectionName,
                content: parsedContent,
            });
        }
        return dataSet;
    }
    
    private async loadDataset(dataSetName?: string) {
        const dataSet = this.readDataSet((dataSetName) ? dataSetName : "defaultDataset");
        for (const collectionData of dataSet) {
            const {collection: newCollection} = await this.dbManager.createOrGetCollection<any>(collectionData.name);
            if (collectionData.content.length > 0) {
                await newCollection.insertMany(collectionData.content);
            }
        }
    }
    
    private async connectToDb(dbName: string, url: string) {
        this.dbManager = await MongoDbManager.init({
            dbName,
            url,
        });
    }
    
    private async cleanup() {
        await this.dbManager.db.dropDatabase();
        await this.dbManager.close();
    }
    
    private prepareConfig(userConfig?: object) {
        this.config = this.defaultConfig;
        if (userConfig) {
            ConfigService.overwriteOptions(this.config, userConfig);
        }
        fs.writeFileSync("../config.json", JSON.stringify(this.config));
    }
    
    private prepareMailWhiteList() {
        fs.writeFileSync("../whitelist.txt", this.mailWhiteList.join("\n"));
    }
}
