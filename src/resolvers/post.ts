import bcrypt from "bcryptjs";
import { CreatePostMutationArgs, CreateUserMutationArgs, QueryPostByIdArgs, QueryUserByIdArgs, UpdatePostMutationArgs } from "../dtos";
import { Media, Post, User } from "../models";
import { GraphQLContext } from "../utils";

export const postResolvers = {
  Post: {
    author: (parent: Post) => User.findByPk(parent.authorId),
    media: (parent: Post) => Media.findAll({ where: { postId: parent.id } }),
  },

  Query: {
    posts: () => Post.findAll(),
    post: (_: unknown, args: QueryPostByIdArgs) => Post.findByPk(args.id),
  },

  Mutation: {
    createPost: async (_: unknown, args: CreatePostMutationArgs, context: GraphQLContext) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      return Post.create({ ...args });
    },

    updatePost: async (_: unknown, args: UpdatePostMutationArgs, context: GraphQLContext) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const post = await Post.findByPk(args.id);
      if (!post) {
        throw new Error("Post not found");
      }
      return post.update({ ...args });
    },

    deletePost: async (_: unknown, args: QueryPostByIdArgs, context: GraphQLContext) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const post = await Post.findByPk(args.id);
      if (!post) {
        throw new Error("Post not found");
      }
      return post.destroy();
    }
  },
};
