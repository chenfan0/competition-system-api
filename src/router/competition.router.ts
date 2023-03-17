import Router from "koa-router";

import competitionController from "../controller/competition.controller";
import { verifyToken } from "../middleware/verifyToken";

export const competitionRouter = new Router({ prefix: "/competition" });

competitionRouter.get(
  "/list",
  verifyToken,
  competitionController.getCompetitionList as any
);

competitionRouter.get(
  "/detail/:id",
  verifyToken,
  competitionController.getCompetitionDetail as any
);

competitionRouter.get(
  "/self",
  verifyToken,
  competitionController.getSelfCompetition
);

competitionRouter.post(
  "/create",
  verifyToken,
  competitionController.createCompetition
);

competitionRouter.post('/set/next', verifyToken, competitionController.setCompetitionNextRound)

// 竞赛相关用户，比如发布时选择评委，报名时选择导师，学生
competitionRouter.get(
  "/user",
  verifyToken,
  competitionController.getCompetitionUser
);
