import { testApi } from "../../../test/api/Utils";
import { PkiAdminApi } from "./PkiAdminApi";
import { PkiAdminApiValidator } from "./PkiAdminApiValidator";

const userId: string = "user1";
const userPubKey: string = "51WPnnGwztNPWUDEbhncYDxZCZWAFS4M9Yqv94N2335nL92fEn";
const contextId: string = "32fcd0b5-ceb5-44a7-9990-0d999b9718e6";
const host: string = "localhost:5000";

export const test = testApi("client", "pkiadmin/", PkiAdminApi, new PkiAdminApiValidator(), call => {
    call("setKey", api => api.setKey({
        userId, userPubKey, host, contextId,
    })).setResult("OK");
    
    call("deleteKey", api => api.deleteKey({
        userId, host, contextId,
    })).setResult("OK");
});
