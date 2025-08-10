-- DuoPay - Restaurar Categorias Padrão
-- Recria as categorias padrão do sistema após limpeza

USE fik_liso;

-- Recriar categorias padrão de receita
INSERT INTO categories (name, type, color, icon, is_active, user_id) VALUES 
('Salário', 'income', '#28a745', 'fas fa-money-bill-wave', TRUE, NULL),
('Freelance', 'income', '#17a2b8', 'fas fa-laptop-code', TRUE, NULL),
('Investimentos', 'income', '#ffc107', 'fas fa-chart-line', TRUE, NULL),
('Vendas', 'income', '#20c997', 'fas fa-store', TRUE, NULL),
('Outros', 'income', '#6c757d', 'fas fa-plus-circle', TRUE, NULL);

-- Recriar categorias padrão de despesa
INSERT INTO categories (name, type, color, icon, is_active, user_id) VALUES 
('Alimentação', 'expense', '#dc3545', 'fas fa-utensils', TRUE, NULL),
('Transporte', 'expense', '#fd7e14', 'fas fa-car', TRUE, NULL),
('Moradia', 'expense', '#6f42c1', 'fas fa-home', TRUE, NULL),
('Saúde', 'expense', '#e83e8c', 'fas fa-heartbeat', TRUE, NULL),
('Educação', 'expense', '#0dcaf0', 'fas fa-graduation-cap', TRUE, NULL),
('Lazer', 'expense', '#198754', 'fas fa-gamepad', TRUE, NULL),
('Roupas', 'expense', '#795548', 'fas fa-tshirt', TRUE, NULL),
('Tecnologia', 'expense', '#607d8b', 'fas fa-laptop', TRUE, NULL),
('Contas', 'expense', '#ff5722', 'fas fa-file-invoice', TRUE, NULL),
('Outros', 'expense', '#6c757d', 'fas fa-ellipsis-h', TRUE, NULL);

-- Recriar preferências padrão
INSERT INTO user_preferences (preference_key, preference_value, user_id) VALUES 
('theme', 'light', 'default'),
('currency', 'BRL', 'default'),
('default_view', 'dashboard', 'default'),
('last_category_type', 'expense', 'default'),
('last_category', 'Outros', 'default')
ON DUPLICATE KEY UPDATE 
preference_value = VALUES(preference_value);

-- Verificar resultado
SELECT 'Categorias e preferências restauradas!' as status;
SELECT 
    (SELECT COUNT(*) FROM categories WHERE user_id IS NULL) as categorias_padrao,
    (SELECT COUNT(*) FROM user_preferences WHERE user_id = 'default') as preferencias_padrao;

-- Listar categorias criadas
SELECT 
    name as categoria,
    type as tipo,
    color as cor,
    icon as icone
FROM categories 
WHERE user_id IS NULL
ORDER BY type, name;
