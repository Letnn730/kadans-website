/* Compatibility list shown by the "Check my bike" tool.
   Status: "ok" = supported at launch, "check" = to be confirmed, "no" = not supported yet.
   Keep in step with the ebike-profiles repo: a family is "ok" only when its
   profile is bench-verified. */
window.KURANT_COMPAT = {
  families: [
    { id: "kt", status: "ok",
      fr: { name: "KT (Kunteng) – écrans LCD3, LCD5, LCD8, VM-T8", note: "Vérifié sur banc d'essai avec un contrôleur KT. Câble KT inclus." },
      en: { name: "KT (Kunteng) – LCD3, LCD5, LCD8, VM-T8 displays", note: "Verified on the bench with a KT controller. KT cable included." } },
    { id: "bafang-uart", status: "check",
      fr: { name: "Bafang – connecteur rond à 5 broches (UART)", note: "Profil en préparation. Une vérification sur un vélo réel est prévue avant le lancement." },
      en: { name: "Bafang – round 5-pin connector (UART)", note: "Profile in progress. It will be verified on a real bike before launch." } },
    { id: "bafang-can", status: "no",
      fr: { name: "Bafang – connecteur triangulaire (CAN)", note: "Pas prise en charge pour le moment. Prévue dans une version ultérieure du module." },
      en: { name: "Bafang – triangular connector (CAN)", note: "Not supported yet. Planned for a later version of the module." } },
    { id: "rad-lishui", status: "check",
      fr: { name: "Rad Power Bikes – RadRunner 1 ou 2", note: "Prévu. Le protocole doit d'abord être enregistré sur un vélo réel." },
      en: { name: "Rad Power Bikes – RadRunner 1 or 2", note: "Planned. The protocol must first be recorded on a real bike." } },
    { id: "rad-asi", status: "check",
      fr: { name: "Rad Power Bikes – RadRunner 3 Plus", note: "Prévu. Le protocole doit d'abord être enregistré sur un vélo réel." },
      en: { name: "Rad Power Bikes – RadRunner 3 Plus", note: "Planned. The protocol must first be recorded on a real bike." } },
    { id: "lectric", status: "check",
      fr: { name: "Lectric XP", note: "Prévu. Le contrôleur doit être identifié sur un vélo réel." },
      en: { name: "Lectric XP", note: "Planned. The controller must be identified on a real bike." } },
    { id: "happyrun-48", status: "check",
      fr: { name: "HappyRun G100 (48 V)", note: "Vérification en cours sur un G100." },
      en: { name: "HappyRun G100 (48 V)", note: "Verification in progress on a G100." } },
    { id: "happyrun-pro", status: "no",
      fr: { name: "HappyRun G100 Pro (72 V)", note: "Tension trop élevée pour cette version du module." },
      en: { name: "HappyRun G100 Pro (72 V)", note: "Voltage too high for this version of the module." } },
    { id: "aventon-app", status: "no",
      fr: { name: "Aventon avec application (Level.2, Pace 500.3 et plus récents)", note: "Ces vélos ont déjà leur propre application. Ils ne sont pas prioritaires." },
      en: { name: "Aventon with app (Level.2, Pace 500.3 and newer)", note: "These bikes already have their own app. They are not a priority." } },
    { id: "bosch", status: "no",
      fr: { name: "Bosch", note: "Système fermé. Bosch offre sa propre application, eBike Flow." },
      en: { name: "Bosch", note: "Closed system. Bosch offers its own app, eBike Flow." } },
    { id: "shimano", status: "no",
      fr: { name: "Shimano STEPS", note: "Système fermé. Shimano offre sa propre application, E-TUBE RIDE." },
      en: { name: "Shimano STEPS", note: "Closed system. Shimano offers its own app, E-TUBE RIDE." } },
    { id: "other", status: "check",
      fr: { name: "Autre marque / je ne sais pas", note: "Recopiez le texte de l'étiquette du contrôleur dans le formulaire. Nous vérifierons votre configuration." },
      en: { name: "Other brand / I don't know", note: "Copy the text on the controller's label into the form. We will check your setup." } }
  ],
  voltages: [
    { id: "36", status: "check",
      fr: { name: "36 V", note: "En dehors de la plage prévue (48 à 52 V). À vérifier." },
      en: { name: "36 V", note: "Outside the planned range (48 to 52 V). To be confirmed." } },
    { id: "48", status: "ok", fr: { name: "48 V", note: "" }, en: { name: "48 V", note: "" } },
    { id: "52", status: "ok", fr: { name: "52 V", note: "" }, en: { name: "52 V", note: "" } },
    { id: "60-72", status: "no",
      fr: { name: "60 à 72 V", note: "Tension non prise en charge par cette version du module." },
      en: { name: "60 to 72 V", note: "This voltage is not supported by this version of the module." } },
    { id: "unknown", status: "check",
      fr: { name: "Je ne sais pas", note: "La tension est inscrite sur la batterie ou le chargeur." },
      en: { name: "I don't know", note: "The voltage is printed on the battery or the charger." } }
  ]
};
