export const REGEX = {
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
} as const
