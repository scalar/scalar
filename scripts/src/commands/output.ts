import UpdateManager from 'stdout-update'
import as from 'ansis'
const manager = UpdateManager.getInstance()
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export const useMessages = (title: string) => {
  manager.hook()

  let line1 = ''
  let line2 = ''

  let i = 0
  const interval = setInterval(() => {
    const frame = frames[i % frames.length]
    i += 1

    if (line1) manager.update([as.blueBright(`${frame} Running ${title}...`), as.green(line1), as.green(line2)])
  }, 100)

  return {
    setLine1: (line: string) => {
      line1 = line
    },
    setLine2: (line: string) => {
      line2 = line
    },
    end: (message?: string) => {
      line1 = '100% complete'
      line2 = message || ''
      manager.update([as.blueBright(`${title} complete!`), as.green(line1), as.green(line2)])

      clearInterval(interval)
      manager.unhook(false)
    },
  }
}
