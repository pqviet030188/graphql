import { GraphQLCacheToType, GraphQLContext } from "../types";
import { addToCache } from "./addToCache";

export const belongsToGetEntity = async <
  K extends keyof GraphQLCacheToType,
  E extends GraphQLCacheToType[K],
  M extends keyof GraphQLCacheToType,
  L extends GraphQLCacheToType[M]
>(
  parent: E,
  context: GraphQLContext,
  parentCacheField: K,
  accessCacheField: M,
  foreignKey: string,
  loading: (ids: number[]) => Promise<L[]>
) => {

  // all relevant ids
  const ids = Array.from(
    new Set([
      parent.dataValues[foreignKey],
      ...(Object.values(context[parentCacheField] ?? {}) as E[]).map((d) => d.dataValues[foreignKey]),
    ])
  ).filter((d) => d != null) as number[];

  // current refs already in cache
  const refs = Object.values(context[accessCacheField] ?? {}) as L[];

  const idToRef = refs.reduce((prev, cur) => {
    const refId = cur.dataValues.id as number;
    prev[refId] = cur;
    return prev;
  }, {} as Record<number, L>);

  // which ids still need loading
  const loadingRequiredIds = ids.filter((d) => !idToRef[d]);

  // Use an inflight promise on the context to avoid multiple parallel loads
  const inflightKey = `__loading_${parentCacheField}_${accessCacheField}_${foreignKey}__${loadingRequiredIds?.sort((a, b) => a - b)?.join("--") ?? ""}`;

  if (loadingRequiredIds.length > 0 && (context as any)[inflightKey]) {
    // another resolver already started loading; wait for it to finish
    await (context as any)[inflightKey];
  } else if (loadingRequiredIds.length > 0) {

    let resolveDeferred: () => void;
    let rejectDeferred: (err: any) => void;
    const deferred = new Promise<void>((res, rej) => {
      resolveDeferred = res;
      rejectDeferred = rej;
    });

    (context as any)[inflightKey] = deferred; // set synchronously

    try {
      const newRefs = await loading(loadingRequiredIds);
      newRefs?.length > 0 && addToCache(newRefs, context, accessCacheField);
      resolveDeferred!();
    } catch (err) {
      rejectDeferred!(err);
      throw err;
    }
  }

  // return the relevant ref
  return (Object.values(context[accessCacheField] ?? {}) as L[]).find(
    (d) => d.dataValues.id == parent.dataValues[foreignKey]
  );
};
