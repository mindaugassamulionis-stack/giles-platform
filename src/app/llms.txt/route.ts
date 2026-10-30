import { NextResponse } from 'next/server';
import { buildLlmsTxt } from '../../lib/seo-geo-authority';

export async function GET() {
    const body = buildLlmsTxt();
    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
