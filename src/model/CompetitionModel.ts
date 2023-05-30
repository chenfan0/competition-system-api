import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "competition",
})
export class CompetitionModel extends Model<Partial<CompetitionModel>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;
  @Column({
    allowNull: false,
  })
  declare name: string;
  @Column({
    allowNull: false,
  })
  declare description: string;
  @Column({
    allowNull: false,
  })
  declare address: string;
  @Column({
    allowNull: false,
  })
  declare level: string;
  @Column({
    allowNull: false,
  })
  declare instructorsNums: string;
  @Column({
    allowNull: false,
  })
  declare mode: number; // 0 个人 1 团队
  @Column({
    allowNull: false,
  })
  declare opUser: string;
  @Column({
    allowNull: false,
  })
  declare judges: string;
  @Column({
    allowNull: false,
  })
  declare registrationStartTime: string;
  @Column({
    allowNull: false,
  })
  declare registrationEndTime: string;
  @Column({
    allowNull: false,
  })
  declare workSubmissionStartTime: string;
  @Column({
    allowNull: false,
  })
  declare workSubmissionEndTime: string;
  @Column({
    allowNull: true,
  })
  declare files: string;

  @Column({
    allowNull: true,
  })
  declare imgs: string;
  @Column({
    allowNull: false,
  })
  declare rounds: string;
  @Column({
    allowNull: false,
  })
  declare awards: string;
  @Column({
    allowNull: false,
  })
  declare currentRound: string;
  @Column({
    allowNull: false,
  })
  declare status: number;
  @Column({
    allowNull: true,
  })
  declare signUpNums: string;
  @Column({
    allowNull: true,
  })
  declare tags: string;
  @Column
  declare createdAt: Date;
  @Column
  declare updatedAt: Date;
}

sequelize.addModels([CompetitionModel]);
