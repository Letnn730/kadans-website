-- Kadans waitlist (Cloudflare D1)
CREATE TABLE IF NOT EXISTS waitlist (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  email            TEXT NOT NULL UNIQUE,
  bike             TEXT,
  controller_label TEXT,
  family           TEXT,
  voltage          TEXT,
  phone_os         TEXT,
  province         TEXT,
  lang             TEXT NOT NULL DEFAULT 'fr',
  consent_version  TEXT NOT NULL,              -- version of the consent text accepted (CASL proof)
  consent_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at  TEXT,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS waitlist_family ON waitlist (family);
