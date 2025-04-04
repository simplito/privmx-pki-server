import { testApi } from "../../../test/api/Utils";
import { PkiAdminApi } from "./PkiAdminApi";
import { PkiAdminApiValidator } from "./PkiAdminApiValidator";
import * as types from "../../../types";

const userId: string = "user1";
const userPubKey: string = "51WPnnGwztNPWUDEbhncYDxZCZWAFS4M9Yqv94N2335nL92fEn";
const contextId: string = "32fcd0b5-ceb5-44a7-9990-0d999b9718e6";
const instanceId = "AAAABBBBCCCCDDDDEEEEFFFF11112222333344445555666677" as types.pki.InstanceId;
const hostPubKey: string = "AAAABBBBCCCCDDDDEEEEFFFF11112222333344445555666677";
const hostUrl = "localhost:3000" as types.pki.HostUrl;

export const test = testApi("client", "pkiadmin/", PkiAdminApi, new PkiAdminApiValidator(), call => {
    call("setKey", api => api.setKey({
        userId, userPubKey, instanceId, contextId,
    })).setResult("OK");
    
    call("deleteKey", api => api.deleteKey({
        userId, instanceId, contextId,
    })).setResult("OK");

    call("setHost", api => api.setHost({
        hostPubKey, hostUrl
    })).setResult(instanceId);

    call("addHostUrl", api => api.addHostUrl({
        instanceId, hostUrl
    })).setResult("OK");

    call("removeHostUrl", api => api.removeHostUrl({
        instanceId, hostUrl
    })).setResult("OK");

    call("deleteHost", api => api.deleteHost({
        instanceId
    })).setResult("OK");

});
