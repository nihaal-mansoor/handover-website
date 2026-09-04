import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env["DATABASE_URL"];
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

/** One pooled client per process. Next reloads modules in dev, so cache it. */
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };
const client = globalForDb.__sql ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.__sql = client;

export const db = drizzle(client, { schema });
export { schema };
