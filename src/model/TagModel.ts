import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "tag",
  updatedAt: false,
})
export class TagModel extends Model<Partial<TagModel>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;
  @Column({
    allowNull: false,
    unique: true,
  })
  declare name: string;
  @Column({
    allowNull: false,
  })
  declare createdAt: Date;
}

sequelize.addModels([TagModel]);
