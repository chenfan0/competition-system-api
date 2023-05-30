import { CompetitionModel } from "../model/CompetitionModel";
import {
  errCatch,
  formatTime,
  getCompetitionStatus,
  getDiff,
  serviceReturn,
} from "../utils";
import { Op } from "sequelize";
import { UserModel } from "../model/UserModel";
import { CompetitionMode, UserRole } from "../constant";
import { sequelize } from "../connect";
import { SignUpModel } from "../model/SignUpModel";
import {
  CompetitionStatus,
  AlreadyProcess,
  SignUpStatus,
} from "../constant/index";
import { FileModel } from "../model/FileModel";
import { SubScriptionModel } from "../model/SubscriptionModel";
import { TagCompetitionMapModel } from "../model/TagCompetitionMapModel";
import { TagModel } from "../model/TagModel";

import ExcelJS from "exceljs";

export interface CreateCompetitionDataType {
  id?: number;
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
  tags: number[];
  files: string[];
  imgs: string[];
  signUpNums?: number[];
  awards: string;
}

type FieldType =
  | "signUpedList"
  | "signUpingList"
  | "confirmList"
  | "instructoredList"
  | "instructoringList"
  | "judgementList"
  | "releaseList"
  | "subscriptionList";

class CompetitionService {
  async getCompetitionList(
    offset = 0,
    size = 10,
    name: string,
    level: string,
    status: string,
    user: string
  ) {
    const orOptions: { level?: string; status?: string } = {};
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
    const subscriptionSet = new Set<number>(
      subscriptionList.map((item) => item.competitionId)
    );

    return serviceReturn({
      code: 200,
      data: {
        total: competitionList.count,
        list: competitionList.rows.map((item) => {
          const {
            name,
            level,
            id,
            address,
            registrationStartTime,
            registrationEndTime,
            status,
            workSubmissionStartTime,
            workSubmissionEndTime,
          } = item;
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
    const tags = JSON.parse(competitionDetail?.tags || "[]");
    const tagNameList = (
      await TagModel.findAll({
        raw: true,
        attributes: ["name"],
        where: {
          id: {
            [Op.in]: tags,
          },
        },
      })
    ).map((tag) => tag.name);
    console.log(tagNameList);

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
        tags: tagNameList,
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
    const userInfo = await UserModel.findOne({
      raw: true,
      where: {
        phone: opUser,
      },
    });
    if (![UserRole.admin, UserRole.teacher].includes(userInfo!.role)) {
      return serviceReturn({
        code: 400,
        data: "当前用户没有创建竞赛的权限",
      });
    }
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
      tags,
      files,
      imgs,
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
        tags: JSON.stringify(tags),
        files: JSON.stringify(files),
        imgs: JSON.stringify(imgs),
        opUser,
        signUpNums: signUpNums ? JSON.stringify(signUpNums) : signUpNums,
      });
      const competitionId = createResult.dataValues.id!;

      const addFilesRecord = async (files: string[]) => {
        const promiseList: Promise<unknown>[] = [];
        const _files = files.map((file) => {
          const _file = JSON.parse(file) as {
            filename: string;
            originalname: string;
          };
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
          const newCompetitionIdList = JSON.parse(
            competitionIdList || "[]"
          ) as number[];
          if (!newCompetitionIdList.includes(competitionId)) {
            newCompetitionIdList.push(competitionId);
          }
          promiseList.push(
            FileModel.update(
              {
                competitionIdList: JSON.stringify(newCompetitionIdList),
              },
              {
                where: {
                  filename,
                },
              }
            )
          );
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
      tags.forEach((tagId) => {
        promiseList.push(
          TagCompetitionMapModel.create({
            competitionId,
            tagId,
          })
        );
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

  async updateCompetition(
    data: CreateCompetitionDataType,
    id: number,
    user: string
  ) {
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
    if (userInfo?.role !== UserRole.admin && rawCompetition.opUser !== user) {
      return serviceReturn({
        code: 400,
        data: "没有修改改竞赛的权限",
      });
    }

    const rawJudges = JSON.parse(rawCompetition.judges || "[]") as string[];
    const rawTags = JSON.parse(rawCompetition.tags || "[]") as number[];
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
      tags,
      files,
      imgs,
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

    const newAddJudges: string[] = [];
    const removeJudges: string[] = [];

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
      const promiseList: Promise<unknown>[] = [];
      const newTags = tags || [];
      const [newAddTags, removeTags] = getDiff(rawTags, newTags);
      newAddTags.forEach((tagId) => {
        promiseList.push(
          TagCompetitionMapModel.create({
            competitionId: data.id,
            tagId,
          })
        );
      });
      promiseList.push(
        TagCompetitionMapModel.destroy({
          where: {
            tagId: {
              [Op.in]: removeTags,
            },
            competitionId: data.id,
          },
        })
      );
      (
        [
          [addUserList, "add"],
          [removeUserList, "remove"],
        ] as const
      ).forEach(([list, key]) => {
        if (list?.length) {
          for (const { judgementList, phone } of list) {
            const rawJudgementList = JSON.parse(
              judgementList || "[]"
            ) as number[];
            const newJudgementList =
              key === "add"
                ? [...rawJudgementList, id]
                : rawJudgementList.filter((rawId) => rawId !== id);
            promiseList.push(
              UserModel.update(
                {
                  judgementList: JSON.stringify(newJudgementList),
                },
                {
                  where: {
                    phone,
                  },
                }
              )
            );
          }
        }
      });
      promiseList.push(
        CompetitionModel.update(
          {
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
            tags: JSON.stringify(tags),
            files: JSON.stringify(files),
            imgs: JSON.stringify(imgs),
            signUpNums: signUpNums ? JSON.stringify(signUpNums) : signUpNums,
          },
          {
            where: {
              id,
            },
          }
        )
      );

      // 更新文件
      const rawFiles = (
        JSON.parse(rawCompetition.files || "[]") as string[]
      ).map((file) => JSON.parse(file).filename as string);
      const rawImgs = (JSON.parse(rawCompetition.imgs || "[]") as string[]).map(
        (img) => JSON.parse(img).filename as string
      );
      const newFiles = files.map((file) => JSON.parse(file).filename as string);
      const newImgs = imgs.map((img) => JSON.parse(img).filename as string);
      const [newAddFiles, removeFiles] = getDiff(
        [...rawFiles, ...rawImgs],
        [...newFiles, ...newImgs]
      );

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
        const newCompetitionIdList = JSON.parse(
          competitionIdList || "[]"
        ) as number[];
        if (!newCompetitionIdList.includes(id)) {
          newCompetitionIdList.push(id);
        }
        promiseList.push(
          FileModel.update(
            {
              competitionIdList: JSON.stringify(newCompetitionIdList),
            },
            {
              where: {
                filename,
              },
            }
          )
        );
      }

      for (const { competitionIdList, filename } of removeFileRecords) {
        const newCompetitionIdList = (
          JSON.parse(competitionIdList || "[]") as number[]
        ).filter((competitionId) => competitionId !== id);
        promiseList.push(
          FileModel.update(
            {
              competitionIdList: JSON.stringify(newCompetitionIdList),
            },
            {
              where: {
                filename,
              },
            }
          )
        );
      }

      await Promise.all(promiseList);
      return serviceReturn({
        code: 200,
        data: "更新成功",
      });
    });

    return res;
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
    const subscriptionSet = new Set<number>(
      subscriptionList.map((item) => item.competitionId)
    );
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
      (returnList.rows as CompetitionModel[]).forEach((list) => {
        list.registrationStartTime = formatTime(list.registrationStartTime);
        list.registrationEndTime = formatTime(list.registrationEndTime);
        (list as any).subscription = subscriptionSet.has(list.id);
      });
      return serviceReturn({
        code: 200,
        data: {
          list: returnList.rows,
          count: returnList.count,
        },
      });
    }
    if (field === "subscriptionList") {
      const returnList = await CompetitionModel.findAndCountAll({
        raw: true,
        order: [["createdAt", "DESC"]],
        where: {
          id: {
            [Op.in]: [...subscriptionSet],
          },
          name: {
            [Op.like]: `%${competitionName}%`,
          },
        },
        offset,
        limit: pageSize,
      });
      (returnList.rows as CompetitionModel[]).forEach((list) => {
        list.registrationStartTime = formatTime(list.registrationStartTime);
        list.registrationEndTime = formatTime(list.registrationEndTime);
        (list as any).subscription = true;
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
        list.registrationStartTime = formatTime(list.registrationStartTime);
        list.registrationEndTime = formatTime(list.registrationEndTime);
        (list as any).subscription = subscriptionSet.has(list.id);
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

  async deleteCompetition(id: number, opUser: string) {
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

    if (
      competitionDetail.opUser !== opUser &&
      userDetail!.role !== UserRole.admin
    ) {
      return serviceReturn({
        code: 400,
        data: "没有删除该竞赛的权限",
      });
    }

    const res = sequelize.transaction(async () => {
      const promiseList: Promise<unknown>[] = [];
      const { judges, files, imgs, tags } = competitionDetail!;
      const tagIdList = JSON.parse(tags || "[]") as number[];
      const _judges = JSON.parse(judges || "[]") as string[];
      const userList: string[] = [..._judges];

      const competitionFiles = JSON.parse(files || "[]") as string[];
      const competitionImgs = JSON.parse(imgs || "[]") as string[];
      const signUpFiles: Record<string, number[]> = {};
      const totalFileNames = new Set<string>([
        ...competitionFiles.map((file) => JSON.parse(file).filename),
        ...competitionImgs.map((img) => JSON.parse(img).filename),
      ]);
      // 查找报名信息
      const signUpList = await SignUpModel.findAll({
        where: {
          competitionId: id,
        },
      });
      const signUpedObj: Record<string, number[]> = {};
      const signUpingObj: Record<string, number[]> = {};
      const instructoredObj: Record<string, number[]> = {};
      const instructoringObj: Record<string, number[]> = {};
      const confirmListObj: Record<string, number[]> = {};
      // 处理报名信息中的相关用户及文件
      for (const {
        work,
        video,
        member,
        leader,
        instructors,
        resolveMember,
        id: signUpId,
        status,
      } of signUpList) {
        if (work) {
          const _work = JSON.parse(work) as { filename: string };
          totalFileNames.add(_work.filename);
          const val = signUpFiles[_work.filename] || [];
          val.push(signUpId);
          signUpFiles[_work.filename] = val;
        }
        if (video) {
          const _video = JSON.parse(video) as { filename: string };
          totalFileNames.add(_video.filename);
          const val = signUpFiles[_video.filename] || [];
          val.push(signUpId);
          signUpFiles[_video.filename] = val;
        }
        const totalMember = [...JSON.parse(member || "[]"), leader] as string[];
        const _instructors = JSON.parse(instructors || "[]") as string[];
        userList.push(...totalMember, ..._instructors);
        if (status === SignUpStatus.pending) {
          const _resolveMember = JSON.parse(resolveMember || "[]") as string[];
          for (const mem of totalMember) {
            if (_resolveMember.includes(mem)) {
              const val = signUpingObj[mem] || [];
              val.push(signUpId);
              signUpingObj[mem] = val;
            } else {
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
            } else {
              const val = confirmListObj[ins] || [];
              val.push(signUpId);
              confirmListObj[ins] = val;
            }
          }
        } else {
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
        promiseList.push(
          SignUpModel.destroy({
            where: {
              id: signUpId,
            },
          })
        );
      }
      const userInfoList = await UserModel.findAll({
        where: {
          phone: {
            [Op.in]: userList,
          },
        },
      });
      const phoneToUserInfoMap = new Map<
        string,
        {
          signUpedList: number[];
          signUpingList: number[];
          instructoredList: number[];
          instructoringList: number[];
          confirmList: number[];
          judgementList: number[];
        }
      >();

      userInfoList.forEach(
        ({
          phone,
          signUpedList,
          signUpingList,
          instructoredList,
          instructoringList,
          confirmList,
          judgementList,
        }) => {
          (
            [
              [signUpedList, "signUpedList"],
              [signUpingList, "signUpingList"],
              [instructoredList, "instructoredList"],
              [instructoringList, "instructoringList"],
              [confirmList, "confirmList"],
              [judgementList, "judgementList"],
            ] as const
          ).forEach(([list, key]) => {
            const val = (phoneToUserInfoMap.get(phone) || {}) as {
              signUpedList: number[];
              signUpingList: number[];
              instructoredList: number[];
              instructoringList: number[];
              confirmList: number[];
              judgementList: number[];
            };
            val[key] = JSON.parse(list || "[]");
            phoneToUserInfoMap.set(phone, val);
          });
        }
      );
      // 处理竞赛相关报名的成员
      (
        [
          [signUpedObj, "signUpedList"],
          [signUpingObj, "signUpingList"],
          [instructoredObj, "instructoredList"],
          [instructoringObj, "instructoringList"],
          [confirmListObj, "confirmList"],
        ] as const
      ).forEach(([obj, updateKey]) => {
        const phones = Object.keys(obj);
        phones.forEach((phone) => {
          const deleteList = obj[phone] || [];
          const userInfo = phoneToUserInfoMap.get(phone)!;
          const rawList = userInfo[updateKey];
          const newList = rawList.filter((id) => !deleteList.includes(id));
          promiseList.push(
            UserModel.update(
              {
                [updateKey]: JSON.stringify(newList),
              },
              {
                where: {
                  phone,
                },
              }
            )
          );
        });
      });
      // 处理裁判
      _judges.forEach((phone) => {
        const userInfo = phoneToUserInfoMap.get(phone)!;
        const rawList = userInfo.judgementList;
        const newList = rawList.filter((competitionId) => competitionId !== id);
        promiseList.push(
          UserModel.update(
            {
              judgementList: JSON.stringify(newList),
            },
            {
              where: {
                phone,
              },
            }
          )
        );
      });
      // 处理竞赛文件
      // 查找所有竞赛文件
      const filenameToFileInfoMap = new Map<
        string,
        { competitionIdList: number[]; signUpIdList: number[] }
      >();
      const fileInfos = await FileModel.findAll({
        raw: true,
        where: {
          filename: {
            [Op.in]: [...totalFileNames],
          },
        },
      });
      fileInfos.forEach(({ competitionIdList, signUpIdList, filename }) => {
        const [list1, list2] = [competitionIdList, signUpIdList].map(
          (list) => JSON.parse(list || "[]") as number[]
        );
        filenameToFileInfoMap.set(filename, {
          competitionIdList: list1,
          signUpIdList: list2,
        });
      });
      [competitionFiles, competitionImgs].forEach((files) => {
        files.forEach((_file) => {
          const file = JSON.parse(_file) as { filename: string };
          const { competitionIdList } = filenameToFileInfoMap.get(
            file.filename
          )!;
          const newList = competitionIdList.filter(
            (competitionId) => competitionId !== id
          );
          promiseList.push(
            FileModel.update(
              {
                competitionIdList: JSON.stringify(newList),
              },
              {
                where: {
                  filename: file.filename,
                },
              }
            )
          );
        });
      });
      for (const filename of Object.keys(signUpFiles)) {
        const removeSignUpIdList = signUpFiles[filename];
        const { signUpIdList } = filenameToFileInfoMap.get(filename)!;
        const newList = signUpIdList.filter(
          (signUpId) => !removeSignUpIdList.includes(signUpId)
        );
        promiseList.push(
          FileModel.update(
            {
              signUpIdList: JSON.stringify(newList),
            },
            {
              where: {
                filename: filename,
              },
            }
          )
        );
      }
      // 删除标签
      promiseList.push(
        TagCompetitionMapModel.destroy({
          where: {
            competitionId: {
              [Op.in]: tagIdList,
            },
          },
        })
      );

      promiseList.push(
        CompetitionModel.destroy({
          where: {
            id,
          },
        })
      );

      promiseList.push(
        SubScriptionModel.destroy({
          where: {
            competitionId: id,
          },
        })
      );
      await Promise.all(promiseList);
      return serviceReturn({
        code: 200,
        data: "删除竞赛成功",
      });
    });
    return res;
  }

  async getRecommendCompetition(user: string) {
    const userDetail = await UserModel.findOne({
      attributes: ["interested"],
      where: {
        phone: user,
      },
      raw: true,
    });
    const recommendId = JSON.parse(userDetail?.interested || "[]") as number[];

    const recommendCompetitionIdList = (
      await TagCompetitionMapModel.findAll({
        raw: true,
        attributes: ["competitionId"],
        order: [["createdAt", "DESC"]],
        where: {
          tagId: {
            [Op.in]: recommendId,
          },
        },
      })
    ).map((item) => item.competitionId);
    const [competitionList, defaultList, subscriptionList] = await Promise.all([
      CompetitionModel.findAll({
        raw: true,
        order: [["createdAt", "DESC"]],
        where: {
          id: {
            [Op.in]: recommendCompetitionIdList,
          },
        },
        limit: 5,
      }),
      CompetitionModel.findAll({
        raw: true,
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      SubScriptionModel.findAll({
        raw: true,
        attributes: ["competitionId"],
        where: {
          user,
        },
      }),
    ]);
    const subscriptionSet = new Set<number>(
      subscriptionList.map((item) => item.competitionId)
    );
    const [returnList, defaultReturnList] = [competitionList, defaultList].map(
      (list) => {
        return list.map((item) => {
          const {
            name,
            level,
            id,
            address,
            registrationStartTime,
            registrationEndTime,
            status,
            workSubmissionStartTime,
            workSubmissionEndTime,
          } = item;
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
        });
      }
    );

    return serviceReturn({
      code: 200,
      data: {
        list: returnList.length ? returnList : defaultReturnList,
      },
    });
  }

  async getCompetitionLevelData() {
    const competitionDetailList = await CompetitionModel.findAll({
      raw: true,
      attributes: ["level"],
    });
    const competitionLevelData = [
      { value: 0, name: "国家级" },
      { value: 0, name: "省级" },
      { value: 0, name: "市级" },
      { value: 0, name: "校级" },
      { value: 0, name: "院级" },
    ];
    competitionDetailList.forEach((detail) => {
      competitionLevelData[Number(detail.level)].value += 1;
    });
    return serviceReturn({
      code: 200,
      data: competitionLevelData,
    });
  }

  async getCompetitionStatusData() {
    const keys = [
      "竞赛未开始",
      "报名进行中",
      "等待开放作品提交",
      "作品上传中",
      "评委评判中",
      "竞赛已结束",
    ];
    const values = new Array(keys.length).fill(0);
    const competitionStatusList = await CompetitionModel.findAll({
      raw: true,
      attributes: ["status"],
    });
    competitionStatusList.forEach((item) => (values[item.status] += 1));

    return serviceReturn({
      code: 200,
      data: {
        keys,
        values,
      },
    });
  }

  async getCompetitionTagData() {
    const tagList = await TagModel.findAll({
      raw: true,
    });
    const tagIdToTagNameMap: Record<string, string> = {};
    const tagNameMap: Record<string, number> = {};
    tagList.forEach((tag) => (tagIdToTagNameMap[tag.id] = tag.name));
    const competitionTagList = await TagCompetitionMapModel.findAll({
      raw: true,
    });
    competitionTagList.forEach((item) => {
      const tagName = tagIdToTagNameMap[item.tagId];
      const val = tagNameMap[tagName] || 0;
      tagNameMap[tagName] = val + 1;
    });
    const returnList: { value: number; name: string }[] = [];
    const tagNames = Object.keys(tagNameMap);
    for (const tagName of tagNames) {
      returnList.push({
        value: tagNameMap[tagName],
        name: tagName,
      });
    }
    return serviceReturn({
      code: 200,
      data: returnList.filter((item) => item.value !== 0),
    });
  }

  async getAwardsExcel(competitionId: string) {
    const competition = await CompetitionModel.findOne({
      raw: true,
      attributes: ["status", "name"],
      where: {
        id: competitionId,
      },
    });
    if (competition?.status !== CompetitionStatus.end) {
      return serviceReturn({
        code: 400,
        data: "当前阶段无法生成excel",
      });
    }

    const signUpList = await SignUpModel.findAll({
      raw: true,
      where: {
        competitionId,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // 设置首行的标题
    console.log(signUpList);

    const headerRow = worksheet.getRow(1);
    headerRow.getCell(1).value = "成员";
    headerRow.getCell(2).value = "指导老师";
    headerRow.getCell(3).value = "竞赛轮次";
    headerRow.getCell(4).value = "获得奖项";

    // 添加数据行

    try {
      signUpList.forEach((signUpInfo, index) => {
        const row = worksheet.getRow(index + 2);
        row.getCell(1).value =
          signUpInfo.leader + JSON.parse(signUpInfo.member || "[]").join(",");
        row.getCell(2).value = JSON.parse(signUpInfo.instructors || "[]").join(",");
        row.getCell(3).value = signUpInfo.currentRound;
        row.getCell(4).value = signUpInfo.award || "未获奖";
      });
    } catch(e) {
      console.log(e);
      
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return serviceReturn({
      code: 200,
      data: {
        name: competition?.name,
        buffer,
      },
    });
  }
}

export default errCatch(new CompetitionService());
