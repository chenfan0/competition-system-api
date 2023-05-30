import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "registerCode",
  updatedAt: false,
  createdAt: false,
})
export class RegisterCodeModel extends Model<Partial<RegisterCodeModel>> {
  @Column({
    primaryKey: true,
    allowNull: false,
    unique: true,
  })
  declare user: string;
  @Column({
    allowNull: false,
  })
  declare expiration: string;
  @Column({
    allowNull: false,
  })
  declare code: string;
}

sequelize.addModels([RegisterCodeModel]);
