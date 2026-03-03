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
