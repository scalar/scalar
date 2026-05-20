import { array, number, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const Tab = object(
  {
    path: string({ typeComment: 'Tab path or document identifier' }),
    title: string({ typeComment: 'Tab title shown in the UI' }),
    icon: optional(string({ typeComment: 'Tab icon (`request` or `document`)' })),
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
 * Useful for preserving the user workspace state across sessions.
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
        typeComment: 'Index of the currently active or focused tab',
      }),
    ),
  },
  {
    typeName: 'XScalarTabs',
    typeComment: typeCommentWithExample(
      'Workspace tab configuration. Persists open tabs and the active tab across sessions.',
      {
        language: 'yaml',
        body: `x-scalar-tabs:
  - path: /users
    title: Users
x-scalar-active-tab: 0`,
      },
    ),
  },
)
