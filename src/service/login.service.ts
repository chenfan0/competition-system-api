import { UserModel } from "../model/UserModel";
import { encrypt, errCatch, serviceReturn } from "../utils";
import { UserDisable } from "../constant/index";

class LoginService {
  async login({ password, phone }: { password: string; phone: string }) {
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

export default errCatch(new LoginService());
