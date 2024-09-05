import type {
  DereferenceResult,
  Filesystem,
  FilterResult,
  LoadResult,
  UpgradeResult,
  ValidateResult,
} from '../types'
import type { OldQueue } from './openapi'

type WorkThroughQueueResult = Partial<
  LoadResult &
    DereferenceResult &
    ValidateResult &
    UpgradeResult &
    FilterResult & {
      filesystem: Filesystem
    }
>

/**
 * Run through a queue of tasks
 */
export async function workThroughQueue(queue: OldQueue): // TODO: Better type
Promise<WorkThroughQueueResult> {
  const specification = queue.specification

  let result: any

  // Run through all tasks in the queue
  for (const { action, options } of queue.tasks) {
    // Check if action is a function
    if (typeof action !== 'function') {
      console.warn('[queue] The given action is not a function:', action)
      continue
    }

    // Check if the action is an async function
    if (action.constructor.name === 'AsyncFunction') {
      result = {
        ...result,
        ...(await action(result?.filesystem ?? specification, options as any)),
      }
    } else {
      result = {
        ...result,
        ...action(result?.filesystem ?? specification, options as any),
      }
    }
  }

  return result
}
