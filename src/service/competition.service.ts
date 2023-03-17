import { CompetitionModel } from "../model/CompetitionModel";
import {
  errCatch,
  formatTime,
  getCompetitionStatus,
  serviceReturn,
} from "../utils";
import { Op } from "sequelize";
import { UserModel } from "../model/UserModel";
import { UserRole } from "../constant";
import { sequelize } from "../connect";
import { SignUpModel } from "../model/SignUpModel";
import { CompetitionStatus, AlreadyProcess } from "../constant/index";

export interface CreateCompetitionDataType {
  name: string;
  description: string;
  address: string;
  level: string;
  instructorsNums: string;
  mode: number;
  rounds: string;
  registrationTime: [string, string];
  workSubmissionTime: [string, string];
  judges: string[];
  files: Set<string>;
  signUpNums?: number[];
  awards: string;
}

type FieldType =
  | "signUpedList"
  | "signUpingList"
  | "confirmList"
  | "instructoredList"
  | "instructoringList"
  | "judgementList";

class CompetitionService {
  async getCompetitionList(
    offset = 0,
    size = 10,
    name: string,
    level: string,
    status: string
  ) {
    const orOptions: { level?: string; status?: string } = {};
    if (level !== "") {
      orOptions.level = level;
    }
    if (status !== "") {
      orOptions.status = status;
    }

    const competitionList = await CompetitionModel.findAndCountAll({
      raw: true,
      attributes: [
        "name",
        "level",
        "id",
        "address",
        "registrationStartTime",
        "registrationEndTime",
        "status",
      ],
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
    });

    return serviceReturn({
      code: 200,
      data: {
        total: competitionList.count,
        list: competitionList.rows.map(
          ({
            name,
            level,
            id,
            address,
            registrationStartTime,
            registrationEndTime,
            status,
          }) => ({
            id,
            name,
            level,
            address,
            registrationStartTime: formatTime(registrationStartTime),
            registrationEndTime: formatTime(registrationEndTime),
            status,
          })
        ),
      },
    });
  }

