-- DuoPay Database Creation Script
-- Create database and tables for the financial management application

-- Create database
CREATE DATABASE IF NOT EXISTS fik_liso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fik_liso;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin)
INSERT INTO users (username, password, is_admin) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1)
ON DUPLICATE KEY UPDATE is_admin = 1;

-- Create transactions table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create categories table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default income categories
INSERT INTO categories (name, type, color, icon) VALUES 
('Salário', 'income', '#28a745', 'fas fa-money-bill-wave'),
('Freelance', 'income', '#17a2b8', 'fas fa-laptop-code'),
('Investimentos', 'income', '#ffc107', 'fas fa-chart-line'),
('Vendas', 'income', '#20c997', 'fas fa-store'),
('Outros', 'income', '#6c757d', 'fas fa-plus-circle');

-- Insert default expense categories
INSERT INTO categories (name, type, color, icon) VALUES 
('Alimentação', 'expense', '#dc3545', 'fas fa-utensils'),
('Transporte', 'expense', '#fd7e14', 'fas fa-car'),
('Moradia', 'expense', '#6f42c1', 'fas fa-home'),
('Saúde', 'expense', '#e83e8c', 'fas fa-heartbeat'),
('Educação', 'expense', '#0dcaf0', 'fas fa-graduation-cap'),
('Lazer', 'expense', '#198754', 'fas fa-gamepad'),
('Roupas', 'expense', '#795548', 'fas fa-tshirt'),
('Tecnologia', 'expense', '#607d8b', 'fas fa-laptop'),
('Contas', 'expense', '#ff5722', 'fas fa-file-invoice'),
('Outros', 'expense', '#6c757d', 'fas fa-ellipsis-h');

-- Create budget goals table (for future features)
CREATE TABLE IF NOT EXISTS budget_goals (
    id INT(11) NOT NULL AUTO_INCREMENT,
    category VARCHAR(100) NOT NULL,
    monthly_limit DECIMAL(10,2) NOT NULL,
    current_spent DECIMAL(10,2) DEFAULT 0.00,
    month_year VARCHAR(7) NOT NULL,  -- Format: YYYY-MM
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_category_month (category, month_year),
    INDEX idx_month_year (month_year),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user preferences table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default preferences
INSERT INTO user_preferences (preference_key, preference_value) VALUES 
('theme', 'light'),
('currency', 'BRL'),
('default_view', 'dashboard'),
('last_category_type', 'expense'),
('last_category', 'Outros');

-- Sample transactions for demonstration (optional)
INSERT INTO transactions (description, category, amount, type, payment_date, is_paid, status) VALUES 
('Salário Janeiro', 'Salário', 3500.00, 'income', '2025-01-05', TRUE, 'paid'),
('Supermercado', 'Alimentação', 450.00, 'expense', '2025-01-10', TRUE, 'paid'),
('Freelance Website', 'Freelance', 800.00, 'income', '2025-01-15', TRUE, 'paid'),
('Gasolina', 'Transporte', 120.00, 'expense', '2025-01-12', TRUE, 'paid'),
('Conta de Luz', 'Contas', 180.00, 'expense', '2025-01-20', FALSE, 'pending'),
('Aluguel', 'Moradia', 1200.00, 'expense', '2025-01-01', TRUE, 'paid'),
('Cinema', 'Lazer', 40.00, 'expense', '2025-01-18', TRUE, 'paid'),
('Farmácia', 'Saúde', 65.00, 'expense', '2025-01-22', TRUE, 'paid');

-- Create views for reporting
CREATE VIEW monthly_summary AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') as month_year,
    DATE_FORMAT(payment_date, '%M %Y') as month_label,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance,
    COUNT(*) as transaction_count
FROM transactions 
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month_year DESC;

CREATE VIEW category_summary AS
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
ORDER BY total_amount DESC;

-- Show creation summary
SELECT 'Database fik_liso created successfully!' as message;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'fik_liso';
SELECT COUNT(*) as total_transactions FROM transactions;
SELECT COUNT(*) as total_categories FROM categories;
