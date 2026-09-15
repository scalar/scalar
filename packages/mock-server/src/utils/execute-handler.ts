import type { HandlerContext } from './build-handler-context'
import { runInSandbox } from './sandbox'

/**
 * Result of executing a handler, including the result and operation tracking.
 */
type HandlerExecutionResult = {
  result: any
}

/**
 * Execute handler code inside the QuickJS sandbox.
 *
 * The handler can only reach the `store` and `faker` bridges and the injected
 * `req`/`res` inputs. It cannot touch the host runtime, so even untrusted code
 * from a remote or `$ref`-loaded document is safe to run.
 */
export async function executeHandler(code: string, context: HandlerContext): Promise<HandlerExecutionResult> {
  const result = await runInSandbox({
    code,
    store: context.store,
    jsonGlobals: { req: context.req, res: context.res },
  })

  return { result }
}
