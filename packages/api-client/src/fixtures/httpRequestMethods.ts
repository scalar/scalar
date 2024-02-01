export const validRequestMethods = [
    'GET',
    'POST',
    'PUT',
    'HEAD',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'CONNECT',
    'TRACE',
] as const

export type RequestMethod = typeof validRequestMethods[number];


export function isRequestMethod(s: string): s is RequestMethod {
return validRequestMethods.includes(s as RequestMethod)
}

export const requestMethodColors: { [x in RequestMethod]: string } = {
    POST: 'var(--theme-color-green, var(--default-theme-color-green))',
    DELETE: 'var(--theme-color-red, var(--default-theme-color-red))',
    PATCH: 'var(--theme-color-yellow, var(--default-theme-color-yellow))',
    GET: 'var(--theme-color-blue, var(--default-theme-color-blue))',
    PUT: 'var(--theme-color-orange, var(--default-theme-color-orange))',
    OPTIONS: 'var(--theme-color-purple, var(--default-theme-color-purple))',
    HEAD: 'var(--theme-color-ghost, var(--default-theme-color-ghost))',
    CONNECT: 'var(--theme-color-ghost, var(--default-theme-color-ghost))',
    TRACE: 'var(--theme-color-ghost, var(--default-theme-color-ghost))',
}