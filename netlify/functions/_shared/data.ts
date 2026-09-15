import { getStore } from "@netlify/blobs";
import defaultContent from "../../../storage/content.json";
import defaultAlbums from "../../../storage/albums.json";

export type AlbumPhoto = { id: string; src: string; alt: string; caption: string; uploadedAt?: string };
export type Album = { id: string; title: string; year: string; description: string; published: boolean; createdAt: string; photos: AlbumPhoto[] };

export const siteStore = () => getStore({ name: "rijnmun-site", consistency: "strong" });
export async function getContent() { return (await siteStore().get("content.json", { type: "json" })) ?? structuredClone(defaultContent); }
export async function setContent(content: unknown) { await siteStore().setJSON("content.json", content); }
export async function getAlbums(): Promise<Album[]> { return (await siteStore().get("albums.json", { type: "json" })) ?? structuredClone(defaultAlbums) as Album[]; }
export async function setAlbums(albums: Album[]) { await siteStore().setJSON("albums.json", albums); }

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxImageBytes = 5 * 1024 * 1024;

function extensionFor(file: File) {
  const original = file.name.split(".").pop()?.toLowerCase();
  if (original && new Set(["jpg", "jpeg", "png", "webp", "gif"]).has(original)) return original;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
}

export async function storeImage(file: File) {
  if (!supportedImageTypes.has(file.type)) throw new Error("Choose a JPEG, PNG, WebP, or GIF image");
  if (file.size > maxImageBytes) throw new Error("Images must be 5 MB or smaller");
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extensionFor(file)}`;
  await siteStore().set(`uploads/${filename}`, file, { metadata: { contentType: file.type, originalName: file.name } });
  return { filename, src: `/uploads/${filename}` };
}

