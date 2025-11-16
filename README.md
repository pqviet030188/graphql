# Media GraphQL API

This project is a Node.js + TypeScript + Apollo Server GraphQL API to mange **Media** entities, including **Images** and **Videos**, with Sequelize and MySQL. 

It supports authentication via **client credentials** and can be tested safely using a separate test database.

---

## Environment Setup

Create a `.env` file for development:

```env
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
JWT_SECRET=
NODE_ENV=development
```


Create a `test.env` file for testing:
```env
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
JWT_SECRET=
NODE_ENV=test
```

## Optimizations & Best Practices

This section documents practical optimizations and hardening you can apply to this GraphQL API to improve performance, security and operational governance when your database schema evolves.

**1) Apply sensible filtering, pagination (offset/limit) and index rules**
- Always expose filtering, sorting and pagination on list queries instead of returning full tables. Use arguments like `limit`, `offset` or cursor-based pagination.
- Example (GraphQL):

```graphql
type Query {
	posts(limit: Int = 10, offset: Int = 0, filter: PostFilter): [Post!]!
}
```

- At the DB layer, ensure indexes support common filter and sort predicates (e.g. `authorId`, `createdAt`). Avoid large OFFSET scans in high-volume tables; prefer keyset/cursor pagination where possible.

**2) Apply query complexity rules (cost-based) and depth limits**
- Use graphql-query-complexity (createComplexityRule) plus graphql-depth-limit to bound expensive queries. Treat list fields specially: compute complexity as `perItemCost * requestedItems + baseCost` so clients can't cheaply request thousands of nested items.
- Example complexity function for a paged list field:

```ts
complexity: ({ args, childComplexity }) => {
	const DEFAULT = 10; const MAX = 100;
	const requested = Math.min(Number(args.limit ?? DEFAULT), MAX);
	const perItem = childComplexity || 1;
	return requested * perItem + 1; // item cost + small base overhead
}
```

- Use `onComplete` to log complexity metrics and tune `maximumComplexity` from real traffic.

**3) Field-based authorization using a schema directive**
- Prefer declarative, field-level authorization so rules live close to the schema. Add an `@auth` directive and a transformer that wraps field resolvers and checks `context.user` and roles.

Example SDL:

```graphql
directive @auth(roles: [String!]) on FIELD_DEFINITION | OBJECT

type Mutation {
	deletePost(id: ID!): Boolean @auth(roles: ["ADMIN"])
}
```

Implementation notes:
- Use `@graphql-tools/utils` `mapSchema` and `getDirective` to wrap fields at schema build time. The wrapper should read `context.user` and check roles/permissions.
- For dynamic rules, consider using a policy engine (OPA) or central RBAC service and cache decisions for short durations.

**4) Rate limiting to avoid DoS/abuse**
- Apply rate limiting on the HTTP endpoint (e.g. `express-rate-limit` or `rate-limiter-flexible` backed by Redis for distributed systems). Configure limits per IP and, if available, per authenticated client id.

Example (express-rate-limit):

```ts
const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use('/graphql', limiter);
```

- In addition to request rate, consider limits on complexity and depth (defense-in-depth). Emit metrics for rate-limit hits.

Rate limiting approaches (Redis-backed)

When you move from an in-memory limiter to a Redis-backed limiter for horizontal scaling, there are a few common implementation patterns. Two typical approaches:

- Fixed window counter (simple, efficient)

	- Store a counter per key with IP or client id as key in Redis, and with an expiry equal to the window length.
	- On each request: read the counter (GET), if it's >= limit return 429; otherwise INCR the counter (or use INCRBY) and set the expiry when creating the key.
	- Pros: very fast and simple. Cons: can be bursty at window boundaries (clients can send 2x limit across window edges).

	Pseudo-commands (atomic with Lua or use `INCR` then `EXPIRE` when key was new):

	```text
	INCR rl:<client>:<window>
	EXPIRE rl:<client>:<window> <windowSeconds>
	```

- Sliding window using a sorted set (more accurate)

	- Use a Redis sorted set per key where the score is the request timestamp (ms). On each request, remove entries older than `now - window`, count remaining members (ZCOUNT), and if below the limit ZADD the current timestamp.
	- Pros: smooth rate limiting (no boundary spike) and more accurate throttling. Cons: slightly more Redis commands and memory for stored timestamps.

	Pseudo-commands (should be executed atomically via Lua):

	```text
	ZREMRANGEBYSCORE rl:<client> 0 <now - windowMs>
	local count = ZCARD rl:<client>
	if count >= LIMIT then return rate_limited end
	ZADD rl:<client> <now> <uniqueId>
	EXPIRE rl:<client> <windowSeconds>
	return allowed
	```

- Use Lua scripting for atomicity and performance

	- To avoid race conditions and extra round-trips, wrap the sequence of Redis commands above in a single Lua script (EVALSHA). This guarantees atomic execution and is what production-ready libraries do under the hood.
	- `rate-limiter-flexible` and `rate-limit-redis` already implement robust patterns and optional Lua scripts; prefer a battle-tested library unless you have special requirements.

