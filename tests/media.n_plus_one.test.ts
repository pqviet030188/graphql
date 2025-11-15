import { createApp } from "../src/createApp";
import request from "supertest";
import express from "express";
import { Client, Media, Post, Image, User, Video } from "../src/models";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/database";

let app: express.Application;

// this suite performs heavy DB seeding; increase timeout for this file only
jest.setTimeout(120000);

beforeAll(async () => {
  await sequelize.sync({ force: true }); // reset DB
  const hashed = await bcrypt.hash("demo_secret", 10);
  await Client.create({
    name: "Demo App",
    clientId: "demo_client",
    clientSecret: hashed,
  });

  // create multiple users and posts to expose N+1 if present
  for (let i = 0; i < 5; i++) {
    const u = await User.create({
      email: `user${i}@example.com`,
      password: await bcrypt.hash("test", 10),
      name: `User ${i}`,
    });
    for (let j = 0; j < 3; j++) {
      const post = await Post.create({
        title: `Post ${i}-${j}`,
        content: `Content ${i}-${j}`,
        authorId: u.id,
      });

      for (let k = 0; k < 10; k++) {
        const ran = Math.random();
        const type = ran < 0.5 ? "IMAGE" : "VIDEO";
        try {
        const media = await Media.create({
          filename: `Post ${i}-${j}-media${k}`,
          mimetype: "image/png",
          url: `http://example.com/media/${i}-${j}-media${k}.png`,
          type: type,
          postId: post.id,
        });

        if (media.type === "IMAGE") {
          await Image.create({
            width: 800,
            height: 600,
            id: media.id,
          });
        } else {
          await Video.create({
            duration: 120,
            resolution: "1080p",
            id: media.id,
          });
        }
      } catch (err) { 
        console.error("Error creating media:", err);
      }
      }
    }
  }

  app = await createApp();
});

describe("Media N+1 test", () => {
  it("media with posts does not cause N+1 queries", async () => {
    const queries: string[] = [];
    const origLogging = (sequelize as any).options?.logging;
    // capture SQL statements executed by Sequelize during the request
    (sequelize as any).options = (sequelize as any).options || {};
    (sequelize as any).options.logging = (sql: string) => {
      if (typeof sql === "string") queries.push(sql);
    };

    const query = `
    query {
      allMedia {
        id
        filename
        post {
          id
          title
        }   
      }
    }
  `;

    const response = await request(app).post("/graphql").send({ query });

    // restore original logging
    (sequelize as any).options.logging = origLogging;

    expect(response.status).toBe(200);

    // count SELECT queries only
    const selectQueries = queries.filter((q) => /select/i.test(q));
    expect(selectQueries.length).toBeLessThanOrEqual(2);
  });

  it("media with video with image does not cause N+1 queries", async () => {
    const queries: string[] = [];
    const origLogging = (sequelize as any).options?.logging;
    // capture SQL statements executed by Sequelize during the request
    (sequelize as any).options = (sequelize as any).options || {};
    (sequelize as any).options.logging = (sql: string) => {
      if (typeof sql === "string") queries.push(sql);
    };

    const query = `
    query {
      allMedia {
        id
        filename

        post {
          id
          title
        }

        ... on Video {
          duration
          resolution
        }

        ... on Image {
          width
          height
        }
      }
    }
  `;

    const response = await request(app).post("/graphql").send({ query });

    // restore original logging
    (sequelize as any).options.logging = origLogging;

    expect(response.status).toBe(200);

    // count SELECT queries only
    const selectQueries = queries.filter((q) => /select/i.test(q));
    expect(selectQueries.length).toBeLessThanOrEqual(4);
  });

  it("media with video with image with post does not cause N+1 queries", async () => {
    const queries: string[] = [];
    const origLogging = (sequelize as any).options?.logging;
    // capture SQL statements executed by Sequelize during the request
    (sequelize as any).options = (sequelize as any).options || {};
    (sequelize as any).options.logging = (sql: string) => {
      if (typeof sql === "string") queries.push(sql);
    };

    const query = `
    query {
      allMedia {
        id
        filename

        post {
          id
          title
        }

        ... on Video {
          duration
          resolution

          post {
            id
            title
          }
        }

        ... on Image {
          width
          height

          post {
            id
            title
          }
        }
      }
    }
  `;

    const response = await request(app).post("/graphql").send({ query });

    // restore original logging
    (sequelize as any).options.logging = origLogging;

    expect(response.status).toBe(200);

    // count SELECT queries only
    const selectQueries = queries.filter((q) => /select/i.test(q));
    expect(selectQueries.length).toBeLessThanOrEqual(4);
  });
});

afterAll(async () => {
  await sequelize.close();
});