import { z } from 'zod'

// Even a caught eval capability probe produces CSP reports. Configure Zod before
// any object schemas are constructed, including schemas inside the AI SDK.
z.config({ jitless: true })

/** Zod configured for environments that do not allow dynamic code generation. */
export { z }
