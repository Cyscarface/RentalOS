<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Windows PHP Dev Server Symlink Workaround:
// `php -S` often fails with 403 Forbidden on symlinks, so we manually serve them here.
if (app()->environment('local')) {
    Route::get('storage/{path}', function (string $path) {
        $realPath = storage_path('app/public/' . $path);
        
        if (!file_exists($realPath)) {
            abort(404);
        }

        $mime = mime_content_type($realPath);
        return response()->file($realPath, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000'
        ]);
    })->where('path', '.*');
}
