import type { AsyncApiParameterObject } from '@scalar/types/asyncapi/3.1'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

/**
 * Converts channel path or query parameter maps into request table rows.
 */
export const createChannelParameterRows = (
  definitions: Record<string, AsyncApiParameterObject>,
  values: Record<string, string>,
): TableRow[] =>
  Object.entries(values).map(([name, value]) => {
    const parameter = definitions[name]

    return {
      name,
      value,
      description: parameter?.description,
    }
  })
