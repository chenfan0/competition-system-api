import { UserModel } from "../model/UserModel";
import { encrypt, errCatch, serviceReturn } from "../utils";

class LoginService {
  async login({ password, phone }: { password: string; phone: string }) {
    const isPhoneExist = await UserModel.findOne({
      raw: true,
      where: {
        phone,
      },
      attributes: ["password", 'role'],
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
    return serviceReturn({
      code: 200,
      data: {
        phone,
        role: isPhoneExist.role
      },
    });
  }
}

export default errCatch(new LoginService());
