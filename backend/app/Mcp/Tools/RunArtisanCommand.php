<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Artisan;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Executes a given Laravel Artisan command and returns the text output.')]
class RunArtisanCommand extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        try {
            $command = $request->string('command')->value();
            Artisan::call($command);
            return Response::text(Artisan::output());
        } catch (\Exception $e) {
            return Response::text('Error executing command: ' . $e->getMessage());
        }
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\JsonSchema\Types\Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'command' => $schema->string()->description('The artisan command to run without "php artisan". Eg: "route:list" or "migrate:status".')->required(),
        ];
    }
}
