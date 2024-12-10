import type { Converter } from '../targets.js'

export type PowershellCommand = 'Invoke-RestMethod' | 'Invoke-WebRequest'
export declare const generatePowershellConvert: (
  command: PowershellCommand,
) => Converter<any>
