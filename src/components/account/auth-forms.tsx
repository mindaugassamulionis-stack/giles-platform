'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogIn, Lock, Mail, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AuthForms() {
    const t = useTranslations();
    const router = useRouter();
    const [authView, setAuthView] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        try {
            const endpoint = authView === 'login' ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Success
            setFormData({ email: '', password: '' });
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 className="font-display text-3xl font-bold mb-2">
                            {authView === 'login' ? 'Sveiki sugrįžę' : 'Sukurti paskyrą'}
                        </h1>
                        <p className="text-muted-foreground">
                            {authView === 'login'
                                ? 'Prisijunkite prie savo Gilės Inžinerija paskyros'
                                : 'Prisijunkite prie mokslo paremtos sveikatos bendruomenės'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">{t('contactPage.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                        placeholder="vardas@pavyzdys.lt"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">{t('auth.password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                {formLoading ? (
                                    <Loader2 className="w-5 h-5" />
                                ) : (
                                    <>
                                        {authView === 'login' ? <LogIn className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        {authView === 'login' ? t('nav.login') : t('nav.register')}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-zinc-500">
                            {authView === 'login' ? (
                                <>
                                    Neturite paskyros?{' '}
                                    <button
                                        onClick={() => { setAuthView('register'); setError(null); }}
                                        className="text-emerald-600 font-semibold hover:underline"
                                    >
                                        {t('nav.register')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    Jau turite paskyrą?{' '}
                                    <button
                                        onClick={() => { setAuthView('login'); setError(null); }}
                                        className="text-emerald-600 font-semibold hover:underline"
                                    >
                                        {t('nav.login')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
