<?php
// Desabilitar exibição de erros HTML
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Configurar error handler para retornar JSON
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor'
    ]);
    exit;
});

// Configurar exception handler para retornar JSON
set_exception_handler(function($exception) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor'
    ]);
    exit;
});

require_once 'config.php';

// Configurar tempo de vida da sessão para 30 minutos
ini_set('session.gc_maxlifetime', 1800); // 30 minutos
ini_set('session.cookie_lifetime', 1800); // 30 minutos
session_set_cookie_params(1800); // 30 minutos

session_start();

setCorsHeaders();

try {
    $db = initializeDatabase();
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro de conexão com banco de dados'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Safely decode JSON input
$input = null;
if ($method === 'POST') {
    $raw_input = file_get_contents('php://input');
    if (!empty($raw_input)) {
        $input = json_decode($raw_input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            errorResponse('Dados JSON inválidos', 400);
        }
    } else {
        // Allow empty input for some actions
        $input = [];
    }
}

switch ($method) {
    case 'POST':
        $action = $input['action'] ?? '';
        switch ($action) {
            case 'login':
                handleLogin($db, $input);
                break;
            case 'logout':
                handleLogout();
                break;
            case 'check_session':
                checkSession($db);
                break;
            case 'update_activity':
                updateActivity($db);
                break;
            case 'check_admin':
                checkAdmin();
                break;
                break;
            default:
                errorResponse('Ação não reconhecida', 400);
        }
        break;
    case 'GET':
        checkSession($db);
        break;
    default:
        errorResponse('Método não permitido', 405);
}

function handleLogin($db, $input) {
    if (empty($input['username']) || empty($input['password'])) {
        errorResponse('Usuário e senha são obrigatórios');
        return;
    }
    
    $username = trim($input['username']);
    $password = $input['password'];

    // Basic validation to prevent invalid input
    if (!preg_match('/^[a-zA-Z0-9._-]{3,}$/', $username)) {
        errorResponse('Usuário inválido');
        return;
    }

    if (strlen($password) < 4) {
        errorResponse('Senha inválida');
        return;
    }
    
    try {
        // Get user from database
        $user = $db->fetch("SELECT id, username, password, is_admin, is_active FROM users WHERE username = ? AND is_active = 1", [$username]);
        
        if (!$user) {
            errorResponse('Usuário ou senha incorretos');
            return;
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            errorResponse('Usuário ou senha incorretos');
            return;
        }
        
        // Update last activity
        $db->query("UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?", [$user['id']]);
        
        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        
        jsonResponse([
            'success' => true,
            'message' => 'Login realizado com sucesso',
            'data' => [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'is_admin' => (bool)$user['is_admin'],
                'login_time' => $_SESSION['login_time']
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro no servidor: ' . $e->getMessage(), 500);
    }
}

function handleLogout() {
    session_destroy();
    jsonResponse([
        'success' => true,
        'message' => 'Logout realizado com sucesso'
    ]);
}

function checkSession($db) {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Usuário não autenticado', 401);
        return;
    }
    
    $userId = $_SESSION['user_id'];
    $lastActivity = $_SESSION['last_activity'] ?? 0;
    $currentTime = time();
    
    // Check if session expired (30 minutes = 1800 seconds)
    if (($currentTime - $lastActivity) > 1800) {
        session_destroy();
        errorResponse('Sessão expirada por inatividade', 401);
        return;
    }
    
    try {
        // Verify user still exists and is active
        $user = $db->fetch("SELECT id, username, is_admin, is_active FROM users WHERE id = ? AND is_active = 1", [$userId]);
        
        if (!$user) {
            session_destroy();
            errorResponse('Usuário inválido', 401);
            return;
        }
        
        // Update session with current admin status
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        
        jsonResponse([
            'success' => true,
            'message' => 'Sessão válida',
            'data' => [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'is_admin' => (bool)$user['is_admin'],
                'last_activity' => $lastActivity,
                'session_time' => $currentTime - $_SESSION['login_time']
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro no servidor: ' . $e->getMessage(), 500);
    }
}

function updateActivity($db) {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Usuário não autenticado', 401);
        return;
    }
    
    $userId = $_SESSION['user_id'];
    $_SESSION['last_activity'] = time();
    
    try {
        // Update activity in database
        $db->query("UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?", [$userId]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Atividade atualizada',
            'data' => ['last_activity' => $_SESSION['last_activity']]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro no servidor: ' . $e->getMessage(), 500);
    }
}

function checkAdmin() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin'])) {
        jsonResponse([
            'success' => false,
            'is_admin' => false,
            'message' => 'Usuário não autenticado'
        ]);
        return;
    }
    
    jsonResponse([
        'success' => true,
        'is_admin' => (bool)$_SESSION['is_admin'],
        'message' => 'Status verificado'
    ]);
}
?>
