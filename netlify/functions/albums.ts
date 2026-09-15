import type { Config } from "@netlify/functions";
import { isAdmin } from "./_shared/auth";
import { getAlbums, setAlbums, siteStore, storeImage } from "./_shared/data";
import { json, methodNotAllowed, readJsonBody } from "./_shared/http";

export default async (request: Request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/public/albums") {
    if (request.method !== "GET") return methodNotAllowed();
    return json((await getAlbums()).filter((album) => album.published !== false));
  }
  if (!isAdmin(request)) return json({ error: "Authentication required" }, 401);
  const albums = await getAlbums();
  if (pathname === "/api/admin/albums") {
    if (request.method === "GET") return json(albums);
    if (request.method !== "POST") return methodNotAllowed();
    const body = await readJsonBody(request) as { title?: unknown; year?: unknown; description?: unknown } | null;
    if (!body?.title || !body?.year) return json({ error: "Title and year are required" }, 400);
    const album = { id: crypto.randomUUID(), title: String(body.title).slice(0, 120), year: String(body.year).slice(0, 4), description: String(body.description ?? "").slice(0, 500), published: true, photos: [], createdAt: new Date().toISOString() };
    albums.unshift(album);
    await setAlbums(albums);
    return json(album, 201);
  }
  const photoMatch = pathname.match(/^\/api\/admin\/albums\/([^/]+)\/photos$/);
  if (photoMatch) {
    if (request.method !== "POST") return methodNotAllowed();
    const album = albums.find((item) => item.id === decodeURIComponent(photoMatch[1]));
    if (!album) return json({ error: "Album not found" }, 404);
    const form = await request.formData();
    const files = form.getAll("photos").filter((value): value is File => value instanceof File).slice(0, 20);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const stored = await storeImage(file);
        return { id: crypto.randomUUID(), src: stored.src, alt: `${album.title} conference photograph`, caption: file.name.replace(/\.[^.]+$/, ""), uploadedAt: new Date().toISOString() };
      }));
      album.photos.push(...uploaded);
      await setAlbums(albums);
      return json({ uploaded: uploaded.length, photos: uploaded }, 201);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Upload failed" }, 400); }
  }
  const albumMatch = pathname.match(/^\/api\/admin\/albums\/([^/]+)$/);
  if (!albumMatch) return json({ error: "Not found" }, 404);
  const index = albums.findIndex((item) => item.id === decodeURIComponent(albumMatch[1]));
  if (index < 0) return json({ error: "Album not found" }, 404);
  if (request.method === "PUT") {
    const body = await readJsonBody(request) as Record<string, unknown> | null;
    if (!body) return json({ error: "Invalid album payload" }, 400);
    for (const key of ["title", "year", "description", "published"] as const) if (key in body) Object.assign(albums[index], { [key]: body[key] });
    await setAlbums(albums);
    return json(albums[index]);
  }
  if (request.method === "DELETE") {
    const [album] = albums.splice(index, 1);
    await Promise.all((album.photos || []).filter((photo) => photo.src.startsWith("/uploads/")).map((photo) => siteStore().delete(`uploads/${photo.src.split("/").pop()}`)));
    await setAlbums(albums);
    return json({ deleted: true });
  }
  return methodNotAllowed();
};

export const config: Config = { path: ["/api/public/albums", "/api/admin/albums", "/api/admin/albums/:id", "/api/admin/albums/:id/photos"] };

