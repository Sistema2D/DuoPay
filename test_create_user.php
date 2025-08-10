<?php
// Test user creation directly
require_once 'config.php';
session_start();

// Simulate admin session
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'admin';
$_SESSION['is_admin'] = 1;

try {
    $db = initializeDatabase();
    
    $testData = [
        'action' => 'create_user',
        'username' => 'ana.claudia',
        'password' => 'Aninha97!',
        'is_admin' => true
    ];
    
    echo "Testing user creation with data:\n";
    print_r($testData);
    
    // Call the function directly
    include_once 'users_api.php';
    
    // This will be called via the switch statement
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
