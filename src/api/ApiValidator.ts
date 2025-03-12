import * as AdvValidator from "adv-validator";
import { AppException } from "./AppException";
import FieldValidator = AdvValidator.Types.Validator;
import * as base58check from "bs58check";
import { Utils } from "../utils/Utils";
import { ObjectValidator } from "adv-validator/out/Types";
import { Crypto } from "../utils/Crypto";

export abstract class ApiValidator implements AdvValidator.Types.PerNameValidator {
    
    protected checker: AdvValidator.ValidatorChecker;
    protected builder: AdvValidator.ValidatorBuilder;
    protected methods: Map<string, AdvValidator.Types.Validator>;
    
    // core
    protected id: FieldValidator;
    protected hexadecimal: FieldValidator;
    protected eccPub: FieldValidator;
    protected email: FieldValidator;
    protected url: FieldValidator;
    protected password: FieldValidator;
    protected pubKey: FieldValidator;
    protected nameString: FieldValidator;
    protected uint: FieldValidator;
    protected srpGroup: FieldValidator;
    protected ip: FieldValidator;
    protected timestamp: FieldValidator;
    protected nonce: FieldValidator;
    protected pmxHmacSha256Signature: FieldValidator;
    
    // common
    protected contextId: FieldValidator;
    protected userId: FieldValidator;
    protected contextUserId: FieldValidator;
    protected instanceId: FieldValidator;
    protected instanceName: FieldValidator;
    protected solutionId: FieldValidator;
    protected solutionName: FieldValidator;
    protected organizationId: FieldValidator;
    protected organizationName: FieldValidator;
    protected webpage: FieldValidator;
    protected accessPubKey: FieldValidator;
    protected mailId: FieldValidator;
    protected mailLogId: FieldValidator;
    protected language: FieldValidator;
    protected mailHtml: FieldValidator;
    protected tokenId: FieldValidator;
    protected threadId: FieldValidator;
    protected threadMessageId: FieldValidator;
    protected storeId: FieldValidator;
    protected storeFileId: FieldValidator;
    protected inboxId: FieldValidator;
    protected streamRoomId: FieldValidator;
    protected userRole: FieldValidator;
    protected userRoles: FieldValidator;
    protected secondFactorAuthorizationCode: FieldValidator;
    protected channel: FieldValidator;
    protected licenseId: FieldValidator;
    protected licenseOrderInfo: FieldValidator;
    protected licenseProperties: FieldValidator;
    protected oauth2Token: FieldValidator;
    protected apiKeyId: FieldValidator;
    protected apiKeySecret: FieldValidator;
    protected apiKeyName: FieldValidator;
    protected scope: FieldValidator;
    protected scopeList: FieldValidator;
    protected sessionName: FieldValidator;
    protected ed25519PemPublicKey: FieldValidator;
    
    protected listModel: ObjectValidator;
    
