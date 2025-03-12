import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as mongodb from "mongodb";
import { DateUtils } from "../utils/DateUtils";
export class EventRepository extends BaseRepository<db.Event> {
    
    static readonly COLLECTION_NAME = "event";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, EventRepository.COLLECTION_NAME);
    }
    
    async registerNewEvent(eventData: db.EventData, session?: mongodb.ClientSession) {
        const event: db.Event = {
            _id: this.generateId(),
            date: DateUtils.now(),
            eventData: eventData,
        };
        await this.insert(event, session);
    }
}
