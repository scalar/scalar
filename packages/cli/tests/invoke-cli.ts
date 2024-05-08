import type { ExecaSyncError } from 'execa'
import { execaSync } from 'execa'
import { join } from 'node:path'
import process from 'node:process'
import strip from 'strip-ansi'

import { createLogsMatcher } from './matcher'

const builtCliLocation = join(__dirname, '..', 'dist', 'index.js')

type CreateLogsMatcherReturn = ReturnType<typeof createLogsMatcher>
export type InvokeResult = [
  exitCode: number,
  logsMatcher: CreateLogsMatcherReturn,
]

export function ScalarCli() {
  let cwd = ''

  const self = {
    setCwd: (_cwd: string) => {
      cwd = _cwd
      return self
    },
    invoke: (args: Array<string>): InvokeResult => {
      const NODE_ENV = 'production'

      try {
        const results = execaSync(
          process.execPath,
          [builtCliLocation].concat(args),
          {
            cwd,
            env: { NODE_ENV },
          },
        )

        return [
          results.exitCode,
          createLogsMatcher(
            strip(results.stderr.toString() + results.stdout.toString()),
          ),
        ]
      } catch (e) {
        const execaError = e as ExecaSyncError

        // Console output for CI
        console.error('ERROR', e)

        return [
          execaError.exitCode,
          createLogsMatcher(strip(execaError.stdout?.toString() || '')),
        ]
      }
    },
  }

  return self
}
