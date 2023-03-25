import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import Router from 'koa-router';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dayjs from 'dayjs';
import nodeSchedule from 'node-schedule';
import { Sequelize, Column, Table, Model } from 'sequelize-typescript';
import { Op } from 'sequelize';
import multer from '@koa/multer';
import { existsSync as existsSync$1, rmSync } from 'fs';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

const sequelize = new Sequelize("cmp", "root", "c13005261761F", {
    host: "81.71.36.158",
    dialect: "mysql",
    timezone: '+08:00'
});
try {
    await sequelize.authenticate();
    console.log("database connect success!!!");
}
catch (err) {
    console.log(err);
}

let CompetitionModel = class CompetitionModel extends Model {
};
__decorate([
    Column({
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CompetitionModel.prototype, "id", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "name", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "description", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "address", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "level", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "instructorsNums", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CompetitionModel.prototype, "mode", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "opUser", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "judges", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "registrationStartTime", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "registrationEndTime", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "workSubmissionStartTime", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "workSubmissionEndTime", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "files", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "imgs", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "rounds", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "awards", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "currentRound", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], CompetitionModel.prototype, "status", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], CompetitionModel.prototype, "signUpNums", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], CompetitionModel.prototype, "createdAt", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], CompetitionModel.prototype, "updatedAt", void 0);
CompetitionModel = __decorate([
    Table({
        tableName: "competition",
    })
], CompetitionModel);
sequelize.addModels([CompetitionModel]);

const setResponse = (ctx, body, status = 200) => {
    ctx.status = status;
    ctx.body = body;
};
const serviceReturn = (data, status = 200) => ({
    status,
    data,
});
const errCatch = (target) => {
    return new Proxy(target, {
        get(target, key, receiver) {
            if (typeof target[key] !== "function") {
                return Reflect.get(target, key, receiver);
            }
            return async function (...args) {
                try {
                    return await target[key].apply(this, args);
                }
                catch (e) {
                    const errMsg = `errObj: ${target.constructor.name} \n errFunction: ${key} \n errMsg: ${e}`;
                    if (target.constructor.name.includes("Controller")) {
                        const ctx = args[0];
                        setResponse(ctx, { code: 400, data: errMsg }, 500);
                    }
                    else {
                        return serviceReturn({
                            code: 400,
                            data: errMsg,
                        }, 500);
                    }
                }
            };
        },
    });
};
const encrypt = (password) => {
    const md5 = crypto.createHash("md5");
    return md5.update(password).digest("hex");
};
const handleFileName = (phone, contentLength, rawName) => {
    return `${phone}_${contentLength}_$$_${rawName}`;
};
function formatTime(time) {
    return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}
function schedule(fn) {
    const rule = new nodeSchedule.RecurrenceRule();
    rule.second = 0;
    const job = nodeSchedule.scheduleJob(rule, fn);
    return job;
}
function getCompetitionStatus(rst, ret, wst, wet) {
    let status = 0;
    const now = Date.now();
    if (now < rst) {
        status = 0;
    }
    if (now >= rst && now < ret) {
        status = 1;
    }
    if (now >= ret && now < wst) {
        status = 2;
    }
    if (now >= wst && now < wet) {
        status = 3;
    }
    if (now >= wet) {
        status = 4;
    }
    return status;
}
async function syncCompetitionStatus() {
    try {
        const competitionList = await CompetitionModel.findAll({
            raw: true,
        });
        const needToSyncList = competitionList.filter((competition) => {
            const { registrationStartTime, registrationEndTime, workSubmissionStartTime, workSubmissionEndTime, status, } = competition;
            if (status === 5) {
                return false;
            }
            const rst = Date.parse(registrationStartTime);
            const ret = Date.parse(registrationEndTime);
            const wst = Date.parse(workSubmissionStartTime);
            const wet = Date.parse(workSubmissionEndTime);
            const rightStatus = getCompetitionStatus(rst, ret, wst, wet);
            if (status === rightStatus)
                return false;
            competition.status = rightStatus;
            return true;
        });
        for (const needSync of needToSyncList) {
            CompetitionModel.update({
                status: needSync.status,
            }, {
                where: {
                    id: needSync.id,
                },
            });
        }
    }
    catch (e) {
        console.log(e);
    }
}
function getDiff(prev, cur) {
    const newMember = [];
    const removeMember = [];
    const immutableMember = [];
    for (const raw of prev) {
        if (!cur.includes(raw)) {
            removeMember.push(raw);
        }
        else {
            if (!immutableMember.includes(raw)) {
                immutableMember.push(raw);
            }
        }
    }
    for (const _new of cur) {
        if (!prev.includes(_new)) {
            newMember.push(_new);
        }
        else {
            if (!immutableMember.includes(_new)) {
                immutableMember.push(_new);
            }
        }
    }
    return [newMember, removeMember, immutableMember];
}

const NOT_AUTHORIZATION = 'not_authorization';
const PHONE_PASSWORD_ROLE_IS_REQUIRED = 'phone_password_role_is_required';
const PHONE_PASSWORD_IS_REQUIRED = 'phone_password_is_required';

