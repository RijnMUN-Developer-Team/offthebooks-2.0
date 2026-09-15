import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";

const root = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(root, "dist", "client");
const storageRoot = path.join(root, "storage");
const uploadsRoot = path.join(storageRoot, "uploads");
const contentFile = path.join(storageRoot, "content.json");
const albumsFile = path.join(storageRoot, "albums.json");
const port = Number(process.env.PORT || 4173);
const adminUsername = process.env.RIJNMUN_ADMIN_USERNAME || "rijnmunsecretariat";
const adminPassword = process.env.RIJNMUN_ADMIN_PASSWORD || "RijnMUN@rlo!";

fs.mkdirSync(uploadsRoot, { recursive: true });

const app = express();
const sessions = new Map();
const loginAttempts = new Map();

app.disable("x-powered-by");
app.use((_, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, value) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temp, file);
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sessionFrom(request) {
  const token = request.cookies.rijnmun_admin;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}

function requireAdmin(request, response, next) {
  if (!sessionFrom(request)) return response.status(401).json({ error: "Authentication required" });
  next();
}

app.post("/api/admin/login", (request, response) => {
  const ip = request.ip || "unknown";
  const attempt = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 10 * 60_000 };
  if (attempt.resetAt < Date.now()) { attempt.count = 0; attempt.resetAt = Date.now() + 10 * 60_000; }
  if (attempt.count >= 8) return response.status(429).json({ error: "Too many attempts. Try again later." });
  const { username, password } = request.body || {};
  if (!safeEqual(username, adminUsername) || !safeEqual(password, adminPassword)) {
    attempt.count += 1; loginAttempts.set(ip, attempt);
    return response.status(401).json({ error: "Incorrect username or password" });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { username, expiresAt: Date.now() + 12 * 60 * 60_000 });
  response.cookie("rijnmun_admin", token, { httpOnly: true, sameSite: "strict", secure: process.env.RIJNMUN_COOKIE_SECURE === "true", maxAge: 12 * 60 * 60_000, path: "/" });
  response.json({ authenticated: true, username });
});

app.post("/api/admin/logout", (request, response) => {
  const token = request.cookies.rijnmun_admin;
  if (token) sessions.delete(token);
  response.clearCookie("rijnmun_admin", { path: "/" });
  response.json({ authenticated: false });
});

app.get("/api/admin/session", (request, response) => {
  const session = sessionFrom(request);
  response.status(session ? 200 : 401).json(session ? { authenticated: true, username: session.username } : { authenticated: false });
});

app.get("/api/public/content", (_, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json(readJson(contentFile, {}));
});
app.get("/api/admin/content", requireAdmin, (_, response) => response.json(readJson(contentFile, {})));
app.put("/api/admin/content", requireAdmin, (request, response) => {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) return response.status(400).json({ error: "Invalid content payload" });
  writeJson(contentFile, request.body);
  response.json({ saved: true, content: request.body });
});

app.get("/api/public/albums", (_, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json(readJson(albumsFile, []).filter((album) => album.published !== false));
});
app.get("/api/admin/albums", requireAdmin, (_, response) => response.json(readJson(albumsFile, [])));
app.post("/api/admin/albums", requireAdmin, (request, response) => {
  const { title, year, description = "" } = request.body || {};
  if (!title || !year) return response.status(400).json({ error: "Title and year are required" });
  const albums = readJson(albumsFile, []);
  const album = { id: crypto.randomUUID(), title: String(title).slice(0, 120), year: String(year).slice(0, 4), description: String(description).slice(0, 500), published: true, photos: [], createdAt: new Date().toISOString() };
  albums.unshift(album); writeJson(albumsFile, albums); response.status(201).json(album);
});
app.put("/api/admin/albums/:id", requireAdmin, (request, response) => {
  const albums = readJson(albumsFile, []); const album = albums.find((item) => item.id === request.params.id);
  if (!album) return response.status(404).json({ error: "Album not found" });
  for (const key of ["title", "year", "description", "published"]) if (key in request.body) album[key] = request.body[key];
  writeJson(albumsFile, albums); response.json(album);
});
app.delete("/api/admin/albums/:id", requireAdmin, (request, response) => {
  const albums = readJson(albumsFile, []);
  const index = albums.findIndex((item) => item.id === request.params.id);
  if (index < 0) return response.status(404).json({ error: "Album not found" });
  const [album] = albums.splice(index, 1);
  for (const photo of album.photos || []) {
    if (typeof photo.src === "string" && photo.src.startsWith("/uploads/")) {
      const file = path.join(uploadsRoot, path.basename(photo.src));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
  writeJson(albumsFile, albums);
  response.json({ deleted: true });
});

const upload = multer({
  storage: multer.diskStorage({ destination: uploadsRoot, filename: (_, file, done) => done(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
  fileFilter: (_, file, done) => done(null, ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)),
});
app.post("/api/admin/assets", requireAdmin, upload.single("asset"), (request, response) => {
  if (!request.file) return response.status(400).json({ error: "Choose a supported image file" });
  response.status(201).json({ src: `/uploads/${request.file.filename}`, filename: request.file.originalname });
});
app.post("/api/admin/albums/:id/photos", requireAdmin, upload.array("photos", 20), (request, response) => {
  const albums = readJson(albumsFile, []); const album = albums.find((item) => item.id === request.params.id);
  if (!album) return response.status(404).json({ error: "Album not found" });
  const files = request.files || [];
  const photos = files.map((file) => ({ id: crypto.randomUUID(), src: `/uploads/${file.filename}`, alt: `${album.title} conference photograph`, caption: file.originalname.replace(/\.[^.]+$/, ""), uploadedAt: new Date().toISOString() }));
  album.photos.push(...photos); writeJson(albumsFile, albums); response.status(201).json({ uploaded: photos.length, photos });
});

app.use("/uploads", express.static(uploadsRoot, { fallthrough: false, maxAge: "1h" }));
app.use(express.static(clientRoot, { index: false }));
app.use((request, response, next) => {
  if (request.path.startsWith("/api/")) return next();
  response.sendFile(path.join(clientRoot, "index.html"));
});
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error?.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({ error: error?.message || "Server error" });
});

app.listen(port, "0.0.0.0", () => console.log(`RijnMUN website running at http://localhost:${port}`));
