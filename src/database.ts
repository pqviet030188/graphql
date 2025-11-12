import { Sequelize } from "sequelize";
import { Config } from "./config";

export const sequelize = new Sequelize(
  Config.mysql.database,
  Config.mysql.user,
  Config.mysql.password,
  {
    host: Config.mysql.host,
    dialect: "mysql",
    logging: false,
  }
);
