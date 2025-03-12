import { EventReporter } from "./EventReporter";
import { ServerError } from "../error/ServerError";
export interface JobEntry {
    intervalId: NodeJS.Timeout;
    func: () => any;
    intervalPeriod: number;
}

export class JobService {
    
    private jobs: {[name: string]: JobEntry};
    
    constructor(
        private eventReporter: EventReporter,
    ) {
        this.jobs = {};
    }
    
    addPeriodicJob(func: () => any, interval: number, name: string) {
        const newJobEntry = {
            func: func,
            intervalPeriod: interval,
            intervalId: setInterval(func, interval),
        };
        this.jobs[name] = newJobEntry;
    }
    
    /* @ignore-next-line-reference */
    clearJob(name: string) {
        if (!this.jobs[name]) {
            throw new Error("Job not set");
        }
        clearInterval(this.jobs[name].intervalId);
        delete this.jobs[name];
    }
    
    clearAllJobs() {
        for (const name in this.jobs) {
            clearInterval(this.jobs[name].intervalId);
        }
        this.jobs = {};
    }
    /* @ignore-next-line-reference */
    callInBackground(func: () => Promise<unknown>, onErrorMessage: string) {
        void (async () => {
            try {
                await func();
            }
            catch (e) {
                this.eventReporter.reportError("", new ServerError(onErrorMessage, e));
            }
        })();
    }
}
