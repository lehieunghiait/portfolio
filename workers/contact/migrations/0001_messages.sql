-- Tin nhắn gửi từ form liên hệ
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  lang       TEXT    NOT NULL DEFAULT 'en',
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  read_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
