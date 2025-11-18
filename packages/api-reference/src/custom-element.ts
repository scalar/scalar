import { registerCustomElement } from '@/standalone/lib/register-custom-element'

// Log the package version
if (process.env.SCALAR_API_REFERENCE_VERSION) {
  console.info(`@scalar/api-reference@${process.env.SCALAR_API_REFERENCE_VERSION}`)
}

registerCustomElement()