    constructor() {
        this.checker = new AdvValidator.ValidatorChecker();
        this.builder = new AdvValidator.ValidatorBuilder();
        this.methods = new Map();
        this.hexadecimal = this.builder.createCustom((value) => {
            if (typeof(value) !== "string") {
                throw new Error("Expected string");
            }
            const hexRegex = /^[0-9a-fA-F]+$/;
            if (!hexRegex.test(value)) {
                throw new Error("Expected hexadecimal number");
            };
        });
        this.eccPub = this.builder.createCustom((value) => {
            if (typeof(value) !== "string") {
                throw new Error("Expected string");
            }
            const result = Utils.try(() => base58check.decode(value));
            if (result.success === false || result.result.length === 0) {
                throw new Error("Expected base58 string");
            }
            if (result.result.length !== 33) {
                throw new Error("Invalid Ecc public key " + result.result.length);
            }
        });
        this.ip = this.builder.createCustom((value) => {
            if (typeof(value) !== "string") {
                throw new Error("Expected string");
            }
            if (value === "::1") {
                return;
            }
            const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})$/;
            const ipv6Regex = /^((?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|((?:[a-fA-F0-9]{1,4}:){1,7}|:):((?:[a-fA-F0-9]{1,4}:){1,7}|:))$/;
            const ipRegex = new RegExp(`^(${ipv4Regex.source})|(${ipv6Regex.source})$`);
            if (!ipRegex.test(value)) {
                throw new Error("Expected ipv4 or ipv6 address");
            }
        });
        this.srpGroup = this.builder.createEnum(["the1024bit", "the1536bit", "the2048bit", "the3072bit", "the4096bit", "the6144bit", "the8192bit"]);
        this.uint = this.builder.min(this.builder.int, 0);
        this.email = this.builder.email;
        this.url = this.builder.rangeLength(this.builder.string, 3, 2048);
        this.password = this.builder.rangeLength(this.builder.string, 3, 64);
        this.pubKey = this.eccPub;
        this.id = this.builder.rangeLength(this.builder.string, 3, 128);
        this.nameString = this.builder.rangeLength(this.builder.string, 1, 256);
        this.contextId = this.id;
        this.userId = this.id;
        this.contextUserId = this.builder.rangeLength(this.builder.string, 1, 128);
        this.instanceId = this.id;
        this.instanceName = this.nameString;
        this.solutionId = this.id;
        this.solutionName = this.nameString;
        this.organizationId = this.id;
        this.accessPubKey = this.eccPub;
        this.organizationName = this.builder.rangeLength(this.builder.string, 2, 128);
        this.webpage = this.builder.rangeLength(this.builder.string, 0, 256);
        this.mailId = this.id;
        this.mailLogId = this.id;
        this.mailHtml = this.builder.rangeLength(this.builder.string, 0, 32768);
        this.language = this.builder.length(this.builder.string, 2);
        this.tokenId = this.id;
        this.threadId = this.id;
        this.threadMessageId = this.id;;
        this.storeId = this.id;
        this.storeFileId = this.id;
        this.inboxId = this.id;
        this.streamRoomId = this.id;
        this.userRole = this.builder.createEnum(["owner"]);
        this.userRoles = this.builder.createListWithMaxLength(this.userRole, 128);
        this.secondFactorAuthorizationCode = this.builder.rangeLength(this.builder.string, 1, 10);
        this.channel = this.builder.maxLength(this.builder.string, 128);
        this.licenseId = this.id;
        this.licenseProperties = this.builder.createMap(this.builder.maxLength(this.builder.string, 128), this.builder.maxLength(this.builder.string, 1024));
        this.oauth2Token = this.builder.maxLength(this.builder.string, 1024);
        this.apiKeyId = this.id;
        this.apiKeySecret = this.builder.rangeLength(this.builder.string, 32, 256);
        this.apiKeyName = this.builder.maxLength(this.builder.string, 128);
        this.scope = this.builder.maxLength(this.builder.string, 128);
        this.scopeList = this.builder.createListWithMaxLength(this.scope, 128);
        this.timestamp = this.uint;
        this.nonce = this.builder.maxLength(this.builder.string, 64);
        this.pmxHmacSha256Signature = this.builder.maxLength(this.builder.string, 4096);
        this.sessionName = this.builder.maxLength(this.builder.string, 128);
        this.licenseOrderInfo = this.builder.maxLength(this.builder.string, 8192);
        this.ed25519PemPublicKey = this.builder.createCustom(value => {
            if (typeof(value) !== "string") {
                throw new Error("Expected string");
            }
            if (!Crypto.isEd25519PEMPublicKey(value)) {
                throw new Error("Not ed25519 PEM public key");
            }
        });
        
        this.listModel = this.builder.createObject({
            skip: this.uint,
            limit: this.builder.range(this.uint, 1, 100),
            sortOrder: this.builder.createEnum(["asc", "desc"]),
            query: this.builder.optional(this.builder.maxLength(this.builder.string, 128)),
            lastId: this.builder.optional(this.builder.maxLength(this.builder.string, 128)),
        });
    }
    
    registerMethod(method: string, validator: AdvValidator.Types.Validator) {
        if (this.methods.has(method)) {
            throw new Error(`Method '${method}' already registered`);
        }
        this.methods.set(method, validator);
    }
    
    validate(method: string, data: any): void {
        const validator = this.getValidator(method);
        try {
            return this.checker.validateValue(data, validator);
        }
        catch (e) {
            const errorName = AdvValidator.ValidatorException.getErrorNameFromException(e);
            const errorData = e ? (<{message: string}>e).message : "";
            throw new AppException(AppException.isValidApiErrorCode(errorName) ? errorName : "INTERNAL_ERROR", errorData);
        }
    }
    
    getValidator(method: string) {
        const validator = this.methods.get(method);
        if (validator == null) {
            throw new Error(`Cannot find validator for method '${method}'`);
        }
        return validator;
    }
}
