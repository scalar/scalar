import type { Client } from '../../targets.js'

export type RubyNativeOptions = {
  insecureSkipVerify?: boolean
}
export declare const native: Client<RubyNativeOptions>
