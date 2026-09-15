import type { Config } from "@netlify/functions";
import { isAdmin } from "./_shared/auth";
import { getContent, setContent } from "./_shared/data";
import { json, methodNotAllowed, readJsonBody } from "./_shared/http";

export default async (request: Request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/public/content") {
    if (request.method !== "GET") return methodNotAllowed();
    return json(await getContent());
  }
  if (!isAdmin(request)) return json({ error: "Authentication required" }, 401);
  if (request.method === "GET") return json(await getContent());
  if (request.method !== "PUT") return methodNotAllowed();
  const content = await readJsonBody(request);
  if (!content || typeof content !== "object" || Array.isArray(content)) return json({ error: "Invalid content payload" }, 400);
  await setContent(content);
  return json({ saved: true, content });
};

export const config: Config = { path: ["/api/public/content", "/api/admin/content"] };

