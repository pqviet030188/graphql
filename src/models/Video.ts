import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database";
import { Media } from "./Media";

interface VideoAttributes {
  id: number; 
  duration?: number;
  resolution?: string;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, "id"> {}

export class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: number;
  public duration?: number;
  public resolution?: string;
}

Video.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, references: { model: Media, key: "id" } },
    duration: DataTypes.INTEGER,
    resolution: DataTypes.STRING,
  },
  { sequelize, tableName: "videos" }
);

Media.hasOne(Video, { foreignKey: "id", as: "videoDetails" });
Video.belongsTo(Media, { foreignKey: "id" });