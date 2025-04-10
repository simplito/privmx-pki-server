import * as types from "../types";
import * as db from "../db/Model";

export class UserConverter {
    
    convertUser(user: db.User) {
        const res: types.user.User = {
            id: user._id,
            enabled: user.enabled,
        };
        return res;
    }
}
