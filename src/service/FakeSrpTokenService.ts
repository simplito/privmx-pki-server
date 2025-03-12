import * as types from "../types";
import { SrpGroups, SrpGroupName } from "privmx-srp";
import { ConfigService } from "./ConfigService";
import BN from "bn.js";
import { Hex } from "../utils/Hex";
import * as bs58 from "bs58";
import { Crypto } from "../utils/Crypto";
import { AppException } from "../api/AppException";
import { DateUtils } from "../utils/DateUtils";

export class FakeSrpTokenService {
    
    constructor(
        private configService: ConfigService,
    ) {
    }
    
    async generateFakeInitialStepResult(email: types.core.LEmail) {
        const fakeToken = this.generateFakeToken();
        const fakeRoundsNumber = this.generateRandomRoundsNumberFromEmail(email);
        const keys = Object.keys(SrpGroups);
        const randomKey = keys[fakeRoundsNumber % keys.length];
        const randomGroup = SrpGroups[randomKey as SrpGroupName];
        const fakeB = this.generateFakeB(randomGroup.N.byteLength());
        const fakeSalt = Crypto.hmacSha256(this.getKey(), Buffer.from(email + "srp-salt", "utf8"));
        const fakePbkfdSalt = Crypto.hmacSha256(this.getKey(), Buffer.from(email + "pbkdf-salt", "utf8"));
        return {
            g: Hex.bn2Hex(randomGroup.g),
            N: Hex.bn2Hex(randomGroup.N),
            B: Hex.buf2Hex(fakeB),
            loginToken: bs58.encode(fakeToken) as types.core.SrpToken,
            pbkdf: {
                salt: Hex.buf2Hex(fakePbkfdSalt),
                rounds: fakeRoundsNumber,
            } as types.auth.Pbkdf2Params,
            salt: Hex.buf2Hex(fakeSalt.subarray(0, 16)),
        };
    }
    
    checkIfTokenIsFake(token: types.core.SrpToken) {
        const tokenBuffer = bs58.decode(token);
        const salt = tokenBuffer.subarray(0, 16);
        const date = Buffer.from(tokenBuffer.subarray(16, 20));
        const timestamp = date.readInt32BE(0);
        
        const hashBeg = tokenBuffer.subarray(20);
        const hash = Crypto.hmacSha256(this.getKey(), salt);
        if (hash.subarray(0, 12).equals(hashBeg)) {
            if (timestamp < Math.round(Date.now() / 1000)) {
                throw new AppException("TOKEN_DOES_NOT_EXIST");
            }
            else {
                throw new AppException("INVALID_USER_OR_PASSWORD");
            }
        }
    }
    
    private generateFakeB(groupLength: number) {
        return Crypto.randomBytes(groupLength);
    }
    
    private generateFakeToken() {
        const salt = Crypto.randomBytes(16);
        const hash = Crypto.hmacSha256(this.getKey(), salt);
        const expirationTimestamp = Math.round((DateUtils.getExpirationDate(this.configService.values.srpTokenTTL)) / 1000);
        const expirationTimestampBuf = Buffer.alloc(4);
        expirationTimestampBuf.writeInt32BE(expirationTimestamp, 0);
        const token = Buffer.concat([salt, expirationTimestampBuf, hash.subarray(0, 12)]);
        return token;
    }
    
    private generateRandomRoundsNumberFromEmail(email: string): number {
        const hashedEmail = Crypto.hmacSha256(this.getKey(), Buffer.from(email));
        const integerHash = new BN(hashedEmail, 16);
        const randomNumber = integerHash.mod(new BN(10001, 10)).add(new BN(40000, 10)).toNumber();
        return randomNumber;
    }
    
    private getKey() {
        return Buffer.from(this.configService.values.fakeSrpToken, "utf8");
    }
}
