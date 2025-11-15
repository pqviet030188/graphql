import { createApp } from "../src/createApp";
import request from "supertest";
import express from "express";
import { Client, Post, User } from "../src/models";
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
      await Post.create({
        title: `Post ${i}-${j}`,
        content: `Content ${i}-${j}`,
        authorId: u.id,
      });
    }
  }

  app = await createApp();
});


describe("User N+1 test", () => {
  it("users with posts with authors does not cause N+1 queries", async () => {
    const queries: string[] = [];
    const origLogging = (sequelize as any).options?.logging;
    // capture SQL statements executed by Sequelize during the request
    (sequelize as any).options = (sequelize as any).options || {};
    (sequelize as any).options.logging = (sql: string) => {
      if (typeof sql === "string") queries.push(sql);
    };

    const query = `
    query {
      users {
        id
        name
        posts {
          id
          title
          author {
            id
            name
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
    expect(selectQueries.length).toBeLessThanOrEqual(2);
  });

  it("users with posts does not cause N+1 queries", async () => {
    const queries: string[] = [];
    const origLogging = (sequelize as any).options?.logging;
    // capture SQL statements executed by Sequelize during the request
    (sequelize as any).options = (sequelize as any).options || {};
    (sequelize as any).options.logging = (sql: string) => {
      if (typeof sql === "string") queries.push(sql);
    };

    const query = `
    query {
      users {
        id
        name
        posts {
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
});
