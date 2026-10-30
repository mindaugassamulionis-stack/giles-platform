'use client';

import { useState } from 'react';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { changePassword } from '../../app/[locale]/account/actions';
import { useTranslations } from 'next-intl';

export function SecuritySettings() {
    const t = useTranslations();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '' });
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const data = new FormData();
        data.append('currentPassword', formData.currentPassword);
        data.append('newPassword', formData.newPassword);

        const res = await changePassword(data);
        setLoading(false);

        if (res?.success) {
            setMessage({ type: 'success', text: 'Slaptažodis sėkmingai pakeistas' });
            setFormData({ currentPassword: '', newPassword: '' });
            setIsEditing(false);
        } else {
            setMessage({ type: 'error', text: res?.error || 'Klaida keičiant slaptažodį' });
        }
    };

    if (!isEditing) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-bold">{t('accountSecurity.title')}</h2>
                        <p className="text-sm text-zinc-500">{t('accountSecurity.changeTitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-medium text-emerald-600 hover:underline"
                >
                    {t('accountSecurity.change')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-lg relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="font-display text-xl font-bold">{t('accountSecurity.change')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('accountSecurity.current')}</label>
                    <input
                        type="password"
                        required
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.currentPassword}
                        onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t('accountSecurity.new')}</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.newPassword}
                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => { setIsEditing(false); setMessage(null); }}
                        className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        {t('accountSecurity.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4" />}
                        Atnaujinti
                    </button>
                </div>
            </form>
        </div>
    );
}
