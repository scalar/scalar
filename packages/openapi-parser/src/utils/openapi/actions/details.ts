import type { Queue, Task } from '../../../types/index.ts'
import { details as detailsUtility } from '../../details.ts'
import { getEntrypoint } from '../../getEntrypoint.ts'
import { workThroughQueue } from '../utils/workThroughQueue.ts'

/**
 * Run the chained tasks and return just some basic information about the OpenAPI document
 */
export async function details<T extends Task[]>(
  queue: Queue<T>,
): Promise<ReturnType<typeof detailsUtility>> {
  const { filesystem } = await workThroughQueue(queue)

  return detailsUtility(getEntrypoint(filesystem).specification)
}
