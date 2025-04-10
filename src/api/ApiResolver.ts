import { AppException } from "./AppException";
import { ApiMethod } from "./Decorators";
import * as types from "../types";
import { HttpClientError } from "./HttpError";
import { IpRateLimiter } from "../cluster/master/ipcServices/IpRateLimiter";
import { AuthorizationHolder } from "../requestScopeService/AuthorizationHolder";

export interface Executor {
    execute(method: string, params: unknown, challenge: types.auth.ChallengeModel|undefined, secondFactorMiddleware: () => Promise<void>): Promise<unknown>;
    getAdditionalCostForMethod(method: string): number|null;
    methodRequiresSecondFactorAuth(method: string): boolean;
}

export class ApiResolver<Context> {
    
    private methods: {[scope: string]: {[method: string]: {method: string, factory: (ioc: Context) => Executor, additionalCost?: number}}};
    constructor(
        private ipRateLimiter: IpRateLimiter,
    ) {
        this.methods = {};
    }
    
    registerApi<T extends Executor>(scope: string, apiClass: new(...args: any[]) => T, prefix: string, factory: (ctx: Context) => T) {
        if (!(scope in this.methods)) {
            this.methods[scope] = {};
        }
        for (const method of ApiMethod.getExportedMethods(apiClass)) {
            this.methods[scope][prefix + method.method] = {method: method.method, factory: factory};
        }
    }
    
    async execute(scope: string, ctx: Context, method: string, params: unknown, ip: types.core.IpAddress, _authorizationHolder: AuthorizationHolder): Promise<unknown> {
        if (!(method in this.methods[scope])) {
            throw new AppException("METHOD_NOT_FOUND");
        }
        const methodEntry = this.methods[scope][method];
        const api = methodEntry.factory(ctx);
        const additionalCost = api.getAdditionalCostForMethod(methodEntry.method);
        const {challenge, requestParams} = this.extractSecondFactorInfoFromParams(params);
        
        if (additionalCost) {
            const status = await this.ipRateLimiter.payAdditionalCostIfPossible({ip, cost: additionalCost});
            if (!status) {
                throw new HttpClientError("TOO_MANY_REQUESTS");
            }
        }
        return await api.execute(methodEntry.method, requestParams, challenge, async () => {});
    }
    
    private extractSecondFactorInfoFromParams(params: unknown) {
        if (typeof params !== "object" || params === null || !("challenge" in params) || !("authorizationData" in params) || typeof params.challenge !== "string" || typeof params.authorizationData !== "string") {
            return {
                requestParams: params,
            };
        }
        
        const {challenge, authorizationData, ...requestParams} = params;
        const challengeModel: types.auth.ChallengeModel = {
            challenge: challenge as types.core.ChallengeId,
            authorizationData,
        };
        
        return {
            challenge: challengeModel,
            requestParams,
        };
    }
}
