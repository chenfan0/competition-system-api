import Router from "koa-router";
import userController from "../controller/user.controller";
import { verifyToken } from "../middleware/verifyToken";

export const userRouter = new Router({ prefix: "/user" });

userRouter.get("/list", verifyToken, userController.getUserList);

userRouter.post('/update/is-disable', verifyToken, userController.updateIsDisable)
