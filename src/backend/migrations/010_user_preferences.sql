-- Migration 010: table user_preferences pour la personnalisation par utilisateur
-- (layout du dashboard, préférences d'affichage, etc.)

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id     TEXT        NOT NULL,
  key         TEXT        NOT NULL,
  value       JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

-- Index pour les lookups par user_id (la PK couvre déjà (user_id, key) mais un index
-- sur user_id seul accélère les futurs SELECT * WHERE user_id = ...)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
