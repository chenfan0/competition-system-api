import { Op } from "sequelize";
import { sequelize } from "../connect";
import { CompetitionMode, SignUpStatus } from "../constant";
import { CompetitionModel } from "../model/CompetitionModel";
import { SignUpModel } from "../model/SignUpModel";
import { UserModel } from "../model/UserModel";
import { errCatch, serviceReturn } from "../utils";
import { UserRole, AlreadyProcess, CompetitionStatus } from "../constant/index";
import { getDiff } from "../utils/index";
import { FileModel } from "../model/FileModel";

interface SignUpInfo {
  competitionId: number;
  mode: number;
  leader: string;
  member?: string[];
  instructors: string[];
  teamName?: string;
  competitionName: string;
  work?: string;
  video?: string;
}

class SignUpService {
  private async processFileRecord(
    type: "add" | "remove",
    fileString: string,
    id: number,
    promiseList: any[]
  ) {
    const fileInfo: { filename: string; originalname: string } = JSON.parse(
      fileString
    ) as {
      filename: string;
      originalname: string;
    };
    const record = await FileModel.findOne({
      raw: true,
      where: {
        filename: fileInfo.filename,
      },
    });
    if (!record) return;
    const { signUpIdList, filename } = record;
    let newSignUpIdList = JSON.parse(signUpIdList || "[]") as number[];
    if (type === "add") {
      if (!newSignUpIdList.includes(id)) {
        newSignUpIdList.push(id);
      }
    } else {
      newSignUpIdList = newSignUpIdList.filter((signUpId) => signUpId !== id);
    }
    promiseList.push(
      FileModel.update(
        {
          signUpIdList: JSON.stringify(newSignUpIdList),
        },
        {
          where: {
            filename,
          },
        }
      )
    );
  }

