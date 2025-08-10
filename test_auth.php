<?php
// Script de debug para auth.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== TESTE AUTH.PHP ===\n";

// Teste 1: Verificar se config.php carrega
echo "1. Carregando config.php...\n";
try {
    require_once 'config.php';
    echo "✅ config.php carregado com sucesso\n";
} catch (Exception $e) {
    echo "❌ Erro ao carregar config.php: " . $e->getMessage() . "\n";
    exit;
}

// Teste 2: Verificar conexão com banco
echo "2. Testando conexão com banco...\n";
try {
    $db = initializeDatabase();
    echo "✅ Conexão com banco estabelecida\n";
} catch (Exception $e) {
    echo "❌ Erro de conexão: " . $e->getMessage() . "\n";
    exit;
}

// Teste 3: Verificar se tabela users existe
echo "3. Verificando tabela users...\n";
try {
    $result = $db->query("SELECT COUNT(*) as count FROM users");
    $count = $result->fetch()['count'];
    echo "✅ Tabela users encontrada com $count usuário(s)\n";
} catch (Exception $e) {
    echo "❌ Erro ao acessar tabela users: " . $e->getMessage() . "\n";
}

// Teste 4: Verificar usuário admin
echo "4. Verificando usuário admin...\n";
try {
    $user = $db->fetch("SELECT * FROM users WHERE username = 'admin'");
    if ($user) {
        echo "✅ Usuário admin encontrado\n";
    } else {
        echo "❌ Usuário admin não encontrado\n";
    }
} catch (Exception $e) {
    echo "❌ Erro ao buscar usuário admin: " . $e->getMessage() . "\n";
}

echo "=== TESTE CONCLUÍDO ===\n";
?>
