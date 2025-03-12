import { AppException } from "../../api/AppException";
import { ApiMethod } from "../../api/Decorators";
import * as Registry from "./Registry";
import { ApiFunc, ApiResult, ApiResultEntry } from "./Utils";
import "q2-test";

function remapParams(e: any): any {
    if (typeof(e) == "object") {
        if (e == null) {
            return null;
        }
        if (Array.isArray(e)) {
            const res: any[] = [];
            for (const o of e) {
                res.push(remapParams(o));
            }
            return res;
        }
        const res: any = {};
        for (const k in e) {
            res[k] = remapParams(e[k]);
        }
        return res;
    }
    return e;
}

for (const key in Registry) {
    const value = <ApiFunc>(<any>Registry)[key];
    const result = value();
    const usedMethods = new Set<string>();
    for (const entry of result.entries) {
        it("ApiValidators " + result.scope + " " + result.clazz.name + " " + entry.testName, ((res: ApiResult, e: ApiResultEntry) => {
            try {
                usedMethods.add(e.method);
                res.validator.validate(e.method, remapParams(e.params));
            }
            catch (err) {
                if (AppException.is(err, "INVALID_PARAMS")) {
                    throw new Error(err.message + ": " + err.data);
                }
                throw err;
            }
        }).bind(null, result, entry));
    }
    it("ApiValidators " + result.scope + " " + result.clazz.name + " all methods checked", async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        const uncalledMethods: string[] = [];
        for (const method of ApiMethod.getExportedMethods(result)) {
            if (!usedMethods.has(method.method)) {
                uncalledMethods.push(method.method);
            }
        }
        if (uncalledMethods.length > 0) {
            throw new Error(`No validator check for ${uncalledMethods.join(", ")}!`);
        }
    });
}
