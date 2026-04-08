/** Type safe version of Object.entries */
export const objectEntries = <T extends object>(obj: T): [Extract<keyof T, string>, T[keyof T]][] =>
  Object.entries(obj) as [Extract<keyof T, string>, T[keyof T]][]
