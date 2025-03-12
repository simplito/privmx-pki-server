import { HttpRequest, ServerResponse } from "../CommonTypes";
import { JsonRpcServer } from "../api/JsonRpcServer";
import { ConfigService } from "../service/ConfigService";
import * as Registry from "../test/api/Registry";
import { ApiFunc } from "../test/api/Utils";
import * as fs from "fs";
import { docs } from "../docs/get_docs";

export class ApiController {
    
    constructor(
        private request: HttpRequest,
        private jsonRpcServer: JsonRpcServer,
        private configService: ConfigService,
    ) {
    }
    
    async jsonRpcProcessRequest(): Promise<ServerResponse> {
        const result = await this.jsonRpcServer.processRequest(this.request);
        return {status: 200, headers: {"Content-Type": "application/json"}, body: JSON.stringify(result)};
    }
    
    async jsonRpcProcessMessage(message: Buffer) {
        const result = await this.jsonRpcServer.processMessage(message);
        return result;
    }
    
    async testApi(): Promise<ServerResponse> {
        const htmlTemplate = await fs.promises.readFile(this.configService.getAssetPath("assets/testApi.html"), "utf8");
        const html = htmlTemplate
            .replace(/{{presets}}/g, await this.getApiExamples())
            .replace(/{{commonErrors}}/g, JSON.stringify(docs.errorsWithDescription, null, 2))
            .replace(/{{errors}}/g, JSON.stringify(docs.jsonRpcErrors, null, 2));
        return {body: html};
    }
    
    private async getApiExamples() {
        const res = [];
        let i = 0;
        for (const key in Registry) {
            const value = <ApiFunc>(<any>Registry)[key];
            const result = value();
            const apiRes = {name: result.clazz.name, methods: [] as any[]};
            const currentlyResolvedApi = docs.apis[result.clazz.name];
            res.push(apiRes);
            for (const entry of result.entries) {
                apiRes.methods.push({
                    id: "api-" + (i++),
                    label: entry.testName,
                    api: result.scope,
                    method: result.prefix + entry.method,
                    params: entry.params,
                    info: currentlyResolvedApi?.methods[entry.testName],
                });
            }
        }
        return JSON.stringify(res, null, 4);
    }
}
