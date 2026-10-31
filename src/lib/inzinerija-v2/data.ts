import type { AppLocale } from '../../i18n/routing';
import { INDUSTRIAL_MODELS_FILE } from '../pramonei-v2/data';
import rawServices from '../../data/inzinerija-v2/services.lt.json';
import rawKits from '../../data/inzinerija-v2/kits.lt.json';
import rawCompat from '../../data/inzinerija-v2/compatibility.lt.json';
import rawProjects from '../../data/inzinerija-v2/projects.lt.json';
import rawContent from '../../data/inzinerija-v2/inzinerija-content.lt.json';
import rawForm from '../../data/inzinerija-v2/service-form.lt.json';
import type { Service, Kit, BoilerCompat, Project, ProjectCategory } from './types';
import { SERVICE_I18N, CONTENT_I18N, PROJECT_CATEGORY_I18N, FORM_I18N } from './i18n';

export { SERVICE_I18N, CONTENT_I18N, PROJECT_CATEGORY_I18N, FORM_I18N };

export const INZINERIJA_SERVICES_FILE = rawServices;
export const INZINERIJA_KITS_FILE = rawKits;
export const INZINERIJA_COMPATIBILITY_FILE = rawCompat;
export const INZINERIJA_PROJECTS_FILE = rawProjects;
export const INZINERIJA_CONTENT_FILE = rawContent;
export const INZINERIJA_FORM_FILE = rawForm;

export type InzinerijaContent = typeof rawContent;
export type FormConfig = typeof rawForm;

function formatEurLt(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Service 05 kaina skaičiuojama iš Pramonei v2 modelių (vienas šaltinis, be hardcode). */
export function getIndustrialPriceLabel(locale: AppLocale): string {
    const buyPrices = INDUSTRIAL_MODELS_FILE.models
        .map((m) => m.price_net_eur?.value)
        .filter((v): v is number => typeof v === 'number' && v > 0);
    const rentPrices = INDUSTRIAL_MODELS_FILE.models
        .map((m) => m.rent_net_eur_month?.value)
        .filter((v): v is number => typeof v === 'number' && v > 0);
    const minBuy = buyPrices.length ? Math.min(...buyPrices) : 28500;
    const minRent = rentPrices.length ? Math.min(...rentPrices) : 700;
    const buy = formatEurLt(minBuy);
    const rent = formatEurLt(minRent);
    switch (locale) {
        case 'en':
            return `from ${buy} € or ${rent} €/mo. ex VAT`;
        case 'pl':
            return `od ${buy} € lub ${rent} €/mies. bez VAT`;
        case 'ru':
            return `от ${buy} € или ${rent} €/мес. без НДС`;
        default:
            return `nuo ${buy} € arba ${rent} €/mėn. be PVM`;
    }
}

export function getLocalizedInzinerijaServices(locale: AppLocale): Service[] {
    const t = locale === 'lt' ? null : SERVICE_I18N[locale];
    const dynamic05 = getIndustrialPriceLabel(locale);
    return rawServices.services.map((s, i): Service => ({
        id: s.id,
        n: String(i + 1).padStart(2, '0'),
        eyebrow: t?.services[s.id]?.eyebrow ?? s.eyebrow,
        title: t?.services[s.id]?.title ?? s.title,
        text: t?.services[s.id]?.text ?? s.text,
        points: t?.services[s.id]?.points ?? s.points,
        term: t?.services[s.id]?.term ?? s.term,
        price: {
            label: s.id === 'konteinerines' ? dynamic05 : (t?.services[s.id]?.price ?? s.price.label),
            value_eur: s.price.value_eur ?? null,
            vat: (s.price.vat ?? null) as import('./types').Vat,
            source: s.price.source,
        },
        cta: { label: t?.services[s.id]?.cta ?? s.cta.label, href: s.cta.href },
        image: s.image,
        image_alt: s.image_alt,
    }));
}

export function getLocalizedInzinerijaKits(locale: AppLocale): (Kit & { note?: string })[] {
    const t = locale === 'lt' ? null : SERVICE_I18N[locale];
    return rawKits.kits.map((k) => ({
        ...k,
        title: t?.kitPrefix ? `${t.kitPrefix} ${k.range_kw} kW` : k.title,
    }));
}

export function getLocalizedInzinerijaCompatibility(locale: AppLocale): BoilerCompat[] {
    return rawCompat.boilers;
}

export function getLocalizedInzinerijaProjects(locale: AppLocale): Project[] {
    const catLabels = locale === 'lt' ? null : PROJECT_CATEGORY_I18N[locale];
    return rawProjects.projects.map((p): Project => ({
        ...p,
        category: p.category as ProjectCategory,
        category_label: catLabels?.[p.category as ProjectCategory] ?? p.category_label,
    }));
}

export function getInzinerijaContent(locale: AppLocale): InzinerijaContent {
    if (locale === 'lt') return rawContent;
    const t = CONTENT_I18N[locale];
    if (!t) return rawContent;
    return {
        ...rawContent,
        seo: { ...rawContent.seo, title: t.seoTitle, description: t.seoDescription },
        breadcrumb: t.breadcrumb,
        hero: {
            ...rawContent.hero,
            eyebrow: t.heroEyebrow,
            h1: t.heroH1,
            lead: t.heroLead,
            paths: rawContent.hero.paths.map((p, i) => ({
                ...p,
                title: t.paths[i].title,
                sub: t.paths[i].sub,
            })),
        },
        trust: rawContent.trust.map((tr, i) => ({ ...tr, label: t.trust[i] })),
        brands_label: t.brandsLabel,
        services_section: { ...rawContent.services_section, title: t.servicesTitle },
        service_section: {
            ...rawContent.service_section,
            title: t.serviceTitle,
            lead: t.serviceLead,
        },
        a01: { ...rawContent.a01, title: t.a01Title, steps: t.a01Steps },
        projects_section: { ...rawContent.projects_section, title: t.projectsTitle, lead: t.projectsLead },
        conversion_section: {
            ...rawContent.conversion_section,
            title: t.conversionTitle,
            cta: { ...rawContent.conversion_section.cta, label: t.conversionCta },
            compat_title: t.compatTitle,
            compat_hint: t.compatHint,
        },
        process: { ...rawContent.process, title: t.processTitle, steps: t.processSteps },
        commitments: { ...rawContent.commitments, title: t.commitmentsTitle, items: t.commitments },
        faq: t.faq.map((f, i) => ({ q: f.q, a: f.a })),
        project_form: {
            ...rawContent.project_form,
            title: t.formTitle,
            submit: t.formSubmit,
            note: t.formNote,
            types: t.formTypes,
        },
    };
}

export function getServiceFormConfig(locale: AppLocale): FormConfig {
    if (locale === 'lt') return rawForm;
    const t = FORM_I18N[locale];
    if (!t) return rawForm;
    return {
        ...rawForm,
        urgency: rawForm.urgency.map((u, i) => ({ ...u, label: t.urgency[i].label, sub: t.urgency[i].sub })),
        types: rawForm.types.map((ty, i) => ({ ...ty, label: t.types[i] })),
        submit: t.submit,
        success: t.success,
        fields: rawForm.fields.map((f) => ({
            ...f,
            label: t.fieldLabels[f.id] ?? f.label,
            placeholder: t.fieldPlaceholders[f.id] ?? f.placeholder,
        })) as FormConfig['fields'],
        notes_by_urgency: { ...rawForm.notes_by_urgency, ...t.notes },
    };
}
