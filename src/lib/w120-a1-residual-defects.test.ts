import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// W120-A1 regression guards for the four residual defects the independent
// verifier measured in W119-V1 (P2-16, P2-7, P2-14, P1-4). Source-level checks
// keep the fixed copy/markup from silently regressing in a later sweep.

const src = (...parts: string[]) =>
    readFileSync(join(__dirname, '..', 'app', '[locale]', ...parts), 'utf-8');
const components = (name: string) => readFileSync(join(__dirname, '..', 'components', name), 'utf-8');
const globalsCss = () => readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf-8');

describe('W120-A1 P1-4: home power range follows the verified facts', () => {
    const home = src('page.tsx');

    it('contains no unverified 150–500 kW range in any locale', () => {
        expect(home).not.toContain('150–500 kW');
        expect(home).not.toContain('150-500 kW');
        expect(home).not.toContain('150–500 кВт');
        expect(home).not.toContain('150-500 кВт');
    });

    it('uses the verified series range in every locale (W118-r2 facts)', () => {
        expect(home).toContain('Konteinerinės katilinės 100 kW – 2,5 MW');
        expect(home).toContain('Containerized Boiler Plants 100 kW – 2.5 MW');
        expect(home).toContain('Kotłownie kontenerowe 100 kW – 2,5 MW');
        expect(home).toContain('Контейнерные котельные 100 кВт – 2,5 МВт');
    });

    it('describes GK-500 by its own verified output (500 kW) in image alt', () => {
        expect(home).toContain('GK-500 konteinerinė katilinė, 500 kW');
        expect(home).toContain('GK-500 containerized boiler plant, 500 kW');
    });
});

describe('W120-A1 P2-7: kontaktai and returns wrap every i18n email', () => {
    it('contact page renders every email-bearing translation through TextWithEmail', () => {
        const contact = src('contact', 'page.tsx');
        const wrapped = contact.match(/TextWithEmail[^/]*?text=\{t\('contactPage\.[a-zA-Z]+'\)\}/g) || [];
        expect(wrapped.length).toBe(6);
    });

    it('returns page renders step1 and defect1 through TextWithEmail', () => {
        const returns = src('returns', 'page.tsx');
        expect(returns).toContain("TextWithEmail text={t('legalReturns.step1')}");
        expect(returns).toContain("TextWithEmail text={t('legalReturns.defect1')}");
    });
});

describe('W120-A1 P2-16: launcher never sits under the cookie banner', () => {
    it('CookieConsent publishes the live banner height as a CSS variable', () => {
        expect(components('CookieConsent.tsx')).toContain('--cookie-banner-h');
    });

    it('banner height is re-published on font-swap reflow, not only window resize', () => {
        // A webfont load grows the banner after publish; window "resize"
        // never fires for that, so a stale variable parks the launcher
        // 15px under the banner on 390px screens.
        expect(components('CookieConsent.tsx')).toContain('ResizeObserver');
    });

    it('Vytautas widget anchors above the banner via that variable', () => {
        expect(components('vytautas-assistant-widget.tsx')).toContain('var(--cookie-banner-h,1rem)');
    });

    it('globals.css :has() override uses the live variable, not a fixed rem offset', () => {
        const rule = globalsCss().match(/body:has\(#cookie-consent-banner\)\s+#vytautas-launcher\s*{[^}]*}/g) || [];
        expect(rule.length).toBe(1);
        expect(rule[0]).toContain('var(--cookie-banner-h, 12rem)');
        expect(rule[0]).not.toMatch(/bottom:\s*\d+(\.\d+)?rem\s*;/);
    });
});

describe('W120-A1 P2-14: PDP renders LT decimal commas and a clean hook', () => {
    const pdp = src('products', '[id]', 'page.tsx');

    it('applies formatLtDecimalCommas to the visible hook', () => {
        expect(pdp).toContain('formatLtDecimalCommas');
    });

    it('applies formatLtDecimalCommas to the LT <title>, H1, hook excerpt, and hook fallback', () => {
        expect(pdp.match(/formatLtDecimalCommas/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    });
});
