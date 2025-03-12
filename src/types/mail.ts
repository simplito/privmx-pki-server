import * as types from "./";

export type MailId = string&{__mailId: never};
export type MailLogId = string&{__mailLogId: never};
export type MailName = string&{__mainName: never};
export type MailTemplateHtml = string&{__mailTemplateHtml: never};

export interface SendMailOptions {
    /** mail author */
    from: string;
    /** mail recipent */
    to: string;
    /** mail subject */
    subject: string;
    /** mail body */
    html: string;
    /** mail headers */
    headers?: any;
    /** return path */
    envelope?: {
        /** mail author */
        from?: string;
        /** mail recipent */
        to?: string;
    };
}

export interface SendExOptions {
    /** mail recipent */
    email: string;
    /** mail name */
    name: string;
    /** mail template */
    template: string;
    /** mail template model */
    model: {
        /** mail language */
        lang: types.core.Language;
        /** additional data */
        [key: string]: any;
    };
}