let UserModel = class UserModel extends Model {
};
__decorate([
    Column({
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], UserModel.prototype, "id", void 0);
__decorate([
    Column({
        allowNull: false,
        unique: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "phone", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], UserModel.prototype, "role", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "password", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "signUpedList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "signUpingList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "confirmList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "instructoredList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "instructoringList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "judgementList", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], UserModel.prototype, "createdAt", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], UserModel.prototype, "updatedAt", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], UserModel.prototype, "isDisable", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], UserModel.prototype, "subscriptionList", void 0);
UserModel = __decorate([
    Table({
        tableName: "user",
    })
], UserModel);
sequelize.addModels([UserModel]);

var UserRole;
(function (UserRole) {
    UserRole[UserRole["student"] = 0] = "student";
    UserRole[UserRole["teacher"] = 1] = "teacher";
    UserRole[UserRole["admin"] = 2] = "admin";
})(UserRole || (UserRole = {}));
var CompetitionMode;
(function (CompetitionMode) {
    CompetitionMode[CompetitionMode["singe"] = 0] = "singe";
    CompetitionMode[CompetitionMode["team"] = 1] = "team";
})(CompetitionMode || (CompetitionMode = {}));
var SignUpStatus;
(function (SignUpStatus) {
    SignUpStatus[SignUpStatus["pending"] = 1] = "pending";
    SignUpStatus[SignUpStatus["fulfilled"] = 0] = "fulfilled";
})(SignUpStatus || (SignUpStatus = {}));
var CompetitionStatus;
(function (CompetitionStatus) {
    CompetitionStatus[CompetitionStatus["beforeSignUp"] = 0] = "beforeSignUp";
    CompetitionStatus[CompetitionStatus["signUping"] = 1] = "signUping";
    CompetitionStatus[CompetitionStatus["waitUpload"] = 2] = "waitUpload";
    CompetitionStatus[CompetitionStatus["uploading"] = 3] = "uploading";
    CompetitionStatus[CompetitionStatus["waitResult"] = 4] = "waitResult";
    CompetitionStatus[CompetitionStatus["end"] = 5] = "end";
})(CompetitionStatus || (CompetitionStatus = {}));
var AlreadyProcess;
(function (AlreadyProcess) {
    AlreadyProcess[AlreadyProcess["yes"] = 1] = "yes";
    AlreadyProcess[AlreadyProcess["no"] = 0] = "no";
})(AlreadyProcess || (AlreadyProcess = {}));
var UserDisable;
(function (UserDisable) {
    UserDisable[UserDisable["yes"] = 1] = "yes";
    UserDisable[UserDisable["no"] = 0] = "no";
})(UserDisable || (UserDisable = {}));

class LoginService {
    async login({ password, phone }) {
        const isPhoneExist = await UserModel.findOne({
            raw: true,
            where: {
                phone,
            },
            attributes: ["password", "role", 'isDisable'],
        });
        if (!isPhoneExist) {
            return serviceReturn({
                code: 400,
                data: "当前手机号还未注册",
            });
        }
        if (isPhoneExist.password !== encrypt(password)) {
            return serviceReturn({
                code: 400,
                data: "密码错误",
            });
        }
        if (isPhoneExist.isDisable === UserDisable.yes) {
            return serviceReturn({
                code: 400,
                data: "当前用户已被禁用",
            });
        }
        return serviceReturn({
            code: 200,
            data: {
                phone,
                role: isPhoneExist.role,
            },
        });
    }
}
var loginService = errCatch(new LoginService());

const privateKey = readFileSync(resolve(process.cwd(), "private.pem"));
class LoginController {
    async login(ctx, next) {
        const { password, phone } = ctx.request.body;
        if (password && phone) {
            const { data, status } = await loginService.login({ password, phone });
            if (data.code === 200) {
                const token = jwt.sign({ phone }, privateKey, {
                    expiresIn: 60 * 60 * 24,
                    algorithm: "RS256",
                });
                data.data = { ...data.data, token };
            }
            setResponse(ctx, data, status);
        }
        else {
            const err = new Error(PHONE_PASSWORD_IS_REQUIRED);
            ctx.app.emit("error", err, ctx);
        }
    }
}
var loginController = errCatch(new LoginController());

const loginRouter = new Router({ prefix: "/login" });
loginRouter.post("/", loginController.login);

class RegisterService {
    async register(param) {
        const { phone, password, role } = param;
        const alreadyExist = await UserModel.findOne({
            where: {
                phone,
            },
        });
        if (alreadyExist) {
            return serviceReturn({
                code: 400,
                data: "当前手机号已经被注册过了",
            });
        }
        await UserModel.create({
            phone,
            password: encrypt(password),
            role,
        });
        return serviceReturn({
            code: 200,
            data: "注册成功",
        });
    }
}
var registerService = errCatch(new RegisterService());

class RegisterController {
    async register(ctx) {
        const { phone, password, role } = ctx.request.body;
        if (phone && password && role !== undefined) {
            const { data, status } = await registerService.register({
                phone,
                password,
                role,
            });
            setResponse(ctx, data, status);
        }
        else {
            const err = new Error(PHONE_PASSWORD_ROLE_IS_REQUIRED);
            ctx.app.emit("error", err, ctx);
        }
    }
}
var registerController = errCatch(new RegisterController());

const registerRouter$1 = new Router({ prefix: "/register" });
registerRouter$1.post('/', registerController.register);

let SignUpModel = class SignUpModel extends Model {
};
__decorate([
    Column({
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SignUpModel.prototype, "id", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SignUpModel.prototype, "competitionId", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SignUpModel.prototype, "mode", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "leader", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "member", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "name", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "instructors", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "resolveMember", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "rejectMember", void 0);
__decorate([
    Column,
    __metadata("design:type", Number)
], SignUpModel.prototype, "status", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "competitionName", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "currentRound", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "award", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SignUpModel.prototype, "alreadyProcess", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "work", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], SignUpModel.prototype, "video", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], SignUpModel.prototype, "createdAt", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], SignUpModel.prototype, "updatedAt", void 0);
SignUpModel = __decorate([
    Table({
        tableName: "signup",
    })
], SignUpModel);
sequelize.addModels([SignUpModel]);

let FileModel = class FileModel extends Model {
};
__decorate([
    Column({
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], FileModel.prototype, "id", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "filename", void 0);
__decorate([
    Column({
        allowNull: false,
        unique: true,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "path", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "destination", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", Number)
], FileModel.prototype, "size", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "originalname", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "competitionIdList", void 0);
__decorate([
    Column({
        allowNull: true,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "signUpIdList", void 0);
__decorate([
    Column({
        allowNull: false,
    }),
    __metadata("design:type", String)
], FileModel.prototype, "mimetype", void 0);
FileModel = __decorate([
    Table({
        tableName: "file",
        createdAt: false,
        updatedAt: false,
    })
], FileModel);
sequelize.addModels([FileModel]);

let SubScriptionModel = class SubScriptionModel extends Model {
};
__decorate([
    Column({
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SubScriptionModel.prototype, "id", void 0);
__decorate([
    Column({
        allowNull: false,
        unique: true
    }),
    __metadata("design:type", Number)
], SubScriptionModel.prototype, "competitionId", void 0);
__decorate([
    Column({
        allowNull: false,
        unique: true,
    }),
    __metadata("design:type", String)
], SubScriptionModel.prototype, "user", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], SubScriptionModel.prototype, "createdAt", void 0);
__decorate([
    Column,
    __metadata("design:type", Date)
], SubScriptionModel.prototype, "updatedAt", void 0);
SubScriptionModel = __decorate([
    Table({
        tableName: "subscription",
    })
], SubScriptionModel);
sequelize.addModels([SubScriptionModel]);

class CompetitionService {
    async getCompetitionList(offset = 0, size = 10, name, level, status, user) {
        const orOptions = {};
        if (level !== "") {
            orOptions.level = level;
        }
        if (status !== "") {
            orOptions.status = status;
        }
        const [competitionList, subscriptionList] = await Promise.all([
            CompetitionModel.findAndCountAll({
                raw: true,
                order: [["createdAt", "DESC"]],
                where: {
                    [Op.and]: {
                        name: {
                            [Op.like]: `%${name}%`,
                        },
                        ...orOptions,
                    },
                },
                offset,
                limit: size,
            }),
            SubScriptionModel.findAll({
                raw: true,
                attributes: ["competitionId"],
                where: {
                    user,
                },
            }),
        ]);
        const subscriptionSet = new Set(subscriptionList.map((item) => item.competitionId));
        return serviceReturn({
            code: 200,
            data: {
                total: competitionList.count,
                list: competitionList.rows.map((item) => {
                    const { name, level, id, address, registrationStartTime, registrationEndTime, status, workSubmissionStartTime, workSubmissionEndTime, } = item;
                    return {
                        ...item,
                        id,
                        name,
                        level,
                        address,
                        registrationStartTime: formatTime(registrationStartTime),
                        registrationEndTime: formatTime(registrationEndTime),
                        workSubmissionStartTime: formatTime(workSubmissionStartTime),
                        workSubmissionEndTime: formatTime(workSubmissionEndTime),
                        status,
                        subscription: subscriptionSet.has(id),
                    };
                }),
            },
        });
    }
    async getCompetitionDetail(id, user) {
        const [competitionDetail, userInfo] = await Promise.all([
            CompetitionModel.findOne({
                raw: true,
                where: {
                    id,
                },
            }),
            UserModel.findOne({
                raw: true,
                where: {
                    phone: user,
                },
            }),
        ]);
        const { registrationStartTime, registrationEndTime, workSubmissionStartTime, workSubmissionEndTime, status, } = competitionDetail;
        const { signUpedList, signUpingList, confirmList, role, instructoredList, instructoringList, } = userInfo;
        let signUp = false;
        let leader, signUpId, work, video, instructors, member, name;
        switch (role) {
            case UserRole.student:
            case UserRole.teacher:
                const signUpIdList = [
                    ...JSON.parse((role === UserRole.student ? signUpedList : instructoredList) ||
                        "[]"),
                    ...JSON.parse((role === UserRole.student ? signUpingList : instructoringList) ||
                        "[]"),
                    ...JSON.parse(confirmList || "[]"),
                ];
                const competitionMap = new Map();
                const signUpList = await SignUpModel.findAll({
                    raw: true,
                    where: {
                        id: {
                            [Op.in]: signUpIdList,
                        },
                    },
                });
                signUpList.forEach((signUp) => {
                    competitionMap.set(String(signUp.competitionId), {
                        leader: signUp.leader,
                        id: signUp.id,
                        instructors: signUp.instructors,
                        member: signUp.member,
                        work: signUp.work,
                        video: signUp.video,
                        name: signUp.name,
                    });
                });
                if (competitionMap.has(id)) {
                    signUp = true;
                    const signInfo = competitionMap.get(id);
                    leader = signInfo.leader;
                    signUpId = signInfo.id;
                    instructors = signInfo?.instructors;
                    member = signInfo?.member;
                    work = signInfo?.work;
                    video = signInfo?.video;
                    name = signInfo?.name;
                }
                break;
            case UserRole.admin:
                signUp = false;
                break;
        }
        return serviceReturn({
            code: 200,
            data: {
                ...competitionDetail,
                registrationStartTime: formatTime(registrationStartTime),
                registrationEndTime: formatTime(registrationEndTime),
                workSubmissionStartTime: formatTime(workSubmissionStartTime),
                workSubmissionEndTime: formatTime(workSubmissionEndTime),
                status,
                signUp,
                leader,
                signUpId,
                signUpName: name,
                video,
                work,
                instructors,
                member,
            },
        });
    }
    async getCompetitionUser(phonePrefix, role) {
        const rawJudgeList = await UserModel.findAll({
            raw: true,
            where: {
                phone: {
                    [Op.like]: `%${phonePrefix}%`,
                },
                role,
            },
            limit: 5,
        });
        const judgeList = rawJudgeList.map((judge) => ({
            label: judge.phone,
            value: judge.phone,
        }));
        return serviceReturn({
            code: 200,
            data: judgeList,
        });
    }
    async createCompetition(data, opUser) {
        const userInfo = await UserModel.findOne({
            raw: true,
            where: {
                phone: opUser,
            },
        });
        if (![UserRole.admin, UserRole.teacher].includes(userInfo.role)) {
            return serviceReturn({
                code: 400,
                data: "当前用户没有创建竞赛的权限",
            });
        }
        const { name, description, address, level, instructorsNums, mode, rounds, registrationTime, workSubmissionTime, judges, files, imgs, signUpNums, awards, } = data;
        const registrationStartTime = formatTime(registrationTime[0]);
        const registrationEndTime = formatTime(registrationTime[1]);
        const workSubmissionStartTime = formatTime(workSubmissionTime[0]);
        const workSubmissionEndTime = formatTime(workSubmissionTime[1]);
        const parse = Date.parse;
        const status = getCompetitionStatus(parse(registrationStartTime), parse(registrationEndTime), parse(workSubmissionStartTime), parse(workSubmissionEndTime));
        const res = await sequelize.transaction(async () => {
            const roundsArr = rounds.split("\n");
            const currentRound = roundsArr[0];
            // 创建竞赛
            const createResult = await CompetitionModel.create({
                name,
                description,
                address,
                level,
                rounds,
                awards,
                currentRound,
                status,
                instructorsNums: JSON.stringify(instructorsNums),
                mode,
                registrationStartTime,
                registrationEndTime,
                workSubmissionStartTime,
                workSubmissionEndTime,
                judges: JSON.stringify(judges),
                files: JSON.stringify(files),
                imgs: JSON.stringify(imgs),
                opUser,
                signUpNums: signUpNums ? JSON.stringify(signUpNums) : signUpNums,
            });
            const competitionId = createResult.dataValues.id;
            const addFilesRecord = async (files) => {
                const promiseList = [];
                const _files = files.map((file) => {
                    const _file = JSON.parse(file);
                    return _file.filename;
                });
                const fileRecords = await FileModel.findAll({
                    raw: true,
                    where: {
                        filename: {
                            [Op.in]: _files,
                        },
                    },
                });
                for (const { competitionIdList, filename } of fileRecords) {
                    const newCompetitionIdList = JSON.parse(competitionIdList || "[]");
                    if (!newCompetitionIdList.includes(competitionId)) {
                        newCompetitionIdList.push(competitionId);
                    }
                    promiseList.push(FileModel.update({
                        competitionIdList: JSON.stringify(newCompetitionIdList),
                    }, {
                        where: {
                            filename,
                        },
                    }));
                }
                await Promise.all(promiseList);
            };
            // 记录文件与竞赛关系
            if (files.length) {
                await addFilesRecord(files);
            }
            if (imgs.length) {
                await addFilesRecord(imgs);
            }
            const judgeList = await UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: judges,
                    },
                },
            });
            const promiseList = [];
            // 更新user表中，judgementList
            judgeList.forEach((judge) => {
                const newJudgementList = JSON.parse(judge.judgementList || "[]");
                newJudgementList.push(competitionId);
                promiseList.push(UserModel.update({
                    judgementList: JSON.stringify(newJudgementList),
                }, {
                    where: {
                        phone: judge.phone,
                    },
                }));
            });
            await Promise.all(promiseList);
            return serviceReturn({
                code: 200,
                data: {
                    competitionId,
                },
            });
        });
        return res;
    }
    async updateCompetition(data, id, user) {
        const [rawCompetition, userInfo] = await Promise.all([
            CompetitionModel.findOne({
                raw: true,
                where: {
                    id,
                },
            }),
            UserModel.findOne({
                raw: true,
                where: {
                    phone: user,
                },
            }),
        ]);
        if (!rawCompetition) {
            return serviceReturn({
                code: 400,
                data: "当前修改的竞赛不存在",
            });
        }
        console.log(rawCompetition.opUser, user);
        if (userInfo?.role !== UserRole.admin && rawCompetition.opUser !== user) {
            return serviceReturn({
                code: 400,
                data: "没有修改改竞赛的权限",
            });
        }
        const rawJudges = JSON.parse(rawCompetition.judges || "[]");
        const { name, description, address, level, instructorsNums, mode, rounds, registrationTime, workSubmissionTime, judges, files, imgs, signUpNums, awards, } = data;
        const registrationStartTime = formatTime(registrationTime[0]);
        const registrationEndTime = formatTime(registrationTime[1]);
        const workSubmissionStartTime = formatTime(workSubmissionTime[0]);
        const workSubmissionEndTime = formatTime(workSubmissionTime[1]);
        const parse = Date.parse;
        const status = getCompetitionStatus(parse(registrationStartTime), parse(registrationEndTime), parse(workSubmissionStartTime), parse(workSubmissionEndTime));
        const newAddJudges = [];
        const removeJudges = [];
        for (const raw of rawJudges) {
            if (!judges.includes(raw)) {
                removeJudges.push(raw);
            }
        }
        for (const newJudge of judges) {
            if (!rawJudges.includes(newJudge)) {
                newAddJudges.push(newJudge);
            }
        }
        const res = sequelize.transaction(async () => {
            const [addUserList, removeUserList] = await Promise.all([
                UserModel.findAll({
                    where: {
                        phone: {
                            [Op.in]: newAddJudges,
                        },
                    },
                }),
                UserModel.findAll({
                    where: {
                        phone: {
                            [Op.in]: removeJudges,
                        },
                    },
                }),
            ]);
            const promiseList = [];
            [
                [addUserList, "add"],
                [removeUserList, "remove"],
            ].forEach(([list, key]) => {
                if (list?.length) {
                    for (const { judgementList, phone } of list) {
                        const rawJudgementList = JSON.parse(judgementList || "[]");
                        const newJudgementList = key === "add"
                            ? [...rawJudgementList, id]
                            : rawJudgementList.filter((rawId) => rawId !== id);
                        promiseList.push(UserModel.update({
                            judgementList: JSON.stringify(newJudgementList),
                        }, {
                            where: {
                                phone,
                            },
                        }));
                    }
                }
            });
            promiseList.push(CompetitionModel.update({
                name,
                description,
                address,
                level,
                rounds,
                awards,
                status,
                instructorsNums: JSON.stringify(instructorsNums),
                mode,
                registrationStartTime,
                registrationEndTime,
                workSubmissionStartTime,
                workSubmissionEndTime,
                judges: JSON.stringify(judges),
                files: JSON.stringify(files),
                imgs: JSON.stringify(imgs),
                signUpNums: signUpNums ? JSON.stringify(signUpNums) : signUpNums,
            }, {
                where: {
                    id,
                },
            }));
            // 更新文件
            const rawFiles = JSON.parse(rawCompetition.files || "[]").map((file) => JSON.parse(file).filename);
            const rawImgs = JSON.parse(rawCompetition.imgs || "[]").map((img) => JSON.parse(img).filename);
            const newFiles = files.map((file) => JSON.parse(file).filename);
            const newImgs = imgs.map((img) => JSON.parse(img).filename);
            const [newAddFiles, removeFiles] = getDiff([...rawFiles, ...rawImgs], [...newFiles, ...newImgs]);
            const [newAddFileRecords, removeFileRecords] = await Promise.all([
                FileModel.findAll({
                    raw: true,
                    where: {
                        filename: {
                            [Op.in]: newAddFiles,
                        },
                    },
                }),
                FileModel.findAll({
                    raw: true,
                    where: {
                        filename: {
                            [Op.in]: removeFiles,
                        },
                    },
                }),
            ]);
            for (const { competitionIdList, filename } of newAddFileRecords) {
                const newCompetitionIdList = JSON.parse(competitionIdList || "[]");
                if (!newCompetitionIdList.includes(id)) {
                    newCompetitionIdList.push(id);
                }
                promiseList.push(FileModel.update({
                    competitionIdList: JSON.stringify(newCompetitionIdList),
                }, {
                    where: {
                        filename,
                    },
                }));
            }
            for (const { competitionIdList, filename } of removeFileRecords) {
                const newCompetitionIdList = JSON.parse(competitionIdList || "[]").filter((competitionId) => competitionId !== id);
                promiseList.push(FileModel.update({
                    competitionIdList: JSON.stringify(newCompetitionIdList),
                }, {
                    where: {
                        filename,
                    },
                }));
            }
            await Promise.all(promiseList);
            return serviceReturn({
                code: 200,
                data: "更新成功",
            });
        });
        return res;
    }
    async getSelfCompetition({ phone, pageSize, offset, competitionName, field, }) {
        const [userMsg, subscriptionList] = await Promise.all([
            UserModel.findOne({
                raw: true,
                where: {
                    phone,
                },
            }),
            SubScriptionModel.findAll({
                raw: true,
                attributes: ["competitionId"],
                where: {
                    user: phone,
                },
            }),
        ]);
        const subscriptionSet = new Set(subscriptionList.map((item) => item.competitionId));
        if (field === "releaseList") {
            const returnList = await CompetitionModel.findAndCountAll({
                raw: true,
                order: [["createdAt", "DESC"]],
                where: {
                    opUser: phone,
                    name: {
                        [Op.like]: `%${competitionName}%`,
                    },
                },
                offset,
                limit: pageSize,
            });
            returnList.rows.forEach((list) => {
                list.registrationStartTime = formatTime(list.registrationStartTime);
                list.registrationEndTime = formatTime(list.registrationEndTime);
                list.subscription = subscriptionSet.has(list.id);
            });
            return serviceReturn({
                code: 200,
                data: {
                    list: returnList.rows,
                    count: returnList.count,
                },
            });
        }
        const rawList = userMsg && userMsg[field];
        const list = JSON.parse(rawList || "[]");
        const isJudgeMent = field === "judgementList";
        let returnList;
        if (isJudgeMent) {
            returnList = await CompetitionModel.findAndCountAll({
                raw: true,
                order: [["createdAt", "DESC"]],
                where: {
                    id: { [Op.in]: list },
                    name: {
                        [Op.like]: `%${competitionName}%`,
                    },
                },
                offset,
                limit: pageSize,
            });
            returnList.rows.forEach((list) => {
                list.registrationStartTime = formatTime(list.registrationStartTime);
                list.registrationEndTime = formatTime(list.registrationEndTime);
                list.subscription = subscriptionSet.has(list.id);
            });
        }
        else {
            returnList = await SignUpModel.findAndCountAll({
                raw: true,
                order: [["createdAt", "DESC"]],
                where: {
                    id: { [Op.in]: list },
                    competitionName: {
                        [Op.like]: `%${competitionName}%`,
                    },
                },
                offset,
                limit: pageSize,
            });
            const competitionIdList = returnList.rows.map(({ competitionId }) => competitionId);
            const competitionIdToCurrentRoundMap = new Map();
            const competitionDetailList = await CompetitionModel.findAll({
                raw: true,
                where: {
                    id: {
                        [Op.in]: competitionIdList,
                    },
                },
            });
            competitionDetailList.forEach(({ currentRound, id, status, instructorsNums, judges, opUser, signUpNums, registrationEndTime, }) => competitionIdToCurrentRoundMap.set(id, {
                currentRound,
                status,
                instructorsNums,
                judges,
                opUser,
                signUpNums,
                registrationEndTime,
            }));
            returnList.rows.forEach((item) => {
                const { currentRound, status, instructorsNums, judges, opUser, signUpNums, registrationEndTime, } = competitionIdToCurrentRoundMap.get(Number(item.competitionId)) || {};
                [
                    ["competitionCurrentRound", currentRound],
                    ["competitionStatus", status],
                    ["competitionInstructorsNums", instructorsNums],
                    ["competitionJudges", judges],
                    ["competitionOpUser", opUser],
                    ["competitionSignUpNums", signUpNums],
                    ["competitionRegistrationEndTime", registrationEndTime],
                ].forEach(([key, val]) => {
                    if (val !== undefined) {
                        item[key] = val;
                    }
                });
            });
        }
        return serviceReturn({
            code: 200,
            data: {
                list: returnList.rows,
                count: returnList.count,
            },
        });
    }
    async setCompetitionNextRound(competitionId) {
        const competitionDetail = await CompetitionModel.findOne({
            raw: true,
            where: {
                id: competitionId,
            },
        });
        if (!competitionDetail) {
            return serviceReturn({ code: 400, data: "当前设置的竞赛不存在" });
        }
        const { currentRound, rounds } = competitionDetail;
        const roundsArr = rounds.split("\n");
        const isLastRound = roundsArr[roundsArr.length - 1] === currentRound;
        if (isLastRound) {
            // 修改竞赛状态
            await CompetitionModel.update({
                status: CompetitionStatus.end,
            }, {
                where: {
                    id: competitionId,
                },
            });
        }
        else {
            const index = roundsArr.indexOf(currentRound);
            const nextRound = roundsArr[index + 1];
            const signUpList = await SignUpModel.findAll({
                raw: true,
                where: {
                    currentRound: nextRound,
                    alreadyProcess: AlreadyProcess.yes,
                },
            });
            // 1 修改竞赛当前轮次
            const updateCompetitionPromise = CompetitionModel.update({
                currentRound: nextRound,
            }, {
                where: {
                    id: competitionId,
                },
            });
            // 2 修改报名表中和nextRound相同的报名信息，alreadyProcess设置为0
            const updateSignUpPromise = SignUpModel.update({
                alreadyProcess: AlreadyProcess.no,
            }, {
                where: {
                    id: {
                        [Op.in]: signUpList.map(({ id }) => id),
                    },
                },
            });
            await Promise.all([updateCompetitionPromise, updateSignUpPromise]);
        }
        return serviceReturn({ code: 200, data: "设置成功" });
        // 消息提示
    }
    async deleteCompetition(id, opUser) {
        const [competitionDetail, userDetail] = await Promise.all([
            CompetitionModel.findOne({
                raw: true,
                where: {
                    id,
                },
            }),
            UserModel.findOne({
                raw: true,
                where: {
                    phone: opUser,
                },
            }),
        ]);
        if (!competitionDetail) {
            return serviceReturn({
                code: 400,
                data: "删除的竞赛不存在",
            });
        }
        if (competitionDetail.opUser !== opUser &&
            userDetail.role !== UserRole.admin) {
            return serviceReturn({
                code: 400,
                data: "没有删除该竞赛的权限",
            });
        }
        const res = sequelize.transaction(async () => {
            const promiseList = [];
            const { judges, files, imgs } = competitionDetail;
            const _judges = JSON.parse(judges || "[]");
            const userList = [..._judges];
            const competitionFiles = JSON.parse(files || "[]");
            const competitionImgs = JSON.parse(imgs || "[]");
            const signUpFiles = {};
            const totalFileNames = new Set([
                ...competitionFiles.map((file) => JSON.parse(file).filename),
                ...competitionImgs.map((img) => JSON.parse(img).filename),
            ]);
            // 查找报名信息
            const signUpList = await SignUpModel.findAll({
                where: {
                    competitionId: id,
                },
            });
            const signUpedObj = {};
            const signUpingObj = {};
            const instructoredObj = {};
            const instructoringObj = {};
            const confirmListObj = {};
            // 处理报名信息中的相关用户及文件
            for (const { work, video, member, leader, instructors, resolveMember, id: signUpId, status, } of signUpList) {
                if (work) {
                    const _work = JSON.parse(work);
                    totalFileNames.add(_work.filename);
                    const val = signUpFiles[_work.filename] || [];
                    val.push(signUpId);
                    signUpFiles[_work.filename] = val;
                }
                if (video) {
                    const _video = JSON.parse(video);
                    totalFileNames.add(_video.filename);
                    const val = signUpFiles[_video.filename] || [];
                    val.push(signUpId);
                    signUpFiles[_video.filename] = val;
                }
                const totalMember = [...JSON.parse(member || "[]"), leader];
                const _instructors = JSON.parse(instructors || "[]");
                userList.push(...totalMember, ..._instructors);
                if (status === SignUpStatus.pending) {
                    const _resolveMember = JSON.parse(resolveMember || "[]");
                    for (const mem of totalMember) {
                        if (_resolveMember.includes(mem)) {
                            const val = signUpingObj[mem] || [];
                            val.push(signUpId);
                            signUpingObj[mem] = val;
                        }
                        else {
                            const val = confirmListObj[mem] || [];
                            val.push(signUpId);
                            confirmListObj[mem] = val;
                        }
                    }
                    for (const ins of _instructors) {
                        if (_resolveMember.includes(ins)) {
                            const val = instructoringObj[ins] || [];
                            val.push(signUpId);
                            instructoringObj[ins] = val;
                        }
                        else {
                            const val = confirmListObj[ins] || [];
                            val.push(signUpId);
                            confirmListObj[ins] = val;
                        }
                    }
                }
                else {
                    for (const mem of totalMember) {
                        const val = signUpedObj[mem] || [];
                        val.push(signUpId);
                        signUpedObj[mem] = val;
                    }
                    for (const ins of _instructors) {
                        const val = instructoredObj[ins] || [];
                        val.push(signUpId);
                        instructoredObj[ins] = val;
                    }
                }
                // 删除报名信息
                promiseList.push(SignUpModel.destroy({
                    where: {
                        id: signUpId,
                    },
                }));
            }
            const userInfoList = await UserModel.findAll({
                where: {
                    phone: {
                        [Op.in]: userList,
                    },
                },
            });
            const phoneToUserInfoMap = new Map();
            userInfoList.forEach(({ phone, signUpedList, signUpingList, instructoredList, instructoringList, confirmList, judgementList, }) => {
                [
                    [signUpedList, "signUpedList"],
                    [signUpingList, "signUpingList"],
                    [instructoredList, "instructoredList"],
                    [instructoringList, "instructoringList"],
                    [confirmList, "confirmList"],
                    [judgementList, "judgementList"],
                ].forEach(([list, key]) => {
                    const val = (phoneToUserInfoMap.get(phone) || {});
                    val[key] = JSON.parse(list || "[]");
                    phoneToUserInfoMap.set(phone, val);
                });
            });
            // 处理竞赛相关报名的成员
            [
                [signUpedObj, "signUpedList"],
                [signUpingObj, "signUpingList"],
                [instructoredObj, "instructoredList"],
                [instructoringObj, "instructoringList"],
                [confirmListObj, "confirmList"],
            ].forEach(([obj, updateKey]) => {
                const phones = Object.keys(obj);
                phones.forEach((phone) => {
                    const deleteList = obj[phone] || [];
                    const userInfo = phoneToUserInfoMap.get(phone);
                    const rawList = userInfo[updateKey];
                    const newList = rawList.filter((id) => !deleteList.includes(id));
                    promiseList.push(UserModel.update({
                        [updateKey]: JSON.stringify(newList),
                    }, {
                        where: {
                            phone,
                        },
                    }));
                });
            });
            // 处理裁判
            _judges.forEach((phone) => {
                const userInfo = phoneToUserInfoMap.get(phone);
                const rawList = userInfo.judgementList;
                const newList = rawList.filter((competitionId) => competitionId !== id);
                promiseList.push(UserModel.update({
                    judgementList: JSON.stringify(newList),
                }, {
                    where: {
                        phone,
                    },
                }));
            });
            // 处理竞赛文件
            // 查找所有竞赛文件
            const filenameToFileInfoMap = new Map();
            const fileInfos = await FileModel.findAll({
                raw: true,
                where: {
                    filename: {
                        [Op.in]: [...totalFileNames],
                    },
                },
            });
            fileInfos.forEach(({ competitionIdList, signUpIdList, filename }) => {
                const [list1, list2] = [competitionIdList, signUpIdList].map((list) => JSON.parse(list || "[]"));
                filenameToFileInfoMap.set(filename, {
                    competitionIdList: list1,
                    signUpIdList: list2,
                });
            });
            [competitionFiles, competitionImgs].forEach((files) => {
                files.forEach((_file) => {
                    const file = JSON.parse(_file);
                    const { competitionIdList } = filenameToFileInfoMap.get(file.filename);
                    const newList = competitionIdList.filter((competitionId) => competitionId !== id);
                    promiseList.push(FileModel.update({
                        competitionIdList: JSON.stringify(newList),
                    }, {
                        where: {
                            filename: file.filename,
                        },
                    }));
                });
            });
            for (const filename of Object.keys(signUpFiles)) {
                const removeSignUpIdList = signUpFiles[filename];
                const { signUpIdList } = filenameToFileInfoMap.get(filename);
                const newList = signUpIdList.filter((signUpId) => !removeSignUpIdList.includes(signUpId));
                promiseList.push(FileModel.update({
                    signUpIdList: JSON.stringify(newList),
                }, {
                    where: {
                        filename: filename,
                    },
                }));
            }
            promiseList.push(CompetitionModel.destroy({
                where: {
                    id,
                },
            }));
            promiseList.push(SubScriptionModel.destroy({
                where: {
                    competitionId: id,
                },
            }));
            await Promise.all(promiseList);
            return serviceReturn({
                code: 200,
                data: "删除竞赛成功",
            });
        });
        return res;
    }
}
var competitionService = errCatch(new CompetitionService());

class CompetitionController {
    async getCompetitionList(ctx, next) {
        const { offset, size, level, name, status } = ctx.query;
        const user = ctx.phone;
        const { status: resStatus, data } = await competitionService.getCompetitionList(Number(offset), Number(size), name, level, status, user);
        setResponse(ctx, data, resStatus);
    }
    async getCompetitionDetail(ctx, next) {
        const { id } = ctx.params;
        const user = ctx.phone;
        const { status, data } = await competitionService.getCompetitionDetail(id, user);
        setResponse(ctx, data, status);
    }
    async getCompetitionUser(ctx) {
        const { prefix, role } = ctx.query;
        const { data, status } = await competitionService.getCompetitionUser(prefix, Number(role));
        setResponse(ctx, data, status);
    }
    async getSelfCompetition(ctx) {
        const phone = ctx.phone;
        const { offset, pageSize, competitionName, field } = ctx.query;
        const { data, status } = await competitionService.getSelfCompetition({
            phone,
            offset: Number(offset),
            pageSize: Number(pageSize),
            competitionName,
            field,
        });
        setResponse(ctx, data, status);
    }
    async createCompetition(ctx) {
        const param = ctx.request.body;
        const { data, status } = await competitionService.createCompetition(param, ctx.phone);
        setResponse(ctx, data, status);
    }
    async updateCompetition(ctx) {
        const param = ctx.request.body;
        const { data, status } = await competitionService.updateCompetition(param, param.id, ctx.phone);
        setResponse(ctx, data, status);
    }
    async deleteCompetition(ctx) {
        const { id } = ctx.request.body;
        const { data, status } = await competitionService.deleteCompetition(id, ctx.phone);
        setResponse(ctx, data, status);
    }
    async setCompetitionNextRound(ctx) {
        const { competitionId } = ctx.request.body;
        const { status, data } = await competitionService.setCompetitionNextRound(Number(competitionId));
        setResponse(ctx, data, status);
    }
}
var competitionController = errCatch(new CompetitionController());

const publicKey = readFileSync(resolve(process.cwd(), "public.pem"));
async function verifyToken(ctx, next) {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
        const err = new Error(NOT_AUTHORIZATION);
        ctx.app.emit("error", err, ctx);
        return;
    }
    const token = authorization.replace("Bearer ", "");
    try {
        const { phone } = jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
        });
        ctx.phone = phone;
        ctx.req.phone = phone;
        await next();
    }
    catch (e) {
        const err = new Error(NOT_AUTHORIZATION);
        ctx.app.emit("error", err, ctx);
        return;
    }
}

const competitionRouter = new Router({ prefix: "/competition" });
competitionRouter.get("/list", verifyToken, competitionController.getCompetitionList);
competitionRouter.get("/detail/:id", verifyToken, competitionController.getCompetitionDetail);
competitionRouter.get("/self", verifyToken, competitionController.getSelfCompetition);
competitionRouter.post("/create", verifyToken, competitionController.createCompetition);
competitionRouter.post("/update", verifyToken, competitionController.updateCompetition);
competitionRouter.post('/delete', verifyToken, competitionController.deleteCompetition);
competitionRouter.post("/set/next", verifyToken, competitionController.setCompetitionNextRound);
// 竞赛相关用户，比如发布时选择评委，报名时选择导师，学生
competitionRouter.get("/user", verifyToken, competitionController.getCompetitionUser);

class UploadService {
    async createFileRecord(file) {
        const { filename, originalname, size, destination, path, mimetype } = file;
        const exist = await FileModel.findOne({
            where: {
                filename,
            },
        });
        if (exist) {
            await FileModel.update({
                originalname,
                size,
                destination,
                path,
                mimetype,
            }, {
                where: {
                    filename,
                },
            });
        }
        else {
            console.log("create");
            try {
                await FileModel.create({
                    originalname,
                    size,
                    destination,
                    path,
                    mimetype,
                    filename,
                });
            }
            catch (e) {
                console.log(e);
            }
        }
        return serviceReturn({
            code: 200,
            data: "创建file记录成功",
        });
    }
    async getFile(filename) {
        const file = await FileModel.findOne({
            raw: true,
            where: {
                filename,
            },
        });
        return file;
    }
}
var uploadService = errCatch(new UploadService());

const distPath = resolve(process.cwd(), "./upload");
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, distPath);
    },
    filename(req, file, cb) {
        const contentLength = req.headers["content-length"];
        cb(null, handleFileName(req.phone, contentLength, file.originalname));
    },
});
const upload = multer({
    storage,
    fileFilter(req, file, cb) {
        // 处理文件名乱码
        if (Buffer.from(file.originalname, "latin1").toString("latin1") ===
            file.originalname) {
            file.originalname = Buffer.from(file.originalname, "latin1").toString("utf-8");
        }
        // 处理过后的文件名一致则认为两个文件是一样的
        // 文件名 = contentLength + 用户信息 + 原始文件名
        const phone = req.phone;
        const contentLength = req.headers["content-length"];
        const saveFileName = handleFileName(phone, contentLength, file.originalname);
        req.saveFileName = saveFileName;
        req.originalname = file.originalname;
        if (existsSync(resolve(distPath, saveFileName))) {
            cb(null, false);
        }
        else {
            cb(null, true);
        }
    },
});
class UploadController {
    async uploadFile(ctx, next) {
        await upload.single("file")(ctx, next);
        if (ctx.file) {
            await uploadService.createFileRecord(ctx.file);
        }
        setResponse(ctx, {
            code: 200,
            data: {
                filename: ctx.req.saveFileName,
                originalname: ctx.req.originalname,
            },
        });
    }
    async uploadImg(ctx, next) {
        await upload.single("img")(ctx, next);
        if (ctx.file) {
            await uploadService.createFileRecord(ctx.file);
        }
        setResponse(ctx, {
            code: 200,
            data: {
                filename: ctx.req.saveFileName,
                originalname: ctx.req.originalname,
            },
        });
    }
    async getFile(ctx) {
        const { filename } = ctx.params;
        const file = await uploadService.getFile(filename);
        if (existsSync(file.path)) {
            const stream = createReadStream(file.path);
            ctx.type = file.mimetype;
            ctx.set('Content-Length', String(file.size));
            ctx.set('Accept-Ranges', "bytes");
            setResponse(ctx, stream, 200);
        }
        else {
            setResponse(ctx, {
                data: "找不到对应的文件",
            });
        }
    }
    async uploadWork(ctx, next) {
        await upload.single("work")(ctx, next);
        if (ctx.file) {
            await uploadService.createFileRecord(ctx.file);
        }
        setResponse(ctx, {
            code: 200,
            data: {
                filename: ctx.req.saveFileName,
                originalname: ctx.req.originalname,
            },
        });
    }
    async uploadVideo(ctx, next) {
        await upload.single("video")(ctx, next);
        if (ctx.file) {
            await uploadService.createFileRecord(ctx.file);
        }
        setResponse(ctx, {
            code: 200,
            data: {
                filename: ctx.req.saveFileName,
                originalname: ctx.req.originalname,
            },
        });
    }
}
var uploadController = errCatch(new UploadController());

const uploadRouter = new Router();
uploadRouter.get("/file/:filename", uploadController.getFile);
uploadRouter.post("/upload/competition/file", verifyToken, uploadController.uploadFile);
uploadRouter.post("/upload/competition/img", verifyToken, uploadController.uploadImg);
uploadRouter.post("/upload/signup/work", verifyToken, uploadController.uploadWork);
uploadRouter.post('/upload/signup/video', verifyToken, uploadController.uploadVideo);

class SignUpService {
    async processFileRecord(type, fileString, id, promiseList) {
        const fileInfo = JSON.parse(fileString);
        const record = await FileModel.findOne({
            raw: true,
            where: {
                filename: fileInfo.filename,
            },
        });
        if (!record)
            return;
        const { signUpIdList, filename } = record;
        let newSignUpIdList = JSON.parse(signUpIdList || "[]");
        if (type === "add") {
            if (!newSignUpIdList.includes(id)) {
                newSignUpIdList.push(id);
            }
        }
        else {
            newSignUpIdList = newSignUpIdList.filter((signUpId) => signUpId !== id);
        }
        promiseList.push(FileModel.update({
            signUpIdList: JSON.stringify(newSignUpIdList),
        }, {
            where: {
                filename,
            },
        }));
    }
    async createSignUp({ competitionId, mode, leader, member, instructors, teamName, competitionName, work, video, }) {
        const competition = await CompetitionModel.findOne({
            raw: true,
            where: {
                id: competitionId,
            },
        });
        if (!competition) {
            return serviceReturn({
                code: 400,
                data: "报名的竞赛不存在",
            });
        }
        if (mode === CompetitionMode.team) {
            const existTeamName = await SignUpModel.findOne({
                raw: true,
                where: {
                    competitionId,
                    name: teamName,
                },
            });
            if (existTeamName) {
                return serviceReturn({
                    code: 400,
                    data: "团队名已被使用",
                });
            }
        }
        const _member = member ? JSON.stringify(member) : member;
        const _instructors = JSON.stringify(instructors);
        const res = await sequelize.transaction(async () => {
            // 根据竞赛id找到所有报名过该竞赛的学生以及老师
            // 如果当前要报名的学生或者教师，已经报名过了，返回错误
            const signUpList = await SignUpModel.findAll({
                raw: true,
                where: {
                    competitionId,
                },
            });
            const curMember = [leader, ...(member || [])];
            for (let i = 0, len1 = signUpList.length; i < len1; i++) {
                const { leader, member, instructors } = signUpList[i];
                const membersSet = new Set([
                    leader,
                    ...JSON.parse(member || "[]"),
                    ...JSON.parse(instructors || "[]"),
                ]);
                const repeatMember = [];
                for (let j = 0, len = curMember.length; j < len; j++) {
                    if (membersSet.has(curMember[j])) {
                        repeatMember.push(curMember[j]);
                    }
                }
                if (repeatMember.length !== 0) {
                    return serviceReturn({
                        code: 400,
                        data: `${repeatMember.join(", ")}，已经报名过该竞赛了，请选择其他未参加过该竞赛的成员进行参赛`,
                    });
                }
            }
            const currentRound = competition.rounds.split("\n")[0];
            const signUpMsg = await SignUpModel.create({
                competitionId,
                mode,
                leader,
                name: teamName,
                member: _member,
                instructors: _instructors,
                status: SignUpStatus.pending,
                resolveMember: JSON.stringify([leader]),
                competitionName,
                currentRound,
                alreadyProcess: 0,
                work,
                video,
            });
            const signUpId = signUpMsg.dataValues.id;
            const needUpdateList = await UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: [leader, ...(member || []), ...instructors],
                    },
                },
            });
            const promiseList = [];
            needUpdateList.forEach(({ phone, signUpingList, confirmList }) => {
                if (phone === leader) {
                    const newSignUpingList = JSON.parse(signUpingList || "[]");
                    newSignUpingList.push(signUpId);
                    promiseList.push(UserModel.update({
                        signUpingList: JSON.stringify(newSignUpingList),
                    }, {
                        where: {
                            phone,
                        },
                    }));
                }
                else if ((member || []).includes(phone) ||
                    instructors.includes(phone)) {
                    const newConfirmList = JSON.parse(confirmList || "[]");
                    newConfirmList.push(signUpId);
                    promiseList.push(UserModel.update({
                        confirmList: JSON.stringify(newConfirmList),
                    }, {
                        where: {
                            phone,
                        },
                    }));
                }
            });
            // 更新文件与报名关联
            if (work) {
                await this.processFileRecord("add", work, signUpId, promiseList);
            }
            if (video) {
                await this.processFileRecord("add", video, signUpId, promiseList);
            }
            await Promise.all(promiseList);
            return serviceReturn({
                code: 200,
                data: mode === CompetitionMode.singe
                    ? "报名已提交，所有指导老师同意报名即成功"
                    : "报名已提交，所有队员以及指导老师同意报名即成功",
            });
        });
        return res;
    }
    async confirmSignUp(signUpId, user) {
        const res = await sequelize.transaction(async () => {
            // user 为student
            const signUpInfo = await SignUpModel.findOne({
                raw: true,
                where: {
                    id: signUpId,
                },
            });
            if (!signUpInfo) {
                return serviceReturn({
                    code: 400,
                    data: "当前的报名不存在",
                });
            }
            // 1 将当前用户添加到resolveMember中
            const { resolveMember: rawResolveMember, leader, instructors: rawInstructors, member: rawMember, } = signUpInfo;
            const [resolveMember, instructors, member] = [
                rawResolveMember,
                rawInstructors,
                rawMember,
            ].map((item) => JSON.parse(item || "[]"));
            const teamMember = [leader, ...member];
            const totalTeamMember = [leader, ...member, ...instructors];
            if (!totalTeamMember.includes(user)) {
                return serviceReturn({
                    code: 400,
                    data: "你不在当前的报名队员中，无法确认",
                });
            }
            if (resolveMember.includes(user)) {
                return serviceReturn({
                    code: 400,
                    data: `你已经确认过了，无需重复确认`,
                });
            }
            resolveMember.push(user);
            // 更新signUp表的resolveMember
            await SignUpModel.update({
                resolveMember: JSON.stringify(resolveMember),
            }, {
                where: {
                    id: signUpId,
                },
            });
            // 更新当前用户的confirmList signUpedList signUpingList
            const curUser = await UserModel.findOne({
                raw: true,
                where: {
                    phone: user,
                },
            });
            const { confirmList: rawConfirmList, signUpingList: rawSignUpingList, role, instructoringList: rawInstructoringList, } = curUser;
            const [confirmList, signUpingList, instructoringList] = [
                rawConfirmList,
                rawSignUpingList,
                rawInstructoringList,
            ].map((item) => JSON.parse(item || "[]"));
            const newConfirmList = confirmList.filter((id) => id !== signUpId);
            const updateObj = {
                confirmList: JSON.stringify(newConfirmList),
            };
            if (role === UserRole.student) {
                signUpingList.push(signUpId);
                updateObj.signUpingList = JSON.stringify(signUpingList);
            }
            else if (role === UserRole.teacher) {
                instructoringList.push(signUpId);
                updateObj.instructoringList = JSON.stringify(instructoringList);
            }
            // 更新当前确认用户的confirmList列表
            await UserModel.update(updateObj, {
                where: {
                    phone: user,
                },
            });
            // 2 判断resolveMember是否已经全部同意
            if (resolveMember.length === totalTeamMember.length) {
                // 更新用户
                const userList = await UserModel.findAll({
                    raw: true,
                    where: {
                        phone: {
                            [Op.in]: totalTeamMember,
                        },
                    },
                });
                const promiseList = [];
                userList.forEach(({ phone, signUpedList: rawSignUpedList, signUpingList: rawSignUpingList, instructoredList: rawInstructoredList, instructoringList: rawInstructoringList, }) => {
                    if (instructors.includes(phone)) {
                        // 指导老师
                        const [instructoredList, instructoringList] = [
                            rawInstructoredList,
                            rawInstructoringList,
                        ].map((item) => JSON.parse(item || "[]"));
                        instructoredList.push(signUpId);
                        const newInstructoringList = instructoringList.filter((id) => id !== signUpId);
                        promiseList.push(UserModel.update({
                            instructoredList: JSON.stringify(instructoredList),
                            instructoringList: JSON.stringify(newInstructoringList),
                        }, {
                            where: {
                                phone,
                            },
                        }));
                    }
                    else if (teamMember.includes(phone)) {
                        // 学生
                        const [signUpedList, signUpingList] = [
                            rawSignUpedList,
                            rawSignUpingList,
                        ].map((item) => JSON.parse(item || "[]"));
                        signUpedList.push(signUpId);
                        const newSignUpingList = signUpingList.filter((id) => id !== signUpId);
                        promiseList.push(UserModel.update({
                            signUpedList: JSON.stringify(signUpedList),
                            signUpingList: JSON.stringify(newSignUpingList),
                        }, {
                            where: {
                                phone,
                            },
                        }));
                    }
                });
                // 更新竞赛状态
                promiseList.push(SignUpModel.update({
                    status: SignUpStatus.fulfilled,
                }, {
                    where: {
                        id: signUpId,
                    },
                }));
                await Promise.all(promiseList);
            }
            return serviceReturn({
                code: 200,
                data: "确认成功",
            });
        });
        return res;
    }
    async rejectSignUp(signUpId, user) {
        const res = sequelize.transaction(async () => {
            const signUpInfo = await SignUpModel.findOne({
                raw: true,
                where: {
                    id: signUpId,
                },
            });
            if (!signUpInfo) {
                return serviceReturn({
                    code: 400,
                    data: "当前取消的竞赛不存在",
                });
            }
            const { resolveMember, instructors, member, leader } = signUpInfo;
            const [_resolveMember, _instructors, _member] = [
                resolveMember,
                instructors,
                member,
            ].map((val) => JSON.parse(val || "[]"));
            const studentMember = [..._member, leader];
            const totalMember = [..._instructors, ..._member, leader];
            const userList = await UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: totalMember,
                    },
                },
            });
            const outerSignUpingList = [];
            const outerConfirmList = [];
            for (const mem of studentMember) {
                if (_resolveMember.includes(mem)) {
                    outerSignUpingList.push(mem);
                }
                else {
                    outerConfirmList.push(mem);
                }
            }
            for (const ins of _instructors) {
                if (_resolveMember.includes(ins)) ;
                else {
                    outerConfirmList.push(ins);
                }
            }
            const promiseList = [];
            userList.forEach(({ phone, signUpingList, instructoringList, confirmList }) => {
                const [_singUpingList, _instructoringList, _confirmList] = [
                    signUpingList,
                    instructoringList,
                    confirmList,
                ].map((list) => JSON.parse(list || "[]"));
                const rawList = outerConfirmList.includes(phone)
                    ? _confirmList
                    : outerSignUpingList.includes(phone)
                        ? _singUpingList
                        : _instructoringList;
                const field = outerConfirmList.includes(phone)
                    ? "confirmList"
                    : outerSignUpingList.includes(phone)
                        ? "signUpingList"
                        : "instructoringList";
                const newList = rawList.filter((id) => id !== signUpId);
                promiseList.push(UserModel.update({
                    [field]: JSON.stringify(newList),
                }, {
                    where: {
                        phone,
                    },
                }));
            });
            // 更新文件记录
            const { work, video } = signUpInfo;
            if (work) {
                await this.processFileRecord("remove", work, signUpId, promiseList);
            }
            if (video) {
                await this.processFileRecord("remove", video, signUpId, promiseList);
            }
            promiseList.push(SignUpModel.destroy({
                where: {
                    id: signUpId,
                },
            }));
            await Promise.all(promiseList);
            return serviceReturn({ code: 200, data: "拒绝成功" });
        });
        return res;
    }
    async deleteSignUp(signUpId, user) {
        const signUpInfo = await SignUpModel.findOne({
            where: {
                id: signUpId,
            },
        });
        if (!signUpInfo) {
            return serviceReturn({
                code: 400,
                data: "删除的报名信息不存在",
            });
        }
        const { leader, resolveMember, instructors, member, status, work, video } = signUpInfo;
        if (leader !== user) {
            return serviceReturn({
                code: 400,
                data: "不是报名发起者，无法删除该报名",
            });
        }
        const [_resolveMember, _instructors, _member] = [
            resolveMember,
            instructors,
            member,
        ].map((item) => JSON.parse(item || "[]"));
        const signUpList = [];
        const instructorList = [];
        const confirmList = [];
        const promiseList = [];
        const isPending = status === SignUpStatus.pending;
        for (const ins of _instructors) {
            if (_resolveMember.includes(ins)) {
                instructorList.push(ins);
            }
            else {
                confirmList.push(ins);
            }
        }
        for (const mem of [..._member, leader]) {
            if (_resolveMember.includes(mem)) {
                signUpList.push(mem);
            }
            else {
                confirmList.push(mem);
            }
        }
        const [studentInfoList, instructorInfoList, confirmInfoList] = await Promise.all([
            UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: signUpList,
                    },
                },
            }),
            UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: instructorList,
                    },
                },
            }),
            UserModel.findAll({
                raw: true,
                where: {
                    phone: {
                        [Op.in]: confirmList,
                    },
                },
            }),
        ]);
        // 更新用户与该报名相关联的数据
        [
            [isPending ? "signUpingList" : "signUpedList", studentInfoList],
            [
                isPending ? "instructoringList" : "instructoredList",
                instructorInfoList,
            ],
            ["confirmList", confirmInfoList],
        ].forEach(([key, list]) => {
            if (!list?.length)
                return;
            list.forEach((user) => {
                const rawList = JSON.parse(user[key] || "[]");
                const newList = rawList.filter((id) => id !== signUpId);
                promiseList.push(UserModel.update({
                    [key]: JSON.stringify(newList),
                }, {
                    where: {
                        phone: user.phone,
                    },
                }));
            });
        });
        // 删除文件记录以及文件
        if (work) {
            await this.processFileRecord("remove", work, signUpId, promiseList);
        }
        if (video) {
            await this.processFileRecord("remove", video, signUpId, promiseList);
        }
        // 删除竞赛
        promiseList.push(SignUpModel.destroy({
            where: {
                id: signUpId,
            },
        }));
        await Promise.all(promiseList);
        return serviceReturn({
            code: 200,
            data: "删除报名信息成功",
        });
    }
    async updateSignUpInfo(signUpId, user, { member, instructors, teamName, work, video, }) {
        const signUpInfo = await SignUpModel.findOne({
            raw: true,
            where: {
                id: signUpId,
            },
        });
        if (!signUpInfo) {
            return serviceReturn({
                code: 400,
                data: "当前报名不存在",
            });
        }
        if (signUpInfo.leader !== user) {
            return serviceReturn({
                code: 400,
                data: "不是报名发起者无法修改报名信息",
            });
        }
        const competitionDetail = await CompetitionModel.findOne({
            raw: true,
            attributes: ["status"],
            where: {
                id: signUpInfo.competitionId,
            },
        });
        if (![CompetitionStatus.signUping, CompetitionStatus.uploading].includes(competitionDetail.status)) {
            return serviceReturn({
                code: 400,
                data: "当前阶段无法修改报名信息",
            });
        }
        const res = sequelize.transaction(async () => {
            const updateInfo = {};
            const promiseList = [];
            const rawMember = JSON.parse(signUpInfo.member || "[]");
            const rawInstructors = JSON.parse(signUpInfo.instructors || "[]");
            const rawResolveMember = JSON.parse(signUpInfo.resolveMember || "[]");
            let newResolveMember = JSON.parse(JSON.stringify(rawResolveMember));
            const newTotalMemberCount = (member?.length ?? 0) + (instructors?.length ?? 0) + 1;
            const processMemberOrInstructor = async (type, raw, cur) => {
                const prevStatus = signUpInfo.status;
                const _newResolveMember = JSON.parse(JSON.stringify(newResolveMember));
                // 成员发生更新
                // 1 找到差异人员
                const [add, remove, immutable] = getDiff(raw, cur);
                immutable.push(signUpInfo.leader);
                const [addUserInfoList, removeUserInfoList, immutableUserInfoList] = await Promise.all([
                    UserModel.findAll({
                        raw: true,
                        where: {
                            phone: {
                                [Op.in]: add,
                            },
                        },
                    }),
                    UserModel.findAll({
                        raw: true,
                        where: {
                            phone: {
                                [Op.in]: remove,
                            },
                        },
                    }),
                    UserModel.findAll({
                        raw: true,
                        where: {
                            phone: {
                                [Op.in]: immutable,
                            },
                        },
                    }),
                ]);
                // 新增成员需要更新User表的confirmList
                if (addUserInfoList?.length) {
                    for (const addUserInfo of addUserInfoList) {
                        const { confirmList: _confirmList, phone } = addUserInfo;
                        const rawConfirmList = JSON.parse(_confirmList || "[]");
                        promiseList.push(UserModel.update({
                            confirmList: JSON.stringify([...rawConfirmList, signUpId]),
                        }, {
                            where: {
                                phone,
                            },
                        }));
                    }
                }
                // 删除成员需要判断当前成员是否已经确认过了，如果确认过了需要修改resolveMember字段
                // 在User表中找到该成员关于该报名的信息并且移除
                if (removeUserInfoList?.length) {
                    for (const removeUserInfo of removeUserInfoList) {
                        const { phone, confirmList } = removeUserInfo;
                        // 如果当前用户已经确认过了，那么就需要移除signUpedList或signUpingList的相关数据
                        // 如果当前用户没有确认过，那么就需要移除confirmList的相关数据
                        const idx = _newResolveMember.indexOf(phone);
                        if (idx !== -1) {
                            const field = prevStatus === SignUpStatus.pending
                                ? type === "member"
                                    ? "signUpingList"
                                    : "instructoringList"
                                : type === "member"
                                    ? "signUpedList"
                                    : "instructoredList";
                            const rawList = JSON.parse(removeUserInfo[field] || "[]");
                            const newList = rawList.filter((item) => item !== signUpId);
                            promiseList.push(UserModel.update({
                                [field]: JSON.stringify(newList),
                            }, {
                                where: {
                                    phone,
                                },
                            }));
                            // 更新resolveMember
                            _newResolveMember.splice(idx, 1);
                        }
                        else {
                            const rawConfirmList = JSON.parse(confirmList || "[]");
                            const newConfirmList = rawConfirmList.filter((id) => id !== signUpId);
                            promiseList.push(UserModel.update({
                                confirmList: JSON.stringify(newConfirmList),
                            }, {
                                where: {
                                    phone,
                                },
                            }));
                        }
                    }
                }
                newResolveMember = _newResolveMember;
                if (immutableUserInfoList?.length) {
                    if (_newResolveMember.length === newTotalMemberCount) {
                        // 更新后是所有人都确认的情况
                        if (prevStatus === SignUpStatus.fulfilled) {
                            // 更新前也是所有人都确认的情况
                            return;
                        }
                        else {
                            // 更新前有的人还没确认，更新后所有都确认了。把还没确认的人删除了，就有可能出现该情况
                            for (const { instructoredList, instructoringList, signUpedList, signUpingList, phone, role, } of immutableUserInfoList) {
                                const edList = [
                                    ...JSON.parse(role === UserRole.teacher
                                        ? instructoredList || "[]"
                                        : signUpedList || "[]"),
                                    signUpId,
                                ];
                                const ingList = JSON.parse(role === UserRole.teacher
                                    ? instructoringList || "[]"
                                    : signUpingList || "[]").filter((id) => id !== signUpId);
                                promiseList.push(UserModel.update({
                                    [role === UserRole.teacher
                                        ? "instructoredList"
                                        : "signUpedList"]: JSON.stringify(edList),
                                    [role === UserRole.teacher
                                        ? "instructoringList"
                                        : "signUpingList"]: JSON.stringify(ingList),
                                }, {
                                    where: {
                                        phone,
                                    },
                                }));
                            }
                        }
                    }
                    else {
                        if (prevStatus === SignUpStatus.pending) {
                            // 更新前还有人没确认
                            // 更新后还有人没确认
                            return;
                        }
                        else {
                            // 更新前全部确认了
                            // 更新后还有人没确认
                            for (const { instructoredList, instructoringList, signUpedList, signUpingList, phone, role, } of immutableUserInfoList) {
                                const edList = JSON.parse(role === UserRole.teacher
                                    ? instructoredList || "[]"
                                    : signUpedList || "[]").filter((id) => id !== signUpId);
                                const ingList = [
                                    ...JSON.parse(role === UserRole.teacher
                                        ? instructoringList || "[]"
                                        : signUpingList || "[]"),
                                    signUpId,
                                ];
                                promiseList.push(UserModel.update({
                                    [role === UserRole.teacher
                                        ? "instructoredList"
                                        : "signUpedList"]: JSON.stringify(edList),
                                    [role === UserRole.teacher
                                        ? "instructoringList"
                                        : "signUpingList"]: JSON.stringify(ingList),
                                }, {
                                    where: {
                                        phone,
                                    },
                                }));
                            }
                        }
                    }
                }
            };
            if (member?.length) {
                updateInfo.member = JSON.stringify(member);
                await processMemberOrInstructor("member", rawMember, member);
            }
            if (instructors?.length) {
                updateInfo.instructors = JSON.stringify(instructors);
                await processMemberOrInstructor("instructor", rawInstructors, instructors);
            }
            [
                ["video", video || null],
                ["name", teamName || null],
                ["work", work],
            ].forEach(([key, val]) => {
                updateInfo[key] = val;
            });
            // 文件处理
            const rawWork = signUpInfo.work;
            const rawVideo = signUpInfo.video;
            for (const [raw, cur] of [
                [rawWork, work],
                [rawVideo, video],
            ]) {
                if (!raw && cur) {
                    // 之前没有现在有
                    await this.processFileRecord("add", cur, signUpId, promiseList);
                }
                if (raw && !cur) {
                    // 之前有现在没有
                    await this.processFileRecord("remove", raw, signUpId, promiseList);
                }
                if (raw && cur) {
                    // 之前有现在也有
                    if (raw !== cur) {
                        // 前后不一致
                        await this.processFileRecord("remove", raw, signUpId, promiseList);
                        await this.processFileRecord("add", cur, signUpId, promiseList);
                    }
                }
            }
            await Promise.all(promiseList);
            await SignUpModel.update({
                ...updateInfo,
                status: newTotalMemberCount === newResolveMember.length
                    ? SignUpStatus.fulfilled
                    : SignUpStatus.pending,
                resolveMember: JSON.stringify(newResolveMember),
            }, {
                where: {
                    id: signUpId,
                },
            });
            return serviceReturn({
                code: 200,
                data: "更新成功",
            });
        });
        return res;
    }
    async getSignUpListByCompetitionId(competitionId, user, alreadyProcess) {
        const competitionDetail = await CompetitionModel.findOne({
            raw: true,
            where: {
                id: competitionId,
            },
        });
        const currentRound = competitionDetail.currentRound;
        const rounds = competitionDetail.rounds.split("\n");
        const nextRoundIndex = rounds.indexOf(currentRound);
        const nextRound = rounds[nextRoundIndex + 1];
        const whereOptions = {
            competitionId,
            status: SignUpStatus.fulfilled,
        };
        if (competitionDetail?.status === CompetitionStatus.end ||
            user === competitionDetail?.opUser) ;
        else if (alreadyProcess === AlreadyProcess.no) {
            whereOptions.currentRound = currentRound;
            whereOptions.alreadyProcess = alreadyProcess;
        }
        else {
            whereOptions.currentRound = {
                [Op.in]: nextRound ? [currentRound, nextRound] : [currentRound],
            };
            whereOptions.alreadyProcess = alreadyProcess;
        }
        const signUpList = await SignUpModel.findAndCountAll({
            raw: true,
            where: whereOptions,
        });
        return serviceReturn({
            code: 200,
            data: {
                signUpList: signUpList.rows,
                total: signUpList.count,
            },
        });
    }
    async promoteSignUpBySignUpId(signUpId, currentRound) {
        const res = await SignUpModel.update({
            currentRound,
            alreadyProcess: 1,
        }, {
            where: {
                id: signUpId,
            },
        });
        if (res) {
            return serviceReturn({ code: 200, data: "状态修改成功" });
        }
        else {
            return serviceReturn({ code: 400, data: "状态修改失败" });
        }
    }
    async awardSignUpBySignUpId(signUpId, award) {
        const updateObj = {
            alreadyProcess: AlreadyProcess.yes,
        };
        if (award !== "") {
            updateObj.award = award;
        }
        else {
            updateObj.award = null;
        }
        await SignUpModel.update(updateObj, {
            where: {
                id: signUpId,
            },
        });
        return serviceReturn({ code: 200, data: "操作成功" });
    }
}
var signUpService = errCatch(new SignUpService());

