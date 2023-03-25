import Router from "koa-router";
import subscriptionController from "../controller/subscription.controller";
import { verifyToken } from "../middleware/verifyToken";

export const subscriptionRouter = new Router({prefix: '/subscription'})

subscriptionRouter.post('/subscribe', verifyToken, subscriptionController.subscribe)