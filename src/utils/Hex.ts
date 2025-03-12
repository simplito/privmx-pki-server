import * as types from "../types";
import BN from "bn.js";

export class Hex {
    
    static buf2Hex(buffer: Uint8Array|Buffer) {
        return (Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)).toString("hex") as types.core.Hexadecimal;
    }
    
    static bn2Hex(bn: BN) {
        return bn.toJSON() as types.core.Hexadecimal;
    }
    
    static hex2Buf(hex: types.core.Hexadecimal) {
        return Buffer.from(hex, "hex");
    }
}
