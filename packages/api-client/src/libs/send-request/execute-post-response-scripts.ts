import type { PostResponseScript } from '@/views/Request/RequestSection/types/post-response'

export const executePostResponseScripts = async (response: Response, scripts: PostResponseScript[] | undefined) => {
  // No scripts to execute
  if (!scripts) {
    return
  }

  // Execute enabled post-response scripts
  const enabledScripts = scripts.filter((script) => script.enabled)

  // Nothing enabled
  if (enabledScripts.length === 0) {
    return
  }

  enabledScripts.forEach((script) => {
    // TODO: Actually execute the scripts
    console.log('[Post-Response Script]', script.name || 'Untitled Script', { response })
  })
}
