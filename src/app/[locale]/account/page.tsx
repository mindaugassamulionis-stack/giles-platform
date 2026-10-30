import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, MapPin, User as UserIcon, LogOut } from 'lucide-react';
import { verifyToken } from '../../../lib/auth';
import { db, users } from '@platform/database';
import { eq } from 'drizzle-orm';
import { AuthForms } from '../../../components/account/auth-forms';
import { AddressBook } from '../../../components/account/address-book';
import { SecuritySettings } from '../../../components/account/security-settings';
import { CancellationPanel } from '../../../components/account/cancellation-panel';
import { isGermanCustomer } from '../../../lib/geo';
import { getTranslations } from 'next-intl/server';


// Force dynamic behavior (no caching of user data)
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
    const t = await getTranslations();
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
        return <AuthForms />;
    }

    // Fetch User and Addresses
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        with: {
            addresses: true,
        },
    });

    if (!user) {
        // Token valid but user gone?
        return <AuthForms />;
    }

    // BGB §356a geo-legal injection: German customers get the compliant
    // "Kündigen" cancellation flow. Country is resolved by middleware
    // (x-geo-country header + geo-country cookie); other customers unaffected.
    const geoCountry =
        (await headers()).get('x-geo-country') || (await cookies()).get('geo-country')?.value || null;
    const showGermanCancellation = isGermanCustomer(geoCountry);

    // Logout Helper (Server Action wrapper or client component? We can use a simple form action)
    async function logoutAction() {
        'use server';
        (await cookies()).delete('auth-token');
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-zinc-900">{t('accountPage.title')}</h1>
                        <p className="text-zinc-500">Sveiki, {user.email}</p>
                    </div>

                    <form action={logoutAction}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            {t('accountPage.logout')}
                        </button>
                    </form>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Navigation / Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Orders Card */}
                        <Link href="/orders" className="block p-6 bg-white rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="font-bold text-lg mb-2">{t('accountPage.orders')}</h2>
                            <p className="text-sm text-zinc-500">
                                {t('accountPage.ordersDesc')}
                            </p>
                        </Link>

                        {/* Security Settings */}
                        <SecuritySettings />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Address Book */}
                        <AddressBook addresses={user.addresses || []} />

                        {/* BGB §356a: German cancellation ("Kündigen") flow */}
                        {showGermanCancellation && <CancellationPanel language="de" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
