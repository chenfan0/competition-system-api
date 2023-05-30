import Router from "koa-router";
import tagController from "../controller/tag.controller";
import { verifyToken } from "../middleware/verifyToken";

export const tagRouter = new Router({ prefix: "/tag" });

tagRouter.get("/", verifyToken, tagController.getTagList);
