import multer from "@koa/multer";
import { FileModel } from "../model/FileModel";
import { errCatch, serviceReturn, setResponse } from "../utils";

class UploadService {
  async createFileRecord(file: multer.File) {
    const { filename, originalname, size, destination, path, mimetype } = file;

    const exist = await FileModel.findOne({
      where: {
        filename,
      },
    });
    if (exist) {
      await FileModel.update(
        {
          originalname,
          size,
          destination,
          path,
          mimetype,
        },
        {
          where: {
            filename,
          },
        }
      );
    } else {
      console.log("create");

      try {
        await FileModel.create({
          originalname,
          size,
          destination,
          path,
          mimetype,
          filename,
        });
      } catch (e) {
        console.log(e);
      }
    }

    return serviceReturn({
      code: 200,
      data: "创建file记录成功",
    });
  }

  async getFile(filename: string) {
    const file = await FileModel.findOne({
      raw: true,
      where: {
        filename,
      },
    });
    return file;
  }
}

export default errCatch(new UploadService());
