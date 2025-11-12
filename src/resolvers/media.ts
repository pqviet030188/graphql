import {
  CreateImageMutationArgs,
  CreateVideoMutationArgs,
  QueryMediaByIdArgs
} from "../dtos";
import { Media, MediaWithDetails, Post, User, Video, Image } from "../models";
import { GraphQLContext } from "../utils";

export const mediaResolvers = {
  Media: {
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
    media: (_: unknown, args: QueryMediaByIdArgs) => Media.findByPk(args.id),
    allMedia: () => Media.findAll(),
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
      });

      return Image.create({
        id: media.id,
        width: args.width,
        height: args.height,
      });
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
