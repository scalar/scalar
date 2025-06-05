import { getEntrypoint } from '@/utils/get-entrypoint'
import type { Queue, Task } from '@/types/index'
import { toYaml as toYamlUtility } from '@/utils/to-yaml'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return the results
 */
export async function toYaml<T extends Task[]>(queue: Queue<T>): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toYamlUtility(getEntrypoint(filesystem).specification)
}
