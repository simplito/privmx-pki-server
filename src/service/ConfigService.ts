import * as fs from "fs";
import * as path from "path";
import { MongoConfig } from "../db/MongoDbManager";
import { Logger } from "../utils/Logger";
import * as types from "../types";
import * as os from "os";
import cluster from "cluster";
import { DateUtils } from "../utils/DateUtils";
export interface ConfigValues {
    instanceName: string;
    host: string;
    port: number;
    workers: number;
    storageDir: string;
    publicDir: string;
    mailBlackWhiteListDir: string;
    db: MongoConfig;
    sessionExpirationTime: types.core.Timespan;
    secondFactorMaxAttempts: number;
    maxSecondFactorMails: number,
    shutdownTimeout: types.core.Timespan;
    cors: {
        enabled: boolean;
        origins: string[];
    };
    defaultMailLanguage: types.core.Language;
    mail: {
        from: string;
        returnPath: string;
        host: string;
        port: number;
        secure: boolean;
        auth: boolean;
        user: string;
        pass: string;
        requireTLS: boolean;
        ignoreTLS: boolean;
        checkCert: boolean;
    };
    errorMailRecipent: string;
    orderMailRecipent: string;
    uiBaseUrl: string;
    openRegistrationEnabled: boolean;
    redirectToDocs: boolean;
    apiRateLimit: {
        initialCredit: number;
        maxCredit: number;
        creditAddon: number;
        addonInterval: number;
        requestCost: number;
        inactiveTime: number;
        whitelist: types.core.IpAddress[];
        loginRateLimiterEnabled: boolean;
        totpRateLimiterEnabled: boolean;
        totpUnsuccessfulAttemptsLimit: number;
    };
    fakeSrpToken: string;
    srpTokenTTL: types.core.Timespan;
    activationTokenTTL: types.core.Timespan;
    secondFactorTokenTTL: types.core.Timespan;
    credentialsResetTokenTTL: types.core.Timespan;
    expiredTokenRemovalInterval: types.core.Timespan;
    cipherKeyTTL: types.core.Timespan;
    ipAddressHeaderName: string;
    accessTokenLifetime: types.core.Timespan;
    refreshTokenLifetime: types.core.Timespan;
    authorizationCodeLifetime: types.core.Timespan;
    checkDevsAndKeysForToken: boolean;
}
const prohibitedKeywords = ["mgmToken", "apiKey", "pass", "db.url"];
export class ConfigService {
    
    values: ConfigValues;
    private logger = Logger.create(this);
    private basePath: string;
    
