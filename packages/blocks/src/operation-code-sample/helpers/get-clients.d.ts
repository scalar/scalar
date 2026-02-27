import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { ClientOptionGroup, CustomClientOptionGroup } from '../types'
/**
 * Merges custom code samples with the client options
 *
 * @param customCodeSamples - The custom code samples from the operation to merge with the client options
 * @param clientOptions - The client options to merge with the custom code samples
 * @returns A list of client option groups
 */
export declare const getClients: (
  customCodeSamples: XCodeSample[],
  clientOptions: ClientOptionGroup[],
) => CustomClientOptionGroup[]
//# sourceMappingURL=get-clients.d.ts.map
