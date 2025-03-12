import { HttpRequest, ServerResponse } from "../CommonTypes";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import * as mime from "mime";

export async function serveAssets(dir: string, req: HttpRequest, res: http.ServerResponse): Promise<ServerResponse> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = url.pathname || "/";
    const subPath = pathname.substring(1);
    
    if (pathname.includes("..") || !pathname.startsWith("/") || subPath.startsWith("/")) {
        return {status: 404, body: "404 Not found"};
    }
    const filePath = path.resolve(dir, subPath);
    
    const theFilePath = tryFindFile(filePath);
    if (!theFilePath) {
        return {status: 404, body: "404 Not found"};
    }
    
    const stats = await fs.promises.stat(theFilePath);
    const date = stats.mtime;
    
    const lastModified = date.toUTCString();
    const etag = "W/\"" + date.getTime().toString() + "\"";
    
    if (req.headers["if-modified-since"] === lastModified || req.headers["if-none-match"] === etag) {
        return {
            status: 304,
            headers: {
                "ETag": etag,
                "Last-Modified": lastModified,
            },
            body: "",
        };
    }
    
    const parsedPath = path.parse(theFilePath);
    res.writeHead(200, {
        "Content-Type": mime.getType(parsedPath.ext) || "application/octet-stream",
        "Content-Length": stats.size,
        "Cache-Control": "public, max-age=0",
        "ETag": etag,
        "Last-Modified": lastModified,
    });
    fs.createReadStream(theFilePath).pipe(res);
    return {body: true};
}

function tryFindFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
        return filePath;
    }
    if (stat.isDirectory()) {
        return tryFindFile(path.resolve(filePath, "index.html"));
    }
    return null;
}
