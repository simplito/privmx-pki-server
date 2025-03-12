import { AppException } from "../api/AppException";
import * as types from "../types";

export class MongoFilterConverter {
    
    constructor(
        private fieldNameMap: {[name: string]: string},
        private sortFieldNameMap: {[name: string]: string},
    ) {
    }
    
    convertFilter(filter: types.core.Filter): {$match: unknown} {
        if (filter.type === "containsString") {
            const regex = new RegExp(this.escapeRegexValue(filter.value), "i");
            const fieldName = this.mapFieldName(filter.fieldName);
            return {$match: {[fieldName]: {$regex: regex}}};
        }
        else if (filter.type === "exactString") {
            const regex = new RegExp(`^${this.escapeRegexValue(filter.value)}$`, "i");
            const fieldName = this.mapFieldName(filter.fieldName);
            return {$match: {[fieldName]: {$regex: regex}}};
        }
        else if (filter.type === "numericComparison") {
            const fieldName = this.mapFieldName(filter.fieldName);
            const comparator = "$" + filter.comparator;
            return {$match: {[fieldName]: {[comparator]: filter.value}}};
        }
        else if (filter.type === "inRange") {
            const fieldName = this.mapFieldName(filter.fieldName);
            return {$match: {$and: [
                {[fieldName]: {$gte: filter.min}},
                {[fieldName]: {$lte: filter.max}},
            ]}};
        }
        else if (filter.type === "inArray") {
            const fieldName = this.mapFieldName(filter.fieldName);
            return {$match: {[fieldName]: {$in: filter.values}}};
        }
        throw new AppException("INVALID_PARAMS");
    }
    
    mapFieldName(originalString: string) {
        return originalString in this.fieldNameMap ? this.fieldNameMap[originalString] : originalString;
    }
    
    mapSortFieldName(originalString: string) {
        return originalString in this.sortFieldNameMap ? this.sortFieldNameMap[originalString] : this.mapFieldName(originalString);
    }
    
    escapeRegexValue(str: string) {
        const toEscape = ".^$*+?()[]{}\\/|-]";
        let result = "";
        for (const c of str) {
            result += toEscape.includes(c) ? "\\" + c : c;
        }
        return result;
    }
}
