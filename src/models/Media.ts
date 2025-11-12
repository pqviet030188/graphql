import { DataTypes, Model } from "sequelize";
import { sequelize } from "../database";
import { Post } from "./Post";
import { Image } from "./Image";
import { Video } from "./Video";

export class Media extends Model {
  declare id: number;
  declare filename: string;
  declare mimetype: string;
  declare url: string;
  declare type: "IMAGE" | "VIDEO";
  declare postId?: number;
}

export interface MediaWithDetails extends Media {
  imageDetails?: Image;
  videoDetails?: Video;
}

Media.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    filename: { type: DataTypes.STRING, allowNull: false },
    mimetype: DataTypes.STRING,
    url: DataTypes.STRING,
    type: DataTypes.ENUM("IMAGE", "VIDEO"),
  },
  { sequelize, tableName: "media" }
);

Post.hasMany(Media, { foreignKey: "postId" });
Media.belongsTo(Post, { foreignKey: "postId" });