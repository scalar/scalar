/**
 * Server Bindings Object - Protocol-specific bindings for servers.
 */
export type ServerBindingsObject = {
  /** Protocol-specific binding information for servers. */
  [key: string]: any
}

/**
 * Channel Bindings Object - Protocol-specific bindings for channels.
 */
export type ChannelBindingsObject = {
  /** Protocol-specific binding information for channels. */
  [key: string]: any
}

/**
 * Operation Bindings Object - Protocol-specific bindings for operations.
 */
export type OperationBindingsObject = {
  /** Protocol-specific binding information for operations. */
  [key: string]: any
}

/**
 * Message Bindings Object - Protocol-specific bindings for messages.
 */
export type MessageBindingsObject = {
  /** Protocol-specific binding information for messages. */
  [key: string]: any
}
