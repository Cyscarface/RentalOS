<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Artisan;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Clears the application cache, route cache, config cache, and view cache.')]
class ClearCache extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        Artisan::call('optimize:clear');
        return Response::text(Artisan::output());
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
