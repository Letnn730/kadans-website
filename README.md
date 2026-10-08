# kadans.ca

Bilingual landing page for **Kadans by FORGE**: product explanation, compatibility check and waitlist.
French at `/`, English at `/en/`. Plain HTML, CSS and JS: no build step.

## Structure

| Path | What |
| --- | --- |
| `index.html` | French home page |
| `en/index.html` | English home page |
| `confidentialite/`, `en/privacy/` | Privacy policy (Quebec Law 25) |
| `assets/site.css` | Styles, following the FORGE brand guide (Obsidienne / Blanc Titane / Cyan Glacial, Inter + JetBrains Mono) |
| `assets/compat.js` | Compatibility list used by "Vérifier mon vélo". Keep in step with `ebike-profiles` |
| `assets/site.js` | Compatibility tool and waitlist form |
| `assets/demo.js`, `assets/demo.css` | Hero demo: the app's Ride and Settings screens running its simulator in the browser. Mirrors `ebike-app` (screens, wording, safety rules); only the Simulator source is offered. Keep in step when the app's UI changes |
| `functions/api/waitlist.js` | Cloudflare Pages Function that stores sign-ups in D1 |
| `schema.sql` | D1 table |
| `_headers` | Security headers |

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
   Framework preset: *None*. Build command: empty. Output directory: `/`.
2. **Storage & Databases → D1 → Create database** named `kadans-waitlist`.
   Open its *Console* tab, paste the contents of `schema.sql`, run it.
3. Pages project → **Settings → Bindings → Add → D1 database**: variable name `DB`, database `kadans-waitlist`.
   Redeploy once.
4. Pages project → **Custom domains** → add `kadans.ca` (and `www.kadans.ca`).

Every pull request gets its own preview URL (`*.pages.dev`), where the form is live.

## Updating compatibility

Edit `assets/compat.js`. A family moves to `"ok"` only when its profile in `ebike-profiles` is `bench-verified`.

## Exporting the waitlist

D1 console: `SELECT email, lang, family, voltage FROM waitlist WHERE unsubscribed_at IS NULL;`
Every email you send must include FORGE's name, a contact address and a working unsubscribe link (CASL).
