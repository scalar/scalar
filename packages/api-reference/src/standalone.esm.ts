import '@/style.css'

import { createApiReference, findDataAttributes, getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'
import { registerGlobals } from '@/standalone/lib/register-globals'

registerGlobals()

// Look for data attributes in the HTML (legacy)
findDataAttributes(document, getConfigurationFromDataAttributes(document))

// Expose the public API so consumers can `import { createApiReference } from '...'`
export { createApiReference }
