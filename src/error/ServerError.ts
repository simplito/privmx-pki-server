export class ServerError extends Error {
    
    constructor(message: string, public data?: unknown) {
        super(message);
    }
}
