import { NextRequest, NextResponse } from 'next/server';
import { db } from '@platform/database';
import { users } from '@platform/database/schema/identity';
import { eq } from 'drizzle-orm';
import { verifyToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = (await cookies()).get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const payload = await verifyToken(token);

        if (!payload || !payload.userId) {
            return NextResponse.json({ user: null });
        }

        // Fetch fresh user data
        const user = await db.query.users.findFirst({
            where: eq(users.id, payload.userId),
            columns: {
                id: true,
                email: true,
                status: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error('Auth Check Error:', error);
        return NextResponse.json({ user: null });
    }
}