  async createSignUp({
    competitionId,
    mode,
    leader,
    member,
    instructors,
    teamName,
    competitionName,
    work,
    video,
  }: SignUpInfo) {
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
        const repeatMember: string[] = [];
        for (let j = 0, len = curMember.length; j < len; j++) {
          if (membersSet.has(curMember[j])) {
            repeatMember.push(curMember[j]);
          }
        }
        if (repeatMember.length !== 0) {
          return serviceReturn({
            code: 400,
            data: `${repeatMember.join(
              ", "
            )}，已经报名过该竞赛了，请选择其他未参加过该竞赛的成员进行参赛`,
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
      const signUpId = signUpMsg.dataValues.id!;

      const needUpdateList = await UserModel.findAll({
        raw: true,
        where: {
          phone: {
            [Op.in]: [leader, ...(member || []), ...instructors],
          },
        },
      });

      const promiseList: Promise<any>[] = [];
      needUpdateList.forEach(({ phone, signUpingList, confirmList }) => {
        if (phone === leader) {
          const newSignUpingList = JSON.parse(
            signUpingList || "[]"
          ) as number[];
          newSignUpingList.push(signUpId);
          promiseList.push(
            UserModel.update(
              {
                signUpingList: JSON.stringify(newSignUpingList),
              },
              {
                where: {
                  phone,
                },
              }
            )
          );
        } else if (
          (member || []).includes(phone) ||
          instructors.includes(phone)
        ) {
          const newConfirmList = JSON.parse(confirmList || "[]") as number[];
          newConfirmList.push(signUpId);
          promiseList.push(
            UserModel.update(
              {
                confirmList: JSON.stringify(newConfirmList),
              },
              {
                where: {
                  phone,
                },
              }
            )
          );
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
        data:
          mode === CompetitionMode.singe
            ? "报名已提交，所有指导老师同意报名即成功"
            : "报名已提交，所有队员以及指导老师同意报名即成功",
      });
    });

    return res!;
  }

  async confirmSignUp(signUpId: number, user: string) {
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
      const {
        resolveMember: rawResolveMember,
        leader,
        instructors: rawInstructors,
        member: rawMember,
      } = signUpInfo;
      const [resolveMember, instructors, member] = [
        rawResolveMember,
        rawInstructors,
        rawMember,
      ].map((item) => JSON.parse(item || "[]") as string[]);
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
      await SignUpModel.update(
        {
          resolveMember: JSON.stringify(resolveMember),
        },
        {
          where: {
            id: signUpId,
          },
        }
      );
      // 更新当前用户的confirmList signUpedList signUpingList
      const curUser = await UserModel.findOne({
        raw: true,
        where: {
          phone: user,
        },
      });
      const {
        confirmList: rawConfirmList,
        signUpingList: rawSignUpingList,
        role,
        instructoringList: rawInstructoringList,
      } = curUser!;
      const [confirmList, signUpingList, instructoringList] = [
        rawConfirmList,
        rawSignUpingList,
        rawInstructoringList,
      ].map((item) => JSON.parse(item || "[]") as number[]);
      const newConfirmList = confirmList.filter((id) => id !== signUpId);
      const updateObj: {
        confirmList: string;
        signUpingList?: string;
        instructoringList?: string;
      } = {
        confirmList: JSON.stringify(newConfirmList),
      };
      if (role === UserRole.student) {
        signUpingList.push(signUpId);
        updateObj.signUpingList = JSON.stringify(signUpingList);
      } else if (role === UserRole.teacher) {
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
        const promiseList: Promise<unknown>[] = [];
        userList.forEach(
          ({
            phone,
            signUpedList: rawSignUpedList,
            signUpingList: rawSignUpingList,
            instructoredList: rawInstructoredList,
            instructoringList: rawInstructoringList,
          }) => {
            if (instructors.includes(phone)) {
              // 指导老师
              const [instructoredList, instructoringList] = [
                rawInstructoredList,
                rawInstructoringList,
              ].map((item) => JSON.parse(item || "[]") as number[]);
              instructoredList.push(signUpId);
              const newInstructoringList = instructoringList.filter(
                (id) => id !== signUpId
              );
              promiseList.push(
                UserModel.update(
                  {
                    instructoredList: JSON.stringify(instructoredList),
                    instructoringList: JSON.stringify(newInstructoringList),
                  },
                  {
                    where: {
                      phone,
                    },
                  }
                )
              );
            } else if (teamMember.includes(phone)) {
              // 学生
              const [signUpedList, signUpingList] = [
                rawSignUpedList,
                rawSignUpingList,
              ].map((item) => JSON.parse(item || "[]") as number[]);
              signUpedList.push(signUpId);
              const newSignUpingList = signUpingList.filter(
                (id) => id !== signUpId
              );
              promiseList.push(
                UserModel.update(
                  {
                    signUpedList: JSON.stringify(signUpedList),
                    signUpingList: JSON.stringify(newSignUpingList),
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
        );
        // 更新竞赛状态
        promiseList.push(
          SignUpModel.update(
            {
              status: SignUpStatus.fulfilled,
            },
            {
              where: {
                id: signUpId,
              },
            }
          )
        );
        await Promise.all(promiseList);
      }
      return serviceReturn({
        code: 200,
        data: "确认成功",
      });
    });
    return res!;
  }

  async rejectSignUp(signUpId: number, user: string) {
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
      ].map((val) => JSON.parse(val || "[]") as string[]);
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
      const outerSignUpingList: string[] = [];
      const outerInstructoringList: string[] = [];
      const outerConfirmList: string[] = [];
      for (const mem of studentMember) {
        if (_resolveMember.includes(mem)) {
          outerSignUpingList.push(mem);
        } else {
          outerConfirmList.push(mem);
        }
      }
      for (const ins of _instructors) {
        if (_resolveMember.includes(ins)) {
          outerInstructoringList.push(ins);
        } else {
          outerConfirmList.push(ins);
        }
      }
      const promiseList: Promise<unknown>[] = [];
      userList.forEach(
        ({ phone, signUpingList, instructoringList, confirmList }) => {
          const [_singUpingList, _instructoringList, _confirmList] = [
            signUpingList,
            instructoringList,
            confirmList,
          ].map((list) => JSON.parse(list || "[]") as number[]);
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
          promiseList.push(
            UserModel.update(
              {
                [field]: JSON.stringify(newList),
              },
              {
                where: {
                  phone,
                },
              }
            )
          );
        }
      );

      // 更新文件记录
      const { work, video } = signUpInfo;
      if (work) {
        await this.processFileRecord("remove", work, signUpId, promiseList);
      }
      if (video) {
        await this.processFileRecord("remove", video, signUpId, promiseList);
      }

      promiseList.push(
        SignUpModel.destroy({
          where: {
            id: signUpId,
          },
        })
      );
      await Promise.all(promiseList);
      return serviceReturn({ code: 200, data: "拒绝成功" });
    });

    return res;
  }

  async deleteSignUp(signUpId: number, user: string) {
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
    const { leader, resolveMember, instructors, member, status, work, video } =
      signUpInfo;
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
    ].map((item) => JSON.parse(item || "[]") as string[]);
    const signUpList: string[] = [];
    const instructorList: string[] = [];
    const confirmList: string[] = [];
    const promiseList: Promise<unknown>[] = [];

    const isPending = status === SignUpStatus.pending;

    for (const ins of _instructors) {
      if (_resolveMember.includes(ins)) {
        instructorList.push(ins);
      } else {
        confirmList.push(ins);
      }
    }
    for (const mem of [..._member, leader]) {
      if (_resolveMember.includes(mem)) {
        signUpList.push(mem);
      } else {
        confirmList.push(mem);
      }
    }
    const [studentInfoList, instructorInfoList, confirmInfoList] =
      await Promise.all([
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
    (
      [
        [isPending ? "signUpingList" : "signUpedList", studentInfoList],
        [
          isPending ? "instructoringList" : "instructoredList",
          instructorInfoList,
        ],
        ["confirmList", confirmInfoList],
      ] as const
    ).forEach(([key, list]) => {
      if (!list?.length) return;
      list.forEach((user) => {
        const rawList = JSON.parse(user[key] || "[]") as number[];
        const newList = rawList.filter((id) => id !== signUpId);
        promiseList.push(
          UserModel.update(
            {
              [key]: JSON.stringify(newList),
            },
            {
              where: {
                phone: user.phone,
              },
            }
          )
        );
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
    promiseList.push(
      SignUpModel.destroy({
        where: {
          id: signUpId,
        },
      })
    );
    await Promise.all(promiseList);
    return serviceReturn({
      code: 200,
      data: "删除报名信息成功",
    });
  }

  async updateSignUpInfo(
    signUpId: number,
    user: string,
    {
      member,
      instructors,
      teamName,
      work,
      video,
    }: {
      member?: string[];
      instructors?: string[];
      teamName?: string;
      work?: string;
      video?: string;
    }
  ) {
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
    if (
      ![CompetitionStatus.signUping, CompetitionStatus.uploading].includes(
        competitionDetail!.status
      )
    ) {
      return serviceReturn({
        code: 400,
        data: "当前阶段无法修改报名信息",
      });
    }
    const res = sequelize.transaction(async () => {
      const updateInfo: {
        member?: string;
        instructors?: string;
        name?: string;
        work?: string;
        video?: string;
      } = {};
      const promiseList: Promise<unknown>[] = [];
      const rawMember = JSON.parse(signUpInfo.member || "[]") as string[];
      const rawInstructors = JSON.parse(
        signUpInfo.instructors || "[]"
      ) as string[];
      const rawResolveMember = JSON.parse(
        signUpInfo.resolveMember || "[]"
      ) as string[];
      let newResolveMember: string[] = JSON.parse(
        JSON.stringify(rawResolveMember)
      ) as string[];
      const newTotalMemberCount =
        (member?.length ?? 0) + (instructors?.length ?? 0) + 1;
      const processMemberOrInstructor = async (
        type: "member" | "instructor",
        raw: string[],
        cur: string[]
      ) => {
        const prevStatus = signUpInfo.status;
        const _newResolveMember = JSON.parse(
          JSON.stringify(newResolveMember)
        ) as string[];

        // 成员发生更新
        // 1 找到差异人员
        const [add, remove, immutable] = getDiff(raw, cur);
        immutable.push(signUpInfo.leader);
        const [addUserInfoList, removeUserInfoList, immutableUserInfoList] =
          await Promise.all([
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
            const rawConfirmList = JSON.parse(_confirmList || "[]") as number[];

            promiseList.push(
              UserModel.update(
                {
                  confirmList: JSON.stringify([...rawConfirmList, signUpId]),
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

        // 删除成员需要判断当前成员是否已经确认过了，如果确认过了需要修改resolveMember字段
        // 在User表中找到该成员关于该报名的信息并且移除
        if (removeUserInfoList?.length) {
          for (const removeUserInfo of removeUserInfoList) {
            const { phone, confirmList } = removeUserInfo;
            // 如果当前用户已经确认过了，那么就需要移除signUpedList或signUpingList的相关数据
            // 如果当前用户没有确认过，那么就需要移除confirmList的相关数据
            const idx = _newResolveMember.indexOf(phone);
            if (idx !== -1) {
              const field =
                prevStatus === SignUpStatus.pending
                  ? type === "member"
                    ? "signUpingList"
                    : "instructoringList"
                  : type === "member"
                  ? "signUpedList"
                  : "instructoredList";
              const rawList = JSON.parse(
                removeUserInfo[field] || "[]"
              ) as number[];
              const newList = rawList.filter((item) => item !== signUpId);
              promiseList.push(
                UserModel.update(
                  {
                    [field]: JSON.stringify(newList),
                  },
                  {
                    where: {
                      phone,
                    },
                  }
                )
              );
              // 更新resolveMember
              _newResolveMember.splice(idx, 1);
            } else {
              const rawConfirmList = JSON.parse(
                confirmList || "[]"
              ) as number[];
              const newConfirmList = rawConfirmList.filter(
                (id) => id !== signUpId
              );
              promiseList.push(
                UserModel.update(
                  {
                    confirmList: JSON.stringify(newConfirmList),
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
        }
        newResolveMember = _newResolveMember;
        if (immutableUserInfoList?.length) {
          if (_newResolveMember.length === newTotalMemberCount) {
            // 更新后是所有人都确认的情况
            if (prevStatus === SignUpStatus.fulfilled) {
              // 更新前也是所有人都确认的情况
              return;
            } else {
              // 更新前有的人还没确认，更新后所有都确认了。把还没确认的人删除了，就有可能出现该情况
              for (const {
                instructoredList,
                instructoringList,
                signUpedList,
                signUpingList,
                phone,
                role,
              } of immutableUserInfoList) {
                const edList = [
                  ...(JSON.parse(
                    role === UserRole.teacher
                      ? instructoredList || "[]"
                      : signUpedList || "[]"
                  ) as number[]),
                  signUpId,
                ];
                const ingList = (
                  JSON.parse(
                    role === UserRole.teacher
                      ? instructoringList || "[]"
                      : signUpingList || "[]"
                  ) as number[]
                ).filter((id) => id !== signUpId);
                promiseList.push(
                  UserModel.update(
                    {
                      [role === UserRole.teacher
                        ? "instructoredList"
                        : "signUpedList"]: JSON.stringify(edList),
                      [role === UserRole.teacher
                        ? "instructoringList"
                        : "signUpingList"]: JSON.stringify(ingList),
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
          } else {
            if (prevStatus === SignUpStatus.pending) {
              // 更新前还有人没确认
              // 更新后还有人没确认
              return;
            } else {
              // 更新前全部确认了
              // 更新后还有人没确认
              for (const {
                instructoredList,
                instructoringList,
                signUpedList,
                signUpingList,
                phone,
                role,
              } of immutableUserInfoList) {
                const edList = (
                  JSON.parse(
                    role === UserRole.teacher
                      ? instructoredList || "[]"
                      : signUpedList || "[]"
                  ) as number[]
                ).filter((id) => id !== signUpId);
                const ingList = [
                  ...(JSON.parse(
                    role === UserRole.teacher
                      ? instructoringList || "[]"
                      : signUpingList || "[]"
                  ) as number[]),
                  signUpId,
                ];
                promiseList.push(
                  UserModel.update(
                    {
                      [role === UserRole.teacher
                        ? "instructoredList"
                        : "signUpedList"]: JSON.stringify(edList),
                      [role === UserRole.teacher
                        ? "instructoringList"
                        : "signUpingList"]: JSON.stringify(ingList),
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
          }
        }
      };
      if (member?.length) {
        updateInfo.member = JSON.stringify(member);
        await processMemberOrInstructor("member", rawMember, member);
      }
      if (instructors?.length) {
        updateInfo.instructors = JSON.stringify(instructors);
        await processMemberOrInstructor(
          "instructor",
          rawInstructors,
          instructors
        );
      }

      (
        [
          ["video", video || null],
          ["name", teamName || null],
          ["work", work],
        ] as const
      ).forEach(([key, val]) => {
        updateInfo[key] = val as any;
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

      await SignUpModel.update(
        {
          ...updateInfo,
          status:
            newTotalMemberCount === newResolveMember.length
              ? SignUpStatus.fulfilled
              : SignUpStatus.pending,
          resolveMember: JSON.stringify(newResolveMember),
        },
        {
          where: {
            id: signUpId,
          },
        }
      );
      return serviceReturn({
        code: 200,
        data: "更新成功",
      });
    });
    return res;
  }

  async getSignUpListByCompetitionId(
    competitionId: number,
    user: string,
    alreadyProcess: number
  ) {
    const competitionDetail = await CompetitionModel.findOne({
      raw: true,
      where: {
        id: competitionId,
      },
    });
    const currentRound = competitionDetail!.currentRound;
    const rounds = competitionDetail!.rounds.split("\n");
    const nextRoundIndex = rounds.indexOf(currentRound);
    const nextRound = rounds[nextRoundIndex + 1];
    const whereOptions: {
      competitionId: number;
      status: number;
      alreadyProcess?: number;
      currentRound?:
        | string
        | {
            [key: symbol]: string[];
          };
    } = {
      competitionId,
      status: SignUpStatus.fulfilled,
    };
    if (
      competitionDetail?.status === CompetitionStatus.end ||
      user === competitionDetail?.opUser
    ) {
    } else if (alreadyProcess === AlreadyProcess.no) {
      whereOptions.currentRound = currentRound;
      whereOptions.alreadyProcess = alreadyProcess;
    } else {
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

  async promoteSignUpBySignUpId(signUpId: number, currentRound: string) {
    const res = await SignUpModel.update(
      {
        currentRound,
        alreadyProcess: 1,
      },
      {
        where: {
          id: signUpId,
        },
      }
    );
    if (res) {
      return serviceReturn({ code: 200, data: "状态修改成功" });
    } else {
      return serviceReturn({ code: 400, data: "状态修改失败" });
    }
  }

  async awardSignUpBySignUpId(signUpId: number, award: string) {
    const updateObj: { alreadyProcess: number; award?: string } = {
      alreadyProcess: AlreadyProcess.yes,
    };
    if (award !== "") {
      updateObj.award = award;
    } else {
      updateObj.award = null as any
    }
    await SignUpModel.update(updateObj, {
      where: {
        id: signUpId,
      },
    });

    return serviceReturn({ code: 200, data: "操作成功" });
  }
}

export default errCatch(new SignUpService());
