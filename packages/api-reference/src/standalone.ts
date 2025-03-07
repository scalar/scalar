/**
 * This file is the entry point for the CDN version of the API Reference.
 *
 * It’s responsible for finding the configuration and the OpenAPI document in the HTML, and mounting the Vue app.
 */
import { registerScalar } from '@/standalone/lib/global-scalar'
import { createApiReference, findDataAttributes, getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'

// Log the package version
if (process.env.SCALAR_API_REFERENCE_VERSION) {
  console.info(`@scalar/api-reference@${process.env.SCALAR_API_REFERENCE_VERSION}`)
}

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: typeof createApiReference
    }
  }
}

registerScalar(createApiReference)

// Look for data attributes in the HTML (legacy)
findDataAttributes(document, getConfigurationFromDataAttributes(document))
