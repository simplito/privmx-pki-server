import BN from "bn.js";
import { SrpService, SrpGroups, SrpGroupName } from "privmx-srp";
import { Utils } from "privmx-srp/out/Utils";
import { Crypto } from "../utils/Crypto";
import { Hex } from "../utils/Hex";
import * as types from "../types";
export interface Pbkdf2Params {
    algorithm: string;
    rounds: number;
    length: number;
    salt: Uint8Array;
}

export interface ClientSrpCredentials {
    pbkdf2Salt: Uint8Array;
    verifier: types.core.Hexadecimal;
    salt: Uint8Array;
    groupName: SrpGroupName;
}

export interface ClientSideLoginResult {
    M1: BN;
    A: BN;
    S: BN;
}

async function mixPassword(password: string, pbkdf2Params: Pbkdf2Params) {
    const mixedPassword = await Crypto.pbkdf2(password, pbkdf2Params.salt, pbkdf2Params.rounds, pbkdf2Params.length, pbkdf2Params.algorithm);
    return Utils.bufferToHex(mixedPassword);
}

export async function clientSideRegister(username: string, password: string, pbkdf2Rounds: number): Promise<ClientSrpCredentials> {
    const group = SrpGroups.the1024bit;
    const pbkdf2Params: Pbkdf2Params = {algorithm: "sha256", rounds: pbkdf2Rounds, length: 32, salt: Crypto.randomBytes(32)};
    const data = await SrpService.registerEx(group.N, group.g, username, await mixPassword(password, pbkdf2Params));
    return {
        pbkdf2Salt: pbkdf2Params.salt,
        verifier: Hex.bn2Hex(data.v),
        salt: data.s,
        groupName: group.name,
    };
}

export async function clientSideLogin(username: string, password: string, B: string, salt: Uint8Array, groupName: SrpGroupName, pbkdf2Salt: Uint8Array, pbkdf2Rounds: number) {
    const group = SrpGroups[groupName];
    const pbkdf2Params: Pbkdf2Params = {algorithm: "sha256", rounds: pbkdf2Rounds, length: 32, salt: pbkdf2Salt};
    const data = await SrpService.login_step1Ex(group.N, group.g, salt, new BN(B, 16), username, await mixPassword(password, pbkdf2Params));
    return {
        M1: data.M1,
        A: data.A,
        S: data.S,
    };
}
