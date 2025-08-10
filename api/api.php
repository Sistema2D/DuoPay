<?php
session_start();
require_once 'database.php';

setCorsHeaders();

$db = initializeDatabase();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    errorResponse('Usuário não autenticado', 401);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        handlePost($db, $input);
        break;
    case 'PUT':
        handlePut($db, $input);
        break;
    case 'DELETE':
        handleDelete($db);
        break;
    default:
        errorResponse('Método não permitido', 405);
}

function handleGet($db) {
    $action = $_GET['action'] ?? 'get_transactions';
    
    switch ($action) {
        case 'get_transactions':
            getTransactions($db);
            break;
        case 'monthly_evolution':
            handleMonthlyEvolution($db);
            break;
        case 'trends':
            handleTrends($db);
            break;
        case 'stats':
            handleStats($db);
            break;
        default:
            getTransactions($db);
            break;
    }
}

function getTransactions($db) {
    $user_id = $_SESSION['user_id'];
    
    try {
        $transactions = $db->fetchAll("
            SELECT 
                id,
                description,
                category,
                amount,
                type,
                payment_date,
                is_paid,
                status,
                DATE_FORMAT(created_at, '%d/%m/%Y') as created_at_formatted,
                created_at
            FROM transactions 
            WHERE user_id = ?
            ORDER BY payment_date DESC, created_at DESC
        ", [$user_id]);
        
        // Convert to format expected by frontend
        $formattedTransactions = array_map(function($transaction) {
            return [
                'id' => (int)$transaction['id'],
                'description' => $transaction['description'],
                'category' => $transaction['category'],
                'amount' => (float)$transaction['amount'],
                'type' => $transaction['type'],
                'paymentDate' => $transaction['payment_date'],
                'isPaid' => (bool)$transaction['is_paid'],
                'status' => $transaction['status'],
                'createdAt' => $transaction['created_at_formatted']
            ];
        }, $transactions);
        
        successResponse($formattedTransactions);
    } catch (Exception $e) {
        errorResponse('Erro ao buscar transações: ' . $e->getMessage(), 500);
    }
}

function handlePost($db, $input) {
    if (empty($input)) {
        errorResponse('Dados não fornecidos');
    }
    
    $errors = validateTransaction($input);
    if (!empty($errors)) {
        errorResponse(implode(', ', $errors));
    }
    
    $user_id = $_SESSION['user_id'];
    
    try {
        // Set default values
        $isPaid = $input['type'] === 'income' ? true : (!empty($input['isPaid']) || !empty($input['is_paid']));
        $status = $isPaid ? 'paid' : 'pending';
        
        $sql = "
            INSERT INTO transactions (description, category, amount, type, payment_date, is_paid, status, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $db->query($sql, [
            $input['description'],
            $input['category'] ?? 'Outros',
            $input['amount'],
            $input['type'],
            $input['payment_date'] ?? date('Y-m-d'),
            $isPaid,
            $status,
            $user_id
        ]);
        
        $newId = $db->lastInsertId();
        
        // Return the created transaction data
        $newTransaction = $db->fetch("
            SELECT 
                id,
                description,
                category,
                amount,
                type,
                payment_date,
                is_paid,
                status,
                DATE_FORMAT(created_at, '%d/%m/%Y') as created_at_formatted
            FROM transactions 
            WHERE id = ?
        ", [$newId]);
        
        $formattedTransaction = [
            'id' => (int)$newTransaction['id'],
            'description' => $newTransaction['description'],
            'category' => $newTransaction['category'],
            'amount' => (float)$newTransaction['amount'],
            'type' => $newTransaction['type'],
            'paymentDate' => $newTransaction['payment_date'],
            'isPaid' => (bool)$newTransaction['is_paid'],
            'status' => $newTransaction['status'],
            'createdAt' => $newTransaction['created_at_formatted']
        ];
        
        successResponse($formattedTransaction, 'Transação criada com sucesso');
    } catch (Exception $e) {
        errorResponse('Erro ao criar transação: ' . $e->getMessage(), 500);
    }
}

function handlePut($db, $input) {
    if (empty($input) || empty($input['id'])) {
        errorResponse('ID da transação é obrigatório');
    }
    
    $id = $input['id'];
    $user_id = $_SESSION['user_id'];
    
    // Check if transaction exists and belongs to user
    $existing = $db->fetch("SELECT id, type FROM transactions WHERE id = ? AND user_id = ?", [$id, $user_id]);
    if (!$existing) {
        errorResponse('Transação não encontrada ou acesso negado', 404);
    }
    
    try {
        // If this is just a status toggle
        if (isset($input['isPaid']) && count($input) <= 2) {
            $isPaid = $input['isPaid'];
            $status = $isPaid ? 'paid' : 'pending';
            
            $db->query("
                UPDATE transactions 
                SET is_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND user_id = ?
            ", [$isPaid, $status, $id, $user_id]);
            
            successResponse(null, 'Status da transação atualizado');
            return;
        }
        
        // Full update
        $errors = validateTransaction($input);
        if (!empty($errors)) {
            errorResponse(implode(', ', $errors));
        }
        
        $isPaid = $input['type'] === 'income' ? true : (!empty($input['isPaid']));
        $status = $isPaid ? 'paid' : 'pending';
        
        $db->query("
            UPDATE transactions 
            SET description = ?, amount = ?, type = ?, category = ?, payment_date = ?, is_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        ", [
            $input['description'],
            $input['amount'],
            $input['type'],
            $input['category'],
            $input['payment_date'],
            $isPaid,
            $status,
            $id,
            $user_id
        ]);
        
        successResponse(null, 'Transação atualizada com sucesso');
    } catch (Exception $e) {
        errorResponse('Erro ao atualizar transação: ' . $e->getMessage(), 500);
    }
}

function handleDelete($db) {
    if (empty($_GET['id'])) {
        errorResponse('ID da transação é obrigatório');
    }
    
    $id = $_GET['id'];
    $user_id = $_SESSION['user_id'];
    
    try {
        // Check if transaction exists and belongs to user
        $existing = $db->fetch("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [$id, $user_id]);
        if (!$existing) {
            errorResponse('Transação não encontrada ou acesso negado', 404);
        }
        
        $db->query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [$id, $user_id]);
        
        successResponse(null, 'Transação excluída com sucesso');
    } catch (Exception $e) {
        errorResponse('Erro ao excluir transação: ' . $e->getMessage(), 500);
    }
}

function handleMonthlyEvolution($db) {
    $user_id = $_SESSION['user_id'];
    
    try {
        $data = $db->fetchAll("
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                DATE_FORMAT(payment_date, '%b/%Y') as month_label,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
                SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
            FROM transactions 
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            AND user_id = ?
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ORDER BY month
        ", [$user_id]);
        
        // Format data for Chart.js with projection identification
        $currentMonth = date('Y-m');
        $formattedData = array_map(function($item) use ($currentMonth) {
            $isProjection = $item['month'] > $currentMonth;
            
            return [
                'month' => $item['month'],
                'month_label' => $item['month_label'],
                'income' => floatval($item['income']),
                'expenses' => floatval($item['expenses']),
                'balance' => floatval($item['balance']),
                'is_projection' => $isProjection
            ];
        }, $data);
        
        successResponse($formattedData);
    } catch (Exception $e) {
        errorResponse('Erro ao buscar evolução mensal: ' . $e->getMessage(), 500);
    }
}

function handleTrends($db) {
    $user_id = $_SESSION['user_id'];
    
    try {
        // Get last two months data
        $data = $db->fetchAll("
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
            FROM transactions 
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
            AND user_id = ?
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 2
        ", [$user_id]);
        
        $trends = ['income_trend' => 0, 'expense_trend' => 0];
        
        if (count($data) >= 2) {
            $current = $data[0];
            $previous = $data[1];
            
            if ($previous['income'] > 0) {
                $trends['income_trend'] = (($current['income'] - $previous['income']) / $previous['income']) * 100;
            }
            
            if ($previous['expenses'] > 0) {
                $trends['expense_trend'] = (($current['expenses'] - $previous['expenses']) / $previous['expenses']) * 100;
            }
        }
        
        successResponse($trends);
    } catch (Exception $e) {
        errorResponse('Erro ao calcular tendências: ' . $e->getMessage(), 500);
    }
}

function handleStats($db) {
    $user_id = $_SESSION['user_id'];
    
    try {
        $data = $db->fetch("
            SELECT 
                AVG(CASE WHEN type = 'income' THEN amount ELSE 0 END) as avg_income,
                AVG(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as avg_expense,
                COUNT(*) as total_transactions
            FROM transactions 
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            AND user_id = ?
        ", [$user_id]);
        
        $stats = [
            'avg_income' => floatval($data['avg_income'] ?? 0),
            'avg_expense' => floatval($data['avg_expense'] ?? 0),
            'total_transactions' => intval($data['total_transactions'] ?? 0)
        ];
        
        successResponse($stats);
    } catch (Exception $e) {
        errorResponse('Erro ao calcular estatísticas: ' . $e->getMessage(), 500);
    }
}
?>
