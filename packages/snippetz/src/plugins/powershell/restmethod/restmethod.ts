import type { Plugin } from '@scalar/types/snippetz'

import { generatePowershell } from '@/libs/powershell'

/** Generates a PowerShell 7 request using Invoke-RestMethod. */
export const powershellRestmethod: Plugin = {
  target: 'powershell',
  client: 'restmethod',
  title: 'Invoke-RestMethod',
  generate(request, configuration) {
    return generatePowershell('Invoke-RestMethod', request, configuration)
  },
}
