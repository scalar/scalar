export const REGEX = {
  /** Checks if the url starts with a protocol like file:// including {variable}:// */
  PROTOCOL: /^[a-zA-Z{}][a-zA-Z0-9+.{}-]*:\/\//,
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
