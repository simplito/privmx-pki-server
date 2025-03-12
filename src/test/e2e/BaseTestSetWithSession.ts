import assert from "assert";
import { BaseTestSet, shouldThrowErrorWithCode } from "./BaseTestSet";
import { testData } from "../datasets/testData";
import { ChallengeId } from "../../types/core";
import { SecondFactorRequired } from "../../types/auth";

export class BaseTestSetWithSession extends BaseTestSet {
    
    /** Login without 2FA */
    protected async login() {
        const loginResponse = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, undefined);
        assert(!!loginResponse.accessToken, `Unexpected return value: ${JSON.stringify(loginResponse, null, 4)}`);
        this.apis.jsonRpcClient.setHeader("Authorization", "Bearer " + loginResponse.accessToken);
        return loginResponse;
    }
    
    /** Login with 2FA */
    protected async loginWithEmail2FA() {
        
        const secondFactor = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, undefined) as unknown as SecondFactorRequired;
        
        assert(!!secondFactor.secondFactorRequired, `Unexpected return value: ${JSON.stringify(secondFactor, null, 4)}`);
        
        const loginResponse2 = await this.apis.auth.loginForToken({
            email: testData.adminEmail,
            password: testData.adminPassword,
        }, {
            challenge: secondFactor.challenge as ChallengeId,
            authorizationData: await this.helpers.getSecondFactorCodeFromMail(),
        });
        
        assert(!!loginResponse2.accessToken, `Unexpected return value: ${JSON.stringify(loginResponse2, null, 4)}`);
        this.apis.jsonRpcClient.setHeader("Authorization", "Bearer " + loginResponse2.accessToken);
        
        return loginResponse2;
    }
    
    /** Checks if profile fetch fails */
    protected async shouldNotBeLogged() {
        await shouldThrowErrorWithCode(() => this.apis.user.getProfile(), "UNAUTHORIZED");
    }
}
