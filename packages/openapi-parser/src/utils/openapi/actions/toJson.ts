import { getEntrypoint } from '@/utils/get-entrypoint'
import type { Queue, Task } from '@/types/index'
import { toJson as toJsonUtility } from '@/utils/to-json'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return the results
 */
export async function toJson<T extends Task[]>(queue: Queue<T>): Promise<string | undefined> {
  const { filesystem } = await workThroughQueue(queue)

  return toJsonUtility(getEntrypoint(filesystem).specification)
}
