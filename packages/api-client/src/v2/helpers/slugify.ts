export const slugify = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, '-')
}
