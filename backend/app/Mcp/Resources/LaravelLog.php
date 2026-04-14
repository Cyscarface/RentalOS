<?php

namespace App\Mcp\Resources;

use Illuminate\Support\Facades\File;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Resource;

#[Description('Reads the contents of the main laravel.log file.')]
class LaravelLog extends Resource
{
    /**
     * Handle the resource request.
     */
    public function handle(Request $request): Response
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!File::exists($logPath)) {
            return Response::text('The log file does not exist.');
        }

        $content = File::get($logPath);
        
        // Truncate to the last 50,000 characters if it's too large
        if (strlen($content) > 50000) {
            $content = substr($content, -50000);
            $content = "[TRUNCATED - Showing Last 50000 characters]\n" . $content;
        }

        return Response::text($content);
    }
}
