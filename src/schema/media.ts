import { gql } from "apollo-server-express";

export const mediaTypeDefs = gql`
  enum MediaType {
    IMAGE
    VIDEO
 }

  interface Media {
    id: ID!
    url: String!
    filename: String!
    mimetype: String
    type: MediaType!
    postId: Int!
    post: Post!
  }

  type Query {
    media(id: ID!): Media
    allMedia: [Media!]!
  }

  type Mutation {
    createImage(postId: Int!, filename: String!, url: String!, mimetype: String, width: Int, height: Int): Media!
    createVideo(postId: Int!, filename: String!, url: String!, mimetype: String, duration: Int, resolution: String): Media!
  }
`;