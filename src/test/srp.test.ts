import assert from "assert";
import "q2-test";
import { SrpAuthenticationService } from "../service/SrpAuthenticationService";
import { SrpService, SrpGroups } from "privmx-srp";
import { Hex } from "../utils/Hex";
import * as types from "../types";
import { clientSideRegister, clientSideLogin } from "./commonTestMethods";

it("SrpAuthenticationService login", async () => {
    const srpAuthenticationService = new SrpAuthenticationService();
    const email = "john@example";
    const password = "secret";
    const pbkdfRounds = 5000;
    
    const userData = await clientSideRegister(email, password, pbkdfRounds);
    const initialStepResult = await srpAuthenticationService.initialSrpStep(userData.groupName, userData.verifier);
    const clientSideSecondStepResult = await clientSideLogin(email, password, initialStepResult.B, userData.salt, userData.groupName, userData.pbkdf2Salt, pbkdfRounds);
    const serverM2 = await srpAuthenticationService.secondSrpStep(
        Hex.bn2Hex(clientSideSecondStepResult.M1),
        Hex.bn2Hex(clientSideSecondStepResult.A),
        userData.groupName,
        userData.verifier,
        initialStepResult.B,
        initialStepResult.b,
    );
    const clientM2 = await SrpService.get_M2(clientSideSecondStepResult.A, clientSideSecondStepResult.M1, clientSideSecondStepResult.S, SrpGroups.the1024bit.N);
    assert(serverM2 === Hex.bn2Hex(clientM2));
});

it("SRP password migration", async () => {
    const srpAuthenticationService = new SrpAuthenticationService();
    const email = "john@example" as types.core.LEmail;
    const password = "secret" as types.core.PlainPassword;
    
    const srpCredentials = await srpAuthenticationService.prepareSrpCredentialsFromPassword(email, password);
    const result = await srpAuthenticationService.verifyUserByPassword(srpCredentials, email, password);
    
    assert(result);
});
