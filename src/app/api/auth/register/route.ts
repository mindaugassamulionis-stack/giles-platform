import { NextRequest, NextResponse } from 'next/server';
import { db } from '@platform/database';
import { users } from '@platform/database/schema/identity';
import { eq } from 'drizzle-orm';
import { hashPassword, signToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password too short' }, { status: 400 });
        }

        // Check duplicates
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            status: 'active',
        }).returning();

        // Auto login
        const token = await signToken({
            userId: newUser.id,
            email: newUser.email,
        });

        (await cookies()).set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
            }
        });

    } catch (error: any) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
