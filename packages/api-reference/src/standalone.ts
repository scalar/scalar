import { findDataAttributes, getConfigurationFromDataAttributes } from '@/standalone/lib/html-api'
import { registerGlobals } from '@/standalone/lib/register-globals'

registerGlobals()

// Look for data attributes in the HTML (legacy)
findDataAttributes(document, getConfigurationFromDataAttributes(document))
