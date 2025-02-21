// TODO: Better error handling
export const getPointers = (dataPath) => {
  const pointers = dataPath.split('/').slice(1)
  for (const index in pointers) {
    pointers[index] = pointers[index].split('~1').join('/').split('~0').join('~')
  }
  return pointers
}
