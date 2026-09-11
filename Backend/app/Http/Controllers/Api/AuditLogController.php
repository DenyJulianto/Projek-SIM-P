<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = Activity::query()
            ->with('causer:id,name')
            ->when($request->filled('user_id'), fn ($q) => $q->where('causer_id', $request->integer('user_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('from')))
            ->when($request->filled('until'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('until')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where('description', 'like', "%{$search}%");
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($logs);
    }
}