  async getCompetitionDetail(id: string, user: string) {
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
    const {
      registrationStartTime,
      registrationEndTime,
      workSubmissionStartTime,
      workSubmissionEndTime,
      status,
    } = competitionDetail!;
    const {
      signUpedList,
      signUpingList,
      confirmList,
      role,
      instructoredList,
      instructoringList,
    } = userInfo!;
    let signUp = false;
    let leader, signUpId, work, video, instructors, member, name;

    switch (role) {
      case UserRole.student:
      case UserRole.teacher:
        const signUpIdList = [
          ...JSON.parse(
            (role === UserRole.student ? signUpedList : instructoredList) ||
              "[]"
          ),
          ...JSON.parse(
            (role === UserRole.student ? signUpingList : instructoringList) ||
              "[]"
          ),
          ...JSON.parse(confirmList || "[]"),
        ] as number[];
        const competitionMap = new Map<
          string,
          {
            leader: string;
            id: number;
            instructors: string;
            member: string;
            work: string;
            video: string;
            name: string;
          }
        >();
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
          leader = signInfo!.leader;
          signUpId = signInfo!.id;
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
      default:
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

  async getCompetitionUser(phonePrefix: string, role: UserRole) {
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

  async createCompetition(data: CreateCompetitionDataType, opUser: string) {
    const {
      name,
      description,
      address,
      level,
      instructorsNums,
      mode,
      rounds,
      registrationTime,
      workSubmissionTime,
      judges,
      files,
      signUpNums,
      awards,
    } = data;
    const registrationStartTime = formatTime(registrationTime[0]);
    const registrationEndTime = formatTime(registrationTime[1]);
    const workSubmissionStartTime = formatTime(workSubmissionTime[0]);
    const workSubmissionEndTime = formatTime(workSubmissionTime[1]);
    const parse = Date.parse;
    const status = getCompetitionStatus(
      parse(registrationStartTime),
      parse(registrationEndTime),
      parse(workSubmissionStartTime),
      parse(workSubmissionEndTime)
    );
    await sequelize.transaction(async () => {
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
        opUser,
        signUpNums: signUpNums ? JSON.stringify(signUpNums) : signUpNums,
      });
      const competitionId = createResult.dataValues.id;

      const judgeList = await UserModel.findAll({
        raw: true,
        where: {
          phone: {
            [Op.in]: judges,
          },
        },
      });
      const promiseList: Promise<any>[] = [];
      // 更新user表中，judgementList
      judgeList.forEach((judge) => {
        const newJudgementList = JSON.parse(
          judge.judgementList || "[]"
        ) as number[];
        newJudgementList.push(competitionId!);
        promiseList.push(
          UserModel.update(
            {
              judgementList: JSON.stringify(newJudgementList),
            },
            {
              where: {
                phone: judge.phone,
              },
            }
          )
        );
      });
      await Promise.all(promiseList);
    });

    return serviceReturn({
      code: 200,
      data: "创建成功",
    });
  }

  async getSelfCompetition({
    phone,
    pageSize,
    offset,
    competitionName,
    field,
  }: {
    phone: string;
    pageSize: number;
    offset: number;
    competitionName: string;
    field: FieldType;
  }) {
    const userMsg = await UserModel.findOne({
      raw: true,
      where: {
        phone,
      },
    });
    const rawList = userMsg && userMsg[field];
    const list = JSON.parse(rawList || "[]") as number[];
    const isJudgeMent = field === "judgementList";
    let returnList: {
      rows: (SignUpModel | CompetitionModel)[];
      count: number;
    };
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
      (returnList.rows as CompetitionModel[]).forEach((list) => {
        (list as CompetitionModel).registrationStartTime = formatTime(
          list.registrationStartTime
        );
        list.registrationEndTime = formatTime(list.registrationEndTime);
      });
    } else {
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
      const competitionIdList = (returnList.rows as SignUpModel[]).map(
        ({ competitionId }) => competitionId
      );
      const competitionIdToCurrentRoundMap = new Map<
        number,
        {
          currentRound: string;
          status: number;
          instructorsNums: string;
          judges: string;
          opUser: string;
          signUpNums: string;
          registrationEndTime: string;
        }
      >();
      const competitionDetailList = await CompetitionModel.findAll({
        raw: true,
        where: {
          id: {
            [Op.in]: competitionIdList,
          },
        },
      });
      competitionDetailList.forEach(
        ({
          currentRound,
          id,
          status,
          instructorsNums,
          judges,
          opUser,
          signUpNums,
          registrationEndTime,
        }) =>
          competitionIdToCurrentRoundMap.set(id, {
            currentRound,
            status,
            instructorsNums,
            judges,
            opUser,
            signUpNums,
            registrationEndTime,
          })
      );
      (returnList.rows as SignUpModel[]).forEach((item) => {
        const {
          currentRound,
          status,
          instructorsNums,
          judges,
          opUser,
          signUpNums,
          registrationEndTime,
        } =
          competitionIdToCurrentRoundMap.get(Number(item.competitionId)) || {};
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
            (item as any)[key!] = val;
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

  async setCompetitionNextRound(competitionId: number) {
    const competitionDetail = await CompetitionModel.findOne({
      raw: true,
      where: {
        id: competitionId,
      },
    });
    if (!competitionDetail) {
      return serviceReturn({ code: 400, data: "当前设置的竞赛不存在" });
    }
    const { currentRound, rounds } = competitionDetail!;
    const roundsArr = rounds.split("\n");
    const isLastRound = roundsArr[roundsArr.length - 1] === currentRound;
    if (isLastRound) {
      // 修改竞赛状态
      await CompetitionModel.update(
        {
          status: CompetitionStatus.end,
        },
        {
          where: {
            id: competitionId,
          },
        }
      );
    } else {
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
      const updateCompetitionPromise = CompetitionModel.update(
        {
          currentRound: nextRound,
        },
        {
          where: {
            id: competitionId,
          },
        }
      );
      // 2 修改报名表中和nextRound相同的报名信息，alreadyProcess设置为0
      const updateSignUpPromise = SignUpModel.update(
        {
          alreadyProcess: AlreadyProcess.no,
        },
        {
          where: {
            id: {
              [Op.in]: signUpList.map(({ id }) => id),
            },
          },
        }
      );
      await Promise.all([updateCompetitionPromise, updateSignUpPromise]);
    }
    return serviceReturn({ code: 200, data: "设置成功" });
    // 消息提示
  }

  async deleteCompetition() {}

  async updateCompetition() {}
}

export default errCatch(new CompetitionService());
