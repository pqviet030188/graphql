import { Request, Response, NextFunction } from "express";
import { GraphQLContext } from "../types";

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
