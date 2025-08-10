-- DuoPay - Script de Limpeza de Dados (Versão Corrigida)
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

-- Para categories, vamos obter o próximo ID manualmente
SET @max_cat_id = (SELECT COALESCE(MAX(id), 0) FROM categories);
SET @next_cat_id = @max_cat_id + 1;
SET @sql = CONCAT('ALTER TABLE categories AUTO_INCREMENT = ', @next_cat_id);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Reabilitar verificações de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar resultado da limpeza
SELECT 'Limpeza concluída com sucesso!' as status;
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
    CASE WHEN is_admin = 1 THEN 'Admin' ELSE 'Usuário' END as tipo,
    CASE WHEN is_active = 1 THEN 'Ativo' ELSE 'Inativo' END as status,
    DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as criado_em,
    DATE_FORMAT(last_activity, '%d/%m/%Y %H:%i') as ultima_atividade
FROM users 
ORDER BY id;
