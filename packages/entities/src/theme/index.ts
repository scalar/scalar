import { migrateThemeVariables } from '@/theme/legacy'
import { nanoidSchema } from '@/utility'
import { nanoid } from 'nanoid'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

/** Teams can have multiple theme definitions */
export type Theme = {
  uid: string
  name: string
  description: string
  theme: string
}

export const themeSchema = z.preprocess(
  (arg: any) => {
    if (!arg) return arg
    if (typeof arg.theme !== 'string') arg.theme = ''

    return arg
  },
  z.object({
    uid: nanoidSchema,
    name: z.string(),
    description: z.string(),
    // Migrate old --theme-* theme variables to --scalar-*
    theme: z.string().transform(migrateThemeVariables),
  }),
) satisfies ZodSchema<Theme, ZodTypeDef, any>

export const defaultTheme = (cssString = ''): Theme => ({
  uid: nanoid(),
  name: 'Default Theme',
  description: '',
  theme: cssString,
})
