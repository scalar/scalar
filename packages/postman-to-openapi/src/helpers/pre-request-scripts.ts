import type { Event } from '@/types'

/**
 * Processes Postman pre-request scripts and converts them to OpenAPI x-pre-request extension.
 * Extracts the pre-request script from Postman events and returns it as a single string.
 */
export function processPreRequestScripts(events: Event[] = []): string | undefined {
  const preRequestEvent = events.find((event) => event.listen === 'prerequest')

  const exec = preRequestEvent?.script?.exec

  if (!exec) {
    return undefined
  }

  const content = typeof exec === 'string' ? exec : exec.join('\n')

  return content.trim() || undefined
}
