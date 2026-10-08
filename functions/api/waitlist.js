// Cloudflare Pages Function: POST /api/waitlist
// Needs a D1 database bound as "DB" (see schema.sql and README.md).

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clip = (value, max) => String(value ?? "").trim().slice(0, max);
const oneOf = (value, allowed) => (allowed.includes(value) ? value : "");

const PROVINCES = ["QC", "ON", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "YT", "NT", "NU", "XX"];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: real people never fill this hidden field.
  if (data.website) return json({ ok: true });

  const email = clip(data.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "email" }, 400);
  if (data.consent !== true) return json({ ok: false, error: "consent" }, 400);

  const row = [
    email,
    clip(data.bike, 120),
    clip(data.controller_label, 120),
    clip(data.family, 40),
    clip(data.voltage, 20),
    oneOf(data.phone_os, ["android", "ios"]),
    oneOf(data.province, PROVINCES),
    oneOf(data.lang, ["fr", "en"]) || "fr",
    clip(data.consent_version, 20),
  ];

  try {
    await env.DB.prepare(
      `INSERT INTO waitlist
         (email, bike, controller_label, family, voltage, phone_os, province, lang, consent_version)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(email) DO UPDATE SET
         bike = excluded.bike,
         controller_label = excluded.controller_label,
         family = excluded.family,
         voltage = excluded.voltage,
         phone_os = excluded.phone_os,
         province = excluded.province,
         lang = excluded.lang,
         consent_version = excluded.consent_version,
         consent_at = CURRENT_TIMESTAMP,
         unsubscribed_at = NULL`
    ).bind(...row).run();
  } catch (err) {
    console.error("waitlist insert failed", err);
    return json({ ok: false, error: "server" }, 500);
  }

  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: "method" }, 405);
}
