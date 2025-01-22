import type { Queue, Task } from '../../../types/index.ts'
import { getEntrypoint } from '../../getEntrypoint.ts'
import { toYaml as toYamlUtility } from '../../toYaml.ts'
import { workThroughQueue } from '../utils/workThroughQueue.ts'

/**
 * Run the chained tasks and return the results
 */
export async function toYaml<T extends Task[]>(
  queue: Queue<T>,
): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toYamlUtility(getEntrypoint(filesystem).specification)
}
