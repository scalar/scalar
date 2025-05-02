import { Command } from 'commander'
import concurrently from 'concurrently'

/** Run domain used for composing pnpm commands */
export const run = new Command('run').description('Run a command')

run.addCommand(
  new Command('test-servers').description('Run the test servers').action(async () => {
    const { result } = concurrently([
      {
        command: 'CI=1 pnpm --filter @scalar/void-server dev',
        name: 'void-server',
        prefixColor: 'blue',
      },
      {
        command: 'CI=1 pnpm --filter proxy-scalar-com dev',
        name: 'proxy-server',
        prefixColor: 'cyan',
      },
    ])

    await result.catch(() => null)
  }),
)
