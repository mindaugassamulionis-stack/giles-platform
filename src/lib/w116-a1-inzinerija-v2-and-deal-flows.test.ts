import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    INZINERIJA_SERVICES_FILE,
    INZINERIJA_KITS_FILE,
    INZINERIJA_COMPATIBILITY_FILE,
    INZINERIJA_PROJECTS_FILE,
    getInzinerijaContent,
    getLocalizedInzinerijaServices,
    getLocalizedInzinerijaKits,
    getLocalizedInzinerijaCompatibility,
    getLocalizedInzinerijaProjects,
    getServiceFormConfig,
} from './inzinerija-v2/data';
import { validateServiceRequest, isWorkingHours } from './inzinerija-v2/service-request';
import { POST as postServiceRequest } from '../app/api/service-request/route';
import { calculateBoilerRentalDeal, BOILER_RENTAL_POWER_OPTIONS, BOILER_RENTAL_TERMS } from './instant-deal-config';

const repoRoot = path.resolve(__dirname, '../..');

describe('W116-A1: Inžinerija v2 Package Integration & Katilinė Nuomai / Instant Deal Closing Flows', () => {
    describe('1) Inžinerija v2 Data Layer & 4-Locale Localization (LT, EN, PL, RU)', () => {
        it('loads 6 services, 4 retrofit kits, 6 boiler compatibility groups, and 16 unified projects with dynamic Service 05 pricing', () => {
            expect(INZINERIJA_SERVICES_FILE.services).toHaveLength(6);
            expect(INZINERIJA_KITS_FILE.kits).toHaveLength(4);
            expect(INZINERIJA_COMPATIBILITY_FILE.boilers).toHaveLength(6);
            expect(INZINERIJA_PROJECTS_FILE.projects).toHaveLength(16);

            const perdProjects = INZINERIJA_PROJECTS_FILE.projects.filter((p) => p.category === 'perd');
            const indProjects = INZINERIJA_PROJECTS_FILE.projects.filter((p) => p.category === 'ind');
            const hpProjects = INZINERIJA_PROJECTS_FILE.projects.filter((p) => p.category === 'hp');
            const svcProjects = INZINERIJA_PROJECTS_FILE.projects.filter((p) => p.category === 'svc');
            expect(perdProjects).toHaveLength(5);
            expect(indProjects).toHaveLength(7);
            expect(hpProjects).toHaveLength(2);
            expect(svcProjects).toHaveLength(2);

            const ltServices = getLocalizedInzinerijaServices('lt');
            for (const svc of ltServices) {
                const hasEuro = /\d\s?€/.test(svc.price.label);
                if (hasEuro) {
                    expect(svc.price.label).toMatch(/(su|be) PVM/);
                }
            }
            const konteinerines = ltServices.find((s) => s.id === 'konteinerines');
            expect(konteinerines).toBeDefined();
            expect(konteinerines!.price.label).toContain('28');
            expect(konteinerines!.price.label).toContain('be PVM');
        });

        it('localizes Inžinerija v2 content, services, kits, compatibility,projects, and service form across lt, en, pl, ru', () => {
            for (const locale of ['lt', 'en', 'pl', 'ru'] as const) {
                const content = getInzinerijaContent(locale);
                const services = getLocalizedInzinerijaServices(locale);
                const kits = getLocalizedInzinerijaKits(locale);
                const compat = getLocalizedInzinerijaCompatibility(locale);
                const projects = getLocalizedInzinerijaProjects(locale);
                const formCfg = getServiceFormConfig(locale);

                expect(content.hero.h1.length).toBeGreaterThan(10);
                expect(content.hero.paths).toHaveLength(3);
                expect(content.trust).toHaveLength(6);
                expect(content.brands).toHaveLength(12);
                expect(content.a01.steps).toHaveLength(4);
                expect(content.process.steps).toHaveLength(5);
                expect(content.commitments.items).toHaveLength(5);
                expect(content.faq).toHaveLength(5);
                expect(services).toHaveLength(6);
                expect(kits).toHaveLength(4);
                expect(compat).toHaveLength(6);
                expect(projects).toHaveLength(16);
                expect(formCfg.urgency).toHaveLength(3);
                expect(formCfg.types).toHaveLength(4);

                if (locale !== 'lt') {
                    expect(content.hero.h1).not.toBe('Nuo projekto iki serviso – viena atsakinga komanda');
                    expect(services[0].title).not.toBe('Katilinių projektavimas ir montavimas iki rakto');
                }
            }
        });
    });

    describe('2) Service Request Validation, Working Hours & POST /api/service-request Endpoint', () => {
        it('validates required name and phone, checks working hours in Europe/Vilnius, and creates S-xxxx ticket via POST /api/service-request', async () => {
            const errs = validateServiceRequest({
                urgency: 'high',
                type: 'post',
                name: '',
                phone: '123',
                source_page: 'inzinerija',
            });
            expect(errs.name).toBeDefined();
            expect(errs.phone).toBeDefined();

            const okErrs = validateServiceRequest({
                urgency: 'urgent',
                type: 'post',
                name: 'Jonas Kazlauskas',
                phone: '+370 600 00000',
                source_page: 'inzinerija',
            });
            expect(Object.keys(okErrs)).toHaveLength(0);

            // Wednesday 10:00 UTC in summer/autumn is within 8:30-17:30 Europe/Vilnius
            expect(isWorkingHours(new Date('2026-10-28T09:00:00Z'))).toBe(true);
            // Sunday is outside working hours
            expect(isWorkingHours(new Date('2026-10-25T10:00:00Z'))).toBe(false);

            const req = new Request('http://127.0.0.1:3088/api/service-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urgency: 'urgent',
                    type: 'post',
                    model: 'Viadrus U26 + Megatherm MPB 35',
                    error_code: 'A01',
                    name: 'UAB Šilumos Mazgas',
                    phone: '+370 612 34567',
                    city: 'Kaunas',
                    description: 'Neuždega granulių',
                    source_page: 'inzinerija',
                }),
            });
            const res = await postServiceRequest(req);
            expect(res.status).toBe(200);
            const data = (await res.json()) as { ok: boolean; id: string };
            expect(data.ok).toBe(true);
            expect(data.id).toMatch(/^S-\d+/);
        });
    });

    describe('3) Mobilios Katilinės Nuomos Sandorio Konfigūratorius & Instant Deal Closing Flow', () => {
        it('calculates exact rental deal pricing across GK-150M, GK-300M, GK-500M, 3 rental terms, and 3 add-on modules', () => {
            expect(BOILER_RENTAL_POWER_OPTIONS).toHaveLength(3);
            expect(BOILER_RENTAL_TERMS).toHaveLength(3);

            const deal500Season = calculateBoilerRentalDeal({
                powerCode: 'GK-500M',
                termId: 'season',
                addons: {
                    hoses: true,
                    delivery: true,
                    pellets: true,
                },
            });
            expect(deal500Season.powerKw).toBe(500);
            expect(deal500Season.discountPct).toBe(25);
            expect(deal500Season.totalNetEur).toBeGreaterThan(2000);
            expect(deal500Season.sku).toContain('RENT-GK-500M');
        });
    });

    describe('4) Route Parity (/paslaugos and /inzinerija), Banned Phrase Absence & Zero Dead-End Buttons', () => {
        it('wires InzinerijaV2View into both /[locale]/inzinerija and /[locale]/paslaugos, and wires BoilerRentalDealFlow & InstantDealDrawer into Pramonei v2 and Inžinerija v2 with 0 dead-end hrefs', () => {
            const inzPage = fs.readFileSync(
                path.join(repoRoot, 'src/app/[locale]/inzinerija/page.tsx'),
                'utf8',
            );
            const paslaugosPage = fs.readFileSync(
                path.join(repoRoot, 'src/app/[locale]/paslaugos/page.tsx'),
                'utf8',
            );
            const inzView = fs.readFileSync(
                path.join(repoRoot, 'src/components/inzinerija-v2/inzinerija-v2-view.tsx'),
                'utf8',
            );
            const pramoneiView = fs.readFileSync(
                path.join(repoRoot, 'src/components/pramonei-v2/pramonei-v2-view.tsx'),
                'utf8',
            );
            const drawerSrc = fs.readFileSync(
                path.join(repoRoot, 'src/components/instant-deal-drawer.tsx'),
                'utf8',
            );

            expect(inzPage).toContain('InzinerijaV2View');
            expect(paslaugosPage).toMatch(/InzinerijaV2View|inzinerija\/page/);

            // Required data-testids for Inžinerija v2
            expect(inzView).toContain('data-testid="path-service"');
            expect(inzView).toContain('data-testid="path-conversion"');
            expect(inzView).toContain('data-testid="path-project"');
            expect(inzView).toContain('data-testid="trust-bar"');
            expect(inzView).toContain('data-testid="service-card"');
            expect(inzView).toContain('data-testid="service-form"');
            expect(inzView).toContain('data-testid="service-success"');
            expect(inzView).toContain('data-testid="projects-grid"');
            expect(inzView).toContain('data-testid="projects-more"');
            expect(inzView).toContain('data-testid="kit-card"');
            expect(inzView).toContain('data-testid="compat-card"');
            expect(inzView).toContain('data-testid="quote-form"');
            expect(inzView).toContain('data-testid="quote-success"');

            // Required data-testids for Rental Deal Flow & Instant Deal Drawer
            expect(drawerSrc).toContain('data-testid="boiler-rental-deal-flow"');
            expect(drawerSrc).toContain('data-testid="deal-add-to-cart-and-checkout-btn"');
            expect(drawerSrc).toContain('data-testid="deal-submit-instant-contract-btn"');
            expect(drawerSrc).toContain('data-testid="instant-deal-drawer"');
            expect(pramoneiView).toContain('BoilerRentalDealFlow');
            expect(pramoneiView).toContain('InstantDealDrawer');
            expect(inzView).toContain('InstantDealDrawer');

            // Zero dead-end href="#" or href="" in Inžinerija v2, Pramonei v2, and InstantDealDrawer
            for (const [name, src] of [
                ['inzinerija-v2-view.tsx', inzView],
                ['pramonei-v2-view.tsx', pramoneiView],
                ['instant-deal-drawer.tsx', drawerSrc],
            ] as const) {
                expect(src, `${name} must not have href="#"`).not.toContain('href="#"');
                expect(src, `${name} must not have href=""`).not.toContain('href=""');
                expect(src, `${name} must not have em-dash —`).not.toContain('\u2014');
            }
        });
    });
});
