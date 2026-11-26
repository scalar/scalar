import type { AvailableClients } from '@scalar/types/snippetz'

/** Restrict visible HTTP clients to the configured IDs and target wildcards, preserving their order. */
export const filterHttpClients = (clients: AvailableClients, patterns?: readonly string[]): AvailableClients => {
  if (patterns === undefined) {
    return clients
  }

  const allowedClients = new Set(patterns)
  return clients.filter((id) => allowedClients.has(id) || allowedClients.has(`${id.split('/')[0]}/*`))
}
