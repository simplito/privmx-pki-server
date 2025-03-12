import { ApiMethod } from "../../api/Decorators";

export interface IpcServiceDescriptor {
    className: string;
    classNameLower: string;
    methods: string[];
    type: "master"|"worker";
}

export const ipcServiceRegistry: IpcServiceDescriptor[] = [];
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function IpcService(constructor: Function) {
    const methods: string[] = [];
    for (const exportedMethod of ApiMethod.getExportedMethods(constructor)) {
        if (typeof (constructor.prototype[exportedMethod.method]) == "function") {
            methods.push(exportedMethod.method);
        }
    }
    ipcServiceRegistry.push({
        type: "master",
        className: constructor.name,
        classNameLower: constructor.name[0].toLowerCase() + constructor.name.substring(1),
        methods,
    });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function WorkerIpcService(constructor: Function) {
    const methods: string[] = [];
    for (const exportedMethod of ApiMethod.getExportedMethods(constructor)) {
        if (typeof (constructor.prototype[exportedMethod.method]) == "function") {
            methods.push(exportedMethod.method);
        }
    }
    
    ipcServiceRegistry.push({
        type: "worker",
        className: constructor.name,
        classNameLower: constructor.name[0].toLowerCase() + constructor.name.substring(1),
        methods,
    });
}
