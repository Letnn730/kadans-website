/* Kurant app demo.
 *
 * A browser mirror of the Android app connected to its built-in simulator. Screens,
 * wording and safety rules follow ebike-app:
 *   - DashboardScreen / SpeedGauge / AssistSelector / HoldToConfirmButton (Ride tab)
 *   - SettingsScreen / SpeedModeUi (Settings tab), ConnectionSheet
 *   - MockTransport physics, SpeedModeController.reconcile, settingWritability
 * Only the Simulator source is offered. Nothing is sent or stored.
 */
(() => {
  "use strict";

  const host = document.querySelector("[data-demo]");
  if (!host) return;

  const FR = /^fr/i.test(document.documentElement.lang || "");

  /* ---------------------------------------------------------------- constants */

  const TICK_MS = 100;            // KT frame interval (profile transport.txIntervalMs)
  const STOPPED_KMH = 0.5;        // STOPPED_SPEED_KMH: above this, the bike is moving
  const HOLD_MS = 1500;           // MODE_SWITCH_HOLD_MS
  const ACK_SECONDS = 3;          // Offroad acknowledgement countdown
  const WRITE_MS = 450;           // visible "Applying…" time for a controller write
  const LIMIT_MIN = 10;           // KT maxSpeedKmh range
  const LIMIT_MAX = 72;
  const START_SOC = 87;           // MockTransport starting state of charge
  const CAPS = { AB: 32, BC: 32, MB: 32, NB: 32, NL: 32, NS: 30, NT: 32, NU: 32, ON: 32, PE: 32, QC: 32, SK: 32, YT: 32 };
  const PROFILE = { id: "kt-uart-generic", name: "KT / Kunteng UART (LCD3-class)", version: "0.4.0", brands: "KT / Kunteng · BMSBattery S-series" };
  const ASSIST_LEVELS = [0, 1, 2, 3, 4, 5];

  /* ---------------------------------------------------------------- strings */

  const T = FR ? {
    region: "Démo interactive de l'application Kurant, en simulation",
    sim: "Simulation", ride: "Rouler", settings: "Réglages",
    simulator: "Simulateur", connDetails: "Détails de la connexion",
    street: "Ville", offroad: "Hors-route",
    limit: (n) => `LIMITE ${n}`,
    holdTo: (m) => `Maintenir pour passer en ${m}`,
    stopTo: (m) => `Arrêtez-vous pour passer en ${m}`,
    pendingAlert: (n) => `La limite de ${n} km/h s'applique à l'arrêt`,
    power: "Puissance", battery: "Batterie", headlight: "Phare", assistLevel: (l) => `Assistance ${l}`,
    profile: "Profil du contrôleur", bench: "Vérifié au banc", bundled: "Inclus dans l'app", change: "Changer",
    secSpeed: "Limite de vitesse", active: "Actif",
    switchTo: (m) => `Passer en ${m}`, pressHold: "Maintenir appuyé",
    ctrlLimit: "Limite du contrôleur", ctrlLimitSub: "Ce que le contrôleur applique en ce moment",
    applied: "Appliquée", applying: "Application…", whenStopped: "S'applique à l'arrêt", waitingOk: "En attente de votre OK", lowerThan: "Plus basse que le mode",
    maxSpeed: "Vitesse max.",
    streetSub: (c) => `Limite Ville · maximum légal ${c} km/h`,
    aboveSaves: (c) => `Au-dessus de la limite légale de ${c} km/h : enregistrée en Hors-route`,
    offAbove: (c) => `Limite Hors-route · au-dessus de la limite légale de ${c} km/h`,
    offSub: "Limite Hors-route",
    province: "Province ou territoire", legal: (n) => `limite légale ${n} km/h`, chooseProvince: "Choisir la province ou le territoire",
    lowerMoving: "Passer en Ville en roulant",
    lowerMovingSub: "La limite du contrôleur baisse à votre prochain arrêt. Le mode Hors-route exige toujours un arrêt.",
    saveAsOff: (n) => `Enregistrer ${n} km/h en Hors-route ?`,
    saveAsOffBody: (c, p, s) => `C'est au-dessus de la limite de ${c} km/h pour les vélos à assistance électrique (${p}), donc ce ne peut être que votre limite Hors-route. Le mode Ville reste à ${s} km/h.`,
    saveAsOffBtn: "Enregistrer en Hors-route", cancel: "Annuler",
    ackTitle: (n) => `Mode Hors-route · ${n} km/h`,
    ackAbove: (c, p) => `C'est au-dessus de la limite légale de ${c} km/h pour les vélos à assistance électrique (${p}).`,
    ackBody: "Utilisez le mode Hors-route seulement sur un terrain privé ou là où c'est permis. Vous êtes responsable de la conduite du vélo.",
    useStreet: "Rester en Ville",
    secGps: "Précision de la vitesse", gpsTitle: "Fonctionne avec le module",
    gpsSub: "Compare la vitesse GPS à celle du contrôleur pour repérer une mauvaise taille de roue.",
    groups: { bike: "Vélo", battery: "Batterie", pas: "Assistance au pédalage", motor: "Moteur" },
    critical: "Critique", caution: "Prudence",
    stopToChange: "Arrêtez le vélo pour modifier ce réglage.",
    revert: "Annuler", apply: "Appliquer", saved: "Enregistré.",
    decrease: (l) => `Diminuer : ${l}`, increase: (l) => `Augmenter : ${l}`,
    changeQ: (l) => `Modifier « ${l} » ?`,
    typedBody: "Ce réglage touche la sécurité ou la légalité. Tapez CONFIRMER pour l'appliquer.",
    typedWord: "CONFIRMER", typedLabel: "Tapez CONFIRMER",
    secDevice: "Appareil", connection: "Connexion", firmware: "Micrologiciel du module", withModule: "Offert avec le module Kurant",
    foot: `Démo web · ${PROFILE.id} v${PROFILE.version}`,
    sheetTitle: "Connexion", source: "Source", virtualBike: "Vélo virtuel",
    module: "Module Kurant", moduleSub: "Sans fil · offert avec le module",
    running: `Vélo simulé en marche · ${PROFILE.name}`,
    profiles: "Profil du contrôleur",
    done: "Fermer",
    decimal: ",",
    provinces: { AB: "Alberta", BC: "Colombie-Britannique", MB: "Manitoba", NB: "Nouveau-Brunswick", NL: "Terre-Neuve-et-Labrador", NS: "Nouvelle-Écosse", NT: "Territoires du Nord-Ouest", NU: "Nunavut", ON: "Ontario", PE: "Île-du-Prince-Édouard", QC: "Québec", SK: "Saskatchewan", YT: "Yukon" },
    settings_: {
      wheelSize: ["Taille de roue", "Le diamètre de votre roue. Le contrôleur s'en sert pour mesurer la vitesse et appliquer la limite. Une mauvaise valeur fausse le compteur."],
      p5: ["Comportement de la jauge (P5)", "Façon dont la jauge de batterie est calculée. Une valeur basse suit la tension tout de suite (la jauge saute à l'effort), une valeur haute fait une moyenne."],
      c12: ["Seuil de coupure basse tension (C12)", "Décale la tension à laquelle le contrôleur coupe pour protéger la batterie. Trop bas, il peut vider complètement et détruire une batterie au lithium : un risque pour la sécurité."],
      c1: ["Type de capteur de pédalage (C1)", "Le capteur d'assistance au pédalage de votre vélo. Une mauvaise valeur donne une assistance absente ou qui ne s'arrête pas. À changer seulement si l'assistance se comporte mal."],
      c5: ["Courant maximal (C5)", "Limite le courant tiré par le contrôleur. L'augmenter donne plus de puissance ET plus de chaleur dans le moteur, le câblage et la batterie. Peut endommager des pièces pour de bon et annuler des garanties."],
      c13: ["Freinage régénératif (C13)", "Force du freinage régénératif, si votre moteur le permet (moteurs-roues à prise directe seulement). Les moteurs à engrenages l'ignorent."],
    },
  } : {
    region: "Interactive demo of the Kurant app, in simulation",
    sim: "Simulation", ride: "Ride", settings: "Settings",
    simulator: "Simulator", connDetails: "Connection details",
    street: "Street", offroad: "Offroad",
    limit: (n) => `LIMIT ${n}`,
    holdTo: (m) => `Hold to switch to ${m}`,
    stopTo: (m) => `Stop to switch to ${m}`,
    pendingAlert: (n) => `${n} km/h limit applies when you stop`,
    power: "Power", battery: "Battery", headlight: "Headlight", assistLevel: (l) => `Assist level ${l}`,
    profile: "Controller profile", bench: "Bench-verified", bundled: "Bundled with app", change: "Change",
    secSpeed: "Speed limit", active: "Active",
    switchTo: (m) => `Switch to ${m}`, pressHold: "Press and hold",
    ctrlLimit: "Controller limit", ctrlLimitSub: "What the controller enforces right now",
    applied: "Applied", applying: "Applying…", whenStopped: "Applies when stopped", waitingOk: "Waiting for your OK", lowerThan: "Lower than mode",
    maxSpeed: "Max speed",
    streetSub: (c) => `Street limit · legal maximum ${c} km/h`,
    aboveSaves: (c) => `Above the ${c} km/h legal limit — saves as Offroad`,
    offAbove: (c) => `Offroad limit · above the ${c} km/h legal limit`,
    offSub: "Offroad limit",
    province: "Province or territory", legal: (n) => `legal limit ${n} km/h`, chooseProvince: "Choose province or territory",
    lowerMoving: "Switch to Street while riding",
    lowerMovingSub: "The controller limit drops at your next stop. Offroad always needs a stop.",
    saveAsOff: (n) => `Save ${n} km/h as Offroad?`,
    saveAsOffBody: (c, p, s) => `That's above the ${c} km/h limit for power-assisted bicycles in ${p}, so it can only be your Offroad limit. Street mode stays at ${s} km/h.`,
    saveAsOffBtn: "Save as Offroad", cancel: "Cancel",
    ackTitle: (n) => `Offroad mode · ${n} km/h`,
    ackAbove: (c, p) => `This is above the ${c} km/h legal limit for power-assisted bicycles in ${p}.`,
    ackBody: "Use Offroad mode only on private land or where it's permitted. You're responsible for how the bike is ridden.",
    useStreet: "Use Street",
    secGps: "Speed accuracy", gpsTitle: "Runs with the module",
    gpsSub: "Compares GPS speed with the controller's to catch a wrong wheel size.",
    groups: { bike: "Bike", battery: "Battery", pas: "Pedal Assist", motor: "Motor" },
    critical: "Critical", caution: "Caution",
    stopToChange: "Stop the bike to change this setting.",
    revert: "Revert", apply: "Apply", saved: "Saved.",
    decrease: (l) => `Decrease ${l}`, increase: (l) => `Increase ${l}`,
    changeQ: (l) => `Change ${l}?`,
    typedBody: "This setting affects safety or legality. Type CONFIRM to apply it.",
    typedWord: "CONFIRM", typedLabel: "Type CONFIRM",
    secDevice: "Device", connection: "Connection", firmware: "Module firmware", withModule: "Comes with the Kurant module",
    foot: `Web demo · ${PROFILE.id} v${PROFILE.version}`,
    sheetTitle: "Connection", source: "Source", virtualBike: "Virtual bike",
    module: "Kurant module", moduleSub: "Wireless · comes with the module",
    running: `Simulated bike running · ${PROFILE.name}`,
    profiles: "Controller profile",
    done: "Close",
    decimal: ".",
    provinces: { AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec", SK: "Saskatchewan", YT: "Yukon" },
    settings_: {
      wheelSize: ["Wheel size", "Your wheel diameter. Used by the controller for speed measurement and the speed limit. Wrong values make the speedometer lie."],
      p5: ["Battery meter behavior (P5)", "How the battery gauge is computed. Low values react to voltage instantly (gauge bounces under load), higher values average it."],
      c12: ["Low-voltage cutoff adjust (C12)", "Shifts the voltage at which the controller shuts down to protect the battery. Setting it too low can over-discharge and destroy lithium batteries — a safety hazard."],
      c1: ["Pedal sensor type (C1)", "Which pedal-assist sensor your bike has. Wrong values mean no assist or assist that won't stop. Change only if pedal assist misbehaves."],
      c5: ["Maximum current (C5)", "Limits how much current the controller draws. Raising it increases power AND heat in your motor, wiring and battery. Can permanently damage components and void warranties."],
      c13: ["Regenerative braking (C13)", "Strength of regenerative braking, if your motor supports it (direct-drive hubs only). Geared motors ignore this."],
    },
  };

  /* Profile settings (kt-uart-generic.json), in the app's display order. maxSpeedKmh is
     owned by the Speed limit section, as in SettingsScreen (SPEED_MODE_OWNED_SETTINGS). */
  const WHEELS = [16, 18, 20, 22, 24, 26, 27, 28, 29];
  const SETTINGS = [
    { id: "wheelSize", group: "bike", type: "enum", danger: "critical", options: WHEELS },
    { id: "p5", group: "battery", type: "int", min: 0, max: 40, danger: "none" },
    { id: "c12", group: "battery", type: "int", min: 0, max: 7, danger: "critical" },
    { id: "c1", group: "pas", type: "int", min: 0, max: 7, danger: "caution" },
    { id: "c5", group: "motor", type: "int", min: 0, max: 10, danger: "critical" },
    { id: "c13", group: "motor", type: "int", min: 0, max: 5, danger: "caution" },
  ];

  /* ---------------------------------------------------------------- state */

  const S = {
    speed: 0, currentA: 0, soc: START_SOC,
    assist: 2, light: false,
    mode: "street", jur: "QC",
    streetLimit: Infinity,        // rider's own Street value; never above the cap
    offroadLimit: 45,
    ackLimit: null, pendingAck: null, allowLowerMoving: false, raiseApproved: 32,
    writing: false,
    held: { maxSpeedKmh: 32, wheelSize: 26, p5: 15, c12: 4, c1: 2, c5: 10, c13: 0 },
  };

  const cap = () => CAPS[S.jur];
  const provinceName = () => T.provinces[S.jur];
  const streetLimit = () => Math.min(cap(), S.streetLimit);
  const activeLimit = () => (S.mode === "street" ? streetLimit() : S.ackLimit);
  const moving = () => S.speed > STOPPED_KMH;
  const modeName = (m) => (m === "street" ? T.street : T.offroad);

  /** SpeedModeController.reconcile */
  function reconcile() {
    if (S.pendingAck != null) return { k: "confirm" };
    const desired = activeLimit();
    if (desired == null) return { k: "na" };
    const held = S.held.maxSpeedKmh;
    const stopped = !moving();
    if (held < desired) {
      if (S.raiseApproved !== desired) return { k: "sync" };
      return stopped ? { k: "write", v: desired } : { k: "pending", v: desired };
    }
    if (held === desired) return { k: "sync" };
    return stopped || S.allowLowerMoving ? { k: "write", v: desired } : { k: "pending", v: desired };
  }

  /** RidePresentation.modeSwitch */
  function modeSwitch() {
    const target = S.mode === "street" ? "offroad" : "street";
    if (!moving()) return { target, ok: true };
    if (target === "street" && S.allowLowerMoving) return { target, ok: true };
    return { target, ok: false, reason: T.stopTo(modeName(target)) };
  }

  /** DashboardViewModel.settingWritability */
  function writability(setting) {
    if ((setting.danger === "critical" || setting.danger === "caution") && moving()) return "locked";
    if (setting.danger === "critical") return "typed";
    if (setting.danger === "caution") return "confirm";
    return "editable";
  }

  const gaugeMax = (limit) => Math.min(100, Math.max(40, Math.ceil(((limit ?? 32) + 15) / 10) * 10));

  function speedParts(v) {
    const tenths = Math.round(Math.max(0, v) * 10);
    return [String(Math.floor(tenths / 10)), String(tenths % 10)];
  }

  function formatSetting(setting, value) {
    if (setting.id === "wheelSize") return value === 27 ? '27" / 700C' : `${value}"`;
    return String(value);
  }

  /* ---------------------------------------------------------------- icons */

  const ICON = {
    chevron: '<path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    city: '<path d="M3 21V9h6V3h8v8h4v10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7h2M12 11h2M6 13h1M6 17h1M17 15h1M17 18h1M12 15h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    terrain: '<path d="M2 19l7-11 4 6 2.5-3.5L22 19z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    light: '<path d="M14 5a7 7 0 0 1 0 14z" fill="currentColor"/><path d="M10 7H3M10 12H3M10 17H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
    warn: '<path d="M12 3l10 18H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    ride: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 14l4-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    tune: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="1.8"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    gps: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    minus: '<path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    plus: '<path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const icon = (name, size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;

  /* ---------------------------------------------------------------- DOM helpers */

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value; // only ever trusted, static markup (icons)
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of [].concat(children)) if (child != null) node.append(child);
    return node;
  }
  const svgIcon = (name, size) => el("span", { html: icon(name, size), style: "display:contents" });
  const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const toggleClass = (node, name, on) => node.classList.toggle(name, Boolean(on));

  /* ---------------------------------------------------------------- shell */

  const app = el("div", { class: "kd", role: "group", "aria-label": T.region });
  const status = el("div", { class: "kd-status", "aria-hidden": "true" }, [
    el("span", { text: "9:41" }),
    el("span", { class: "kd-sim-tag", text: T.sim }),
  ]);
  const body = el("div", { class: "kd-body" });
  const more = el("div", { class: "kd-more", html: icon("chevron", 18) });
  const ridePage = el("section", { class: "kd-page", id: "kd-ride", role: "tabpanel", "aria-label": T.ride, tabindex: "0" });
  const settingsPage = el("section", { class: "kd-page", id: "kd-settings", role: "tabpanel", "aria-label": T.settings, tabindex: "0", hidden: true });
  body.append(ridePage, settingsPage, more);

  const tabRide = el("button", { class: "kd-tab", role: "tab", "aria-selected": "true", "aria-controls": "kd-ride" },
    [el("span", { class: "kd-tab-ico", html: icon("ride", 22) }), el("span", { text: T.ride })]);
  const tabSettings = el("button", { class: "kd-tab", role: "tab", "aria-selected": "false", "aria-controls": "kd-settings", tabindex: "-1" },
    [el("span", { class: "kd-tab-ico", html: icon("tune", 22) }), el("span", { text: T.settings })]);
  const nav = el("nav", { class: "kd-nav", role: "tablist", "aria-label": "Kurant" }, [tabRide, tabSettings]);
  const snack = el("div", { class: "kd-snack", role: "status", "aria-live": "polite" });
  app.append(status, body, nav, snack);

  let currentPage = ridePage;
  function showTab(name) {
    const ride = name === "ride";
    tabRide.setAttribute("aria-selected", String(ride));
    tabSettings.setAttribute("aria-selected", String(!ride));
    tabRide.tabIndex = ride ? 0 : -1;
    tabSettings.tabIndex = ride ? -1 : 0;
    ridePage.hidden = !ride;
    settingsPage.hidden = ride;
    currentPage = ride ? ridePage : settingsPage;
    updateMoreHint();
  }
  tabRide.addEventListener("click", () => showTab("ride"));
  tabSettings.addEventListener("click", () => showTab("settings"));
  nav.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = tabRide.getAttribute("aria-selected") === "true" ? tabSettings : tabRide;
    next.click();
    next.focus();
  });

  /* "More below" fade: tells the visitor the screen scrolls. */
  function updateMoreHint() {
    const p = currentPage;
    const more = p.scrollHeight - p.clientHeight - p.scrollTop > 8;
    body.dataset.more = String(more);
  }
  ridePage.addEventListener("scroll", updateMoreHint, { passive: true });
  settingsPage.addEventListener("scroll", updateMoreHint, { passive: true });

  let snackTimer = 0;
  function showSnack(message) {
    snack.textContent = message;
    snack.classList.add("show");
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => snack.classList.remove("show"), 2400);
  }

  /* ---------------------------------------------------------------- overlays */

  let overlay = null; // { nodes, onDismiss, returnFocus }

  function openOverlay(panel, { onDismiss, label } = {}) {
    closeOverlay(false);
    const scrim = el("div", { class: "kd-scrim", onclick: () => dismissOverlay() });
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    if (label) panel.setAttribute("aria-label", label);
    panel.tabIndex = -1;
    app.append(scrim, panel);
    overlay = { nodes: [scrim, panel], onDismiss, returnFocus: document.activeElement };
    const first = panel.querySelector("button:not(:disabled), input");
    (first || panel).focus({ preventScroll: true });
  }
  function closeOverlay(restoreFocus = true) {
    if (!overlay) return;
    const { nodes, returnFocus } = overlay;
    overlay = null;
    nodes.forEach((n) => n.remove());
    if (restoreFocus && returnFocus && app.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
  }
  function dismissOverlay() {
    if (!overlay) return;
    const handler = overlay.onDismiss;
    closeOverlay();
    if (handler) handler();
  }
  app.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) { e.stopPropagation(); dismissOverlay(); }
  });

  function dialog({ iconName, iconTone, title, paragraphs = [], extra = [], actions }) {
    const head = iconName ? el("div", { class: `kd-ico-head ${iconTone || ""}`, html: icon(iconName, 24) }) : null;
    return el("div", { class: "kd-dialog" }, [
      head,
      el("h3", { text: title }),
      ...paragraphs.map((p) => el("p", { text: p })),
      ...extra,
      el("div", { class: "kd-actions" }, actions),
    ]);
  }

  /* ---------------------------------------------------------------- hold-to-confirm */

  /** HoldToConfirmButton: fires only after a deliberate 1.5 s hold. */
  function holdButton({ onConfirmed, onHighest = false }) {
    const titleNode = el("span", { class: "kd-t" });
    const hintNode = el("span", { class: "kd-s" });
    const leading = el("span", { class: "kd-hold-lead" });
    const button = el("button", { class: `kd-hold${onHighest ? " on-highest" : ""}`, type: "button" }, [
      leading, el("span", { class: "kd-grow" }, [titleNode, el("br"), hintNode]),
    ]);
    let start = 0;
    let frame = 0;
    let progress = 0;

    const setProgress = (p) => { progress = p; button.style.setProperty("--p", p.toFixed(3)); };
    function step(now) {
      const p = Math.min(1, progress + (now - start) / HOLD_MS);
      start = now;
      setProgress(p);
      if (p >= 1) { finish(true); onConfirmed(); return; }
      frame = requestAnimationFrame(step);
    }
    function begin() {
      if (button.disabled || frame) return;
      button.classList.remove("releasing");
      start = performance.now();
      frame = requestAnimationFrame(step);
    }
    function finish() {
      cancelAnimationFrame(frame);
      frame = 0;
      button.classList.add("releasing");
      setProgress(0);
    }
    button.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      begin();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => button.addEventListener(t, () => { if (frame) finish(); }));
    button.addEventListener("contextmenu", (e) => e.preventDefault());
    button.addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); }
    });
    button.addEventListener("keyup", (e) => { if ((e.key === " " || e.key === "Enter") && frame) finish(); });
    button.addEventListener("blur", () => { if (frame) finish(); });

    return {
      node: button,
      set({ title, hint, enabled, fill, leadIcon }) {
        text(titleNode, title);
        text(hintNode, hint);
        if (button.disabled === enabled) {
          button.disabled = !enabled;
          if (!enabled && frame) finish(); // bike started moving mid-hold
        }
        button.style.setProperty("--hold-fill", fill);
        if (leadIcon && leading.dataset.icon !== leadIcon) {
          leading.dataset.icon = leadIcon;
          leading.innerHTML = icon(leadIcon, 22);
        }
        button.setAttribute("aria-label", `${title}. ${hint}`);
      },
    };
  }

  /* ---------------------------------------------------------------- Ride tab */

  const linkPill = el("button", { class: "kd-pill", type: "button", "aria-label": T.connDetails, "aria-haspopup": "dialog" }, [
    el("span", { class: "kd-dot", "aria-hidden": "true" }),
    el("span", { text: T.simulator }),
    svgIcon("chevron", 18),
  ]);
  linkPill.addEventListener("click", openConnectionSheet);
  const alerts = el("div", { class: "kd-alerts" });

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  // Geometry from SpeedGauge.kt: 270° arc from 135°, stroke 14, diameter = size − 2.6 × stroke.
  const G = { size: 300, stroke: 14, start: 135, sweep: 270 };
  G.r = (G.size - G.stroke * 2.6) / 2;
  G.c = G.size / 2;
  const polar = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return [G.c + Math.cos(a) * r, G.c + Math.sin(a) * r];
  };
  const arcPath = (() => {
    const [x1, y1] = polar(G.start, G.r);
    const [x2, y2] = polar(G.start + G.sweep, G.r);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${G.r} ${G.r} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  })();
  const gaugeSvg = svg("svg", { viewBox: `0 0 ${G.size} ${G.size}`, "aria-hidden": "true" });
  const ticks = svg("g", { class: "tick", "stroke-width": "2", "stroke-linecap": "round" });
  const track = svg("path", { d: arcPath, class: "track", fill: "none", "stroke-width": G.stroke, "stroke-linecap": "round" });
  const fill = svg("path", { d: arcPath, class: "fill", fill: "none", "stroke-width": G.stroke, "stroke-linecap": "round", pathLength: "1000", "stroke-dasharray": "0 1000" });
  const limitTick = svg("line", { class: "limit", "stroke-width": "4", "stroke-linecap": "round" });
  gaugeSvg.append(ticks, track, fill, limitTick);

  const speedWhole = el("b");
  const speedTenth = el("i");
  const limitText = el("span", { class: "kd-limit" });
  const gauge = el("div", { class: "kd-gauge", role: "img" }, [
    gaugeSvg,
    el("div", { class: "kd-read", "aria-hidden": "true" }, [
      el("div", { class: "kd-num" }, [speedWhole, speedTenth]),
      el("span", { class: "kd-unit", text: "km/h" }),
      limitText,
    ]),
  ]);
  let drawnScale = 0;
  function drawScale(scale) {
    if (scale === drawnScale) return;
    drawnScale = scale;
    ticks.replaceChildren();
    for (let mark = 0; mark <= scale; mark += 10) {
      const deg = G.start + G.sweep * (mark / scale);
      const [x1, y1] = polar(deg, G.r - G.stroke * 1.35);
      const [x2, y2] = polar(deg, G.r - G.stroke * 0.95);
      ticks.append(svg("line", { x1, y1, x2, y2 }));
    }
  }

  const modeControl = holdButton({ onConfirmed: () => requestModeSwitch(modeSwitch().target) });

  const powerValue = el("b");
  const batteryValue = el("b");
  const batteryBar = el("i");
  const stats = el("div", { class: "kd-stats" }, [
    el("div", { class: "kd-stat" }, [
      el("div", { class: "kd-overline", text: T.power }),
      el("div", { class: "kd-stat-v" }, [powerValue, el("span", { text: "W" })]),
    ]),
    el("div", { class: "kd-stat" }, [
      el("div", { class: "kd-overline", text: T.battery }),
      el("div", { class: "kd-stat-v" }, [batteryValue, el("span", { text: "%" })]),
      el("div", { class: "kd-bar", "aria-hidden": "true" }, batteryBar),
    ]),
  ]);

  const assistIndicator = el("span", { class: "ind", "aria-hidden": "true" });
  const assistButtons = ASSIST_LEVELS.map((level) => {
    const label = level === 0 ? "OFF" : String(level);
    const button = el("button", { type: "button", role: "radio", "aria-checked": "false", "aria-label": T.assistLevel(label), text: label });
    button.addEventListener("click", () => setAssist(level));
    return button;
  });
  const assist = el("div", { class: "kd-assist", role: "radiogroup", "aria-label": T.assistLevel("") }, [assistIndicator, ...assistButtons]);
  assist.addEventListener("keydown", (e) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(0, S.assist + delta));
    setAssist(next);
    assistButtons[next].focus();
  });
  const lightButton = el("button", { class: "kd-light", type: "button", "aria-pressed": "false", "aria-label": T.headlight, html: icon("light", 24) });
  lightButton.addEventListener("click", () => { S.light = !S.light; syncRide(); });

  ridePage.append(
    el("div", { class: "kd-top" }, linkPill),
    alerts,
    gauge,
    modeControl.node,
    stats,
    el("div", { class: "kd-assist-row" }, [assist, lightButton]),
  );

  function setAssist(level) {
    if (S.assist === level) return;
    S.assist = level;
    syncRide();
  }

  let alertKey = "";
  function syncRide() {
    const sync = reconcile();
    const shownLimit = S.held.maxSpeedKmh ?? activeLimit();
    const scale = gaugeMax(shownLimit);
    drawScale(scale);
    const fraction = Math.min(1, Math.max(0, S.speed / scale));
    fill.setAttribute("stroke-dasharray", fraction > 0.001 ? `${(fraction * 1000).toFixed(1)} 1000` : "0 1000");
    fill.style.visibility = fraction > 0.001 ? "visible" : "hidden";
    toggleClass(fill, "over", S.speed > shownLimit + 0.5);
    const deg = G.start + G.sweep * (Math.min(shownLimit, scale) / scale);
    const [x1, y1] = polar(deg, G.r - G.stroke * 0.9);
    const [x2, y2] = polar(deg, G.r + G.stroke * 1.15);
    limitTick.setAttribute("x1", x1); limitTick.setAttribute("y1", y1);
    limitTick.setAttribute("x2", x2); limitTick.setAttribute("y2", y2);

    const [whole, tenth] = speedParts(S.speed);
    text(speedWhole, whole);
    text(speedTenth, T.decimal + tenth);
    text(limitText, T.limit(shownLimit));
    gauge.setAttribute("aria-label", `${whole}${T.decimal}${tenth} km/h · ${T.limit(shownLimit)}`);

    const sw = modeSwitch();
    const active = activeLimit();
    modeControl.set({
      title: `${modeName(S.mode)}${active != null ? ` · ${active} km/h` : ""}`,
      hint: sw.ok ? T.holdTo(modeName(sw.target)) : sw.reason,
      enabled: sw.ok,
      fill: sw.target === "offroad" ? "var(--kd-amber)" : "var(--kd-primary)",
      leadIcon: S.mode === "street" ? "city" : "terrain",
    });

    const key = sync.k === "pending" ? `pending-${sync.v}` : "";
    if (key !== alertKey) {
      alertKey = key;
      alerts.replaceChildren();
      if (sync.k === "pending") {
        alerts.append(el("div", { class: "kd-alert", role: "status" }, [svgIcon("info", 22), el("span", { class: "kd-t", text: T.pendingAlert(sync.v) })]));
      }
      updateMoreHint();
    }

    const volts = 44 + S.soc * 0.08;
    text(powerValue, String(Math.round(S.currentA * volts)));
    const soc = Math.round(S.soc);
    text(batteryValue, String(soc));
    batteryBar.style.setProperty("--w", `${soc}%`);
    toggleClass(batteryBar, "low", soc <= 25 && soc > 10);
    toggleClass(batteryBar, "crit", soc <= 10);

    const index = ASSIST_LEVELS.indexOf(S.assist);
    assist.style.setProperty("--i", index);
    assistButtons.forEach((b, i) => b.setAttribute("aria-checked", String(i === index)));
    assistButtons.forEach((b, i) => { b.tabIndex = i === index ? 0 : -1; });
    lightButton.setAttribute("aria-pressed", String(S.light));
  }

  /* ---------------------------------------------------------------- Settings tab */

  function section(label) { return el("div", { class: "kd-section", text: label }); }

  const profileCard = el("div", { class: "kd-panel" }, [
    el("div", { class: "kd-row" }, [
      el("div", { class: "kd-grow" }, [
        el("div", { class: "kd-overline", text: T.profile }),
        el("div", { class: "kd-t", style: "margin-top:4px", text: PROFILE.name }),
        el("div", { class: "kd-s", text: PROFILE.brands }),
      ]),
      el("span", { class: "kd-badge accent", text: T.bench, style: "align-self:flex-start" }),
    ]),
    el("div", { class: "kd-row", style: "margin-top:10px;flex-wrap:wrap;gap:6px" }, [
      el("span", { class: "kd-badge", text: T.bundled }),
      el("span", { class: "kd-badge", text: `v${PROFILE.version}` }),
      el("span", { class: "kd-grow" }),
      el("button", { class: "kd-btn-text", type: "button", text: T.change, onclick: openConnectionSheet }),
    ]),
  ]);

  function modeTile(mode) {
    const accent = mode === "street" ? "var(--kd-primary)" : "var(--kd-amber)";
    const accentBox = mode === "street" ? "var(--kd-primary-box)" : "var(--kd-amber-box)";
    const badge = el("span", { class: `kd-badge ${mode === "street" ? "accent" : "caution"}`, text: T.active });
    const value = el("div", { class: "kd-readout" });
    const node = el("div", { class: "kd-mode-tile", style: `--accent:${accent};--accent-box:${accentBox}` }, [
      el("div", { class: "kd-row" }, [svgIcon(mode === "street" ? "city" : "terrain", 22), el("span", { class: "kd-grow" }), badge]),
      el("div", { class: "kd-t", style: "margin-top:8px", text: modeName(mode) }),
      value,
    ]);
    return {
      node,
      sync() {
        const on = S.mode === mode;
        toggleClass(node, "active", on);
        badge.hidden = !on;
        text(value, `${mode === "street" ? streetLimit() : S.offroadLimit} km/h`);
      },
    };
  }
  const streetTile = modeTile("street");
  const offroadTile = modeTile("offroad");
  const settingsSwitch = holdButton({ onConfirmed: () => requestModeSwitch(modeSwitch().target), onHighest: true });

  const ctrlValue = el("div", { class: "kd-readout", style: "text-align:right" });
  const ctrlBadge = el("span", { class: "kd-badge" });
  const ctrlLine = el("div", { class: "kd-row" }, [
    el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.ctrlLimit }), el("div", { class: "kd-s", text: T.ctrlLimitSub })]),
    el("div", { style: "display:grid;justify-items:end;gap:2px" }, [ctrlValue, ctrlBadge]),
  ]);

  const maxSub = el("div", { class: "kd-s" });
  const maxValue = el("div", { class: "kd-readout" });
  const maxRange = el("input", { class: "kd-range", type: "range", min: LIMIT_MIN, max: LIMIT_MAX, step: "1", "aria-label": T.maxSpeed });
  const maxControl = el("div", { class: "kd-range-wrap" }, [
    el("div", { class: "kd-row" }, [el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.maxSpeed }), maxSub]), maxValue]),
    maxRange,
  ]);
  const sliderCurrent = () => (S.mode === "street" ? streetLimit() : S.offroadLimit);
  const maxTarget = (kmh) => (S.mode === "offroad" || kmh > cap() ? "offroad" : "street");
  function drawMaxSpeed() {
    const kmh = Number(maxRange.value);
    const above = kmh > cap();
    const target = maxTarget(kmh);
    const accent = target === "offroad" ? "var(--kd-amber)" : "var(--kd-primary)";
    text(maxSub, target === "street" ? T.streetSub(cap()) : S.mode === "street" ? T.aboveSaves(cap()) : above ? T.offAbove(cap()) : T.offSub);
    maxSub.style.color = above ? "var(--kd-amber)" : "";
    text(maxValue, `${kmh} km/h`);
    maxValue.style.color = accent;
    maxControl.style.setProperty("--accent", target === "offroad" ? "#FFB547" : "#00D2FF");
    maxRange.setAttribute("aria-valuetext", `${kmh} km/h`);
  }
  function resetSlider() {
    maxRange.value = String(Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, sliderCurrent())));
    drawMaxSpeed();
  }
  maxRange.addEventListener("input", drawMaxSpeed);
  maxRange.addEventListener("change", () => {
    const kmh = Number(maxRange.value);
    if (maxTarget(kmh) === "street") {
      if (kmh !== streetLimit()) setLimit("street", kmh);
    } else if (kmh !== S.offroadLimit) {
      if (S.mode === "offroad") setLimit("offroad", kmh); // the acknowledgement dialog follows
      else { openLegalDialog(kmh); return; }
    }
    resetSlider();
  });

  const provinceSub = el("div", { class: "kd-s" });
  const provinceRow = el("button", { class: "kd-row-btn", type: "button", "aria-haspopup": "dialog", "aria-label": T.chooseProvince }, [
    el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.province }), provinceSub]),
    svgIcon("chevron", 20),
  ]);
  provinceRow.addEventListener("click", openProvincePicker);

  const lowerSwitch = el("button", { class: "kd-switch", type: "button", role: "switch", "aria-checked": "false", "aria-label": T.lowerMoving });
  const lowerRow = el("div", { class: "kd-row-btn" }, [
    el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.lowerMoving }), el("div", { class: "kd-s", text: T.lowerMovingSub })]),
    lowerSwitch,
  ]);
  lowerSwitch.addEventListener("click", () => { S.allowLowerMoving = !S.allowLowerMoving; syncAll(); });

  const speedPanel = el("div", { class: "kd-panel" }, [
    el("div", { class: "kd-mode-tiles" }, [streetTile.node, offroadTile.node]),
    el("div", { class: "kd-gap" }),
    settingsSwitch.node,
    el("div", { class: "kd-gap" }),
    ctrlLine,
    el("div", { class: "kd-gap" }),
    el("hr", { class: "kd-divider" }),
    maxControl,
    el("hr", { class: "kd-divider" }),
    provinceRow,
    el("hr", { class: "kd-divider" }),
    lowerRow,
  ]);

  const gpsPanel = el("div", { class: "kd-panel" }, [
    el("div", { class: "kd-row", style: "align-items:flex-start" }, [
      el("span", { style: "color:var(--kd-mute)", html: icon("gps", 22) }),
      el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.gpsTitle }), el("div", { class: "kd-s", text: T.gpsSub })]),
    ]),
  ]);

  /** SettingRow with IntEditor / EnumEditor and the staged "old → new" bar. */
  function settingRow(setting) {
    const [label, description] = T.settings_[setting.id];
    const valueNode = el("div", { class: "kd-readout" });
    const badge = setting.danger === "critical" ? el("span", { class: "kd-badge error", text: T.critical })
      : setting.danger === "caution" ? el("span", { class: "kd-badge caution", text: T.caution }) : null;
    const lockLine = el("div", { class: "kd-lock" }, [svgIcon("lock", 15), el("span", { text: T.stopToChange })]);
    const editor = el("div");
    const stagedText = el("span", { class: "kd-grow" });
    const staged = el("div", { class: "kd-staged", hidden: true }, [
      stagedText,
      el("button", { class: "kd-btn-text", type: "button", text: T.revert, onclick: () => setDraft(base()) }),
      el("button", { class: "kd-btn", type: "button", text: T.apply, onclick: () => requestWrite(setting, draft, label) }),
    ]);
    const node = el("div", { class: "kd-setting" }, [
      el("div", { class: "kd-row", style: "align-items:flex-start" }, [
        el("div", { class: "kd-grow" }, [
          el("div", { class: "kd-row", style: "gap:8px;flex-wrap:wrap" }, [el("span", { class: "kd-t", text: label }), badge]),
          el("div", { class: "kd-s", text: description }),
        ]),
        valueNode,
      ]),
      lockLine,
      editor,
      staged,
    ]);

    const base = () => S.held[setting.id];
    let draft = base();
    let chips = [];
    let minus;
    let plus;
    let range;

    if (setting.type === "enum") {
      chips = setting.options.map((value) => {
        const chip = el("button", { class: "kd-chip", type: "button", role: "radio", "aria-checked": "false", text: formatSetting(setting, value) });
        chip.addEventListener("click", () => setDraft(value));
        return chip;
      });
      editor.append(el("div", { class: "kd-chips", role: "radiogroup", "aria-label": label }, chips));
    } else {
      minus = el("button", { class: "kd-icon-btn", type: "button", "aria-label": T.decrease(label), html: icon("minus", 18) });
      plus = el("button", { class: "kd-icon-btn", type: "button", "aria-label": T.increase(label), html: icon("plus", 18) });
      range = el("input", { class: "kd-range", type: "range", min: setting.min, max: setting.max, step: "1", "aria-label": label });
      minus.addEventListener("click", () => setDraft(Math.max(setting.min, draft - 1)));
      plus.addEventListener("click", () => setDraft(Math.min(setting.max, draft + 1)));
      range.addEventListener("input", () => setDraft(Number(range.value)));
      editor.append(el("div", { class: "kd-int" }, [minus, range, plus]));
    }

    function setDraft(value) {
      draft = value;
      drawEditor();
    }
    function drawEditor() {
      const held = base();
      chips.forEach((chip, i) => chip.setAttribute("aria-checked", String(setting.options[i] === draft)));
      if (range) {
        range.value = String(draft);
        minus.disabled = draft <= setting.min;
        plus.disabled = draft >= setting.max;
      }
      staged.hidden = draft === held;
      text(stagedText, `${formatSetting(setting, held)}  →  ${formatSetting(setting, draft)}`);
      text(valueNode, formatSetting(setting, held));
    }

    let locked = null;
    return {
      node,
      sync() {
        const isLocked = writability(setting) === "locked";
        if (isLocked !== locked) {
          locked = isLocked;
          lockLine.hidden = !isLocked;
          editor.hidden = isLocked;
          valueNode.style.color = isLocked ? "var(--kd-mute)" : "";
          if (isLocked) draft = base(); // the editor goes away, like the composable leaving
        }
        if (isLocked) staged.hidden = true;
        else drawEditor();
        text(valueNode, formatSetting(setting, base()));
      },
      resetDraft() { draft = base(); },
    };
  }

  const rows = SETTINGS.map(settingRow);
  const groupNodes = [];
  for (const group of ["bike", "battery", "pas", "motor"]) {
    const groupRows = rows.filter((_, i) => SETTINGS[i].group === group);
    const panel = el("div", { class: "kd-panel flush" });
    groupRows.forEach((row, i) => {
      if (i > 0) panel.append(el("hr", { class: "kd-divider kd-flush-divider" }));
      panel.append(row.node);
    });
    groupNodes.push(section(T.groups[group]), panel);
  }

  const devicePanel = el("div", { class: "kd-panel flush" }, [
    el("button", { class: "kd-nav-row", type: "button", onclick: openConnectionSheet }, [
      svgIcon("link", 22),
      el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.connection }), el("div", { class: "kd-s", text: `${T.simulator} · ${PROFILE.name}` })]),
      el("span", { style: "transform:rotate(-90deg);color:var(--kd-mute)", html: icon("chevron", 20) }),
    ]),
    el("hr", { class: "kd-divider kd-flush-divider" }),
    el("button", { class: "kd-nav-row", type: "button", disabled: true }, [
      svgIcon("chip", 22),
      el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.firmware }), el("div", { class: "kd-s", text: T.withModule })]),
    ]),
  ]);

  settingsPage.append(
    el("div", { class: "kd-title", text: T.settings }),
    profileCard,
    section(T.secSpeed), speedPanel,
    section(T.secGps), gpsPanel,
    ...groupNodes,
    section(T.secDevice), devicePanel,
    el("div", { class: "kd-foot", text: T.foot }),
  );

  function syncSettings() {
    streetTile.sync();
    offroadTile.sync();
    const sw = modeSwitch();
    settingsSwitch.set({
      title: T.switchTo(modeName(sw.target)),
      hint: sw.ok ? T.pressHold : sw.reason,
      enabled: sw.ok,
      fill: sw.target === "offroad" ? "var(--kd-amber)" : "var(--kd-primary)",
    });

    const sync = reconcile();
    const held = S.held.maxSpeedKmh;
    const active = activeLimit();
    let status = [T.applied, "ok"];
    if (S.writing || sync.k === "write") status = [T.applying, "accent"];
    else if (sync.k === "pending") status = [T.whenStopped, "info"];
    else if (sync.k === "confirm") status = [T.waitingOk, "caution"];
    else if (active != null && held < active) status = [T.lowerThan, "info"];
    text(ctrlValue, `${held} km/h`);
    text(ctrlBadge, status[0]);
    ctrlBadge.className = `kd-badge ${status[1]}`;

    text(provinceSub, `${provinceName()} · ${T.legal(cap())}`);
    lowerSwitch.setAttribute("aria-checked", String(S.allowLowerMoving));
    rows.forEach((row) => row.sync());
  }

  /* ---------------------------------------------------------------- actions */

  function setLimit(mode, kmh) {
    if (mode === "street") {
      S.streetLimit = kmh;
      if (S.mode === "street") S.raiseApproved = activeLimit();
    } else {
      S.offroadLimit = kmh;
      S.ackLimit = null;
      if (S.mode === "offroad") S.pendingAck = kmh;
    }
    syncAll();
    if (S.pendingAck != null) openAckDialog();
  }

  function requestModeSwitch(target) {
    if (target === "street") {
      S.mode = "street";
      S.pendingAck = null;
      S.raiseApproved = activeLimit();
    } else if (S.mode !== "offroad" || S.ackLimit !== S.offroadLimit) {
      S.pendingAck = S.offroadLimit;
    }
    syncAll();
    resetSlider();
    if (S.pendingAck != null) openAckDialog();
  }

  function confirmOffroad() {
    if (S.pendingAck == null) return;
    S.ackLimit = S.pendingAck;
    S.mode = "offroad";
    S.pendingAck = null;
    S.raiseApproved = activeLimit();
    syncAll();
    resetSlider();
  }

  let ackTimer = 0;
  function openAckDialog() {
    const kmh = S.pendingAck;
    const paragraphs = [];
    if (kmh > cap()) paragraphs.push(T.ackAbove(cap(), provinceName()));
    paragraphs.push(T.ackBody);
    let left = ACK_SECONDS;
    const ok = el("button", { class: "kd-btn", type: "button", disabled: true, text: `OK (${left})` });
    const useStreet = el("button", { class: "kd-btn-text", type: "button", text: T.useStreet });
    ok.addEventListener("click", () => { clearInterval(ackTimer); closeOverlay(); confirmOffroad(); });
    useStreet.addEventListener("click", () => { clearInterval(ackTimer); closeOverlay(); requestModeSwitch("street"); });
    clearInterval(ackTimer);
    ackTimer = setInterval(() => {
      left -= 1;
      if (left > 0) { ok.textContent = `OK (${left})`; return; }
      clearInterval(ackTimer);
      ok.textContent = "OK";
      ok.disabled = false;
    }, 1000);
    openOverlay(dialog({ iconName: "terrain", title: T.ackTitle(kmh), paragraphs, actions: [useStreet, ok] }), {
      label: T.ackTitle(kmh),
      onDismiss: () => { clearInterval(ackTimer); requestModeSwitch("street"); },
    });
  }

  function openLegalDialog(kmh) {
    const save = el("button", { class: "kd-btn", type: "button", text: T.saveAsOffBtn });
    const cancel = el("button", { class: "kd-btn-text", type: "button", text: T.cancel });
    save.addEventListener("click", () => { closeOverlay(); setLimit("offroad", kmh); resetSlider(); });
    cancel.addEventListener("click", () => { closeOverlay(); resetSlider(); });
    openOverlay(dialog({
      iconName: "warn",
      title: T.saveAsOff(kmh),
      paragraphs: [T.saveAsOffBody(cap(), provinceName(), streetLimit())],
      actions: [cancel, save],
    }), { label: T.saveAsOff(kmh), onDismiss: resetSlider });
  }

  function openProvincePicker() {
    const codes = Object.keys(CAPS).sort((a, b) => T.provinces[a].localeCompare(T.provinces[b], FR ? "fr" : "en"));
    const list = el("div", { class: "kd-list", role: "radiogroup", "aria-label": T.province }, codes.map((code) => {
      const b = el("button", { type: "button", role: "radio", "aria-checked": String(code === S.jur) }, [
        el("span", { text: T.provinces[code] }), el("span", { class: "kd-s", text: `${CAPS[code]} km/h` }),
      ]);
      b.addEventListener("click", () => { S.jur = code; closeOverlay(); syncAll(); resetSlider(); });
      return b;
    }));
    const close = el("button", { class: "kd-btn-text", type: "button", text: T.cancel, onclick: () => closeOverlay() });
    openOverlay(dialog({ title: T.province, extra: [list], actions: [close] }), { label: T.chooseProvince });
  }

  function requestWrite(setting, value, label) {
    const mode = writability(setting);
    const row = rows[SETTINGS.indexOf(setting)];
    if (mode === "locked") { showSnack(T.stopToChange); return; }
    if (mode === "editable") { commitWrite(setting, value, row); return; }

    const typed = mode === "typed";
    const input = typed ? el("input", { type: "text", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", "aria-label": T.typedLabel, placeholder: T.typedLabel }) : null;
    const apply = el("button", { class: `kd-btn${typed ? " danger" : ""}`, type: "button", text: T.apply, disabled: typed });
    const cancel = el("button", { class: "kd-btn-text", type: "button", text: T.cancel, onclick: () => closeOverlay() });
    if (input) input.addEventListener("input", () => { apply.disabled = input.value.trim().toUpperCase() !== T.typedWord; });
    apply.addEventListener("click", () => {
      closeOverlay();
      // Recheck the live gate: the bike may have started moving while the dialog was open.
      if (writability(setting) === "locked") { showSnack(T.stopToChange); return; }
      commitWrite(setting, value, row);
    });
    const [, description] = T.settings_[setting.id];
    const extra = [el("div", { class: "kd-change", text: `${formatSetting(setting, S.held[setting.id])}  →  ${formatSetting(setting, value)}` })];
    if (typed) extra.push(el("p", { text: T.typedBody }), input);
    openOverlay(dialog({
      iconName: "warn", iconTone: typed ? "error" : "",
      title: T.changeQ(label), paragraphs: [description], extra, actions: [cancel, apply],
    }), { label: T.changeQ(label) });
    if (input) input.focus({ preventScroll: true });
  }

  function commitWrite(setting, value, row) {
    setTimeout(() => {
      S.held[setting.id] = value;
      row.resetDraft();
      syncAll();
      showSnack(T.saved);
    }, 120);
  }

  /* Connection sheet: only the simulator is offered on the web. */
  function openConnectionSheet() {
    const sheet = el("div", { class: "kd-sheet" }, [
      el("div", { class: "kd-grip", "aria-hidden": "true" }),
      el("div", { class: "kd-title", style: "padding-top:0", text: T.sheetTitle }),
      el("div", { class: "kd-row", style: "gap:8px;margin-bottom:6px" }, [
        el("span", { class: "kd-dot", "aria-hidden": "true" }), el("span", { class: "kd-s", text: T.running }),
      ]),
      section(T.source),
      el("div", { role: "radiogroup", "aria-label": T.source }, [
        el("button", { class: "kd-option", type: "button", role: "radio", "aria-checked": "true" }, [
          svgIcon("flask", 22),
          el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.simulator }), el("div", { class: "kd-s", text: T.virtualBike })]),
        ]),
        el("button", { class: "kd-option", type: "button", role: "radio", "aria-checked": "false", disabled: true }, [
          svgIcon("chip", 22),
          el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: T.module }), el("div", { class: "kd-s", text: T.moduleSub })]),
        ]),
      ]),
      section(T.profiles),
      el("div", { class: "kd-option", "aria-checked": "true", role: "radio" }, [
        el("div", { class: "kd-grow" }, [el("div", { class: "kd-t", text: PROFILE.name }), el("div", { class: "kd-s", text: PROFILE.brands })]),
        el("span", { class: "kd-badge accent", text: T.bench }),
      ]),
      el("div", { class: "kd-actions", style: "margin-top:8px" }, el("button", { class: "kd-btn-text", type: "button", text: T.done, onclick: () => closeOverlay() })),
    ]);
    openOverlay(sheet, { label: T.sheetTitle });
  }

  /* ---------------------------------------------------------------- simulation loop */

  /** MockTransport.stepPhysics, plus the controller cutting assist at its held limit. */
  function stepPhysics(dt) {
    const level = S.assist;
    let target = level === 0 ? 0 : 4 + level * 5 + (Math.random() * 1.2 - 0.6);
    target = Math.min(target, S.held.maxSpeedKmh);
    S.speed += (target - S.speed) * Math.min(1, 0.9 * dt * 3);
    S.speed = Math.max(0, S.speed);
    const effort = Math.max(0, target - S.speed) * 1.8 + level * 1.1;
    S.currentA = Math.max(0, S.currentA + (effort - S.currentA) * 0.4);
    S.soc = Math.max(5, S.soc - S.currentA * dt * 0.004);
  }

  function applyLimitSync() {
    const sync = reconcile();
    if (sync.k !== "write" || S.writing) return;
    S.writing = true;
    setTimeout(() => {
      S.writing = false;
      const again = reconcile(); // the rider may have changed something meanwhile
      if (again.k === "write") S.held.maxSpeedKmh = again.v;
      syncAll();
    }, WRITE_MS);
  }

  function syncAll() {
    syncRide();
    syncSettings();
  }

  let timer = 0;
  let visible = false;
  function tick() {
    stepPhysics(TICK_MS / 1000);
    applyLimitSync();
    syncAll();
  }
  function setRunning() {
    const run = visible && document.visibilityState === "visible";
    if (run && !timer) timer = setInterval(tick, TICK_MS);
    if (!run && timer) { clearInterval(timer); timer = 0; }
  }

  /* ---------------------------------------------------------------- mount */

  host.replaceChildren(app);
  host.classList.add("kd-live");
  S.speed = 14; // already riding at assist 2 when the page opens
  resetSlider();
  syncAll();
  updateMoreHint();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      setRunning();
    }).observe(host);
  } else {
    visible = true;
  }
  document.addEventListener("visibilitychange", setRunning);
  window.addEventListener("resize", updateMoreHint, { passive: true });
  setRunning();
})();
