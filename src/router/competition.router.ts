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

competitionRouter.post(
  "/update",
  verifyToken,
  competitionController.updateCompetition
);

competitionRouter.post('/delete', verifyToken, competitionController.deleteCompetition)

competitionRouter.post(
  "/set/next",
  verifyToken,
  competitionController.setCompetitionNextRound
);

competitionRouter.get('/recommend', verifyToken, competitionController.getRecommendCompetition)

competitionRouter.get('/level', verifyToken, competitionController.getCompetitionLevelData)

competitionRouter.get('/status', verifyToken, competitionController.getCompetitionStatusData)

competitionRouter.get('/tag', verifyToken, competitionController.getCompetitionTagData)

// 竞赛相关用户，比如发布时选择评委，报名时选择导师，学生
competitionRouter.get(
  "/user",
  verifyToken,
  competitionController.getCompetitionUser
);

competitionRouter.get("/excel", verifyToken, competitionController.getAwardsExcel)
