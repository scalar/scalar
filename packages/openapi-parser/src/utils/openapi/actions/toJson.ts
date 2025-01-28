import type { Queue, Task } from '../../../types/index.ts'
import { getEntrypoint } from '../../getEntrypoint.ts'
import { toJson as toJsonUtility } from '../../toJson.ts'
import { workThroughQueue } from '../utils/workThroughQueue.ts'

/**
 * Run the chained tasks and return the results
 */
export async function toJson<T extends Task[]>(
  queue: Queue<T>,
): Promise<string | undefined> {
  const { filesystem } = await workThroughQueue(queue)

  return toJsonUtility(getEntrypoint(filesystem).specification)
}
