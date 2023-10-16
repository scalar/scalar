export const analyze = (spec: any) => {
  const hasTitle = spec.info?.title !== undefined

  const hasDescription = spec.info?.description !== undefined

  const numberOfTags = spec.tags?.length ?? 0

  const numberOfOperations = spec.tags.reduce(
    (acc: number, tag: any) => acc + (tag.operations?.length ?? 0),
    0,
  )

  return {
    hasTitle,
    hasDescription,
    numberOfTags,
    numberOfOperations,
  }
}
