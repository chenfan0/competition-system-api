import { errCatch } from "../utils";
import { UserModel } from "../model/UserModel";
import { serviceReturn, formatTime } from "../utils/index";
import { Op } from "sequelize";
import { UserRole } from "../constant/index";

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
}

export default errCatch(new UserService());
