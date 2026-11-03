import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { auraSql?: postgres.Sql };

// Reuse one connection pool across hot reloads in development.
const client =
  globalForDb.auraSql ?? postgres(process.env.DATABASE_URL!, { max: process.env.VERCEL ? 1 : 10 });
if (process.env.NODE_ENV !== "production") globalForDb.auraSql = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Db = typeof db;
