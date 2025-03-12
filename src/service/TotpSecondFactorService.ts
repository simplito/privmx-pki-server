import { ChallengeResult, ISecondFactorService } from "./SecondFactorProvider";
import * as db from "../db/Model";
import * as types from "../types";
import { UserService } from "./UserService";
import * as authenticator from "authenticator";
import { AppException } from "../api/AppException";
import { TokenRepository } from "./TokenRepository";
import { DateUtils } from "../utils/DateUtils";
import { ConfigService } from "./ConfigService";
import { TotpCache } from "../cluster/master/ipcServices/TotpCache";
import { MailService } from "./mail/MailService";
import { UserRepository } from "./UserRepository";
import { IpRateLimiter } from "../cluster/master/ipcServices/IpRateLimiter";
import { IpAddress } from "../types/core";
import { SecondFactorChallengeDataCache } from "../cluster/master/ipcServices/SecondFactorChallengeDataCache";

export class TotpSecondFactorService implements ISecondFactorService {
    
    constructor(
        private userService: UserService,
        private tokenRepository: TokenRepository,
        private configService: ConfigService,
        private totpCache: TotpCache,
        private ipRateLimiter: IpRateLimiter,
        private mailService: MailService,
        private userRepository: UserRepository,
        private secondFactorChallengeDataCache: SecondFactorChallengeDataCache,
    ) {
    }
    
    async validateChallenge(challengeId: types.core.ChallengeId, userId: types.user.UserId, secondFactorChallenge: types.auth.SecondFactorChallengeData, code: string, ip: IpAddress, _requestParamsHash: string, deviceToRemember: types.core.AgentId|null): Promise<void> {
        this.checkIfValidSecondFactorChallengeData(secondFactorChallenge);
        await this.increaseChallengeAttempts(userId, challengeId, secondFactorChallenge);
        await this.checkCooldownAndAttemptsLimitForUser(userId, ip, secondFactorChallenge);
        const validationResult = await this.validateCode(secondFactorChallenge, code, userId);
        if (!validationResult.isValid) {
            await this.rejectAttempt(userId, ip, challengeId, secondFactorChallenge, !!validationResult.duplicated);
        }
        await this.secondFactorChallengeDataCache.deleteChallenge({userId, challengeId});
        if (deviceToRemember) {
            await this.userRepository.addKnownDevice(userId, deviceToRemember);
        }
    }
    
    prepareChallenge(_user: db.User, data: db.SecondFactor, _requestParamsHash: string) {
        this.checkIfValidSecondFactor(data);
        const result: ChallengeResult = {
            data: {
                type: "totp",
                secret: data.secret,
                attempts: 0,
            },
            info: "mobile-app",
            ttl: DateUtils.getMinutes(15),
        };
        return result;
    }
    
    async enableUserSecondFactor(userId: types.user.UserId, secondFactor: types.auth.SecondFactorChallengeData, deviceId: types.core.AgentId|null) {
        this.checkIfValidSecondFactorChallengeData(secondFactor);
        await this.userService.enableUserSecondFactor(userId, {
            type: "totp",
            knownDevices: deviceId ? [deviceId] : [],
            secret: secondFactor.secret,
        });
    }
    
    async validateCode(challengeData: types.auth.SecondFactorChallengeData, code: string, userId: types.user.UserId) {
        this.checkIfValidSecondFactorChallengeData(challengeData);
        if (await this.tokenRepository.checkIfTotpCodeRecentlyUsed(code, userId)) {
            return {isValid: false, duplicated: true};
        }
        const normalizedCode = code.trim();
        const code2 = (normalizedCode || "").replace(/\s/g, "");
        const validateResult = (normalizedCode.length == 6 || normalizedCode.length == 7) && code2.length == 6 && authenticator.verifyToken(challengeData.secret, code2) != null;
        if (validateResult) {
            const tokenData: db.TotpCodeTokenData = {
                type: "totpCode",
                code: code,
                user: userId,
                usedAt: DateUtils.now(),
            };
            await this.tokenRepository.create(tokenData, [], DateUtils.getSeconds(90));
        }
        return {isValid: validateResult};
    }
    
    async resendCodeToUser(_user: db.User, _challengeId: types.core.ChallengeId, _challengeData: types.auth.SecondFactorChallengeData) {
        throw new AppException("CANNOT_SEND_SECOND_FACTOR_CODE");
    }
    
