<?php
// Teste de hash de senha
$password = "admin";
$hash_from_db = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

echo "Testando verificação de senha...\n";
echo "Senha: " . $password . "\n";
echo "Hash do banco: " . $hash_from_db . "\n";
echo "Verificação: " . (password_verify($password, $hash_from_db) ? "✅ PASSOU" : "❌ FALHOU") . "\n\n";

// Criar um novo hash
$new_hash = password_hash($password, PASSWORD_DEFAULT);
echo "Novo hash: " . $new_hash . "\n";
echo "Verificação do novo hash: " . (password_verify($password, $new_hash) ? "✅ PASSOU" : "❌ FALHOU") . "\n";
?>
