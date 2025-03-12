import assert from "assert";
import "q2-test";
import { MailValidator } from "../service/mail/MailValidator";
import * as types from "../types";
import { Utils } from "../utils/Utils";
import { TestUtils } from "./unitTestUtils";
import { DnsService } from "../service/DnsService";

function createDnsServiceMock() {
    return TestUtils.createMock<DnsService>({
        hasMxRecords: mockFn((domain: string) => {
            return domain === "gmail.com";
        }),
    });
}

it("MailValidatorDNSCheckValid", async () => {
    const validator = new MailValidator(createDnsServiceMock());
    const result = await Utils.tryPromise( () => validator.validateEmail("a@gmail.com" as types.core.Email));
    assert(result.success === true, "expected value: true");
});

it("MailValidatorBlackListCheck", async () => {
    const validator = new MailValidator(createDnsServiceMock());
    validator.setBlacklist(["gmail.com"]);
    const result = await Utils.tryPromise( () => validator.validateEmail("a@gmail.com" as types.core.Email));
    assert(result.success === false, "expected value: false");
});

it("MailValidatorDNSCheckInvalid", async () => {
    const validator = new MailValidator(createDnsServiceMock());
    const result = await Utils.tryPromise( () => validator.validateEmail("a@example.com" as types.core.Email));
    assert(result.success === false, "expected value: false");
});

it("MailValidatorWhiteListCheck", async () => {
    const validator = new MailValidator(createDnsServiceMock());
    validator.setWhitelist(["example.com"]);
    const result = await Utils.tryPromise( () => validator.validateEmail("a@example.com" as types.core.Email));
    assert(result.success === true, "expected value: true");
});
