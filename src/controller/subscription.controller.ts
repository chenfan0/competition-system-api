import { Context } from "koa";
import subscriptionService from "../service/subscription.service";
import { errCatch } from "../utils";
import { setResponse } from "../utils/index";

class SubscriptionController {
  async subscribe(ctx: Context) {
    const user = ctx.phone;
    const { competitionId } = ctx.request.body as { competitionId: number };

    const { data, status } = await subscriptionService.subscribe(
      user,
      competitionId
    );

    setResponse(ctx, data, status);
  }
}

export default errCatch(new SubscriptionController());
