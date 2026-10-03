# WalletMandu admin

Standalone React/Vite admin repository. Uses the WalletMandu Nest backend; no backend secrets belong here.

## Run

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5174. The testing backend defaults to `http://localhost:3001`, with API documentation at http://localhost:3001/api/docs. To change it later, set `API_PROXY_TARGET` in `.env` to the backend origin and restart Vite. Sign in with an existing active user whose database role is `admin`. Public registration only creates `user` accounts. Categories and products are managed in separate views. Product creation accepts a required cover image, a `featuredimage` boolean toggle, and up to five detail images. The toggle defaults off and uses the cover image in the carousel when enabled. The product list also lets you switch it on or off.

The server sets HttpOnly access/refresh cookies. Sessions restore on reload and refresh automatically when access expires. Tokens are never stored in localStorage. Non-admin accounts cannot enter the dashboard; the backend also guards every mutation.

## Deployment

Run `npm run build` and serve `dist`. Proxy `/api` to the backend, or set `VITE_API_URL` at build time to its `/api` URL. Configure the backend `CORS_ORIGIN` as a comma-separated list of exact storefront/admin origins, including scheme and port. Production cookies require HTTPS. Host UI and API on the same site for SameSite=Lax cookies (a same-origin `/api` reverse proxy is recommended). `VITE_STOREFRONT_URL` controls the store link.

This folder is its own local Git repository. No remote repository has been created.
