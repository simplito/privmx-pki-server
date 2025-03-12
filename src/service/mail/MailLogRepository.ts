import { BaseRepository } from "../BaseRepository";
import * as db from "../../db/Model";
import { MongoDbManager } from "../../db/MongoDbManager";

export class MailLogRepository extends BaseRepository<db.MailLog> {
    
    static readonly COLLECTION_NAME = "mail_log";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, MailLogRepository.COLLECTION_NAME);
    }
    
    async create(mailLog: db.MailLog) {
        await this.insert(mailLog);
        return mailLog;
    }
}
