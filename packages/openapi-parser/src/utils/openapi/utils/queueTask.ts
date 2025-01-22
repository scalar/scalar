import type { Queue, Task } from '../../../types/index.ts'

/**
 * Add a new task to the existing queue
 */
export function queueTask<T extends Task[]>(queue: Queue, task: Task) {
  return {
    ...queue,
    tasks: [...queue.tasks, task],
  } as Queue<T>
}
