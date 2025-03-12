import { Validator } from "adv-validator/out/Types";
import { ErrorCode } from "../api/AppException";

export interface Api {
    name: string;
    prefix: string;
    methods: {[name: string]: ApiMethod};
}

export interface ApiMethod {
    name: string;
    fullName: string;
    description: string;
    parameters: {[name: string]: PropertyDeclaration};
    returns: ReturnedType;
    errors: ErrorCode[];
    exampleParameters: any;
    exampleResult: any;
    scope: string[];
    secondFactorRequired: boolean;
}

export type Type = PrimitiveType|LiteralType|ObjectType|ArrayType|NullableType|UnionType|EnumType|TypeDeclarationType;

export interface EnumType {
    kind: "enum";
    type: "number"|"string"|"boolean"|"unknown";
    parent?: string;
    values: any[];
    validator?: Validator
}
export interface PrimitiveType {
    kind: "primitive";
    type: "number"|"string"|"boolean"|"unknown";
    parent?: string;
    validator?: Validator
}

export interface LiteralType {
    kind: "literal";
    type: "number"|"string"|"boolean"|"null";
    parent?: string;
    value: any;
    validator?: Validator
}

export interface TypeDeclarationType {
    kind: "typeDeclaration";
    parent?: string;
    validator?: Validator;
}
export interface ObjectType {
    kind: "object";
    name: string;
    description: string;
    properties: {[name: string]: PropertyDeclaration};
    validator?: Validator
    parent?: string;
}

export interface PropertyDeclaration {
    name: string;
    description: string;
    map?: Type;
    type: Type;
    optional: boolean;
}

export interface ArrayType {
    kind: "array";
    type: Type;
    validator?: Validator
    parent?: string;
}

export interface NullableType {
    kind: "nullable";
    type: Type;
    validator?: Validator
    parent?: string;
}

export interface UnionType {
    kind: "union";
    types: Type[];
    validator?: Validator
    parent?: string;
}

export interface ReturnedType {
    description: string;
    type: Type;
}

export interface ErrorWithDescription {
    code: number,
    message: string,
    description: string
}

export interface HttpErrorCode {
    errorCode: string,
    message: string,
    description: string
}

export interface JsonRpcErrorCodes {
    [name: string]: {
        code: number;
        message: string;
        description: string;
    };
}

export interface JsonDocs {
    errorsWithDescription: ErrorWithDescription[],
    apis: {[name: string]: Api},
    httpErrorCodes: HttpErrorCode[],
    jsonRpcErrors: JsonRpcErrorCodes,
}