import { escapeJsonForInlineScript } from './escape-json-for-inline-script'

/** Serialize a property name for a JavaScript object literal inside an inline script. */
export const serializePropertyKey = (key: string): string => escapeJsonForInlineScript(JSON.stringify(key))
