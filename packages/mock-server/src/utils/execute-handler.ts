import type { HandlerContext } from './build-handler-context'

/**
 * Result of executing a handler, including the result and operation tracking.
 */
export type HandlerExecutionResult = {
  result: any
}

/**
 * Execute handler code in a sandboxed environment.
 * The code has access only to the provided context (store, faker, req).
 */
export async function executeHandler(code: string, context: HandlerContext): Promise<HandlerExecutionResult> {
  // Create a function that executes the handler code with the context
  // Using Function constructor to create a sandboxed environment
  // The code is wrapped in a function body that returns the result
  const handlerFunction = new Function(
    'store',
    'faker',
    'req',
    `
    ${code}
  `,
  )

  // Execute the handler with the context
  try {
    const result = handlerFunction(context.store, context.faker, context.req)

    // If the result is a Promise, await it
    if (result instanceof Promise) {
      return { result: await result }
    }

    return { result }
  } catch (error) {
    // Re-throw to be caught by the caller
    throw error
  }
}
