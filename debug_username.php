<?php
// Debug the username validation
$username = 'ana.claudia';
$pattern = '/^[a-zA-Z0-9._-]+$/';

echo "Testing username: '$username'\n";
echo "Pattern: '$pattern'\n";
echo "Match result: " . (preg_match($pattern, $username) ? 'PASS' : 'FAIL') . "\n";

if (!preg_match($pattern, $username)) {
    echo "Username validation FAILED\n";
} else {
    echo "Username validation PASSED\n";
}

// Test other validations
echo "Length check: " . (strlen($username) >= 3 ? 'PASS' : 'FAIL') . "\n";
echo "Password test: " . (strlen('Aninha97!') >= 4 ? 'PASS' : 'FAIL') . "\n";
?>
