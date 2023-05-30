import { Sequelize } from "sequelize-typescript";

export const sequelize = new Sequelize("table name", "user", "password", {
  host: "",
  dialect: "mysql",
  timezone: '+08:00'
});

try {
  await sequelize.authenticate();
  console.log("database connect success!!!");
} catch (err) {
  console.log(err);
}
