import type { Server } from '@/entities/spec/server'

/** Retrieve example values for server variables */
export const getServerVariableExamples = (server: Server) => {
  const examples: Record<string, string[]> = {}
  if (server.variables) {
    for (const [key, variable] of Object.entries(server.variables)) {
      examples[key] = (variable.enum?.filter((v): v is string => typeof v === 'string') as string[]) ?? [
        variable.default,
      ]
    }
  }
  return examples
}
