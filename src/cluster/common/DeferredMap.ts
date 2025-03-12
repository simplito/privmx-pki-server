import { PromiseUtils, Deferred } from "../../utils/PromiseUtils";

export class DeferredMap {
    
    private id: number = 1;
    private deferMap = new Map<number, Deferred<unknown>>();
    
    pop(id: number): Deferred<unknown> | undefined {
        const res = this.deferMap.get(id);
        this.deferMap.delete(id);
        return res;
    }
    
    create<T = unknown>() {
        const id = this.id++;
        const defer = PromiseUtils.defer<T>();
        this.deferMap.set(id, defer as Deferred<unknown>);
        return {id, defer};
    }
}
