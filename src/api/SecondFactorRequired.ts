import * as types from "../types";

export class SecondFactorRequired extends Error {
    
    constructor(public readonly challenge: types.auth.SecondFactorRequired) {
        super("Second factor required");
    }
}
