import * as AdvTemplate from "adv-template";
import { Utils } from "../utils/Utils";
import { Logger } from "../utils/Logger";
import { ConfigService } from "./ConfigService";
import { MailSender } from "./mail/NodeMailerMailSender";

export class ErrorService {
    
    protected logger: Logger;
    
    constructor(
        private configService: ConfigService,
        private mailSender: MailSender,
    ) {
        this.logger = Logger.create(this);
    }
    
    sendErrorMail(rayId: string, error: unknown) {
        const helper = new AdvTemplate.Helper();
        const esc = (x: unknown) => helper.escapeHtml("" + x);
        const date = new Date().toISOString();
        const renderResult = Utils.try(() => {
            return `
<html>
<head><meta charset="utf-8"/></head>
<body>
    <h2>Error in Webapp Template</h2>
    <p><b>Instance:</b> ${esc(this.configService.values.instanceName)}</p>
    <p><b>Date:</b> ${esc(date)}</p>
    <p><b>RayId:</b> ${esc(rayId)}</p>
    <p><b>Error:</b> type=${esc(typeof(error))} value=${esc("" + error)}</p>
    ${error && typeof(error) === "object" ? `
    <p><b>Name:</b> ${esc(error.constructor.name)}</p>
    ${"message" in error && typeof(error.message) === "string" ? `<p><b>Message:</b> ${esc(error.message)}</p>` : ""}
    ${"stack" in error && typeof(error.stack) === "string" ? `<p><b>Stack:</b> ${helper.text(error.stack)}</p>` : ""}
    ${Object.keys(error).map(x => {
        const value = (error as any)[x];
        const stringifyResult = Utils.try(() => JSON.stringify(value));
        return `<p><b>Property "${esc(x)}":</b> type=${esc(typeof(value))} value=${stringifyResult.success === true ? esc(stringifyResult.result) : "---error during JSON stringify---"}</p>`;
    }).join("\n")}
    ` : ""}
</body>
</html>`;
        });
        if (renderResult.success === true) {
            this.sendErrorMailHtml(rayId, renderResult.result);
        }
        else {
            this.logger.error(`Error during rendering error mail RayId=${rayId}`, renderResult.error);
            this.sendErrorMailHtml(rayId, `
<html>
<head><meta charset="utf-8"/></head>
<body>
    <h2>Error in WebApp Template</h2>
    <p><b>Instance:</b> ${esc(this.configService.values.instanceName)}</p>
    <p><b>Date:</b> ${esc(date)}</p>
    <p><b>RayId:</b> ${esc(rayId)}</p>
    <p><b>Error:</b> Error during rendering error mail</p>
</body>
</html>`);
        }
    }
    
    private sendErrorMailHtml(rayId: string, html: string) {
        void (async () => {
            try {
                await this.mailSender.send({
                    from: this.configService.values.mail.from,
                    to: this.configService.values.errorMailRecipent,
                    subject: `Error in Webapp Template - RayId=${rayId}`,
                    html: html,
                });
                this.logger.info(`Successfully send error mail RayId=${rayId} To=${this.configService.values.errorMailRecipent}`);
            }
            catch (e) {
                this.logger.error(`Error during sending error mail RayId=${rayId} To=${this.configService.values.errorMailRecipent}`, e);
            }
        })();
    }
}
