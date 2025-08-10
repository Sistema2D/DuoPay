<?php
/**
 * Database Setup Script for DuoPay
 * This script creates the database and tables needed for the application
 */

// Database connection parameters
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'fik_liso';

try {
    // First, connect without specifying database to create it
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "<h2>🚀 DuoPay Database Setup</h2>";
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p>✅ Database '$database' created successfully!</p>";
    
    // Connect to the created database
    $pdo->exec("USE $database");
    
    // Create transactions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id INT(11) NOT NULL AUTO_INCREMENT,
            description VARCHAR(500) NOT NULL,
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type ENUM('income', 'expense') NOT NULL,
            payment_date DATE NOT NULL,
            is_paid BOOLEAN DEFAULT TRUE,
            status ENUM('paid', 'pending') DEFAULT 'paid',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_payment_date (payment_date),
            INDEX idx_type (type),
            INDEX idx_category (category),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Table 'transactions' created successfully!</p>";
    
    // Create categories table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INT(11) NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            type ENUM('income', 'expense') NOT NULL,
            color VARCHAR(7) DEFAULT '#007bff',
            icon VARCHAR(50) DEFAULT 'fas fa-circle',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_category_type (name, type),
            INDEX idx_type (type),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Table 'categories' created successfully!</p>";
    
    // Create user_preferences table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT(11) NOT NULL AUTO_INCREMENT,
            preference_key VARCHAR(100) NOT NULL,
            preference_value TEXT,
            user_id VARCHAR(50) DEFAULT 'default',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_user_preference (user_id, preference_key),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Table 'user_preferences' created successfully!</p>";
    
    // Check if categories already exist
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories");
    $categoryCount = $stmt->fetch()['count'];
    
    if ($categoryCount == 0) {
        // Insert default income categories
        $incomeCategories = [
            ['Salário', '#28a745', 'fas fa-money-bill-wave'],
            ['Freelance', '#17a2b8', 'fas fa-laptop-code'],
            ['Investimentos', '#ffc107', 'fas fa-chart-line'],
            ['Vendas', '#20c997', 'fas fa-store'],
            ['Outros', '#6c757d', 'fas fa-plus-circle']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO categories (name, type, color, icon) VALUES (?, 'income', ?, ?)");
        foreach ($incomeCategories as $category) {
            $stmt->execute($category);
        }
        
        // Insert default expense categories
        $expenseCategories = [
            ['Alimentação', '#dc3545', 'fas fa-utensils'],
            ['Transporte', '#fd7e14', 'fas fa-car'],
            ['Moradia', '#6f42c1', 'fas fa-home'],
            ['Saúde', '#e83e8c', 'fas fa-heartbeat'],
            ['Educação', '#0dcaf0', 'fas fa-graduation-cap'],
            ['Lazer', '#198754', 'fas fa-gamepad'],
            ['Roupas', '#795548', 'fas fa-tshirt'],
            ['Tecnologia', '#607d8b', 'fas fa-laptop'],
            ['Contas', '#ff5722', 'fas fa-file-invoice'],
            ['Outros', '#6c757d', 'fas fa-ellipsis-h']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO categories (name, type, color, icon) VALUES (?, 'expense', ?, ?)");
        foreach ($expenseCategories as $category) {
            $stmt->execute($category);
        }
        
        echo "<p>✅ Default categories inserted successfully!</p>";
    } else {
        echo "<p>ℹ️ Categories already exist ($categoryCount found)</p>";
    }
    
    // Check if preferences already exist
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_preferences");
    $prefCount = $stmt->fetch()['count'];
    
    if ($prefCount == 0) {
        // Insert default preferences
        $preferences = [
            ['theme', 'light'],
            ['currency', 'BRL'],
            ['default_view', 'dashboard'],
            ['last_category_type', 'expense'],
            ['last_category', 'Outros']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO user_preferences (preference_key, preference_value) VALUES (?, ?)");
        foreach ($preferences as $pref) {
            $stmt->execute($pref);
        }
        
        echo "<p>✅ Default preferences inserted successfully!</p>";
    } else {
        echo "<p>ℹ️ User preferences already exist ($prefCount found)</p>";
    }
    
    // Insert sample transactions for demonstration
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM transactions");
    $transactionCount = $stmt->fetch()['count'];
    
    if ($transactionCount == 0) {
        $sampleTransactions = [
            ['Salário Janeiro', 'Salário', 3500.00, 'income', '2025-01-05', 1, 'paid'],
            ['Supermercado', 'Alimentação', 450.00, 'expense', '2025-01-10', 1, 'paid'],
            ['Freelance Website', 'Freelance', 800.00, 'income', '2025-01-15', 1, 'paid'],
            ['Gasolina', 'Transporte', 120.00, 'expense', '2025-01-12', 1, 'paid'],
            ['Conta de Luz', 'Contas', 180.00, 'expense', '2025-01-20', 0, 'pending'],
            ['Aluguel', 'Moradia', 1200.00, 'expense', '2025-01-01', 1, 'paid'],
            ['Cinema', 'Lazer', 40.00, 'expense', '2025-01-18', 1, 'paid'],
            ['Farmácia', 'Saúde', 65.00, 'expense', '2025-01-22', 1, 'paid']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO transactions (description, category, amount, type, payment_date, is_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($sampleTransactions as $transaction) {
            $stmt->execute($transaction);
        }
        
        echo "<p>✅ Sample transactions inserted successfully!</p>";
    } else {
        echo "<p>ℹ️ Transactions already exist ($transactionCount found)</p>";
    }
    
    // Create useful views
    $pdo->exec("
        CREATE OR REPLACE VIEW monthly_summary AS
        SELECT 
            DATE_FORMAT(payment_date, '%Y-%m') as month_year,
            DATE_FORMAT(payment_date, '%M %Y') as month_label,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance,
            COUNT(*) as transaction_count
        FROM transactions 
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ORDER BY month_year DESC
    ");
    
    $pdo->exec("
        CREATE OR REPLACE VIEW category_summary AS
        SELECT 
            category,
            type,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            MIN(amount) as min_amount,
            MAX(amount) as max_amount
        FROM transactions 
        GROUP BY category, type
        ORDER BY total_amount DESC
    ");
    
    echo "<p>✅ Database views created successfully!</p>";
    
    // Show final statistics
    $stmt = $pdo->query("
        SELECT 
            (SELECT COUNT(*) FROM transactions) as total_transactions,
            (SELECT COUNT(*) FROM categories) as total_categories,
            (SELECT COUNT(*) FROM user_preferences) as total_preferences
    ");
    $stats = $stmt->fetch();
    
    echo "<div style='background: #e8f5e8; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;'>";
    echo "<h3>📊 Database Statistics</h3>";
    echo "<ul>";
    echo "<li><strong>Transactions:</strong> {$stats['total_transactions']}</li>";
    echo "<li><strong>Categories:</strong> {$stats['total_categories']}</li>";
    echo "<li><strong>Preferences:</strong> {$stats['total_preferences']}</li>";
    echo "</ul>";
    echo "</div>";
    
    echo "<div style='background: #d4edda; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; border: 1px solid #c3e6cb;'>";
    echo "<h3>🎉 Setup Complete!</h3>";
    echo "<p>Your DuoPay database has been successfully set up and is ready to use!</p>";
    echo "<p><strong>Next steps:</strong></p>";
    echo "<ul>";
    echo "<li>Your application should now be able to connect to the database</li>";
    echo "<li>Visit your application at: <a href='../index.html' target='_blank'>http://localhost/anaehugo</a></li>";
    echo "<li>Start managing your finances with the sample data or add your own transactions</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div style='background: #f8d7da; padding: 1rem; border-radius: 0.5rem; border: 1px solid #f5c6cb;'>";
    echo "<h3>❌ Database Setup Error</h3>";
    echo "<p><strong>Error:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>Please check:</strong></p>";
    echo "<ul>";
    echo "<li>XAMPP is running</li>";
    echo "<li>MySQL service is started</li>";
    echo "<li>Database credentials are correct</li>";
    echo "</ul>";
    echo "</div>";
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>DuoPay Database Setup</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 0.5rem; }
        p { margin: 0.5rem 0; }
        a { color: #0d6efd; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <!-- PHP output will be displayed here -->
    </div>
</body>
</html>
