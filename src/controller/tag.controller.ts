import { Context } from "koa";
import tagService from "../service/tag.service";
import { errCatch } from "../utils";
import { setResponse } from "../utils/index";

class TagController {
  async getTagList(ctx: Context) {
    const { data, status } = await tagService.getTagList();

    setResponse(ctx, data, status);
  }
}

export default errCatch(new TagController());
