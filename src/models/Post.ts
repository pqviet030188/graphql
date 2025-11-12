import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";
import { User } from "./User";

export class Post extends Model {
  declare id: number;
  declare title: string;
  declare content: string;
  declare authorId: number;
}

Post.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "posts" }
);

User.hasMany(Post, { foreignKey: "authorId" });
Post.belongsTo(User, { foreignKey: "authorId" });