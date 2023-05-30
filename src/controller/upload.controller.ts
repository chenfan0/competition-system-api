import { resolve } from "node:path";
import { existsSync, createReadStream } from "node:fs";

import { Context, Next } from "koa";
import multer from "@koa/multer";

import { errCatch, handleFileName, setResponse } from "../utils";
import { FileModel } from "../model/FileModel";
import uploadService from "../service/upload.service";
import userService from "../service/user.service";

const distPath = resolve(process.cwd(), "./upload");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, distPath);
  },
  filename(req, file, cb) {
    const contentLength = req.headers["content-length"]!;
    cb(
      null,
      handleFileName((req as any).phone, contentLength, file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    // 处理文件名乱码
    if (
      Buffer.from(file.originalname, "latin1").toString("latin1") ===
      file.originalname
    ) {
      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf-8"
      );
    }
    // 处理过后的文件名一致则认为两个文件是一样的
    // 文件名 = contentLength + 用户信息 + 原始文件名
    const phone = (req as any).phone;
    const contentLength = req.headers["content-length"]!;
    const saveFileName = handleFileName(
      phone,
      contentLength,
      file.originalname
    );
    (req as any).saveFileName = saveFileName;
    (req as any).originalname = file.originalname;
    if (existsSync(resolve(distPath, saveFileName))) {
      cb(null, false);
    } else {
      cb(null, true);
    }
  },
});

class UploadController {
  async uploadFile(ctx: Context, next: Next) {
    await upload.single("file")(ctx, next);
    if (ctx.file) {
      await uploadService.createFileRecord(ctx.file);
    }
    setResponse(ctx, {
      code: 200,
      data: {
        filename: (ctx.req as any).saveFileName,
        originalname: (ctx.req as any).originalname,
      },
    });
  }
  async uploadCompetitionImg(ctx: Context, next: Next) {
    await upload.single("img")(ctx, next);
    if (ctx.file) {
      await uploadService.createFileRecord(ctx.file);
    }
    setResponse(ctx, {
      code: 200,
      data: {
        filename: (ctx.req as any).saveFileName,
        originalname: (ctx.req as any).originalname,
      },
    });
  }

  async getFile(ctx: Context) {
    const { filename } = ctx.params;

    const file = await uploadService.getFile(filename);

    if (existsSync(file!.path)) {
      const stream = createReadStream(file!.path);
      ctx.type = file!.mimetype;
      ctx.set("Content-Length", String(file!.size));
      ctx.set("Accept-Ranges", "bytes");
      setResponse(ctx, stream, 200);
    } else {
      setResponse(ctx, {
        data: "找不到对应的文件",
      });
    }
  }

  async uploadSignUpWork(ctx: Context, next: Next) {
    await upload.single("work")(ctx, next);

    if (ctx.file) {
      await uploadService.createFileRecord(ctx.file);
    }
    setResponse(ctx, {
      code: 200,
      data: {
        filename: (ctx.req as any).saveFileName,
        originalname: (ctx.req as any).originalname,
      },
    });
  }

  async uploadSignUpVideo(ctx: Context, next: Next) {
    await upload.single("video")(ctx, next);
    if (ctx.file) {
      await uploadService.createFileRecord(ctx.file);
    }
    setResponse(ctx, {
      code: 200,
      data: {
        filename: (ctx.req as any).saveFileName,
        originalname: (ctx.req as any).originalname,
      },
    });
  }

  async uploadUserAvatar(ctx: Context, next: Next) {
    await upload.single("avatar")(ctx, next);
    if (ctx.file) {
      await uploadService.createFileRecord(ctx.file);
    }
    await userService.updateUserAvatar(ctx.phone, (ctx.req as any).saveFileName)
    setResponse(ctx, {
      code: 200,
      data: {
        filename: (ctx.req as any).saveFileName,
        originalname: (ctx.req as any).originalname,
      },
    });
  }
}

export default errCatch(new UploadController());
