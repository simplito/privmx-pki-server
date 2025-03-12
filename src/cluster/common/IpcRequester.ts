import * as cluster from "cluster";
import { IpcChannelMessage, IpcRequest } from "./Ipc";
import { DeferredMap } from "./DeferredMap";

export class IpcRequester {
    
    constructor(
        private ipcRequestMap: DeferredMap,
    ) {
    }
    
    request<T>(worker: cluster.Worker, method: string, params: unknown): Promise<T> {
        const {id, defer} = this.ipcRequestMap.create<T>();
        const request: IpcRequest = {id: id, method, params};
        const channelRequest: IpcChannelMessage = {channel: "request", data: request};
        worker.send(channelRequest);
        if (defer.promise === null) {
            throw new Error();
        }
        return defer.promise;
    }
}