class SignUpController {
    async createSignUp(ctx) {
        const { competitionId, mode, instructors, leader, member, teamName, competitionName, work, video, } = ctx.request.body;
        const { data, status } = await signUpService.createSignUp({
            competitionId,
            mode,
            instructors,
            leader,
            member,
            teamName,
            competitionName,
            work,
            video,
        });
        return setResponse(ctx, data, status);
    }
    async confirmSignUp(ctx) {
        const { signUpId } = ctx.request.body;
        const user = ctx.phone;
        const { data, status } = await signUpService.confirmSignUp(signUpId, user);
        setResponse(ctx, data, status);
    }
    async rejectSignUp(ctx) {
        const { signUpId } = ctx.request.body;
        const user = ctx.phone;
        const { status, data } = await signUpService.rejectSignUp(signUpId, user);
        setResponse(ctx, data, status);
    }
    async deleteSignUp(ctx) {
        const { signUpId } = ctx.request.body;
        const user = ctx.phone;
        console.log(signUpId);
        const { status, data } = await signUpService.deleteSignUp(signUpId, user);
        setResponse(ctx, data, status);
    }
    async deleteSignUpFile(path) {
        if (existsSync$1(path)) {
            rmSync(path);
        }
    }
    async getSignUpListByCompetitionId(ctx) {
        const { competitionId } = ctx.params;
        const user = ctx.phone;
        const { alreadyProcess } = ctx.query;
        const { status, data } = await signUpService.getSignUpListByCompetitionId(competitionId, user, Number(alreadyProcess));
        setResponse(ctx, data, status);
    }
    async promoteSignUpBySignUpId(ctx) {
        const { signUpId, currentRound } = ctx.request.body;
        const { status, data } = await signUpService.promoteSignUpBySignUpId(signUpId, currentRound);
        setResponse(ctx, data, status);
    }
    async updateSignUpInfo(ctx) {
        const user = ctx.phone;
        const { id, member, instructors, teamName, work, video } = ctx.request
            .body;
        const { status, data } = await signUpService.updateSignUpInfo(id, user, {
            member,
            instructors,
            teamName,
            work,
            video,
        });
        setResponse(ctx, data, status);
    }
    async awardSignUpBySignUpId(ctx) {
        const { signUpId, award } = ctx.request.body;
        const { status, data } = await signUpService.awardSignUpBySignUpId(signUpId, award);
        setResponse(ctx, data, status);
    }
}
var signUpController = errCatch(new SignUpController());

