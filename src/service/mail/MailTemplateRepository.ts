import { BaseRepository } from "../BaseRepository";
import * as db from "../../db/Model";
import { MongoDbManager } from "../../db/MongoDbManager";

export class MailTemplateRepository extends BaseRepository<db.MailTemplate> {
    
    static readonly COLLECTION_NAME = "mail_template";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, MailTemplateRepository.COLLECTION_NAME);
    }
    
}
