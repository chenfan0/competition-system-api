import { Context } from "koa";
import userService from "../service/user.service";
import { errCatch } from "../utils";
import { setResponse } from "../utils/index";

class UserController {
  async getUserList(ctx: Context) {
    const { pageSize, offset, filter } = ctx.query as any;
    const { data, status } = await userService.getUserList(
      Number(pageSize),
      Number(offset),
      filter
    );

    setResponse(ctx, data, status);
  }

  async updateIsDisable(ctx: Context) {
    const { isDisable, user } = ctx.request.body as any;

    const opUser = ctx.phone;

    const { status, data } = await userService.updateUserIsDisable(
      user,
      isDisable,
      opUser
    );

    setResponse(ctx, data, status);
  }
}

export default errCatch(new UserController());
