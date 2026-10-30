/**
 * LLM Client — WP-C1 re-export facade.
 *
 * Canonical implementation: packages/database/src/services/llm-client.ts
 * (single source of truth; this file is a pure re-export, zero logic —
 * replaces the previously vendored copy).
 * Accepts GROK_API_KEY || XAI_API_KEY; MOCK_LLM refused in production.
 */
export {
    llmComplete,
    llmCompleteJSON,
    llmAsk,
    llmCompleteWith,
    llmEmbed,
    assertProdMockLlmGuard,
} from '@platform/database';
export type { LLMMessage, LLMResponse, LLMOptions } from '@platform/database';
export type { LLMProviderConfig } from '@platform/database/services/llm-client';
