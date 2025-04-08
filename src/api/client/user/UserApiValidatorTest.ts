import { testApi } from "../../../test/api/Utils";
import * as types from "../../../types";
import { UserApi } from "./UserApi";
import { UserApiValidator } from "./UserApiValidator";

export const test = testApi("client", "user/", UserApi, new UserApiValidator(), call => {
    call("addApiKey", api => api.addApiKey({
        type: "secret",
        name: "My ApiKey" as types.auth.ApiKeyName,
        clientSecret: "myverylongandsecuresecretforapikey" as types.auth.ClientSecret,
        maxScope: ["user:read"] as types.core.Scope[],
    })).setResult({
        apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
    });
    
    call("deleteApiKey", api => api.deleteApiKey({
        apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
    })).setResult("OK");
    
    call("getApiKey", api => api.getApiKey({
        apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
    })).setResult({
        apiKey: {
            apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
            name: "My ApiKey",
            enabled: true,
            maxScope: ["profile", "websocket"] as types.core.Scope[],
            clientSecret: "secret" as types.auth.ClientSecret,
        },
    });
    
    call("listApiKeys", api => api.listApiKeys()).setResult({
        list: [{
            apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
            name: "My ApiKey",
            enabled: true,
            maxScope: ["profile", "websocket"] as types.core.Scope[],
            clientSecret: "secret" as types.auth.ClientSecret,
        }],
    });
    
    call("updateApiKey", api => api.updateApiKey({
        apiKeyId: "65854daeb50d70e69ed0912d" as types.auth.ClientId,
        name: "new name" as types.auth.ApiKeyName,
        enabled: true,
        maxScope: ["profile"] as types.core.Scope[],
    })).setResult("OK");    
});
