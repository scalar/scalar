import { stringify } from 'yaml'

import type { AnyObject } from '../types/index.ts'

export const toYaml = (value: AnyObject) => stringify(value)
