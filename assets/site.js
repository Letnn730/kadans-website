(function () {
  "use strict";
  var root = document.querySelector("[data-lang]");
  if (!root) return;
  var lang = root.getAttribute("data-lang") === "en" ? "en" : "fr";
  var data = window.KURANT_COMPAT;

  // Outside the real site (e.g. a design preview), the form shows a message instead of sending.
  var LIVE = /(^|\.)kurant\.ca$|\.pages\.dev$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);

  var T = {
    fr: {
      choose: "Choisir…",
      status: { ok: "Pris en charge", check: "À vérifier", no: "Non pris en charge pour le moment", idle: "En attente" },
      idle: "Choisissez le système et la tension de votre vélo pour voir le résultat.",
      okText: "Votre configuration est prévue au lancement.",
      sending: "Envoi…",
      done: "C'est noté. Nous vous écrirons quand Kurant sera disponible pour votre vélo.",
      preview: "Aperçu : rien n'a été envoyé. Le formulaire sera actif sur kurant.ca.",
      fail: "L'inscription n'a pas fonctionné. Vérifiez votre connexion et réessayez.",
      email: "Entrez une adresse courriel valide.",
      consent: "Cochez la case de consentement pour vous inscrire."
    },
    en: {
      choose: "Choose…",
      status: { ok: "Supported", check: "To be confirmed", no: "Not supported yet", idle: "Waiting" },
      idle: "Choose your bike's system and voltage to see the result.",
      okText: "Your setup is planned for launch.",
      sending: "Sending…",
      done: "Done. We'll email you when Kurant is available for your bike.",
      preview: "Preview: nothing was sent. The form will be live on kurant.ca.",
      fail: "Sign-up didn't go through. Check your connection and try again.",
      email: "Enter a valid email address.",
      consent: "Tick the consent box to sign up."
    }
  }[lang];

  var rank = { ok: 0, check: 1, no: 2 };
  var famSel = document.getElementById("chk-family");
  var voltSel = document.getElementById("chk-volt");
  var chip = document.getElementById("chk-chip");
  var text = document.getElementById("chk-text");

  function fill(select, list) {
    var first = document.createElement("option");
    first.value = ""; first.textContent = T.choose;
    select.appendChild(first);
    list.forEach(function (item) {
      var o = document.createElement("option");
      o.value = item.id; o.textContent = item[lang].name;
      select.appendChild(o);
    });
  }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  function update() {
    var f = find(data.families, famSel.value);
    var v = find(data.voltages, voltSel.value);
    if (!f || !v) {
      chip.className = "chip idle"; chip.textContent = T.status.idle; text.textContent = T.idle;
      return;
    }
    var worst = rank[f.status] >= rank[v.status] ? f.status : v.status;
    chip.className = "chip " + worst;
    chip.textContent = T.status[worst];
    var notes = [];
    if (f[lang].note) notes.push(f[lang].note);
    if (v[lang].note) notes.push(v[lang].note);
    if (worst === "ok") notes.unshift(T.okText);
    text.textContent = notes.join(" ");
  }

  if (famSel && voltSel && data) {
    fill(famSel, data.families);
    fill(voltSel, data.voltages);
    famSel.addEventListener("change", update);
    voltSel.addEventListener("change", update);
    update();
  }

  // iPhone note
  var iosNote = document.getElementById("ios-note");
  document.querySelectorAll('input[name="phone"]').forEach(function (r) {
    r.addEventListener("change", function () { if (iosNote) iosNote.hidden = r.value !== "ios" || !r.checked; });
  });

  // Waitlist
  var form = document.getElementById("waitlist");
  var msg = document.getElementById("form-msg");
  if (!form) return;
  function say(kind, s) { msg.className = "form-msg " + kind; msg.textContent = s; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say("err", T.email); form.email.focus(); return; }
    if (!form.consent.checked) { say("err", T.consent); form.consent.focus(); return; }
    var phone = form.querySelector('input[name="phone"]:checked');
    var payload = {
      email: email,
      bike: form.bike.value.trim(),
      controller_label: form.controller_label.value.trim(),
      family: famSel ? famSel.value : "",
      voltage: voltSel ? voltSel.value : "",
      phone_os: phone ? phone.value : "",
      province: form.province.value,
      lang: lang,
      consent: true,
      consent_version: form.getAttribute("data-consent-version"),
      website: form.website.value
    };
    if (!LIVE) { say("ok", T.preview); return; }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; say("", T.sending);
    fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res && res.ok) { say("ok", T.done); form.reset(); }
        else if (res && res.error === "email") say("err", T.email);
        else say("err", T.fail);
      })
      .catch(function () { say("err", T.fail); })
      .then(function () { btn.disabled = false; });
  });
})();
