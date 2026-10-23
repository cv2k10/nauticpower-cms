# Nautic Power CMS

Marketing site and admin CMS for Nautic Power, running as a single Cloudflare Worker:

- **Hono** API in [`worker/`](worker) that also serves the React app (Workers Static Assets)
- **D1** for site content, settings, enquiries, the admin passcode hash and the media index
- **R2** for images uploaded in the admin
- **Email Routing** (`send_email` binding) to email each new enquiry to the business

The React app lives in [`src/`](src). The public site is at `/`, and the admin is at `/#/admin`.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_PASSCODE and SESSION_SECRET
npm run db:migrate:local
npm run dev                      # http://localhost:5173
```

`vite dev` runs the Worker inside workerd, with local D1, R2 and email bindings, so the whole stack runs locally. Local data lives in `.wrangler/`. Emails are written to `.wrangler/tmp/email/…` and are not sent.

Sign in at `/#/admin` with the `ADMIN_PASSCODE` from `.dev.vars`. On the first successful login it is stored in D1 as a PBKDF2 hash. After that, change it under **Brand & theme**.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite + Worker dev server |
| `npm run typecheck` | Type-checks the app, the Worker and the tests |
| `npm test` | Worker API tests (Vitest in workerd, with real local D1 and R2) |
| `npm run build` | Builds the client into `dist/client` and bundles the Worker |
| `npm run preview` | Builds and serves the production bundle locally |
| `npm run cf-typegen` | Regenerates `worker/worker-configuration.d.ts` after you edit `wrangler.jsonc` |

## Deploying to Cloudflare

1. Create the resources:
   ```bash
   npx wrangler d1 create nauticpower-cms        # copy the database_id into wrangler.jsonc
   npx wrangler r2 bucket create nauticpower-media
   ```
2. Set the secrets:
   ```bash
   npx wrangler secret put ADMIN_PASSCODE   # first-run passcode
   npx wrangler secret put SESSION_SECRET   # e.g. `openssl rand -base64 32`
   ```
3. Set up enquiry email:
   - Enable **Email Routing** on the domain you send from.
   - Verify the destination address.
   - Update `ENQUIRY_EMAIL_TO`, `ENQUIRY_EMAIL_FROM` and `send_email.destination_address` in `wrangler.jsonc`. `ENQUIRY_EMAIL_FROM` must be an address on that domain.
4. Deploy. This applies D1 migrations remotely, builds, then runs `wrangler deploy`:
   ```bash
   npm run deploy
   ```

## How it fits together

- `GET /` is handled by the Worker. It fetches `index.html` from the static assets and inlines the published content as `window.__NP_BOOT__`, so the first render already shows the live copy. All other static files are served directly from assets.
- **Admin edits** auto-save: the client debounces edits for 800 ms and then sends `PUT /api/admin/content` or `/settings`.
- **Admin auth:** routes under `/api/admin/*` need a signed HttpOnly session cookie (12 hours). Write requests also need the `X-Requested-With: nauticpower-cms` header. Changing the passcode signs out every other session.
- **Enquiries:** `POST /api/enquiries` validates the form (zod, plus a honeypot field), stores it in D1 with an `NP-YYYYMM-NNN` reference and, if enabled, emails it to the business.
- **Media:**
  - Uploads go to R2 as JPG, PNG, WebP, GIF or AVIF, up to 10 MB each.
  - They are served from `/media/<key>` with immutable caching.
  - The six original photos remain bundled under `public/images`.

| Path | Role |
| --- | --- |
| `worker/index.ts` | App entry, boot-payload injection, assets fallback |
| `worker/routes/` | `public.ts`, `auth.ts`, `admin.ts`, `media.ts` |
| `worker/lib/` | D1 access, auth (PBKDF2 + HMAC cookies, login throttling), email, zod schemas |
| `migrations/` | D1 schema |
| `src/cms/store.tsx` | Client data layer (API calls, auto-save, optimistic enquiry updates) |
| `src/cms/content.ts` | Content types and default copy (shared with the Worker) |
| `src/cms/shared.ts` | Helpers shared by client and Worker (merge, CSV, email text) |
