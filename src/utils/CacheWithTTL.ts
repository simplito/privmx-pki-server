import * as types from "../types";
import { DateUtils } from "./DateUtils";

export class CacheWithTTL<T> {
    
    private map: Map<string, {value: T, ttl: types.core.Timespan, expires: types.core.Timestamp}> = new Map();
    
    get(key: string) {
        const item = this.map.get(key);
        return (item && item.expires > DateUtils.now()) ? item.value as T : undefined;
    }
    
    getAndRefresh(key: string) {
        const item = this.map.get(key);
        if (item && item.expires > DateUtils.now()) {
            item.expires = DateUtils.getExpirationDate(item.ttl);
            return item.value as T;
        }
        return undefined;
    }
    
    set(key: string, value: T, ttl: types.core.Timespan) {
        this.map.set(key, {
            expires: DateUtils.getExpirationDate(ttl),
            ttl,
            value: value,
        });
    }
    
    setWithExpires(key: string, value: T, expires: types.core.Timestamp) {
        if (expires < DateUtils.now()) {
            throw new Error("negative ttl");
        }
        this.map.set(key, {
            expires: expires,
            ttl: expires - DateUtils.now() as types.core.Timespan,
            value: value,
        });
    }
    
    delete(key: string) {
        return this.map.delete(key);
    }
    
    deleteExpired() {
        const keysToDelete: string[] = [];
        for (const [key, value] of this.map) {
            if (value.expires <= DateUtils.now()) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.map.delete(key);
        }
    }
}
