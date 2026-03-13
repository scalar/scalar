import { type AvailableClients } from '@scalar/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { ClientOptionGroup } from '../types'
/** Type of custom code sample IDs */
export type CustomCodeSampleId = `custom/${string}`
/** Helper to generate an ID for custom code samples */
export declare const generateCustomId: (example: XCodeSample) => CustomCodeSampleId
/**
 * Generate client options for the request example block by filtering by allowed clients
 *
 * @param allowedClients - The list of allowed clients to include in the options
 * @returns A list of client option groups
 */
export declare const generateClientOptions: (allowedClients?: AvailableClients) => ClientOptionGroup[]
//# sourceMappingURL=generate-client-options.d.ts.map
