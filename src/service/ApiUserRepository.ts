/*!
PrivMX Bridge.
Copyright © 2024 Simplito sp. z o.o.

This file is part of the PrivMX Platform (https://privmx.dev).
This software is Licensed under the PrivMX Free License.

See the License for the specific language governing permissions and
limitations under the License.
*/
import { BaseRepository } from "./BaseRepository";
import * as db from "../db/Model";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import { DateUtils } from "../utils/DateUtils";
import { ApiUser, ApiUserId } from "../types/auth";
import { AppException } from "../api/AppException";


export class ApiUserRepository extends BaseRepository<db.ApiUserRecord> {
    
    static readonly COLLECTION_NAME = "api_user";
    static readonly COLLECTION_ID_PROP = "id";
    
    constructor(
        dbManager: MongoDbManager,
    ) {
        super(dbManager, ApiUserRepository.COLLECTION_NAME);
    }
    
    async getByUserId(userId: ApiUserId) {
        const result = await this.getCollection().findOne({id: userId});
        if (! result) {
            throw new AppException("USER_DOES_NOT_EXIST");
        }
        return this.recordToEntry(result); 
    } 

    async create() {
        const user: db.ApiUserRecord = {
            _id: this.generateId(),
            created: DateUtils.now(),
            enabled: true,
        };
        await this.insert(user);
        return this.recordToEntry(user);
    }
    
    async setEnabled(userId: types.auth.ApiUserId, enabled: boolean) {
        await this.getCollection().updateOne({_id: userId}, {$set: {enabled: enabled}});
    }

    private recordToEntry(record: db.ApiUserRecord): ApiUser {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...rest} = record;
        return rest;
    }
}
