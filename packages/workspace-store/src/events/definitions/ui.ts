import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/**
 * Available actions that can be triggered from the command palette.
 * Each action may have an associated payload type.
 */
export type CommandPalettePayload = {
  /** Trigger the import flow for OpenAPI, Swagger, Postman, or cURL */
  'import-from-openapi-swagger-postman-curl': undefined
  /** Create a new document in the workspace */
  'create-document': undefined
  /** Add a new tag to organize requests */
  'add-tag': {
    /** The document id to add the tag to */
    documentId?: string
  }
  /** Create a new HTTP request */
  'create-request': {
    /** The document id to create the request in */
    documentId?: string
    /** The tag id to add the request to (optional) */
    tagId?: string
  }
  /** Add a new example to an existing request */
  'add-example': {
    /** The document id to add the example to */
    documentId?: string
    /** The operation id to add the example to */
    operationId?: string
  }
  /** Import a request from a cURL command string */
  'import-curl-command': {
    /** The cURL command string to parse and import */
    inputValue: string
  }
}

/**
 * Type-safe command palette action with correlated action and payload.
 * This ensures that when an action is dispatched, it must include the correct payload type.
 *
 * Example:
 * - { action: 'create-document', payload: undefined }
 * - { action: 'import-curl-command', payload: { curl: 'curl ...' } }
 */
export type CommandPaletteAction<K extends keyof CommandPalettePayload = keyof CommandPalettePayload> = {
  /** The action to perform */
  action: K
  /** The payload for this action, typed based on the action */
  payload: CommandPalettePayload[K]
  /** Optional keyboard event that triggered this action */
  event?: KeyboardEvent
}

/**
 * Common payload for keyboard-triggered events.
 * Used when we need to track the original keyboard event for things like
 * preventing default behavior or stopping propagation.
 */
export type KeyboardEventPayload = {
  /** The keyboard event that triggered this action */
  event: KeyboardEvent
}

/**
 * Common payload for navigation item operations.
 * Navigation items include tags, operations, folders, etc. in the sidebar.
 */
type NavigationItemPayload = {
  /** The unique identifier of the navigation item */
  id: string
}

/**
 * Event definitions for controlling the UI.
 * These events are dispatched through the event bus to trigger UI actions
 * across different components without tight coupling.
 */
export type UIEvents = {
  // ────────────────────────────────────────────────────────────
  // Download Events
  // ────────────────────────────────────────────────────────────

  /**
   * Download the OpenAPI document from the store.
   * Supports multiple export formats for different use cases.
   */
  'ui:download:document': {
    /** Format to download the document in */
    format: 'json' | 'yaml' | 'direct'
  }

  // ────────────────────────────────────────────────────────────
  // Focus Events
  // ────────────────────────────────────────────────────────────

  /**
   * Focus the address bar input field.
   * Typically triggered by keyboard shortcuts for quick navigation.
   */
  'ui:focus:address-bar':
    | KeyboardEventPayload
    | {
        position?: 'start' | 'end' | number
      }
    | undefined
  /**
   * Focus the send button to execute a request.
   * Useful for keyboard-driven workflows.
   */
  'ui:focus:send-button': KeyboardEventPayload

  /**
   * Focus the search input in the sidebar.
   * Allows quick filtering of requests and tags.
   */
  'ui:focus:search': KeyboardEventPayload

  // ────────────────────────────────────────────────────────────
  // Toggle Events
  // ────────────────────────────────────────────────────────────

  /**
   * Toggle the sidebar visibility.
   * Useful for maximizing content area on smaller screens.
   */
  'ui:toggle:sidebar': KeyboardEventPayload

  // ────────────────────────────────────────────────────────────
  // Modal Events
  // ────────────────────────────────────────────────────────────

  /**
   * Open the API Client modal to a specific operation.
   * This allows deep linking into specific endpoints from external sources.
   */
  'ui:open:client-modal':
    | undefined
    | {
        /** The id of the operation to directly load */
        id: string
      }
    | {
        /** The HTTP method of the operation to load (e.g., GET, POST) */
        method: HttpMethod
        /** The path of the operation to load (e.g., /users/{id}) */
        path: string
        /** Optional example name to load for this operation */
        exampleName?: string
      }

  /**
   * Close the API Client modal.
   * Typically triggered by escape key or clicking outside the modal.
   */
  'ui:close:client-modal': KeyboardEventPayload | undefined

  // ────────────────────────────────────────────────────────────
  // Command Palette Events
  // ────────────────────────────────────────────────────────────

  /**
   * Open the command palette.
   * Can optionally pre-fill with a specific action to execute.
   * If undefined is passed, opens the palette without a pre-selected action.
   */
  'ui:open:command-palette': CommandPaletteAction | KeyboardEventPayload | undefined

  // ────────────────────────────────────────────────────────────
  // Navigation Item Events
  // ────────────────────────────────────────────────────────────

  /**
   * Toggle a navigation item's expanded state.
   * Used for collapsible items like tags, folders, or operation groups.
   */
  'toggle:nav-item': NavigationItemPayload & {
    /** If provided, sets the state explicitly instead of toggling */
    open?: boolean
  }

  /**
   * Select a navigation item.
   * Fired when clicking on a sidebar item where a scroll handler would typically be expected.
   * This does not automatically scroll to the item.
   */
  'select:nav-item': NavigationItemPayload

  /**
   * Fired when a navigation item intersects with the viewport.
   * Used for highlighting active sections in the sidebar during scrolling.
   */
  'intersecting:nav-item': NavigationItemPayload

  /**
   * Explicitly scroll to a navigation item in the content area.
   * This will move the viewport to show the corresponding content.
   */
  'scroll-to:nav-item': NavigationItemPayload

  /**
   * Copy the URL with anchor details for a navigation item.
   * Useful for sharing direct links to specific sections.
   */
  'copy-url:nav-item': NavigationItemPayload

  /**
   * Used by the api-client to copy the URL for the given tab index.
   */
  'tabs:copy:url': {
    /** The index of the tab to copy the URL for */
    index: number
  }
  /**
   * Route to a page
   * We cannot have any routing in any components used by the modal so we use this event to route to a page
   */
  'ui:route:page': {
    /** The name of the route to route to */
    name: string
  }
  /**
   * Route to an example page
   * We cannot have any routing in any components used by the modal so we use this event to route to an example page
   *
   * This will only route to the example for the current operation.
   */
  'ui:route:example': {
    /** The example name to route to */
    exampleName: string
    /** The callback to call when navigation is complete */
    callback: (status: 'success' | 'error') => void
  }
}
