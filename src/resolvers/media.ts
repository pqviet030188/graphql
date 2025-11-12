import {
  CreateImageMutationArgs,
  CreateVideoMutationArgs,
  QueryMediaByIdArgs
} from "../dtos";
import { Media, MediaWithDetails, Post, User, Video, Image } from "../models";
import { GraphQLContext } from "../utils";

export const mediaResolvers = {
  Media: {
    post: (parent: Media) => Post.findByPk(parent.postId),
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
    width: (parent: MediaWithDetails) => parent.imageDetails?.width,
    height: (parent: MediaWithDetails) => parent.imageDetails?.height,
    post: (parent: MediaWithDetails) => Post.findByPk(parent.postId),
  },

  Video: {
    duration: (parent: MediaWithDetails) => parent.videoDetails?.duration,
    resolution: (parent: MediaWithDetails) => parent.videoDetails?.resolution,
    post: (parent: MediaWithDetails) => Post.findByPk(parent.postId),
  },

  Query: {
    media: (_: unknown, args: QueryMediaByIdArgs) => Media.findByPk(args.id, {
      include: ["imageDetails", "videoDetails"], 
    }),
    allMedia: () => Media.findAll({
      include: ["imageDetails", "videoDetails"], 
    }),
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

      await Image.create({
        id: media.id,
        width: args.width,
        height: args.height,
      });

      return Media.findByPk(media.id, { include: ["imageDetails"] });
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

      await Video.create({
        id: media.id,
        duration: args.duration,
        resolution: args.resolution,
      });

      return Media.findByPk(media.id, { include: ["videoDetails"] });
    },
  },
};
