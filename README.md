# RijnMUN Website

The site is a Vite/React app configured for Netlify. Netlify Functions power the admin API and Netlify Blobs persist published content, albums, and uploaded images.

## Local development

Copy `.env.example` to `.env` and set production-quality credentials, then run `npm start`. The Netlify Vite plugin makes the Functions and Blobs APIs available through the same origin as the site.

## Netlify deployment

Connect the repository to Netlify. The included `netlify.toml` builds the site into `dist/client` and configures SPA routing. Set `RIJNMUN_ADMIN_USERNAME`, `RIJNMUN_ADMIN_PASSWORD`, and `RIJNMUN_SESSION_SECRET` in Netlify. There are deliberately no credential fallbacks in source code; do not commit real production secrets.
