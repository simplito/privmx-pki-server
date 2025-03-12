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
    
    async getActiveUser(id: types.user.UserId) {
        const user = await this.get(id);
        return user && user.activated && !user.blocked ? user : null;
    }
    
    async getByEmail(email: types.core.LEmail) {
        return (await this.getCollection().findOne({email: email})) as db.User|null;
    }
    
    async isEmailInUse(email: types.core.LEmail) {
        const count = await this.getCollection().countDocuments({email: email});
        return count;
    }
    
    async create(email: types.core.LEmail, credentials: db.SrpCredentials, activated: boolean, session?: mongodb.ClientSession) {
        const now = DateUtils.now();
        const name = "" as types.user.Username;
        const user: db.User = {
            _id: this.generateId(),
            createDate: now,
            modDate: now,
            lastPasswordChange: now,
            credentials: credentials,
            email: email,
            name: name,
            activated: activated,
            blocked: false,
            searchable: this.normalizeStrings(email, name),
        };
        await this.insert(user, session);
        return user;
    }
    
    async updateProfile(id: types.user.UserId, email: types.core.LEmail, name: types.user.Username) {
        await this.getCollection().updateOne(
            {
                _id: id,
                email: email, // safeguard against trying updating email
            },
            {
                $set: {
                    name: name,
                    searchable: this.normalizeStrings(email, name),
                },
            },
        );
    }
    
    async enableSecondFactor(id: types.user.UserId, secondFactor: db.SecondFactor) {
        await this.getCollection().updateOne({_id: id}, {$set: {secondFactor: secondFactor}});
    }
    
    async disableSecondFactor(id: types.user.UserId) {
        await this.getCollection().updateOne({_id: id}, {$unset: {secondFactor: 1}});
    }
    
    async activateAccount(id: types.user.UserId) {
        await this.getCollection().updateOne({_id: id}, {$set: {activated: true}});
    }
    
    async removeAllKnownDevices(userId: types.user.UserId) {
        await this.getCollection().updateOne({
            _id: userId,
            "secondFactor.knownDevices": { $exists: true},
        },
        {
            $set: { "secondFactor.knownDevices": [] },
        });
    }
    
    async addKnownDevice(id: types.user.UserId, deviceId: types.core.AgentId) {
        await this.getCollection().updateOne({
            _id: id,
            "secondFactor.knownDevices": { $exists: true},
        },
        {
            $push: { "secondFactor.knownDevices": deviceId },
        });
    }
    
    /* @ignore-next-line-reference */
    async updateBlocked(id: types.user.UserId, blocked: boolean) {
        await this.getCollection().updateOne({_id: id}, {$set: {blocked: blocked}});
    }
    
    async updatePossibleLoginAttackTarget(id: types.user.UserId, possibleAttackTarget: types.core.Timestamp|undefined) {
        if (possibleAttackTarget) {
            await this.getCollection().updateOne({_id: id}, {$set: {possibleLoginAttackTarget: possibleAttackTarget}});
        }
        else {
            await this.getCollection().updateOne({_id: id}, {$unset: {possibleLoginAttackTarget: 1}});
        }
    }
    
    async updatePossibleTotpAttackTarget(id: types.user.UserId, possibleAttackTarget: types.core.Timestamp|undefined) {
        if (possibleAttackTarget) {
            await this.getCollection().updateOne({_id: id}, {$set: {possibleTotpAttackTarget: possibleAttackTarget}});
        }
        else {
            await this.getCollection().updateOne({_id: id}, {$unset: {possibleTotpAttackTarget: 1}});
        }
    }
    
    async updateUserCredentials(id: types.user.UserId, credentials: db.SrpCredentials) {
        await this.getCollection().updateOne({_id: id}, {$set: {credentials: credentials, lastPasswordChange: DateUtils.now()}});
    }
}
