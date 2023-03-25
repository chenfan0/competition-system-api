import Router from "koa-router";

import uploadController from "../controller/upload.controller";
import { verifyToken } from "../middleware/verifyToken";

export const uploadRouter = new Router();

uploadRouter.get(
  "/file/:filename",
  uploadController.getFile as any
);
uploadRouter.post("/upload/competition/file", verifyToken, uploadController.uploadFile);


uploadRouter.post("/upload/competition/img", verifyToken, uploadController.uploadImg);

uploadRouter.post("/upload/signup/work", verifyToken, uploadController.uploadWork);

uploadRouter.post('/upload/signup/video', verifyToken, uploadController.uploadVideo)