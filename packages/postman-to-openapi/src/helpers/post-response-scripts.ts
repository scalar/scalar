/**
 * Processes Postman test scripts and converts them to OpenAPI x-post-response extension
 */
export function processPostResponseScripts(events: any[] = []): string | undefined {
  // Find test event
  const testEvent = events.find((event) => event.listen === 'test')
  if (!testEvent?.script?.exec) {
    return undefined
  }

  // Join script lines into a single string
  return testEvent.script.exec.join('\n').trim()
}
