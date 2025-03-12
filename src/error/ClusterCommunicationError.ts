export class ClusterCommunicationError extends Error {
    
    constructor(message: string, public data?: unknown) {
        super(message);
    }
}
