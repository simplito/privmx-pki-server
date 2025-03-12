import { IpcService, ipcServiceRegistry } from "../../master/Decorators";
import { ApiMethod } from "../../../api/Decorators";

@IpcService
export class IpcRegistryService {
    
    @ApiMethod({})
    async getIpcServiceRegistry() {
        return ipcServiceRegistry;
    }
}