    constructor() {
        this.basePath = path.join(__dirname, "../../");
        const host = process.env.PMX_HOST || "localhost";
        const port = parseInt(process.env.PMX_PORT || "0", 10) || 8101;
        const storageDir = path.resolve(process.env.PMX_STORAGE_DIR || path.resolve(this.basePath, "storage"));
        const publicDir = path.resolve(process.env.PMX_PUBLIC_DIR || path.resolve(this.basePath, "public"));
        const mailBlackWhiteListDir = path.resolve(process.env.PMX_WHITE_LIST_DIR || path.resolve(this.basePath, "mail"));
        this.values = {
            instanceName: process.env.PMX_INSTANCE_NAME || "User instance",
            host,
            port,
            sessionExpirationTime: this.getTimespan("PMX_SESSION_EXIPRATION_TIME", DateUtils.getDays(3)),
            secondFactorMaxAttempts: parseInt(process.env.PMX_2FA_MAX_ATTEMPTS || "", 10) || 3,
            maxSecondFactorMails: parseInt(process.env.PMX_2FA_MAX_MAILS || "", 10) || 5,
            shutdownTimeout: this.getTimespan("PMX_SHUTDOWN_TIMEOUT", DateUtils.getSeconds(5)),
            workers: parseInt(process.env.PMX_CLOUD_WORKERS || "", 10) || os.cpus().length,
            storageDir,
            publicDir,
            mailBlackWhiteListDir,
            db: {
                url: process.env.PMX_MONGO_URL || "mongodb://localhost:27017?directConnection=true",
                dbName: process.env.PMX_MONGO_DB || "pmx_json_rpc_template_server_db",
            },
            cors: {
                enabled: process.env.PMX_CORS_ENABLED === "true",
                origins: process.env.PMX_CORS_ORIGINS ? process.env.PMX_CORS_ORIGINS.split(",") : [],
            },
            defaultMailLanguage: (process.env.DEFAULT_MAIL_LANGUAGE || "en") as types.core.Language,
            mail: {
                from: process.env.PMX_MAIL_FROM || "WebApp Team <contact@domain.com>",
                returnPath: process.env.PMX_MAIL_RETURN_PATH || "bounce+{id}@domain.com",
                host: process.env.PMX_MAIL_HOST || "localhost",
                port: parseInt(process.env.PMX_MAIL_PORT || "0", 10) || 25,
                secure: process.env.PMX_MAIL_SECURE === "true",
                auth: process.env.PMX_MAIL_AUTH === "true",
                user: process.env.PMX_MAIL_USER || "",
                pass: process.env.PMX_MAIL_PASS || "",
                requireTLS: process.env.PMX_MAIL_REQUIRE_TLS === "true",
                ignoreTLS: process.env.PMX_MAIL_IGNORE_TLS === "true",
                checkCert: process.env.PMX_MAIL_CHECK_CERT === "true",
            },
            errorMailRecipent: process.env.ERROR_MAIL_RECIPENT || "admin@domain.com",
            orderMailRecipent: process.env.ORDER_MAIL_RECIPENT || "admin@domain.com",
            uiBaseUrl: process.env.PMX_UI_BASE_URL || "http://cloudui.localhost",
            openRegistrationEnabled: process.env.PMX_OPEN_REGISTRATION_ENABLED === "true",
            redirectToDocs: process.env.PMX_REDIRECT_TO_DOCS === "true",
            apiRateLimit: {
                initialCredit: parseInt(process.env.PMX_LIMITER_INITIAL_CREDIT || "", 10) || 1000,
                maxCredit: parseInt(process.env.PMX_LIMITER_MAX_CREDIT || "", 10) || 1200,
                creditAddon: parseInt(process.env.PMX_LIMITER_CREDIT_ADDON || "", 10) || 100,
                addonInterval: parseInt(process.env.PMX_LIMITER_CREDIT_ADDON_INTERVAL || "", 10) || 1000,
                requestCost: parseInt(process.env.PMX_LIMITER_REQUEST_COST || "", 10) || 10,
                inactiveTime: parseInt(process.env.PMX_LIMITER_INACTIVE_TIME || "", 10) ||  2 * 60 * 1000,
                whitelist: process.env.PMX_LIMITER_WHITELIST ? process.env.PMX_LIMITER_WHITELIST.split(",") as types.core.IpAddress[] : [],
                loginRateLimiterEnabled: process.env.PMX_LOGIN_RATE_LIMITER !== "false",
                totpRateLimiterEnabled: process.env.PMX_TOTP_RATE_LIMITER !== "false",
                totpUnsuccessfulAttemptsLimit: parseInt(process.env.PMX_TOTP_UNSUCCESSFUL_ATTEMPT_LIMIT || "", 10) || 20,
            },
            fakeSrpToken: process.env.PMX_FAKE_SRP_TOKEN || "gst7ybqy6agztqOap",
            srpTokenTTL: this.getTimespan("PMX_SRP_TOKEN_TTL", DateUtils.getMinutes(1)),
            activationTokenTTL: this.getTimespan("PMX_ACTIVATION_TOKEN_TTL", DateUtils.getDays(10)),
            secondFactorTokenTTL: this.getTimespan("PMX_SECOND_FACTOR_TOKEN_TTL", DateUtils.getMinutes(5)),
            credentialsResetTokenTTL: this.getTimespan("PMX_CREDENTIALS_RESET_TTL", DateUtils.getMinutes(30)),
            expiredTokenRemovalInterval: this.getTimespan("PMX_EXPIRED_TOKEN_REMOVAL_INTERVAL", DateUtils.getHours(1)),
            cipherKeyTTL: this.getTimespan("PMX_CIPHER_KEY_TTL", DateUtils.getHours(1)),
            ipAddressHeaderName: process.env.PMX_IP_ADDRESS_HEADER_NAME || "x-forwarded-for",
            accessTokenLifetime: this.getTimespan("PMX_ACCESS_TOKEN_LIFETIME",  DateUtils.getMinutes(15)),
            refreshTokenLifetime: this.getTimespan("PMX_REFRESH_TOKEN_LIFETIME",  DateUtils.getDays(7)),
            authorizationCodeLifetime: this.getTimespan("PMX_AUTHORIZATION_CODE_LIFETIME",  DateUtils.getMinutes(1)),
            checkDevsAndKeysForToken: process.env.CHECK_DEV_AND_API_KEY_FOR_TOKEN === "true",
        };
    }
    
