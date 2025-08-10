<?php
// Auth.php simplificado para debug
header('Content-Type: application/json');

// Log de debug
error_log("AUTH.PHP - Início do script");

try {
    require_once 'config.php';
    error_log("AUTH.PHP - Config carregado");
    
    session_start();
    error_log("AUTH.PHP - Sessão iniciada");
    
    setCorsHeaders();
    error_log("AUTH.PHP - Headers CORS definidos");
    
    $db = initializeDatabase();
    error_log("AUTH.PHP - Banco inicializado");
    
    $method = $_SERVER['REQUEST_METHOD'];
    error_log("AUTH.PHP - Método: " . $method);
    
    if ($method === 'POST') {
        $input_raw = file_get_contents('php://input');
        error_log("AUTH.PHP - Input raw: " . $input_raw);
        
        $input = json_decode($input_raw, true);
        error_log("AUTH.PHP - Input decoded: " . print_r($input, true));
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("AUTH.PHP - Erro JSON: " . json_last_error_msg());
            echo json_encode(['success' => false, 'message' => 'JSON inválido']);
            exit;
        }
        
        $action = $input['action'] ?? '';
        error_log("AUTH.PHP - Action: " . $action);
        
        if ($action === 'login') {
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            error_log("AUTH.PHP - Tentando login para: " . $username);
            
            // Buscar usuário
            $user = $db->fetch("SELECT id, username, password, is_active FROM users WHERE username = ? AND is_active = 1", [$username]);
            
            if (!$user) {
                error_log("AUTH.PHP - Usuário não encontrado");
                echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos']);
                exit;
            }
            
            if (!password_verify($password, $user['password'])) {
                error_log("AUTH.PHP - Senha incorreta");
                echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos']);
                exit;
            }
            
            // Login bem-sucedido
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['login_time'] = time();
            $_SESSION['last_activity'] = time();
            
            error_log("AUTH.PHP - Login bem-sucedido");
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'data' => [
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'login_time' => $_SESSION['login_time']
                ]
            ]);
            exit;
        }
    } else if ($method === 'GET') {
        // Verificar sessão
        if (!isset($_SESSION['user_id'])) {
            error_log("AUTH.PHP - Sessão não encontrada");
            echo json_encode(['success' => false, 'message' => 'Não autenticado']);
            exit;
        }
        
        error_log("AUTH.PHP - Sessão válida");
        echo json_encode([
            'success' => true,
            'message' => 'Sessão válida',
            'data' => [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ]
        ]);
        exit;
    }
    
    error_log("AUTH.PHP - Método/ação não reconhecida");
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    
} catch (Exception $e) {
    error_log("AUTH.PHP - Exceção: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>
