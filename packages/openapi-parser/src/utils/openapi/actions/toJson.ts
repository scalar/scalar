import type { Queue, Task } from '../../../types'
import { toJson as toJsonUtility } from '../../toJson'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return the results
 */
export async function toJson<T extends Task[]>(
  queue: Queue<T>,
): Promise<string | undefined> {
  const { specification } = await workThroughQueue(queue)

  return toJsonUtility(specification)
}
