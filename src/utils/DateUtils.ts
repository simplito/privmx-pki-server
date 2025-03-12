import * as types from "../types";

export class DateUtils {
    
    static now() {
        return Date.now() as types.core.Timestamp;
    }
    
    static getSeconds(seconds: number) {
        return (seconds * 1000) as types.core.Timespan;
    }
    
    static getMinutes(minutes: number) {
        return (minutes * 60 * 1000) as types.core.Timespan;
    }
    
    static getHours(hours: number) {
        return (hours * 60 * 60 * 1000) as types.core.Timespan;
    }
    
    static getDays(days: number) {
        return (days * 24 * 60 * 60 * 1000) as types.core.Timespan;
    }
    
    static getExpirationDate(ttl: types.core.Timespan, now?: types.core.Timestamp) {
        return ((typeof(now) === "undefined" ? Date.now() : now) + ttl) as types.core.Timestamp;
    }
    
    static addTimespans(t1: types.core.Timespan, t2: types.core.Timespan) {
        return (t1 + t2) as types.core.Timespan;
    }
    
    static increaseTimestamp(timestamp: types.core.Timestamp, timespan: types.core.Timespan) {
        return (timestamp + timespan) as types.core.Timestamp;
    }
}
