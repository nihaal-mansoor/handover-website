import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, dbEnabled, schema } from "@/db";

const googleId = process.env["GOOGLE_CLIENT_ID"];
const googleSecret = process.env["GOOGLE_CLIENT_SECRET"];

/**
 * Without a database there are no accounts, so the adapter is handed a stub.
 * Every call path that reaches auth checks `dbEnabled` first, so the stub is
 * never actually used; it exists to keep the module importable during a build
 * that has no DATABASE_URL.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db ?? ({} as NonNullable<typeof db>), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // better-auth throws when the secret is missing, and that error propagates
  // out of the layout and 500s every page. A generated fallback keeps the site
  // readable; sessions signed with it simply do not survive a redeploy.
  secret:
    process.env["BETTER_AUTH_SECRET"] ||
    (() => {
      console.error("[auth] BETTER_AUTH_SECRET is not set. Sessions will not persist.");
      return crypto.randomUUID() + crypto.randomUUID();
    })(),
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:4330",

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // Nothing is gated behind a verified address yet, and an unverifiable
    // signup wall would cost more community than it saves.
    requireEmailVerification: false,
  },

  // Configured only when credentials exist, so the app runs without them.
  ...(googleId && googleSecret
    ? { socialProviders: { google: { clientId: googleId, clientSecret: googleSecret } } }
    : {}),

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
      trusted: { type: "boolean", defaultValue: false, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  advanced: {
    // Cookies are same-site and http-only by default; this makes it explicit.
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type Session = typeof auth.$Infer.Session;
