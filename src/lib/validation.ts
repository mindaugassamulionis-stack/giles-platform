import { z } from 'zod';

export const checkoutSchema = z.object({
    email: z.string().email('Neteisingas el. pašto adresas'),
    items: z.array(z.object({
        sku: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
    })).min(1, 'Krepšelis negali būti tuščias'),
});

export const contactSchema = z.object({
    name: z.string().min(2, 'Vardas per trumpas'),
    email: z.string().email('Neteisingas el. pašto adresas'),
    subject: z.string().min(5, 'Tema per trumpa'),
    message: z.string().min(10, 'Žinutė per trumpa'),
});

export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Žinutė negali būti tuščia').max(1000, 'Žinutė per ilga'),
});
