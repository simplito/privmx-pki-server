export class DbInconsistencyError extends Error {
    
    constructor(message: string, public data?: unknown) {
        super(message);
    }
}
