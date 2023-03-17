import { Sequelize } from "sequelize-typescript";

export const sequelize = new Sequelize("cmp", "root", "c13005261761F", {
  host: "81.71.36.158",
  dialect: "mysql",
  timezone: '+08:00'
});

try {
  await sequelize.authenticate();
  console.log("database connect success!!!");
} catch (err) {
  console.log(err);
}
