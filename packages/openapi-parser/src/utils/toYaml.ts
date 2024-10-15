// @ts-ignore
import { dump } from 'js-yaml'

import type { AnyObject } from '../types'

export const toYaml = (value: AnyObject) => dump(value)
