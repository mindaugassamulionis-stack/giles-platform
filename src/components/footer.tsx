'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Phone, Mail, MapPin } from 'lucide-react';
import { HVAC_SYSTEM_GROUPS } from '../lib/v3-description';
import { GilesBrandLogo } from './giles-logo';
import { EmailLink } from './email';
import { assetUrl } from '../lib/api';
import {
    GILES_COMPANY_IDENTITY,
    GILES_PATENTED_MARK_TRANSPARENT_PATH,
} from '../lib/giles-masterpiece-data';
import { FOOTER_UI_COPY, resolveAppLocale } from '../i18n/storefront-ui-copy';
import { localizeCategoryLabel } from '../lib/product-i18n';
import { useStorefrontConfig } from './storefront-config-provider';
import { formatCatalogCount } from '../lib/w121-honest-commerce';

type StorefrontSettings = {
    branding?: { name?: string };
    footer?: Record<string, unknown>;
};

export function Footer(_props: { settings?: StorefrontSettings }) {
    const rawPathname = usePathname() || '/lt';
    const intlLocale = useLocale();
    const urlLocaleMatch = rawPathname.match(/^\/(lt|en|pl|ru)(?=\/|$)/i);
    const locale = resolveAppLocale(urlLocaleMatch ? urlLocaleMatch[1] : intlLocale);
    const copy = FOOTER_UI_COPY[locale];
    const catalogSkuCount = useStorefrontConfig().catalog?.skuCount ?? 0;
    const storeHeading = copy.storeHeading.replace('{count}', formatCatalogCount(catalogSkuCount, locale));

    return (
        <footer className="bg-[#0B0F13] text-[#C9D0D8] border-t border-[#232D37] text-sm overflow-x-clip">
            <img
                src={assetUrl(GILES_PATENTED_MARK_TRANSPARENT_PATH)}
                alt=""
                aria-hidden="true"
                width={44}
                height={44}
                className="hidden"
            />
            <div className="mx-auto max-w-7xl px-4 md:px-6 pt-6 pb-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    {/* Column 1: Patented Original Logo & Legal Entity Details */}
                    <div className="lg:col-span-4 space-y-3">
                        <Link href={`/${locale}`} className="inline-flex items-center whitespace-nowrap">
                            <GilesBrandLogo variant="dark" />
                        </Link>
                        <div className="space-y-1.5 text-xs text-[#C9D0D8] leading-relaxed">
                            <p className="font-semibold text-white">
                                {GILES_COMPANY_IDENTITY.legalName}
                            </p>
                            <p>
                                {copy.companyCodeLabel}: {GILES_COMPANY_IDENTITY.companyCode} · {copy.vatLabel}: {GILES_COMPANY_IDENTITY.vatCode}
                            </p>
                            <p className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                                <span>{GILES_COMPANY_IDENTITY.address}</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                                <span>
                                    Darius:{' '}
                                    <a
                                        href="tel:+37061119158"
                                        className="text-white font-semibold hover:text-[#FF8A3D] whitespace-nowrap"
                                    >
                                        +370 611 19158
                                    </a>{' '}
                                    ·{' '}
                                    <a
                                        href="tel:+37037332234"
                                        className="text-white hover:text-[#FF8A3D] whitespace-nowrap"
                                    >
                                        +370 37 332234
                                    </a>
                                </span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                                <span>
                                    <EmailLink
                                        email="info@gilesinzinerija.lt"
                                        className="text-white hover:text-[#FF8A3D] whitespace-nowrap"
                                    />
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Parduotuvė (HVAC_SYSTEM_GROUPS) */}
                    <div className="lg:col-span-3 space-y-2">
                        <h3 className="font-semibold text-white text-sm">{storeHeading}</h3>
                        <ul className="space-y-1 text-xs text-[#C9D0D8]">
                            {HVAC_SYSTEM_GROUPS.slice(0, 6).map((group) => {
                                const localizedGroupTitle = localizeCategoryLabel(
                                    group.title,
                                    locale,
                                ).replace(/\u2014/g, '–');
                                return (
                                    <li key={group.id} className="truncate">
                                        <Link
                                            href={`/${locale}/products?category=${encodeURIComponent(group.title)}`}
                                            className="hover:text-white transition-colors whitespace-nowrap"
                                        >
                                            {localizedGroupTitle}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Column 3: Sprendimai (Artboard #1 Footer) */}
                    <div className="lg:col-span-3 space-y-2">
                        <h3 className="font-semibold text-white text-sm">{copy.solutionsHeading}</h3>
                        <ul className="space-y-1 text-xs text-[#C9D0D8]">
                            <li>
                                <Link href={`/${locale}/vedlys`} className="hover:text-white whitespace-nowrap">
                                    {copy.wizardLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/pramonei`} className="hover:text-white whitespace-nowrap">
                                    {copy.containersLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/inzinerija`} className="hover:text-white whitespace-nowrap">
                                    {copy.engineeringLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/b2b`} className="hover:text-white whitespace-nowrap">
                                    {copy.b2bLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/paketai`} className="hover:text-white whitespace-nowrap">
                                    {copy.packagesLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/skaiciuokle`} className="hover:text-white whitespace-nowrap">
                                    {copy.calculatorLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/mcp-jungtis`} className="text-[#FF8A3D] font-semibold hover:text-white whitespace-nowrap">
                                    {copy.mcpBridgeLink}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Pirkėjams (Artboard #1 Footer) */}
                    <div className="lg:col-span-2 space-y-2">
                        <h3 className="font-semibold text-white text-sm">{copy.buyersHeading}</h3>
                        <ul className="space-y-1 text-xs text-[#C9D0D8]">
                            <li>
                                <Link href={`/${locale}/pristatymas-ir-grazinimas`} className="hover:text-white whitespace-nowrap">
                                    {copy.deliveryLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/pirkimo-taisykles`} className="hover:text-white whitespace-nowrap">
                                    {copy.termsLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/privatumo-politika`} className="hover:text-white whitespace-nowrap">
                                    {copy.privacyLink}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/kontaktai`} className="hover:text-white whitespace-nowrap">
                                    {copy.contactsLink}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-[#232D37] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8E99A5]">
                    <span>
                        {copy.bottomCopyright}
                    </span>
                    <span>
                        {copy.bottomPayments}
                    </span>
                </div>
            </div>
        </footer>
    );
}
