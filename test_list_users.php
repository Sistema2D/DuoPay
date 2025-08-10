<?php
// Test users_api.php list_users endpoint
session_start();

// Simulate admin session
$_SESSION['user_id'] = 1;
$_SESSION['username'] = 'admin';
$_SESSION['is_admin'] = 1;

echo "Testing list_users endpoint...\n\n";

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

$testData = ['action' => 'list_users'];
$GLOBALS['HTTP_RAW_POST_DATA'] = json_encode($testData);

// Capture output
ob_start();
ob_implicit_flush(false);

try {
    include 'users_api.php';
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();
echo "API Response:\n" . $output . "\n";

// Parse and validate JSON
if ($output) {
    $response = json_decode($output, true);
    if ($response) {
        echo "\nParsed Response:\n";
        print_r($response);
        
        if (isset($response['users'])) {
            echo "\nUsers array found with " . count($response['users']) . " users\n";
        } else {
            echo "\nNo 'users' key in response\n";
        }
    } else {
        echo "\nFailed to parse JSON response\n";
    }
}
?>
