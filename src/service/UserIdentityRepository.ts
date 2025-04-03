import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import { UserIdentity } from "../api/client/pki/PkiApiTypes";

export class UserIdentityRepository extends BaseRepository<db.UserIdentityRecord> {
    
    static readonly COLLECTION_NAME = "useridentity";
    constructor(dbManager: MongoDbManager) {
        super(dbManager, UserIdentityRepository.COLLECTION_NAME);
    }
    
    /**
     * Sets a new public key for a user or updates an existing one.
     * @param userId
     * @param userPubKey
     * @param host
     * @param contextId
     */
    async setKey(userId: string, userPubKey: string, host: string, contextId: string) {
        const itemCreateDate = Date.now();
        const newItem: db.UserIdentityRecord = {
            _id: this.generateId(), createDate: itemCreateDate,
            userId, userPubKey, host, contextId,
        };
        const result = await this.insert(newItem);
        return result.insertedId;
    }
    
    /**
     *  Deletes a user’s public key
     * @param userId
     * @param host
     * @param contextId
     */
    async deleteKey(userId: string, host: string, contextId: string) {
        const query = { userId, host, contextId };
        const latest = await this.getCollection().findOne(query, {sort: {createDate: -1}});
        if (latest && latest.userPubKey !== undefined) {
            const itemCreateDate = Date.now();
            const newItem: db.UserIdentityRecord = {
                _id: this.generateId(), createDate: itemCreateDate,
                userId, userPubKey: undefined, host, contextId,
            };
            const result = await this.insert(newItem);
            return result.insertedId;
        }
        return null;
    }
    
    /**
     * Retrieves the current public key of a user. Returns `null` if no key is found.
     * @param userId
     * @param host
     * @param contextId
     */
    async getCurrentKey(userId: string, host: string, contextId: string) {
        const query = { userId, host, contextId };
        const result = await this.getCollection().findOne(query, {sort: {createDate: -1}});
        return this.convertSingle(result);
    }
    
    /**
     * Returns the public key that was assigned to the user at the specified date. Returns `null` if no key was assigned at that time.
     * @param userId
     * @param host
     * @param contextId
     * @param date
     */
    
    async getKeyAt(userId: string, host: string, contextId: string, date: number) {
        // returns latest entry with date lower or equal to requested date
        const query = { userId, host, contextId, createDate: {$lte: date} };
        const result = await this.getCollection().findOne(query, {sort: {createDate: -1}});
        return this.convertSingle(result);
    }
    
    /**
     * Returns the modification history of the user's public key. If a key was deleted, the `pubKey` field is `null`.
     * @param userId
     * @param host
     * @param contextId
     */
    async getKeyHistory(userId: string, host: string, contextId: string) {
        const query = { userId, host, contextId };
        const result = await this.getCollection().find(query).sort({createDate: -1}).toArray();
        return this.convertMany(result);
    }
    
    /**
     * Verifies whether the given public key was assigned to the user at the specified date.
     * @param userId
     * @param host
     * @param contextId
     * @param usePubKey
     * @param date
     */
    async verifyKey(userId: string, host: string, contextId: string, userPubKey: string, date: number) {
        const query = { userId, host, contextId, userPubKey, createDate: {$lte: date} };
        const result = await this.getCollection().find(query).sort({createDate: -1}).limit(1).toArray();
        return this.convertSingle(result[0]);
    }
    
    private recordToEntry(record: db.UserIdentityRecord): UserIdentity {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...userIdentity} = record;
        return userIdentity;
    }
    
    private convertMany(fromDB: db.UserIdentityRecord[]  | null) {
        if (!fromDB) {
            return null;
        }
        return fromDB.map(x => this.recordToEntry(x));
    }
    
    private convertSingle(fromDB: db.UserIdentityRecord | null): UserIdentity | null {
        if (!fromDB) {
            return null;
        }
        return this.recordToEntry(fromDB);
    }
}
