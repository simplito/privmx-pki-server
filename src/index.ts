/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import cluster from "cluster";
import type * as MasterModule from "./cluster/master/master";
import type * as WorkerModule from "./cluster/worker/worker";

if (cluster.isPrimary) {
    const { startMaster } = require("./cluster/master/master") as typeof MasterModule;
    startMaster();
}
else {
    const {startWorker } = require("./cluster/worker/worker") as typeof WorkerModule;
    startWorker();
}