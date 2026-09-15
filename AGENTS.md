# Prototype Instructions

- Netlify is the canonical deployment target for this project. Keep all application routes, server behavior, authentication, content persistence, and uploaded media compatible with Netlify.
- Use Netlify Functions for server-side APIs and Netlify Blobs for durable website content and uploaded media. Do not depend on writable local disk or in-memory sessions in production.
- Keep `npm start` as a working local entry point that exercises the Netlify Vite integration.
- Run the local server and open the preview in the available browser when changing the prototype.
- Build app UI in `src/`.
- Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact when present.
- Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

