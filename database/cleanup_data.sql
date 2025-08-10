-- DuoPay - Script de Limpeza de Dados
-- Remove todos os dados exceto usuários criados
-- Execute este script antes da hospedagem

USE fik_liso;

-- Desabilitar verificações de chave estrangeira temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar todas as transações
DELETE FROM transactions;

-- Limpar todos os objetivos de orçamento
DELETE FROM budget_goals;

-- Limpar preferências dos usuários (exceto configurações padrão básicas)
DELETE FROM user_preferences WHERE user_id != 'default';

-- Resetar preferências padrão para valores iniciais
UPDATE user_preferences SET 
    preference_value = CASE 
        WHEN preference_key = 'theme' THEN 'light'
        WHEN preference_key = 'currency' THEN 'BRL'
        WHEN preference_key = 'default_view' THEN 'dashboard'
        WHEN preference_key = 'last_category_type' THEN 'expense'
        WHEN preference_key = 'last_category' THEN 'Outros'
        ELSE preference_value
    END
WHERE user_id = 'default';

-- Limpar categorias personalizadas dos usuários (manter apenas as padrão)
DELETE FROM categories WHERE user_id IS NOT NULL;

-- Resetar auto_increment para começar do zero (exceto users)
ALTER TABLE transactions AUTO_INCREMENT = 1;
ALTER TABLE budget_goals AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = (SELECT MAX(id) + 1 FROM categories);

-- Reabilitar verificações de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar resultado da limpeza
SELECT 'Limpeza concluída!' as status;
SELECT 
    (SELECT COUNT(*) FROM users) as usuarios_mantidos,
    (SELECT COUNT(*) FROM transactions) as transacoes_removidas,
    (SELECT COUNT(*) FROM budget_goals) as orcamentos_removidos,
    (SELECT COUNT(*) FROM categories WHERE user_id IS NULL) as categorias_padrao_mantidas,
    (SELECT COUNT(*) FROM categories WHERE user_id IS NOT NULL) as categorias_personalizadas_removidas;

-- Mostrar usuários que foram mantidos
SELECT 
    id,
    username,
    is_admin,
    is_active,
    created_at,
    last_activity
FROM users 
ORDER BY id;
