import * as nodemailer from "nodemailer";
import * as SMTPTransport from "nodemailer/lib/smtp-transport";
import { ConfigService } from "../ConfigService";

export interface MailSender {
    send(options: nodemailer.SendMailOptions): Promise<any>;
}

export class NodeMailerMailSender implements MailSender {
    
    constructor(
        private configService: ConfigService,
    ) {
    }
    
    send(options: nodemailer.SendMailOptions) {
        const mailConfig = this.configService.values.mail;
        const smOptions: SMTPTransport.Options = {
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.secure,
            requireTLS: mailConfig.requireTLS,
            ignoreTLS: mailConfig.ignoreTLS,
        };
        if (mailConfig.auth) {
            smOptions.auth = {
                user: mailConfig.user,
                pass: mailConfig.pass,
            };
        }
        if (mailConfig.checkCert === false) {
            smOptions.tls = {
                rejectUnauthorized: false,
            };
        }
        const transporter = nodemailer.createTransport(smOptions);
        return transporter.sendMail(options);
    }
}
