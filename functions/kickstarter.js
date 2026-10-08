// kadans.ca/kickstarter: one short link for flyers, QR codes and social bios.
// It follows assets/campaign.json, so the campaign link lives in one file only.
// While the campaign is "off" (or the file is unreadable) it falls back to the waitlist.

const FALLBACK = "/#verifier";
const ALLOWED_HOST = /(^|\.)kickstarter\.com$/;

export async function onRequestGet({ request, env }) {
  let target = FALLBACK;
  try {
    const res = await env.ASSETS.fetch(new URL("/assets/campaign.json", request.url));
    if (res.ok) {
      const campaign = await res.json();
      const url = campaign && campaign.state !== "off" ? new URL(campaign.url) : null;
      // Only ever redirect to Kickstarter: a typo in the JSON must not become an open redirect.
      if (url && url.protocol === "https:" && ALLOWED_HOST.test(url.hostname)) target = url.href;
    }
  } catch {
    // Missing, malformed or empty URL: keep the waitlist fallback.
  }
  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store" },
  });
}
