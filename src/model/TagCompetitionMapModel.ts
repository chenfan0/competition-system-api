import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "tag-competition-map",
  updatedAt: false
})
export class TagCompetitionMapModel extends Model<Partial<TagCompetitionMapModel>> {
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
  declare competitionId: number;
  @Column({
    allowNull: false,
    unique: true,
  })
  declare tagId: number;
  @Column({
    allowNull: false,
  })
  declare createdAt: Date;
}

sequelize.addModels([TagCompetitionMapModel]);
