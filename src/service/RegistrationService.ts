import { AppException } from "../api/AppException";
import * as types from "../types";
import { MongoUtils } from "../db/MongoUtils";
import * as db from "../db/Model";
import { MailService } from "./mail/MailService";
import { TokenRepository } from "./TokenRepository";
import { ConfigService } from "./ConfigService";
import * as mongodb from "mongodb";
import { MongoDbManager } from "../db/MongoDbManager";
import { SrpAuthenticationService } from "../service/SrpAuthenticationService";
import { UserRepository } from "./UserRepository";

export interface CreateUserOptions {
    email: types.core.LEmail;
    credentials: types.core.PlainPassword|db.SrpCredentials;
    activated: boolean;
}

export class RegistrationService {
    
    constructor(
        private userRepository: UserRepository,
        private tokenRepository: TokenRepository,
        private mailService: MailService,
        private configService: ConfigService,
        private dbManager: MongoDbManager,
        private srpAuthenticationService: SrpAuthenticationService,
    ) {
    }
    
    async registerUser(email: types.core.LEmail, credentials: types.core.PlainPassword|db.SrpCredentials) {
        if (!this.configService.values.openRegistrationEnabled) {
            throw new AppException("OPEN_REGISTRATION_DISABLED");
        }
        return this.createUser({email, credentials, activated: false});
    }
    
    async createUser(options: CreateUserOptions) {
        await this.checkWhetherEmailIsAvailable(options.email);
        return this.dbManager.withTrasaction(async session => {
            const user = await this.insertUserAndMaybeSendActivationMail(options, session);
            return user;
        });
    }
    
    async getUsersCount() {
        return this.userRepository.getCount();
    }
    // =====================
    //        PRIVATE
    // =====================
    
    private async checkWhetherEmailIsAvailable(email: types.core.LEmail) {
        const emailInUse = await this.userRepository.isEmailInUse(email);
        if (emailInUse) {
            throw new AppException("EMAIL_ALREADY_IN_USE");
        }
    }
    
    private async insertUserAndMaybeSendActivationMail(options: CreateUserOptions, session?: mongodb.ClientSession) {
        const user = await this.insertUser(options, session);
        if (!options.activated) {
            await this.createActivateAccountTokenAndSendEmail(user, session);
        }
        return user;
    }
    
    private async insertUser(options: CreateUserOptions, session?: mongodb.ClientSession) {
        try {
            const credentials = await this.prepareCredentails(options);
            const user = await this.userRepository.create(options.email, credentials, options.activated, session);
            return user;
        }
        catch (e) {
            if (MongoUtils.isDuplicateKeyError(e)) {
                throw new AppException("EMAIL_ALREADY_IN_USE");
            }
            throw e;
        }
    }
    
    private async prepareCredentails(options: CreateUserOptions) {
        if (typeof options.credentials === "string") {
            return this.srpAuthenticationService.prepareSrpCredentialsFromPassword(options.email, options.credentials);
        }
        return options.credentials;
    }
    
    private async createActivateAccountTokenAndSendEmail(user: db.User, session?: mongodb.ClientSession) {
        const data: db.ActivateAccountTokenData = {
            type: "activateAccount",
            user: user._id,
        };
        const token = await this.tokenRepository.create(data, [user.email], this.configService.values.activationTokenTTL, session);
        this.mailService.sendEmailVerificationMail("en" as types.core.Language, user.email, token._id);
    }
}
