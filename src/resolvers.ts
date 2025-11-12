import { postResolvers } from "./resolvers/post";
import { userResolvers } from "./resolvers/user";
import { mediaResolvers } from "./resolvers/media";

export const resolvers = {
  Query: {
    ...postResolvers.Query,
    ...userResolvers.Query,
    ...mediaResolvers.Query,
  },
  Mutation: {
    ...postResolvers.Mutation,
    ...userResolvers.Mutation,
    ...mediaResolvers.Mutation,
  },
  Post: {
    ...postResolvers.Post,
  },
  User: {
    ...userResolvers.User,
  },
  Media: {
    ...mediaResolvers.Media,
  },
  Image: {
    ...mediaResolvers.Image,
  },
  Video: {
    ...mediaResolvers.Video,
  },
};
