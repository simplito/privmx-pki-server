import { HttpRequest } from "../CommonTypes";
import * as types from "../types";
import { Utils } from "./Utils";

interface HttpRequestX extends HttpRequest {
    readBodyPromise?: Promise<Buffer>;
}

export class HttpUtils {
    
    static readBody(request: HttpRequest) {
        const requestX = request as HttpRequestX;
        if (requestX.readBodyPromise) {
            return requestX.readBodyPromise;
        }
        return requestX.readBodyPromise = new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            request.on("data", (chunk) => {
                chunks.push(chunk as Buffer);
            });
            request.on("error", (e) => {
                reject(e);
            });
            request.on("end", () => {
                resolve(Buffer.concat(chunks));
            });
        });
    }
    
    static getFirstHeaderValue<T = string>(request: HttpRequest, headerName: string): T|null {
        const header = request.headers[headerName];
        if (!header) {
            return null;
        }
        return Array.isArray(header) ? header[0] as T : header as T;
    }
    
    static getCookies(request: HttpRequest) {
        const cookie = request.headers.cookie || "";
        return cookie.split(";").map(x => x.split("=")).filter(x => x.length === 2).map(x => ({name: x[0].trim(), value: x[1].trim()}));
    }
    
    static getIpAddress(request: HttpRequest, headerName?: string) {
        const fromHeader = headerName ? request.headers[headerName] : null;
        return (fromHeader ? fromHeader : request.socket.remoteAddress) as types.core.IpAddress;
    }
    
    static parseHttpBasicData(data: string) {
        const credentials = Utils.try(() => atob(data));
        if (credentials.success === false) {
            return null;
        }
        const args = credentials.result.split(":");
        if (args.length !== 2) {
            return null;
        }
        const [user, password] = args;
        return {user, password};
    }
    
    static parseAuthorizationHeader(authorizationHeader: string) {
        if (!authorizationHeader) {
            return null;
        }
        const values = authorizationHeader.split(" ");
        return values.length == 2 ? {method: values[0], data: values[1]} : null;
    }
    
    static parseHttpBasicAuthorizationHeader(authorizationHeader: string) {
        const auth = HttpUtils.parseAuthorizationHeader(authorizationHeader);
        return auth && auth.method === "Basic" && auth.data ? HttpUtils.parseHttpBasicData(auth.data) : null;
    }
    
    static parseHttpBasicDataAsClientCredentials(data: string) {
        const credentials = HttpUtils.parseHttpBasicData(data);
        if (!credentials) {
            return null;
        }
        return {clientId: credentials.user as types.auth.ClientId, clientSecret: credentials.password as types.auth.ClientSecret};
    }
    
    static parseHttpAuthorizationHeaderAsClientCredentials(authorizationHeader: string) {
        const credentials = HttpUtils.parseHttpBasicAuthorizationHeader(authorizationHeader);
        if (!credentials) {
            return null;
        }
        return {clientId: credentials.user as types.auth.ClientId, clientSecret: credentials.password as types.auth.ClientSecret};
    }
}
