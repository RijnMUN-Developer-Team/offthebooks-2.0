import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "@netlify/functions";

const COOKIE_NAME = "rijnmun_admin";
const SESSION_HOURS = 12;

type NetlifyRuntime = { env: { get(name: string): string | undefined } };

function env(name: string) {
  const runtime = (globalThis as typeof globalThis & { Netlify?: NetlifyRuntime }).Netlify;
  return runtime?.env.get(name) ?? process.env[name];
}

export const adminUsername = () => env("RIJNMUN_ADMIN_USERNAME");
export const adminPassword = () => env("RIJNMUN_ADMIN_PASSWORD");
const sessionSecret = () => env("RIJNMUN_SESSION_SECRET") || adminPassword();

export function hasAdminConfiguration() {
  return Boolean(adminUsername() && adminPassword() && sessionSecret());
}

export function safeEqual(left: unknown, right: unknown) {
  const a = Buffer.from(String(left ?? ""));
  const b = Buffer.from(String(right ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(payload: string) {
  const secret = sessionSecret();
  return secret ? createHmac("sha256", secret).update(payload).digest("base64url") : "";
}

export function createSession(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, expiresAt: Date.now() + SESSION_HOURS * 60 * 60_000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readCookie(request: Request) {
  const header = request.headers.get("cookie") || "";
  const value = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return value ? decodeURIComponent(value.slice(COOKIE_NAME.length + 1)) : "";
}

export function readSession(request: Request): { username: string; expiresAt: number } | null {
  const [payload, signature] = readCookie(request).split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof session.username === "string" && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export function isAdmin(request: Request) { return Boolean(readSession(request)); }

export function setSessionCookie(context: Context, request: Request, token: string) {
  context.cookies.set({ name: COOKIE_NAME, value: token, httpOnly: true, sameSite: "Strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: SESSION_HOURS * 60 * 60 });
}

export function clearSessionCookie(context: Context) { context.cookies.delete(COOKIE_NAME); }
