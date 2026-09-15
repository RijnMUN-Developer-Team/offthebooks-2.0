import type { Config } from "@netlify/functions";
import { isAdmin } from "./_shared/auth";
import { siteStore, storeImage } from "./_shared/data";
import { json, methodNotAllowed } from "./_shared/http";

export default async (request: Request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/uploads/")) {
    if (request.method !== "GET") return methodNotAllowed();
    const filename = decodeURIComponent(pathname.slice("/uploads/".length));
    if (!filename || filename.includes("/") || filename.includes("..")) return json({ error: "Not found" }, 404);
    const result = await siteStore().getWithMetadata(`uploads/${filename}`, { type: "blob" });
    if (!result) return json({ error: "Not found" }, 404);
    return new Response(result.data, { headers: { "Content-Type": String(result.metadata.contentType || result.data.type || "application/octet-stream"), "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  }
  if (pathname !== "/api/admin/assets") return json({ error: "Not found" }, 404);
  if (!isAdmin(request)) return json({ error: "Authentication required" }, 401);
  if (request.method !== "POST") return methodNotAllowed();
  const form = await request.formData();
  const asset = form.get("asset");
  if (!(asset instanceof File)) return json({ error: "Choose a supported image file" }, 400);
  try {
    const stored = await storeImage(asset);
    return json({ src: stored.src, filename: asset.name }, 201);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Upload failed" }, 400); }
};

export const config: Config = { path: ["/api/admin/assets", "/uploads/:key"] };

