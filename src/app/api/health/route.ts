import { NextResponse } from 'next/server';

/**
 * Storefront Health Check Endpoint
 */

export async function GET() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(health, { status: 200 });
}

export async function HEAD() {
    return new Response(null, { status: 200 });
}
