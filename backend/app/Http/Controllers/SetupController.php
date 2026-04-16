<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SetupController extends Controller
{
    /**
     * Setup endpoint to seed demo accounts
     * 
     * This endpoint should only be accessible in development or with a secret key
     */
    public function seed(Request $request): JsonResponse
    {
        // Security: require a setup token in production
        if (app()->environment('production')) {
            $setupToken = $request->header('X-Setup-Token');
            $expectedToken = env('SETUP_TOKEN');
            
            if (!$setupToken || $setupToken !== $expectedToken) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }
        }

        try {
            \Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
            
            return response()->json([
                'message' => 'Database setup completed successfully',
                'output' => \Artisan::output()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Setup failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
