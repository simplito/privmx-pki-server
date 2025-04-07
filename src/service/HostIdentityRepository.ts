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
     * @param hostPubKey
     * @param hostUrl
     */
    async setHost(instanceId: types.pki.InstanceId, hostPubKey: string, hostUrl: types.pki.HostUrl) {
        const host = await this.getCollection().findOne({hostPubKey}, {sort: {createDate: -1}});
        if (host) {
            throw new AppException("HOST_IDENTITY_WITH_GIVEN_PUB_KEY_ALREADY_EXISTS");
        }
        const urlExists = await this.hasUrl(hostUrl);
        if (urlExists) {
            throw new AppException("URL_ALREADY_RESERVED_FOR_OTHER_HOST");
        }
        const itemCreateDate = Date.now();
        const newItem: db.HostIdentityRecord = {
            _id: this.generateId(), createDate: itemCreateDate,
            instanceId, hostPubKey, addresses: [hostUrl] as types.pki.HostUrl[],
        };
        const result = await this.insert(newItem);
        return result.insertedId;
    }
    
    /**
     * Adds address/url to given host
     * @param instanceId
     * @param url
     */
    async addHostUrl(instanceId: types.pki.InstanceId, url: types.pki.HostUrl) {
        const query = { instanceId };
        const hostIdentity = await this.getCollection().findOne(query);
        if (! hostIdentity) {
            throw new AppException("NO_HOST_BY_GIVEN_INSTANCE_ID");
        }
        if (hostIdentity.addresses.includes(url)) {
            throw new AppException("HOST_URL_ALREADY_EXISTS");
        }
        const urlExists = await this.hasUrl(url);
        if (urlExists) {
            throw new AppException("URL_ALREADY_RESERVED_FOR_OTHER_HOST");
        }
        
        hostIdentity.addresses.push(url);
        return this.getCollection().replaceOne({_id: hostIdentity._id}, hostIdentity, {upsert: true});
    }
    
    /**
     * Removes address/url from given host
     * @param instanceId
     * @param url
     */
    async removeHostUrl(instanceId: types.pki.InstanceId, url: types.pki.HostUrl) {
        const query = { instanceId };
        const hostIdentity = await this.getCollection().findOne(query);
        if (! hostIdentity) {
            throw new AppException("NO_HOST_BY_GIVEN_INSTANCE_ID");
        }
        if (!hostIdentity.addresses.includes(url)) {
            throw new AppException("HOST_URL_DOES_NOT_EXIST");
        }
        hostIdentity.addresses.splice(hostIdentity.addresses.indexOf(url), 1);
        return this.getCollection().replaceOne({_id: hostIdentity._id}, hostIdentity, {upsert: true});
    }
    
    /**
     *  Deletes the host identity
     * @param instanceId
     */
    async deleteHost(instanceId: types.pki.InstanceId) {
        const query = { instanceId };
        const latest = await this.getCollection().findOne(query, {sort: {createDate: -1}});
        if (! latest) {
            throw new AppException("NO_HOST_BY_GIVEN_INSTANCE_ID");
        }
        await this.getCollection().deleteOne(query);
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
    
    private async hasUrl(url: types.pki.HostUrl): Promise<boolean> {
        const result = await this.getCollection().find({addresses: url}).toArray();
        return result.length > 0;
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
    
}
