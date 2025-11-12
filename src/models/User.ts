import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

export class User extends Model {
  declare id: number;
  declare email: string;
  declare name: string;
  declare password: string;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: DataTypes.STRING,
    password: DataTypes.STRING,
  },
  { sequelize, tableName: "users" }
);
