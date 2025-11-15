import { GraphQLContext, GraphQLCacheToType } from "../dtos";

export const addToCache = <
  K extends keyof GraphQLCacheToType,
  E extends GraphQLCacheToType[K]
>(
  entries: E[],
  context: GraphQLContext,
  field: K
) => {
  context[field] = {
    ...(context[field] ?? {}),
    ...(entries?.reduce((prev, cur) => {
      prev[cur.id] = cur;
      return prev;
    }, {} as Record<number, E>) ?? {}),
  };
  return context;
};
