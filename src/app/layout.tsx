import { Schibsted_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { clsx } from 'clsx';
import './globals.css';

const schibstedGrotesk = Schibsted_Grotesk({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-schibsted',
    display: 'swap',
});

const interFont = Inter({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-inter',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600'],
    variable: '--font-jetbrains-mono',
    display: 'swap',
});

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    return (
        <html
            lang={locale}
            suppressHydrationWarning
            className={clsx(
                schibstedGrotesk.variable,
                interFont.variable,
                jetbrainsMono.variable,
                'lenis',
            )}
        >
            <body className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-white">
                {children}
            </body>
        </html>
    );
}
