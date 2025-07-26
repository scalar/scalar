import type { CommandChain, Merge, Queue, Task } from '@/types/index'
import { dereference } from '@/utils/dereference'
import { filter } from '@/utils/filter'
import { load } from '@/utils/load/load'
import { upgrade } from '@/utils/upgrade'
import { validate } from '@/utils/validate'

/**
 * Takes a queue of tasks and works through them
 */
export async function workThroughQueue<T extends Task[]>(queue: Queue<T>): Promise<CommandChain<T>> {
  const { input } = {
    ...queue,
  }
  let result = {} as CommandChain<T>

  // Work through the whole queue
  for (const task of queue.tasks) {
    const name: keyof Commands = task.name
    const options: any = 'options' in task ? task.options : undefined

    // Use the result of the previous task, or fall back to the original input
    const currentSpecification = result.specification
      ? result.specification
      : typeof input === 'object'
        ? // Detach from the original object
          structuredClone(input)
        : input

    // load
    if (name === 'load') {
      result = {
        ...result,
        ...(await load(input, options as Commands['load']['task']['options'])),
      } as Merge<typeof result, Awaited<typeof load>>
    }

    // validate
    else if (name === 'filter') {
      result = {
        ...result,
        ...filter(currentSpecification, options as Commands['filter']['task']['options']),
      } as Merge<typeof result, ReturnType<typeof filter>>
    }

    // dereference
    else if (name === 'dereference') {
      result = {
        ...result,
        ...(await dereference(currentSpecification, options as Commands['dereference']['task']['options'])),
      } as Merge<typeof result, Awaited<typeof dereference>>
    }

    // upgrade
    else if (name === 'upgrade') {
      result = {
        ...result,
        ...upgrade(currentSpecification),
      } as Merge<typeof result, ReturnType<typeof upgrade>>
    }

    // validate
    else if (name === 'validate') {
      result = {
        ...result,
        ...(await validate(currentSpecification, options as Commands['validate']['task']['options'])),
      } as Merge<typeof result, Awaited<typeof validate>>
    }

    // Make TS complain when we forgot to handle a command.
    else {
      const _: never = name

      // @ts-expect-error Needed to allow the unused type to still be checked
      const nada = _
    }
  }

  return result
}
