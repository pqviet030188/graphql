import { GraphQLCacheToType, GraphQLContext } from "../types";
import { addToCache } from "./addToCache";

export const hasManyGetEntities = async <
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
  // all parent ids (include any parents already added to the parent cache)
  const parentIds = Array.from(
    new Set([
      parent.id,
      ...Object.keys(context[parentCacheField] ?? {}).map((k) => Number(k)),
    ])
  ).filter((d) => d != null) as number[];

  // current refs already in cache
  const refs = Object.values(context[accessCacheField] ?? {}) as L[];

  const parentIdToRefs = refs.reduce((prev, cur) => {
    const refId = cur.dataValues[foreignKey] as number;
    prev[refId] = [...(prev[refId] ?? []), cur];
    return prev;
  }, {} as Record<number, L[]>);

  // which parent ids still need loading
  const loadingRequiredParentIds = parentIds.filter((d) => !parentIdToRefs[d]);

  // Use an inflight promise on the context to avoid multiple parallel loads
  const inflightKey = `__loading_${parentCacheField}_${accessCacheField}_${foreignKey}__${loadingRequiredParentIds?.sort((a, b) => a - b)?.join("--") ?? ""}`;

  if (loadingRequiredParentIds.length > 0 && (context as any)[inflightKey]) {
    // another resolver already started loading; wait for it to finish
    await (context as any)[inflightKey];
  } else if (loadingRequiredParentIds.length > 0) {
    let resolveDeferred: () => void;
    let rejectDeferred: (err: any) => void;
    const deferred = new Promise<void>((res, rej) => {
      resolveDeferred = res;
      rejectDeferred = rej;
    });

    (context as any)[inflightKey] = deferred; // set synchronously

    try {
      const newRefs = await loading(loadingRequiredParentIds);
      newRefs?.length > 0 && addToCache(newRefs, context, accessCacheField);
      resolveDeferred!();
    } catch (err) {
      rejectDeferred!(err);
      throw err;
    }
  }

  // return the refs for this specific parent from the (now-populated) cache
  return (Object.values(context[accessCacheField] ?? {}) as L[]).filter(
    (d) => d.dataValues[foreignKey] == parent.id
  );
};
