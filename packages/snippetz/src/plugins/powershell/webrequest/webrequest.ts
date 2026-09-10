import type { Plugin } from '@scalar/types/snippetz'

import { generatePowershell } from '@/libs/powershell'

/** Generates a PowerShell 7 request using Invoke-WebRequest. */
export const powershellWebrequest: Plugin = {
  target: 'powershell',
  client: 'webrequest',
  title: 'Invoke-WebRequest',
  generate(request, configuration) {
    return generatePowershell('Invoke-WebRequest', request, configuration)
  },
}
