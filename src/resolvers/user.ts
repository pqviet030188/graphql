import bcrypt from "bcryptjs";
import { CreateUserMutationArgs, QueryUserByIdArgs } from "../dtos";
import { Post, User } from "../models";
import { GraphQLContext } from "../utils";

export const userResolvers = {
  User: {
    posts: (parent: User) => Post.findAll({ where: { authorId: parent.id } }),
  },

  Query: {
    users: () => User.findAll(),
    user: (_: unknown, args: QueryUserByIdArgs) => User.findByPk(args.id),
  },

  Mutation: {
    createUser: async (_: unknown, args: CreateUserMutationArgs, context: GraphQLContext) => {
      if (!context.client) {
        throw new Error("Unauthorized");
      }
      const hash = await bcrypt.hash(args.password, 10);
      return User.create({ ...args, password: hash });
    },
  },
};