const signUpRouter = new Router({ prefix: "/signup" });
signUpRouter.post("/create", verifyToken, signUpController.createSignUp);
signUpRouter.post("/confirm", verifyToken, signUpController.confirmSignUp);
signUpRouter.post("/reject", verifyToken, signUpController.rejectSignUp);
signUpRouter.post("/delete", verifyToken, signUpController.deleteSignUp);
signUpRouter.get("/:competitionId", verifyToken, signUpController.getSignUpListByCompetitionId);
signUpRouter.post("/update", verifyToken, signUpController.updateSignUpInfo);
signUpRouter.post("/promote", verifyToken, signUpController.promoteSignUpBySignUpId);
signUpRouter.post("/award", verifyToken, signUpController.awardSignUpBySignUpId);

class UserService {
    async getUserList(pageSize, offset, filter) {
        const userList = await UserModel.findAndCountAll({
            raw: true,
            attributes: ["phone", "role", "createdAt", "updatedAt", "isDisable"],
            order: [["createdAt", "DESC"]],
            offset,
            limit: pageSize,
            where: {
                role: {
                    [Op.in]: [UserRole.student, UserRole.teacher],
                },
                phone: {
                    [Op.like]: `%${filter}%`,
                },
            },
        });
        return serviceReturn({
            code: 200,
            data: {
                list: userList.rows.map(({ phone, role, createdAt, updatedAt, isDisable }) => ({
                    phone,
                    role,
                    isDisable,
                    createdAt: formatTime(createdAt?.toString()),
                    updatedAt: formatTime(updatedAt?.toString()),
                })),
                total: userList.count,
            },
        });
    }
    async updateUserIsDisable(updateUser, isDisable, opUser) {
        const [opUserInfo, updateUserInfo] = await Promise.all([
            UserModel.findOne({
                raw: true,
                attributes: ["role"],
                where: {
                    phone: opUser,
                },
            }),
            UserModel.findOne({
                raw: true,
                where: {
                    phone: updateUser,
                },
            }),
        ]);
        if (!updateUserInfo) {
            return serviceReturn({
                code: 400,
                data: "修改的用户不存在",
            });
        }
        if (opUserInfo?.role !== UserRole.admin) {
            return serviceReturn({
                code: 400,
                data: "没有修改用户的权限",
            });
        }
        await UserModel.update({
            isDisable,
        }, {
            where: {
                phone: updateUser,
            },
        });
        return serviceReturn({
            code: 200,
            data: "更新成功",
        });
    }
}
var userService = errCatch(new UserService());

