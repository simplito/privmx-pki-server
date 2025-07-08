import { testApi } from "../../../test/api/Utils";
import * as types from "../../../types";
import { AuthApi } from "./AuthApi";
import { AuthApiValidator } from "./AuthApiValidator";

export const test = testApi("client", "auth/", AuthApi, new AuthApiValidator(), call => {
    call("token", api => api.token({
        scope: ["user:read_write"] as types.core.Scope[],
        grantType: "client_credentials",
        clientId: "65ad8f6b2e4f4f1adb40bf68" as types.auth.ClientId,
        clientSecret: "5ZTUQ7VBxoqRKn3pEyPjHeavXHVw7JcJF3MvAV43yfsR" as types.auth.ClientSecret,
    }, undefined)).setResult({
        accessToken: "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=" as types.core.AccessToken,
        accessTokenExpiresIn: 900000 as types.core.Timespan,
        refreshToken: "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=" as types.core.RefreshToken,
        refreshTokenExpiresIn: 604800000 as types.core.Timespan,
        tokenType: "Bearer",
        scope: ["user:read", "user:write"] as types.core.Scope[],
    });
    call("bindAccessToken", api => api.bindAccessToken({
        accessToken: "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4" as types.core.AccessToken,
    })).setResult("OK");
    call("forkToken", api => api.forkToken({
        refreshToken: "VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW09yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0ga="  as types.core.RefreshToken,
        sessionName: "myNewSession" as types.auth.SessionName,
    })).setResult({
        accessToken: "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=" as types.core.AccessToken,
        accessTokenExpiresIn: 900000 as types.core.Timespan,
        refreshToken: "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=" as types.core.RefreshToken,
        refreshTokenExpiresIn: 604800000 as types.core.Timespan,
        tokenType: "Bearer",
        scope: ["user:read", "user:write"] as types.core.Scope[],
    });
    call("createFirstApiKey", api => api.createFirstApiKey({
        initializationToken: "some_secret_token"  as types.auth.InitializationToken,
        name: "name_for_api_key" as types.auth.ApiKeyName,
    })).setResult({
        apiKeyId: "API_KEY_ID" as types.auth.ClientId,
        apiKeySecret: "API_KEY_SECRET" as types.auth.ClientSecret,
    });
    
});
