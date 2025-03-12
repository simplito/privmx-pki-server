export const HTTP_CLIENT_ERRORS = {
    "BAD_REQUEST": {status: 400, body: "Bad Request"},
    "UNAUTHORIZED": {status: 401, body: "Unauthorized"},
    "PAYMENT_REQUIRED": {status: 402, body: "Payment Required"},
    "FORBIDDEN": {status: 403, body: "Forbidden"},
    "NOT_FOUND": {status: 404, body: "Not Found"},
    "METHOD_NOT_ALLOWED": {status: 405, body: "Method Not Allowed"},
    "NOT_ACCEPTABLE": {status: 406, body: "Not Acceptable"},
    "PROXY_AUTHENTICATION_REQUIRED": {status: 407, body: "Proxy Authentication Required"},
    "REQUEST_TIMEOUT": {status: 408, body: "Request Timeout"},
    "CONFLICT": {status: 409, body: "Conflict"},
    "GONE": {status: 410, body: "Gone"},
    "LENGTH_REQUIRED": {status: 411, body: "Length Required"},
    "PRECONDITION_FAILED": {status: 412, body: "Precondition Failed"},
    "PAYLOAD_TOO_LARGE": {status: 413, body: "Payload Too Large"},
    "URI_TOO_LONG": {status: 414, body: "URI Too Long"},
    "UNSUPPORTED_MEDIA_TYPE": {status: 415, body: "Unsupported Media Type"},
    "RANGE_NOT_SATISFIABLE": {status: 416, body: "Range Not Satisfiable"},
    "EXPECTATION_FAILED": {status: 417, body: "Expectation Failed"},
    "IM_A_TEAPOT": {status: 418, body: "I'm a teapot"}, // Defined in RFC 2324
    "MISDIRECTED_REQUEST": {status: 421, body: "Misdirected Request"},
    "UNPROCESSABLE_ENTITY": {status: 422, body: "Unprocessable Entity"},
    "LOCKED": {status: 423, body: "Locked"},
    "FAILED_DEPENDENCY": {status: 424, body: "Failed Dependency"},
    "TOO_EARLY": {status: 425, body: "Too Early"},
    "UPGRADE_REQUIRED": {status: 426, body: "Upgrade Required"},
    "PRECONDITION_REQUIRED": {status: 428, body: "Precondition Required"},
    "TOO_MANY_REQUESTS": {status: 429, body: "Too Many Requests"},
    "REQUEST_HEADER_FIELDS_TOO_LARGE": {status: 431, body: "Request Header Fields Too Large"},
    "UNAVAILABLE_FOR_LEGAL_REASONS": {status: 451, body: "Unavailable For Legal Reasons"},
};
export type HttpClientErrorCode = keyof typeof HTTP_CLIENT_ERRORS;

export class HttpClientError extends Error {
    
    readonly status: number;
    readonly data: string;
    
    constructor(
        public code: HttpClientErrorCode,
        data?: string,
    ) {
        super();
        const e = HTTP_CLIENT_ERRORS[code];
        if (e) {
            this.data = (data) ? data : e.body;
            this.status = e.status;
        }
        else {
            throw new Error(`Invalid error code '${code}'`);
        }
    }
}
