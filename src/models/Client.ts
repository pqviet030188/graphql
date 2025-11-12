import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";

export class Client extends Model {
  declare id: number;
  declare name: string;
  declare clientId: string;
  declare clientSecret: string;
}

Client.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    clientId: { type: DataTypes.STRING, allowNull: false, unique: true },
    clientSecret: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "clients" }
);