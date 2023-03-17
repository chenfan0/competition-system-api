import { Context } from "koa";

import {
  NOT_AUTHORIZATION,
  PHONE_PASSWORD_IS_REQUIRED,
  PHONE_PASSWORD_ROLE_IS_REQUIRED,
} from "./constant/err-type";
import { setResponse } from "./utils";

export const errorHandle = (err: any, ctx: Context) => {
  let status, body;

  switch (err.message) {
    case PHONE_PASSWORD_ROLE_IS_REQUIRED:
      status = 400;
      body = {
        code: 400,
        data: "手机号或密码或角色不能为空",
      };
      break;
    case PHONE_PASSWORD_IS_REQUIRED:
      status = 400;
      body = {
        code: 400,
        data: "手机号或密码不能为空",
      };
      break;
    case NOT_AUTHORIZATION:
      status = 401;
      body = {
        code: 400,
        data: "token无效，请重新登录",
      };
      break;
    default:
      break;
  }
  setResponse(ctx, body, status);
};
