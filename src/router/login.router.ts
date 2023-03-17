import Router from "koa-router";
import loginController from "../controller/login.controller";
export const loginRouter = new Router({ prefix: "/login" });

loginRouter.post("/", loginController.login as any);
