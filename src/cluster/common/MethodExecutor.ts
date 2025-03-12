import { ExportedMethod } from "../../api/Decorators";

export class MethodExecutor {
    
    private methods = new Map<string, {method: string, service: any}>();
    
    registerWithPrefix(prefix: string, service: any) {
        for (const method of (service.__exportedMethods as ExportedMethod[] || [])) {
            const fullMethodName = prefix + method.method;
            if (this.methods.has(fullMethodName)) {
                throw new Error("Method '" + fullMethodName + "' already registered");
            }
            this.methods.set(fullMethodName, {method: method.method, service: service});
        }
    }
    
    execute(method: string, params: unknown) {
        const entry = this.methods.get(method);
        if (!entry) {
            throw new Error("Method not found");
        }
        return entry.service[entry.method](params);
    }
}
