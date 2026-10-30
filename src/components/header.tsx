// W35-A1 & W64-A3: Header re-exports Navbar with "INŽINERINĖS SKAIČIUOKLĖS" (/skaiciuokle),
// "Sisteminiai paketai" (/${locale}/paketai) and "Inžinerija ir montavimas" (/${locale}/inzinerija) top navigation links.
export const HEADER_PACKAGE_LINKS = [
    { href: '/paketai', label: 'Sisteminiai paketai' },
    { href: '/inzinerija', label: 'Inžinerija ir montavimas' },
] as const;
export { Navbar, Navbar as Header } from './navbar';
