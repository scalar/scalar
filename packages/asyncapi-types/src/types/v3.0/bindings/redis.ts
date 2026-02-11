/**
 * Protocol-specific information for a Redis server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type RedisServerBinding = Record<string, never>

/**
 * Protocol-specific information for a Redis channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type RedisChannelBinding = Record<string, never>
