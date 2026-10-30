'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { B2BPartnerAccount } from '../lib/b2b-accounts';
import { getCustomerCreditLedger } from '../lib/b2b-pricing-engine';
import type { SupportedB2BLocale } from './b2b-portal-views';

const PANEL_COPY: Record<
    SupportedB2BLocale,
    {
        kicker: string;
        title: string;
        desc: string;
        keyLabel: string;
        modeLabel: string;
        modeDraftOnly: string;
        modeAutoOrder: string;
        limitLabel: string;
        copyKeyBtn: string;
        copyConfigBtn: string;
        copiedLabel: string;
        guideLink: string;
    }
> = {
    lt: {
        kicker: 'AI IR MCP PIRKIMŲ JUNGTIS · B2B SAVITARNA',
        title: 'Jūsų įmonės B2B MCP raktas ir AI pirkimų asistento nustatymai',
        desc: 'Prijunkite Claude Desktop, Cursor ar įmonės pirkimų agentą. Asistentas mato tik Jūsų įmonės individualias nuolaidas (-35%..-52%), Eigulių g. 21 sandėlio likučius ir gali ruošti sąmatas.',
        keyLabel: 'Asmeninis B2B MCP raktas (RBAC: b2b_customer):',
        modeLabel: 'AI asistento veikimo režimas:',
        modeDraftOnly: 'Tik sąmatų ir juodraščių ruošimas (reikalingas patvirtinimas)',
        modeAutoOrder: 'Automatinis užsakymas iki nustatyto biudžeto limito €',
        limitLabel: 'Maks. automatinio užsakymo suma (€ be PVM):',
        copyKeyBtn: 'Kopijuoti B2B MCP raktą',
        copyConfigBtn: 'Kopijuoti claude_desktop_config.json',
        copiedLabel: 'Nukopijuota',
        guideLink: 'Atidaryti pilną AI / MCP jungties vedlį',
    },
    en: {
        kicker: 'AI & MCP PURCHASING BRIDGE · B2B SELF-SERVICE',
        title: 'Your Company B2B MCP Key & AI Purchasing Assistant Settings',
        desc: 'Connect Claude Desktop, Cursor, or your company purchasing agent. The assistant accesses only your company discounts (-35%..-52%) and live Kaunas warehouse stock.',
        keyLabel: 'Personal B2B MCP Key (RBAC: b2b_customer):',
        modeLabel: 'AI Assistant Operating Mode:',
        modeDraftOnly: 'Project quotes & drafts only (requires human approval)',
        modeAutoOrder: 'Auto-order up to configured EUR budget limit',
        limitLabel: 'Max auto-order limit (EUR excl. VAT):',
        copyKeyBtn: 'Copy B2B MCP Key',
        copyConfigBtn: 'Copy claude_desktop_config.json',
        copiedLabel: 'Copied',
        guideLink: 'Open Full AI / MCP Bridge Guide',
    },
    pl: {
        kicker: 'ZŁĄCZE ZAKUPOWE AI I MCP · SAMOOBSŁUGA B2B',
        title: 'Klucz B2B MCP Twojej firmy i ustawienia asystenta zakupowego AI',
        desc: 'Połącz Claude Desktop, Cursor lub firmowego agenta zakupowego. Asystent widzi wyłącznie indywidualne rabaty Twojej firmy (-35%..-52%) oraz stany magazynowe w Kownie.',
        keyLabel: 'Indywidualny klucz B2B MCP (RBAC: b2b_customer):',
        modeLabel: 'Tryb pracy asystenta AI:',
        modeDraftOnly: 'Tylko przygotowanie kosztorysów i szkiców (wymaga akceptacji)',
        modeAutoOrder: 'Automatyczne zamówienia do ustalonego limitu budżetu EUR',
        limitLabel: 'Maks. kwota automatycznego zamówienia (EUR netto):',
        copyKeyBtn: 'Kopiuj klucz B2B MCP',
        copyConfigBtn: 'Kopiuj claude_desktop_config.json',
        copiedLabel: 'Skopiowano',
        guideLink: 'Otwórz pełny kreator złącza AI / MCP',
    },
    ru: {
        kicker: 'ЗАКУПОЧНЫЙ МОСТ AI И MCP · B2B САМООБСЛУЖИВАНИЕ',
        title: 'Корпоративный B2B MCP-ключ и настройки AI-ассистента закупок',
        desc: 'Подключите Claude Desktop, Cursor или корпоративного агента закупок. Ассистент видит только индивидуальные скидки вашей компании (-35%..-52%) и остатки на складе в Каунасе.',
        keyLabel: 'Персональный B2B MCP-ключ (RBAC: b2b_customer):',
        modeLabel: 'Режим работы AI-ассистента:',
        modeDraftOnly: 'Только подготовка смет и черновиков (требуется подтверждение)',
        modeAutoOrder: 'Автозаказ до установленного лимита бюджета EUR',
        limitLabel: 'Макс. сумма автозаказа (EUR без НДС):',
        copyKeyBtn: 'Скопировать B2B MCP-ключ',
        copyConfigBtn: 'Скопировать claude_desktop_config.json',
        copiedLabel: 'Скопировано',
        guideLink: 'Открыть мастер подключения AI / MCP',
    },
};

