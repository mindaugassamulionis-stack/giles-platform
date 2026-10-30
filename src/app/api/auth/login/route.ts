import { NextRequest, NextResponse } from 'next/server';
import { db } from '@platform/database';
import { users } from '@platform/database/schema/identity';
import { eq } from 'drizzle-orm';
import { verifyPassword, signToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Find user
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, existingUser.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Sign token
        const token = await signToken({
            userId: existingUser.id,
            email: existingUser.email,
        });

        // Set Cookie
        (await cookies()).set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: existingUser.id,
                email: existingUser.email,
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
