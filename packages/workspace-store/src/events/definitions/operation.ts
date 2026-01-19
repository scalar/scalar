import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { OperationObject } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Describes the minimal identity for an operation in the workspace document.
 * It is used by mutators to find the target operation under `paths`.
 *
 * Example:
 * ```ts
 * const meta: OperationMeta = { method: 'get', path: '/users/{id}' }
 * ```
 */
export type OperationMeta = {
  method: HttpMethod
  path: string
}

/**
 * Extends {@link OperationMeta} with an `exampleKey` to address a specific
 * example variant (e.g. per environment or scenario) for request/parameters.
 *
 * Example:
 * ```ts
 * const meta: OperationExampleMeta = {
 *   method: 'post',
 *   path: '/upload',
 *   exampleKey: 'default',
 * }
 * ```
 */
export type OperationExampleMeta = OperationMeta & {
  exampleKey: string
}

/** Event definitions for the operation */
export type OperationEvents = {
  //------------------------------------------------------------------------------------
  // Operation Actions
  //------------------------------------------------------------------------------------

  /**
   * The hotkey trigger for sending the request
   * We handle this inside of the OperationBlock component so we can build the request first then fire the event
   */
  'operation:send:request:hotkey': undefined

  /** Cancel the in progress request */
  'operation:cancel:request': undefined

  //------------------------------------------------------------------------------------
  // Operation Draft Mutators
  //------------------------------------------------------------------------------------

  /**
   * Create a new operation at a specific path and method in the document.
   * Triggers when the user creates a new endpoint via the command palette or other UI.
   */
  'operation:create:operation': {
    /** The document name where the operation should be created */
    documentName: string
    /** The example key for the new operation */
    exampleKey?: string
    /** The path for the new operation (will be normalized to start with /) */
    path: string
    /** The HTTP method for the operation */
    method: HttpMethod
    /** The operation object to create */
    operation: OperationObject
    /** The callback to call when the operation is created */
    callback?: (success: boolean) => void
  }

  /**
   * Update the summary for the operation.
   * Triggers when the user edits the summary/description for an endpoint.
   * The new summary is provided in the payload, and meta identifies the operation by HTTP method and path.
   */
  'operation:update:summary': {
    /** The new summary string to set for the operation. */
    payload: {
      summary: string
    }
    /** Operation identity for which the summary is being updated (method and path) */
    meta: OperationMeta
  }

  /**
   * Update the HTTP method or path for the operation.
   * Triggers when the user changes the HTTP verb (e.g., from GET to POST) or path in the UI for a given operation.
   * We send the full payload each time
   */
  'operation:update:pathMethod': {
    payload: {
      /** The new or old method for the operation */
      method: HttpMethod
      /** The new or old path for the operation */
      path: string
    }
    /** Identifies the target operation by original method and path */
    meta: OperationMeta
    /** Callback, on completion */
    callback: (status: 'conflict' | 'no-change' | 'success') => void
  }

  /**
   * Delete an operation from the workspace
   */
  'operation:delete:operation': {
    /** The document name where the operation should be deleted */
    documentName: string
    /** Identifies the target operation by original method and path */
    meta: OperationMeta
  }

  /**
   * Delete an example from the operation
   */
  'operation:delete:example': {
    /** The document name where the operation should be deleted */
    documentName: string
    /** Identifies the target operation by original method and path */
    meta: OperationExampleMeta
  }

  /** ------------------------------------------------------------------------------------------------
   * Operation Parameters Mutators
   * ------------------------------------------------------------------------------------------------ */
  /**
   * Add a parameter to the operation.
   */
  'operation:add:parameter': {
    /**
     * The type of the parameter to add. Can be 'path', 'query', 'header', or 'cookie'.
     */
    type: 'path' | 'query' | 'header' | 'cookie'
    /**
     * The payload containing the details of the parameter to add.
     */
    payload: {
      /** The name of the parameter to add */
      name: string
      /** The example value for the parameter to add */
      value: string
      /** Whether the parameter is enabled */
      isDisabled: boolean
    }
    /** Identifies the target operation and example variant for the added parameter */
    meta: OperationExampleMeta
  }

  /**
   * Update a parameter of the operation.
   * Triggers when the user updates an existing parameter (name, value, or enabled/disabled) in the UI for a given operation.
   */
  'operation:update:parameter': {
    /**
     * The type of the parameter to update. Can be 'path', 'query', 'header', or 'cookie'.
     */
    type: 'path' | 'query' | 'header' | 'cookie'
    /**
     * The zero-based index of the parameter of the given type being updated within the operation.
     */
    index: number
    /**
     * Partial payload with new properties for the parameter (optional).
     * - name: The new name of the parameter (if being renamed).
     * - value: The new example value for the parameter.
     * - isDisabled: Whether the parameter is marked as disabled.
     */
    payload: Partial<{
      name: string
      value: string
      isDisabled: boolean
    }>
    /**
     * Identifies the target operation and example variant for the updated parameter.
     */
    meta: OperationExampleMeta
  }

  /**
   * Delete a parameter from an operation at the specified index and type.
   * Fires when the user removes a parameter (by type and index) from an operation.
   */
  'operation:delete:parameter': {
    /** The type of the parameter to delete. Can be 'path', 'query', 'header', or 'cookie'. */
    type: 'path' | 'query' | 'header' | 'cookie'
    /** The zero-based index of the parameter of the given type to be deleted within the operation. */
    index: number
    /** Identifies the target operation and example variant for the deleted parameter. */
    meta: OperationExampleMeta
  }

  /**
   * Delete all parameters of a given type from the operation.
   * Fires when the user removes all parameters of a specific type from an operation.
   */
  'operation:delete-all:parameters': {
    /** The type of the parameters to delete. Can be 'path', 'query', 'header', or 'cookie'. */
    type: 'path' | 'query' | 'header' | 'cookie'
    /** Identifies the target operation for the parameter deletion. */
    meta: OperationMeta
  }

  //------------------------------------------------------------------------------------------------
  // Operation Request Body Mutators
  //------------------------------------------------------------------------------------------------
  /**
   * Update the selected request-body content type for the current example key.
   * Triggers when the user selects a new content type for the request body in the UI.
   */
  'operation:update:requestBody:contentType': {
    payload: {
      /** The new content type for the request body */
      contentType: string
    }
    /** Identifies the target operation and example variant for the updated content type */
    meta: OperationExampleMeta
  }

  /**
   * Update the value for the request body example.
   * Triggers when the user updates the example value for a specific request body content type.
   */
  'operation:update:requestBody:value': {
    /** The new value for the request body example */
    payload: string | File | undefined
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the updated request body value */
    meta: OperationExampleMeta
  }

  /**
   * Update the form data for the request body example.
   * Triggers when the user updates the form data for a specific request body content type.
   * It will go through and add each example to the respective schema object
   */
  'operation:update:requestBody:formValue': {
    /** The new value for the request body example */
    payload: { name: string; value: string | File; isDisabled: boolean }[]
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the updated request body value */
    meta: OperationExampleMeta
  }
}
