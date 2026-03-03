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
