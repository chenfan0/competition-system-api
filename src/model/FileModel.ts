import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "file",
  createdAt: false,
  updatedAt: false,
})
export class FileModel extends Model<Partial<FileModel>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;
  @Column({
    allowNull: false,
  })
  declare filename: string;
  @Column({
    allowNull: false,
    unique: true,
  })
  declare path: string;
  @Column({
    allowNull: false,
  })
  declare destination: string;
  @Column({
    allowNull: false,
  })
  declare size: number;
  @Column({
    allowNull: false,
  })
  declare originalname: string;
  @Column({
    allowNull: true,
  })
  declare competitionIdList: string;
  @Column({
    allowNull: true,
  })
  declare signUpIdList: string;
  @Column({
    allowNull: false,
  })
  declare mimetype: string;
}

sequelize.addModels([FileModel]);
