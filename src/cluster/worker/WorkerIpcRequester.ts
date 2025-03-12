import * as cluster from "cluster";
import { DeferredMap } from "../common/DeferredMap";
import { IpcRequester } from "../common/IpcRequester";

export class WorkerIpcRequester {
    
    private ipcRequester: IpcRequester;
    
    constructor(
        ipcRequestMap: DeferredMap,
        private worker: cluster.Worker,
    ) {
        this.ipcRequester = new IpcRequester(ipcRequestMap);
    }
    
    request<T>(method: string, params: unknown): Promise<T> {
        return this.ipcRequester.request(this.worker, method, params);
    }
}
