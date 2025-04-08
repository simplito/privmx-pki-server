import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import { DateUtils } from "../utils/DateUtils";
import * as mongodb from "mongodb";

export class UserRepository extends BaseRepository<db.User> {
    
    static readonly COLLECTION_NAME = "user";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, UserRepository.COLLECTION_NAME);
    }
    
    async create(enabled: boolean, session?: mongodb.ClientSession) {
        const user: db.User = {
            _id: this.generateId(),
            createDate: DateUtils.now(),
            enabled: enabled,
        };
        await this.insert(user, session);
        return user;
    }
    
    /* @ignore-next-line-reference */
    async updateEnabled(id: types.user.UserId, enabled: boolean) {
        await this.getCollection().updateOne({_id: id}, {$set: {enabled: enabled}});
    }
}
