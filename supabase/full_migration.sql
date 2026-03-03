-- FinControl: Initial schema
-- All tables use RLS for data isolation per user

-- ===========================================
-- PROFILES (extends auth.users)
-- ===========================================
CREATE TABLE fc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON fc_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON fc_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON fc_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fc_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- ACCOUNTS
-- ===========================================
CREATE TABLE fc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking'
    CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'building-2',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON fc_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts"
  ON fc_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts"
  ON fc_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts"
  ON fc_accounts FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- CREDIT CARDS
-- ===========================================
CREATE TABLE fc_credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  last_digits TEXT NOT NULL CHECK (length(last_digits) = 4),
  credit_limit DECIMAL(12,2) NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color TEXT DEFAULT '#8B5CF6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON fc_credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards"
  ON fc_credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards"
  ON fc_credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards"
  ON fc_credit_cards FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- CATEGORIES
-- ===========================================
CREATE TABLE fc_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_system BOOLEAN DEFAULT false,
  user_id UUID REFERENCES fc_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_categories ENABLE ROW LEVEL SECURITY;

-- System categories are visible to all; user categories only to owner
CREATE POLICY "Users can view system and own categories"
  ON fc_categories FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own categories"
  ON fc_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories"
  ON fc_categories FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own categories"
  ON fc_categories FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- ===========================================
-- TRANSACTIONS
-- ===========================================
CREATE TABLE fc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES fc_accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES fc_credit_cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES fc_categories(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  installment_current INTEGER,
  installment_total INTEGER,
  ai_category_confidence DECIMAL(3,2),
  ai_categorized BOOLEAN DEFAULT false,
  import_source TEXT,
  import_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (account_id IS NOT NULL OR card_id IS NOT NULL)
);

ALTER TABLE fc_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON fc_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON fc_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON fc_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON fc_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON fc_transactions(user_id, date DESC);
CREATE INDEX idx_transactions_import_hash ON fc_transactions(import_hash);
CREATE INDEX idx_transactions_category ON fc_transactions(category_id);

-- ===========================================
-- BUDGETS
-- ===========================================
CREATE TABLE fc_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES fc_categories(id),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,
  UNIQUE(user_id, category_id, month, year)
);

ALTER TABLE fc_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON fc_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets"
  ON fc_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets"
  ON fc_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets"
  ON fc_budgets FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- AI INSIGHTS
-- ===========================================
CREATE TABLE fc_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('summary', 'suggestion', 'anomaly', 'forecast')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_month INTEGER,
  reference_year INTEGER,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON fc_ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights"
  ON fc_ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights"
  ON fc_ai_insights FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- CHAT MESSAGES
-- ===========================================
CREATE TABLE fc_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON fc_chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages"
  ON fc_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
-- FinControl: Additional tables and columns based on financial specialist recommendations
-- Adds: scope (PF/PJ), categorization rules, notifications, recurring templates,
-- savings goals, transaction splits, and planned transactions

-- ===========================================
-- Add scope, notes, tags, planned fields to transactions
-- ===========================================
ALTER TABLE fc_transactions ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'personal'
  CHECK (scope IN ('personal', 'business', 'shared'));
ALTER TABLE fc_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE fc_transactions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE fc_transactions ADD COLUMN IF NOT EXISTS is_planned BOOLEAN DEFAULT false;
ALTER TABLE fc_transactions ADD COLUMN IF NOT EXISTS planned_date DATE;

CREATE INDEX IF NOT EXISTS idx_transactions_scope ON fc_transactions(user_id, scope);

-- ===========================================
-- Add scope to accounts
-- ===========================================
ALTER TABLE fc_accounts ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'personal'
  CHECK (scope IN ('personal', 'business'));

