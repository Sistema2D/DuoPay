<?php
// Test users_api.php
session_start();

// Simulate admin session
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'admin';
$_SESSION['is_admin'] = 1;

echo "Testing users_api.php...\n";

// Simulate POST request for list_users
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

$testData = ['action' => 'list_users'];
$GLOBALS['HTTP_RAW_POST_DATA'] = json_encode($testData);

// Override file_get_contents for php://input
function file_get_contents_override($filename) {
    if ($filename === 'php://input') {
        return $GLOBALS['HTTP_RAW_POST_DATA'] ?? '';
    }
    return file_get_contents($filename);
}

// Capture output
ob_start();

try {
    // Mock file_get_contents
    if (!function_exists('file_get_contents_backup')) {
        function file_get_contents_backup($filename) {
            if ($filename === 'php://input') {
                return $GLOBALS['HTTP_RAW_POST_DATA'] ?? '';
            }
            return file_get_contents($filename);
        }
    }
    
    // Include the users_api.php
    include 'users_api.php';
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();
echo "API Response: " . $output . "\n";
?>
