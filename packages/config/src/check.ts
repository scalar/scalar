import type { Static } from '@sinclair/typebox'
import { Value, type ValueError } from '@sinclair/typebox/value'
import fs from 'node:fs'

import {
  ConfigSidebarFolder,
  ConfigSidebarFolderType,
  ConfigSidebarLink,
  ConfigSidebarLinkType,
  ConfigSidebarPage,
  ConfigSidebarPageType,
  ScalarConfigType,
  type SidebarItem,
  SidebarItemType,
} from './configTypes'

// TODO: rename 'Types' to schemas
const sidebarSchemaMap = {
  page: ConfigSidebarPageType,
  folder: ConfigSidebarFolderType,
  link: ConfigSidebarLinkType,
}

/** Checks an object against a Typebox schema and returns the errors */
function validateSchema<T>(item: T, schema: any) {
  const result = Value.Check(schema, item)
  return {
    valid: result,
    schemaErrors: [...Value.Errors(schema, item)],
  }
}

/** Recursively iterate over the sidebar items and their children */
function recursiveIterate(
  node: SidebarItem,
  callback: (node: SidebarItem) => void,
): void {
  callback(node)
  if (node.children) {
    node.children.forEach((child) => recursiveIterate(child, callback))
  }
}

/** check scalar config file using the generated schema */
export function check(file: string) {
  try {
    const scalarConfigFile = fs.readFileSync(file, 'utf8')
    const scalarConfigJson = JSON.parse(scalarConfigFile)

    const result = Value.Check(ScalarConfigType, scalarConfigJson)
    const errors = [...Value.Errors(ScalarConfigType, scalarConfigJson)]

    // Early return if there is already an error with the schema at the root level
    if (!result) {
      return {
        valid: errors.length === 0,
        errors: errors,
      }
    }

    // recursively validate the children
    scalarConfigJson.guides.forEach((guide) => {
      guide.sidebar.forEach((item) => {
        recursiveIterate(item, (node) => {
          // NOTE: nodes missing the type property will be caught by the initial validation at the root
          const schema = sidebarSchemaMap[node.type]

          // Validate the sidebar item using its specific type schema
          const { valid, schemaErrors } = validateSchema<Static<typeof schema>>(
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
