'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ThermometerSnowflake } from 'lucide-react';
import Link from 'next/link';
import { assetUrl } from '../../lib/api';
import type { AppLocale } from '../../i18n/routing';
import {
    getInzinerijaContent,
    getLocalizedInzinerijaServices,
    getLocalizedInzinerijaKits,
    getLocalizedInzinerijaCompatibility,
    getLocalizedInzinerijaProjects,
    getServiceFormConfig,
} from '../../lib/inzinerija-v2/data';
import { InstantDealDrawerMount, openInstantDeal } from '../instant-deal-drawer';
import { useStorefrontConfig } from '../storefront-config-provider';
import { formatCatalogCount } from '../../lib/w121-honest-commerce';

const HERO_GALLERY = [
    { src: '/studio-assets/projects/giles-darbas-01.webp', alt: 'Viadrus U26 su Megatherm MPB granulių degikliu' },
    { src: '/studio-assets/projects/giles-darbas-06.webp', alt: 'Konteinerinė katilinė GK-500 keliama kranu' },
    { src: '/studio-assets/projects/giles-darbas-11.webp', alt: '200 kW katilinės šilumos mazgas su kolektoriais' },
];

export function InzinerijaV2View({ locale }: { locale: AppLocale }) {
    // W121-A2: {count} in content JSON resolves to the live SKU count from the
    // server-injected storefront config (client bundle must not import the snapshot).
    const catalogSkuCount = useStorefrontConfig().catalog?.skuCount ?? 0;
    const countLabel = catalogSkuCount > 0 ? formatCatalogCount(catalogSkuCount, 'lt') : null;
    const withCount = (s: string) => (countLabel ? s.replaceAll('{count}', countLabel) : s);
    const content = useMemo(() => getInzinerijaContent(locale), [locale]);
    const services = useMemo(() => getLocalizedInzinerijaServices(locale), [locale]);
    const kits = useMemo(() => getLocalizedInzinerijaKits(locale), [locale]);
    const compat = useMemo(() => getLocalizedInzinerijaCompatibility(locale), [locale]);
    const projects = useMemo(() => getLocalizedInzinerijaProjects(locale), [locale]);
    const formCfg = useMemo(() => getServiceFormConfig(locale), [locale]);

    const [svcNetworkError, setSvcNetworkError] = useState(false);
    const [quoteNetworkError, setQuoteNetworkError] = useState(false);
    const [serviceFormVisible, setServiceFormVisible] = useState(false);
    const serviceSectionRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        const el = serviceSectionRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(([entry]) => setServiceFormVisible(entry.isIntersecting), { threshold: 0.15 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const [projectFilter, setProjectFilter] = useState<'all' | 'perd' | 'ind' | 'hp' | 'svc'>('all');
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [svcUrgency, setSvcUrgency] = useState<'urgent' | 'high' | 'plan'>(
        (formCfg.urgency.find((u) => u.default)?.id as 'urgent' | 'high' | 'plan') ?? 'high',
    );
    const [svcType, setSvcType] = useState(formCfg.types.find((t) => 'default' in t && t.default)?.id ?? 'post');
    const [svcModel, setSvcModel] = useState('');
    const [svcError, setSvcError] = useState('');
    const [svcName, setSvcName] = useState('');
    const [svcPhone, setSvcPhone] = useState('');
    const [svcCity, setSvcCity] = useState('');
    const [svcDesc, setSvcDesc] = useState('');
    const [svcPart, setSvcPart] = useState(formCfg.fields.find((f) => f.id === 'part')?.options?.[0] ?? '');
    const [svcSending, setSvcSending] = useState(false);
    const [svcTicket, setSvcTicket] = useState<string | null>(null);
    const [quoteType, setQuoteType] = useState(content.project_form.types[0]);
    const [quoteName, setQuoteName] = useState('');
    const [quotePhone, setQuotePhone] = useState('');
    const [quoteCity, setQuoteCity] = useState('');
    const [quoteSending, setQuoteSending] = useState(false);
    const [quoteTicket, setQuoteTicket] = useState<string | null>(null);

    const visibleProjects = useMemo(() => {
        const filtered = projectFilter === 'all' ? projects : projects.filter((p) => p.category === projectFilter);
        return showAllProjects ? filtered : filtered.slice(0, content.projects_section.show_initial);
    }, [projects, projectFilter, showAllProjects, content.projects_section.show_initial]);

    const filteredCount = projectFilter === 'all' ? projects.length : projects.filter((p) => p.category === projectFilter).length;

    async function submitServiceForm(e: React.FormEvent) {
        e.preventDefault();
        if (svcName.trim().length < 2 || svcPhone.trim().length < 5) return;
        setSvcSending(true);
        try {
            const res = await fetch('/api/service-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urgency: svcUrgency,
                    type: svcType,
                    model: svcModel.trim() || undefined,
                    error_code: svcError.trim() || undefined,
                    name: svcName.trim(),
                    phone: svcPhone.trim(),
                    city: svcCity.trim() || undefined,
                    description: svcDesc.trim() || undefined,
                    part: svcType === 'part' ? svcPart : undefined,
                    source_page: 'inzinerija',
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string };
            if (res.ok && data.ok && data.id) setSvcTicket(data.id);
            else setSvcNetworkError(true);
        } catch {
            setSvcNetworkError(true);
        } finally {
            setSvcSending(false);
        }
    }

    async function submitQuoteForm(e: React.FormEvent) {
        e.preventDefault();
        if (quoteName.trim().length < 2 || quotePhone.trim().length < 5) return;
        setQuoteSending(true);
        try {
            const res = await fetch('/api/service-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urgency: 'plan',
                    type: 'quote',
                    name: quoteName.trim(),
                    phone: quotePhone.trim(),
                    city: quoteCity.trim() || undefined,
                    description: `${quoteType}`,
                    source_page: 'inzinerija',
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string };
            if (res.ok && data.ok && data.id) setQuoteTicket(data.id);
            else setQuoteNetworkError(true);
        } catch {
            setQuoteNetworkError(true);
        } finally {
            setQuoteSending(false);
        }
    }

    return (
        <div className="bg-[#F5F3EE] text-[#11161B] min-h-screen">
            <section className="bg-[#0E1216] text-[#F5F3EE]">
                <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 lg:grid lg:grid-cols-[1fr_420px] lg:gap-10">
                    <div>
                        <nav aria-label="breadcrumb" className="text-xs text-[#A3ADB8]">
                            <Link href={`/${locale}`} className="hover:text-[#FF8A3D]">{content.breadcrumb[0]}</Link>
                            <span className="mx-1.5">/</span>
                            <span aria-current="page">{content.breadcrumb[1]}</span>
                        </nav>
                        <p className="mt-4 text-xs font-semibold text-[#FF8A3D]">{content.hero.eyebrow}</p>
                        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold leading-tight text-balance max-w-xl">
                            {content.hero.h1}
                        </h1>
                        <p className="mt-3 text-sm sm:text-base text-[#C9D0D8] leading-relaxed max-w-xl">
                            {content.hero.lead}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {content.hero.contacts.map((c) => (
                                <a key={c.phone} href={`tel:${c.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-bold hover:text-[#FF8A3D]">
                                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" aria-hidden="true" />
                                    {c.label}: {c.phone}
                                </a>
                            ))}
                        </div>
                        <div className="mt-6 grid gap-2 sm:grid-cols-3">
                            <a
                                href={content.hero.paths[0].href}
                                data-testid="path-service"
                                className="rounded-lg px-4 py-3.5 min-h-[92px] flex flex-col justify-between transition-colors bg-[#C2410C] text-white hover:brightness-110"
                            >
                                <span className="font-bold text-sm leading-snug">{content.hero.paths[0].title}</span>
                                <span className="text-xs leading-snug text-white/85">{content.hero.paths[0].sub}</span>
                            </a>
                            <a
                                href={content.hero.paths[1].href}
                                data-testid="path-conversion"
                                className="rounded-lg px-4 py-3.5 min-h-[92px] flex flex-col justify-between transition-colors bg-transparent border border-[#2C3742] text-[#F5F3EE] hover:border-[#FF8A3D]"
                            >
                                <span className="font-bold text-sm leading-snug">{content.hero.paths[1].title}</span>
                                <span className="text-xs leading-snug text-[#A3ADB8]">{content.hero.paths[1].sub}</span>
                            </a>
                            <a
                                href={content.hero.paths[2].href}
                                data-testid="path-project"
                                className="rounded-lg px-4 py-3.5 min-h-[92px] flex flex-col justify-between transition-colors bg-transparent border border-[#2C3742] text-[#F5F3EE] hover:border-[#FF8A3D]"
                            >
                                <span className="font-bold text-sm leading-snug">{content.hero.paths[2].title}</span>
                                <span className="text-xs leading-snug text-[#A3ADB8]">{content.hero.paths[2].sub}</span>
                            </a>
                        </div>
                    </div>
                    <div className="mt-8 lg:mt-0">
                        <div className="rounded-xl overflow-hidden bg-[#1B232C] border border-[#2C3742]">
                            <img
                                src={assetUrl('/studio-assets/projects/giles-darbas-06.webp')}
                                alt={locale === 'lt' ? 'Konteinerinė katilinė GK-500 keliama kranu į objektą' : 'Container boiler house GK-500 lifted by crane'}
                                className="w-full aspect-[4/3] object-cover"
                            />
                        </div>
                        <div className="mt-2 hidden sm:grid grid-cols-3 gap-2">
                            {HERO_GALLERY.map((g) => (
                                <div key={g.src} className="rounded-lg overflow-hidden bg-[#1B232C] border border-[#2C3742]">
                                    <img src={assetUrl(g.src)} alt={g.alt} className="w-full aspect-square object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <section data-testid="trust-bar" className="bg-white border-b border-[#E2DDD3]">
                <div className="mx-auto max-w-6xl px-4 py-6">
                    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4 text-center">
                        {content.trust.map((t) => (
                            <div key={t.label}>
                                <dt className="sr-only">{t.label}</dt>
                                <dd>
                                    <span className="block text-lg font-extrabold text-[#11161B] leading-tight">{withCount(t.value)}</span>
                                    <span className="block text-xs text-[#5B6470] mt-0.5 leading-snug">{t.label}</span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-5 text-xs font-semibold text-[#5B6470]">{content.brands_label}</p>
                    <p className="mt-1.5 text-sm font-bold text-[#2A323B] leading-relaxed">
                        {content.brands.join(' · ')}
                    </p>
                </div>
            </section>

            <section id="paslaugos" className="scroll-mt-24">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <p className="text-xs font-bold text-[#C2410C]">{content.services_section.eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.services_section.title}</h2>
                    <p className="mt-2 text-sm text-[#5B6470]">{content.services_section.note}</p>
                    <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3">
                        {services.map((s) => (
                            <article
                                key={s.id}
                                data-testid="service-card"
                                className="flex flex-col rounded-xl bg-white border border-[#E2DDD3] overflow-hidden min-w-[280px] snap-start sm:min-w-0"
                            >
                                {s.image ? (
                                    <img src={assetUrl(s.image)} alt={s.image_alt || s.title} className="w-full aspect-[3/2] sm:aspect-[16/10] object-cover" />
                                ) : (
                                    <div className="w-full aspect-[16/10] bg-[#EEEBE4] flex items-center justify-center">
                                        <ThermometerSnowflake size={48} strokeWidth={1.5} className="text-[#C2410C]" aria-hidden="true" />
                                    </div>
                                )}
                                <div className="flex flex-col flex-1 p-4">
                                    <p className="text-xs font-bold text-[#5B6470]">{s.eyebrow}</p>
                                    <h3 className="mt-1 text-base font-extrabold leading-snug">{s.title}</h3>
                                    <p className="mt-1.5 text-sm text-[#2A323B] leading-relaxed">{s.text}</p>
                                    <ul className="mt-3 space-y-1 text-sm text-[#2A323B]">
                                        {s.points.map((pt) => (
                                            <li key={pt} className="leading-snug">{pt}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-auto pt-3 space-y-1.5">
                                        <p className="text-xs text-[#5B6470]">{s.term}</p>
                                        <p className="text-sm font-extrabold text-[#11161B]">{s.price.label}</p>
                                        {typeof s.price.value_eur === 'number' && s.price.value_eur > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openInstantDeal({
                                                        sku: `SVC-${s.id.toUpperCase()}`,
                                                        title: s.title,
                                                        priceNetEur: s.price.value_eur ?? 0,
                                                        vatIncl: s.price.vat === 'incl',
                                                        details: [s.term, ...s.points.slice(0, 2)],
                                                        productIdPath: `/${locale}/inzinerija#paslaugos`,
                                                    })
                                                }
                                                className="w-full min-h-[48px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition cursor-pointer"
                                            >
                                                {s.cta.label}
                                            </button>
                                        ) : (
                                            <Link
                                                href={s.cta.href.startsWith('/lt/') ? s.cta.href.replace('/lt/', `/${locale}/`) : `/${locale}/inzinerija${s.cta.href.startsWith('#') ? s.cta.href : ''}`}
                                                className="inline-flex items-center justify-center min-h-[48px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition"
                                            >
                                                {s.cta.label}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            <section id="servisas" ref={serviceSectionRef} className="scroll-mt-24 bg-white border-y border-[#E2DDD3]">
                <span id="serviso-iskvietimas" className="block scroll-mt-24" aria-hidden="true" />
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <p className="text-xs font-bold text-[#C2410C]">{content.service_section.eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.service_section.title}</h2>
                    <p className="mt-2 text-sm text-[#5B6470] max-w-2xl">{content.service_section.lead}</p>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
                        {svcTicket ? (
                            <div data-testid="service-success" className="rounded-xl bg-[#F5F3EE] border border-[#E2DDD3] p-6">
                                <p className="text-lg font-extrabold text-[#11161B]">{formCfg.success.replace('{id}', svcTicket)}</p>
                                <button type="button" onClick={() => setSvcTicket(null)} className="mt-4 min-h-[44px] px-5 rounded-lg bg-[#11161B] text-white font-bold text-sm hover:bg-[#1B232C] transition cursor-pointer">
                                    {formCfg.submit}
                                </button>
                            </div>
                        ) : (
                            <form data-testid="service-form" onSubmit={submitServiceForm} className="rounded-xl bg-[#F5F3EE] border border-[#E2DDD3] p-4 sm:p-6">
                                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={content.service_section.title}>
                                    {formCfg.urgency.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={svcUrgency === u.id}
                                            aria-pressed={svcUrgency === u.id}
                                            data-testid={`urgency-${u.id}`}
                                            onClick={() => setSvcUrgency(u.id as 'urgent' | 'high' | 'plan')}
                                            className={`text-left rounded-lg border px-3.5 py-3 min-h-[68px] transition-colors cursor-pointer ${
                                                svcUrgency === u.id ? 'border-2 border-[#C2410C] bg-white' : 'border border-[#D5CFC3] bg-transparent hover:border-[#11161B]'
                                            }`}
                                        >
                                            <span className="block font-bold text-sm">{u.label}</span>
                                            <span className="block text-xs text-[#5B6470] mt-0.5">{u.sub}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-[#5B6470]">{formCfg.notes_by_urgency[svcUrgency]}</p>
                                {svcNetworkError && (
                                    <p data-testid="service-network-error" className="mt-2 text-sm font-semibold text-[#C2410C]" role="alert">
                                        Nepavyko išsiųsti. Patikrinkite ryšį ir bandykite dar kartą, arba skambinkite +370 611 19158.
                                    </p>
                                )}

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.types.find((t) => t.id === svcType)?.label}</span>
                                        <select value={svcType} onChange={(e) => setSvcType(e.target.value as typeof svcType)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm cursor-pointer">                                            {formCfg.types.map((t) => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'model')?.label}</span>
                                        <input type="text" value={svcModel} onChange={(e) => setSvcModel(e.target.value)} placeholder={formCfg.fields.find((f) => f.id === 'model')?.placeholder} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm placeholder-[#5B6470]" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'name')?.label} *</span>
                                        <input type="text" required minLength={2} autoComplete="name" value={svcName} onChange={(e) => setSvcName(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'phone')?.label} *</span>
                                        <input type="tel" required minLength={5} placeholder="+370" value={svcPhone} onChange={(e) => setSvcPhone(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm placeholder-[#5B6470]" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'city')?.label}</span>
                                        <input type="text" placeholder={formCfg.fields.find((f) => f.id === 'city')?.placeholder} value={svcCity} onChange={(e) => setSvcCity(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm placeholder-[#5B6470]" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'error_code')?.label}</span>
                                        <input type="text" placeholder={formCfg.fields.find((f) => f.id === 'error_code')?.placeholder} value={svcError} onChange={(e) => setSvcError(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm placeholder-[#5B6470]" />
                                    </label>
                                    {svcType === 'part' && (
                                        <label className="block sm:col-span-2">
                                            <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'part')?.label}</span>
                                            <select value={svcPart} onChange={(e) => setSvcPart(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-white border border-[#D5CFC3] px-3 text-sm cursor-pointer">
                                                {(formCfg.fields.find((f) => f.id === 'part')?.options ?? []).map((o) => (
                                                    <option key={o} value={o}>{o}</option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                    <label className="block sm:col-span-2">
                                        <span className="block text-xs font-bold text-[#2A323B] mb-1">{formCfg.fields.find((f) => f.id === 'description')?.label}</span>
                                        <textarea rows={3} placeholder={formCfg.fields.find((f) => f.id === 'description')?.placeholder} value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} className="w-full rounded-sm bg-white border border-[#D5CFC3] px-3 py-2.5 text-sm placeholder-[#5B6470]" />
                                    </label>
                                </div>
                                <button type="submit" disabled={svcSending} className="mt-4 w-full sm:w-auto min-h-[52px] px-8 rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm transition cursor-pointer disabled:opacity-60">
                                    {formCfg.submit}
                                </button>
                            </form>
                        )}

                        <aside className="rounded-xl bg-[#11161B] text-[#F5F3EE] p-5">
                            <h3 className="text-base font-extrabold">{content.a01.title}</h3>
                            <ol className="mt-3 space-y-3">
                                {content.a01.steps.map((st, i) => (
                                    <li key={st.t} className="flex gap-3">
                                        <span className="w-6 h-6 shrink-0 rounded-full bg-[#1B232C] border border-[#2C3742] flex items-center justify-center text-xs font-extrabold text-[#FF8A3D]">{i + 1}</span>
                                        <div>
                                            <p className="text-sm font-bold leading-snug">{st.t}</p>
                                            <p className="text-xs text-[#A3ADB8] mt-0.5 leading-snug">{st.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <Link href={content.a01.link.href.replace('/lt/', `/${locale}/`)} className="mt-4 inline-flex min-h-[44px] items-center text-sm font-bold text-[#FF8A3D] underline underline-offset-4 hover:text-[#F5F3EE]">
                                {content.a01.link.label.replace('→', '').trim()}
                            </Link>
                        </aside>
                    </div>
                </div>
            </section>

            <section id={content.projects_section.anchor_id} className="scroll-mt-24">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <p className="text-xs font-bold text-[#C2410C]">{content.projects_section.eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.projects_section.title}</h2>
                    <p className="mt-2 text-sm text-[#5B6470]">{content.projects_section.lead}</p>

                    <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={content.projects_section.title}>
                        {(['all', 'perd', 'ind', 'hp', 'svc'] as const).map((cat) => {
                            const label = cat === 'all'
                                ? (locale === 'lt' ? 'Visi' : locale === 'en' ? 'All' : locale === 'pl' ? 'Wszystkie' : 'Все')
                                : (projects.find((p) => p.category === cat)?.category_label ?? cat);
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    role="tab"
                                    aria-selected={projectFilter === cat}
                                    aria-pressed={projectFilter === cat}
                                    data-testid={`project-filter-${cat}`}
                                    onClick={() => { setProjectFilter(cat); setShowAllProjects(false); }}
                                    className={`min-h-[40px] px-4 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${
                                        projectFilter === cat
                                            ? 'border-[#11161B] bg-[#11161B] text-white'
                                            : 'border-[#D5CFC3] bg-transparent text-[#11161B] hover:border-[#11161B]'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div data-testid="projects-grid" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleProjects.map((p, pIdx) => (
                            <article key={p.id} className={`flex flex-col rounded-xl bg-white border border-[#E2DDD3] overflow-hidden ${pIdx >= 3 && !showAllProjects ? 'max-sm:hidden' : ''}`}>
                                {p.image ? (
                                    <img src={assetUrl(p.image)} alt={p.title} className="w-full aspect-[16/10] object-cover" />
                                ) : (
                                    <div className="w-full aspect-[16/10] bg-[#EEEBE4] flex items-center justify-center">
                                        <span className="text-xs font-bold text-[#5B6470] px-4 text-center">{p.subject}</span>
                                    </div>
                                )}
                                <div className="flex flex-col flex-1 p-4">
                                    <p className="text-xs font-bold text-[#C2410C]">{p.category_label} · {p.power}</p>
                                    <h3 className="mt-1 text-sm font-extrabold leading-snug">{p.title}</h3>
                                    <p className="mt-1.5 text-xs text-[#5B6470] leading-relaxed">{p.equipment}</p>
                                    <p className="mt-1.5 text-xs text-[#157A3B] font-semibold leading-snug">{p.result}</p>
                                    <div className="mt-auto pt-3">
                                        <Link
                                            href={p.cta_href.startsWith('#') ? `/${locale}/inzinerija${p.cta_href}` : p.cta_href.replace('/lt/', `/${locale}/`)}
                                            className="inline-flex items-center min-h-[40px] text-sm font-bold text-[#C2410C] underline underline-offset-4 hover:text-[#11161B]"
                                        >
                                            {p.category === 'perd' ? (locale === 'lt' ? 'Kaip perdarome' : 'How we convert') : p.category === 'svc' ? (locale === 'lt' ? 'Užsakyti servisą' : 'Order service') : (locale === 'lt' ? 'Modelio pasas' : 'Model passport')}
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {!showAllProjects && filteredCount > 3 && (
                        <button
                            type="button"
                            data-testid="projects-more"
                            onClick={() => setShowAllProjects(true)}
                            className="mt-5 min-h-[48px] px-8 rounded-lg bg-transparent border border-[#11161B] text-[#11161B] font-bold text-sm hover:bg-white transition cursor-pointer"
                        >
                            {content.projects_section.show_more.replace('{n}', String(filteredCount))}
                        </button>
                    )}
                </div>
            </section>
            <section id={content.conversion_section.anchor_id} className="scroll-mt-24 bg-white border-y border-[#E2DDD3]">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <p className="text-xs font-bold text-[#C2410C]">{content.conversion_section.eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.conversion_section.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Link href={content.conversion_section.cta.href.replace('/lt/', `/${locale}/`)} className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-[#C2410C] text-white font-bold text-sm hover:brightness-110 transition">
                            {content.conversion_section.cta.label}
                        </Link>
                    </div>

                    <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4">
                        {kits.map((k) => (
                            <article key={k.code} data-testid="kit-card" className="flex flex-col rounded-xl bg-[#F5F3EE] border border-[#E2DDD3] p-4 min-w-[260px] snap-start sm:min-w-0">
                                <p className="font-mono text-xs font-bold text-[#C2410C]">{k.code}</p>
                                <h3 className="mt-1 text-sm font-extrabold leading-snug">{k.title}</h3>
                                <p className="text-xs text-[#5B6470] mt-0.5">{k.brand} · {k.range_kw} kW</p>
                                <ul className="mt-3 space-y-1 text-xs text-[#2A323B]">
                                    {k.items.map((it) => (
                                        <li key={it} className="leading-snug">{it}</li>
                                    ))}
                                </ul>
                                <div className="mt-auto pt-3">
                                    <p className="text-xs text-[#5B6470]">{locale === 'lt' ? 'Su montavimu, su PVM' : locale === 'en' ? 'With installation, incl VAT' : locale === 'pl' ? 'Z montażem, z VAT' : 'С монтажом, с НДС'}</p>
                                    <p className="text-xl font-extrabold text-[#11161B]">{k.price_eur_incl_vat.toLocaleString('lt-LT')} €</p>
                                    <Link
                                        href={`/${locale}/vedlys?kit=${k.code}`}
                                        data-testid={`kit-link-${k.code}`}
                                        className="mt-2 w-full min-h-[48px] inline-flex items-center justify-center rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm px-4 transition"
                                    >
                                        {locale === 'lt' ? 'Parinkti komplektą' : locale === 'en' ? 'Configure this kit' : locale === 'pl' ? 'Skonfiguruj zestaw' : 'Подобрать комплект'}
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    <h3 className="mt-10 text-lg font-extrabold">{content.conversion_section.compat_title}</h3>
                    <p className="mt-1 text-sm text-[#5B6470]">{content.conversion_section.compat_hint}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {compat.map((b) => (
                            <a
                                key={b.slug}
                                href={b.vedlys.replace('/lt/', `/${locale}/`)}
                                data-testid="compat-card"
                                className="block rounded-xl bg-[#F5F3EE] border border-[#E2DDD3] p-4 hover:border-[#11161B] transition-colors"
                            >
                                <p className="text-sm font-extrabold leading-snug">{b.brand}</p>
                                <p className="text-xs text-[#5B6470] mt-1">{b.type} · {b.range_kw} kW</p>
                                <p className="text-xs text-[#2A323B] mt-2 leading-snug">{b.door}</p>
                                <p className="text-xs text-[#2A323B] mt-1 leading-snug">{b.burner}</p>
                                <p className="mt-2 text-xs font-bold text-[#C2410C]">
                                    {locale === 'lt' ? 'Tikrinti suderinamumą' : locale === 'en' ? 'Check compatibility' : locale === 'pl' ? 'Sprawdź zgodność' : 'Проверить совместимость'}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="scroll-mt-24">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <p className="text-xs font-bold text-[#C2410C]">{content.process.eyebrow}</p>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.process.title}</h2>
                    <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {content.process.steps.map((st) => (
                            <li key={st.n} className="rounded-xl bg-white border border-[#E2DDD3] p-4">
                                <p className="font-mono text-xs font-bold text-[#C2410C]">{st.n}</p>
                                <p className="mt-1.5 text-sm font-extrabold leading-snug">{st.t}</p>
                                <p className="mt-1 text-xs text-[#5B6470] leading-snug">{st.d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="bg-white border-y border-[#E2DDD3]">
                <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 lg:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-extrabold leading-tight">{content.commitments.title}</h2>
                        <ul className="mt-4 space-y-2.5">
                            {content.commitments.items.map((c) => (
                                <li key={c} className="flex gap-2.5 text-sm text-[#2A323B] leading-relaxed">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#C2410C] shrink-0" aria-hidden="true" />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold leading-tight">{locale === 'lt' ? 'Dažnai klausiama' : locale === 'en' ? 'FAQ' : locale === 'pl' ? 'FAQ' : 'Вопросы'}</h2>
                        <div className="mt-4 divide-y divide-[#E2DDD3]">
                            {content.faq.map((f) => (
                                <details key={f.q} className="group py-3">
                                    <summary className="text-sm font-bold cursor-pointer list-none flex justify-between gap-3">
                                        {f.q}
                                        <span className="text-[#C2410C] font-extrabold group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                                    </summary>
                                    <p className="mt-2 text-sm text-[#2A323B] leading-relaxed">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id={content.project_form.anchor_id} className="scroll-mt-24 bg-[#11161B] text-[#F5F3EE]">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <div className="grid gap-8 lg:grid-cols-2 items-start">
                        <div>
                            <p className="text-xs font-bold text-[#FF8A3D]">{content.project_form.eyebrow}</p>
                            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold leading-tight">{content.project_form.title}</h2>
                            <p className="mt-2 text-sm text-[#C9D0D8]">{content.project_form.note}</p>
                            <div className="mt-6 space-y-3 text-sm">
                                {content.contacts.office && (
                                    <p className="text-[#C9D0D8]">{content.contacts.office.phone} · {content.contacts.office.email} · {content.contacts.office.hours}</p>
                                )}
                                {content.locations.map((l) => (
                                    <p key={l.label} className="text-[#C9D0D8]">
                                        <span className="font-bold text-[#F5F3EE]">{l.label}:</span> {l.address}
                                    </p>
                                ))}
                            </div>
                        </div>
                        {quoteTicket ? (
                            <div data-testid="quote-success" className="rounded-xl bg-[#1B232C] border border-[#2C3742] p-6">
                                <p className="text-lg font-extrabold text-[#FF8A3D]">{formCfg.success.replace('{id}', quoteTicket)}</p>
                                <button type="button" onClick={() => setQuoteTicket(null)} className="mt-4 min-h-[44px] px-5 rounded-lg bg-[#F5F3EE] text-[#11161B] font-bold text-sm hover:bg-white transition cursor-pointer">
                                    {content.project_form.submit}
                                </button>
                            </div>
                        ) : (
                            <form data-testid="quote-form" onSubmit={submitQuoteForm} className="rounded-xl bg-[#1B232C] border border-[#2C3742] p-4 sm:p-6 space-y-3">
                                <label className="block">
                                    <span className="block text-xs font-bold text-[#C9D0D8] mb-1">{locale === 'lt' ? 'Darbo rūšis' : locale === 'en' ? 'Type of work' : locale === 'pl' ? 'Rodzaj prac' : 'Вид работ'}</span>
                                    <select value={quoteType} onChange={(e) => setQuoteType(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 text-sm text-[#F5F3EE] cursor-pointer">
                                        {content.project_form.types.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#C9D0D8] mb-1">{formCfg.fields.find((f) => f.id === 'name')?.label} *</span>
                                        <input type="text" required minLength={2} autoComplete="name" value={quoteName} onChange={(e) => setQuoteName(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 text-sm text-[#F5F3EE] focus:outline-none focus:border-[#FF8A3D]" />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-[#C9D0D8] mb-1">{formCfg.fields.find((f) => f.id === 'phone')?.label} *</span>
                                        <input type="tel" required minLength={5} placeholder="+370" value={quotePhone} onChange={(e) => setQuotePhone(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]" />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="block text-xs font-bold text-[#C9D0D8] mb-1">{formCfg.fields.find((f) => f.id === 'city')?.label}</span>
                                    <input type="text" placeholder={formCfg.fields.find((f) => f.id === 'city')?.placeholder} value={quoteCity} onChange={(e) => setQuoteCity(e.target.value)} className="w-full min-h-[44px] rounded-sm bg-[#0E1216] border border-[#2C3742] px-3 text-sm text-[#F5F3EE] placeholder-[#A3ADB8] focus:outline-none focus:border-[#FF8A3D]" />
                                </label>
                                {quoteNetworkError && (
                                    <p data-testid="quote-network-error" className="text-sm font-semibold text-[#FF8A3D]" role="alert">
                                        Nepavyko išsiųsti. Patikrinkite ryšį ir bandykite dar kartą, arba skambinkite +370 611 19158.
                                    </p>
                                )}
                                <button type="submit" disabled={quoteSending} className="w-full min-h-[52px] rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm transition cursor-pointer disabled:opacity-60">
                                    {content.project_form.submit}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* W124-A1 (F4.1): prilipęs serviso mygtukas telefone, slepiamas kai #servisas matomas */}
            {!serviceFormVisible && (
                <a
                    href="#servisas"
                    data-testid="mobile-service-cta"
                    className="fixed bottom-4 inset-x-4 lg:hidden z-40 min-h-[52px] leading-[52px] text-center rounded-lg bg-[#C2410C] hover:brightness-110 text-white font-bold text-sm shadow-lg"
                >
                    {locale === 'lt' ? 'Iškviesti servisą' : locale === 'en' ? 'Call service' : locale === 'pl' ? 'Wezwij serwis' : 'Вызвать сервис'}
                </a>
            )}
            <InstantDealDrawerMount locale={locale} />
        </div>
    );
}
