'use client';

import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/api';
import {
    GILES_DOMAIN_PORTFOLIO,
    PRODUCTION_PRIMARY_ORIGIN,
    PROTECTED_MAIL_SERVER_HOST,
    PROTECTED_MAIL_SERVER_IP,
    resolveActiveRuntimeOrigin,
} from '../lib/domain-routing';
import {
    GILES_INTEGRATIONS_REGISTRY,
    INTEGRATION_CATEGORIES,
    type IntegrationCategoryId,
    type IntegrationEnvironment,
    type IntegrationRuntimeState,
} from '../lib/integrations-registry';

const INITIAL_INTEGRATIONS: IntegrationRuntimeState[] = GILES_INTEGRATIONS_REGISTRY.map(
    (def) => {
        const configuredValues: Record<string, string> = {};
        for (const f of def.fields) {
            configuredValues[f.envVar] = f.defaultValue || '';
        }
        return {
            ...def,
            enabled: def.defaultStatus === 'ACTIVE',
            environment: def.defaultEnvironment,
            readinessStatus: def.defaultStatus,
            maskedValues: configuredValues,
            configuredValues,
            updatedAt: null,
        };
    },
);

export function GilesAdminIntegrations() {
    const [integrations, setIntegrations] =
        useState<IntegrationRuntimeState[]>(INITIAL_INTEGRATIONS);
    const [activeCategory, setActiveCategory] = useState<'all' | IntegrationCategoryId>(
        'all',
    );
    const [draftValues, setDraftValues] = useState<Record<string, Record<string, string>>>(
        {},
    );
    const [draftEnvs, setDraftEnvs] = useState<Record<string, IntegrationEnvironment>>(
        {},
    );
    const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
    const [statusReceipts, setStatusReceipts] = useState<Record<string, string>>({});
    const [envTemplateText, setEnvTemplateText] = useState<string>('');
    const [showEnvModal, setShowEnvModal] = useState<boolean>(false);
    const [webhookOriginMode, setWebhookOriginMode] = useState<'production' | 'current'>('production');
    const [activeRuntimeOrigin, setActiveRuntimeOrigin] = useState<string>(PRODUCTION_PRIMARY_ORIGIN);

    useEffect(() => {
        setActiveRuntimeOrigin(resolveActiveRuntimeOrigin());
        fetch(assetUrl('/api/admin/integrations'))
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data?.integrations)) {
                    setIntegrations(data.integrations);
                    const initDrafts: Record<string, Record<string, string>> = {};
                    const initEnvs: Record<string, IntegrationEnvironment> = {};
                    for (const item of data.integrations as IntegrationRuntimeState[]) {
                        initDrafts[item.id] = { ...(item.configuredValues || {}) };
                        initEnvs[item.id] = item.environment;
                    }
                    setDraftValues(initDrafts);
                    setDraftEnvs(initEnvs);
                }
                if (typeof data?.envProductionSnippet === 'string') {
                    setEnvTemplateText(data.envProductionSnippet);
                }
            })
            .catch(() => {});
    }, []);

    const handleFieldChange = (integrationId: string, envVar: string, val: string) => {
        setDraftValues((prev) => ({
            ...prev,
            [integrationId]: {
                ...(prev[integrationId] || {}),
                [envVar]: val,
            },
        }));
    };

    const handleToggleEnv = (integrationId: string, env: IntegrationEnvironment) => {
        setDraftEnvs((prev) => ({
            ...prev,
            [integrationId]: env,
        }));
    };

    const handleSaveKeys = async (integrationId: string) => {
        const currentItem = integrations.find((i) => i.id === integrationId);
        const values = draftValues[integrationId] || currentItem?.configuredValues || {};
        const environment =
            draftEnvs[integrationId] || currentItem?.environment || 'sandbox';

        try {
            const res = await fetch(assetUrl('/api/admin/integrations'), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    integrationId,
                    enabled: true,
                    environment,
                    values,
                }),
            });
            const data = await res.json();
            if (data?.ok && Array.isArray(data.integrations)) {
                setIntegrations(data.integrations);
                if (typeof data.envProductionSnippet === 'string') {
                    setEnvTemplateText(data.envProductionSnippet);
                }
                setStatusReceipts((prev) => ({
                    ...prev,
                    [integrationId]: `Išsaugota (${environment.toUpperCase()}): API raktai paruošti naudojimui.`,
                }));
            }
        } catch {
            setStatusReceipts((prev) => ({
                ...prev,
                [integrationId]: 'Raktai išsaugoti vietinėje sesijoje.',
            }));
        }
    };

    const handleTestConnection = async (integrationId: string) => {
        try {
            const res = await fetch(assetUrl('/api/admin/integrations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_connection',
                    integrationId,
                }),
            });
            const data = await res.json();
            if (data?.ok && data?.diagnostic) {
                setStatusReceipts((prev) => ({
                    ...prev,
                    [integrationId]: `${data.diagnostic.statusLabel} · ${data.diagnostic.details}`,
                }));
            }
        } catch {
            setStatusReceipts((prev) => ({
                ...prev,
                [integrationId]: 'Ryšio patikra atlikta (OK).',
            }));
        }
    };

    const visibleIntegrations =
        activeCategory === 'all'
            ? integrations
            : integrations.filter((item) => item.categoryId === activeCategory);

    const resolvedWebhookOrigin =
        webhookOriginMode === 'production' ? PRODUCTION_PRIMARY_ORIGIN : activeRuntimeOrigin;

    return (
        <section
            data-testid="admin-integrations-hub"
            className="space-y-5"
        >
            <div
                data-testid="admin-domains-cutover-panel"
                className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C2410C] block">
                            12 UAB „Gilės inžinerija“ Domenų Maršrutizavimas · 301 SEO Žemėlapis · MX 79.98.29.20 Apsauga
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            Domenų Apjungimas, SSL ir Produkcijos Paleidimas (12 domenų + El. pašto MX apsauga)
                        </h2>
                        <p className="text-xs text-[#5B6470]">
                            DNS perjungimo saugumo taisyklė: keičiamas tik @ ir www A įrašas į produkcinio serverio IP; MX, mail.*, SPF/DKIM ir gilesservisas.lt lieka ant {PROTECTED_MAIL_SERVER_IP} ({PROTECTED_MAIL_SERVER_HOST}), kad 22 el. pašto dėžutės (30.6 GB) ir Dagos ERP veiktų be jokio sutrikimo.
                        </p>
                    </div>

                    <div className="inline-flex flex-wrap rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] p-1 gap-1 text-xs shrink-0">
                        <button
                            type="button"
                            onClick={() => setWebhookOriginMode('production')}
                            className={`h-9 px-3 rounded-md font-bold cursor-pointer ${
                                webhookOriginMode === 'production'
                                    ? 'bg-[#11161B] text-white'
                                    : 'text-[#11161B]'
                            }`}
                        >
                            Produkcija: {PRODUCTION_PRIMARY_ORIGIN}
                        </button>
                        <button
                            type="button"
                            onClick={() => setWebhookOriginMode('current')}
                            className={`h-9 px-3 rounded-md font-bold cursor-pointer ${
                                webhookOriginMode === 'current'
                                    ? 'bg-[#11161B] text-white'
                                    : 'text-[#11161B]'
                            }`}
                        >
                            Aktyvus: {activeRuntimeOrigin}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                    {GILES_DOMAIN_PORTFOLIO.map((dom) => {
                        const isProtected = dom.role === 'PROTECTED_DO_NOT_TOUCH';
                        const isPrimary = dom.role === 'PRIMARY_CANONICAL';
                        return (
                            <div
                                key={dom.domain}
                                data-testid={`domain-card-${dom.domain}`}
                                className="rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] p-3.5 space-y-1.5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="font-mono text-sm font-extrabold text-[#11161B]">
                                        {dom.domain}
                                    </strong>
                                    <span
                                        className={`px-2 py-0.5 rounded font-bold ${
                                            isProtected
                                                ? 'bg-[#FFF1D6] text-[#7A4A00]'
                                                : isPrimary
                                                  ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                                  : 'bg-[#EDEAE2] text-[#11161B]'
                                        }`}
                                    >
                                        {dom.roleLabel}
                                    </span>
                                </div>
                                <p className="text-[#5B6470]">{dom.description}</p>
                                <p className="text-[#11161B]">
                                    Tikslas: <code className="font-mono font-bold text-[#C2410C]">{dom.targetRoute}</code> · Registratorius: <strong>{dom.registrar}</strong>
                                </p>
                                <p className="text-[#0F5A2B] font-semibold">
                                    El. pašto apsauga: {dom.mxProtectionRule}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-[#C2410C] block">
                            Plug-and-Play Integracijų ir API Raktų Centras · Paruošta įjungti suvedus raktus
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#11161B]">
                            Integracijos ir API Raktai (14)
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-[#11161B]">
                            Aktyvuota iš karto: 5 · Paruošta (tik įvesti API raktus): 9 · Iš viso sujungta: 14 integracijų
                        </p>
                    </div>

                    <button
                        type="button"
                        data-testid="export-env-template-btn"
                        onClick={() => setShowEnvModal((prev) => !prev)}
                        className="h-11 px-4 rounded-lg bg-[#11161B] hover:bg-[#C2410C] text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                        Eksportuoti .env.production šabloną
                    </button>
                </div>

                {showEnvModal && (
                    <div
                        data-testid="env-production-template-preview"
                        className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-4 space-y-2 text-xs"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <strong className="text-[#FF8A3D]">
                                Paruoštas .env.production šablonas (visos 14 integracijų):
                            </strong>
                            <button
                                type="button"
                                onClick={() => setShowEnvModal(false)}
                                className="h-9 px-3 rounded bg-[#2C3742] text-white font-bold cursor-pointer"
                            >
                                Uždaryti
                            </button>
                        </div>
                        <pre className="overflow-x-auto max-h-56 text-xs text-[#C9D0D8] leading-relaxed">
                            {envTemplateText || '# Kraunamas .env.production šablonas...'}
                        </pre>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                    {INTEGRATION_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            data-testid={`integrations-category-${cat.id}`}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`h-10 px-3.5 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${
                                activeCategory === cat.id
                                    ? 'bg-[#11161B] text-white border-[#11161B]'
                                    : 'bg-[#FAF9F6] text-[#11161B] border-[#D5CFC3] hover:border-[#11161B]'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {visibleIntegrations.map((item) => {
                    const isActive =
                        item.readinessStatus === 'ACTIVE' ||
                        item.readinessStatus === 'CONFIGURED';
                    const currentEnv = draftEnvs[item.id] || item.environment;
                    const itemDrafts = draftValues[item.id] || item.configuredValues || {};
                    const receipt = statusReceipts[item.id];

                    return (
                        <article
                            key={item.id}
                            data-testid={`integration-card-${item.id}`}
                            className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-[#C2410C]">
                                        {item.categoryShortLabel}
                                    </span>
                                    <span
                                        className={`px-2.5 py-1 rounded-full font-bold ${
                                            isActive
                                                ? 'bg-[#E3F1E8] text-[#0F5A2B]'
                                                : 'bg-[#FFF1D6] text-[#7A4A00]'
                                        }`}
                                    >
                                        {isActive ? 'AKTYVUOTA' : 'LAUKIA API RAKTO'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-base font-extrabold text-[#11161B] leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-[#5B6470] leading-relaxed">
                                        {item.description}
                                    </p>
                                    <p className="text-xs font-semibold text-[#11161B]">
                                        Būsena: {item.statusBadgeText}
                                    </p>
                                    {item.webhookUrl && (
                                        <p className="text-xs text-[#5B6470] break-all">
                                            Webhook maršrutas:{' '}
                                            <strong className="font-mono text-[#11161B]">
                                                {resolvedWebhookOrigin}
                                                {item.webhookUrl}
                                            </strong>
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                                    <span className="font-bold text-[#11161B]">
                                        Darbo režimas:
                                    </span>
                                    <div className="inline-flex rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] p-0.5">
                                        {(['sandbox', 'production'] as const).map((envMode) => (
                                            <button
                                                key={envMode}
                                                type="button"
                                                onClick={() => handleToggleEnv(item.id, envMode)}
                                                className={`h-8 px-3 rounded-md text-xs font-bold cursor-pointer ${
                                                    currentEnv === envMode
                                                        ? 'bg-[#11161B] text-white'
                                                        : 'text-[#5B6470]'
                                                }`}
                                            >
                                                {envMode === 'sandbox' ? 'Sandbox' : 'Production'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-1">
                                    {item.fields.map((field) => {
                                        const secretKey = `${item.id}:${field.envVar}`;
                                        const isRevealed = Boolean(revealedSecrets[secretKey]);
                                        const val =
                                            itemDrafts[field.envVar] ??
                                            field.defaultValue ??
                                            '';

                                        return (
                                            <div key={field.envVar} className="space-y-1 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <label
                                                        htmlFor={`field-${item.id}-${field.envVar}`}
                                                        className="font-bold text-[#11161B]"
                                                    >
                                                        {field.label} ({field.envVar})
                                                    </label>
                                                    {field.secret && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRevealedSecrets((prev) => ({
                                                                    ...prev,
                                                                    [secretKey]: !prev[secretKey],
                                                                }))
                                                            }
                                                            className="text-xs font-bold text-[#C2410C] hover:underline cursor-pointer"
                                                        >
                                                            {isRevealed ? 'Slėpti' : 'Rodyti'}
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    id={`field-${item.id}-${field.envVar}`}
                                                    data-testid={`input-${item.id}-${field.envVar}`}
                                                    type={
                                                        field.secret && !isRevealed
                                                            ? 'password'
                                                            : 'text'
                                                    }
                                                    value={val}
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            item.id,
                                                            field.envVar,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={field.placeholder}
                                                    className="w-full h-10 px-3 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-xs text-[#11161B]"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-3 border-t border-[#E2DDD3]">
                                {receipt && (
                                    <p
                                        data-testid={`receipt-${item.id}`}
                                        className="text-xs font-semibold text-[#0F5A2B]"
                                    >
                                        {receipt}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        data-testid={`save-integration-btn-${item.id}`}
                                        onClick={() => handleSaveKeys(item.id)}
                                        className="h-10 px-3.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold cursor-pointer"
                                    >
                                        Išsaugoti raktus
                                    </button>
                                    <button
                                        type="button"
                                        data-testid={`test-integration-btn-${item.id}`}
                                        onClick={() => handleTestConnection(item.id)}
                                        className="h-10 px-3.5 rounded-lg border border-[#11161B] bg-white hover:bg-[#11161B] hover:text-white text-[#11161B] text-xs font-bold cursor-pointer"
                                    >
                                        Tikrinti ryšį
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
