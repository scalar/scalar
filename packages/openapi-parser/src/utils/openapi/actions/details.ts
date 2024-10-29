import type { Queue, Task } from '../../../types/index.js'
import { details as detailsUtility } from '../../details.js'
import { getEntrypoint } from '../../getEntrypoint.js'
import { workThroughQueue } from '../utils/workThroughQueue.js'

/**
 * Run the chained tasks and return just some basic information about the OpenAPI document
 */
export async function details<T extends Task[]>(
  queue: Queue<T>,
): Promise<ReturnType<typeof detailsUtility>> {
  const { filesystem } = await workThroughQueue(queue)

  return detailsUtility(getEntrypoint(filesystem).specification)
}
