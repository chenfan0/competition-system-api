import crypto from "crypto";
import dayjs from "dayjs";
import { Context } from "koa";
import nodeSchedule from "node-schedule";
import { CompetitionModel } from "../model/CompetitionModel";
import { SignUpStatus, CompetitionStatus } from "../constant/index";
import { SubScriptionModel } from "../model/SubscriptionModel";
import { Op } from "sequelize";
import { sendSubscriptionSms } from "./sms";

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
      where: {
        status: {
          [Op.not]: CompetitionStatus.end,
        },
      },
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

    const competitionIdToNameMap = new Map<number, string>();
    const signUpingIds: number[] = [];
    const uploadingIds: number[] = [];

    for (const needSync of needToSyncList) {

      competitionIdToNameMap.set(Number(needSync.id), needSync.name);
      if (needSync.status === CompetitionStatus.signUping) {
        signUpingIds.push(needSync.id);
      }
      if (needSync.status === CompetitionStatus.uploading) {
        uploadingIds.push(needSync.id);
      }
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
    const [signUpingUsers, uploadingUsers] = await Promise.all([
      SubScriptionModel.findAll({
        raw: true,
        where: {
          competitionId: {
            [Op.in]: signUpingIds,
          },
        },
      }),
      SubScriptionModel.findAll({
        raw: true,
        where: {
          competitionId: {
            [Op.in]: uploadingIds,
          },
        },
      }),
    ]);
    const signUpCompetitionName: Record<string, string[]> = {};
    const uploadCompetitionName: Record<string, string[]> = {};
    signUpingUsers.forEach((item) => {
      const name = competitionIdToNameMap.get(Number(item.competitionId))!;
      const val = signUpCompetitionName[name] || [];
      val.push(item.user);
      signUpCompetitionName[name] = val;
    });
    uploadingUsers.forEach((item) => {
      const name = competitionIdToNameMap.get(Number(item.competitionId))!;
      const val = uploadCompetitionName[name] || [];
      val.push(item.user);
      uploadCompetitionName[name] = val;
    });
    const signUpKeys = Object.keys(signUpCompetitionName);
    const uploadKeys = Object.keys(uploadCompetitionName);

    for (const key of signUpKeys) {
      sendSubscriptionSms(key, "报名进行中", signUpCompetitionName[key]);
    }
    for (const key of uploadKeys) {
      sendSubscriptionSms(key, "作品上传中", uploadCompetitionName[key]);
    }
  } catch (e) {
    console.log(e, "err");
  }
}

export function getDiff<T extends any[]>(prev: T, cur: T) {
  const newMember = [] as unknown as T;
  const removeMember = [] as unknown as T;
  const immutableMember = [] as unknown as T;
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

export function isArray(val: unknown) {
  return Array.isArray(val);
}
