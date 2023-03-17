import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "user",
})
export class UserModel extends Model<Partial<UserModel>> {
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
  declare phone: string;
  @Column({
    allowNull: false,
  })
  @Column({
    allowNull: false,
  })
  declare role: number;
  @Column({
    allowNull: false,
  })
  declare password: string;
  @Column({
    allowNull: true
  })
  declare signUpedList: string;
  @Column({
    allowNull: true
  })
  declare signUpingList: string;
  @Column({
    allowNull: true
  })
  declare confirmList: string
  @Column({
    allowNull: true
  })
  declare instructoredList: string
  @Column({
    allowNull: true
  })
  declare instructoringList: string
  @Column({
    allowNull: true
  })
  declare judgementList: string
  @Column
  declare createdAt?: Date;
  @Column
  declare updatedAt?: Date;
}

sequelize.addModels([UserModel]);
