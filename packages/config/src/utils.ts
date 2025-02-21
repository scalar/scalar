import { Value } from '@sinclair/typebox/value'

import type { ConfigSidebarFolder, ConfigSidebarLink, ConfigSidebarPage, SidebarItem } from '@/configTypes'

/** Checks an object against a Typebox schema and returns the errors */
export function getSchemaErrors<T extends ConfigSidebarFolder | ConfigSidebarLink | ConfigSidebarPage>(
  item: T,
  schema: any,
) {
  const errors = [...Value.Errors(schema, item)]

  // Add the item name for better errors
  errors.forEach((error) => {
    const errorMessage = `${error.message} on sidebar item: ${item.name}`
    error.message = errorMessage
  })
  return errors
}

/** Recursively iterate over the sidebar items and their children */
export function recursiveSidebarIterate(node: SidebarItem, callback: (node: SidebarItem) => void): void {
  callback(node)
  if (node.children) {
    node.children.forEach((child) => recursiveSidebarIterate(child, callback))
  }
}
