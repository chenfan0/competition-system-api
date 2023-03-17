import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import jwt from "jsonwebtoken";
import { Context, Next } from "koa";

import { NOT_AUTHORIZATION } from "../constant/err-type";

const publicKey = readFileSync(resolve(process.cwd(), "public.pem"));

export async function verifyToken(ctx: Context, next: Next) {
  const authorization = ctx.headers.authorization;
  if (!authorization) {
    const err = new Error(NOT_AUTHORIZATION);
    ctx.app.emit("error", err, ctx);
    return;
  }
  const token = authorization!.replace("Bearer ", "");
  try {
    const { phone } = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    }) as { phone: string };
    ctx.phone = phone;
    (ctx.req as any).phone = phone;

    await next();
  } catch (e) {
    const err = new Error(NOT_AUTHORIZATION);
    ctx.app.emit("error", err, ctx);
    return;
  }
}
