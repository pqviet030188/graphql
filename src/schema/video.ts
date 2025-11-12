import { gql } from "apollo-server-express";

export const videoTypeDefs = gql`
  type Video implements Media {
    id: ID!
    url: String!
    filename: String!
    type: MediaType!
    mimetype: String
    duration: Int
    resolution: String
  }
`;