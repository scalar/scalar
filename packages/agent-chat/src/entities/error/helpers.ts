import type { AgentChatError } from './constants'

export function createError<const T extends string, D>(code: T, detail: D): AgentChatError<T, D> {
  return {
    code,
    detail,
  }
}
