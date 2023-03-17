import Router from "koa-router";
import registerController from '../controller/register.controller'

export const registerRouter = new Router({ prefix: "/register" });

registerRouter.post('/', registerController.register as any)
