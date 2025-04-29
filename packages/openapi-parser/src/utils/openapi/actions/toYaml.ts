import type { Queue, Task } from '../../../types/index'
import { getEntrypoint } from '../../getEntrypoint'
import { toYaml as toYamlUtility } from '../../toYaml'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return the results
 */
export async function toYaml<T extends Task[]>(queue: Queue<T>): Promise<string> {
  const { filesystem } = await workThroughQueue(queue)

  return toYamlUtility(getEntrypoint(filesystem).specification)
}
