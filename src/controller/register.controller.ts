import type { Context } from "koa";

import registerService from "../service/register.service";
import { errCatch, setResponse } from "../utils";
import { PHONE_PASSWORD_ROLE_IS_REQUIRED } from "../constant/err-type";

class RegisterController {
  async register(ctx: Context) {
    const { phone, password, role } = ctx.request.body as any;
    console.log(phone, password, role);

    if (phone && password && role !== undefined) {
      const { data, status } = await registerService.register({
        phone,
        password,
        role,
      });
      setResponse(ctx, data, status);
    } else {
      const err = new Error(PHONE_PASSWORD_ROLE_IS_REQUIRED);
      ctx.app.emit("error", err, ctx);
    }
  }
}

export default errCatch(new RegisterController());
