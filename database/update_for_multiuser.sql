-- Update database to support multiple users with individual data
-- Run this script to modify existing database

USE fik_liso;

-- Add user_id field to transactions table
ALTER TABLE transactions 
ADD COLUMN user_id INT(11) NOT NULL DEFAULT 1 AFTER id,
ADD CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD INDEX idx_user_id (user_id);

-- Create user ana.claudia if not exists
INSERT INTO users (username, password, is_admin, is_active) 
VALUES ('ana.claudia', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 1)
ON DUPLICATE KEY UPDATE username = username;

-- Get the user ID for ana.claudia
SET @ana_user_id = (SELECT id FROM users WHERE username = 'ana.claudia');

-- Update all existing transactions to belong to ana.claudia
UPDATE transactions SET user_id = @ana_user_id;

-- Also update budget_goals and user_preferences tables if they have data
-- Add user_id to budget_goals if not exists
ALTER TABLE budget_goals 
ADD COLUMN user_id INT(11) NOT NULL DEFAULT 1 AFTER id,
ADD CONSTRAINT fk_budget_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD INDEX idx_budget_user_id (user_id);

-- Update existing budget goals to belong to ana.claudia
UPDATE budget_goals SET user_id = @ana_user_id WHERE user_id = 1;

-- Update categories table to support per-user categories
ALTER TABLE categories 
ADD COLUMN user_id INT(11) NULL AFTER id,
ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD INDEX idx_categories_user_id (user_id);

-- Keep default categories as global (user_id = NULL) and create ana.claudia specific copies
INSERT INTO categories (user_id, name, type, color, icon, is_active)
SELECT @ana_user_id, name, type, color, icon, is_active 
FROM categories 
WHERE user_id IS NULL;
