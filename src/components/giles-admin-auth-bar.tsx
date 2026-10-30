'use client';

import React, { useEffect, useState } from 'react';
import { assetUrl } from '../lib/api';

export interface AdminUserSessionInfo {
    email: string;
    loginEmail?: string;
    name: string;
    role: string;
    fullRole?: string;
    phone?: string;
    hasCustomPassword?: boolean;
}

interface GilesAdminAuthBarProps {
    isLocked: boolean;
    onLockChange: (locked: boolean) => void;
}

const DEFAULT_DARIUS_USER: AdminUserSessionInfo = {
    email: 'darius@gilesinzinerija.com',
    loginEmail: 'darius@gilesinzinerija.com',
    name: 'Darius Šauklys',
    role: 'Super Admin',
    fullRole: 'Vykdantysis direktorius / vyr. inžinierius (Super Admin)',
    phone: '+370 693 97098',
};

export function GilesAdminAuthBar({ isLocked, onLockChange }: GilesAdminAuthBarProps) {
    const [authenticated, setAuthenticated] = useState<boolean>(true);
    const [user, setUser] = useState<AdminUserSessionInfo>(DEFAULT_DARIUS_USER);
    const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
    const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

    // Login state
    const [loginEmail, setLoginEmail] = useState<string>('darius@gilesinzinerija.com');
    const [loginPassword, setLoginPassword] = useState<string>('');
    const [loginError, setLoginError] = useState<string>('');
    const [loginSuccess, setLoginSuccess] = useState<string>('');
    const [loginLoading, setLoginLoading] = useState<boolean>(false);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [pwError, setPwError] = useState<string>('');
    const [pwSuccess, setPwSuccess] = useState<string>('');
    const [pwLoading, setPwLoading] = useState<boolean>(false);

    useEffect(() => {
        const params =
            typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search)
                : null;
        const forceLoginGate = params?.get('login') === '1';
        const isNonLocalhostPublicHost =
            typeof window !== 'undefined' &&
            window.location.hostname !== '127.0.0.1' &&
            window.location.hostname !== 'localhost';

        if (isNonLocalhostPublicHost || forceLoginGate) {
            setAuthenticated(false);
            setShowLoginModal(true);
            onLockChange(true);
        }

        fetch(assetUrl('/api/admin/auth'))
            .then((r) => r.json())
            .then((data) => {
                if (data?.user) {
                    setUser(data.user);
                }
                if (data?.authenticated) {
                    setAuthenticated(true);
                    if (forceLoginGate) {
                        setShowLoginModal(true);
                    } else {
                        setShowLoginModal(false);
                        onLockChange(false);
                    }
                } else {
                    setAuthenticated(false);
                    if (forceLoginGate || isNonLocalhostPublicHost) {
                        onLockChange(true);
                        setShowLoginModal(true);
                    }
                }
            })
            .catch(() => {
                if (isNonLocalhostPublicHost || forceLoginGate) {
                    setAuthenticated(false);
                    onLockChange(true);
                    setShowLoginModal(true);
                }
            });
    }, [onLockChange]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPasswordModal(false);
                if (!isLocked) {
                    setShowLoginModal(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLocked]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setLoginSuccess('');
        setLoginLoading(true);

        try {
            const res = await fetch(assetUrl('/api/admin/auth'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email: loginEmail.trim(),
                    password: loginPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data?.ok) {
                setLoginError(
                    data?.error || 'Neteisingas el. paštas arba slaptažodis.',
                );
                setLoginLoading(false);
                return;
            }
            if (data.user) {
                setUser(data.user);
            }
            setAuthenticated(true);
            setLoginPassword('');
            setLoginSuccess('Sėkmingai prisijungta prie Gilės Admin OS.');
            onLockChange(false);
            setShowLoginModal(false);
        } catch {
            setLoginError('Nepavyko susisiekti su autentifikavimo serveriu.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (newPassword.trim().length < 6) {
            setPwError('Naujas slaptažodis turi būti bent 6 simbolių ilgio.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('Naujas slaptažodis ir pakartotas slaptažodis nesutampa.');
            return;
        }

        setPwLoading(true);
        try {
            const res = await fetch(assetUrl('/api/admin/auth'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'change_password',
                    email: user.email || 'darius@gilesinzinerija.com',
                    currentPassword,
                    newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data?.ok) {
                setPwError(data?.error || 'Nepavyko pakeisti slaptažodžio.');
                setPwLoading(false);
                return;
            }
            if (data.user) {
                setUser(data.user);
            }
            setAuthenticated(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPwSuccess(data.message || 'Slaptažodis sėkmingai pakeistas');
        } catch {
            setPwError('Ryšio klaida keičiant slaptažodį.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleLogoutAndLock = async () => {
        setLoginError('');
        setLoginSuccess('');
        try {
            await fetch(assetUrl('/api/admin/auth'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
            });
        } catch {
            // proceed with client lock
        }
        setAuthenticated(false);
        setShowPasswordModal(false);
        setShowLoginModal(true);
        onLockChange(true);
    };

    return (
        <div data-testid="admin-auth-bar" className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#FF8A3D]">
                        UAB „Gilės inžinerija“ · „Skaita“ ERP
                    </span>
                    <span className="text-[#C9D0D8]">
                        {user.name} (<strong className="text-white">{user.email}</strong> ·{' '}
                        {user.role})
                    </span>
                    <span
                        data-testid="admin-auth-status-badge"
                        className="text-[#C9D0D8]"
                    >
                        {authenticated && !isLocked
                            ? 'Sesija aktyvi'
                            : 'El. pašto ir slaptažodžio patikra'}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        data-testid="admin-open-login-btn"
                        onClick={() => {
                            setShowPasswordModal(false);
                            setShowLoginModal((prev) => !prev);
                        }}
                        className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2C3742] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white bg-transparent whitespace-nowrap transition-colors"
                    >
                        Prisijungti ({user.email})
                    </button>
                    <button
                        type="button"
                        data-testid="admin-change-password-btn"
                        onClick={() => {
                            setPwError('');
                            setPwSuccess('');
                            setShowLoginModal(false);
                            setShowPasswordModal((prev) => !prev);
                        }}
                        className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2C3742] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white bg-transparent whitespace-nowrap transition-colors"
                    >
                        Keisti slaptažodį
                    </button>
                    <button
                        type="button"
                        data-testid="admin-logout-btn"
                        onClick={handleLogoutAndLock}
                        className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2C3742] text-[#C9D0D8] hover:border-[#FF8A3D] hover:text-white bg-transparent whitespace-nowrap transition-colors"
                    >
                        Atsijungti
                    </button>
                </div>
            </div>

            {loginSuccess && !showLoginModal && !isLocked && (
                <p
                    data-testid="admin-login-banner-feedback"
                    className="text-xs font-semibold text-[#6EE7B7]"
                >
                    {loginSuccess}
                </p>
            )}

            {(showLoginModal || isLocked) && (
                <div data-testid="admin-login-gate">
                    <form
                        onSubmit={handleLoginSubmit}
                        data-testid="admin-login-modal"
                        className="border-t border-[#2C3742] pt-3 space-y-3"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-white">
                                Gilės Admin OS Prisijungimo Vartai
                            </h2>
                            <p className="text-xs text-[#C9D0D8]">
                                Vykdančiojo direktoriaus paskyra: darius@gilesinzinerija.com (arba darius@gilesinzinerija.lt)
                            </p>
                        </div>
                        {!isLocked && (
                            <button
                                type="button"
                                onClick={() => setShowLoginModal(false)}
                                className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2C3742] text-[#C9D0D8] hover:text-white bg-transparent"
                            >
                                Uždaryti
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                        <label className="block space-y-1 text-xs text-[#C9D0D8]">
                            <span>El. paštas</span>
                            <input
                                type="email"
                                required
                                data-testid="admin-login-email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="darius@gilesinzinerija.com"
                                className="w-full h-10 px-3 rounded-lg bg-[#1B232C] border border-[#2C3742] text-white text-xs focus:outline-none focus:border-[#FF8A3D]"
                            />
                        </label>

                        <label className="block space-y-1 text-xs text-[#C9D0D8]">
                            <span>Slaptažodis</span>
                            <input
                                type="password"
                                required
                                data-testid="admin-login-password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="Įveskite administratoriaus slaptažodį"
                                className="w-full h-10 px-3 rounded-lg bg-[#1B232C] border border-[#2C3742] text-white text-xs focus:outline-none focus:border-[#FF8A3D]"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loginLoading}
                            data-testid="admin-login-submit-btn"
                            className="h-10 px-4 rounded-lg text-xs font-bold cursor-pointer border border-[#FF8A3D] text-[#FF8A3D] hover:text-white bg-transparent whitespace-nowrap transition-colors"
                        >
                            {loginLoading
                                ? 'Tikrinama...'
                                : 'Prisijungti prie Gilės Admin OS'}
                        </button>
                    </div>

                    {loginError && (
                        <p
                            data-testid="admin-login-error"
                            className="text-xs font-semibold text-[#FCA5A5]"
                        >
                            {loginError}
                        </p>
                    )}
                    </form>
                </div>
            )}

            {showPasswordModal && (
                <form
                    onSubmit={handlePasswordChangeSubmit}
                    data-testid="admin-change-password-modal"
                    className="border-t border-[#2C3742] pt-3 space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-white">
                                Keisti administratoriaus slaptažodį ({user.email})
                            </h2>
                            <p className="text-xs text-[#C9D0D8]">
                                Naujas slaptažodis išsaugomas SHA-256 maišos (hash) formatu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(false)}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2C3742] text-[#C9D0D8] hover:text-white bg-transparent"
                        >
                            Uždaryti
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                        <label className="block space-y-1 text-xs text-[#C9D0D8]">
                            <span>Dabartinis slaptažodis</span>
                            <input
                                type="password"
                                required
                                data-testid="admin-current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Dabartinis slaptažodis"
                                className="w-full h-10 px-3 rounded-lg bg-[#1B232C] border border-[#2C3742] text-white text-xs focus:outline-none focus:border-[#FF8A3D]"
                            />
                        </label>

                        <label className="block space-y-1 text-xs text-[#C9D0D8]">
                            <span>Naujas slaptažodis</span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                data-testid="admin-new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 simboliai"
                                className="w-full h-10 px-3 rounded-lg bg-[#1B232C] border border-[#2C3742] text-white text-xs focus:outline-none focus:border-[#FF8A3D]"
                            />
                        </label>

                        <label className="block space-y-1 text-xs text-[#C9D0D8]">
                            <span>Pakartokite naują slaptažodį</span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                data-testid="admin-confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Pakartokite slaptažodį"
                                className="w-full h-10 px-3 rounded-lg bg-[#1B232C] border border-[#2C3742] text-white text-xs focus:outline-none focus:border-[#FF8A3D]"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={pwLoading}
                            data-testid="admin-save-password-btn"
                            className="h-10 px-4 rounded-lg text-xs font-bold cursor-pointer border border-[#FF8A3D] text-[#FF8A3D] hover:text-white bg-transparent whitespace-nowrap transition-colors"
                        >
                            {pwLoading
                                ? 'Saugoma...'
                                : 'Išsaugoti naują slaptažodį'}
                        </button>
                    </div>

                    {pwError && (
                        <p
                            data-testid="admin-password-change-error"
                            className="text-xs font-semibold text-[#FCA5A5]"
                        >
                            {pwError}
                        </p>
                    )}
                    {pwSuccess && (
                        <p
                            data-testid="admin-password-change-feedback"
                            className="text-xs font-semibold text-[#6EE7B7]"
                        >
                            {pwSuccess}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}
