import { createApp } from "../src/createApp";
import request from "supertest";
import express from "express";
import { Client, Image, Media, Post, User, Video } from "../src/models";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/database";

let app: express.Application;
let posts: Post[];

const createImage = async (media: Media, image: Image) => {
  const _media = await Media.create({
    ...media.dataValues,
    postId: media.postId,
    type: "IMAGE",
  });
  await Image.create({ ...image.dataValues, id: _media.id });
};

const createVideo = async (media: Media, video: Video) => {
  const _media = await Media.create({
    ...media.dataValues,
    postId: media.postId,
    type: "VIDEO",
  });
  await Video.create({ ...video.dataValues, id: _media.id });
};

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

  await createImage(
    new Media({
      filename: "abc1.jpg",
      url: "https://test.png",
      mimetype: "png",
      postId: post1.id,
    }),
    new Image({ width: 800, height: 600 })
  );

  await createImage(
    new Media({
      filename: "abc2.jpg",
      url: "https://test.png",
      mimetype: "png",
      postId: post2.id,
    }),
    new Image({ width: 800, height: 600 })
  );

  await createVideo(
    new Media({
      filename: "abc1.mp4",
      url: "https://test.png",
      mimetype: "mp4",
      postId: post1.id,
    }),
    new Video({ duration: 800, resolution: "500x500" })
  );

  app = await createApp();
});

describe("Post API", () => {
  it("queries posts with author and media", async () => {
    const query = `
      query {
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
          media {
            id
            filename
            url
            mimetype
            ... on Image {
              width
              height
            }
            ... on Video {
              duration
              resolution
            }
          }
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.posts).toHaveLength(2);
    expect(`${response.body.data.posts[0].id}`).toBe(`${posts[0].id}`);
    expect(`${response.body.data.posts[1].id}`).toBe(`${posts[1].id}`);
    expect(response.body.data.posts[0].media).toHaveLength(2);
    expect(response.body.data.posts[1].media).toHaveLength(1);
    expect(response.body.data.posts[0].author).toBeDefined();
    expect(response.body.data.posts[1].author).toBeDefined();

    // snapshot test to ensure regression safety
    expect(response.body.data.posts).toMatchSnapshot();
  });
});

afterAll(async () => {
  await sequelize.close();
});