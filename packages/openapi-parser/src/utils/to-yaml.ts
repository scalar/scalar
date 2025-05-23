import { stringify } from 'yaml'

import type { AnyObject } from '@/types/index'

export const toYaml = (value: AnyObject) => stringify(value)
