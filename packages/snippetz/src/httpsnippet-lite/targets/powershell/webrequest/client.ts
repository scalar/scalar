import type { Client } from '@/httpsnippet-lite/targets/target.js'

import { generatePowershellConvert } from '../common.js'

export const webrequest: Client = {
  info: {
    key: 'webrequest',
    title: 'Invoke-WebRequest',
    link: 'https://docs.microsoft.com/en-us/powershell/module/Microsoft.PowerShell.Utility/Invoke-WebRequest',
    description: 'Powershell Invoke-WebRequest client',
  },
  convert: generatePowershellConvert('Invoke-WebRequest'),
}
