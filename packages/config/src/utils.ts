import type { SidebarItem } from '@/configTypes'
import { Value } from '@sinclair/typebox/value'

/** Checks an object against a Typebox schema and returns the errors */
export function getSchemaErrors<T>(item: T, schema: any) {
  return Value.Errors(schema, item)
}

/** Recursively iterate over the sidebar items and their children */
export function recursiveSidebarIterate(
  node: SidebarItem,
  callback: (node: SidebarItem) => void,
): void {
  callback(node)
  if (node.children) {
    node.children.forEach((child) => recursiveSidebarIterate(child, callback))
  }
}
