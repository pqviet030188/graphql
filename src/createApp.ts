import express from "express";
import { ApolloServer } from "apollo-server-express";
import { authMiddleware, getToken, getTokenFromRefreshToken } from "./auth";
import path from "path";
import { RestClientWithRefreshToken } from "./dtos";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

export const createApp = async () => {
  const app = express();
  app.use(express.json());

  app.post("/oauth/token", async (req, res) => {
    const { grant_type } = req.body as RestClientWithRefreshToken;

    if (grant_type === "client_credentials") {
      return await getToken(req, res);
    }

    if (grant_type === "refresh_token") {
      return await getTokenFromRefreshToken(req, res);
    }

    res.status(400).json({ error: "Invalid grant_type" });
  });

  app.use(authMiddleware);

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ client: (req as any).client }),
  });
  await apollo.start();
  apollo.applyMiddleware({ app, path: "/graphql" });

  return app;
};