class UserController {
    async getUserList(ctx) {
        const { pageSize, offset, filter } = ctx.query;
        const { data, status } = await userService.getUserList(Number(pageSize), Number(offset), filter);
        setResponse(ctx, data, status);
    }
    async updateIsDisable(ctx) {
        const { isDisable, user } = ctx.request.body;
        const opUser = ctx.phone;
        const { status, data } = await userService.updateUserIsDisable(user, isDisable, opUser);
        setResponse(ctx, data, status);
    }
}
var userController = errCatch(new UserController());

const userRouter = new Router({ prefix: "/user" });
userRouter.get("/list", verifyToken, userController.getUserList);
userRouter.post('/update/is-disable', verifyToken, userController.updateIsDisable);

class SubscriptionService {
    async subscribe(user, competitionId) {
        const alreadySubscribe = await SubScriptionModel.findOne({
            where: {
                user,
                competitionId,
            },
        });
        if (alreadySubscribe) {
            SubScriptionModel.destroy({
                where: {
                    competitionId,
                    user,
                },
            });
            return serviceReturn({
                code: 200,
                data: "取消订阅成功",
            });
        }
        else {
            await SubScriptionModel.create({
                user,
                competitionId,
            });
            return serviceReturn({
                code: 200,
                data: "订阅成功",
            });
        }
    }
}
var subscriptionService = errCatch(new SubscriptionService());

