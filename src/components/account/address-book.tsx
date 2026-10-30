'use client';

import { useState } from 'react';
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import { addAddress, deleteAddress } from '../../app/[locale]/account/actions';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Address {
    id: string;
    name: string;
    fullName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean | null;
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
    const t = useTranslations();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // Add Form State
    const [formData, setFormData] = useState({
        name: '',
        fullName: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'Lietuva'
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));

        const res = await addAddress(data);
        setLoading(false);
        if (res?.success) {
            setIsAdding(false);
            setFormData({ name: '', fullName: '', addressLine1: '', city: '', postalCode: '', country: 'Lietuva' });
        } else {
            alert('Failed to add address');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Ar tikrai norite pašalinti šį adresą?')) return;
        const res = await deleteAddress(id);
        if (!res?.success) alert('Failed to delete');
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="font-display text-xl font-bold">{t('addressBook.title')}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Address Cards */}
                {addresses.map((addr) => (
                    <div key={addr.id} className="p-4 rounded-xl border border-zinc-200 hover:border-emerald-500 transition-colors relative group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded text-xs uppercase tracking-wide">
                                {addr.name}
                            </span>
                            <button
                                onClick={() => handleDelete(addr.id)}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="font-medium text-zinc-900 mb-1">{addr.fullName}</p>
                        <p className="text-sm text-zinc-500">{addr.addressLine1}</p>
                        <p className="text-sm text-zinc-500">{addr.postalCode} {addr.city}</p>
                        <p className="text-sm text-zinc-500">{addr.country}</p>
                    </div>
                ))}

                {/* Add New Button (or Form) */}
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-zinc-400 hover:text-emerald-600 h-full min-h-[160px]"
                    >
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="font-medium">{t('addressBook.addNew')}</span>
                    </button>
                ) : (
                    <div className="col-span-1 md:col-span-2 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
                        <h3 className="font-bold mb-4">{t('addressBook.newAddress')}</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder={t('addressBook.label')}
                                    required
                                    className="p-2 rounded-lg border border-zinc-300 w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    placeholder={t('addressBook.recipient')}
                                    required
                                    className="p-2 rounded-lg border border-zinc-300 w-full"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <input
                                placeholder={t('addressBook.street')}
                                required
                                className="p-2 rounded-lg border border-zinc-300 w-full"
                                value={formData.addressLine1}
                                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                            />
                            <div className="grid grid-cols-3 gap-4">
                                <input
                                    placeholder={t('addressBook.city')}
                                    required
                                    className="col-span-1 p-2 rounded-lg border border-zinc-300 w-full"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                                <input
                                    placeholder={t('addressBook.postalCode')}
                                    required
                                    className="col-span-1 p-2 rounded-lg border border-zinc-300 w-full"
                                    value={formData.postalCode}
                                    onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                />
                                <input
                                    placeholder={t('addressBook.country')}
                                    readOnly
                                    className="col-span-1 p-2 rounded-lg border border-zinc-300 w-full bg-zinc-100 text-zinc-500"
                                    value={formData.country}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-zinc-600 hover:bg-zinc-200 rounded-lg"
                                >
                                    {t('accountSecurity.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4" />}
                                    Išsaugoti
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
