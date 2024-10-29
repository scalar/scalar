import { stringify } from 'yaml'

import type { AnyObject } from '../types/index.js'

export const toYaml = (value: AnyObject) => stringify(value)