class SubscriptionController {
    async subscribe(ctx) {
        const user = ctx.phone;
        const { competitionId } = ctx.request.body;
        const { data, status } = await subscriptionService.subscribe(user, competitionId);
        setResponse(ctx, data, status);
    }
}
var subscriptionController = errCatch(new SubscriptionController());

const subscriptionRouter = new Router({ prefix: '/subscription' });
subscriptionRouter.post('/subscribe', verifyToken, subscriptionController.subscribe);

var router = /*#__PURE__*/Object.freeze({
    __proto__: null,
    competitionRouter: competitionRouter,
    loginRouter: loginRouter,
    registerRouter: registerRouter$1,
    signUpRouter: signUpRouter,
    subscriptionRouter: subscriptionRouter,
    uploadRouter: uploadRouter,
    userRouter: userRouter
});

const errorHandle = (err, ctx) => {
    let status, body;
    switch (err.message) {
        case PHONE_PASSWORD_ROLE_IS_REQUIRED:
            status = 400;
            body = {
                code: 400,
                data: "手机号或密码或角色不能为空",
            };
            break;
        case PHONE_PASSWORD_IS_REQUIRED:
            status = 400;
            body = {
                code: 400,
                data: "手机号或密码不能为空",
            };
            break;
        case NOT_AUTHORIZATION:
            status = 401;
            body = {
                code: 400,
                data: "token无效，请重新登录",
            };
            break;
    }
    setResponse(ctx, body, status);
};

const app = new Koa();
const registerRouter = (app, router) => {
    for (const key in router) {
        app.use(router[key].routes());
        app.use(router[key].allowedMethods());
    }
};
app.use(cors());
app.use(bodyParser());
registerRouter(app, router);
app.on("error", errorHandle);
app.listen(8080, () => {
    schedule(syncCompetitionStatus);
    console.log("running");
});
