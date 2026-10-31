import type { Metadata } from 'next';
import { getBrandName, withBrandSuffix } from '../../../lib/brand';

// W118-A2 finding 10: the cart page is a client component, so its title
// fell back to the layout default; give it a proper store-aware title here.
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: withBrandSuffix('Krepšelis', await getBrandName()),
        description:
            'Jūsų parinktos ŠVOK įrangos krepšelis: kainos su PVM ir be PVM, suderinamumo rekomendacijos ir atsiskaitymas.',
    };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
    return children;
}
