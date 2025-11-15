import { createApp } from "../src/createApp";
import request from "supertest";
import express from "express";
import { Client, Post, User } from "../src/models";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/database";

let app: express.Application;
let posts: Post[];

beforeAll(async () => {
  await sequelize.sync({ force: true }); // reset DB
  const hashed = await bcrypt.hash("demo_secret", 10);
  await Client.create({
    name: "Demo App",
    clientId: "demo_client",
    clientSecret: hashed,
  });

  const testUser = await User.create({
    email: "testuser@gmail.com",
    password: await bcrypt.hash("test", 10),
    name: "Test User",
  });
  const post1 = await Post.create({
    title: "Test post 1",
    content: "Test content 1",
    authorId: testUser.id,
  });

  const post2 = await Post.create({
    title: "Test post 2",
    content: "Test content 2",
    authorId: testUser.id,
  });

  posts = [post1, post2];
  app = await createApp();
});

describe("User API", () => {
  it("queries users with posts", async () => {
    const query = `
      query {
        users {
          id
          email
          name
          posts {
            id
            title
            content
            authorId
            author {
              id
              email
              name
            }
          }
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(1);
    expect(response.body.data.users[0].posts).toHaveLength(2);
    expect(`${response.body.data.users[0].posts[0].id}`).toBe(`${posts[0].id}`);
    expect(`${response.body.data.users[0].posts[1].id}`).toBe(`${posts[1].id}`);

    // snapshot test to ensure regression safety
    expect(response.body.data.users).toMatchSnapshot();
  });
});

afterAll(async () => {
  await sequelize.close();
});