import cluster from "cluster";
import * as Cluster from "cluster";

export class WorkersHolder {
    private workers: Cluster.Worker[] = [];
    
    constructor() {
        cluster.on("exit", (worker) => {
            this.workers = this.workers.filter(x => x.id !== worker.id);
        });
    }
    
    createWorker() {
        const worker = cluster.fork();
        this.workers.push(worker);
        return worker;
    }
    
    getWorkers() {
        return this.workers;
    }
    
    hasWorkers() {
        return this.workers.length > 0;
    }
}
