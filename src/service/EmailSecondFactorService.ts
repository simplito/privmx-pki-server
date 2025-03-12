import { ChallengeResult, ISecondFactorService } from "./SecondFactorProvider";
import * as db from "../db/Model";
import * as types from "../types";
import { MailService } from "./mail/MailService";
import { UserService } from "./UserService";
import { AppException } from "../api/AppException";
import { ConfigService } from "./ConfigService";
import { SecondFactorChallengeDataCache } from "../cluster/master/ipcServices/SecondFactorChallengeDataCache";
import { DateUtils } from "../utils/DateUtils";
import { UserRepository } from "./UserRepository";

export class EmailSecondFactorService implements ISecondFactorService {
    
    constructor(
        private mailService: MailService,
        private userService: UserService,
        private userRepository: UserRepository,
        private configService: ConfigService,
        private secondFactorChallengeDataCache: SecondFactorChallengeDataCache,
    ) {
    }
    
    async validateChallenge(challengeId: types.core.ChallengeId, userId: types.user.UserId, secondFactorChallenge: types.auth.SecondFactorChallengeData, code: string, _ip: types.core.IpAddress, requestParamsHash: string, deviceToRemember: types.core.AgentId|null): Promise<void> {
        this.checkIfValidSecondFactorChallengeData(secondFactorChallenge);
        if (secondFactorChallenge.requestParamsHash !== requestParamsHash) {
            throw new AppException("SECOND_FACTOR_VERIFICATION_FAILED", "Request parameters mismatch");
        }
        const validationResult = await this.validateCode(secondFactorChallenge, code);
        if (!validationResult.isValid) {
            await this.rejectAttempt(userId, challengeId, secondFactorChallenge);
        }
        await this.secondFactorChallengeDataCache.deleteChallenge({userId, challengeId});
        if (deviceToRemember) {
            await this.userRepository.addKnownDevice(userId, deviceToRemember);
        }
    }
    
    prepareChallenge(user: db.User, _data: db.SecondFactor, requestParamsHash: string) {
        const oneTimeCode = this.generateCode();
        this.sendEmailWithCode(user.email, oneTimeCode);
        const result: ChallengeResult = {
            info: user.email.substring(0, 1) + "...@...",
            data: {
                type: "email",
                code: oneTimeCode,
                sendingsCount: 1,
                attempts: 0,
                requestParamsHash,
            },
            ttl: DateUtils.getMinutes(15),
        };
        return result;
    }
    
    async enableUserSecondFactor(userId: types.user.UserId, _secondFactor: types.auth.SecondFactorChallengeData, deviceId: types.core.AgentId|null) {
        await this.userService.enableUserSecondFactor(userId, {
            type: "email",
            knownDevices: deviceId ? [deviceId] : [],
        });
    }
    
    async validateCode(challengeData: types.auth.SecondFactorChallengeData, code: string) {
        this.checkIfValidSecondFactorChallengeData(challengeData);
        return {isValid: code === challengeData.code};
    }
    
    async resendCodeToUser(user: db.User, challengeId: types.core.ChallengeId, challengeData: types.auth.SecondFactorChallengeData) {
        this.checkIfValidSecondFactorChallengeData(challengeData);
        if (challengeData.sendingsCount >= this.configService.values.maxSecondFactorMails) {
            throw new AppException("CANNOT_SEND_SECOND_FACTOR_CODE");
        }
        const newCode = this.generateCode();
        await this.secondFactorChallengeDataCache.modifyChallenge({userId: user._id, challengeId, data: {
            ...challengeData,
            code: newCode,
        }});
        this.sendEmailWithCode(user.email, newCode);
    }
    
    private async rejectAttempt(userId: types.user.UserId, challengeId: types.core.ChallengeId, secondFactorChallenge: types.auth.SecondFactorChallengeData) {
        if (this.tooManyFailedAttemptsForChallenge(secondFactorChallenge)) {
            await this.secondFactorChallengeDataCache.deleteChallenge({userId, challengeId});
            throw new AppException("SECOND_FACTOR_VERIFICATION_FAILED");
        }
        await this.increaseAttempts(userId, challengeId, secondFactorChallenge);
        const attemptsLeft = this.configService.values.secondFactorMaxAttempts - secondFactorChallenge.attempts;
        throw new AppException("SECOND_FACTOR_INVALID_CODE", {attemptsLeft});
    }
    
    private async increaseAttempts(userId: types.user.UserId, challengeId: types.core.ChallengeId, secondFactorChallenge: types.auth.SecondFactorChallengeData) {
        await this.secondFactorChallengeDataCache.modifyChallenge({userId, challengeId, data: {
            ...secondFactorChallenge,
            attempts: secondFactorChallenge.attempts + 1,
        }});
    }
    
    private tooManyFailedAttemptsForChallenge(secondFactorChallenge: types.auth.SecondFactorChallengeData) {
        return secondFactorChallenge.attempts >= this.configService.values.secondFactorMaxAttempts;
    }
    
    private generateCode(): types.core.SecondFactorAuthorizationCode {
        return Math.floor(Math.random() * 9999).toString().padStart(4, "0") as types.core.SecondFactorAuthorizationCode;
    }
    
    private sendEmailWithCode(email: types.core.LEmail, code: types.core.SecondFactorAuthorizationCode) {
        this.mailService.sendSecondFactorCodeMail("en" as types.core.Language, email, code);
    }
    
    private checkIfValidSecondFactorChallengeData(secondFactor: types.auth.SecondFactorChallengeData): asserts secondFactor is types.auth.EmailSecondFactorChallengeData {
        if (secondFactor.type !== "email") {
            throw new Error("Mismatch second factor service with user data");
        }
    }
}
