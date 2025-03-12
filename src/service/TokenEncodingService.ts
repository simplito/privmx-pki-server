import crypto from "crypto";
import * as db from "../db/Model";
import { AppException } from "../api/AppException";
import { TokenEncryptionKeyProvider } from "../cluster/master/ipcServices/TokenEncryptionKeyProvider";
import { Hex } from "../utils/Hex";

export class TokenEncodingService {
    
    private readonly MAGIC_NUMBER = 78; // Value between 0 and 255
    
    constructor(
        private tokenEncryptionKeyProvider: TokenEncryptionKeyProvider,
    ) {
    }
    
    async getKeyToEncode() {
        return this.tokenEncryptionKeyProvider.getCurrentKey();
    }
    
    async encode(data: unknown, encKey: db.TokenEncryptionKey) {
        const iv = this.generateNewIv();
        const keyId = Hex.hex2Buf(encKey._id);
        const key = Hex.hex2Buf(encKey.key);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
        const update = cipher.update(JSON.stringify(data));
        const final = cipher.final();
        const tag = cipher.getAuthTag();
        const buff = Buffer.concat([this.getMagicNumberBuf(), keyId, iv, update, final, tag]).toString("base64url");
        return buff;
    }
    
    async decode(encodedBase64Token: string): Promise<unknown> {
        const buffer = Buffer.from(encodedBase64Token, "base64url");
        const magicNumber = buffer.subarray(0, 1);
        this.validateMagicNumberBuf(magicNumber);
        const keyId = buffer.subarray(1, 17);
        const key = await this.getKeyFromId(Hex.buf2Hex(keyId) as db.TokenEncryptionKeyId);
        const iv = buffer.subarray(17, 29);
        const data = buffer.subarray(29, buffer.length - 16);
        const tag = buffer.subarray(buffer.length - 16);
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(tag);
        const update = decipher.update(data).toString("utf8");
        const final = decipher.final().toString("utf8");
        return JSON.parse(update + final);
    }
    
    private generateNewIv() {
        return crypto.randomBytes(12);
    }
    
    private async getKeyFromId(keyId: db.TokenEncryptionKeyId) {
        const cipherKey = await this.tokenEncryptionKeyProvider.getKey(keyId);
        if (!cipherKey) {
            throw new AppException("ACCESS_DENIED");
        }
        return Hex.hex2Buf(cipherKey.key);
    }
    
    private getMagicNumberBuf() {
        if (!Number.isInteger(this.MAGIC_NUMBER) || this.MAGIC_NUMBER < 0 || this.MAGIC_NUMBER > 255) {
            throw new Error("Set magic number exceeds one byte");
        }
        const buf = Buffer.alloc(1);
        buf.writeUInt8(this.MAGIC_NUMBER);
        return buf;
    }
    
    private validateMagicNumberBuf(buf: Buffer) {
        const num = buf.readUInt8(0);
        if (!Number.isInteger(num) || num !== this.MAGIC_NUMBER) {
            throw new Error("Invalid magic num");
        }
    }
}