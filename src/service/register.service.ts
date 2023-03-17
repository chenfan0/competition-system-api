import { UserModel } from "../model/UserModel";
import { encrypt, errCatch, serviceReturn } from "../utils";

type Param = { phone: string; password: string; role: number };

class RegisterService {
  async register(param: Param) {
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

export default errCatch(new RegisterService());
