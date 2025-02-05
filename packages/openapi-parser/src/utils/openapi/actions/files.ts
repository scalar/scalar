import type { Filesystem, Queue, Task } from '../../../types/index.ts'
import { workThroughQueue } from '../utils/workThroughQueue.ts'

/**
 * Run the chained tasks and return just the filesystem
 */
export async function files<T extends Task[]>(
  queue: Queue<T>,
): Promise<Filesystem> {
  const { filesystem } = await workThroughQueue(queue)

  return filesystem
}
