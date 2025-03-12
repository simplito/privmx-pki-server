import * as types from "../../types";
import * as db from "../../db/Model";
import { ConfigService } from "../ConfigService";
import { Logger } from "../../utils/Logger";
import { MailLogRepository } from "./MailLogRepository";
import { DateUtils } from "../../utils/DateUtils";
import { MailTemplateRepository } from "./MailTemplateRepository";
import { AppException } from "../../api/AppException";
import { MailSender } from "./NodeMailerMailSender";
import { Utils } from "../../utils/Utils";
import { HtmlRenderer } from "../HtmlRenderer";
import { UrlService } from "../UrlService";
import { BaseRepository } from "../BaseRepository";

export interface SendMailResult {
    result: boolean;
    mailLog: db.MailLog;
}

export interface TemplateProvider {
    getTemplate(templateName: string): Promise<string>;
    getLayout(layoutName: string): Promise<string>
}

export class MailService {
    
    protected logger: Logger;
    
    constructor(
        private configService: ConfigService,
        private urlService: UrlService,
        private mailLogRepository: MailLogRepository|null,
        private mailTemplateRepository: MailTemplateRepository,
        private mailSender: MailSender,
        private htmlRenderer: HtmlRenderer,
    ) {
        this.logger = Logger.create(this);
    }
    
    protected async getTemplateHtml(viewName: string, lang: types.core.Language): Promise<string> {
        const mailTemplate = await this.mailTemplateRepository.get(<types.mail.MailId>viewName);
        if (mailTemplate == null) {
            throw new AppException("MAIL_TEMPLATE_DOES_NOT_EXIST", viewName);
        }
        if (lang in mailTemplate.html) {
            return mailTemplate.html[lang];
        }
        if (this.configService.values.defaultMailLanguage in mailTemplate.html) {
            return mailTemplate.html[this.configService.values.defaultMailLanguage];
        }
        const keys = Object.keys(mailTemplate.html);
        if (keys.length == 0) {
            throw new Error("Empty mailTemplate html for id='" + viewName + "'");
        }
        return mailTemplate.html[keys[0]];
    }
    
    async render(viewName: string, language: types.core.Language, model: any, context?: any): Promise<{html: string, subject: string, from?: string}> {
        return this.renderView({
            getTemplate: (templateName) => this.getTemplateHtml(templateName, language),
            getLayout: (layoutName) => this.getTemplateHtml(`layout/${layoutName}`, language),
        }, viewName, model, context);
    }
    
    private async renderView(templateProvider: TemplateProvider, viewName: string, model: any, context?: any): Promise<{html: string, subject: string, from?: string}> {
        const viewBag: {layout?: string, subject: string, from?: string} = {subject: ""};
        const templateHtml = await templateProvider.getTemplate(viewName);
        const bodyHtml = this.htmlRenderer.renderFromTemplate(templateHtml, model, context, viewBag);
        const decorateWithLayout = async (currentHtml: string): Promise<string> => {
            if (typeof(viewBag.layout) === "undefined") {
                return currentHtml;
            }
            const layoutTemplate = await templateProvider.getLayout(viewBag.layout);
            delete viewBag.layout;
            return decorateWithLayout(this.htmlRenderer.renderFromTemplate(layoutTemplate, {body: bodyHtml}, context, viewBag));
        };
        const html = await decorateWithLayout(bodyHtml);
        return {html: html, subject: viewBag.subject, from: viewBag.from};
    }
    
    async sendExPromise(options: types.mail.SendExOptions): Promise<SendMailResult> {
        const startDate = DateUtils.now();
        const logId = this.mailLogRepository ? this.mailLogRepository.generateId() : "fake-log-id" as types.mail.MailLogId;
        const {sendingOptions, sendMailResult, error} = await this.trySend(options, logId);
        const result = sendMailResult != null;
        const endDate = DateUtils.now();
        const mailLog: db.MailLog = {
            _id: logId,
            created: endDate,
            startDate: startDate,
            endDate: endDate,
            options: options,
            sendingOptions: sendingOptions,
            sendMailResult: sendMailResult,
            bounced: null,
            error: error ? "" + error.message : null,
            searchable: BaseRepository.normalizeStrings(options.email, options.name),
        };
        if (this.mailLogRepository == null) {
            return {
                result: result,
                mailLog: mailLog,
            };
        }
        try {
            await this.mailLogRepository.create(mailLog);
        }
        catch (e) {
            this.logger.error("Error during creating mailLog for " + options.name + " mail to " + options.email, e);
        }
        return {
            result: result,
            mailLog: mailLog,
        };
    }
    
    private async trySend(options: types.mail.SendExOptions, logId: types.mail.MailLogId): Promise<{sendingOptions: types.mail.SendMailOptions|null; sendMailResult: any; error: any;}> {
        const renderResult = await this.tryRenderTemplate(options);
        if (renderResult.success == false) {
            this.logger.error("Cannot render template during sending " + options.name + " mail to " + options.email, renderResult.error);
            return {sendingOptions: null, sendMailResult: null, error: renderResult.error};
        }
        const sendingOptions = {
            from: this.configService.values.mail.from,
            to: options.email,
            subject: renderResult.result.subject,
            html: renderResult.result.html,
            envelope: {
                from: this.configService.values.mail.returnPath.replace("{id}", logId),
                to: options.email,
            },
        };
        try {
            this.logger.info("Sending " + options.name + " mail to " + options.email);
            const sendMailResult = await this.mailSender.send(sendingOptions);
            return {sendingOptions, sendMailResult, error: null};
        }
        catch (e) {
            this.logger.error("Error during sending " + options.name + " mail to " + options.email, e);
            return {sendingOptions, sendMailResult: null, error: e};
        }
    }
    
    private async tryRenderTemplate(options: types.mail.SendExOptions) {
        return Utils.tryPromise(() => this.render(options.template, options.model.lang, options.model));
    }
    
    sendEx(options: types.mail.SendExOptions) {
        return {
            promise: this.sendExPromise(options),
        };
    }
    
    sendSecondFactorCodeMail(lang: types.core.Language, email: types.core.LEmail, code: types.core.SecondFactorAuthorizationCode) {
        return this.sendEx({
            email: email,
            template: "secondFactorCode",
            model: {lang: lang, code: code},
            name: "second factor authorization",
        });
    }
    
    sendEmailVerificationMail(lang: types.core.Language, email: types.core.LEmail, token: types.core.TokenId) {
        return this.sendEx({
            email: email,
            template: "emailVerification",
            model: {lang: lang, token: token, link: this.urlService.createEmailVerificationLink(token)},
            name: "email verification",
        });
    }
    
    sendPasswordChangeMail(lang: types.core.Language, email: types.core.LEmail, passwordChangeToken: types.core.TokenId) {
        return this.sendEx({
            email: email,
            template: "passwordChange",
            model: {lang: lang, link: this.urlService.createPasswordChangeLink(passwordChangeToken)},
            name: "Webapp - change of password",
        });
    }
    
    sendPossbileUnauthorizedLoginWarning(lang: types.core.Language, email: types.core.LEmail) {
        return this.sendEx({
            email: email,
            template: "unauthorizedLoginWarning",
            model: {lang: lang, date: new Date().toUTCString()},
            name: "Possibility of unauthorized login attempt",
        });
    }
}
