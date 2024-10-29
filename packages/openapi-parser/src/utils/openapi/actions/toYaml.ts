import type { Queue, Task } from '../../../types/index.js'
import { getEntrypoint } from '../../getEntrypoint.js'
import { toYaml as toYamlUtility } from '../../toYaml.js'
import { workThroughQueue } from '../utils/workThroughQueue.js'

/**
 * Run the chained tasks and return the results
 */
export async function toYaml<T extends Task[]>(
  queue: Queue<T>,
): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toYamlUtility(getEntrypoint(filesystem).specification)
}
