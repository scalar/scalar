import type { AnyObject } from '../../../types'

export const DEFAULT_TITLE = ''
export const DEFAULT_VERSION = '1.0'

export const addInfoObject = (definition: AnyObject) => ({
  ...definition,
  info: {
    ...definition.info,
    title: definition.info?.title ?? DEFAULT_TITLE,
    version: definition.info?.version ?? DEFAULT_VERSION,
  },
})
