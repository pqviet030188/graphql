import {
  CreatePostMutationArgs,
  QueryPostByIdArgs,
  UpdatePostMutationArgs,
} from "../types";
import { Media, Post, User } from "../models";
import { GraphQLContext } from "../types";
import { addToCache, belongsToGetEntity, hasManyGetEntities } from "../utils";
import { Op } from "sequelize";

export const postResolvers = {
  Post: {
    author: async (parent: Post, _2: unknown, context: GraphQLContext) => {
      return await belongsToGetEntity(
        parent,
        context,
        "postCache",
        "userCache",
        "authorId",
        (authorIds: number[]) => {
          return User.findAll({
            where: {
              id: {
                [Op.in]: authorIds,
              },
            },
          });
        }
      );
    },
    media: async (parent: Post, _: unknown, context: GraphQLContext) => {
      return await hasManyGetEntities(
        parent,
        context,
        "postCache",
        "mediaCache",
        "postId",
        (postIds: number[]) => {
          return Media.findAll({
            where: {
              postId: {
                [Op.in]: postIds,
              },
            },
          });
        }
      );
    },
  },

  Query: {
    posts: async (_1: unknown, _2: unknown, context: GraphQLContext) => {
      const posts = await Post.findAll();
      posts?.length > 0 && addToCache(posts, context, "postCache");
      return posts;
    },
    post: async (
      _: unknown,
      args: QueryPostByIdArgs,
      context: GraphQLContext
    ) => {
      const post = await Post.findByPk(args.id);
      post != null && addToCache([post], context, "postCache");
      return post;
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      args: CreatePostMutationArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const post = await Post.create({ ...args });
      post != null && addToCache([post], context, "postCache");
      return post;
    },

    updatePost: async (
      _: unknown,
      args: UpdatePostMutationArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const post = await Post.findByPk(args.id);
      if (!post) {
        throw new Error("Post not found");
      }
      const updatedPost = await post.update({ ...args });
      updatedPost != null && addToCache([updatedPost], context, "postCache");
      return updatedPost;
    },

    deletePost: async (
      _: unknown,
      args: QueryPostByIdArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const post = await Post.findByPk(args.id);
      if (!post) {
        throw new Error("Post not found");
      }
      await post.destroy();
      return true;
    },
  },
};
