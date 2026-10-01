import type { KeyboardEventPayload } from './ui'

/**
 * Common payload for navigation item operations.
 * Navigation items include tags, operations, folders, etc. in the sidebar.
 */
export type NavigationItemPayload = {
  /** The unique identifier of the navigation item */
  id: string
}

/** Navigation commands that consumers require their hosts to implement. */
export type NavigationEvents = {
  /**
   * Select a navigation item.
   * Fired when clicking on a sidebar item where a scroll handler would typically be expected.
   * This does not automatically scroll to the item.
   */
  'select:nav-item': NavigationItemPayload

  /**
   * Explicitly scroll to a navigation item in the content area.
   * This will move the viewport to show the corresponding content.
   */
  'scroll-to:nav-item': NavigationItemPayload

  /**
   * Explicitly scroll to a model by name in the content area.
   * This will move the viewport to show the corresponding model.
   */
  'scroll-to:model-by-name': {
    name: string
  }

  /**
   * Navigate to a page
   * This will navigate to a page in the workspace
   * It can be a document page, a workspace page, or an example page
   */
  'ui:navigate': {
    /** If true, the navigation will replace the current route instead of pushing a new one */
    replace?: boolean
    /** The slug of the team that owns the workspace to navigate to */
    teamSlug?: string
    /** The slug of the workspace to navigate to */
    workspaceSlug?: string
    /** The callback to call when the navigation is complete */
    callback?: (status: 'success' | 'error') => void
  } & (
    | {
        page: 'document'
        path: 'overview' | 'servers' | 'environment' | 'authentication' | 'cookies' | 'settings'
        documentSlug?: string
      }
    | {
        page: 'workspace'
        path: 'environment' | 'cookies' | 'settings' | 'get-started'
      }
    | {
        page: 'example'
        documentSlug?: string
        path: string
        method: string
        exampleName: string
      }
    | {
        page: 'operation'
        path: 'overview' | 'servers' | 'authentication' | 'editor'
        operationPath: string
        method: string
        documentSlug?: string
      }
  )

  /**
   * Open the contextual settings page for the current sidebar view.
   *
   * On the workspace page this navigates to the workspace-level settings, and
   * while viewing a single document it navigates to that document's settings
   * page instead. Typically triggered by Cmd/Ctrl+I, but may also be
   * dispatched programmatically (for example, from the workspace "Get started"
   * screen), in which case no payload is provided.
   */
  'ui:open:settings': KeyboardEventPayload | undefined

  /**
   * Open the API Client modal to a specific operation.
   * This allows deep linking into specific endpoints from external sources.
   */
  'ui:open:client-modal':
    | undefined
    | {
        /** The id of the operation to directly load */
        id: string
        /** Optional example name to load for this operation */
        exampleName?: string
        /** Optional selected anyOf/oneOf request-body variants keyed by schema path */
        requestBodyCompositionSelection?: Record<string, number>
      }
    | {
        /** The HTTP method of the operation to load (e.g., GET, POST) */
        method: string
        /** The path of the operation to load (e.g., /users/{id}) */
        path: string
        /** Optional example name to load for this operation */
        exampleName?: string
        /** Optional selected anyOf/oneOf request-body variants keyed by schema path */
        requestBodyCompositionSelection?: Record<string, number>
      }

  /**
   * Navigates to the previous tab
   */
  'tabs:navigate:previous':
    | undefined
    | {
        event: KeyboardEvent
      }

  /**
   * Navigates to the next tab
   */
  'tabs:navigate:next':
    | undefined
    | {
        event: KeyboardEvent
      }

  /**
   * Jumps to a specific tab, we can grab the number from the keyboard event
   */
  'tabs:focus:tab': { event: KeyboardEvent } | { index: number }

  /**
   * Focuses the last tab
   */
  'tabs:focus:tab-last':
    | undefined
    | {
        event: KeyboardEvent
      }
}
