export const REGEX = {
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
