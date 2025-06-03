/**
 * Type safe version of Object.keys
 * Can probably remove this whenever typescript adds it
 */
export const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[]
