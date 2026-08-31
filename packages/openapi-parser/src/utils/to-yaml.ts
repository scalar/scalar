import type { AnyObject } from '@scalar/types/utils'
import { stringify } from 'yaml'

export const toYaml = (value: AnyObject) => stringify(value)
