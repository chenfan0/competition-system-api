import { errCatch } from "../utils";
import { UserModel } from "../model/UserModel";
import { serviceReturn, formatTime } from "../utils/index";
import { Op } from "sequelize";
import { UserRole, CompetitionStatus } from "../constant/index";
import { SignUpModel } from "../model/SignUpModel";
import { CompetitionModel } from "../model/CompetitionModel";

class UserService {
  async getUserList(pageSize: number, offset: number, filter: string) {
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
        list: userList.rows.map(
          ({ phone, role, createdAt, updatedAt, isDisable }) => ({
            phone,
            role,
            isDisable,
            createdAt: formatTime(createdAt?.toString()!),
            updatedAt: formatTime(updatedAt?.toString()!),
          })
        ),
        total: userList.count,
      },
    });
  }

  async updateUserIsDisable(
    updateUser: string,
    isDisable: number,
    opUser: string
  ) {
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
    await UserModel.update(
      {
        isDisable,
      },
      {
        where: {
          phone: updateUser,
        },
      }
    );
    return serviceReturn({
      code: 200,
      data: "更新成功",
    });
  }

  async updateUserInterested(interested: number[], user: string) {
    await UserModel.update(
      {
        interested: JSON.stringify(interested),
      },
      {
        where: {
          phone: user,
        },
      }
    );

    return serviceReturn({
      code: 200,
      data: "更新成功",
    });
  }

  async updateUserAvatar(user: string, avatar: string) {
    await UserModel.update(
      {
        avatar,
      },
      {
        where: {
          phone: user,
        },
      }
    );
    return serviceReturn({
      code: 200,
      data: "更新成功",
    });
  }

  async getUserAwardList(user: string) {
    const userInfo = await UserModel.findOne({
      raw: true,
      where: {
        phone: user,
      },
    });
    if (!userInfo) {
      return serviceReturn({
        code: 400,
        data: "当前用户不存在",
      });
    }
    const role = userInfo.role;
    const filed =
      role === UserRole.student ? "signUpedList" : "instructoredList";
    const signUpList = JSON.parse(userInfo[filed] || "[]") as number[];
    const signUpInfoList = await SignUpModel.findAll({
      raw: true,
      where: {
        id: {
          [Op.in]: signUpList,
        },
        award: {
          [Op.not]: null as any,
        },
      },
    });

    const competitionIdList = signUpInfoList.map((info) =>
      Number(info.competitionId)
    );
    const finishCompetitionIdList = (
      await CompetitionModel.findAll({
        raw: true,
        attributes: ["id"],
        where: {
          id: {
            [Op.in]: competitionIdList,
          },
          status: CompetitionStatus.end,
        },
      })
    ).map((info) => info.id);
    return serviceReturn({
      code: 200,
      data: {
        list: signUpInfoList.filter((info) =>
          finishCompetitionIdList.includes(Number(info.competitionId))
        ),
      },
    });
  }
}

export default errCatch(new UserService());
