import * as mongodb from "mongodb";
import { MongoUtils } from "./MongoUtils";

export interface MongoConfig {
    url: string;
    dbName: string;
}

export class MongoDbManager {
    
    constructor(
        private client: mongodb.MongoClient,
        private mongoDb: mongodb.Db,
    ) {
    }
    
    get db() {
        return this.mongoDb;
    }
    
    static async init(config: MongoConfig): Promise<MongoDbManager> {
        const client = await mongodb.MongoClient.connect(config.url, {minPoolSize: 5, maxPoolSize: 5});
        const db = client.db(config.dbName);
        return new MongoDbManager(client, db);
    }
    
    nextId() {
        return new mongodb.ObjectId().toHexString();
    }
    
    async close() {
        return this.client.close();
    }
    
    async createOrGetCollection<T extends mongodb.Document = mongodb.Document>(dbCollectionName: string) {
        try {
            const collection = await this.mongoDb.createCollection<T>(dbCollectionName);
            return {created: true, collection};
        }
        catch (e) {
            if (MongoUtils.isCollectionAlreadExistsError(e)) {
                return {created: false, collection: this.mongoDb.collection<T>(dbCollectionName)};
            }
            throw e;
        }
    }
}
