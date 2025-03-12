import { ErrorCode } from "./AppException";

export interface ExportedMethod {
    method: string;
    options: ExportedMethodOptions;
}

export type ScopeDefinition = string[]|"ignore";

export interface ExportedMethodOptions {
    errorCodes?: ErrorCode[];
    scope?: ScopeDefinition;
    secondFactorRequired?: boolean;
    additionalCost?: number;
}

export function ApiMethod(options: ExportedMethodOptions) {
    return (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => {
        if (target.__exportedMethods == null) {
            target.__exportedMethods = [];
        }
        target.__exportedMethods.push({method: propertyKey, options});
    };
}

ApiMethod.getExportedMethods = function(clazz: unknown) {
    return (clazz as any)?.prototype?.__exportedMethods as ExportedMethod[] || [];
};

ApiMethod.getExportedMethod = function(clazz: unknown, method: string) {
    return ApiMethod.getExportedMethods(clazz).find(x => x.method === method);
};

ApiMethod.getExportedMethodOptions = function(clazz: unknown, method: string) {
    const exportedMethod = ApiMethod.getExportedMethods(clazz).find(x => x.method === method);
    if (!exportedMethod) {
        throw new Error("Method not found");
    }
    return exportedMethod.options;
};