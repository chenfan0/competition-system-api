import { Table, Column, Model } from "sequelize-typescript";
import { sequelize } from "../connect";

@Table({
  tableName: "signup",
})
export class SignUpModel extends Model<Partial<SignUpModel>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: number;
  @Column({
    allowNull: false,
  })
  declare competitionId: number;
  @Column({
    allowNull: false,
  })
  declare mode: number;
  @Column({
    allowNull: false,
  })
  declare leader: string;
  @Column({
    allowNull: true,
  })
  declare member: string;
  @Column({
    allowNull: true,
  })
  declare name: string;
  @Column({
    allowNull: true,
  })
  declare instructors: string;
  @Column({
    allowNull: true,
  })
  declare resolveMember: string;
  @Column({
    allowNull: true,
  })
  declare rejectMember: string;
  @Column
  declare status: number; // 报名是否成功，个人模式默认成功0，团队模式所有队员确认完毕即成功，否则为1
  @Column({
    allowNull: false,
  })
  declare competitionName: string;
  @Column({
    allowNull: false,
  })
  declare currentRound: string;
  @Column({
    allowNull: true,
  })
  declare award: string;
  @Column({
    allowNull: false,
  })
  declare alreadyProcess: number;

  @Column({
    allowNull: true,
  })
  declare work: string;

  @Column({
    allowNull: true,
  })
  declare video: string;
  @Column
  declare createdAt?: Date;
  @Column
  declare updatedAt?: Date;
}

sequelize.addModels([SignUpModel]);
