import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Client } from "./models";
import { Config } from "./config";
import { RestClient, RestClientWithRefreshToken } from "./types";

declare global {
  namespace Express {
    interface Request {
      client?: Client;
    }
  }
}

const generateTokens = async (client: Client) => {
  // Access token (JWT)
  const accessToken = jwt.sign(
    { sub: client.id, clientId: client.clientId },
    Config.oauth.secret,
    { expiresIn: Config.oauth.accessTokenExpire }
  );

  const refreshToken = jwt.sign({ clientId: client.id }, Config.oauth.secret, {
    expiresIn: Config.oauth.refreshTokenExpire,
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: Config.oauth.accessTokenExpire,
  };
};

export const getToken = async (req: Request, res: Response) => {
  const { client_id, client_secret } = req.body as RestClient;
  if (!client_id || !client_secret)
    return res.status(400).json({ error: "Missing params" });

  const client = await Client.findOne({ where: { clientId: client_id } });
  if (!client) return res.status(401).json({ error: "Invalid client" });

  const valid = await bcrypt.compare(client_secret, client.clientSecret);
  if (!valid) return res.status(401).json({ error: "Invalid secret" });

  const { accessToken, refreshToken, expiresIn } = await generateTokens(client);
  res.json({ accessToken, tokenType: "bearer", refreshToken, expiresIn });
};

export const getTokenFromRefreshToken = async (req: Request, res: Response) => {
  const { client_id, client_secret, refresh_token } =
    req.body as RestClientWithRefreshToken;

  if (!client_id || !client_secret)
    return res.status(400).json({ error: "Missing params" });

  if (!refresh_token)
    return res.status(400).json({ error: "Missing refresh_token" });

  const payload = jwt.verify(refresh_token, Config.oauth.secret) as {
    clientId: string;
  };
  if (payload.clientId !== client_id)
    return res.status(401).json({ error: "Invalid refresh token" });

  const client = await Client.findOne({ where: { clientId: client_id } });
  if (!client) return res.status(401).json({ error: "Invalid client" });

  const valid = await bcrypt.compare(client_secret, client.clientSecret);
  if (!valid) return res.status(401).json({ error: "Invalid secret" });

  const { accessToken, refreshToken, expiresIn } = await generateTokens(client);
  res.json({ accessToken, tokenType: "bearer", refreshToken, expiresIn });
};

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return next();
  const token = auth.split(" ")[1];
  try {
    const clientPayload = jwt.verify(token, Config.oauth.secret) as {
      clientId: string;
    };

    if (!clientPayload.clientId)
      return res.status(401).json({ error: "Invalid token" });

    const client = await Client.findOne({
      where: { clientId: clientPayload.clientId },
    });
    if (!client) return res.status(401).json({ error: "Invalid client" });

    req.client = client;
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid client" });
  }
  next();
}
