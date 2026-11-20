<?php
/**
 * FlamePay Production Entrypoint for Hostinger
 * Directly serves public/index.html or forwards clean URLs
 */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri = trim($uri, '/');

// Redirect /hi to root
if ($uri === 'hi' || strpos($uri, 'hi/') === 0) {
    header('Location: /', true, 301);
    exit;
}

if ($uri === 'admin' || strpos($uri, 'admin/') === 0) {
    $adminFile = __DIR__ . '/public/admin.html';
    if (file_exists($adminFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($adminFile);
        exit;
    }
}

if (empty($uri) || $uri === 'index' || $uri === 'index.html') {
    $indexFile = __DIR__ . '/public/index.html';
    if (file_exists($indexFile)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexFile);
        exit;
    }
}

// Clean HTML page check (e.g. contact, about, bill-payment)
$htmlCandidate = __DIR__ . '/public/' . $uri . '.html';
if (file_exists($htmlCandidate)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($htmlCandidate);
    exit;
}

// Direct static file check
$staticCandidate = __DIR__ . '/public/' . $uri;
if (file_exists($staticCandidate) && is_file($staticCandidate)) {
    $ext = pathinfo($staticCandidate, PATHINFO_EXTENSION);
    $mimes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'json' => 'application/json',
        'woff2' => 'font/woff2'
    ];
    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
    readfile($staticCandidate);
    exit;
}

// Default fallback to index.html
$indexFile = __DIR__ . '/public/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexFile);
    exit;
}

echo "FlamePay Production Server Active";
?>
