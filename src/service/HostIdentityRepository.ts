import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import { AppException } from "../api/AppException";
import { HostIdentity, HostIdentityFilter } from "../api/client/pki/PkiApiTypes";

interface FilterAsQuery {
    instanceId?: types.pki.InstanceId;
    addresses?: types.pki.HostUrl;
    hostPubKey?: string;
}
export class HostIdentityRepository extends BaseRepository<db.HostIdentityRecord> {
    
    static readonly COLLECTION_NAME = "hostidentity";
    constructor(dbManager: MongoDbManager) {
        super(dbManager, HostIdentityRepository.COLLECTION_NAME);
    }
    
    /**
     * Sets a new host identity.
     * @param instanceId
     * @param hostPubKey
     * @param hostUrl
     */
    async setHost(instanceId: types.pki.InstanceId, hostPubKey: string, hostUrl: types.pki.HostUrl) {
        const itemCreateDate = Date.now();
        const newItem: db.HostIdentityRecord = {
            _id: this.generateId(),
            createDate: itemCreateDate,
            instanceId, hostPubKey, addresses: [hostUrl] as types.pki.HostUrl[],
        };
        try {
            const result = await this.insert(newItem);
            return result.insertedId;    
        } 
        catch (e) {
            if (this.isMongoDuplicationError(e, "hostPubKey")) {
                throw new AppException("HOST_IDENTITY_WITH_GIVEN_PUB_KEY_ALREADY_EXISTS");
            }
            else
            if (this.isMongoDuplicationError(e, "addresses")) {
                throw new AppException("URL_ALREADY_RESERVED");
            }
            else {
                throw e;
            };
        }
    }
    
    /**
     * Adds address/url to given host
     * @param instanceId
     * @param url
     */
    async addHostUrl(instanceId: types.pki.InstanceId, url: types.pki.HostUrl) {
        try {
            const result = await this.getCollection().updateOne({instanceId: instanceId}, 
                {$addToSet: {addresses: url}});
            if (result.matchedCount > 0 && result.modifiedCount === 0) {
                throw new Error("exists");
            }
        } 
        catch (e) {
            if (this.isMongoDuplicationError(e, "addresses")) {
                throw new AppException("URL_ALREADY_RESERVED");
            }
            if (this.isCustomExistsError(e)) {
                throw new AppException("HOST_URL_ALREADY_EXISTS");
            }
            else {
                throw e;
            }
        }
    }
    
    /**
     * Removes address/url from given host
     * @param instanceId
     * @param url
     */
    async removeHostUrl(instanceId: types.pki.InstanceId, url: types.pki.HostUrl) {
        const result = await this.getCollection().updateOne({instanceId: instanceId}, 
            {$pull: {addresses: url}});
        if (result.modifiedCount === 0) {
            throw new AppException("CANNOT_REMOVE_URL_FROM_THE_HOST");
        }
    }
    
    /**
     *  Deletes the host identity
     * @param instanceId
     */
    async deleteHost(instanceId: types.pki.InstanceId) {
        const result = await this.getCollection().deleteOne({instanceId: instanceId})
        if (result.deletedCount === 0) {
            throw new AppException("NO_HOST_BY_GIVEN_INSTANCE_ID");
        }
    }
    
    /**
     * Verifies host
     * @param model
     */
    async verifyHostBy(model: {hostUrl: types.pki.HostUrl, instanceId?: types.pki.InstanceId, hostPubKey?: string}) {
        const query: FilterAsQuery = {addresses: model.hostUrl};
        if (model.instanceId) {
            query.instanceId = model.instanceId;
        }
        if (model.hostPubKey) {
            query.hostPubKey = model.hostPubKey;
        }
        const result = await this.getCollection().find(query).sort({createDate: -1}).limit(1).toArray();
        return result.length > 0;
    }
    
    /**
     * Gets host by given filter
     * @param filter
     */
    async getHost(filter: HostIdentityFilter) {
        const query: FilterAsQuery = {};
        if (filter.hostUrl) {
            query.addresses = filter.hostUrl;
        }
        if (filter.instanceId) {
            query.instanceId = filter.instanceId;
        }
        const result = await this.getCollection().findOne(query, {sort: {createDate: -1}});
        return this.convertSingle(result);
    }
    
    async listHosts() {
        return this.convertMany(await this.getAll());
    }
    
    private recordToEntry(record: db.HostIdentityRecord): HostIdentity {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, createDate, ...rest} = record;
        return rest;
    }
    
    private convertMany(fromDB: db.HostIdentityRecord[]  | null) {
        if (!fromDB) {
            return null;
        }
        return fromDB.map(x => this.recordToEntry(x));
    }
    
    private convertSingle(fromDB: db.HostIdentityRecord | null): HostIdentity | null {
        if (!fromDB) {
            return null;
        }
        return this.recordToEntry(fromDB);
    }

    private isMongoDuplicationError(e: unknown, field: string): boolean {
        return (e !== null && typeof(e) === "object") && "code" in e && e.code === 11000 && "keyValue" in e && e.keyValue !== null && typeof(e.keyValue) === "object" && field in e.keyValue;
    }
    
    private isCustomExistsError(e: unknown): boolean {
        return (e !== null && typeof(e) === "object") && "message" in e && e.message === "exists";
    }
}
