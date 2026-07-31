-- Chat messages, keyed to a transaction's conversation.
-- Mirrors app.telos.domain.entity.Message.

CREATE TABLE message (
    id        VARCHAR(24) PRIMARY KEY,
    tx_id     VARCHAR(24) NOT NULL REFERENCES tx(id) ON DELETE CASCADE,
    sender_id VARCHAR(16) NOT NULL REFERENCES app_user(id),
    body      TEXT        NOT NULL,
    at        TIMESTAMPTZ NOT NULL,
    read_at   TIMESTAMPTZ
);
CREATE INDEX idx_message_tx ON message (tx_id, at);

-- Seed a conversation for tx-1001 (u-001 borrowing DJI Mini 3 Drone from u-102)
-- and tx-1002 (u-001 borrowing Stand Mixer from u-104), so the Chats list and
-- Chat screen have real content in either mock-mirroring or live mode.
INSERT INTO message (id, tx_id, sender_id, body, at, read_at) VALUES
  ('msg-1001a','tx-1001','u-102','Hi! The drone kit includes 2 batteries and a carry case.','2026-06-22T09:43:00Z','2026-06-22T09:43:30Z'),
  ('msg-1001b','tx-1001','u-001','Perfect. Any deposit required before pickup?','2026-06-22T09:44:00Z','2026-06-22T09:44:20Z'),
  ('msg-1001c','tx-1001','u-102','No cash deposit — just your verified ID on Telos. Payment stays in escrow until you scan the QR token at pickup.','2026-06-22T09:45:00Z','2026-06-22T09:45:40Z'),
  ('msg-1001d','tx-1001','u-001','That makes sense. I''ll send the request now. Looking forward to it!','2026-06-22T09:46:00Z','2026-06-22T09:46:10Z'),
  ('msg-1001e','tx-1001','u-102','Request accepted — I''ve unlocked this chat. Meet at the corner of Valencia & 18th at 10am on the 24th?','2026-06-22T09:48:00Z',NULL),
  ('msg-1001f','tx-1001','u-001','Works perfectly for me. See you then 👍','2026-06-22T09:49:00Z',NULL),
  ('msg-1002a','tx-1002','u-104','Hi! The mixer is ready whenever you are. It has the dough hook and whisk attachments.','2026-06-25T14:31:00Z','2026-06-25T14:32:00Z'),
  ('msg-1002b','tx-1002','u-001','Amazing, thank you! Planning a weekend baking marathon 😄','2026-06-25T14:33:00Z',NULL);
