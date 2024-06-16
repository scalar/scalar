import pm from 'picomatch'
import type { Plugin } from 'vite'

export function ViteWatchWorkspace(): Plugin {
  const currentDir = process.cwd().split('/').at(-1)

  const timer = {
    instance: null as ReturnType<typeof setTimeout> | null,
    /** Run a function after a certain delay */
    run: (callback: () => void, delay = 500) => {
      // Clear any existing callbacks to debounce
      timer.clear()
      // Set the new delay
      timer.instance = setTimeout(callback, delay)
    },
    /** Cancel any pending actions */
    clear: () => timer.instance && clearTimeout(timer.instance),
  }

  // We match any workspace package dist that are not the current one
  const matcher = pm(`**/scalar/packages/!(${currentDir})/dist/**`)
  return {
    name: `vite-plugin-workspace-watch`,
    apply: 'serve',
    handleHotUpdate({ file, server }) {
      if (matcher(file)) {
        timer.run(() => {
          console.log('Reloading the mothership...')
          server.restart()
        })
        return []
      }
    },
  }
}
