<?php

namespace App\Mcp\Servers;

use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;
use App\Mcp\Tools\ClearCache;
use App\Mcp\Tools\EvaluatePhp;
use App\Mcp\Tools\RunArtisanCommand;
use App\Mcp\Tools\RunDatabaseQuery;
use App\Mcp\Resources\LaravelLog;

#[Name('Rental Os')]
#[Version('0.0.1')]
#[Instructions('This server provides access to the RentalOS application for debugging, database querying, and code execution.')]
class RentalOs extends Server
{
    protected array $tools = [
        ClearCache::class,
        EvaluatePhp::class,
        RunArtisanCommand::class,
        RunDatabaseQuery::class,
    ];

    protected array $resources = [
        LaravelLog::class,
    ];

    protected array $prompts = [
        //
    ];
}
