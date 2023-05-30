import type { Context } from "koa";

import registerService from "../service/register.service";
import { errCatch, setResponse } from "../utils";
import { PHONE_PASSWORD_ROLE_IS_REQUIRED } from "../constant/err-type";

class RegisterController {
  async register(ctx: Context) {
    const { phone, password, role, sCode } = ctx.request.body as any;

    if (phone && password && role !== undefined) {
      const { data, status } = await registerService.register({
        phone,
        password,
        role,
        sCode,
      });
      setResponse(ctx, data, status);
    } else {
      const err = new Error(PHONE_PASSWORD_ROLE_IS_REQUIRED);
      ctx.app.emit("error", err, ctx);
    }
  }

  async getCaptcha(ctx: Context) {
    const { status, data } = await registerService.getCaptcha();

    setResponse(ctx, data, status);
  }

  async getSCaptcha(ctx: Context) {
    const { phone } = ctx.query as { phone: string };
    const { status, data } = await registerService.getSCaptcha(phone);

    setResponse(ctx, data, status);
  }
}

export default errCatch(new RegisterController());
