import * as types from "../types";
import { MongoDbManager } from "./MongoDbManager";
import { Logger } from "../utils/Logger";
import { DateUtils } from "../utils/DateUtils";
import { Migration000Scheme } from "./migrations/Migration000Scheme";
import { MasterRegistry } from "../cluster/master/MasterRegistry";
export type MigrationId = string&{__migrationId: never};

export type MigrationStatus = "PERFORMING"|"FAIL"|"SUCCESS";

export interface MigrationModel {
    _id: MigrationId;
    startDate: types.core.Timestamp;
    endDate: types.core.Timestamp|null;
    status: MigrationStatus;
}

export interface Migration {
    id: MigrationId;
    go: (mongoDbManager: MongoDbManager, container: MasterRegistry) => Promise<void>;
}

export class MigrationManager {
    
    private migrations: Migration[] = [
        Migration000Scheme,
    ];
    
    constructor(
        private dbManager: MongoDbManager,
        private logger: Logger,
        private masterRegistry: MasterRegistry,
    ) {
    }
    
    async go() {
        this.logger.debug("Starting migration process...");
        const collection = this.dbManager.db.collection<MigrationModel>("migrationx");
        const migrationModels = await collection.find().toArray();
        if (migrationModels.find(x => x.status != "SUCCESS")) {
            this.logger.error("Old migrations not finished with success. Repair db state manually");
            throw new Error("Old migrations not finished with success. Repair db state manually");
        }
        const dbMigrationId = process.env.PMX_MIGRATION;
        for (const migration of this.migrations) {
            const existingModel = migrationModels.find(x => x._id == migration.id);
            if (existingModel) {
                if (migration.id === dbMigrationId) {
                    break;
                }
                continue;
            }
            this.logger.debug("Performing '" + migration.id + "' migration...");
            const model: MigrationModel = {
                _id: migration.id,
                startDate: DateUtils.now(),
                endDate: null,
                status: "PERFORMING",
            };
            await collection.insertOne(model);
            try {
                await migration.go(this.dbManager, this.masterRegistry);
                await collection.updateOne({_id: model._id}, {$set: {endDate: DateUtils.now(), status: "SUCCESS"}});
                this.logger.debug("Migration '" + migration.id + "' sucessfully finished!");
            }
            catch (e) {
                this.logger.error("Error during performing migration '" + migration.id + "'", e);
                await collection.updateOne({_id: model._id}, {$set: {endDate: DateUtils.now(), status: "FAIL"}});
                this.logger.error("Migration process fails!");
                throw new Error("Migration process fails!");
            }
            if (migration.id === dbMigrationId) {
                break;
            }
        }
        this.logger.debug("Migration process finish with success!");
    }
}
