<?php

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// If the URI is targeting /storage, map it to the physical path.
// This bypasses the Windows symlink bug.
if (str_starts_with($uri, '/storage/')) {
    $realPath = __DIR__ . '/storage/app/public/' . substr($uri, 9);
    if (file_exists($realPath) && is_file($realPath)) {
        header('Content-Type: ' . mime_content_type($realPath));
        readfile($realPath);
        exit;
    }
}

// Emulate Apache's "mod_rewrite" functionality.
$publicPath = __DIR__.'/public'.$uri;
if ($uri !== '/' && file_exists($publicPath) && is_file($publicPath)) {
    return false;
}

require_once __DIR__.'/public/index.php';
