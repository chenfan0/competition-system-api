import { TagModel } from "../model/TagModel";
import { errCatch } from "../utils";
import { serviceReturn } from "../utils/index";

class TagService {
  async getTagList() {
    const tagList = await TagModel.findAll({
      raw: true,
    });
    const res = tagList.map((tag) => ({ value: tag.id, label: tag.name }));

    return serviceReturn({
      code: 200,
      data: res,
    });
  }
}

export default errCatch(new TagService());
