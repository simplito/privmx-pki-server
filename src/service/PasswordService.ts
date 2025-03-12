import * as types from "../types";
import { Crypto } from "../utils/Crypto";

export class PasswordService {
    
    /* @ignore-next-line-reference */
    async encodePassword(password: types.core.PlainPassword) {
        const salt = Crypto.randomBytes(16);
        const hash = await this.hashPassword(password, salt);
        return ("p|" + salt.toString("hex") + "|" + hash.toString("hex")) as types.core.HashedPassword;
    }
    
    async checkPassword(password: types.core.PlainPassword, hashed: types.core.HashedPassword) {
        const [type, salt, hash] = hashed.split("|");
        if (type != "p" || !salt || !hash) {
            throw new Error("Corrupted hashed password");
        }
        const h = await this.hashPassword(password, Buffer.from(salt, "hex"));
        return h.equals(Buffer.from(hash, "hex"));
    }
    
    private hashPassword(password: types.core.PlainPassword, salt: Buffer): Promise<Buffer> {
        return Crypto.pbkdf2(password, salt, 10000, 32, "sha256");
    }
}
