import { SrpGroupName, SrpGroups } from "privmx-srp";
import { testApi } from "../../../test/api/Utils";
import * as types from "../../../types";
import { AuthApi } from "./AuthApi";
import { AuthApiValidator } from "./AuthApiValidator";

export const test = testApi("client", "auth/", AuthApi, new AuthApiValidator(), call => {
    call("register", api => api.register({
        email: "ad@m.in" as types.core.Email,
        password: "admin01" as types.core.PlainPassword,
    })).setResult({
        emailVerificationRequired: true,
    });
    call("register with organization and token", api => api.register({
        email: "ad@m.in" as types.core.Email,
        password: "admin01" as types.core.PlainPassword,
        token: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.TokenId,
    })).setResult({
        emailVerificationRequired: true,
    });
    call("validateAccountToken", api => api.validateAccountToken({
        token: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.TokenId,
    })).setResult("OK");
    call("resendAccountValidationToken", api => api.resendAccountValidationToken({
        email: "ad@m.in" as types.core.Email,
    })).setResult("OK");
    call("startCredentialsReset", api => api.startCredentialsReset({
        email: "ad@m.in" as types.core.Email,
    })).setResult("OK");
    call("checkResetCredentialsToken", api => api.checkResetCredentialsToken({
        token: "91PYMQ5Lgo6DeX6B4P8rQnJzKiVvq5jM44oNxUUhmGbL" as types.core.TokenId,
    })).setResult("OK");
    call("resetPassword", api => api.resetPassword({
        token: "91PYMQ5Lgo6DeX6B4P8rQnJzKiVvq5jM44oNxUUhmGbL" as types.core.TokenId,
        newPassword: "p@zzw0rd" as types.core.PlainPassword,
    })).setResult("OK");
    call("resetSrpCredentials", api => api.resetSrpCredentials({
        token: "91PYMQ5Lgo6DeX6B4P8rQnJzKiVvq5jM44oNxUUhmGbL" as types.core.TokenId,
        group: "the1024bit" as SrpGroupName,
        salt: "1d630d44b70b1f7cc20e0d728780f490" as types.core.Hexadecimal,
        verifier: "c955bde70ceaeb9e4e03782e4a185a9384f076649ba4f31227c21c529aeed121c132bc13989e291407b8ed925a00a898eff0770330f4cdf9116c24e89887b2e07fcf1012dec476defbcf40b18b9283d1ba0bd858055fc08a53f313a37e778a2f9a13f55e3730ab2d29e6d0ab113ff4d05d2484c980468feeb11ae9d91ab131ae" as  types.core.Hexadecimal,
        pbkdf2Params: {
            salt: "8d797d50f8fadcc315b674118efcc868e75cee9c5479e04c16e8f8680927977a" as types.core.Hexadecimal,
            rounds: 150000,
        } as types.auth.Pbkdf2Params,
    })).setResult("OK");
    call("getSrpInfo", api => api.getSrpInfo()).setResult({
        groups: {the1024bit: SrpGroups.the1024bit, the1536bit: SrpGroups.the1536bit} as any,
    });
    call("srpRegister", api => api.srpRegister({
        email: "john@example" as types.core.Email,
        group: "the1024bit" as SrpGroupName,
        salt: "1d630d44b70b1f7cc20e0d728780f490" as types.core.Hexadecimal,
        verifier: "c955bde70ceaeb9e4e03782e4a185a9384f076649ba4f31227c21c529aeed121c132bc13989e291407b8ed925a00a898eff0770330f4cdf9116c24e89887b2e07fcf1012dec476defbcf40b18b9283d1ba0bd858055fc08a53f313a37e778a2f9a13f55e3730ab2d29e6d0ab113ff4d05d2484c980468feeb11ae9d91ab131ae" as  types.core.Hexadecimal,
        pbkdf2Params: {
            salt: "8d797d50f8fadcc315b674118efcc868e75cee9c5479e04c16e8f8680927977a" as types.core.Hexadecimal,
            rounds: 50000,
            
        } as types.auth.Pbkdf2Params,
    })).setResult({
        emailVerificationRequired: false,
    });
    call("startSrpLogin", api => api.startSrpLogin({
        email: "ad@m.in" as types.core.Email,
    })).setResult({
        g: "02" as types.core.Hexadecimal,
        N: "eeaf0ab9adb38dd69c33f80afa8fc5e86072618775ff3c0b9ea2314c9c256576d674df7496ea81d3383b4813d692c6e0e0d5d8e250b98be48e495c1d6089dad15dc7d7b46154d6b6ce8ef4ad69b15d4982559b297bcf1885c529f566660e57ec68edbc3c05726cc02fd4cbf4976eaa9afd5138fe8376435b9fc61d2fc0eb06e3" as types.core.Hexadecimal,
        B: "12b8774e3371fff1da174bfbeb95a4bf39d74848673bc944c889bb0922cabe767b31d608740020fadafd0f2c8aed3d69dc5fcff3ba221c7a605e21a9ce5884eef5e6b3fa8ceb29eb8279bff9bb5862ba6ab731fe56b351fd8af76d27e79f39b1cab543fe05d37fcdc8357f7e47e2cd09e70e3c5a50f5d389c101a802d28cd035" as types.core.Hexadecimal,
        loginToken: "Ev4hq4GmWKyHvY3NeCewXnoBbaY2o9MsFXpR2ac7PMUv" as types.core.SrpToken,
        pbkdf: {
            salt: "e26c58d36a7e5d6aa9fd41f6a23d35c93c60289ecc947a796f656e22e49678cc" as types.core.Hexadecimal,
            rounds: 50000,
        },
        salt: "01d3d65c7d4e23cd7efa61da77f3b5f3" as types.core.Hexadecimal,
    });
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
    call("loginForToken", api => api.loginForToken({
        email: "ad@m.in" as types.core.Email,
        password: "admin01" as types.core.PlainPassword,
    }, undefined)).setResult({
        accessToken: "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=" as types.core.AccessToken,
        accessTokenExpiresIn: 900000 as types.core.Timespan,
        refreshToken: "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=" as types.core.RefreshToken,
        refreshTokenExpiresIn: 604800000 as types.core.Timespan,
        tokenType: "Bearer",
        scope: ["user:read", "user:write", "..."] as types.core.Scope[],
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
    call("confirmSrpLoginForToken", api => api.confirmSrpLoginForToken({
        A: "e6f9b4759a1d8edba555badf1216b0f381b949501414902116114149c40b4abcebe80b0ba7596f3e0a55a22dbabea157fbab49bd3721c1de16a2cfed5247ba134a2117a3a6c46c9bda566ef70e98dc466c66519ecbe9891dc2e03ea79f99a06975ae590c0e52586e23dea02447abc43ed9e697003752bade5ee9e91276cca2a5" as types.core.Hexadecimal,
        loginToken: "EmZwqZiD9w5B5JfsgnUv36H6Y5QFWSA3e95SLBgNR5Pn" as types.core.SrpToken,
        M1: "b06eb3f9c273eb39e268043347e851d25108ea8376a44b237de133e69e74cd7d" as types.core.Hexadecimal,
    }, undefined)).setResult({
        M2: "ffb67331e5d8731015c929548da5435c92086e7a7b32e61491616a9c4827d62f" as types.core.Hexadecimal,
        accessToken: "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=" as types.core.AccessToken,
        accessTokenExpiresIn: 900000 as types.core.Timespan,
        refreshToken: "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=" as types.core.RefreshToken,
        refreshTokenExpiresIn: 604800000 as types.core.Timespan,
        tokenType: "Bearer",
        scope: ["user:read", "user:write"] as types.core.Scope[],
    });
    call("resendSecondFactorCode", api => api.resendSecondFactorCode({
        email: "ad@m.in" as types.core.Email,
        challengeId: "91PYMQ5Lgo6DeX6B4P8rQnJzKiVvq5jM44oNxUUhmGbL" as types.core.ChallengeId,
    }));
});
