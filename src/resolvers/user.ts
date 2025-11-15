import bcrypt from "bcryptjs";
import {
  CreateUserMutationArgs,
  GraphQLContext,
  QueryUserByIdArgs,
} from "../dtos";
import { Post, User } from "../models";
import { addToCache, hasManyGetEntities } from "../utils";
import { Op } from "sequelize";

export const userResolvers = {
  User: {
    posts: async (parent: User, _2: unknown, context: GraphQLContext) => {
      return await hasManyGetEntities(
        parent,
        context,
        "userCache",
        "postCache",
        "authorId",
        (userIds: number[]) => {
          return Post.findAll({
            where: {
              authorId: {
                [Op.in]: userIds,
              },
            },
          });
        }
      );
    },
  },

  Query: {
    users: async (_1: unknown, _2: unknown, context: GraphQLContext) => {
      const users = await User.findAll();
      users?.length > 0 && addToCache(users, context, "userCache");
      return users;
    },
    user: async (
      _: unknown,
      args: QueryUserByIdArgs,
      context: GraphQLContext
    ) => {
      const user = await User.findByPk(args.id);
      user != null && addToCache([user], context, "userCache");
      return user;
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      args: CreateUserMutationArgs,
      context: GraphQLContext
    ) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const hash = await bcrypt.hash(args.password, 10);
      const newUser = await User.create({ ...args, password: hash });
      newUser != null && addToCache([newUser], context, "userCache");
    },
  },
};
