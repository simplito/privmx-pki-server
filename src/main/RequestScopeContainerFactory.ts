import { HttpRequest, WebSocketInfo } from "../CommonTypes";
import { Container } from "./Container";
import { RequestScopeContainer } from "./RequestScopeContainer";
import * as http from "http";

export class RequestScopeContainerFactory {
    
    constructor(
        private container: Container,
    ) {
    }
    
    createRequestScopeContainer(request: HttpRequest, response: http.ServerResponse, webSocketInfo: WebSocketInfo|null): RequestScopeContainer {
        return this.container.createEx(RequestScopeContainer, {container: this.container, request: request, response: response, webSocketInfo: webSocketInfo});
    }
}
