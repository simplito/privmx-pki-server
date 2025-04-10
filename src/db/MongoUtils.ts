import * as mongodb from "mongodb";

export class MongoUtils {
    
    static readonly ERRORS = {
        COLLECTION_ALREADY_EXISTS: 48,
        DUPLICATE_KEY_ERROR: 11000,
    };
    
    static isMongoError(e: unknown): e is mongodb.MongoError {
        return e instanceof mongodb.MongoError;
    }
    
    static isMongoErrorWithCode(e: unknown, code: number) {
        return MongoUtils.isMongoError(e) && e.code === code;
    }
    
    static isCollectionAlreadExistsError(e: unknown) {
        return MongoUtils.isMongoErrorWithCode(e, MongoUtils.ERRORS.COLLECTION_ALREADY_EXISTS);
    }
}
