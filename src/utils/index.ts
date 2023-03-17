import crypto from "crypto";
import dayjs from "dayjs";
import { Context } from "koa";
import nodeSchedule from "node-schedule";
import { CompetitionModel } from "../model/CompetitionModel";

export const setResponse = (ctx: Context, body: any, status = 200) => {
  ctx.status = status;
  ctx.body = body;
};

export const serviceReturn = (
  data: { code: number; data: any },
  status = 200
) => ({
  status,
  data,
});

export const errCatch = <T extends Record<string | symbol, any>>(target: T) => {
  return new Proxy(target, {
    get(target, key, receiver) {
      if (typeof target[key] !== "function") {
        return Reflect.get(target, key, receiver);
      }
      return async function (this: unknown, ...args: any[]) {
        try {
          return await (target[key] as Function).apply(this, args);
        } catch (e) {
          const errMsg = `errObj: ${target.constructor.name} \n errFunction: ${
            key as string
          } \n errMsg: ${e}`;
          if (target.constructor.name.includes("Controller")) {
            const ctx = args[0] as Context;
            setResponse(ctx, { code: 400, data: errMsg }, 500);
          } else {
            return serviceReturn(
              {
                code: 400,
                data: errMsg,
              },
              500
            );
          }
        }
      };
    },
  });
};

export const encrypt = (password: string) => {
  const md5 = crypto.createHash("md5");
  return md5.update(password).digest("hex");
};

export const handleFileName = (
  phone: string,
  contentLength: string,
  rawName: string
) => {
  return `${phone}_${contentLength}_$$_${rawName}`;
};

export function formatTime(time: string | number) {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

export function schedule(fn: nodeSchedule.JobCallback) {
  const rule = new nodeSchedule.RecurrenceRule();
  rule.second = 0;
  const job = nodeSchedule.scheduleJob(rule, fn);

  return job;
}

export function getCompetitionStatus(
  rst: number,
  ret: number,
  wst: number,
  wet: number
) {
  let status = 0;
  const now = Date.now();
  if (now < rst) {
    status = 0;
  }
  if (now >= rst && now < ret) {
    status = 1;
  }
  if (now >= ret && now < wst) {
    status = 2;
  }
  if (now >= wst && now < wet) {
    status = 3;
  }
  if (now >= wet) {
    status = 4;
  }

  return status;
}

export async function syncCompetitionStatus() {
  try {
    const competitionList = await CompetitionModel.findAll({
      raw: true,
    });
    const needToSyncList = competitionList.filter((competition) => {
      const {
        registrationStartTime,
        registrationEndTime,
        workSubmissionStartTime,
        workSubmissionEndTime,
        status,
      } = competition;
      if (status === 5) {
        return false;
      }
      const rst = Date.parse(registrationStartTime);
      const ret = Date.parse(registrationEndTime);
      const wst = Date.parse(workSubmissionStartTime);
      const wet = Date.parse(workSubmissionEndTime);

      const rightStatus = getCompetitionStatus(rst, ret, wst, wet);
      if (status === rightStatus) return false;
      competition.status = rightStatus;
      return true;
    });

    for (const needSync of needToSyncList) {
      CompetitionModel.update(
        {
          status: needSync.status,
        },
        {
          where: {
            id: needSync.id,
          },
        }
      );
    }
  } catch (e) {
    console.log(e);
  }
}

export function getDiff(prev: string[], cur: string[]) {
  const newMember: string[] = [];
  const removeMember: string[] = [];
  const immutableMember: string[] = [];
  for (const raw of prev) {
    if (!cur.includes(raw)) {
      removeMember.push(raw);
    } else {
      if (!immutableMember.includes(raw)) {
        immutableMember.push(raw);
      }
    }
  }
  for (const _new of cur) {
    if (!prev.includes(_new)) {
      newMember.push(_new);
    } else {
      if (!immutableMember.includes(_new)) {
        immutableMember.push(_new);
      }
    }
  }
  return [newMember, removeMember, immutableMember];
}
