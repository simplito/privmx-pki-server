
export type UserId = string&{__userId: never};
export type Username = string&{__userName: never};
export type SecondFactorSecret = string&{__secondFactorCode: never};
export type SecondFactorToken = string&{__secondFactorToken: never};
export type Role = "owner";

/** holds user's profile info */
export interface User {
    /** user's id */
    id: UserId;
    /** whether user is enabled */
    enabled: boolean;

}