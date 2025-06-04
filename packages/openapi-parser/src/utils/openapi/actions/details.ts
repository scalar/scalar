import { getEntrypoint } from '@/utils/get-entrypoint'
import type { Queue, Task } from '@/types/index'
import { details as detailsUtility } from '@/utils/details'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return just some basic information about the OpenAPI document
 */
export async function details<T extends Task[]>(queue: Queue<T>): Promise<ReturnType<typeof detailsUtility>> {
  const { filesystem } = await workThroughQueue(queue)

  return detailsUtility(getEntrypoint(filesystem).specification)
}
