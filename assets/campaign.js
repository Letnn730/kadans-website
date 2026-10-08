/* Kickstarter link.
 *
 * Reads assets/campaign.json and shows the banner and buttons that match the
 * campaign state. The JSON is the only thing to edit when the campaign moves on:
 *   off       nothing shown (waitlist only)
 *   prelaunch "launching on <date>, get notified"  -> Kickstarter pre-launch page
 *   live      "live now, back Kadans"
 *   funded    "funded, late pledges open"
 * kadans.ca/kickstarter (functions/kickstarter.js) follows the same file.
 *
 * Outside the production site, ?campaign=prelaunch|live|funded previews a state.
 */
(() => {
  "use strict";

  const script = document.currentScript;
  const root = document.querySelector("[data-lang]");
  if (!script || !root) return;

  const lang = root.dataset.lang === "en" ? "en" : "fr";
  const STATES = ["prelaunch", "live", "funded"];
  const KICKSTARTER = /(^|\.)kickstarter\.com$/;
  const PRODUCTION = /(^|\.)kadans\.ca$/.test(location.hostname);

  const price = (cad) => (lang === "fr" ? `${cad} $` : `CAD ${cad}`);
  const day = (iso) => {
    const date = iso ? new Date(`${iso}T12:00:00`) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", { day: "numeric", month: "long" });
  };

  const TEXT = {
    fr: {
      label: "Kickstarter",
      prelaunch: (c) => ({
        banner: c.date
          ? `Lancement le ${c.date}. Prix lève-tôt de ${price(c.early)} pour les 100 premiers.`
          : `Lancement bientôt. Prix lève-tôt de ${price(c.early)} pour les 100 premiers.`,
        cta: "Être averti du lancement",
      }),
      live: (c) => ({ banner: `En ligne maintenant. Prix lève-tôt de ${price(c.early)} pour les 100 premiers.`, cta: "Contribuer sur Kickstarter" }),
      funded: () => ({ banner: "Campagne financée, merci. Les contributions tardives sont ouvertes.", cta: "Contribuer en retard" }),
    },
    en: {
      label: "Kickstarter",
      prelaunch: (c) => ({
        banner: c.date
          ? `Launching ${c.date}. Early-bird price of ${price(c.early)} for the first 100.`
          : `Launching soon. Early-bird price of ${price(c.early)} for the first 100.`,
        cta: "Get notified at launch",
      }),
      live: (c) => ({ banner: `Live now. Early-bird price of ${price(c.early)} for the first 100.`, cta: "Back Kadans on Kickstarter" }),
      funded: () => ({ banner: "Funded, thank you. Late pledges are open.", cta: "Make a late pledge" }),
    },
  }[lang];

  function safeUrl(raw) {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" && KICKSTARTER.test(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }

  function link(className, label, href) {
    const a = document.createElement("a");
    a.className = className;
    a.href = href;
    a.textContent = label;
    a.dataset.campaignLink = "";
    return a;
  }

  function render(campaign) {
    const preview = PRODUCTION ? null : new URLSearchParams(location.search).get("campaign");
    const state = STATES.includes(preview) ? preview : campaign.state;
    if (!STATES.includes(state)) return;
    const href = safeUrl(campaign.url) || (preview ? "https://www.kickstarter.com/" : null);
    if (!href) return;

    const copy = TEXT[state]({ date: day(campaign.launch), early: Number(campaign.early_bird_cad) || 129 });

    // Banner under the header.
    const banner = document.createElement("aside");
    banner.className = "ks-banner";
    banner.setAttribute("aria-label", TEXT.label);
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const text = document.createElement("p");
    const tag = document.createElement("span");
    tag.className = "ks-tag";
    tag.textContent = TEXT.label;
    text.append(tag, document.createTextNode(copy.banner));
    wrap.append(text, link("btn btn-primary btn-sm", copy.cta, href));
    banner.append(wrap);
    document.querySelector("header.top")?.after(banner);

    // Hero button. While live, Kickstarter becomes the main action.
    const ctas = document.querySelector(".hero-ctas");
    if (ctas) {
      if (state === "live") {
        ctas.querySelectorAll(".btn-primary").forEach((b) => b.classList.replace("btn-primary", "btn-ghost"));
        ctas.prepend(link("btn btn-primary", copy.cta, href));
      } else {
        ctas.append(link("btn btn-ghost", copy.cta, href));
      }
    }

    // Footer link.
    document.querySelector(".foot-links")?.append(link("", TEXT.label, href));
  }

  fetch(new URL("campaign.json", script.src), { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : null))
    .then((campaign) => { if (campaign) render(campaign); })
    .catch(() => { /* No campaign info: the page works as before. */ });
})();
