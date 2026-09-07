import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The database is optional.
 *
 * Reading the site must not depend on it. If DATABASE_URL is absent or the
 * server is unreachable, articles still render and comments degrade to an
 * empty list rather than taking the page down with them.
 *
 * `db` is null when unconfigured. Callers must handle that, which is why
 * queries.ts returns empty arrays and actions.ts refuses politely.
 */
const url = process.env["DATABASE_URL"];

const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
  __warned?: boolean;
};

function makeClient() {
  if (!url) {
    if (!globalForDb.__warned) {
      globalForDb.__warned = true;
      console.warn(
        "[db] DATABASE_URL is not set. Accounts, comments and the forum are disabled; the rest of the site works.",
      );
    }
    return null;
  }
  return (
    globalForDb.__sql ??
    postgres(url, {
      max: 10,
      onnotice: () => {},
      // Without these an unreachable host holds the request open until the
      // serverless function times out, which surfaces as a 500 rather than
      // falling back to the MDX content.
      connect_timeout: 5,
      idle_timeout: 20,
    })
  );
}

const client = makeClient();
if (client && process.env.NODE_ENV !== "production") globalForDb.__sql = client;

export const db = client ? drizzle(client, { schema }) : null;
export const dbEnabled = Boolean(client);
export { schema };
