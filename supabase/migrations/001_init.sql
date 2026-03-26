-- ============================================================
-- ECOM247 Pesquisa ML - Schema inicial
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/wfxefylzqiinrvppeuwy/sql/new
-- ============================================================

-- 1. Tabela singleton para tokens do Mercado Livre
CREATE TABLE IF NOT EXISTS ml_tokens (
  id       INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token  TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  user_id       TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Apenas o backend (service role) acessa esta tabela
ALTER TABLE ml_tokens ENABLE ROW LEVEL SECURITY;
-- Sem politicas: bloqueia 100% o acesso via anon/usuario autenticado

-- 2. Inserir os tokens iniciais (o refresh_token e o mais importante)
-- A funcao ira renovar automaticamente quando o access_token expirar
INSERT INTO ml_tokens (id, access_token, refresh_token, user_id, expires_at)
VALUES (
  1,
  'APP_USR-2014098063924509-032610-5e7fa0e02ec330100058b429f1928950-164976539',
  'TG-69c545bfc2b73a0001c79e46-164976539',
  '164976539',
  NOW() - INTERVAL '1 second'
)
ON CONFLICT (id) DO UPDATE SET
  access_token  = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  user_id       = EXCLUDED.user_id,
  expires_at    = EXCLUDED.expires_at,
  updated_at    = NOW();

-- 3. Tabela de historico de pesquisas por usuario
CREATE TABLE IF NOT EXISTS search_history (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query      TEXT        NOT NULL,
  results    JSONB,
  score      INTEGER,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas seu proprio historico
CREATE POLICY "users_select_own" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

-- O backend (service role) insere sem policy de INSERT necessaria
CREATE POLICY "users_insert_own" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PRONTO! Execute este SQL e configure as env vars na Vercel.
-- ============================================================
