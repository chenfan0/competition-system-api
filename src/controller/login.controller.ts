import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Context, Next } from "koa";
import jwt from "jsonwebtoken";

import { errCatch, setResponse } from "../utils";
import { PHONE_PASSWORD_IS_REQUIRED } from "../constant/err-type";

import loginService from "../service/login.service";

const privateKey = readFileSync(resolve(process.cwd(), "private.pem"));

class LoginController {
  async login(ctx: Context, next: Next) {
    const { password, phone } = ctx.request.body as any;
    if (password && phone) {
      const { data, status } = await loginService.login({ password, phone });
      if (data.code === 200) {
        const token = jwt.sign({ phone }, privateKey, {
          expiresIn: 60 * 60 * 24,
          algorithm: "RS256",
        });
        data.data = { ...data.data, token };
      }
      setResponse(ctx, data, status);
    } else {
      const err = new Error(PHONE_PASSWORD_IS_REQUIRED);
      ctx.app.emit("error", err, ctx);
    }
  }
}

export default errCatch(new LoginController());
