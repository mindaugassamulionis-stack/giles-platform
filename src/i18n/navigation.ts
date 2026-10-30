import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation: Link/useRouter/usePathname/redirect auto-compose
// the active locale below the Next basePath (/aurora/lt/...).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
