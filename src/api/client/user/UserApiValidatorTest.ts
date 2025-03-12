import { SrpGroupName } from "privmx-srp";
import { testApi } from "../../../test/api/Utils";
import * as types from "../../../types";
import { UserApi } from "./UserApi";
import { UserApiValidator } from "./UserApiValidator";

export const test = testApi("client", "user/", UserApi, new UserApiValidator(), call => {
    call("checkAuthorization", api => api.checkAuthorization()).setResult("OK");
    call("getProfile", api => api.getProfile()).setResult({
        profile: {
            id: "65854daeb50d70e69ed0912d" as types.user.UserId,
            email: "john@example.com" as types.core.Email,
            name: "John" as types.user.Username,
            activated: true,
            blocked: false,
        },
    });
    call("setProfile", api => api.setProfile({
        name: "some-name" as types.user.Username,
    })).setResult("OK");
    call("getInfo", api => api.getInfo());
    call("enableSecondFactor", api => api.enableSecondFactor({
        type: "email",
    })).setResult({
        challengeId: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.ChallengeId,
        info: "a...@...",
    });
    call("enableSecondFactor totp", api => api.enableSecondFactor({
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP" as types.user.SecondFactorSecret,
    })).setResult({
        challengeId: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.ChallengeId,
        info: "app",
    });
    call("confirmEnablingOfSecondFactor", api => api.confirmEnablingOfSecondFactor({
        challengeId: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.ChallengeId,
        authorizationData: "1234" as types.core.SecondFactorAuthorizationCode,
        rememberDevice: false,
    })).setResult("OK");
    call("confirmDisablingOfSecondFactor", api => api.confirmDisablingOfSecondFactor({
        challengeId: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.ChallengeId,
        authorizationData: "1234" as types.core.SecondFactorAuthorizationCode,
    })).setResult("OK");
    call("disableSecondFactor", api => api.disableSecondFactor()).setResult({
        challengeId: "4ma6CAH8VPWptN1ygLwZXBncwWJSsA8LLr5XsWF1uuXA" as types.core.ChallengeId,
        info: "a...@...",
    });
    call("changePassword", api => api.changePassword({
        currentPassword: "oooooooo" as types.core.PlainPassword,
        newPassword: "oooooooo" as types.core.PlainPassword,
    })).setResult("OK");
    call("startSrpCredentialsChange", api => api.startSrpCredentialsChange()).setResult({
        credentialsChangeToken: "Ev4hq4GmWKyHvY3NeCewXnoBbaY2o9MsFXpR2ac7PMUv" as types.core.TokenId,
        g: "02" as types.core.Hexadecimal,
        N: "eeaf0ab9adb38dd69c33f80afa8fc5e86072618775ff3c0b9ea2314c9c256576d674df7496ea81d3383b4813d692c6e0e0d5d8e250b98be48e495c1d6089dad15dc7d7b46154d6b6ce8ef4ad69b15d4982559b297bcf1885c529f566660e57ec68edbc3c05726cc02fd4cbf4976eaa9afd5138fe8376435b9fc61d2fc0eb06e3" as types.core.Hexadecimal,
        B: "12b8774e3371fff1da174bfbeb95a4bf39d74848673bc944c889bb0922cabe767b31d608740020fadafd0f2c8aed3d69dc5fcff3ba221c7a605e21a9ce5884eef5e6b3fa8ceb29eb8279bff9bb5862ba6ab731fe56b351fd8af76d27e79f39b1cab543fe05d37fcdc8357f7e47e2cd09e70e3c5a50f5d389c101a802d28cd035" as types.core.Hexadecimal,
        pbkdf: {
            salt: "e26c58d36a7e5d6aa9fd41f6a23d35c93c60289ecc947a796f656e22e49678cc" as types.core.Hexadecimal,
            rounds: 50000,
        },
        salt: "01d3d65c7d4e23cd7efa61da77f3b5f3" as types.core.Hexadecimal,
    });
    call("confirmSrpCredentialsChange", api => api.confirmSrpCredentialsChange({
        credentialsChangeToken: "EmZwqZiD9w5B5JfsgnUv36H6Y5QFWSA3e95SLBgNR5Pn" as types.core.TokenId,
        A: "e6f9b4759a1d8edba555badf1216b0f381b949501414902116114149c40b4abcebe80b0ba7596f3e0a55a22dbabea157fbab49bd3721c1de16a2cfed5247ba134a2117a3a6c46c9bda566ef70e98dc466c66519ecbe9891dc2e03ea79f99a06975ae590c0e52586e23dea02447abc43ed9e697003752bade5ee9e91276cca2a5" as types.core.Hexadecimal,
        M1: "b06eb3f9c273eb39e268043347e851d25108ea8376a44b237de133e69e74cd7d" as types.core.Hexadecimal,
        group: "the1024bit" as SrpGroupName,
        salt: "1d630d44b70b1f7cc20e0d728780f490" as types.core.Hexadecimal,
        verifier: "c955bde70ceaeb9e4e03782e4a185a9384f076649ba4f31227c21c529aeed121c132bc13989e291407b8ed925a00a898eff0770330f4cdf9116c24e89887b2e07fcf1012dec476defbcf40b18b9283d1ba0bd858055fc08a53f313a37e778a2f9a13f55e3730ab2d29e6d0ab113ff4d05d2484c980468feeb11ae9d91ab131ae" as  types.core.Hexadecimal,
        pbkdf2Params: {
            salt: "8d797d50f8fadcc315b674118efcc868e75cee9c5479e04c16e8f8680927977a" as types.core.Hexadecimal,
            rounds: 50000,
            
        } as types.auth.Pbkdf2Params,
    })).setResult("OK");
    call("subscribeToWebSocketChannel", api => api.subscribeToWebSocketChannel({
        channels: ["thread", "inbox"] as types.core.ChannelName[],
    })).setResult("OK");
    call("unsubscribeFromWebSocketChannel", api => api.unsubscribeFromWebSocketChannel({
        channels: ["thread", "inbox"] as types.core.ChannelName[],
    })).setResult("OK");
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
    
    call("resendSecondFactorCode", api => api.resendSecondFactorCode({
        challengeId: "5ZTUQ7VBxoqRKn3pEyPjHeavXHVw7JcJF3MvAV43yfsR" as types.core.ChallengeId,
    })).setResult("OK");
    
    call("forgetAllDevices", api => api.forgetAllDevices()).setResult("OK");
});
