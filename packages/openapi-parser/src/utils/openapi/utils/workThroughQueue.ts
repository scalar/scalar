import type {
  CommandChain,
  Merge,
  PromiseReturnType,
  Queue,
  Task,
} from '../../../types'
import { dereference } from '../../dereference'
import { filter } from '../../filter'
import { load } from '../../load'
import { upgrade } from '../../upgrade'
import { validate } from '../../validate'

/**
 * Takes a queue of tasks and works through them
 */
export async function workThroughQueue<T extends Task[]>(
  queue: Queue<T>,
): Promise<CommandChain<T>> {
  const { input } = queue
  let result = {} as CommandChain<T>

  // Work through the whole queue
  for (const task of queue.tasks) {
    const name: keyof Commands = task.name
    const options: any = 'options' in task ? task.options : undefined

    // load
    if (name === 'load') {
      result = {
        ...result,
        ...(await load(input, options as Commands['load']['task']['options'])),
      } as Merge<typeof result, PromiseReturnType<typeof load>>
    }

    // validate
    else if (name === 'filter') {
      result = {
        ...result,
        ...filter(input, options as Commands['filter']['task']['options']),
      } as Merge<typeof result, ReturnType<typeof filter>>
    }

    // dereference
    else if (name === 'dereference') {
      result = {
        ...result,
        ...(await dereference(
          input,
          options as Commands['dereference']['task']['options'],
        )),
      } as Merge<typeof result, PromiseReturnType<typeof dereference>>
    }

    // upgrade
    else if (name === 'upgrade') {
      result = {
        ...result,
        ...upgrade(input),
      } as Merge<typeof result, ReturnType<typeof upgrade>>
    }

    // validate
    else if (name === 'validate') {
      result = {
        ...result,
        ...(await validate(
          input,
          options as Commands['validate']['task']['options'],
        )),
      } as Merge<typeof result, PromiseReturnType<typeof validate>>
    }

    // Make TS complain when we forgot to handle a command.
    else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = name
    }
  }

  return result
}
