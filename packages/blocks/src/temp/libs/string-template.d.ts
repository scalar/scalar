/**
 * Get the nested value from a context object
 *
 */
export declare function getDotPathValue(path: string, context: object): string
/**
 * Replace all variables with values from a context object
 *
 * - {{ double curly }}
 * - { single curly }
 * - :colon
 *
 * @deprecated Use replaceVariables from @scalar/helpers/regex/replace-variables instead
 */
export declare function replaceTemplateVariables(templateString: string, context: object): string
/**
 * Return a list of key/value pairs for the environment
 * Nested values will be dot-path referenced
 */
export declare function flattenEnvVars(environment: object): [string, string][]
//# sourceMappingURL=string-template.d.ts.map
