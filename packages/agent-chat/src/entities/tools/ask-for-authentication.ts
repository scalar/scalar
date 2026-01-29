import { z } from 'zod'

export const ASK_FOR_AUTHENTICATION_TOOL_NAME = 'ask-for-authentication' as const

export const askForAuthenticationInputSchema = z.object({
  uniqueIdentifier: z.string(),
})

export type AskForAuthenticationInput = z.input<typeof askForAuthenticationInputSchema>
