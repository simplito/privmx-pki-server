/* eslint-disable @stylistic/js/key-spacing */

export const API_ERROR_CODES = {
    "PARSE_ERROR"                            : {code: -32700, message: "Parse error", description: "You sent us invalid json"},
    "INVALID_REQUEST"                        : {code: -32600, message: "Invalid request", description: "You sent us invalid json rpc request"},
    "METHOD_NOT_FOUND"                       : {code: -32601, message: "Method not found", description: "Given method does not exist"},
    "INVALID_PARAMS"                         : {code: -32602, message: "Invalid params", description: "Given parameters are invalid. The data property of error object contains detailed description what is wrong"},
    "INTERNAL_ERROR"                         : {code: -32603, message: "Internal error", description: "We had a problem with our server"},
    "NOT_YET_INSTALLED"                      : {code: -32604, message: "Not yet installed", description: "Not yet installed"},
    "ONLY_POST_METHOD_ALLOWED"               : {code: -32605, message: "Only post method allowed", description: "You do not use HTTP POST method"},
    "ACCESS_DENIED"                          : {code: 0x0001, message: "Access denied", description: "You don't have access to requested resource"},
    "INVALID_USER_OR_PASSWORD"               : {code: 0x0002, message: "Invalid user or password", description: "Your username or password is invalid"},
    "EMAIL_ALREADY_IN_USE"                   : {code: 0x0003, message: "Email already in use", description: "This email adress is already in use"},
    "CONTEXT_DOES_NOT_EXIST"                 : {code: 0x0008, message: "Context does not exist", description: "Context that you wanted to access does not exists"},
    "CONTEXT_USER_DOES_NOT_EXIST"            : {code: 0x0009, message: "Context user does not exist", description: "This user does not exists in this specific context"},
    "DEVELOPER_DOES_NOT_EXIST"               : {code: 0x000A, message: "User does not exist", description: "This user does not exists"},
    "DEVELOPER_TOKEN_DOES_NOT_EXIST"         : {code: 0x000B, message: "User token does not exist", description: "User token not found"},
    "INVALID_CREDENTIALS"                    : {code: 0x000C, message: "Invalid credentials", description: "Invalid credentials"},
    "UNAUTHORIZED"                           : {code: 0x000E, message: "Unauthorized", description: "Your credentials are invalid"},
    "PUB_KEY_ALREADY_IN_USE"                 : {code: 0x000F, message: "Pub key already in use", description: "This public key is already in use"},
    "ACCESS_KEY_DOES_NOT_EXIST"              : {code: 0x0010, message: "Access key does not exist", description: "Access key not found"},
    "ACCESS_KEY_ALREADY_IN_USE"              : {code: 0x0011, message: "Access key already in use", description: "This access key is already in use"},
    "ACCESS_DENIED_TO_ACCESS_KEY"            : {code: 0x0012, message: "Access denied to access key", description: "You do not have access to this key"},
    "INSTANCE_DOES_NOT_EXIST"                : {code: 0x0013, message: "Instance does not exist", description: "Instance not found"},
    "ORGANIZATION_DOES_NOT_EXIST"            : {code: 0x0014, message: "Organization does not exist", description: "Organization not found"},
    "SOLUTION_DOES_NOT_EXIST"                : {code: 0x0015, message: "Solution does not exist", description: "Solution not found"},
    "INSTANCE_DOES_NOT_MATCH"                : {code: 0x0016, message: "Instance does not match", description: "Solution instance does not match context instance"},
    "SOLUTION_HAS_CONTEXTS"                  : {code: 0x0017, message: "Solution has contexts", description: "Solution that you wanted to delete has contexts"},
    "CANNOT_ASSIGN_PRIVATE_CONTEXT"          : {code: 0x0018, message: "Cannot assign private context", description: "You cannot add private context to solution"},
    "CANNOT_UNASSIGN_CONTEXT_FROM_ITS_PARENT": {code: 0x0019, message: "Cannot unassign context from its parent", description: "You cannot unassign context from its parent"},
    "CANNOT_SWITCH_CONNECTED_CONTEXT_TO_PRIVATE": {code: 0x001A, message: "Cannot switch connected context to private", description: "You cannot switch context that shares solutions to private"},
    "MAIL_LOG_DOES_NOT_EXIST"                : {code: 0x001E, message: "Mail log does not exist", description: "Mail log does not exist"},
    "MAIL_TEMPLATE_ALREADY_EXISTS"           : {code: 0x001F, message: "Mail template already exists", description: "Mail template like this already exists"},
    "MAIL_TEMPLATE_DOES_NOT_EXIST"           : {code: 0x0020, message: "Mail template does not exist", description: "This mail template was not found"},
    "CANNOT_REMOVE_MAIL_TEMPLATE_LANG"       : {code: 0x0021, message: "Cannot remove mail template lang", description: "You cannot remove language from mail template properties"},
    "MAIL_DOES_NOT_EXIST"                    : {code: 0x0022, message: "Mail does not exist", description: "This mail does not exists"},
    "ACCOUNT_DISABLED"                       : {code: 0x0023, message: "Account disabled", description: "This account is disabled"},
    "TOKEN_DOES_NOT_EXIST"                   : {code: 0x0024, message: "Token does not exist", description: "Token was not found"},
    "ACCOUNT_ALREADY_ACTIVATED"              : {code: 0x0025, message: "Account already activated", description: "Account is already activated"},
    "DEVELOPER_ALREADY_IN_ORGANIZATION"   : {code: 0x0026, message: "User already in organization", description: "User is already part of this organization"},
    "DEVELOPER_NOT_IN_ORGANIZATION"       : {code: 0x0027, message: "User not in organization", description: "User is not part of this organization"},
    "DEVELOPER_ALREADY_HAS_ORGANIZATION"  : {code: 0x0028, message: "User already has organization", description: "User already has his organization"},
    "INVITATION_ALREADY_EXISTS"              : {code: 0x0029, message: "Invitation already exists", description: "Invitation was already sent"},
    "INVITATION_DOES_NOT_EXIST"              : {code: 0x002A, message: "Invitation does not exist", description: "Invitaion was not found"},
    "ACCOUNT_NOT_ACTIVATED_YET"              : {code: 0x002B, message: "Account not activated yet", description: "Account is not acivated yet"},
    "OPEN_REGISTRATION_DISABLED"             : {code: 0x002C, message: "Open registration disabled", description: "You cannot register by yourself, you need invitation"},
    "INSUFFICIENT_ROLE"                      : {code: 0x002D, message: "Insufficient role", description: "You don't have enough rights to requested resource"},
    "INVALID_SECOND_FACTOR_SECRET"           : {code: 0x002E, message: "Invalid second factor secret", description: "Invalid second factor secret code"},
    "CANNOT_SEND_SECOND_FACTOR_CODE"         : {code: 0x002F, message: "Cannot send second factor code", description: "Requirements to send second factor code has not been met"},
    "SECOND_FACTOR_VERIFICATION_FAILED"      : {code: 0x0030, message: "Second factor verification failed", description: "Second factor verfication failed"},
    "SECOND_FACTOR_INVALID_CODE"             : {code: 0x0033, message: "Second factor invalid code", description: "Invalid second factor authorization code"},
    "SECOND_FACTOR_ALREADY_ENABLED"          : {code: 0x0034, message: "Second factor already enabled", description: "Second factor is already enabled on this account"},
    "SECOND_FACTOR_ALREADY_DISABLED"         : {code: 0x0035, message: "Second factor already disabled", description: "Second factor is already disabled on this account"},
    "NOT_IN_SECOND_FACTOR_AUTHORIZATION_MODE": {code: 0x0036, message: "Not in second factor authorization mode", description: "Second factor authorization is disabled on this account"},
    "INVALID_PASSWORD"                       : {code: 0x0037, message: "Invalid Password", description: "Your password is invalid"},
    "EMAIL_DOES_NOT_MATCH_THE_INVITATION"    : {code: 0x0038, message: "Email does not match the invitation", description: "Use email that was used to receive invitation"},
    "SRP_NOT_ENABLED_FOR_THIS_ACCOUNT"       : {code: 0x0039, message: "SRP not enabled for this account", description: "SRP not enabled for this account, to enable it, login with plain password"},
    "AUTHORIZATION_CODE_DOES_NOT_EXIST"      : {code: 0x003A, message: "Authorization code does not exists", description: "Authorization code does not exists or has already expired"},
    "METHOD_CALLABLE_WITH_WEBSOCKET_ONLY"    : {code: 0x003B, message: "Method is callable with websocket only", description: "Method is callable with websocket only"},
    "MANAGE_RESOURCE_ERROR"                  : {code: 0x003C, message: "Manage resource error", description: "Error during managing resource, check additional data to more info"},
    "NO_MATCH_FOR_LAST_ID"                   : {code: 0x003D, message: "No match found for provided last id", description: "Object with last id has not been found, it may have been deleted"},
    "INVALID_EMAIL"                          : {code: 0x003E, message: "Given email is invalid", description: "Given email is invalid"},
    "MAXIMAL_API_USAGE_RESOLUTION_EXCEEDED"  : {code: 0x003F, message: "Maximal api usage resolution exceeded", description: "Maximal resolution is 1000"},
    "LICENSE_DOES_NOT_EXISTS"                : {code: 0x0040, message: "Given license does not exist", description: "This license does not exist"},
    "LICENSE_HAS_EXPIRED"                    : {code: 0x0041, message: "Given license has expired", description: "This license has expired"},
    "LICENSE_NOT_YET_ACTIVATED"              : {code: 0x0042, message: "License not yet activated", description: "License not yet activated"},
    "TOO_MANY_LOGIN_ATTEMPTS"                : {code: 0x0043, message: "Too many login attempts", description: "Too many login attempts"},
    "TOO_MANY_UNSUCCESSFUL_LOGIN_ATTEMPTS"   : {code: 0x0044, message: "Too many unsuccessful login attepmts", description: "Too many unsuccessful login attepmts"},
    "TOO_MANY_TOTP_ATTEMPTS_IN_SHORT_TIME"   : {code: 0x0045, message: "Too many totp attempts", description: "Too many totp attempts"},
    "TOO_MANY_UNSUCCSESSFUL_TOTP_ATTEMPTS"   : {code: 0x0046, message: "Too many unsuccessful totp attempts", description: "Too many unsuccessful totp attempts"},
    "API_KEY_DOES_NOT_EXIST"                 : {code: 0x0047, message: "Api key does not exist", description: "Api key does not exist"},
    "TOO_MANY_API_KEYS"                      : {code: 0x0048, message: "Too many api keys", description: "Too many api keys"},
    "INSUFFICIENT_SCOPE"                     : {code: 0x0049, message: "Inssuficent scope", description: "Inssuficent scope"},
    "SESSION_DOES_NOT_EXIST"                 : {code: 0x004A, message: "Session does not exist or exipred", description: "Session does not exist or expired"},
    "TOKEN_EXPIRED"                          : {code: 0x004B, message: "Token is expired or has been revoked", description: "Token is expired or has been revoked"},
    "INVALID_TOKEN"                          : {code: 0x004C, message: "Token is invalid", description: "Token is invalid"},
    "METHOD_CALLABLE_WITH_SESSION_SCOPED_TOKENS_ONLY" : {code: 0x004D, message: "Method callable with session scoped tokens only", description: "Method callable with session scoped tokens only"},
    "USER_DOES_NOT_EXIST"                    : {code: 0x004E, message: "User does not exist", description: "User with given id does not exist"},
    "NO_KEY_FOR_USER"                        : {code: 0x004F, message: "No key for user", description: "There is no key matching the given userId and the given context"},
    "NO_KEY_FOR_USER_AT_GIVEN_TIME"          : {code: 0x0050, message: "No key for user at given time", description: "There is no key matching given userId and context at given time"},
    "KEY_ALREADY_EXISTS"                     : {code: 0x0051, message: "The key already exists", description: "The key for the given user and the given context already exists"},
    "NO_HOST_BY_GIVEN_INSTANCE_ID"           : {code: 0x0052, message: "No host for given instanceId", description: "There is no host matching the given instanceId"},
    "HOST_URL_ALREADY_EXISTS"                : {code: 0x0053, message: "Host URL already exists.", description: "There is already an entry with the given URL associated to the HostIdentity identified by the given instanceId."},
    "HOST_URL_DOES_NOT_EXIST"                : {code: 0x0054, message: "Host URL does not exist.", description: "There is no entry with the given URL associated to the HostIdentity identified by the given instanceId."},
    "CANNOT_ADD_HOST"                        : {code: 0x0055, message: "Cannot add host.", description: "Cannot add host identity to the PKI."},
    "CANNOT_ADD_URL_TO_THE_HOST"             : {code: 0x0056, message: "Cannot add url to the given host.", description: "Cannot add the URL to the host identity identified by the given instanceId."},
    "CANNOT_FIND_HOST_BY_GIVEN_FILTER"       : {code: 0x0057, message: "Cannot find host by given filter.", description: "Cannot find the host identity by the given filter."},
    "URL_ALREADY_RESERVED"                   : {code: 0x0058, message: "Given URL already reserved.", description: "There is already a HostIdentity with the given URL associated to it."},
    "HOST_IDENTITY_WITH_GIVEN_PUB_KEY_ALREADY_EXISTS" : {code: 0x0059, message: "Host Identity with the given public key already exists.", description: "There is already a Host Identity with the given public key."},
    "CANNOT_REMOVE_URL_FROM_THE_HOST"        : {code: 0x0059, message: "Cannot remove url from the given host.", description: "Cannot remove the URL from the host identity identified by the given instanceId."},
    "FIRST_API_KEY_ALREADY_EXISTS"           : {code: 0x0060, message: "First api key was already created"},
    "INITIALIZATION_TOKEN_MISSMATCH"         : {code: 0x0061, message: "Initialization token is invalid or not set"},
    
};

export const ERROR_CODES: {[name: string]: {code: number, message: string, description: string}} = <any>API_ERROR_CODES;

export type ErrorCode = keyof typeof API_ERROR_CODES;
export class AppException extends Error {
    
    code: number;
    message: string;
    data: any;
    
    constructor(name: ErrorCode, data: any = null) {
        super();
        const e = ERROR_CODES[name];
        if (e) {
            this.message = e.message;
            this.code = e.code;
        }
        else {
            throw new Error(`Invalid error code name '${name}'`);
        }
        this.data = data;
    }
    
    static isValidApiErrorCode(errorName: string): errorName is ErrorCode {
        return errorName in ERROR_CODES;
    }
    
    static is(e: any, errorName: ErrorCode): e is AppException {
        return e instanceof AppException && e.code == API_ERROR_CODES[errorName].code;
    }
}
