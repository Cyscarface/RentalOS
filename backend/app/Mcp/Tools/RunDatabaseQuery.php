<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Run a raw SQL query against the database and return the results as a JSON string.')]
class RunDatabaseQuery extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        try {
            $query = $request->string('query')->value();
            $results = DB::select($query);
            return Response::text(json_encode($results, JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            return Response::text('Error executing query: ' . $e->getMessage());
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
            'query' => $schema->string()->description('The RAW SQL query to execute.')->required(),
        ];
    }
}
