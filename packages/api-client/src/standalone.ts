import '@/style.css'
import { registerGlobals } from '@/standalone/lib/register-globals'

// Log the package version
if (process.env.SCALAR_API_REFERENCE_VERSION) {
  console.info(`@scalar/api-reference@${process.env.SCALAR_API_REFERENCE_VERSION}`)
}

registerGlobals()
