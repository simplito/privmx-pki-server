export class ResponseHeadersHolder {
    
    private responseHeaders: {[headerName: string]: string[]} = {};
    
    getResponseHeaders() {
        return this.responseHeaders;
    }
    
    addResponseHeader(headerName: string, headerValue: string) {
        if (!this.responseHeaders[headerName]) {
            this.responseHeaders[headerName] = [];
        }
        this.responseHeaders[headerName].push(headerValue);
    }
    
    setSecureCookie(cookieName: string, cookieValue: string) {
        const cookie = `${cookieName}=${cookieValue}; Path=/; Secure; HttpOnly`;
        this.addResponseHeader("Set-Cookie", cookie);
    }
}
