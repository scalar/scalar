import { snippetz } from '@scalar/snippetz'
import { plugins } from '@scalar/snippetz/clients'

/**
 * Shared snippetz instance with all plugins loaded eagerly.
 * Re-use this instead of creating new instances per component.
 */
export const snippetzInstance = snippetz(plugins)
