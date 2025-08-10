<?php
// Database configuration for DuoPay - Vercel Compatible
// Use environment variables for production (Vercel) and fallback to localhost for development

define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fik_liso');
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '');

// For Vercel/PlanetScale or other cloud databases
define('DB_PORT', $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');
define('DB_SSL', $_ENV['DB_SSL'] ?? getenv('DB_SSL') ?: false);

class Database {
    private $connection;
    
    public function __construct() {
        try {
            // Build DSN based on environment
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            
            // Add SSL support for cloud databases
            if (DB_SSL) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new Exception('Erro de conexão com banco de dados: ' . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}

// Initialize database and create tables if they don't exist
function initializeDatabase() {
    $db = new Database();
    
    $createTable = "
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type ENUM('income', 'expense') NOT NULL,
            payment_date DATE NOT NULL,
            is_paid BOOLEAN DEFAULT FALSE,
            status ENUM('paid', 'pending') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    try {
        $db->query($createTable);
        return $db;
    } catch (Exception $e) {
        throw new Exception('Erro ao criar tabela no banco de dados: ' . $e->getMessage());
    }
}

// Response helper functions
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse($message, $status = 400) {
    jsonResponse(['success' => false, 'message' => $message], $status);
}

function successResponse($data = null, $message = 'Success') {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response);
}

// Validation functions
function validateTransaction($data) {
    $errors = [];
    
    // Description validation
    if (empty($data['description'])) {
        $errors[] = 'Descrição é obrigatória';
    } elseif (mb_strlen($data['description']) > 255) {
        $errors[] = 'Descrição deve ter no máximo 255 caracteres';
    }

    // Amount validation
    if (empty($data['amount']) || !is_numeric($data['amount']) || $data['amount'] <= 0) {
        $errors[] = 'Valor deve ser um número positivo';
    }

    // Type validation
    if (empty($data['type']) || !in_array($data['type'], ['income', 'expense'], true)) {
        $errors[] = 'Tipo deve ser "income" ou "expense"';
    }

    // Category validation
    if (empty($data['category'])) {
        $errors[] = 'Categoria é obrigatória';
    } elseif (mb_strlen($data['category']) > 100) {
        $errors[] = 'Categoria deve ter no máximo 100 caracteres';
    }

    // Payment date validation
    if (empty($data['payment_date'])) {
        $data['payment_date'] = date('Y-m-d');
    } else {
        $date = DateTime::createFromFormat('Y-m-d', $data['payment_date']);
        if (!$date) {
            $errors[] = 'Data de pagamento inválida';
        }
    }

    return $errors;
}

// CORS headers for development
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
?>
