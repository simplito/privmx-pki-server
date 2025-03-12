import * as types from "../types";

export class LoggedUserDoesNotExist extends Error {
    
    constructor(id: types.user.UserId) {
        super(`Logged user does not exist user=${id}`);
    }
}
