import type { Queue, Task } from '../../../types/index.js'
import { getEntrypoint } from '../../getEntrypoint.js'
import { toJson as toJsonUtility } from '../../toJson.js'
import { workThroughQueue } from '../utils/workThroughQueue.js'

/**
 * Run the chained tasks and return the results
 */
export async function toJson<T extends Task[]>(
  queue: Queue<T>,
): Promise<string | undefined> {
  const { filesystem } = await workThroughQueue(queue)

  return toJsonUtility(getEntrypoint(filesystem).specification)
}
