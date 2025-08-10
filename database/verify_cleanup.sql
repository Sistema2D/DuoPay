-- DuoPay - Verificação Final Pré-Hospedagem
-- Verifica se todos os dados foram limpos corretamente

USE fik_liso;

-- Verificar status de todas as tabelas
SELECT 'STATUS FINAL DA LIMPEZA' as titulo;

SELECT 
    'USUÁRIOS MANTIDOS' as categoria,
    COUNT(*) as quantidade,
    GROUP_CONCAT(CONCAT(username, ' (', CASE WHEN is_admin = 1 THEN 'Admin' ELSE 'User' END, ')') SEPARATOR ', ') as detalhes
FROM users
WHERE is_active = 1

UNION ALL

SELECT 
    'TRANSAÇÕES REMOVIDAS' as categoria,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN 'Todas removidas ✓' ELSE 'ATENÇÃO: Ainda existem transações!' END as detalhes
FROM transactions

UNION ALL

SELECT 
    'ORÇAMENTOS REMOVIDOS' as categoria,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN 'Todos removidos ✓' ELSE 'ATENÇÃO: Ainda existem orçamentos!' END as detalhes
FROM budget_goals

UNION ALL

SELECT 
    'CATEGORIAS PADRÃO' as categoria,
    COUNT(*) as quantidade,
    CONCAT(
        (SELECT COUNT(*) FROM categories WHERE type = 'income' AND user_id IS NULL), ' receitas + ',
        (SELECT COUNT(*) FROM categories WHERE type = 'expense' AND user_id IS NULL), ' despesas'
    ) as detalhes
FROM categories
WHERE user_id IS NULL

UNION ALL

SELECT 
    'CATEGORIAS PERSONALIZADAS' as categoria,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN 'Todas removidas ✓' ELSE 'ATENÇÃO: Ainda existem categorias de usuários!' END as detalhes
FROM categories
WHERE user_id IS NOT NULL

UNION ALL

SELECT 
    'PREFERÊNCIAS PADRÃO' as categoria,
    COUNT(*) as quantidade,
    'Configurações padrão do sistema' as detalhes
FROM user_preferences
WHERE user_id = 'default';

-- Verificar integridade das views
SELECT 'VERIFICAÇÃO DAS VIEWS' as titulo;

SELECT 
    'monthly_summary' as view_name,
    COUNT(*) as registros,
    'View para resumos mensais' as descricao
FROM monthly_summary

UNION ALL

SELECT 
    'category_summary' as view_name,
    COUNT(*) as registros,
    'View para resumos por categoria' as descricao
FROM category_summary;

-- Status final
SELECT 
    'APLICAÇÃO PRONTA PARA HOSPEDAGEM' as status,
    NOW() as data_limpeza,
    'Todos os dados pessoais foram removidos, mantendo apenas estrutura e usuários' as observacao;