    private async rejectAttempt(userId: types.user.UserId, ip: types.core.IpAddress, challengeId: types.core.ChallengeId, secondFactorChallenge: types.auth.TotpSecondFactorChallengeData, duplicated: boolean) {
        void this.totpCache.addUnsucessfulTotpAttempt(userId);
        const user = await this.userService.getUser(userId);
        if (this.isUserPossibleAttackTarget(user)) {
            await this.banIpAddressAndDeleteChallenge(userId, ip, challengeId);
            throw new AppException("TOO_MANY_UNSUCCSESSFUL_TOTP_ATTEMPTS");
        }
        if (this.tooManyFailedAttemptsForChallenge(secondFactorChallenge)) {
            await this.secondFactorChallengeDataCache.deleteChallenge({userId, challengeId});
            throw new AppException("SECOND_FACTOR_VERIFICATION_FAILED");
        }
        const attemptsLeft = this.configService.values.secondFactorMaxAttempts - secondFactorChallenge.attempts - 1;
        throw new AppException("SECOND_FACTOR_INVALID_CODE", {attemptsLeft, duplicated: !!duplicated});
    }
    
    private async increaseChallengeAttempts(userId: types.user.UserId, challengeId: types.core.ChallengeId, secondFactorChallenge: types.auth.TotpSecondFactorChallengeData) {
        await this.secondFactorChallengeDataCache.modifyChallenge({userId, challengeId, data: {
            ...secondFactorChallenge,
            lastAttempt: DateUtils.now(),
            attempts: secondFactorChallenge.attempts + 1,
        }});
    }
    
    private async banIpAddressAndDeleteChallenge(userId: types.user.UserId, ip: types.core.IpAddress, challengeId: types.core.ChallengeId) {
        await this.ipRateLimiter.banIpAdress({ip, banDuration: DateUtils.getHours(1)});
        await this.secondFactorChallengeDataCache.deleteChallenge({userId, challengeId});
    }
    
    private async checkCooldownAndAttemptsLimitForUser(userId: types.user.UserId, ip: types.core.IpAddress, secondFactorChallenge: types.auth.TotpSecondFactorChallengeData) {
        if (this.hasTotpCooldownElapsed(secondFactorChallenge)) {
            throw new AppException("TOO_MANY_TOTP_ATTEMPTS_IN_SHORT_TIME", "Try again in 1 second");
        }
        if (await this.totpCache.getTotpAttempts(userId) >= this.configService.values.apiRateLimit.totpUnsuccessfulAttemptsLimit) {
            await this.banIpAddressAndWarnUser(ip, userId);
            throw new AppException("TOO_MANY_UNSUCCSESSFUL_TOTP_ATTEMPTS");
        }
    }
    
    private async banIpAddressAndWarnUser(ip: types.core.IpAddress, userId: types.user.UserId) {
        await this.ipRateLimiter.banIpAdress({ip, banDuration: DateUtils.getHours(1)});
        const user = await this.userService.getUser(userId);
        if (!user.possibleTotpAttackTarget || user.possibleTotpAttackTarget < DateUtils.now()) {
            this.mailService.sendPossbileUnauthorizedLoginWarning("en" as types.core.Language, user.email);
        }
        await this.userRepository.updatePossibleTotpAttackTarget(userId, DateUtils.getExpirationDate(DateUtils.getHours(1)));
    }
    
    private hasTotpCooldownElapsed(secondFactorChallenge: types.auth.TotpSecondFactorChallengeData) {
        return this.configService.values.apiRateLimit.totpRateLimiterEnabled && secondFactorChallenge.lastAttempt && (DateUtils.now() - secondFactorChallenge.lastAttempt) < DateUtils.getSeconds(1);
    }
    
    private isUserPossibleAttackTarget(user: db.User) {
        return user.possibleTotpAttackTarget && user.possibleTotpAttackTarget > DateUtils.now();
    }
    
    private tooManyFailedAttemptsForChallenge(secondFactorChallenge: types.auth.SecondFactorChallengeData) {
        return secondFactorChallenge.attempts >= this.configService.values.secondFactorMaxAttempts;
    }
    
    private checkIfValidSecondFactorChallengeData(secondFactor: types.auth.SecondFactorChallengeData): asserts secondFactor is types.auth.TotpSecondFactorChallengeData {
        if (secondFactor.type !== "totp") {
            throw new Error("Mismatch second factor service with user data");
        }
    }
    
    private checkIfValidSecondFactor(data: db.SecondFactor): asserts data is db.TotpSecondFactor {
        if (data.type !== "totp") {
            throw new Error("Mismatch second factor service with user data");
        }
    }
}
