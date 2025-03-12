import { ApiMethod } from "../../../api/Decorators";
import { Logger } from "../../../utils/Logger";
import { IpcService } from "../Decorators";

@IpcService
export class ExampleService {
    
    constructor(
        private logger: Logger,
    ) {
    }
    
    @ApiMethod({})
    async foo() {
        this.logger.log("foo");
        return "foo";
    }
    
    @ApiMethod({})
    async bar() {
        this.logger.log("foo");
        return "bar";
    }
}
