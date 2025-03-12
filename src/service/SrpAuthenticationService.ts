import * as types from "../types";
import * as db from "../db/Model";
import { SrpService, SrpGroups, SrpGroupName } from "privmx-srp";
import BN from "bn.js";
import { Utils } from "../utils/Utils";
import { Hex } from "../utils/Hex";
import { Crypto } from "../utils/Crypto";

export class SrpAuthenticationService {
    
    getSrpInfo() {
        const groups: Record<string, types.core.SrpGroup> = {};
        for (const groupName in SrpGroups) {
            const group = SrpGroups[groupName as types.core.SrpGroupName];
            groups[groupName] = {
                name: group.name,
                g: Hex.bn2Hex(group.g),
                N: Hex.bn2Hex(group.N),
            };
        }
        return groups as Record<types.core.SrpGroupName, types.core.SrpGroup>;
    }
    
    async prepareSrpCredentialsFromPassword(email: types.core.LEmail, password: types.core.PlainPassword) {
        const group = SrpGroups.the4096bit;
        const rounds = Utils.generateNumberInRange(600000, 650000);
        const salt = Crypto.randomBytes(32);
        const hashedPassword = await this.hashPassword2hex(password, rounds, salt);
        const data = await SrpService.registerEx(group.N, group.g, email, hashedPassword);
        const srpCredentials: db.SrpCredentials = {
            type: "srp",
            group: group.name,
            pbkdf: {
                salt: Hex.buf2Hex(salt),
                rounds: rounds,
            },
            salt: Hex.buf2Hex(data.s),
            verifier: Hex.bn2Hex(data.v),
        };
        return srpCredentials;
    }
    
    async initialSrpStep(groupName: SrpGroupName, verifier: types.core.Hexadecimal) {
        const verifierBN = new BN(verifier, 16);
        const group = SrpGroups[groupName];
        const b = SrpService.get_b();
        const k = await SrpService.get_k(group.N, group.g);
        const B = SrpService.get_B(group.g, group.N, k, b, verifierBN);
        return {
            g: Hex.bn2Hex(group.g),
            N: Hex.bn2Hex(group.N),
            B: Hex.bn2Hex(B),
            b: Hex.bn2Hex(b),
        };
    }
    
    async secondSrpStep(M1: types.core.Hexadecimal, A: types.core.Hexadecimal, groupName: SrpGroupName, v: types.core.Hexadecimal, B: types.core.Hexadecimal, b: types.core.Hexadecimal) {
        const group = SrpGroups[groupName];
        const result = await SrpService.server_exchange(
            group.N,
            new BN(A, 16),
            new BN(M1, 16),
            new BN(v, 16),
            new BN(B, 16),
            new BN(b, 16),
        );
        return Hex.bn2Hex(result.M2);
    }
    
    async verifyUserByPassword(srpCredentials: db.SrpCredentials, email: string, password: types.core.PlainPassword) {
        const group = SrpGroups[srpCredentials.group];
        const hashedPassword = await this.hashPassword2hex(
            password,
            srpCredentials.pbkdf.rounds,
            Hex.hex2Buf(srpCredentials.pbkdf.salt),
        );
        const registerResult = await SrpService.register(
            group.N,
            group.g,
            email,
            hashedPassword,
            this.fromHexToUint8Array(srpCredentials.salt),
        );
        const verifier = Hex.bn2Hex(registerResult.v);
        return verifier === srpCredentials.verifier;
    }
    
    private fromHexToUint8Array(hexString: string) {
        const parsedHexString = hexString.match(/.{1,2}/g);
        if (!parsedHexString) {
            return new Uint8Array(0);
        }
        return Uint8Array.from(parsedHexString.map((byte: string) => parseInt(byte, 16)));
    }
    
    private async hashPassword2hex(password: types.core.PlainPassword, rounds: number, salt: Buffer) {
        const mixedPassword = await Crypto.pbkdf2(password, salt, rounds, 32, "sha256");
        return Hex.buf2Hex(mixedPassword);
    }
}
