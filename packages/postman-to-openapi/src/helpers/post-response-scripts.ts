import type { Event } from '@/types'

/**
 * Processes Postman test scripts and converts them to OpenAPI x-post-response extension.
 * Extracts the test script from Postman events and returns it as a single string.
 */
export function processPostResponseScripts(events: Event[] = []): string | undefined {
  const testEvent = events.find((event) => event.listen === 'test')

  const exec = testEvent?.script?.exec

  if (!exec) {
    return undefined
  }

  const content = typeof exec === 'string' ? exec : exec.join('\n')

  return content.trim() || undefined
}
