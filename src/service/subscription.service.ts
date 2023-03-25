import { errCatch } from "../utils";
import { SubScriptionModel } from "../model/SubscriptionModel";
import { serviceReturn } from "../utils/index";

class SubscriptionService {
  async subscribe(user: string, competitionId: number) {
    const alreadySubscribe = await SubScriptionModel.findOne({
      where: {
        user,
        competitionId,
      },
    });
    if (alreadySubscribe) {
      SubScriptionModel.destroy({
        where: {
          competitionId,
          user,
        },
      });
      return serviceReturn({
        code: 200,
        data: "取消订阅成功",
      });
    } else {
      await SubScriptionModel.create({
        user,
        competitionId,
      });

      return serviceReturn({
        code: 200,
        data: "订阅成功",
      });
    }
  }
}

export default errCatch(new SubscriptionService());
