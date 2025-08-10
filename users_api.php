<?php
require_once 'config.php';
session_start();

setCorsHeaders();

// Verificar se é admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.']);
    exit;
}

try {
    $db = initializeDatabase();
} catch (Exception $e) {
    errorResponse('Erro de conexão com banco de dados', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$input = null;

if ($method === 'POST' || $method === 'PUT') {
    $raw_input = file_get_contents('php://input');
    if (!empty($raw_input)) {
        $input = json_decode($raw_input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            errorResponse('Dados JSON inválidos', 400);
        }
    } else {
        $input = []; // Allow empty input
    }
}

switch ($method) {
    case 'GET':
        handleGetUsers($db);
        break;
    case 'POST':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'list_users':
                    handleGetUsers($db);
                    break;
                case 'create_user':
                    handleCreateUser($db, $input);
                    break;
                case 'update_user':
                    handleUpdateUser($db, $input);
                    break;
                case 'delete_user':
                    handleDeleteUser($db, $input);
                    break;
                default:
                    errorResponse('Ação não reconhecida', 400);
            }
        } else {
            errorResponse('Ação não especificada', 400);
        }
        break;
    case 'PUT':
        handleUpdateUser($db, $input);
        break;
    case 'DELETE':
        handleDeleteUser($db, $input);
        break;
    default:
        errorResponse('Método não permitido', 405);
}

function handleGetUsers($db) {
    try {
        $users = $db->fetchAll("
            SELECT id, username, is_admin, created_at, last_activity, is_active 
            FROM users 
            ORDER BY created_at DESC
        ");
        
        // Format dates
        foreach ($users as &$user) {
            $user['is_admin'] = (bool)$user['is_admin'];
            $user['is_active'] = (bool)$user['is_active'];
            
            // Keep original timestamp format for JavaScript to handle
            // Just ensure they're not null
            $user['created_at'] = $user['created_at'] ?: null;
            $user['last_activity'] = $user['last_activity'] ?: null;
        }
        
        jsonResponse([
            'success' => true,
            'users' => $users
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro ao buscar usuários: ' . $e->getMessage(), 500);
    }
}

function handleCreateUser($db, $input) {
    if (empty($input['username'])) {
        errorResponse('Nome de usuário é obrigatório');
        return;
    }
    
    if (empty($input['password'])) {
        errorResponse('Senha é obrigatória para criar usuário');
        return;
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    $isAdmin = isset($input['is_admin']) ? (bool)$input['is_admin'] : false;
    
    // Validar username
    if (strlen($username) < 3) {
        errorResponse('Nome de usuário deve ter pelo menos 3 caracteres');
        return;
    }
    
    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $username)) {
        errorResponse('Nome de usuário pode conter apenas letras, números, ponto, underscore e hífen');
        return;
    }
    
    // Validar senha
    if (strlen($password) < 4) {
        errorResponse('Senha deve ter pelo menos 4 caracteres');
        return;
    }
    
    try {
        // Verificar se usuário já existe
        $existingUser = $db->fetch("SELECT id FROM users WHERE username = ?", [$username]);
        if ($existingUser) {
            errorResponse('Nome de usuário já existe');
            return;
        }
        
        // Criar hash da senha
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Inserir usuário
        $db->query("
            INSERT INTO users (username, password, is_admin, created_at) 
            VALUES (?, ?, ?, NOW())
        ", [$username, $hashedPassword, $isAdmin ? 1 : 0]);
        
        $userId = $db->lastInsertId();
        
        jsonResponse([
            'success' => true,
            'message' => 'Usuário criado com sucesso',
            'data' => [
                'id' => $userId,
                'username' => $username,
                'is_admin' => $isAdmin
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro ao criar usuário: ' . $e->getMessage(), 500);
    }
}

function handleUpdateUser($db, $input) {
    if (empty($input['user_id'])) {
        errorResponse('ID do usuário é obrigatório');
        return;
    }
    
    $userId = (int)$input['user_id'];
    $username = isset($input['username']) ? trim($input['username']) : null;
    $password = isset($input['password']) ? $input['password'] : null;
    $isAdmin = isset($input['is_admin']) ? (bool)$input['is_admin'] : false;
    $isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;
    
    // Não permitir desativar o próprio usuário
    if ($userId === $_SESSION['user_id'] && !$isActive) {
        errorResponse('Você não pode desativar sua própria conta');
        return;
    }
    
    try {
        // Verificar se usuário existe
        $user = $db->fetch("SELECT id, username FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            errorResponse('Usuário não encontrado');
            return;
        }
        
        // Validar username se fornecido
        if ($username && $username !== $user['username']) {
            if (strlen($username) < 3) {
                errorResponse('Nome de usuário deve ter pelo menos 3 caracteres');
                return;
            }
            
            if (!preg_match('/^[a-zA-Z0-9._-]+$/', $username)) {
                errorResponse('Nome de usuário pode conter apenas letras, números, ponto, underscore e hífen');
                return;
            }
            
            // Verificar se novo username já existe
            $existingUser = $db->fetch("SELECT id FROM users WHERE username = ? AND id != ?", [$username, $userId]);
            if ($existingUser) {
                errorResponse('Nome de usuário já existe');
                return;
            }
        }
        
        // Preparar campos para atualização
        $updateFields = [];
        $updateValues = [];
        
        if ($username && $username !== $user['username']) {
            $updateFields[] = "username = ?";
            $updateValues[] = $username;
        }
        
        if ($password && !empty($password)) {
            if (strlen($password) < 4) {
                errorResponse('Senha deve ter pelo menos 4 caracteres');
                return;
            }
            $updateFields[] = "password = ?";
            $updateValues[] = password_hash($password, PASSWORD_DEFAULT);
        }
        
        $updateFields[] = "is_admin = ?";
        $updateValues[] = $isAdmin ? 1 : 0;
        
        $updateFields[] = "is_active = ?";
        $updateValues[] = $isActive ? 1 : 0;
        
        $updateFields[] = "updated_at = NOW()";
        $updateValues[] = $userId; // For WHERE clause
        
        // Atualizar usuário
        $sql = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $db->query($sql, $updateValues);
        
        jsonResponse([
            'success' => true,
            'message' => 'Usuário atualizado com sucesso',
            'data' => [
                'id' => $userId,
                'username' => $username ?: $user['username'],
                'is_admin' => $isAdmin,
                'is_active' => $isActive
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro ao atualizar usuário: ' . $e->getMessage(), 500);
    }
}

function handleDeleteUser($db, $input = null) {
    $userId = null;
    
    // Try to get user ID from input first, then from GET
    if ($input && isset($input['user_id'])) {
        $userId = $input['user_id'];
    } else {
        $userId = $_GET['id'] ?? null;
    }
    
    if (!$userId) {
        errorResponse('ID do usuário é obrigatório');
        return;
    }
    
    $userId = (int)$userId;
    $sessionUserId = (int)$_SESSION['user_id'];
    
    // Não permitir excluir o próprio usuário
    if ($userId === $sessionUserId) {
        errorResponse('Você não pode excluir sua própria conta');
        return;
    }
    
    try {
        // Verificar se usuário existe
        $user = $db->fetch("SELECT id, username FROM users WHERE id = ?", [$userId]);
        if (!$user) {
            errorResponse('Usuário não encontrado');
            return;
        }
        
        // Excluir usuário
        $db->query("DELETE FROM users WHERE id = ?", [$userId]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Usuário excluído com sucesso',
            'data' => [
                'id' => $userId,
                'username' => $user['username']
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Erro ao excluir usuário: ' . $e->getMessage(), 500);
    }
}
?>
