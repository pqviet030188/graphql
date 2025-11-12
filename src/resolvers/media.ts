import {
  CreateImageMutationArgs,
  CreateVideoMutationArgs
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
  },

  Video: {
    duration: (parent: MediaWithDetails) => parent.videoDetails?.duration,
    resolution: (parent: MediaWithDetails) => parent.videoDetails?.resolution,
  },

  Query: {
    posts: () => Post.findAll(),
    allMedia: () => Media.findAll(),
  },

  Mutation: {
    CreateImage: async (
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
      });

      return Image.create({
        id: media.id,
        width: args.width,
        height: args.height,
      });
    },

    CreateVideo: async (
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
        type: "IMAGE",
      });

      return Video.create({
        id: media.id,
        duration: args.duration,
        resolution: args.resolution,
      });
    },
  },
};
