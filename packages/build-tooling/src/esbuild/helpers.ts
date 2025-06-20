import { exec } from 'node:child_process'
import as, { type AnsiColors } from 'ansis'

export async function runCommand(command: string, processName: string) {
  return new Promise((resolve, reject) => {
    const comm = exec(command)

    const log = (data: string, color: AnsiColors) => {
      const line = as.strip(data).trim()
      if (!line) {
        return
      }

      console.log(as[color](`[${processName}]: ${line}`))
    }

    comm.stdout?.on('data', (data) => log(data, 'gray'))
    comm.stderr?.on('data', (data) => log(data, 'red'))
    comm.stderr?.on('data', (data) => {
      const line = as.strip(data).trim()
      if (!line) {
        return
      }

      console.log(as.redBright(`[${processName}]: ${line}`))
    })

    comm.on('error', (err) => {
      as.redBright(err.message)
      reject(false)
    })
    comm.on('close', (code) => (code === 0 ? resolve(true) : reject(false)))
  })
}