export function B2BCustomerMcpPanel({
    locale,
    account,
}: {
    locale: SupportedB2BLocale;
    account: B2BPartnerAccount;
}) {
    const t = PANEL_COPY[locale] || PANEL_COPY.lt;
    const cleanCode = (account.companyCode || '302620907').replace(/[^a-zA-Z0-9]/g, '');
    const clientMcpKey = `giles_b2b_client_${cleanCode}_${account.id.slice(-6)}`;

    const [agentMode, setAgentMode] = useState<'draft_only' | 'auto_limit'>('draft_only');
    const [maxAutoOrderEur, setMaxAutoOrderEur] = useState(2500);
    const [copiedTarget, setCopiedTarget] = useState<'key' | 'config' | null>(null);

    const { creditConfig, creditLedgerSummary } = getCustomerCreditLedger(account.id);
    const limitEur = creditConfig.creditLimitEur || account.creditLimitEur || 10000;
    const usedEur =
        creditLedgerSummary.invoices.length > 0
            ? creditLedgerSummary.creditUsedEur
            : account.creditUsedEur || 0;
    const remainingEur = Math.max(0, limitEur - usedEur);
    const utilizationPct = limitEur > 0 ? Math.round((usedEur / limitEur) * 1000) / 10 : 0;
    const deferralDays = creditConfig.paymentTermDays ?? account.paymentTermsDays ?? 14;
    const thresholdPct = creditConfig.autoReminderThresholdPct || 80;
    const barColor =
        utilizationPct > 95 || creditLedgerSummary.overdueInvoicesCount > 0
            ? '#B91C1C'
            : utilizationPct >= 75
              ? '#D97706'
              : '#157A3B';

    const claudeConfigSnippet = JSON.stringify(
        {
            mcpServers: {
                'giles-b2b-partner': {
                    type: 'http',
                    url: 'https://gilesinzinerija.lt/api/mcp',
                    headers: {
                        Authorization: `Bearer ${clientMcpKey}`,
                        'X-Giles-Account-Id': account.id,
                        'X-Giles-Agent-Mode': agentMode,
                        'X-Giles-Max-Auto-Order-Eur': String(maxAutoOrderEur),
                    },
                },
            },
        },
        null,
        2,
    );

    const copyText = (text: string, which: 'key' | 'config') => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {});
        }
        setCopiedTarget(which);
        setTimeout(() => setCopiedTarget(null), 2000);
    };

    return (
        <section
            data-testid="b2b-customer-mcp-panel"
            className="rounded-2xl border border-[#C2410C] bg-white p-5 space-y-4 text-xs"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <span className="font-mono font-bold text-[#C2410C] block">{t.kicker}</span>
                    <h4 className="text-base font-extrabold text-[#11161B]">{t.title}</h4>
                </div>
                <Link
                    href={`/${locale}/mcp-jungtis`}
                    className="h-9 px-3.5 rounded-lg bg-[#11161B] text-white font-bold inline-flex items-center"
                >
                    {t.guideLink}
                </Link>
            </div>

            <p className="text-[#5B6470] leading-relaxed">{t.desc}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                    <span className="font-semibold text-[#11161B] block">{t.keyLabel}</span>
                    <code
                        data-testid="b2b-customer-mcp-key"
                        className="block px-3 py-2 rounded-lg bg-[#F5F3EE] font-mono text-[#11161B] font-bold truncate"
                    >
                        {clientMcpKey}
                    </code>
                </div>

                <label className="space-y-1 block">
                    <span className="font-semibold text-[#11161B] block">{t.modeLabel}</span>
                    <select
                        data-testid="b2b-mcp-agent-mode-select"
                        value={agentMode}
                        onChange={(e) => setAgentMode(e.target.value as 'draft_only' | 'auto_limit')}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#D5CFC3] bg-white text-[#11161B] font-semibold"
                    >
                        <option value="draft_only">{t.modeDraftOnly}</option>
                        <option value="auto_limit">{t.modeAutoOrder}</option>
                    </select>
                </label>

                <label className="space-y-1 block">
                    <span className="font-semibold text-[#11161B] block">{t.limitLabel}</span>
                    <input
                        type="number"
                        min={100}
                        step={100}
                        data-testid="b2b-mcp-max-order-input"
                        value={maxAutoOrderEur}
                        onChange={(e) => setMaxAutoOrderEur(Math.max(100, Number(e.target.value) || 100))}
                        className="w-full h-9 px-3 rounded-lg border border-[#D5CFC3] bg-white font-mono font-bold text-[#11161B]"
                    />
                </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                    type="button"
                    data-testid="b2b-copy-mcp-key-btn"
                    onClick={() => copyText(clientMcpKey, 'key')}
                    className="h-9 px-4 rounded-lg bg-[#C2410C] text-white font-bold cursor-pointer"
                >
                    {copiedTarget === 'key' ? t.copiedLabel : t.copyKeyBtn}
                </button>
                <button
                    type="button"
                    data-testid="b2b-copy-mcp-config-btn"
                    onClick={() => copyText(claudeConfigSnippet, 'config')}
                    className="h-9 px-4 rounded-lg border border-[#D5CFC3] bg-[#FAF9F6] text-[#11161B] font-bold cursor-pointer"
                >
                    {copiedTarget === 'config' ? t.copiedLabel : t.copyConfigBtn}
                </button>
            </div>

            <div
                data-testid="b2b-portal-credit-status-card"
                className="border-t border-[#E2DDD3] pt-4 space-y-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <strong className="text-sm font-extrabold text-[#11161B] block">
                            Mano kredito limitas, mokėjimo atidėjimas ir sąskaitų būklė
                        </strong>
                        <span className="text-[#5B6470]">
                            Mokėjimo atidėjimas: <strong>{deferralDays} d.</strong> · Kredito limitas:{' '}
                            <strong className="font-mono text-[#11161B]">
                                {limitEur.toLocaleString('lt-LT')} €
                            </strong>{' '}
                            · Sunaudota / Neapmokėta:{' '}
                            <strong className="font-mono text-[#C2410C]">
                                {usedEur.toLocaleString('lt-LT')} € ({utilizationPct}%)
                            </strong>{' '}
                            · Laisvas limitas:{' '}
                            <strong className="font-mono text-[#157A3B]">
                                {remainingEur.toLocaleString('lt-LT')} €
                            </strong>
                        </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F5F3EE] font-mono font-bold text-[#11161B]">
                        Atidėjimas {deferralDays} d. · Slenkstis ≥{thresholdPct}%
                    </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-[#E2DDD3] overflow-hidden">
                    <div
                        style={{
                            width: `${Math.min(100, Math.max(2, utilizationPct))}%`,
                            backgroundColor: barColor,
                        }}
                        className="h-full transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[#5B6470]">
                    <span>
                        Apmokėtos sąskaitos:{' '}
                        <strong className="font-mono text-[#157A3B]">
                            {creditLedgerSummary.paidInvoicesTotalEur.toLocaleString('lt-LT')} € (
                            {creditLedgerSummary.paidInvoicesCount} vnt.)
                        </strong>
                    </span>
                    <span>
                        Neapmokėtos (su atidėjimu):{' '}
                        <strong className="font-mono text-[#11161B]">
                            {creditLedgerSummary.unpaidInvoicesTotalEur.toLocaleString('lt-LT')} € (
                            {creditLedgerSummary.unpaidInvoicesCount} vnt.)
                        </strong>
                    </span>
                    <span>
                        Vėluoja apmokėti:{' '}
                        <strong className="font-mono text-[#B91C1C]">
                            {creditLedgerSummary.overdueInvoicesTotalEur.toLocaleString('lt-LT')} € (
                            {creditLedgerSummary.overdueInvoicesCount} vnt.)
                        </strong>
                    </span>
                </div>

                {utilizationPct >= thresholdPct && (
                    <p
                        data-testid="b2b-portal-credit-auto-warning"
                        className="text-[#8A2F07] font-semibold"
                    >
                        Dėmesio: išnaudojote {utilizationPct} % suteikto kredito limito. Apmokėkite einamąją sąskaitą, kad atlaisvintumėte limitą naujiems užsakymams.
                    </p>
                )}
            </div>
        </section>
    );
}
