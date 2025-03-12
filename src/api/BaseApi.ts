import { AppException } from "./AppException";
import { Logger } from "../utils/Logger";
import { PerNameValidator } from "../CommonTypes";
import { ApiMethod, ScopeDefinition } from "./Decorators";
import { AuthorizationHolder } from "../requestScopeService/AuthorizationHolder";
import * as types from "../types";
import { Executor } from "./ApiResolver";

export class BaseApi implements Executor {
    
    protected logger: Logger;
    
    constructor(
        protected paramsValidator: PerNameValidator,
    ) {
        this.logger = Logger.create(this);
    }
    
    getScopeForMethod(api: string, method: string): ScopeDefinition {
        const methodOptions = ApiMethod.getExportedMethodOptions(this.constructor, method);
        const scope = methodOptions.scope;
        return !scope ? [] : (Array.isArray(scope) ? scope.map(s => api + ":" + s) : scope);
    }
    
    getAdditionalCostForMethod(method: string): number|null {
        const methodOptions = ApiMethod.getExportedMethodOptions(this.constructor, method);
        if (methodOptions.additionalCost) {
            return methodOptions.additionalCost;
        };
        return null;
    }
    
    methodRequiresSecondFactorAuth(method: string) {
        const methodOptions = ApiMethod.getExportedMethodOptions(this.constructor, method);
        if (methodOptions.secondFactorRequired) {
            return true;
        }
        return false;
    }
    
    async execute(method: string, params: any, challenge: types.auth.ChallengeModel|undefined, secondFactorMiddleware: () => Promise<void>): Promise<any> {
        const m = (<any> this)[method];
        if (!ApiMethod.getExportedMethod(this.constructor, method) || typeof(m) != "function") {
            throw new AppException("METHOD_NOT_FOUND");
        }
        this.validateAccess(method, params);
        this.validateParams(method, params);
        await secondFactorMiddleware();
        return m.call(this, params, challenge);
    }
    
    protected validateParams(method: string, params: any): void {
        this.paramsValidator.validate(method, params);
    }
    
    protected validateAccess(_method: string, _params: any): void {
        return;
    }
    
    protected validateClientAccess(authorizationHolder: AuthorizationHolder, apiName: string, method: string): void {
        if (authorizationHolder.isAuthorizedWithScope()) {
            const scope = this.getScopeForMethod(apiName, method);
            
            if (!authorizationHolder.isAuthorizedKeyOrTokenWithScope(scope)) {
                throw new AppException("INSUFFICIENT_SCOPE");
            }
            return;
        }
        throw new AppException("UNAUTHORIZED");
    }
}
