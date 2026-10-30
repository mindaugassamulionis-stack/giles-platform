import { NextRequest, NextResponse } from 'next/server';
import {
    buildCatalogFeedItems,
    formatCatalogFeedXml,
    queryAdReadyFeedRows,
} from '../../../lib/catalog-feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const formatParam = (request.nextUrl.searchParams.get('format') || '').toLowerCase();
    const limitParam = Number.parseInt(request.nextUrl.searchParams.get('limit') || '500', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 2000) : 500;

    const rows = await queryAdReadyFeedRows(limit);
    const storeDomain = rows[0]?.store_domain || process.env.STORE_PUBLIC_DOMAIN || '92-5-163-199.sslip.io';
    const items = buildCatalogFeedItems(rows, storeDomain);

    const accept = (request.headers.get('accept') || '').toLowerCase();
    const isXmlPath = request.nextUrl.pathname.endsWith('.xml');
    const wantsJson =
        formatParam === 'json' ||
        (formatParam !== 'xml' && !isXmlPath && accept.includes('application/json'));

    if (wantsJson) {
        return NextResponse.json(items, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=300',
                'X-Feed-Count': String(items.length),
            },
        });
    }

    const xml = formatCatalogFeedXml(items, storeDomain);
    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'X-Feed-Count': String(items.length),
        },
    });
}
