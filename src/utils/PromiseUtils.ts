export interface Deferred<T> {
    resolve: ((value: T) => void);
    reject: ((e: any) => void);
    promise: Promise<T>;
}

export interface SettleResult<T> {
    status: "rejected"|"fulfilled";
    value?: T;
    reason?: any;
}

export class PromiseUtils {
    
    static wait(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    
    static defer<T = any>(): Deferred<T> {
        const defer: Partial<Deferred<T>> = {};
        defer.promise = new Promise((resolve, reject) => {
            defer.resolve = resolve;
            defer.reject = reject;
        });
        return defer as Deferred<T>;
    }
    
    static callbackToPromise<T>(func: (callback: (err: any, result: T) => void) => void): Promise<T> {
        return new Promise<T>((resolve, reject) => func((err: Error|undefined, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        }));
    }
    
    static callbackToPromiseVoid(func: (callback: (err: any) => void) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => func((err: Error|undefined) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        }));
    }
    
    static callbackToPromise2<T>(func: (callback: (result: T) => void) => void): Promise<T> {
        return new Promise<T>((resolve) => func((result) => {
            resolve(result);
        }));
    }
    
    static allSettled<T>(promises: Promise<T>[]): Promise<SettleResult<T>[]> {
        return Promise.all(promises.map(async x => {
            try {
                const value = await x;
                return <SettleResult<T>>{status: "fulfilled", value: value};
            }
            catch (e) {
                return <SettleResult<T>>{status: "rejected", reason: e};
            }
        }));
    }
    
    static async filter<T>(values: T[], filter: (v: T) => Promise<boolean>): Promise<T[]> {
        const res: T[] = [];
        for (const value of values) {
            if (await filter(value)) {
                res.push(value);
            }
        }
        return res;
    }
}