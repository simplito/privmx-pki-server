import { testApi } from "../../../test/api/Utils";
import { PkiApi } from "./PkiApi";
import { PkiApiValidator } from "./PkiApiValidator";

const userId: string = "user1";
const userPubKey: string = "51WPnnGwztNPWUDEbhncYDxZCZWAFS4M9Yqv94N2335nL92fEn";
const contextId: string = "32fcd0b5-ceb5-44a7-9990-0d999b9718e6";
const host: string = "localhost:5000";

export const test = testApi("client", "pki/", PkiApi, new PkiApiValidator(), call => {
    call("getCurrentKey", api => api.getCurrentKey({
        userId, host, contextId,
    })).setResult({
        userId, userPubKey, contextId, host, createDate: Date.now(),
    });
    
    call("getKeyAt", api => api.getKeyAt({
        userId, host, contextId, date: Date.now(),
    })).setResult({
        userId, userPubKey, contextId, host, createDate: Date.now(),
    });
    
    call("getKeyHistory", api => api.getKeyHistory({
        userId, host, contextId,
    })).setResult([{
        userId, userPubKey, contextId, host, createDate: Date.now(),
    }]);
    
    call("verifyKey", api => api.verifyKey({
        userId, host, contextId, userPubKey, date: Date.now(),
    })).setResult(true);
});
