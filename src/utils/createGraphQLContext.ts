import { Request, Response, NextFunction } from "express";
import { Client } from "../models";

export interface GraphQLContext {
  client?: Client;
}

export async function createGraphQLContext({
  req,
}: {
  req: Request;
}): Promise<GraphQLContext> {
  const client = req.client;
  return {
    client,
  };
}
