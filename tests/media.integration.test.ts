import { createApp } from "../src/createApp";
import request from "supertest";
import express from "express";
import { Media, Image, Client, Post, User, Video } from "../src/models";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/database";

let app: express.Application;
let post: Post;

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
  post = await Post.create({
    title: "Test post",
    content: "Test content",
    authorId: testUser.id,
  });

  app = await createApp();
});

const createImage = async (media: Media, image: Image) => {
  const _media = await Media.create({
    ...media.dataValues,
    postId: post.id,
    type: "IMAGE",
  });
  await Image.create({ ...image.dataValues, id: _media.id });
};

describe("Media API", () => {
  it("creates and queries an image", async () => {
    await createImage(
      new Media({
        filename: "abc.jpg",
        url: "https://test.png",
        mimetype: "png",
      }),
      new Image({ width: 800, height: 600 })
    );

    const query = `
      query {
        allMedia {
          id
          ... on Image {
            width
            height
          }
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.allMedia[0].width).toBe(800);
    expect(response.body.data.allMedia[0].height).toBe(600);

    // snapshot test to ensure regression safety
    expect(response.body.data.allMedia).toMatchSnapshot();
  });

  it("creates an image via mutation", async () => {
    const mutation = `
    mutation {
      createImage(
        postId: ${post.id}
        filename: "img.jpg"
        url: "https://img.jpg"
        width: 500
        height: 300
      ) {
        id
        ... on Image {
          width
          height
        }
      }
    }
  `;

    const tokenResponse = await request(app)
      .post("/oauth/token")
      .set("Content-Type", "application/json")
      .send({
        client_id: "demo_client",
        client_secret: "demo_secret",
        grant_type: "client_credentials",
      });

    expect(tokenResponse?.status).toBe(200);
    const accessToken = tokenResponse.body.accessToken;

    const response = await request(app)
      .post("/graphql")
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query: mutation,
      });
    expect(response?.status).toBe(200);
    expect(response.body.data.createImage.width).toBe(500);
    expect(response.body.data.createImage.height).toBe(300);
  });
});

afterAll(async () => {
  await sequelize.close();
});