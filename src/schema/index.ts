import { userTypeDefs } from "./user";
import { postTypeDefs } from "./post";
import { mediaTypeDefs } from "./media";
import { imageTypeDefs } from "./image";
import { videoTypeDefs } from "./video";
import { mergeTypeDefs } from "@graphql-tools/merge";

export const typeDefs = mergeTypeDefs([userTypeDefs, postTypeDefs, mediaTypeDefs, imageTypeDefs, videoTypeDefs]);