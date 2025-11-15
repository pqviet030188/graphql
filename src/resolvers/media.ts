import {
  CreateImageMutationArgs,
  CreateVideoMutationArgs,
  QueryMediaByIdArgs,
} from "../dtos";
import { Media, Post, User, Video, Image } from "../models";
import { GraphQLContext } from "../dtos";
import { addToCache, belongsToGetEntity } from "../utils";
import { Op } from "sequelize";

export const mediaResolvers = {
  Media: {
    post: (parent: Media, _2: unknown, context: GraphQLContext) => {
      return belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "postCache",
        "postId",
        (postIds: number[]) => {
          return Post.findAll({
            where: {
              id: {
                [Op.in]: postIds,
              },
            },
          });
        }
      );
    },
    __resolveType(parent: Media) {
      switch (parent.type) {
        case "IMAGE":
          return "Image";
        case "VIDEO":
          return "Video";
        default:
          return null;
      }
    },
  },

  Image: {
    width: async (
      parent: Media,
      _: unknown,
      context: GraphQLContext
    ) => {
      const image = await belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "imageCache",
        "id",
        (imageIds: number[]) => {
          return Image.findAll({
            where: {
              id: {
                [Op.in]: imageIds,
              },
            },
          });
        }
      );

      return image?.width;
    },
    height: async (
      parent: Media,
      _: unknown,
      context: GraphQLContext
    ) => {
      const image = await belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "imageCache",
        "id",
        (imageIds: number[]) => {
          return Image.findAll({
            where: {
              id: {
                [Op.in]: imageIds,
              },
            },
          });
        }
      );

      return image?.height;
    },
    post: (parent: Media, _2: unknown, context: GraphQLContext) => {
      return belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "postCache",
        "postId",
        (postIds: number[]) => {
          return Post.findAll({
            where: {
              id: {
                [Op.in]: postIds,
              },
            },
          });
        }
      );
    },
  },

  Video: {
    duration: async (
      parent: Media,
      _2: unknown,
      context: GraphQLContext
    ) => {
      const video = await belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "videoCache",
        "id",
        (videoIds: number[]) => {
          return Video.findAll({
            where: {
              id: {
                [Op.in]: videoIds,
              },
            },
          });
        }
      );

      return video?.duration;
    },
    resolution: async (
      parent: Media,
      _2: unknown,
      context: GraphQLContext
    ) => {
      const video = await belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "videoCache",
        "id",
        (videoIds: number[]) => {
          return Video.findAll({
            where: {
              id: {
                [Op.in]: videoIds,
              },
            },
          });
        }
      );

      return video?.resolution;
    },
    post: (parent: Media, _2: unknown, context: GraphQLContext) => {
      return belongsToGetEntity(
        parent,
        context,
        "mediaCache",
        "postCache",
        "postId",
        (postIds: number[]) => {
          return Post.findAll({
            where: {
              id: {
                [Op.in]: postIds,
              },
            },
          });
        }
      );
    },
  },

  Query: {
    media: async (
      _: unknown,
      args: QueryMediaByIdArgs,
      context: GraphQLContext
    ) => {
      const media = await Media.findByPk(args.id);
      media != null && addToCache([media], context, "mediaCache");
      return media;
    },

    allMedia: async (_1: unknown, _2: unknown, context: GraphQLContext) => {
      const medias = await Media.findAll();
      medias != null && addToCache(medias, context, "mediaCache");
      return medias;
    },

    // media: (_: unknown, args: QueryMediaByIdArgs) => Media.findByPk(args.id, {
    //   include: ["imageDetails", "videoDetails"],
    // }),
    // allMedia: () => Media.findAll({
    //   include: ["imageDetails", "videoDetails"],
    // }),
  },

  Mutation: {
    createImage: async (
      _: unknown,
      args: CreateImageMutationArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const media = await Media.create({
        filename: args.filename,
        mimetype: args.mimetype,
        url: args.url,
        type: "IMAGE",
        postId: args.postId,
      });

      media != null && addToCache([media], context, "mediaCache");

      const image = await Image.create({
        id: media.id,
        width: args.width,
        height: args.height,
      });

      image != null && addToCache([image], context, "imageCache");
      return media;
    },

    createVideo: async (
      _: unknown,
      args: CreateVideoMutationArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const media = await Media.create({
        filename: args.filename,
        mimetype: args.mimetype,
        url: args.url,
        postId: args.postId,
        type: "VIDEO",
      });

      media != null && addToCache([media], context, "mediaCache");

      const video = await Video.create({
        id: media.id,
        duration: args.duration,
        resolution: args.resolution,
      });

      video != null && addToCache([video], context, "videoCache");
      return media;
    },
  },
};
