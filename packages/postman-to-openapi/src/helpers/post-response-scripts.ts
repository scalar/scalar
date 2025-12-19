import type { Event } from '@/types'

/**
 * Processes Postman test scripts and converts them to OpenAPI x-post-response extension.
 * Extracts the test script from Postman events and returns it as a single string.
 *
 * @param events - Array of Postman events to search for test scripts
 * @returns The joined test script as a string, or undefined if no test script is found
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
