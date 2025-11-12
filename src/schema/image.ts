import { gql } from "apollo-server-express";

export const imageTypeDefs = gql`
  type Image implements Media {
    id: ID!
    url: String!
    filename: String!
    mimetype: String
    type: MediaType!
    width: Int
    height: Int
    postId: Int!
    Post: Post!
  }
`;