Implementation notes

- Decide the key: prefer authenticated client id when available, fallback to IP. Beware of shared NATs where IP-based limits can unfairly throttle users.
- Decide fail-open vs fail-closed on Redis failures (fail-open is common to avoid blocking legitimate traffic but log/alert).
- Expose rate-limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After) for clients and observability.


**5) Validate & sanitize inputs to avoid XSS / injection**
- GraphQL itself separates query structure from data, but you must still validate and sanitize input values that may be rendered or stored. Common steps:
	- Use strict input types and runtime validation (e.g. `Joi`, `zod`) for fields that contain HTML or markup.
	- When rendering user-provided content in UIs, always escape or sanitize (DOMPurify on client or server-side sanitation for HTML).
	- For SQL/ORM usage, prefer parameterized queries / ORM parameter binding (Sequelize, Prisma) and avoid string concatenation.

**6) Governance for DB & GraphQL schema migrations (versioning)**

Use a migration tool to track DB schema changes in source control. For this project (Sequelize + MySQL) the common choices are `sequelize-cli` or a programmatic runner like `umzug`. The lifecycle below describes safe, small, reversible steps.

Recommended migration workflow (practical and safe)

1. Create a migration file with `up` and `down` scripts

	- Use `npx sequelize-cli migration:generate --name add-fullname-to-users` to scaffold a timestamped file in `migrations/`.
	- Implement `up` to apply the change and `down` to revert it. Keep migrations reversible (avoid destructive steps in `up` without a proper `down`).

	Example migration (add column, reversible):

	```js
	// migrations/20251116-add-fullname-to-users.js
	module.exports = {
	  up: async (queryInterface, Sequelize) => {
		 await queryInterface.addColumn('users', 'fullName', {
			type: Sequelize.STRING,
			allowNull: true,
		 });
	  },

	  down: async (queryInterface) => {
		 await queryInterface.removeColumn('users', 'fullName');
	  },
	};
	```

2. Run migrations (they update a migration table)

	- Running `npx sequelize-cli db:migrate` executes all pending migration `up` scripts and records applied migrations in the database migration table (`SequelizeMeta` by default).
	- The migration table prevents the same migration from running twice and is how the runner tracks history.

	Commands:

	```powershell
	npx sequelize-cli db:migrate       # apply pending migrations
	npx sequelize-cli db:migrate:undo  # revert last migration
	npx sequelize-cli db:migrate:status# show applied/pending migrations
	```

3. Keep migrations small and safe

	- One change per migration file (add column, create table, add index). Small migrations are easier to review, back out, and reason about for production safety.
	- Prefer additive changes (add column) before destructive ones (drop column). Use the expand -> migrate -> switch -> contract pattern:
	  - Expand: add new column(s) and new GraphQL fields (non-breaking).
	  - Migrate/backfill: populate new columns with existing data (background job or migration step that iterates safely).
	  - Switch: update application logic to read from new column(s) (dual-read) and write to both old and new during rollout (dual-write).
	  - Contract: after client adoption and a safe window, deprecate and remove old fields/columns.

4. Backfill and dual-write strategy

	- Backfill large tables with a separate job or batched migration script to avoid long locks. Avoid running heavy data migrations inside a single `up` that blocks traffic.
	- Implement dual-write in application code during rollout so new rows are written to both schemas while reads prefer the new column when available.

5. Testing and CI

	- Run migrations against a CI/test DB before deploying to production. Add a migration smoke test in your pipeline (apply migrations, run tests, then rollback or re-create test DB).
	- Use `npx sequelize-cli db:migrate:status` or a programmatic check to fail CI if migrations are pending.

6. Production cautions (MySQL)

	- Some `ALTER TABLE` operations are locking on MySQL and can cause downtime on large tables. Use online schema change tools (pt-online-schema-change, gh-ost) or ensure operations are safe with your MySQL version.
	- Always take backups before destructive migrations and have a rollback plan (down migration or restore from backup).

7. Governance & visibility

	- Keep migrations in source control and review them in PRs.
	- Add schema linting or GraphQL schema checks (graphql-inspector or Apollo schema checks) to prevent accidental breaking changes.
	- Use GraphQL deprecation to notify clients, and monitor usage of deprecated fields before removal:

	```graphql
	type User {
	  id: ID!
	  fullName: String!
	  name: String @deprecated(reason: "Use fullName; will be removed in v2")
	}
	```

Summary: create small, reversible migration files with `up`/`down`, run them using the CLI (which updates the migration table), and follow the expand->migrate->switch->contract pattern with careful backfills, dual-write, CI checks and backups.

## Practical tips
- Prefer DataLoader (or your per-request micro-batching) for N+1 prevention when loading related rows (images/videos/posts) lazily.
- Log query complexity and depth in production so you can tune thresholds with real data.
- Use feature flags to flip dual-write / dual-read behavior during rollout.
- In production, replace in-memory rate-limiters with Redis-backed stores for horizontal scaling.
