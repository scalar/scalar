import type { TargetId } from '@scalar/snippetz'

/** The language a built-in client's snippet is highlighted as: curl has its own grammar, the rest use their target's. */
export const getBuiltInClientLanguage = (target: TargetId, client: string): TargetId | 'curl' =>
  client === 'curl' ? 'curl' : target

/**
 * The language a client's code example is highlighted as, from its id.
 *
 * Built-in clients (`shell/curl`, `python/requests`) follow {@link getBuiltInClientLanguage}, and custom
 * code samples (`custom/python`, `custom/python/1`) are keyed by their own language. Lets a host start
 * loading the grammar for the selected client before any code example renders.
 *
 * @example
 * getClientLanguage('node/fetch') // 'node'
 * getClientLanguage('shell/curl') // 'curl'
 * getClientLanguage('custom/ruby') // 'ruby'
 */
export const getClientLanguage = (clientId: string): string => {
  const [target = '', client = ''] = clientId.split('/')

  return target === 'custom' ? client || 'plaintext' : getBuiltInClientLanguage(target as TargetId, client)
}
