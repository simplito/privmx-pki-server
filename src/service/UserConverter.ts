import * as types from "../types";
import * as db from "../db/Model";

export class UserConverter {
    
    convertUser(user: db.User) {
        const res: types.user.User = {
            id: user._id,
            email: user.email,
            name: user.name,
            activated: user.activated,
            blocked: user.blocked,
        };
        return res;
    }
}
