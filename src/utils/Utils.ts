import { AppException } from "../api/AppException";
import { Dictionary } from "../CommonTypes";
import * as types from "../types";
import { Crypto } from "./Crypto";

export type Result<T> = {success: true; result: T}|{success: false; error: any};

export class Utils {
    
    static try<T>(func: () => T): Result<T> {
        try {
            return {success: true, result: func()};
        }
        catch (e) {
            return {success: false, error: e};
        }
    }
    
    static async tryPromise<T>(func: () => Promise<T>|T): Promise<Result<T>> {
        try {
            return {success: true, result: await func()};
        }
        catch (e) {
            return {success: false, error: e};
        }
    }
    
    static callAsyncSafely(func: () => Promise<unknown>) {
        // eslint-disable-next-line no-console
        func().catch((e) => console.log("Unexpected promise error", e));
    }
    
    static prepareEmail(email: types.core.Email) {
        return email.toLowerCase() as types.core.LEmail;
    }
    
    static generateNumberInRange(a: number, b: number) {
        if (a > b) {
            throw new Error("Range end lower than start");
        }
        return a + Math.floor(Math.random() * (b - a));
    }
    
    static getRequestParamsHash(scope: string, method: string, params: unknown) {
        if (!this.isDictionary(params)) {
            throw new AppException("INVALID_PARAMS", "Data is not an object");
        }
        const serializedParams = this.getRequestParamsRecursively(params);
        return Crypto.md5(Buffer.from(`${method};${scope};${JSON.stringify(serializedParams)}`)).toString();
    }
    
    private static getRequestParamsRecursively(params: unknown) {
        if (!this.isDictionary(params)) {
            return params;
        }
        const paramsKeys = Object.keys(params);
        paramsKeys.sort();
        const serializedParams =  paramsKeys.reduce((accumulator: Dictionary, currentKey) => {
            accumulator[currentKey] = this.getRequestParamsRecursively(params[currentKey]);
            return accumulator;
        }, {});
        return serializedParams;
    }
    
    static isDictionary(params: unknown): params is Dictionary {
        return (typeof params === "object" && params !== null);
    }
}
