import { CountDocumentsOptions, OptionalUnlessRequiredId } from "mongodb";
import { MongoDbManager } from "../db/MongoDbManager";
import * as types from "../types";
import * as mongodb from "mongodb";
import { AppException } from "../api/AppException";

export interface ListWithCount<T> {
    list: T[];
    count: number;
}

export interface ListWithOptionalSortBy extends types.core.ListModel {
    sortBy?: string;
}

/* @ignore-next-line-reference */
export class BaseRepository<T extends {_id: any}, K = T["_id"]> {
    
    constructor(
        protected dbManager: MongoDbManager,
        protected collectionName: string,
    ) {
    }
    
    protected getCollection() {
        return this.dbManager.db.collection<T>(this.collectionName);
    }
    
    generateId() {
        return this.dbManager.nextId() as T["_id"];
    }
    
    async get(id: T["_id"]) {
        const ele = await this.getCollection().findOne({_id: id});
        return ele as T|null;
    }
    
    async getAll() {
        const list = await this.getCollection().find({}).toArray();
        return list as T[];
    }
    
    async getByIds(ids: K[]) {
        const list = await this.getCollection().find({_id: {$in: ids as any[]}}).toArray();
        return list as T[];
    }
    
    async getPage(listParams: types.core.ListModel) {
        return this.matchX({}, listParams);
    }
    
    async insert(entity: OptionalUnlessRequiredId<T>, session?: mongodb.ClientSession) {
        return this.getCollection().insertOne(entity, {session: session});
    }
    
    async upsert(entity: OptionalUnlessRequiredId<T>) {
        return this.getCollection().replaceOne({_id: entity._id}, entity, {upsert: true});
    }
    
    async delete(id: T["_id"]) {
        return this.getCollection().deleteOne({_id: id});
    }
    
    async getCount(filter?: mongodb.Filter<T>, options?: CountDocumentsOptions) {
        const count = await this.getCollection().countDocuments(filter, options);
        return count as types.core.Uint;
    }
    
    /** Perform find with sort, skip and limit and returns list of found elements and count of all matched elements */
    async matchX(match: any, listParams: types.core.ListModel) {
        return this.getMatchingPage([{$match: match}], listParams);
    }
    
    async getMatchingPage<X = T>(stages: any[], listParams: ListWithOptionalSortBy) {
        if (listParams.lastId) {
            const temporaryListProperties: ListWithOptionalSortBy = {
                limit: listParams.limit + 1,
                skip: (listParams.skip > 0) ? listParams.skip - 1 : 0,
                sortOrder: listParams.sortOrder,
            };
            if (listParams.query) {
                temporaryListProperties.query = listParams.query;
            }
            if (listParams.sortBy) {
                temporaryListProperties.sortBy = listParams.sortBy;
            }
            
            const page = await this.aggregationX<X>(stages, temporaryListProperties);
            
            const firstRecord = page.list[0] as {_id?: unknown};
            if (page.count > 1 && "_id" in firstRecord && firstRecord._id === listParams.lastId) {
                page.list.shift();
                return page;
            }
            
            temporaryListProperties.limit = listParams.limit;
            temporaryListProperties.skip = 0;
            
            if (listParams.sortBy) {
                const symbolOfSortByField = Symbol(listParams.sortBy);
                const lastObject = (await this.get(listParams.lastId)) as unknown as {[symbolOfSortByField]: string};
                if (!lastObject) {
                    throw new AppException("NO_MATCH_FOR_LAST_ID");
                }
                stages.push({$match: { [symbolOfSortByField]: { [(listParams.sortOrder === "asc") ? "$gt" : "$lt"]: (lastObject[symbolOfSortByField])}}});
            }
            else {
                stages.push({$match: { _id: { [(listParams.sortOrder === "asc") ? "$gt" : "$lt"]: listParams.lastId }}});
            }
            return await this.aggregationX<X>(stages,  temporaryListProperties);
        }
        return await this.aggregationX<X>(stages, listParams);
    }
    
    /** Perform given stages with sort, skip and limit and returns list of found elements and count of all matched elements */
    async aggregationX<X = T>(stages: any[], listParams: ListWithOptionalSortBy): Promise<ListWithCount<X>> {
        const pipeline = [...stages];
        if ("query" in listParams) {
            if (!listParams.query || listParams.query.length <= 1) {
                return {list: [], count: 0};
            }
            pipeline.push({
                $match: {
                    searchable: new RegExp(this.normalizeStringForRegex(listParams.query), "i"),
                },
            });
        }
        const sortBy = listParams.sortBy ? listParams.sortBy : "_id";
        const sortOrder = listParams.sortOrder === "asc" ? 1 : -1;
        pipeline.push({
            $sort: {
                [sortBy]: sortOrder,
            },
        });
        pipeline.push({
            $facet: {
                totalData: [{$skip: listParams.skip}, {$limit: listParams.limit}],
                totalCount: [{$count: "count"}],
            },
        });
        const result = <{totalData: X[], totalCount: {count: number}[]}[]> await this.getCollection().aggregate(pipeline).toArray();
        return {list: result[0].totalData, count: result[0].totalCount.length === 0 ? 0 : result[0].totalCount[0].count};
    }
    
    normalizeStrings(...str: string[]) {
        return str.map(x => this.normalizeString(x)).join(" ");
    }
    
    normalizeString(str: string) {
        return BaseRepository.normalizeString(str);
    }
    
    normalizeStringForRegex(str: string) {
        return this.normalizeString(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    
    static normalizeStrings(...str: string[]) {
        return str.map(x => BaseRepository.normalizeString(x)).join(" ");
    }
    
    static normalizeString(str: string) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    }
}
