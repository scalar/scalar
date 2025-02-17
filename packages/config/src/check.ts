import fs from 'node:fs'

import type { Static } from '@sinclair/typebox'
import { Value, type ValueError } from '@sinclair/typebox/value'

import { getSchemaErrors, recursiveSidebarIterate } from '@/utils'

import { ScalarConfigSchema, sidebarSchemaMap } from './configTypes'

/** check scalar config file using the generated schema */
export function check(file: string) {
  try {
    const scalarConfigFile = fs.readFileSync(file, 'utf8')
    const scalarConfigJson = JSON.parse(scalarConfigFile)

    const result = Value.Check(ScalarConfigSchema, scalarConfigJson)
    const errors = [...Value.Errors(ScalarConfigSchema, scalarConfigJson)]

    // Early return if there is already an error with the schema at the root level
    if (!result) {
      return {
        valid: errors.length === 0,
        errors: errors,
      }
    }

    // Validate the sidebar
    scalarConfigJson.guides.forEach((guide) => {
      guide.sidebar.forEach((item) => {
        recursiveSidebarIterate(item, (node) => {
          // NOTE: node.type will always be defined here
          // nodes missing the type property will be caught by
          // the initial validation and early return above
          const schema = sidebarSchemaMap[node.type]

          // Validate the sidebar item using its specific type schema
          const schemaErrors = getSchemaErrors<Static<typeof schema>>(
            node as Static<typeof schema>,
            sidebarSchemaMap[node.type],
          )
          errors.push(...schemaErrors)
        })
      })
    })

    return {
      valid: errors.length === 0,
      errors: errors,
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [
        {
          message: error.message,
        } as ValueError,
      ],
    }
  }
}
