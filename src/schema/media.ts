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
    Post: Post!
  }
    
  type Query {
    media(id: ID!): Media
    allMedia: [Media!]!
  }

  type Mutation {
    createImage(filename: String!, url: String!, mimetype: String, width: Int, height: Int): Image!
    createVideo(filename: String!, url: String!, mimetype: String, duration: Int, resolution: String): Video!
  }
`;