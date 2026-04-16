import { createApiReference, findDataAttributes, getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'
import { registerGlobals } from '@/standalone/lib/register-globals'

// Log the package version
if (process.env.SCALAR_API_REFERENCE_VERSION) {
  console.info(`@scalar/api-reference@${process.env.SCALAR_API_REFERENCE_VERSION}`)
}

registerGlobals()

// Look for data attributes in the HTML (legacy)
findDataAttributes(document, getConfigurationFromDataAttributes(document))

// Allow module-based CDN consumers to import from standalone.mjs
export { createApiReference }
