import { gql } from "apollo-server-express";

export const videoTypeDefs = gql`
  type Video implements Media {
    id: ID!
    url: String!
    filename: String!
    mimetype: String
    type: MediaType!
    postId: Int!
    post: Post!

    duration: Int
    resolution: String
  }
`;