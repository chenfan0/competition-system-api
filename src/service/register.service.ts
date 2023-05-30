import svgCaptcha from "svg-captcha";
import { RegisterCodeModel } from "../model/RegisterCodeModel";

import { UserModel } from "../model/UserModel";
import { encrypt, errCatch, serviceReturn } from "../utils";
import { sendRegisterSms } from "../utils/sms";

type Param = { phone: string; password: string; role: number; sCode: string };

class RegisterService {
  async register(param: Param) {
    const { phone, password, role, sCode } = param;

    if (!phone || !password || role === undefined || !sCode) {
      return serviceReturn({
        code: 400,
        data: "参数错误",
      });
    }

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
    const registerInfo = await RegisterCodeModel.findOne({
      raw: true,
      attributes: ["expiration", "code"],
      where: {
        user: phone,
      },
    });
    if (!registerInfo) {
      return serviceReturn({
        code: 400,
        data: "短信验证码错误",
      });
    }
    const { code, expiration } = registerInfo;

    if (sCode !== code) {
      return serviceReturn({
        code: 400,
        data: "短信验证码错误",
      });
    }
    const now = Date.now();
    const codeExpiration = Number(expiration);
    if (now >= codeExpiration) {
      return serviceReturn({
        code: 400,
        data: "短信验证码失效",
      });
    }

    await Promise.all([
      UserModel.create({
        phone,
        password: encrypt(password),
        role,
        isDisable: 0,
      }),
      RegisterCodeModel.destroy({
        where: {
          user: phone,
        },
      }),
    ]);

    return serviceReturn({
      code: 200,
      data: "注册成功",
    });
  }

  async getCaptcha() {
    const data = svgCaptcha.create();
    return serviceReturn({
      code: 200,
      data,
    });
  }

  async getSCaptcha(phone: string) {
    const alreadyRegister = await UserModel.findOne({
      raw: true,
      attributes: ["phone"],
      where: {
        phone,
      },
    });
    if (alreadyRegister) {
      return serviceReturn({
        code: 400,
        data: "当前手机号已经注册过了",
      });
    }
    const code = String(Number(Math.random().toFixed(6)) * 1000000)
      .padEnd(6, "0")
      .slice(0, 6);
    const expiration = String(Date.now() + 10 * 60 * 1000);

    const msg = await sendRegisterSms(code, [phone]);
    const isSuccessSend = msg === "Ok";
    if (isSuccessSend) {
      await RegisterCodeModel.upsert({
        user: phone,
        code,
        expiration,
      });
    }

    return serviceReturn({
      code: isSuccessSend ? 200 : 400,
      data: isSuccessSend ? "短信已发送" : "短信发送失败，请稍后重试",
    });
  }
}

export default errCatch(new RegisterService());