    loadConfig() {
        try {
            const configPath = process.argv.length < 3 || !process.argv[2] ? path.resolve(this.basePath, "conf/config.json") : process.argv[2];
            if (fs.existsSync(configPath)) {
                this.logger.debug("Reading config file '" + configPath + "'");
                const cfgContent = fs.readFileSync(configPath, "utf8");
                const cfg = JSON.parse(cfgContent);
                if (typeof(cfg) != "object" || cfg == null) {
                    throw new Error("Config expected to be an object");
                }
                this.values = ConfigService.overwriteOptions(this.values, cfg);
            }
            else {
                this.logger.debug("No config file");
            }
        }
        catch (e) {
            this.logger.error("Cannot read config file " + process.argv[2], e);
            throw e;
        }
        if (cluster.isPrimary) {
            this.logger.debug("Current config", JSON.stringify(this.filterConfig(this.values), null, 2));
        }
    }
    
    static overwriteOptions<T = any>(target: T, source: T): T {
        if (typeof(target) != "object" || target == null) {
            return source;
        }
        if (typeof(source) != "object") {
            throw new Error("Cannot overwrite object with primitive type");
        }
        if (Array.isArray(target)) {
            if (!Array.isArray(source)) {
                throw new Error("Cannot mix array with object");
            }
            return source;
        }
        for (const key in source) {
            try {
                target[key] = this.overwriteOptions(target[key], source[key]);
            }
            catch (e) {
                throw new Error("OverwriteOptions " + key + ": " + (e && typeof(e) === "object" && "message" in e && typeof(e.message) === "string" ? e.message : ""));
            }
        }
        return target;
    }
    
    getAssetPath(asset: string) {
        return path.resolve(this.values.publicDir, asset);
    }
    
    private hideString(str: string): string {
        return (str ? str[0] : "") + "*".repeat(8);
    }
    
    private filterConfig(value: any, valuePath: string = "", hideAll: boolean = false): any {
        if (typeof value === "object") {
            if (value === null) {
                return null;
            }
            if (Array.isArray(value)) {
                return value.map(element => this.filterConfig(element, valuePath + "[]", hideAll));
            }
            const obj: any = {};
            for (const key in value) {
                const newValuePath = valuePath ? valuePath + "." + key : key;
                obj[key] = this.filterConfig(value[key], newValuePath, prohibitedKeywords.includes(key) || prohibitedKeywords.includes(newValuePath));
            }
            return obj;
        }
        if (hideAll && typeof value === "string") {
            return this.hideString(value);
        }
        return value;
    }
    
    private getTimespan(envName: string, defaultTimespan: types.core.Timespan) {
        return parseInt(process.env[envName] || "", 10) as types.core.Timespan || defaultTimespan;
    }
}
