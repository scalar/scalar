import type {
  CommandChain,
  Merge,
  PromiseReturnType,
  Queue,
  Task,
} from '../../types'
import { dereference } from '../dereference'
import { load } from '../load'
import { upgrade } from '../upgrade'
import { validate } from '../validate'

export async function workThroughQueue<T extends Task[]>(
  queue: Queue<T>,
): Promise<CommandChain<T>> {
  let result = {} as CommandChain<T>

  // Work through the whole queue
  queue.tasks.forEach(async ({ name }: { name: keyof Commands }) => {
    const { input } = queue

    // load
    if (name === 'load') {
      result = {
        ...result,
        ...(await load(input)),
      } as Merge<typeof result, PromiseReturnType<typeof load>>
    }

    // upgrade
    else if (name === 'dereference') {
      result = {
        ...result,
        ...(await dereference(input)),
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
        ...validate(input),
      } as Merge<typeof result, ReturnType<typeof validate>>
    }

    // Make TS complain when we forgot to handle a command.
    else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = name
    }
  })

  return result
}
