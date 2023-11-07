/**
 * Takes Markdown and splits it into sections based on the level of the headers.
 */
export function splitMarkdownInSections(
  content: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
) {
  // Create a dynamic regex where the number of # is the same as the level
  const regex = new RegExp(`^(?=#{${level}} )`, 'm')

  return content
    .split(regex)
    .map((section) => section.trim())
    .filter(Boolean)
}
