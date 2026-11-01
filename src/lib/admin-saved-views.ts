// W123-A1: Odoo-favorites style saved views for the admin product table (module 6).
// Pure functions + a storage seam so tests run without a real localStorage.

import { useCallback, useEffect, useState } from 'react';

export interface AdminProductFilters {
    query: string;
    brand: string;
    stock: string;
    priceMin: number | null;
    priceMax: number | null;
}

export interface AdminSavedView {
    id: string;
    name: string;
    filters: AdminProductFilters;
    isDefault: boolean;
    createdAt: string;
}

export interface AdminSavedViewStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export const SAVED_VIEWS_STORAGE_KEY = 'giles-admin-product-views-v1';
export const SAVED_VIEWS_MAX = 20;

export function loadSavedViews(storage?: AdminSavedViewStorage | null): AdminSavedView[] {
    if (!storage || typeof storage.getItem !== 'function') return [];
    try {
        const raw = storage.getItem(SAVED_VIEWS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (v): v is AdminSavedView =>
                Boolean(v) &&
                typeof v.id === 'string' &&
                typeof v.name === 'string' &&
                v.filters &&
                typeof v.filters === 'object',
        );
    } catch {
        return [];
    }
}

export function persistSavedViews(
    views: AdminSavedView[],
    storage?: AdminSavedViewStorage | null,
): void {
    if (!storage || typeof storage.setItem !== 'function') return;
    try {
        storage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views.slice(0, SAVED_VIEWS_MAX)));
    } catch {
        // Quota or serialization errors: keep the in-memory views usable.
    }
}

export function saveSavedView(
    views: AdminSavedView[],
    name: string,
    filters: AdminProductFilters,
): { ok: boolean; error?: string; views: AdminSavedView[] } {
    const trimmed = (name || '').trim();
    if (!trimmed) {
        return { ok: false, error: 'Įveskite vaizdo pavadinimą', views };
    }
    if (views.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false, error: 'Vaizdas tokiu pavadinimu jau yra', views };
    }
    if (views.length >= SAVED_VIEWS_MAX) {
        return { ok: false, error: `Leidžiama ne daugiau ${SAVED_VIEWS_MAX} vaizdų`, views };
    }
    const view: AdminSavedView = {
        id: `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        filters: { ...filters },
        isDefault: false,
        createdAt: new Date().toISOString(),
    };
    return { ok: true, views: [...views, view] };
}

export function deleteSavedView(views: AdminSavedView[], id: string): AdminSavedView[] {
    return views.filter((v) => v.id !== id);
}

export function setDefaultSavedView(views: AdminSavedView[], id: string): AdminSavedView[] {
    return views.map((v) => ({ ...v, isDefault: v.id === id }));
}

export function applySavedView(views: AdminSavedView[], id: string): AdminProductFilters | null {
    const view = views.find((v) => v.id === id);
    return view ? { ...view.filters } : null;
}

export function defaultSavedView(views: AdminSavedView[]): AdminSavedView | null {
    return views.find((v) => v.isDefault) ?? null;
}

// React hook binding the pure helpers to the browser localStorage (admin client only).
export function useAdminSavedViews() {
    const storage =
        typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
    const [views, setViews] = useState<AdminSavedView[]>([]);

    useEffect(() => {
        setViews(loadSavedViews(storage));
        // storage is stable (window.localStorage singleton); eslint exhaustive-deps noise not wanted here.
    }, [storage]);

    const save = useCallback(
        (name: string, filters: AdminProductFilters): { ok: boolean; error?: string } => {
            const result = saveSavedView(loadSavedViews(storage), name, filters);
            if (result.ok) {
                persistSavedViews(result.views, storage);
                setViews(result.views);
            }
            return { ok: result.ok, error: result.error };
        },
        [storage],
    );

    const remove = useCallback(
        (id: string) => {
            const next = deleteSavedView(loadSavedViews(storage), id);
            persistSavedViews(next, storage);
            setViews(next);
        },
        [storage],
    );

    const setDefault = useCallback(
        (id: string) => {
            const next = setDefaultSavedView(loadSavedViews(storage), id);
            persistSavedViews(next, storage);
            setViews(next);
        },
        [storage],
    );

    return { views, save, remove, setDefault };
}
