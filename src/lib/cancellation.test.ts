import { describe, test, expect } from 'vitest';
import {
    buildCancellationConfirmation,
    cancellationEmailVariables,
    type CancellationContext,
} from './cancellation';

const ctx: CancellationContext = {
    orderRef: 'ORD-12345',
    customerEmail: 'kunde@example.de',
    cancelledAt: new Date('2011-05-03T10:30:00Z'),
};

describe('buildCancellationConfirmation (DE / §356a statutory content)', () => {
    const c = buildCancellationConfirmation('de', ctx);

    test('confirms the cancellation was received (statutory acknowledgement)', () => {
        // §356a requires the trader confirm receipt of the cancellation
        // on a durable medium, stating the content and date.
        expect(c.heading).toMatch(/gekündigt|Kündigung/i);
        expect(c.body).toMatch(/bestätigen|erhalten/i);
    });

    test('includes the contract/order reference', () => {
        expect(c.body).toContain('ORD-12345');
    });

    test('includes the effective cancellation date', () => {
        expect(c.body).toContain('03.05.2011');
    });

    test('is written in German', () => {
        expect(c.language).toBe('de');
        expect(c.heading).not.toMatch(/cancellation confirmed/i);
    });
});

describe('buildCancellationConfirmation (LT fallback)', () => {
    const c = buildCancellationConfirmation('lt', ctx);

    test('is written in Lithuanian, not German', () => {
        expect(c.language).toBe('lt');
        expect(c.heading).toMatch(/atšauk|nutrauk/i);
    });

    test('still carries the order reference and date', () => {
        expect(c.body).toContain('ORD-12345');
        expect(c.body).toContain('2011');
    });
});

describe('cancellationEmailVariables', () => {
    test('produces template variables for the DB email template', () => {
        const vars = cancellationEmailVariables('de', ctx);
        // Variables map onto {{...}} placeholders in the Admin-editable template.
        expect(vars.orderRef).toBe('ORD-12345');
        expect(vars.cancelledDate).toBe('03.05.2011');
        expect(vars.customerEmail).toBe('kunde@example.de');
        expect(typeof vars.heading).toBe('string');
        expect(vars.heading.length).toBeGreaterThan(0);
    });
});
