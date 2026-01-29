export type AgentChatError<T extends string = string, D = unknown> = {
  code: T
  detail: D
}

export const AgentErrorCodes = {
  LIMIT_REACHED: 'LIMIT_REACHED',
} as const
