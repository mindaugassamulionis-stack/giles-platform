import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('WP-W100-A1: Zero-Overlap Responsive Header & Warm Cream (#F5F3EE) Default + Šviesus/Tamsus Theme Switcher', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const navbarPath = path.join(repoRoot, 'src/components/navbar.tsx');
    const logoPath = path.join(repoRoot, 'src/components/giles-logo.tsx');

    it('1) GilesBrandLogo supports variant="light" (default warm cream header) and variant="dark" without #8C3061 purple', () => {
        const logoSrc = fs.readFileSync(logoPath, 'utf8');

        expect(logoSrc).toContain('GILES_PATENTED_MARK_TRANSPARENT_PATH');
        expect(logoSrc).not.toContain('#8C3061');

        // Light variant tokens: GILĖS in #11161B, INŽINERIJA in #5E8C1E, tagline in #5A6570
        expect(logoSrc).toContain("variant = 'light'");
        expect(logoSrc).toContain('text-[#11161B]');
        expect(logoSrc).toContain('text-[#5E8C1E]');
        expect(logoSrc).toContain('text-[#5A6570]');

        // Dark variant tokens: GILĖS in #F5F3EE, INŽINERIJA in #A9C83E, tagline in #A3ADB8
        expect(logoSrc).toContain('text-[#F5F3EE]');
        expect(logoSrc).toContain('text-[#A9C83E]');
        expect(logoSrc).toContain('text-[#A3ADB8]');
    });

    it('2) Navbar defaults to warm cream #F5F3EE (giles_header_theme_v1 = light) with interactive Šviesus / Tamsus toggle in 4 locales', () => {
        const navbarSrc = fs.readFileSync(navbarPath, 'utf8');

        expect(navbarSrc).toContain('giles_header_theme_v1');
        expect(navbarSrc).toContain('data-testid="navbar-theme-toggle"');
        expect(navbarSrc).toContain('data-testid="navbar-theme-light"');
        expect(navbarSrc).toContain('data-testid="navbar-theme-dark"');

        // Warm cream default surface (#F5F3EE) + dark mode surface (#0B0F13)
        expect(navbarSrc).toContain('bg-[#F5F3EE]');
        expect(navbarSrc).toContain('text-[#11161B]');
        expect(navbarSrc).toContain('border-[#DED8CC]');
        expect(navbarSrc).toContain('bg-[#0B0F13]');
        expect(navbarSrc).toContain('text-[#F5F3EE]');
        expect(navbarSrc).toContain('border-[#232D37]');

        // Renders GilesBrandLogo in both light and dark variants
        expect(navbarSrc).toContain('<GilesBrandLogo variant="light" />');
        expect(navbarSrc).toContain('<GilesBrandLogo variant="dark" />');

        // Localized theme labels in LT / EN / PL / RU
        expect(navbarSrc).toContain('Šviesus');
        expect(navbarSrc).toContain('Tamsus');
        expect(navbarSrc).toContain('Light');
        expect(navbarSrc).toContain('Dark');
        expect(navbarSrc).toContain('Jasny');
        expect(navbarSrc).toContain('Ciemny');
        expect(navbarSrc).toContain('Светлый');
        expect(navbarSrc).toContain('Темный');
    });

    it('3) Navbar eliminates element overlap by separating desktop nav links into a dedicated non-overlapping row and spacing utility items', () => {
        const navbarSrc = fs.readFileSync(navbarPath, 'utf8');

        // Zero absolute positioning of nav links
        expect(navbarSrc).not.toContain('left-1/2');
        expect(navbarSrc).not.toContain('-translate-x-1/2');

        // Dedicated desktop navigation strip so Logo + Search + Vytautas + Wishlist + Cart never collide with nav links
        expect(navbarSrc).toContain('data-testid="navbar-main-row"');
        expect(navbarSrc).toContain('data-testid="navbar-desktop-nav-row"');
        expect(navbarSrc).toContain('data-testid="navbar-utility-bar"');
    });
});
