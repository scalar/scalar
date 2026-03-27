import { z } from 'zod'

export const ASK_FOR_AUTHENTICATION_TOOL_NAME = 'ask-for-authentication' as const

export const askForAuthenticationInputSchema = z.object({
  documentName: z.string(),
  uniqueIdentifier: z.string().describe('Needed for legacy support for old clients'),
})

export type AskForAuthenticationInput = z.input<typeof askForAuthenticationInputSchema>
