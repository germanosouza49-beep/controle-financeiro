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
