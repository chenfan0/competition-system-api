import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "subscription",
})
export class SubScriptionModel extends Model<Partial<SubScriptionModel>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;
  @Column({
    allowNull: false,
    unique: true
  })
  declare competitionId: number;
  @Column({
    allowNull: false,
    unique: true,
  })
  declare user: string;
  @Column
  declare createdAt?: Date;
  @Column
  declare updatedAt?: Date;
}

sequelize.addModels([SubScriptionModel]);