-- ===========================================
-- CATEGORIZATION RULES
-- Deterministic regex-based categorization that runs BEFORE AI
-- ===========================================
CREATE TABLE fc_categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES fc_profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')),
  category_id UUID NOT NULL REFERENCES fc_categories(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and system rules"
  ON fc_categorization_rules FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own rules"
  ON fc_categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules"
  ON fc_categorization_rules FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own rules"
  ON fc_categorization_rules FOR DELETE USING (auth.uid() = user_id AND is_system = false);

CREATE INDEX idx_rules_user ON fc_categorization_rules(user_id);

-- ===========================================
-- NOTIFICATIONS
-- ===========================================
CREATE TABLE fc_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('budget_alert', 'card_limit', 'due_date', 'anomaly', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON fc_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications"
  ON fc_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON fc_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications"
  ON fc_notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_read ON fc_notifications(user_id, is_read);

-- ===========================================
-- RECURRING TEMPLATES
-- ===========================================
CREATE TABLE fc_recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES fc_accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES fc_credit_cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES fc_categories(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  day_of_month INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON fc_recurring_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates"
  ON fc_recurring_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates"
  ON fc_recurring_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates"
  ON fc_recurring_templates FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_templates_user ON fc_recurring_templates(user_id);

-- ===========================================
-- SAVINGS GOALS
-- ===========================================
CREATE TABLE fc_savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES fc_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#10B981',
  auto_percentage DECIMAL(5,2),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON fc_savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals"
  ON fc_savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals"
  ON fc_savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals"
  ON fc_savings_goals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_goals_user ON fc_savings_goals(user_id);

-- ===========================================
-- SAVINGS CONTRIBUTIONS
-- ===========================================
CREATE TABLE fc_savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES fc_savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: access via savings_goals ownership
ALTER TABLE fc_savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contributions of own goals"
  ON fc_savings_contributions FOR SELECT
  USING (goal_id IN (SELECT id FROM fc_savings_goals WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert contributions to own goals"
  ON fc_savings_contributions FOR INSERT
  WITH CHECK (goal_id IN (SELECT id FROM fc_savings_goals WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete contributions from own goals"
  ON fc_savings_contributions FOR DELETE
  USING (goal_id IN (SELECT id FROM fc_savings_goals WHERE user_id = auth.uid()));

-- ===========================================
-- TRANSACTION SPLITS (expense sharing between members)
-- ===========================================
CREATE TABLE fc_transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES fc_transactions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES fc_profiles(id),
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fc_transaction_splits ENABLE ROW LEVEL SECURITY;

-- Owner of the transaction can view all splits
CREATE POLICY "Transaction owners can view splits"
  ON fc_transaction_splits FOR SELECT
  USING (
    transaction_id IN (SELECT id FROM fc_transactions WHERE user_id = auth.uid())
    OR member_id = auth.uid()
  );
CREATE POLICY "Transaction owners can insert splits"
  ON fc_transaction_splits FOR INSERT
  WITH CHECK (transaction_id IN (SELECT id FROM fc_transactions WHERE user_id = auth.uid()));
CREATE POLICY "Transaction owners can update splits"
  ON fc_transaction_splits FOR UPDATE
  USING (
    transaction_id IN (SELECT id FROM fc_transactions WHERE user_id = auth.uid())
    OR member_id = auth.uid()
  );

CREATE INDEX idx_splits_transaction ON fc_transaction_splits(transaction_id);
CREATE INDEX idx_splits_member ON fc_transaction_splits(member_id);

-- ===========================================
-- Extend ai_insights type to include health_score
-- ===========================================
ALTER TABLE fc_ai_insights DROP CONSTRAINT IF EXISTS ai_insights_type_check;
ALTER TABLE fc_ai_insights ADD CONSTRAINT ai_insights_type_check
  CHECK (type IN ('summary', 'suggestion', 'anomaly', 'forecast', 'health_score'));
-- FinControl: Default system categories

-- Expense categories
INSERT INTO fc_categories (name, icon, color, type, is_system) VALUES
  ('Alimentacao', 'utensils', '#EF4444', 'expense', true),
  ('Transporte', 'car', '#F97316', 'expense', true),
  ('Moradia', 'home', '#F59E0B', 'expense', true),
  ('Saude', 'heart-pulse', '#10B981', 'expense', true),
  ('Educacao', 'graduation-cap', '#3B82F6', 'expense', true),
  ('Lazer', 'gamepad-2', '#8B5CF6', 'expense', true),
  ('Compras', 'shopping-bag', '#EC4899', 'expense', true),
  ('Assinaturas/Streaming', 'tv', '#6366F1', 'expense', true),
  ('Servicos', 'wrench', '#14B8A6', 'expense', true),
  ('Impostos/Taxas', 'landmark', '#64748B', 'expense', true),
  ('Parcelas', 'credit-card', '#D946EF', 'expense', true),
  ('Transferencias', 'arrow-right-left', '#0EA5E9', 'expense', true),
  ('Pets', 'dog', '#A3E635', 'expense', true),
  ('Vestuario', 'shirt', '#FB923C', 'expense', true),
  ('Outros', 'circle-ellipsis', '#94A3B8', 'expense', true);

-- Income categories
INSERT INTO fc_categories (name, icon, color, type, is_system) VALUES
  ('Salario', 'banknote', '#22C55E', 'income', true),
  ('Freelance/PJ', 'laptop', '#3B82F6', 'income', true),
  ('Rendimentos', 'trending-up', '#10B981', 'income', true),
  ('Vendas', 'store', '#F97316', 'income', true),
  ('Reembolso', 'undo-2', '#6366F1', 'income', true),
  ('Aluguel Recebido', 'building', '#8B5CF6', 'income', true),
  ('Dividendos', 'bar-chart-3', '#0EA5E9', 'income', true),
  ('Cashback', 'rotate-ccw', '#14B8A6', 'income', true),
  ('Outros', 'circle-ellipsis', '#94A3B8', 'income', true);

-- ===========================================
-- Default system categorization rules (Brazilian services)
-- These match common transaction descriptions to categories
-- user_id is set to a dummy UUID for system rules; RLS allows is_system=true
-- ===========================================

-- Note: These rules reference categories by name. In practice, you'd use
-- the actual UUID. This seed uses a subquery approach.

INSERT INTO fc_categorization_rules (user_id, pattern, match_type, category_id, priority, is_active, is_system)
SELECT NULL, r.pattern, r.match_type, c.id, r.priority, true, true
FROM (VALUES
  -- Transporte
  ('UBER', 'contains', 'Transporte', 10),
  ('99POP', 'contains', 'Transporte', 10),
  ('99 POP', 'contains', 'Transporte', 10),
  ('CABIFY', 'contains', 'Transporte', 10),
  -- Alimentacao
  ('IFOOD', 'contains', 'Alimentacao', 10),
  ('RAPPI', 'contains', 'Alimentacao', 10),
  ('ZDELIVERY', 'contains', 'Alimentacao', 10),
  ('MCDONALDS', 'contains', 'Alimentacao', 10),
  ('BURGER KING', 'contains', 'Alimentacao', 10),
  ('STARBUCKS', 'contains', 'Alimentacao', 10),
  ('RESTAURANTE', 'contains', 'Alimentacao', 5),
  ('PADARIA', 'contains', 'Alimentacao', 5),
  ('SUPERMERCADO', 'contains', 'Alimentacao', 5),
  ('MERCADO', 'contains', 'Alimentacao', 3),
  -- Assinaturas/Streaming
  ('NETFLIX', 'contains', 'Assinaturas/Streaming', 10),
  ('SPOTIFY', 'contains', 'Assinaturas/Streaming', 10),
  ('DISNEY', 'contains', 'Assinaturas/Streaming', 10),
  ('AMAZON PRIME', 'contains', 'Assinaturas/Streaming', 10),
  ('HBO MAX', 'contains', 'Assinaturas/Streaming', 10),
  ('YOUTUBE PREMIUM', 'contains', 'Assinaturas/Streaming', 10),
  ('APPLE', 'contains', 'Assinaturas/Streaming', 5),
  ('GOOGLE STORAGE', 'contains', 'Assinaturas/Streaming', 10),
  -- Compras
  ('MERCADO LIVRE', 'contains', 'Compras', 10),
  ('AMAZON', 'contains', 'Compras', 5),
  ('SHOPEE', 'contains', 'Compras', 10),
  ('MAGALU', 'contains', 'Compras', 10),
  ('AMERICANAS', 'contains', 'Compras', 10),
  ('ALIEXPRESS', 'contains', 'Compras', 10),
  -- Saude
  ('FARMACIA', 'contains', 'Saude', 10),
  ('DROGARIA', 'contains', 'Saude', 10),
  ('DROGA RAIA', 'contains', 'Saude', 10),
  ('DROGASIL', 'contains', 'Saude', 10),
  -- Moradia (utilities)
  ('CEMIG', 'contains', 'Moradia', 10),
  ('COPASA', 'contains', 'Moradia', 10),
  ('SABESP', 'contains', 'Moradia', 10),
  ('CPFL', 'contains', 'Moradia', 10),
  ('ENEL', 'contains', 'Moradia', 10),
  ('ALUGUEL', 'contains', 'Moradia', 8),
  ('CONDOMINIO', 'contains', 'Moradia', 8),
  -- Receita
  ('SALARIO', 'contains', 'Salario', 10),
  ('PAGAMENTO FOLHA', 'contains', 'Salario', 10)
) AS r(pattern, match_type, category_name, priority)
JOIN fc_categories c ON c.name = r.category_name AND c.is_system = true;
