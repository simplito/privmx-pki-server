import { testApi } from "../../../test/api/Utils";
import { PkiApi } from "./PkiApi";
import { PkiApiValidator } from "./PkiApiValidator";
import * as types from "../../../types";

const userId: string = "user1";
const userPubKey: string = "51WPnnGwztNPWUDEbhncYDxZCZWAFS4M9Yqv94N2335nL92fEn";
const contextId: string = "32fcd0b5-ceb5-44a7-9990-0d999b9718e6";
const instanceId = "8UV7xqdcyqYDcZomeZbv4YNXLhikz1gt5teR9Qgot8xknL6nhH" as types.pki.InstanceId;

const hostPubKey = "8UV7xqdcyqYDcZomeZbv4YNXLhikz1gt5teR9Qgot8xknL6nhH";
const hostUrl = "localhost:3000" as types.pki.HostUrl;

export const test = testApi("client", "pki/", PkiApi, new PkiApiValidator(), call => {
    call("getCurrentKey", api => api.getCurrentKey({
        userId, instanceId, contextId,
    })).setResult({
        userId, userPubKey, contextId, instanceId, createDate: Date.now(),
    });
    
    call("getKeyAt", api => api.getKeyAt({
        userId, instanceId, contextId, date: Date.now(),
    })).setResult({
        userId, userPubKey, contextId, instanceId, createDate: Date.now(),
    });
    
    call("getKeyHistory", api => api.getKeyHistory({
        userId, instanceId, contextId,
    })).setResult([{
        userId, userPubKey, contextId, instanceId, createDate: Date.now(),
    }]);
    
    call("verifyKey", api => api.verifyKey({
        userId, instanceId, contextId, userPubKey, date: Date.now(),
    })).setResult(true);

    call("verifyHostById", api => api.verifyHostById({
        instanceId, hostUrl: hostUrl
    })).setResult(true);

    call("verifyHostByPub", api => api.verifyHostByPub({
        hostPubKey, hostUrl: hostUrl
    })).setResult(true);

    call("getHost", api => api.getHost({
        instanceId, hostUrl: hostUrl
    })).setResult({instanceId, hostPubKey, addresses: [hostUrl]});
});
