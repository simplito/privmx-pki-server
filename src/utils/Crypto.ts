import * as crypto from "crypto";
import { PromiseUtils } from "./PromiseUtils";
export class Crypto {
    
    static hash(algorithm: string, data: Buffer) {
        return crypto.createHash(algorithm).update(data).digest();
    }
    
    static sha1(data: Buffer): Buffer {
        return Crypto.hash("sha1", data);
    }
    
    static sha256(data: Buffer): Buffer {
        return Crypto.hash("sha256", data);
    }
    
    static hmac(algorithm: string, key: Uint8Array, data: Uint8Array) {
        return crypto.createHmac(algorithm, key).update(data).digest();
    }
    
    static hmacSha256(key: Uint8Array, data: Uint8Array) {
        return Crypto.hmac("sha256", key, data);
    }
    
    static randomBytes(size: number) {
        return crypto.randomBytes(size);
    }
    
    static pbkdf2(password: crypto.BinaryLike, salt: crypto.BinaryLike, rounds: number, length: number, algorithm: string): Promise<Buffer> {
        return PromiseUtils.callbackToPromise(cb => crypto.pbkdf2(password, salt, rounds, length, algorithm, cb));
    }
    
    static md5(data: Buffer) {
        return Crypto.hash("md5", data);
    }
    
    static sign(dataToSign: Buffer, privateKey: string) {
        const privKey = crypto.createPrivateKey(privateKey);
        return crypto.sign(null, dataToSign, privKey);
    }
    
    static verifySignature(dataToVerify: Buffer, publicKey: string, signature: Buffer) {
        const pubKey = crypto.createPublicKey(publicKey);
        return crypto.verify(null, dataToVerify, pubKey, signature);
    }
    
    static genKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        });
        return {publicKey, privateKey};
    }
    
    static isEd25519PEMPublicKey(pemPubKey: string) {
        try {
            const pubKey = crypto.createPublicKey(pemPubKey);
            return pubKey.type === "public" && pubKey.asymmetricKeyType === "ed25519";
        }
        catch {
            return false;
        }
    }
}
