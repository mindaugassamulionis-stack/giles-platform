import { redirect } from 'next/navigation';
import { defaultLocale } from '@platform/i18n';

// STAB-WP1 (storefront-stability-20260926): the bare basePath root (for
// example /suradai) is the one internal path where middleware does not run —
// Next.js skips middleware at the basePath root, so next-intl never gets the
// chance to redirect it to the default locale. Evidence: the deployed bare
// response carries no middleware CSP stamp while /suradai/lt does. This page
// closes that gap by redirecting to the default-locale home. redirect() is
// basePath-aware, so it lands on /suradai/lt. No DB access by design: the
// redirect must work even when the database is unreachable.
export default function RootPage() {
    redirect(`/${defaultLocale}`);
}
