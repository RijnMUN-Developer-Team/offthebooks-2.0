export const json = (body: unknown, status = 200, extraHeaders: HeadersInit = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...extraHeaders,
    },
  });

export async function readJsonBody(request: Request) {
  try { return await request.json(); } catch { return null; }
}

export const methodNotAllowed = () => json({ error: "Method not allowed" }, 405);

