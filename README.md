# kurant.ca

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
| `assets/campaign.json`, `assets/campaign.js` | Kickstarter state and link; the script shows the matching banner and buttons |
| `functions/kickstarter.js` | `kadans.ca/kickstarter` short link, redirects to the URL in `campaign.json` (Kickstarter only), else to the waitlist |
| `functions/api/waitlist.js` | Cloudflare Pages Function that stores sign-ups in D1 |
| `schema.sql` | D1 table |
| `_headers` | Security headers (CSP, HSTS) and no-cache for `campaign.json` |
| `404.html`, `robots.txt`, `sitemap.xml` | Not-found page, crawler rules, sitemap with FR/EN alternates |
| `assets/og-fr.png`, `assets/og-en.png` | Share images (1200 × 630) for social posts |

## Deploy (Cloudflare Pages)

Everything below is free except the domain (about USD 9 a year for `.ca` at Cloudflare Registrar, at cost).

1. **Domain.** Cloudflare dashboard → **Domain Registration → Register Domains** → `kadans.ca`. CIRA's Canadian-presence rule applies (a Canadian resident qualifies). Registering it here puts its DNS on Cloudflare automatically.
2. **Database.** **Storage & Databases → D1 → Create database** named `kadans-waitlist`. Open its **Console**, paste `schema.sql`, run it.
3. **Pages project.** **Workers & Pages → Create → Pages → Connect to Git** → this repo, production branch `main`. Framework preset *None*, build command `exit 0`, build output directory `/`.
4. **Binding.** Pages project → **Settings → Bindings → Add → D1 database**: variable name `DB`, database `kadans-waitlist`. Then **Deployments → Retry deployment** so the binding takes effect.
5. **Custom domain.** Pages project → **Custom domains** → add `kadans.ca`, then `www.kadans.ca`.
6. **Email.** Domain → **Email → Email Routing** → enable, add the DNS records it proposes, create `bonjour@kadans.ca` forwarding to your inbox and confirm the verification email.
7. **Check.** Open `https://kadans.ca`, sign up with your own email, and confirm the row appears in the D1 console.

Every pull request gets its own preview URL (`*.pages.dev`), where the form is live and `?campaign=` previews work.

To test locally on the same runtime: copy the site to a scratch folder, add a throwaway `wrangler.toml` with a `DB` D1 binding, run `wrangler d1 execute DB --local --file schema.sql`, then `wrangler pages dev .`. Don't commit that `wrangler.toml`: once one exists, it overrides the dashboard bindings.

## Kickstarter campaign

Edit only `assets/campaign.json`, then push:

| `state` | What the site shows |
| --- | --- |
| `off` | Nothing (waitlist only) |
| `prelaunch` | Banner "launching on `launch`, get notified", linking to the pre-launch page |
| `live` | Banner and a main hero button "Back Kadans on Kickstarter" |
| `funded` | Banner "late pledges open" |

- `url`: paste the link Kickstarter generates for the referral tag `kadans-site` (Promotion tab), so pledges from the site show in the creator dashboard. Only `https://*.kickstarter.com` links are used.
- `launch`: `YYYY-MM-DD`, shown in the pre-launch banner.
- `kadans.ca/kickstarter` follows the same file: use it on flyers, QR codes and social bios.
- To preview a state before switching, open any non-production URL with `?campaign=prelaunch`, `live` or `funded`.

## Updating compatibility

Edit `assets/compat.js`. A family moves to `"ok"` only when its profile in `ebike-profiles` is `bench-verified`.

## Exporting the waitlist

D1 console: `SELECT email, lang, family, voltage FROM waitlist WHERE unsubscribed_at IS NULL;`
Every email you send must include FORGE's name, a contact address and a working unsubscribe link (CASL).
