import Router from "koa-router";
import signUpController from "../controller/signUp.controller";
import { verifyToken } from "../middleware/verifyToken";

export const signUpRouter = new Router({ prefix: "/signup" });

signUpRouter.post("/create", verifyToken, signUpController.createSignUp);

signUpRouter.post("/confirm", verifyToken, signUpController.confirmSignUp);

signUpRouter.post("/reject", verifyToken, signUpController.rejectSignUp);

signUpRouter.post("/delete", verifyToken, signUpController.deleteSignUp);

signUpRouter.get(
  "/:competitionId",
  verifyToken,
  signUpController.getSignUpListByCompetitionId
);

signUpRouter.post("/update", verifyToken, signUpController.updateSignUpInfo);

signUpRouter.post(
  "/promote",
  verifyToken,
  signUpController.promoteSignUpBySignUpId
);

signUpRouter.post(
  "/award",
  verifyToken,
  signUpController.awardSignUpBySignUpId
);
