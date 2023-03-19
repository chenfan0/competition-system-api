import { existsSync, rmSync } from "fs";
import { Context } from "koa";
import signUpService from "../service/signUp.service";
import { errCatch, setResponse } from "../utils";

class SignUpController {
  async createSignUp(ctx: Context) {
    const {
      competitionId,
      mode,
      instructors,
      leader,
      member,
      teamName,
      competitionName,
      work,
      video,
    } = ctx.request.body as any;

    const { data, status } = await signUpService.createSignUp({
      competitionId,
      mode,
      instructors,
      leader,
      member,
      teamName,
      competitionName,
      work,
      video,
    });

    return setResponse(ctx, data, status);
  }

  async confirmSignUp(ctx: Context) {
    const { signUpId } = ctx.request.body as any;
    const user = ctx.phone;
    const { data, status } = await signUpService.confirmSignUp(signUpId, user);

    setResponse(ctx, data, status);
  }

  async rejectSignUp(ctx: Context) {
    const { signUpId } = ctx.request.body as any;
    const user = ctx.phone;
    const { status, data } = await signUpService.rejectSignUp(signUpId, user);

    setResponse(ctx, data, status);
  }

  async deleteSignUp(ctx: Context) {
    const { signUpId } = ctx.request.body as any;
    const user = ctx.phone;
    console.log(signUpId);

    const { status, data } = await signUpService.deleteSignUp(signUpId, user);

    setResponse(ctx, data, status);
  }

  async deleteSignUpFile(path: string) {
    if (existsSync(path)) {
      rmSync(path);
    }
  }

  async getSignUpListByCompetitionId(ctx: Context) {
    const { competitionId } = ctx.params;
    const { alreadyProcess } = ctx.query;
    const { status, data } = await signUpService.getSignUpListByCompetitionId(
      competitionId,
      Number(alreadyProcess)
    );

    setResponse(ctx, data, status);
  }

  async promoteSignUpBySignUpId(ctx: Context) {
    const { signUpId, currentRound } = ctx.request.body as {
      signUpId: number;
      currentRound: string;
    };

    const { status, data } = await signUpService.promoteSignUpBySignUpId(
      signUpId,
      currentRound
    );

    setResponse(ctx, data, status);
  }

  async updateSignUpInfo(ctx: Context) {
    const user = ctx.phone;
    const { id, member, instructors, teamName, work, video } = ctx.request
      .body as any;
    const { status, data } = await signUpService.updateSignUpInfo(id, user, {
      member,
      instructors,
      teamName,
      work,
      video,
    });

    setResponse(ctx, data, status);
  }

  async awardSignUpBySignUpId(ctx: Context) {
    const { signUpId, award } = ctx.request.body as any;

    const { status, data } = await signUpService.awardSignUpBySignUpId(
      signUpId,
      award
    );

    setResponse(ctx, data, status);
  }
}

export default errCatch(new SignUpController());
