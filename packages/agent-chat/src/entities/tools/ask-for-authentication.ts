import { object, string, type Static } from '@scalar/validation'

export const ASK_FOR_AUTHENTICATION_TOOL_NAME = 'ask-for-authentication' as const

export const askForAuthenticationInputSchema = object({
  documentName: string(),
  uniqueIdentifier: string({ typeComment: 'Needed for legacy support for old clients' }),
})

export type AskForAuthenticationInput = Static<typeof askForAuthenticationInputSchema>
