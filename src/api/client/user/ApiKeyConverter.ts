import * as db from "../../../db/Model";
import * as types from "../../../types";

export class ApiKeyConverter {
    convertApiKeyToRecord(apikey: db.ApiKey): types.auth.ApiKeyRecord {
        const res: types.auth.ApiKeyRecord = {
            apiKeyId: apikey._id,
            name: apikey.name,
            enabled: apikey.enabled,
            maxScope: apikey.maxScope,
        };
        if (apikey.clientSecret) {
            res.clientSecret = apikey.clientSecret;
        }
        else if (apikey.publicKey) {
            res.clientPublicKey = apikey.publicKey;
        }
        return res;
    }
}