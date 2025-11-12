import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database";
import { Media } from "./Media";

interface ImageAttributes {
  id: number;
  width?: number;
  height?: number;
}

interface ImageCreationAttributes extends Optional<ImageAttributes, "id"> {}

export class Image extends Model<ImageAttributes, ImageCreationAttributes> implements ImageAttributes {
  public id!: number;
  public width?: number;
  public height?: number;
}

Image.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: { model: Media, key: "id" },
    },
    width: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
  },
  { sequelize, tableName: "images" }
);

// Relation
Media.hasOne(Image, { foreignKey: "id", as: "imageDetails" });
Image.belongsTo(Media, { foreignKey: "id" });