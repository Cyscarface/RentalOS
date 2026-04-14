<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Evaluates arbitrary PHP code within the Laravel application context. Useful for interacting with Eloquent models or testing specific application logic. DO NOT wrap with <?php tags.')]
class EvaluatePhp extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): Response
    {
        try {
            $code = $request->string('code')->value();

            // Capture output buffer in case of echo/print
            ob_start();
            
            // Evaluate the code
            $result = eval($code);
            
            $output = ob_get_clean();

            $response = [];
            if (!empty($output)) {
                $response['output'] = $output;
            }
            if ($result !== null) {
                // Return result, handle objects gracefully
                if (is_object($result) && method_exists($result, 'toArray')) {
                    $response['result'] = $result->toArray();
                } else if (is_object($result) && method_exists($result, 'toJson')) {
                    $response['result'] = json_decode($result->toJson(), true);
                } else {
                    $response['result'] = $result;
                }
            }
            
            if (empty($response)) {
                 $response = ['status' => 'Code executed successfully with no return value.'];
            }

            return Response::text(json_encode($response, JSON_PRETTY_PRINT));
        } catch (\Throwable $e) {
            return Response::text('Error evaluating code: ' . $e->getMessage());
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
            'code' => $schema->string()->description('The PHP code to evaluate. Example: "return \App\Models\User::first();"')->required(),
        ];
    }
}
