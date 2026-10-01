import type { TraversedExample, TraversedTag } from '@/schemas/navigation'

import type { NavigationItemPayload } from './navigation'

/**
 * Available actions that can be triggered from the command palette.
 * Each action may have an associated payload type.
 */
export type CommandPalettePayload = {
  /** Trigger the import flow for OpenAPI, Swagger, or cURL (Postman uses import-postman-collection) */
  'import-from-openapi-swagger-postman-curl': undefined
  /** Create a new document in the workspace */
  'create-openapi-document': undefined
  /** Add a new tag to organize requests */
  'add-tag': {
    /** The name of the document to add the tag to */
    documentName?: string
  }
  /** Edit an existing tag name */
  'edit-tag': {
    /** The current name of the tag to pre-fill in the input */
    tag: TraversedTag
    /** The name of the document the tag belongs to */
    documentName: string
  }
  /** Create a new HTTP request */
  'create-request': {
    /** The name of the document to create the request in */
    documentName?: string
    /** The tag id to add the request to (optional) */
    tagId?: string
  }
  /** Add a new example to an existing request */
  'add-example': {
    /** The name of the document to add the example to */
    documentName?: string
    /** The operation id to add the example to */
    operationId?: string
  }
  'edit-example': {
    /** The example to edit */
    example: TraversedExample
    /** The document name to edit the example in */
    documentName: string
    /** The operation id to edit the example in */
    operationId: string
  }
  /** Import a request from a cURL command string */
  'import-curl-command': {
    /** The cURL command string to parse and import */
    inputValue: string
  }
  /** Import a Postman collection from URL, file, or pasted JSON */
  'import-postman-collection': {
    /** Pre-filled collection JSON when opened from file or redirected paste */
    inputValue?: string
  }
}

/**
 * Type-safe command palette action with correlated action and payload.
 * This ensures that when an action is dispatched, it must include the correct payload type.
 *
 * Example:
 * - { action: 'create-openapi-document', payload: undefined }
 * - { action: 'import-curl-command', payload: { inputValue: 'curl ...' } }
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
   * Direct download is handled by a link to the document URL, not this event.
   */
  'ui:download:document': {
    /** Format to download the document in */
    format: 'json' | 'yaml'
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
        /** Whether to clear the address bar before focusing */
        clear?: boolean
      }
  /**
   * Focus the send button to execute a request.
   * Useful for keyboard-driven workflows.
   */
  'ui:focus:send-button': KeyboardEventPayload

  /**
   * Focus the search input in the sidebar.
   *
   * Drives the contextual sidebar search affordance: on the workspace page it
   * toggles the "filter documents" input at the top of the sidebar, and while
   * viewing a single document it opens the scoped document search modal. Also
   * used for quick filtering of requests and tags.
   *
   * Typically triggered by the Cmd/Ctrl+J hotkey (payload includes the
   * originating `KeyboardEvent` so listeners can preventDefault) but may also
   * be dispatched programmatically from a click, in which case no payload is
   * provided.
   */
  'ui:focus:search': KeyboardEventPayload | undefined

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
   * Open the "Create workspace" modal.
   *
   * Lets surfaces that do not have direct access to the modal state (for
   * example the mobile menu rendered by the outer app shell, outside of the
   * component that owns the modal) request that the modal be shown without
   * coupling them to the modal's implementation.
   */
  'ui:open:create-workspace': undefined

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

  /**
   * Request persisting the active document from a keyboard shortcut (Cmd/Ctrl+S).
   *
   * Hosts that show a local-only Save control (for example scalar-app) should
   * listen, call `event.preventDefault()` when they handle the shortcut, and
   * run their save path only when a save is actually allowed.
   */
  'ui:save:local-document': KeyboardEventPayload

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
   * Fired when a navigation item intersects with the viewport.
   * Used for highlighting active sections in the sidebar during scrolling.
   */
  'intersecting:nav-item': NavigationItemPayload

  /**
   * Copy the URL with anchor details for a navigation item.
   * Useful for sharing direct links to specific sections.
   */
  'copy-url:nav-item': NavigationItemPayload

  /**
   * Copies the whole URL in the addressbar including server and path
   */
  'copy-url:address-bar': undefined

  /**
   * Used by the api-client to copy the URL for the given tab index.
   */
  'tabs:copy:url': {
    /** The index of the tab to copy the URL for */
    index: number
  }
}
