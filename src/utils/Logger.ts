/* eslint-disable no-console */
import cluster from "cluster";
export enum LoggerLevel {
    DEBUG = 0,
    INFO = 1,
    LOG = 2,
    WARN = 3,
    ERROR = 4,
    OFF = 5
}

function getWorkerId() {
    const mainId = cluster.isPrimary ? "MS" : cluster.worker?.id.toString().padStart(2, "0");
    const pid = process.pid.toString().padStart(5, "0");
    return `${mainId},P:${pid}`;
}
export class Logger {
    
    static DEFAULT_LEVEL = LoggerLevel.DEBUG;
    
    private level: LoggerLevel;
    
    constructor(
        private name: string,
    ) {
        this.level = Logger.DEFAULT_LEVEL;
    }
    
    static create(value: any): Logger {
        const name = typeof(value) == "string" ? value : typeof(value) === "function" ? value.name as string : value.constructor.name as string;
        return new Logger(name);
    }
    
    setLevel(level: LoggerLevel) {
        this.level = level;
    }
    
    debug(...args: [any?, ...any[]]) {
        if (this.level > LoggerLevel.DEBUG) {
            return;
        }
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][DEBUG][${getWorkerId()}]`);
        console.debug(...args);
    }
    
    info(...args: [any?, ...any[]]) {
        if (this.level > LoggerLevel.INFO) {
            return;
        }
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][INFO][${getWorkerId()}]`);
        console.info(...args);
    }
    
    log(...args: [any?, ...any[]]) {
        if (this.level > LoggerLevel.LOG) {
            return;
        }
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][LOG][${getWorkerId()}]`);
        console.log(...args);
    }
    
    warn(...args: [any?, ...any[]]) {
        if (this.level > LoggerLevel.WARN) {
            return;
        }
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][WARN][${getWorkerId()}]`);
        console.warn(...args);
    }
    
    error(...args: [any?, ...any[]]) {
        if (this.level > LoggerLevel.ERROR) {
            return;
        }
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][ERROR][${getWorkerId()}]`);
        console.error(...args);
    }
    
    stat(...args: [any?, ...any[]]) {
        args.splice(0, 0, `[${new Date().toISOString()}][${this.name}][STAT][${getWorkerId()}]`);
        console.error(...args);
    }
    
}
