import { array, number, object, optional, string } from '@scalar/validation'

export const Tab = object(
  {
    path: string(),
    title: string(),
    icon: optional(string()),
  },
  {
    typeName: 'Tab',
    typeComment: 'An open tab in the workspace',
  },
)

/**
 * Schema for workspace tab configuration.
 *
 * This extension allows storing the list of open tabs and which tab is currently active.
 * Useful for preserving user's workspace state across sessions.
 */
export const XScalarTabs = object(
  {
    'x-scalar-tabs': optional(
      array(Tab, {
        typeComment: 'Tabs that are open in the workspace',
      }),
    ),
    'x-scalar-active-tab': optional(
      number({
        typeComment: 'The currently active or focused tab',
      }),
    ),
  },
  {
    typeName: 'XScalarTabs',
    typeComment: 'Workspace tab configuration',
  },
)
