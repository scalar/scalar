import type z from 'zod'

import { baseConfigurationSchema } from './base-configuration'
import { sourceConfigurationSchema } from './source-configuration'

export const apiClientConfigurationSchema = baseConfigurationSchema.extend(sourceConfigurationSchema.shape)

export type ApiClientConfiguration = z.infer<typeof apiClientConfigurationSchema>
