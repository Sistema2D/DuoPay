<?php
require_once 'config.php';

try {
    $db = initializeDatabase();
    
    // Gerar novo hash para a senha "admin"
    $password = "admin";
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    echo "Atualizando senha do usuário admin...\n";
    echo "Nova senha hash: " . $hash . "\n";
    
    // Atualizar no banco
    $result = $db->query("UPDATE users SET password = ? WHERE username = 'admin'", [$hash]);
    
    echo "Senha atualizada com sucesso!\n";
    
    // Verificar se funcionou
    $user = $db->fetch("SELECT username, password FROM users WHERE username = 'admin'");
    echo "Verificação: " . (password_verify($password, $user['password']) ? "✅ PASSOU" : "❌ FALHOU") . "\n";
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
