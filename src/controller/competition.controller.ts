import { Context, Next } from "koa";

import { errCatch, setResponse } from "../utils";
import competitionService, {
  CreateCompetitionDataType,
} from "../service/competition.service";

class CompetitionController {
  async getCompetitionList(ctx: Context, next: Next) {
    const { offset, size, level, name, status } = ctx.query;

    const { status: resStatus, data } =
      await competitionService.getCompetitionList(
        Number(offset),
        Number(size),
        name as string,
        level as string,
        status as string
      );

    setResponse(ctx, data, resStatus);
  }

  async getCompetitionDetail(ctx: Context, next: Next) {
    const { id } = ctx.params;
    const user = ctx.phone;

    const { status, data } = await competitionService.getCompetitionDetail(
      id as string,
      user
    );

    setResponse(ctx, data, status);
  }

  async getCompetitionUser(ctx: Context) {
    const { prefix, role } = ctx.query;
    const { data, status } = await competitionService.getCompetitionUser(
      prefix as string,
      Number(role)
    );
    setResponse(ctx, data, status);
  }

  async getSelfCompetition(ctx: Context) {
    const phone = ctx.phone;
    const { offset, pageSize, competitionName, field } = ctx.query as any;

    const { data, status } = await competitionService.getSelfCompetition({
      phone,
      offset: Number(offset),
      pageSize: Number(pageSize),
      competitionName,
      field,
    });

    setResponse(ctx, data, status);
  }

  async createCompetition(ctx: Context) {
    const param = ctx.request.body as CreateCompetitionDataType;

    const { data, status } = await competitionService.createCompetition(
      param,
      ctx.phone
    );
    setResponse(ctx, data, status);
  }

  async setCompetitionNextRound(ctx: Context) {
    const { competitionId } = ctx.request.body as any;

    const { status, data } = await competitionService.setCompetitionNextRound(
      Number(competitionId)
    );

    setResponse(ctx, data, status);
  }
}

export default errCatch(new CompetitionController());