import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

import * as router from "./router";
import { errorHandle } from "./err.handle";
import { schedule, syncCompetitionStatus } from "./utils";

const app = new Koa();
const registerRouter = (
  app: Koa<Koa.DefaultState, Koa.DefaultContext>,
  router: { [key: string]: Router }
) => {
  for (const key in router) {
    app.use(router[key].routes());
    app.use(router[key].allowedMethods());
  }
};
app.use(cors());
app.use(bodyParser());
registerRouter(app, router);

app.on("error", errorHandle);

app.listen(8080, () => {
  schedule(syncCompetitionStatus);
  console.log("running");
});
