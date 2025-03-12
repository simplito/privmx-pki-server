import * as types from "../types";
import * as userApi from "../api/client/user/UserApiTypes";
import { AppException } from "../api/AppException";
import { UserService } from "./UserService";
import { LoggedUserDoesNotExist } from "../error/LoggedUserDoesNotExist";
import { SecondFactorProvider } from "./SecondFactorProvider";
import { ChallengeService } from "./ChallengeService";
import { UserRepository } from "./UserRepository";
import { Utils } from "../utils/Utils";
export class SecondFactorService {
    
    constructor(
        private userService: UserService,
        private userRepository: UserRepository,
        private secondFactorProvider: SecondFactorProvider,
        private challengeService: ChallengeService,
    ) {
    }
    
    async enable(userId: types.user.UserId, model: userApi.EnableSecondFactorModel) {
        const user = await this.userService.getUser(userId);
        if (!user) {
            throw new LoggedUserDoesNotExist(userId);
        }
        if (user.secondFactor) {
            throw new AppException("SECOND_FACTOR_ALREADY_ENABLED");
        }
        const requestParamsHash = Utils.getRequestParamsHash("user/", "enableSecondFactor", {});
        return await this.challengeService.generateChallenge(user._id, {...model, knownDevices: []}, requestParamsHash);
    }
    
    async confimEnablingOfSecondFactor(userId: types.user.UserId, deviceId: types.core.AgentId|null, challengeId: types.core.ChallengeId, code: string, ip: types.core.IpAddress) {
        const requestParamsHash = Utils.getRequestParamsHash("user/", "enableSecondFactor", {});
        const challenge = await this.challengeService.getChallengeData(userId, challengeId);
        await this.challengeService.validate(userId, challengeId, code, ip, requestParamsHash, null);
        if (!challenge) {
            throw new Error("Validated challenge does not exist");
        }
        await this.secondFactorProvider.enableUserSecondFactor(userId, challenge, deviceId);
    }
    
    async resendSecondFactorCodeByEmail(email: types.core.LEmail, challengeId: types.core.ChallengeId) {
        const user = await this.userRepository.getByEmail(email);
        if (!user) {
            return;
        }
        const challenge = await this.challengeService.getChallengeData(user._id, challengeId);
        if (!challenge) {
            return;
        }
        await this.secondFactorProvider.resendCodeToUser(user, challengeId, challenge);
    }
    
    async resendSecondFactorCode(userId: types.user.UserId, challengeId: types.core.ChallengeId) {
        const user = await this.userService.getUser(userId);
        const challenge = await this.challengeService.getChallengeData(user._id, challengeId);
        if (!challenge) {
            return;
        }
        await this.secondFactorProvider.resendCodeToUser(user, challengeId, challenge);
    }
    
    async disable(userId: types.user.UserId) {
        const user = await this.userService.getUser(userId);
        if (!user) {
            throw new LoggedUserDoesNotExist(userId);
        }
        if (!user.secondFactor) {
            throw new AppException("SECOND_FACTOR_ALREADY_DISABLED");
        }
        const requestParamsHash = Utils.getRequestParamsHash("user/", "disableSecondFactor", {});
        return await this.challengeService.generateChallenge(user._id, user.secondFactor, requestParamsHash);
    }
    
    async confirmDisablingOfSecondFactor(userId: types.user.UserId, challengeId: types.core.ChallengeId, code: string, ip: types.core.IpAddress) {
        const requestParamsHash = Utils.getRequestParamsHash("user/", "disableSecondFactor", {});
        await this.challengeService.validate(userId, challengeId, code, ip, requestParamsHash, null);
        await this.userService.disableUserSecondFactor(userId);
    }
}
