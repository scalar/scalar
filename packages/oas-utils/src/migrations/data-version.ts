/**
 * Ensure we update this every migration
 *
 * previous data versions:
 * - undefined
 * - 0.0.0
 * - 2.1.0 - refactor
 * - 2.2.0 - auth compliancy
 * - 2.3.0 - environments
 * - 2.4.0 - draft collection servers
 * - 2.5.0 - accept header
 */
export const DATA_VERSION = '2.5.0'

/** The localStorage key under which the data version is stored */
export const DATA_VERSION_LS_LEY = 'scalar_api_client_data_version'
