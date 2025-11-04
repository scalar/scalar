import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { OperationExampleMeta, OperationMeta } from '@/mutators'

/** Event definitions for the operation */
export type OperationEvents = {
  /**
   * Update the selected example for the operation
   */
  'update:selected-example': {
    /** The name of the example to select */
    name: string
  }

  /** ------------------------------------------------------------------------------------------------
   * Operation Actions
   * ------------------------------------------------------------------------------------------------ */
  /**
   * Fires when the user requests to send the operation (e.g., triggers "Try It" or sends a request).
   * Contains the OperationExampleMeta, which identifies the operation and the example variant to use.
   */
  'operation:send:request': {
    meta: OperationExampleMeta
  }

  /** ------------------------------------------------------------------------------------------------
   * Operation Draft Mutators
   * ------------------------------------------------------------------------------------------------ */
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
   * Update the HTTP method for the operation.
   * Triggers when the user changes the HTTP verb (e.g., from GET to POST) in the UI for a given operation.
   */
  'operation:update:method': {
    payload: {
      /** The new method for the operation */
      method: HttpMethod
    }
    /** Identifies the target operation by original method and path */
    meta: OperationMeta
  }

  /**
   * Update the path for the operation.
   * Triggers when the user changes the endpoint path for a given operation in the UI.
   * - `payload.path` is the new path for the operation.
   * - `meta` identifies the operation by its original method and path.
   */
  'operation:update:path': {
    payload: {
      /** The new path for the operation */
      path: string
    }
    /** Identifies the target operation by original method and path */
    meta: OperationMeta
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
      key: string
      /** The example value for the parameter to add */
      value: string
      /** Whether the parameter is enabled */
      isEnabled: boolean
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
     * - key: The new name of the parameter (if being renamed).
     * - value: The new example value for the parameter.
     * - isEnabled: Whether the parameter is marked as enabled.
     */
    payload: Partial<{
      key: string
      value: string
      isEnabled: boolean
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
    payload: {
      /** The new value for the request body example */
      value: string | File | undefined
    }
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the updated request body value */
    meta: OperationExampleMeta
  }

  /**
   * Add a form-data row to the request body example.
   * Triggers when the user adds a new form-data row to the request body in the UI.
   */
  'operation:add:requestBody:formRow': {
    /** The payload containing the details of the form-data row to add */
    payload: Partial<{ key: string; value: string | File }>
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the added form-data row */
    meta: OperationExampleMeta
  }

  /**
   * Update a form-data row at the specified index for the request body example.
   * Triggers when the user updates an existing form-data row (name, value) in the UI for a given operation.
   */
  'operation:update:requestBody:formRow': {
    /** The zero-based index of the form-data row to update within the operation. */
    index: number
    /** The payload containing the details of the form-data row to update */
    payload: Partial<{ key: string; value?: string | File | null }>
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the updated form-data row */
    meta: OperationExampleMeta
  }

  /**
   * Delete a form-data row from the request body example.
   * Triggers when the user removes a form-data row (by type and index) from the request body in the UI.
   */
  'operation:delete:requestBody:formRow': {
    /** The zero-based index of the form-data row to delete within the operation. */
    index: number
    /** The content type of the request body */
    contentType: string
    /** Identifies the target operation and example variant for the deleted form-data row */
    meta: OperationExampleMeta
  }
}
