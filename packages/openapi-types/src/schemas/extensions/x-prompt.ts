import { z } from 'zod'

/**
 * An OpenAPI extension set the prompt query parameter for OAuth2 requests.
 *
 * @example
 * ```yaml
 * x-prompt: consent # or other common options, like login, select_account, none
 * ```
 */
export const XPromptSchema = z.object({
  'x-prompt': z.string().optional().catch(''),
})
