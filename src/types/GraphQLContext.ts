import { Client, Image, Media, Post, User, Video } from "../models";

export type GraphQLCacheToType = {
  userCache: User;
  postCache: Post;
  mediaCache: Media;
  videoCache: Video;
  imageCache: Image;
};

export type GraphQLCache = {
  [K in keyof GraphQLCacheToType]?: Record<number, GraphQLCacheToType[K]>;
};

export type GraphQLContext = {
  client?: Client;
} & GraphQLCache;
