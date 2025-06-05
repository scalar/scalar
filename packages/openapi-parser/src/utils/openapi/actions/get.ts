import type { CommandChain, Queue, Task } from '@/types/index'
import { workThroughQueue } from '../utils/workThroughQueue'

/**
 * Run the chained tasks and return the results
 */
export async function get<T extends Task[]>(queue: Queue<T>): Promise<CommandChain<T>> {
  return {
    filesystem: [],
    ...(await workThroughQueue(queue)),
  }
}
