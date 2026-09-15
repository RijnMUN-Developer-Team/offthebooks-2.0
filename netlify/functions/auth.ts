import { createHash } from "node:crypto";
import type { Config, Context } from "@netlify/functions";
import { adminPassword, adminUsername, clearSessionCookie, createSession, hasAdminConfiguration, readSession, safeEqual, setSessionCookie } from "./_shared/auth";
import { siteStore } from "./_shared/data";
import { json, methodNotAllowed, readJsonBody } from "./_shared/http";

type Attempt = { count: number; resetAt: number };

function attemptKey(request: Request) {
  const ip = request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return `login-attempts/${createHash("sha256").update(ip).digest("hex")}.json`;
}

export default async (request: Request, context: Context) => {
  const pathname = new URL(request.url).pathname;
  if (!hasAdminConfiguration()) return json({ error: "Admin authentication is not configured" }, 503);
  if (pathname === "/api/admin/session") {
    if (request.method !== "GET") return methodNotAllowed();
    const session = readSession(request);
    return json(session ? { authenticated: true, username: session.username } : { authenticated: false }, session ? 200 : 401);
  }
  if (pathname === "/api/admin/logout") {
    if (request.method !== "POST") return methodNotAllowed();
    clearSessionCookie(context);
    return json({ authenticated: false });
  }
  if (pathname !== "/api/admin/login") return json({ error: "Not found" }, 404);
  if (request.method !== "POST") return methodNotAllowed();
  const key = attemptKey(request);
  const store = siteStore();
  const now = Date.now();
  const stored = await store.get(key, { type: "json" }) as Attempt | null;
  const attempt = stored && stored.resetAt > now ? stored : { count: 0, resetAt: now + 10 * 60_000 };
  if (attempt.count >= 8) return json({ error: "Too many attempts. Try again later." }, 429);
  const body = await readJsonBody(request) as { username?: string; password?: string } | null;
  if (!safeEqual(body?.username, adminUsername()) || !safeEqual(body?.password, adminPassword())) {
    await store.setJSON(key, { ...attempt, count: attempt.count + 1 });
    return json({ error: "Incorrect username or password" }, 401);
  }
  await store.delete(key);
  const username = adminUsername() as string;
  setSessionCookie(context, request, createSession(username));
  return json({ authenticated: true, username });
};

export const config: Config = { path: ["/api/admin/login", "/api/admin/logout", "/api/admin/session"] };
