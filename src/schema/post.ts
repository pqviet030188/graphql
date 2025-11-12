import { gql } from "apollo-server-express";

export const postTypeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String
    authorId: Int!
    author: User!
    media: [Media!]!
  }

  type Query {
    post(id: ID!): Post
    posts: [Post!]!
  }

  type Mutation {
    createPost(title: String!, content: String, authorId: ID!): Post!
    updatePost(id: ID!, title: String, content: String): Post!
    deletePost(id: ID!): Boolean!
  }
`;