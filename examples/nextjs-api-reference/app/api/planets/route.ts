/** Return the same small dataset in development and deployed previews. */
export const GET = (): Response =>
  Response.json([
    { id: 'earth', name: 'Earth', moons: 1 },
    { id: 'mars', name: 'Mars', moons: 2 },
  ])
