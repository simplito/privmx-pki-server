import * as http from "http";
import * as https from "https";
import * as urlModule from "url";
import { PromiseUtils } from "adv-promise";

export interface RequestOptions {
    method?: string;
    url: string;
    port?: number;
    host?: string;
    headers?: RequestHeaders;
    body?: Buffer;
}

export type RequestHeaders = {[name: string]: string|string[]};

export interface RequestResponse {
    status: number;
    body: Buffer;
    headers: {[header: string]: string[]|undefined};
}

export class HttpClient {
    
    static request(options: RequestOptions): Promise<RequestResponse> {
        const defer = PromiseUtils.defer<RequestResponse>();
        try {
            const parsedUrl = urlModule.parse(options.url);
            const reqeustOptions: http.RequestOptions = {
                host: options.host || parsedUrl.hostname,
                port: options.port || parsedUrl.port || (parsedUrl.protocol == "https:" ? 443 : 80),
                path: parsedUrl.path,
                method: options.method,
                headers: {...(options.headers || {}), host: parsedUrl.host as string},
            };
            const callback = (msg: http.IncomingMessage) => {
                const chunks: Buffer[] = [];
                msg.on("data", (chunk: Buffer) => {
                    chunks.push(chunk);
                });
                msg.on("end", () => {
                    const body = Buffer.concat(chunks);
                    defer.resolve({
                        status: msg.statusCode as number,
                        headers: msg.headersDistinct,
                        body: body,
                    });
                });
                msg.on("error", e => {
                    defer.reject(e);
                });
            };
            let request: http.ClientRequest;
            if (parsedUrl.protocol == "https:") {
                request = https.request(reqeustOptions, callback);
            }
            else {
                request = http.request(reqeustOptions, callback);
            }
            request.on("error", e => {
                defer.reject(e);
            });
            if (options.body) {
                request.write(options.body);
            }
            request.end();
        }
        catch (e) {
            defer.reject(e);
        }
        return defer.promise;
    }
}
