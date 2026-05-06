/**
 * Build the inline-script body that registers a single Scalar mount config on
 * the shared `window.__scalarAstro.configs` registry.
 *
 * Delegates the function-preserving + script-safe serialization of the config
 * to `@scalar/client-side-rendering` so client mode and static mode stay in
 * sync, then escapes the wrapper too because `key` and `cdn` are user
 * controlled and could otherwise contain `</script>` or `<!--` sequences that
 * break out of the surrounding inline script tag.
 */

import { escapeForInlineScript, serializeConfigToScript } from '@scalar/client-side-rendering'

type SerializeArgs = {
  key: string
  configuration: Record<string, unknown>
  cdn: string | null
}

export const serializeClientConfig = ({ key, configuration, cdn }: SerializeArgs): string => {
  const keyLiteral = JSON.stringify(key)
  const configLiteral = serializeConfigToScript(configuration)
  const cdnLiteral = JSON.stringify(cdn)
  return escapeForInlineScript(
    `(window.__scalarAstro=window.__scalarAstro||{configs:{}}).configs[${keyLiteral}]={configuration:${configLiteral},cdn:${cdnLiteral}}`,
  )
}
