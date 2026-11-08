/**
 * The hero on the home page: the old desktop wallpaper's hill, drawn in the fine, grainy lines of
 * /products/sdk-generator and /products/api-hosting, with wind in its grass.
 *
 * Four things are drawn:
 *
 * 1. The land, drawn as the land on /products/api-hosting is, in sheets of hairlines: the wallpaper's hill, its line
 *    measured off the photograph, with a band of sky over it, a slate ridge peeking over its far side, and a meadow in
 *    front that thins into specks at the foot. Shrubs sit along the hill's line and the meadow's, some of them in flower.
 * 2. The grass. Fine blades stand in the meadow and the wind runs through them in gusts. Now and then something unseen
 *    goes through the meadow: the grass and the flowers part round it as it goes by and spring back after it. The pointer
 *    does the same.
 * 3. The flowers, painted rather than drawn, after an impressionist's garden and seen as a lens with a shallow depth of
 *    field sees a meadow: each one a stroke or two of a loaded brush, crisp in the middle distance, large and soft at the
 *    front, and specks fading into the green up the hill. They heap into drifts with plain grass between them, two of
 *    which climb the hill, and here and there a flower is painted petal by petal for the eye to find. And two clouds of
 *    frosted glass in the sky, the land seen through them.
 * 4. A few of the butterflies of /products/api-hosting, small and without the planets they carry there, over the meadow.
 *
 * The same engine draws two more pictures on the page, each to a composition of its own (see the modes): the arched
 * window in the closing card's hosting diagram, a sky with a meadow under it, painted once; and a meadow round the site's
 * footer, made by this file in the band under the footer while the page is open. Only one of them ever draws in a
 * frame (see the conductor).
 *
 * Pages on scalar.com render on the client and hydrate over the first copy of the hero, so binding goes through a
 * MutationObserver with a dataset flag on the element: a node replaced by hydration comes back unbound and heals itself.
 */
;(() => {
  // The docs run a route's scripts again on every visit. The first run watches the page for good, so a later one has
  // nothing to add.
  if (window.__scalarHeadlessHero) {
    return
  }
  window.__scalarHeadlessHero = true

  const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

  /* --- the land ------------------------------------------------------------------------------------ */

  /* The recipe every line is drawn to, the one /products/api-hosting draws its land to. Lengths are CSS pixels. */
  const LINES = {
    pitch: 2.5,
    closest: 2.2,
    keep: 0.25,
    fill: 0.62,
    brick: [46, 130],
    gap: 0.9,
    flow: 0.018,
    beadCell: 8.2,
    beadChance: 0.8,
    beadSize: 0.68,
    beadFlow: 1.7,
    grain: 0.85,
    /* Round the words lies a soft oval of page, as the docs hero lays one under its own: as wide and as tall as the
       words' box and this much more to either side and above and below, clear out to `veilCore` of the way to its rim
       and thinning out from there, so wherever the land comes up beside the words it meets them along a curve. (A
       composition can have it thin the lines rather than clear them: see veilFragment.) */
    veil: [110, 85],
    veilCore: 0.5,
    sink: 60,
    /* the lines shoot across once, on the way in */
    introMs: 1700,
  }

  /* The inks of the land, as [on a light page, on a dark page], after the wallpaper: its sky, pale at the horizon and
     deeper above, the slate of the far ridge, the hill's lime crest and deep green body, and the straw where the meadow
     thins out; and after the garden in the second picture, the shrubs' leaves, lit on top and dark below. */
  const LAND_INK = {
    pale: ['#c9e0f8', '#d8e8fb'],
    sky: ['#94c3f1', '#aacff6'],
    blue: ['#5f9fe9', '#78b1f0'],
    deep: ['#3a7fdb', '#5596ea'],
    slateHaze: ['#bcc5ea', '#c9d0ef'],
    slate: ['#8593cc', '#a3aee0'],
    lime: ['#a6d544', '#b6df5e'],
    green: ['#5aa82b', '#74bb44'],
    deepGreen: ['#337f22', '#4f9b3b'],
    olive: ['#b3c455', '#c3d26c'],
    sheen: ['#eef6c4', '#f4f9d8'],
    straw: ['#e2dfa0', '#eae8b6'],
    sun: ['#9cc256', '#aecd6c'],
    leaf: ['#5a8a3a', '#72a352'],
    shade: ['#3d6a2e', '#55854a'],
  }

  /* The wallpaper's hill, measured off the photograph: how far below its crest the hill's line is at each place across,
     in the land's room on a stage 1232 CSS pixels wide, with the rise and the fall made 1.4 times as steep so that it still
     reads as that hill in a band this low. The crest is a broad shoulder a quarter of the way in; from there the hill falls
     a little to the left edge, and a long way to the right at an even slope. */
  const BLISS = [
    [-1.6, 0.52],
    [-1.3, 0.31],
    [-1, 0.13],
    [-0.9, 0.08],
    [-0.8, 0.038],
    [-0.7, 0.016],
    [-0.6, 0.005],
    [-0.5, 0],
    [-0.4, 0.006],
    [-0.3, 0.026],
    [-0.2, 0.056],
    [-0.1, 0.092],
    [0, 0.132],
    [0.2, 0.218],
    [0.4, 0.31],
    [0.6, 0.402],
    [0.8, 0.494],
    [1, 0.586],
    [1.3, 0.72],
    [1.6, 0.85],
  ]
  /* Where the crest is in the land's room: just under its top line, out to the left of the words. */
  const CREST = 0.04
  /* The hill keeps the photograph's slopes, so it rises and falls less on a narrow stage than on a wide one, within
     these shares of the measured height. */
  const RELIEF = [0.55, 1.15]

  /* The shrubs' inks, from the top of a heap down: lit on top, and in their own shade below. */
  const SHRUB_PAINT = [
    [0, 'sun', 0.9],
    [0.2, 'leaf', 1],
    [0.55, 'shade', 1],
    [1, 'shade', 1],
  ]

  /* The sheets of the land, from the farthest to the nearest, in the terms /products/api-hosting uses. A place on a
     sheet is [across, down]: across is a share of the half-width from the middle, and may run off either side; down is
     in rooms, from 0 just over the hill's crest to 1 a room further down; the sky reaches above 0 and the meadow's foot
     below 1. A sheet is lofted between `top` and `foot`, and `paint` reads from
     one to the other as [how far across, ink, how much of the line there is]. A guide is a list of places, the wallpaper's
     hill measured from its crest (`crest`), or so far above or below the hill's line (`hill`). `lean` turns the paint
     across the stage, so the hill's crest is lit on the left and in shade on the right, as the wallpaper's is. A sheet of
     `shrubs` is heaps sitting on the hill's line or the meadow's: [across, half its width and its height in CSS pixels at a
     stage of 1300, whether it is gorse in flower]. A sheet that is `laid` on other land, as the meadow is on the hill,
     has no page to hide at its top edge, so there its wash comes in only with the haze under its lines. */
  const LAND = [
    {
      name: 'sky',
      top: {
        crest: [
          [-1.6, -0.28],
          [-1, -0.22],
          [-0.8, -0.2],
          [-0.65, -0.16],
          [-0.55, -0.11],
          [-0.45, -0.05],
          [-0.35, 0],
          [-0.2, 0.04],
          [0, 0.08],
          [0.2, 0.13],
          [0.4, 0.15],
          [0.6, 0.14],
          [0.8, 0.12],
          [1, 0.11],
          [1.6, 0.08],
        ],
      },
      /* It runs on under the hill, so that no page shows through at its crest. */
      foot: {
        hill: [
          [-1.6, 0.07],
          [1.6, 0.07],
        ],
      },
      paint: [
        [0, 'pale', 0],
        [0.06, 'sky', 0.4],
        [0.2, 'blue', 0.9],
        [0.42, 'deep', 1],
        [0.62, 'blue', 1],
        [0.8, 'sky', 1],
        [1, 'pale', 1],
      ],
      fill: 0.7,
      under: 0.38,
      flow: 1.2,
      breath: 2,
    },
    {
      name: 'far ridge',
      opaque: true,
      top: {
        crest: [
          [0.3, 0.36],
          [0.6, 0.41],
          [0.75, 0.43],
          [0.85, 0.42],
          [0.92, 0.395],
          [0.97, 0.405],
          [1.05, 0.39],
          [1.3, 0.37],
          [1.6, 0.35],
        ],
      },
      foot: {
        hill: [
          [0.3, 0.1],
          [1.6, 0.1],
        ],
      },
      paint: [
        [0, 'slateHaze', 0],
        [0.08, 'slateHaze', 0.8],
        [0.4, 'slate', 1],
        [1, 'slate', 1],
      ],
      fill: 0.72,
      under: 0.5,
      patch: 0.2,
      flow: 0.5,
      breath: 1.2,
    },
    {
      name: 'hill',
      opaque: true,
      top: { crest: BLISS },
      foot: [
        [-1.6, 1.3],
        [-0.5, 1.12],
        [0.5, 1.08],
        [1.6, 1.22],
      ],
      paint: [
        [0, 'lime', 0],
        [0.025, 'lime', 0.9],
        [0.1, 'lime', 1],
        [0.22, 'green', 1],
        [0.36, 'deepGreen', 1],
        [0.55, 'green', 1],
        [0.75, 'olive', 1],
        [1, 'olive', 1],
      ],
      lean: 0.3,
      fill: 0.74,
      under: 0.6,
      patch: 0.3,
      flow: 0.7,
      breath: 1.5,
      sheen: 1,
    },
    {
      name: 'far shrubs',
      opaque: true,
      on: 'hill',
      shrubs: [
        [0.64, 22, 13, false],
        [0.7, 15, 9, true],
        [0.84, 30, 17, false],
        [0.915, 18, 11, true],
      ],
      paint: SHRUB_PAINT,
      fill: 0.8,
      under: 0.7,
      patch: 0.25,
      flow: 0.3,
      breath: 0.8,
    },
    {
      name: 'meadow',
      opaque: true,
      laid: true,
      top: {
        hill: [
          [-1.6, 0.62],
          [-1, 0.52],
          [-0.5, 0.5],
          [0, 0.42],
          [0.5, 0.34],
          [1, 0.3],
          [1.6, 0.3],
        ],
      },
      foot: [
        [-1.6, 1.42],
        [-1, 1.3],
        [-0.5, 1.2],
        [0, 1.1],
        [0.5, 1.12],
        [1, 1.22],
        [1.6, 1.36],
      ],
      paint: [
        [0, 'green', 0],
        [0.05, 'green', 0.86],
        [0.22, 'green', 1],
        [0.5, 'olive', 1],
        [0.7, 'olive', 0.9],
        [0.84, 'straw', 0.5],
        [0.93, 'straw', 0.2],
        [1, 'straw', 0],
      ],
      fill: 0.68,
      under: 0.5,
      patch: 0.2,
      flow: 0.8,
      breath: 2,
      sheen: 1,
    },
    {
      name: 'near shrubs',
      opaque: true,
      on: 'meadow',
      shrubs: [
        [-0.9, 46, 30, true],
        [-0.77, 30, 20, false],
        [0.3, 40, 26, false],
        [0.42, 26, 18, true],
        [0.62, 50, 32, true],
      ],
      paint: SHRUB_PAINT,
      fill: 0.8,
      under: 0.7,
      patch: 0.25,
      flow: 0.3,
      breath: 0.8,
    },
  ]

  /* How far a shrub sits down into the ground, in the land's room. */
  const SHRUB_SINK = 0.022

  /* The room the land has, in CSS pixels: the length every place on it is measured in. */
  const LAND_ROOM = 256
  /* The land stands on the canvas's foot, so that the logos under the hero come under all of it: the lowest of its
     meadow's foot this many CSS pixels above the canvas's, as it stood above the foot of the canvas it was first drawn
     on, so the same few specks thin out there. The page makes the canvas reach far enough below the words for that to
     put the land's top line just under the buttons, a little above where it first was (--hl-land in
     guides/headless/index.md, which counts on these numbers). A canvas too short to hold all of the land, from the top
     of its sky to there, makes its room smaller, keeping its sky's top this far under the canvas's top. */
  const LAND_FOOT = 19
  const LAND_HEAD = 12

  /* --- the grass ----------------------------------------------------------------------------------- */

  /* Blades stand on the hill and the meadow: `across` is how many to a CSS pixel of width, `tall` how tall they are far up
     the hill and close to the front, and `wide` how wide at the root. `rest` is how far they lean with no wind at all. Their
     inks are the land's, by how near they are. */
  const GRASS = {
    tufts: 0.1,
    lane: 0.07,
    blades: [3, 7],
    singles: 0.35,
    tall: [8, 40],
    wide: [0.55, 1.05],
    rest: 0.12,
    fan: 0.32,
    inks: ['lime', 'green', 'deepGreen', 'olive', 'straw'],
  }

  /* What moves the grass besides the wind is kept as a short trail of stirs: where something went by, how long ago, how
     hard, and which way it was going. `reach` is how far a stir is felt, in CSS pixels; `life` how long, in seconds, while
     the grass it pushed over springs back past upright and settles; `every` how far apart along its way stirs are laid. */
  const STIR = { count: 48, reach: 62, life: 2.6, every: 9 }

  /* The unseen thing that goes through the meadow now and then, as the horse did: when it first comes, how often, how
     long it takes to cross, how far down the meadow it keeps (0 is the hill's crest, 1 the land's foot), how much it
     wanders, and how hard it pushes. It lays its stirs at half the spacing the pointer does, so that the parting runs
     on smoothly round it. */
  const PASSER = { first: 1.8, every: 13, across: 8.5, lane: 0.66, wander: 0.07, push: 0.6 }

  /* --- the flowers --------------------------------------------------------------------------------- */

  /* The flowers, after the two pictures: painted rather than drawn, and seen as a lens with a shallow depth of field
     sees a meadow. A flower is a stroke or two of a loaded brush. The eye is on the middle of the meadow, where the
     strokes are crisp and a very few flowers show their petals; in front of it they grow large and soft, as what is out
     of focus does, and up the hill they shrink to specks that fade into the green. They heap up into drifts with plain
     grass between them, set at different depths so that none of them lines up with the next, and dark leaves are
     brushed in under the heaps so that the flowers sit in a green of their own.

     How near a place is runs from the hill's crest (0) to the land's foot (1). Across is a share of the half-width the
     meadow was laid out on, `stage`, which a wide screen does not stretch: past it, the drifts at either side carry on.
     Nothing stands at the very front further than `front` from the middle. Lengths are CSS pixels. */
  const FLOWERS = {
    stage: 640,
    front: 1.15,
    /* A flower's size by how near: `far` at the crest and `close` at the foot, growing as `curve` says, as things grow
       towards the eye; each is then its own size, within `own`. A stem's height likewise. */
    size: { far: 1.6, close: 22, curve: 2.6, own: [0.7, 1.3] },
    stem: { far: 1, close: 26, curve: 1.8, own: [0.6, 1.3] },
    /* A stroke's width for its length: a dab, not a streak. Past the focus, out of focus, they are rounder. */
    wide: [0.6, 0.9],
    /* Where the eye is focused, and how wide a soft edge a flower has for each pixel of size it is larger (in front of
       the focus) or smaller (behind it) than one in focus. The blur grows towards the eye, but never past `most` of a
       flower's size, so that a near one keeps an edge; away from the eye it stops at `deepest`, so the specks up the hill
       stay specks. Nothing is softer than `least`. */
    focus: 0.62,
    blur: { behind: 0.55, deepest: 1.8, front: 0.55, most: 0.4, least: 0.3 },
    /* How much of the ground the flowers cover where a drift is thickest, by how near: they overlap at the front and
       thin to a haze of specks up the hill, where each is smaller than its size by `far`, and fainter: a flower carries
       0.95 of a full load from 0.5 on and fades to 0.35 by 0.12. A composition can give `fade: [from, to, least]` for its
       own (the footer's far flowers stay strong, so that far off they read as a field of colour). */
    cover: [
      [0, 0.3],
      [0.2, 1.3],
      [0.35, 2.1],
      [0.5, 3],
      [0.65, 4.2],
      [0.8, 3],
      [1, 2.2],
    ],
    far: [0.5, 0.9],
    /* How many in the middle distance are painted with their petals, how many show a stem, how many have dark leaves
       brushed in round their feet, and how thickly leaves are brushed in under a drift on their own. */
    crisp: 0.012,
    stems: 0.2,
    leaves: 0.25,
    bed: 0.32,
    /* The drifts. Each runs along a line of places [across, near], reaches `wide` to either side of it, at its start and
       at its end, is as `full` as it is there, and is painted from one of the PALETTES; a `patchy` one breaks into
       clumps (past `patchyFrom` of the way along, if it has one), and one with `gaps` gives way to wide stretches of plain
       grass. A drift with `own` sizes its flowers within those bounds instead. */
    drifts: [
      /* the meadow itself, thinly scattered with every colour in clumps on either side, broken by wide stretches of
         plain grass, and left to a few clumps under the words */
      {
        line: [
          [-2.4, 0.42],
          [-1.6, 0.5],
          [-0.95, 0.6],
          [-0.5, 0.78],
        ],
        wide: [0.3, 0.28],
        full: [0.18, 0.42],
        paints: 'meadow',
        patchy: true,
        gaps: true,
      },
      {
        line: [
          [0.45, 0.74],
          [0.85, 0.68],
          [1.5, 0.5],
          [2.4, 0.42],
        ],
        wide: [0.28, 0.3],
        full: [0.42, 0.18],
        paints: 'meadow',
        patchy: true,
        gaps: true,
      },
      /* the great warm sweep: heaped at the front on the right, then up through the meadow and onto the slope, where it
         thins into a haze among the far shrubs */
      {
        line: [
          [1.1, 0.92],
          [0.92, 0.8],
          [0.76, 0.64],
          [0.66, 0.46],
          [0.6, 0.3],
          [0.57, 0.14],
        ],
        wide: [0.32, 0.14],
        full: [1, 1],
        paints: 'poppies',
      },
      /* a pale one, heaped at the front on the left, bending back towards the shrubs and breaking into clumps as it
         goes, until it is only specks */
      {
        line: [
          [-1.1, 0.93],
          [-0.9, 0.84],
          [-0.84, 0.7],
          [-0.7, 0.6],
          [-0.58, 0.34],
        ],
        wide: [0.28, 0.1],
        full: [1, 0.45],
        paints: 'daisies',
        patchy: true,
        patchyFrom: 0.45,
        own: [0.55, 1.5],
      },
      /* clumps of cosmos and buttercups, each at its own depth: one near and soft on the left, one crossing the
         meadow's top edge under the words, and buttercups nearer on the right */
      {
        line: [
          [-0.5, 0.84],
          [-0.36, 0.8],
        ],
        wide: [0.04, 0.04],
        full: [1, 1],
        paints: 'cosmos',
      },
      {
        line: [
          [-0.06, 0.44],
          [0.12, 0.62],
        ],
        wide: [0.05, 0.07],
        full: [0.8, 0.8],
        paints: 'cosmos',
        patchy: true,
      },
      {
        line: [
          [0.16, 0.86],
          [0.24, 0.8],
        ],
        wide: [0.04, 0.04],
        full: [1, 1],
        paints: 'buttercups',
      },
      /* a few soft ones at the front, between the great heaps, at different depths */
      {
        line: [
          [-0.66, 0.95],
          [-0.52, 0.98],
        ],
        wide: [0.05, 0.04],
        full: [0.75, 0.75],
        paints: 'cosmos',
      },
      {
        line: [
          [0.06, 0.9],
          [0.2, 0.92],
        ],
        wide: [0.04, 0.04],
        full: [1, 1],
        paints: 'daisies',
      },
      /* a thin arm of the meadow reaching up the hill, left of the middle, so the flowers do not all stop at one line */
      {
        line: [
          [-0.24, 0.62],
          [-0.32, 0.48],
          [-0.42, 0.36],
          [-0.5, 0.26],
        ],
        wide: [0.1, 0.07],
        full: [0.7, 0.7],
        paints: 'cosmos',
        patchy: true,
      },
      /* poppies under the shrubs on the left */
      {
        line: [
          [-1.1, 0.44],
          [-0.95, 0.46],
          [-0.8, 0.5],
        ],
        wide: [0.05, 0.04],
        full: [0.75, 0.55],
        paints: 'poppies',
        patchy: true,
      },
      /* and butter and white behind the warm sweep, on the right */
      {
        line: [
          [0.86, 0.5],
          [0.98, 0.46],
          [1.1, 0.44],
        ],
        wide: [0.05, 0.05],
        full: [0.75, 0.65],
        paints: 'buttercups',
        patchy: true,
      },
      /* Past the stage, which only a wide screen shows: a warm drift climbing on the far left with a pale heap in front
         of it, and a pale one climbing on the far right with cosmos beyond it. */
      {
        line: [
          [-1.3, 0.58],
          [-1.5, 0.48],
          [-1.72, 0.36],
          [-1.85, 0.26],
        ],
        wide: [0.16, 0.06],
        full: [1, 0.7],
        paints: 'poppies',
      },
      {
        line: [
          [-1.62, 0.6],
          [-1.98, 0.5],
        ],
        wide: [0.12, 0.08],
        full: [0.9, 0.8],
        paints: 'daisies',
        patchy: true,
      },
      {
        line: [
          [1.3, 0.6],
          [1.55, 0.5],
          [1.8, 0.38],
          [1.95, 0.28],
        ],
        wide: [0.15, 0.05],
        full: [1, 0.5],
        paints: 'daisies',
        patchy: true,
        patchyFrom: 0.4,
      },
      {
        line: [
          [1.95, 0.55],
          [2.3, 0.45],
        ],
        wide: [0.1, 0.08],
        full: [0.85, 0.8],
        paints: 'cosmos',
        patchy: true,
      },
    ],
    /* a few on their own in the plain grass, so that no gap is quite empty */
    strays: 40,
    /* the gorse's flowers: how many to a CSS pixel of a crown's width, and their size */
    gorse: 0.42,
    bud: [1.1, 2],
  }

  /* The colours the flowers are painted in, as [on a light page, on a dark page]: the corals and salmons of poppies, the
     peaches and pinks of cosmos, white and cream daisies with butter and gold at their hearts, and a rare lilac. */
  const PAINTS = {
    red: ['#ee7a5a', '#f2876a'],
    coral: ['#f4886a', '#f79479'],
    salmon: ['#f7a287', '#f9ae95'],
    peach: ['#f9c2a0', '#fbcbad'],
    pink: ['#f2a6b8', '#f5b4c4'],
    rose: ['#e6819c', '#ec92aa'],
    lilac: ['#a9b2e8', '#b8c0ef'],
    butter: ['#f7da78', '#f8e08c'],
    gold: ['#e9b438', '#efc04f'],
    cream: ['#f6edd2', '#f8f1dc'],
    white: ['#fffdf6', '#fffdf6'],
  }
  /* The dark greens of the land for the leaves among the flowers; a composition paints with its flowers' colours and then
     these (see prepare). */
  const LEAVES = ['deepGreen', 'shade', 'leaf']
  /* The pale ones, which out of focus at the front would read as milk on the pale ground there. */
  const PALE = ['white', 'cream', 'butter', 'peach']

  /* What a drift is painted in, by how often. */
  const PALETTES = {
    poppies: [
      ['red', 0.3],
      ['coral', 4],
      ['salmon', 3],
      ['peach', 1.6],
      ['pink', 0.6],
      ['lilac', 0.1],
      ['butter', 0.6],
      ['cream', 0.5],
      ['white', 1.6],
    ],
    daisies: [
      ['coral', 0.6],
      ['salmon', 0.4],
      ['peach', 1.6],
      ['pink', 1.1],
      ['lilac', 0.3],
      ['butter', 1.8],
      ['cream', 2.5],
      ['white', 2],
    ],
    cosmos: [
      ['coral', 1],
      ['salmon', 1],
      ['peach', 2],
      ['pink', 3],
      ['rose', 1],
      ['lilac', 0.4],
      ['butter', 0.5],
      ['white', 2],
    ],
    meadow: [
      ['coral', 0.7],
      ['salmon', 0.6],
      ['peach', 1],
      ['pink', 1.4],
      ['lilac', 0.3],
      ['butter', 1.4],
      ['cream', 1],
      ['white', 2.6],
    ],
    buttercups: [
      ['butter', 3],
      ['gold', 0.6],
      ['cream', 1.4],
      ['white', 2],
      ['peach', 0.6],
      ['coral', 0.4],
    ],
  }
  /* A brush is loaded with two colours, the second running into the first along the stroke; and a flower's last, small
     stroke is often the light catching it, a little paler. */
  const SECOND = {
    red: ['coral'],
    coral: ['salmon', 'peach'],
    salmon: ['peach', 'coral'],
    peach: ['salmon', 'cream'],
    pink: ['rose', 'peach'],
    rose: ['pink'],
    lilac: ['pink', 'white'],
    butter: ['gold', 'cream'],
    gold: ['butter'],
    cream: ['white', 'butter'],
    white: ['cream'],
    // the footer's fields of colour (see FOOTER_PAINTS): no other composition paints with these
    marigold: ['tangerine', 'saffron'],
    tangerine: ['marigold'],
    saffron: ['marigold', 'apricot'],
    apricot: ['saffron', 'butter'],
    cornflower: ['azure', 'indigo'],
    azure: ['cornflower', 'periwinkle'],
    indigo: ['cornflower', 'violet'],
    periwinkle: ['azure', 'white'],
    violet: ['indigo', 'cornflower'],
  }
  const PALER = {
    red: 'salmon',
    coral: 'peach',
    salmon: 'peach',
    peach: 'cream',
    pink: 'white',
    rose: 'pink',
    lilac: 'white',
    butter: 'cream',
    gold: 'butter',
    cream: 'white',
    white: 'white',
    marigold: 'saffron',
    tangerine: 'marigold',
    saffron: 'apricot',
    apricot: 'butter',
    cornflower: 'azure',
    azure: 'periwinkle',
    indigo: 'cornflower',
    periwinkle: 'white',
    violet: 'periwinkle',
  }
  /* A cosmos painted with its petals shades a little towards its heart, into a neighbouring colour; only these colours
     are ever painted so, the soft ones, so that it never stands out as a sticker. */
  const DEEPER = {
    coral: 'salmon',
    salmon: 'coral',
    peach: 'salmon',
    pink: 'rose',
    lilac: 'pink',
  }

  /* The drifts stamped into a coarse grid, made the first time a meadow with those drifts is laid out, since it depends
     on nothing else (see growMeadow); one for each composition's set of drifts. */
  const driftGrids = new WeakMap()

  /* --- the clouds ---------------------------------------------------------------------------------- */

  /* Two clouds of frosted glass in the sky's band, low over the falling hill, where the wallpaper's are. Each is placed
     as a share of the half-width across and how far down the band it floats, from the sky's top (0) to the hill (1), with
     its size in CSS pixels at a window of 1440, and the balls it is heaped from, in sizes. */
  const CLOUDS = [
    {
      at: [0.84, 0.42],
      size: 54,
      puffs: [
        [-0.9, 0.18, 0.42],
        [-0.42, -0.08, 0.6],
        [0.15, -0.22, 0.72],
        [0.7, -0.02, 0.55],
        [1.12, 0.2, 0.36],
        [0.2, 0.22, 0.5],
        [-0.3, 0.26, 0.4],
      ],
    },
    {
      at: [0.56, 0.4],
      size: 30,
      puffs: [
        [-0.75, 0.16, 0.38],
        [-0.25, -0.12, 0.58],
        [0.35, -0.04, 0.5],
        [0.82, 0.18, 0.32],
        [0.05, 0.24, 0.42],
      ],
    },
  ]
  /* How far inside the sky's top edge a cloud keeps its own top, in CSS pixels. The sky's first lines are faint and the
     page shows between them, and on a dark page frost over the page reads as a grey dome over nothing. */
  const CLOUD_TUCK = 10

  /* --- the butterflies, after /products/api-hosting ------------------------------------------------ */

  /* --- the wings ---------------------------------------------------------------------------------- */

  /* Wing outlines in wing units, one being about a forewing's length, after the butterflies in the pictures this hero is drawn
     from: three families of blunt, rounded fans, which is what keeps them a drawing of a butterfly and not a specimen. The
     first number of each pair is along the body, forwards, and the second out along the span, starting from the root and going
     round by the leading edge. Seen from the root they never double back, so an outline can be kept as a radius for each angle,
     and the fragment shader can ask in one look how far a place is from the wing's edge. `scallop` is how many waves the margin
     has and how deep they are, and `cells` how many cells it has between its veins, each as [forewing, hindwing]. */
  const WINGS = {
    round: {
      fore: [
        0.027, 0.013, 0.723, 0.426, 0.834, 0.584, 0.844, 0.696, 0.813, 0.786, 0.758, 0.857, 0.682, 0.905, 0.592, 0.929,
        0.502, 0.944, 0.421, 0.969, 0.347, 1.006, 0.269, 1.042, 0.187, 1.059, 0.102, 1.057, 0.018, 1.047, -0.063, 1.03,
        -0.139, 0.992, -0.202, 0.913, -0.239, 0.781, -0.231, 0.586, -0.013, 0.027,
      ],
      hind: [
        -0.008, 0.029, -0.168, 0.446, -0.267, 0.568, -0.352, 0.615, -0.43, 0.628, -0.508, 0.627, -0.584, 0.613, -0.65,
        0.581, -0.703, 0.534, -0.751, 0.48, -0.802, 0.426, -0.854, 0.369, -0.89, 0.303, -0.899, 0.228, -0.883, 0.149,
        -0.854, 0.075, -0.814, 0.006, -0.751, -0.055, -0.644, -0.1, -0.472, -0.112, -0.029, -0.009,
      ],
      scallop: [0, 0, 0, 0],
      cells: [7, 7],
    },
    broad: {
      fore: [
        0.027, 0.013, 0.749, 0.445, 0.842, 0.598, 0.844, 0.711, 0.808, 0.803, 0.744, 0.872, 0.662, 0.918, 0.575, 0.954,
        0.495, 0.997, 0.419, 1.052, 0.337, 1.104, 0.247, 1.133, 0.152, 1.138, 0.057, 1.131, -0.035, 1.121, -0.125, 1.1,
        -0.207, 1.048, -0.272, 0.956, -0.31, 0.826, -0.304, 0.643, -0.015, 0.026,
      ],
      hind: [
        -0.007, 0.029, -0.176, 0.521, -0.283, 0.654, -0.383, 0.717, -0.478, 0.742, -0.561, 0.732, -0.626, 0.69, -0.673,
        0.63, -0.718, 0.569, -0.77, 0.513, -0.826, 0.458, -0.874, 0.395, -0.909, 0.324, -0.935, 0.249, -0.959, 0.172,
        -0.971, 0.094, -0.951, 0.013, -0.88, -0.06, -0.756, -0.114, -0.567, -0.134, -0.029, -0.009,
      ],
      scallop: [0, 0, 0, 0],
      cells: [8, 7],
    },
    slim: {
      fore: [
        0.026, 0.014, 0.756, 0.472, 0.872, 0.633, 0.88, 0.738, 0.851, 0.822, 0.811, 0.9, 0.756, 0.968, 0.685, 1.015,
        0.605, 1.047, 0.526, 1.078, 0.449, 1.112, 0.37, 1.14, 0.285, 1.142, 0.196, 1.112, 0.112, 1.065, 0.036, 1.017,
        -0.034, 0.963, -0.093, 0.886, -0.135, 0.764, -0.143, 0.575, -0.009, 0.029,
      ],
      hind: [
        -0.01, 0.028, -0.174, 0.386, -0.271, 0.497, -0.358, 0.553, -0.436, 0.575, -0.5, 0.565, -0.549, 0.534, -0.591,
        0.494, -0.638, 0.456, -0.688, 0.418, -0.733, 0.373, -0.765, 0.32, -0.785, 0.261, -0.802, 0.201, -0.811, 0.14,
        -0.801, 0.077, -0.757, 0.016, -0.677, -0.037, -0.568, -0.074, -0.417, -0.086, -0.029, -0.008,
      ],
      scallop: [0, 0, 0, 0],
      cells: [6, 6],
    },
  }
  const WING_NAMES = Object.keys(WINGS)
  /* How many radii an outline is kept as. Steep edges want a lot of them. */
  const SHAPE_WIDTH = 1024
  const CELLS = new Float32Array(WING_NAMES.flatMap((name) => [...WINGS[name].cells, 0, 0]))

  /* The angles a wing can reach, measured from the span towards the head, in radians. */
  const FORE_RANGE = [(-62 * Math.PI) / 180, (72 * Math.PI) / 180]
  const HIND_RANGE = [(-115 * Math.PI) / 180, (-4 * Math.PI) / 180]

  /* The wing's box, where the mesh is laid: [from, to] along the body and out along the span. */
  const FORE_BOX = [-0.6, 1.2, 0, 1.26]
  const HIND_BOX = [-1.02, 0.02, -0.3, 0.98]

  /* The three colours the butterflies come in, read off the pictures they are after and all as pale as the yellow. The inks
     are in the same order as a planet's, and run from the strongest colour at the root to nearly white at the tips. The last
     is the warm colour of its middle, which runs out along the strokes and joins the wings. `wake` is what the
     butterfly leaves in the air, on a light page and on a dark one. */
  const PASTELS = {
    yellow: {
      inks: ['#fbf1b8', '#fcf2b4', '#fcee98', '#fbe777', '#fcf4c4', '#b0a060', '#f2c46a'],
      wake: [
        [226, 196, 84],
        [250, 236, 150],
      ],
    },
    orange: {
      inks: ['#fdecd8', '#fbcf9f', '#fab880', '#f9a564', '#fbd3a9', '#c48a58', '#f6c25e'],
      wake: [
        [236, 150, 92],
        [250, 190, 140],
      ],
    },
    blue: {
      inks: ['#d9e6f9', '#b1cdf1', '#96bcec', '#7caee3', '#bcd3f3', '#6f8db8', '#e9bd85'],
      wake: [
        [112, 160, 226],
        [160, 196, 245],
      ],
    },
  }

  const PASTEL_NAMES = ['yellow', 'orange', 'blue']

  /* How they fly. They are seen from behind and a little above, going up the page and to the right, and the wings go from
     nearly flat to nearly shut, so the shape is never the same twice: two wide lobes, then a sliver of a V. A butterfly beats
     in bursts and glides between them, and it goes up in hops while it beats and sinks while it glides. `bursts` sets how
     often, as the slowest rate of the burst and how much faster it may be, in radians a second. `rise` and `sink` are how
     fast it goes up and down at a size of 64, in CSS pixels a second, `settle` how quickly its lane draws it back, `glide`
     how much faster it goes across while gliding, and `hop` and `surge` how far each beat throws it up the page and along
     its way, in sizes.

     `slant` is where the body points on the page, up from going straight across, `spread` how much that differs from one
     butterfly to the next, and `leans` how far it may go from there, down and up, as it climbs and sinks. `away` is how far
     the head is turned from the viewer, and `pose` the range of how far each is rolled, which brings its left wing round to
     face the viewer more than its right.

     `open` and `shut` are the angle of the wings over the back at the two ends of a beat, and `soar` the angle they are held
     at in a glide. Most of a beat is spent open, and they snap shut and open again: `snap` is how much of that there is, and
     `shallow` how much less far some beats go than others. `sweep` turns the forewing and the hindwing round the root, from
     how they are drawn to how they are held in flight. They keep out of each other's way: `room` is how close they may come,
     in sizes, and `give` how hard they turn aside. */
  const FLIGHT = {
    bursts: [1, 0.8],
    rise: 50,
    sink: 60,
    settle: 0.55,
    glide: 0.2,
    hop: 0.07,
    surge: 0.06,
    slant: 1.08,
    spread: 0.3,
    leans: [0.42, 0.24],
    away: -0.9,
    pose: [0.2, 0.45],
    open: 0.14,
    shut: 1.42,
    soar: 0.34,
    snap: 1.5,
    shallow: 0.3,
    sweep: [0.2, 0],
    room: 1.15,
    give: 1000,
  }

  /* The wing's own strokes, on the same recipe as the land's lines but packed tight. */
  const WING = {
    fan: 6,
    pitch: 1.75,
    closest: 1.3,
    keep: 0.25,
    fill: 0.76,
    brick: [44, 130],
    gap: 0.34,
    flow: 0.012,
    beadCell: 7,
    beadChance: 0.12,
    beadSize: 0.45,
    blotch: 2.2,
    grain: 0.22,
    /* How much of the glass's own patterning shows, as a share of what it was first drawn with: the beams through the root,
       the striations, the blown panes, the bubbles and the glints. `veins` is the same for the veins alone, which read
       most. A wing should look like glass from across the room and only show how it was made when you look closely. */
    texture: 0.5,
    veins: 0.4,
    /* How far each wing's colours are drawn together towards the one colour of its glass, so that it reads as a single
       pastel, paler and deeper, and not as a run of colours. The warm middle runs out less far into it for the same reason. */
    mono: 0.45,
  }

  /* The antennae: two fine neutral lines from the head, with nothing on their tips, so they say butterfly without
     saying bug. Lengths are in sizes. `root` is where they leave the body, `reach` how far forward they go, `spread` how far
     apart their tips are and `curl` how much they bow out on the way, `rise` how far up off the back they lift. `wide` is
     half their width in CSS pixels at the root and at the tip, and `ink` their colour on a light page and on a dark one. */
  const ANTENNA = {
    root: 0.2,
    reach: 0.36,
    spread: 0.12,
    curl: 0.05,
    rise: 0.1,
    wide: [0.36, 0.3],
    ink: [
      [0.47, 0.46, 0.45],
      [0.7, 0.69, 0.68],
    ],
  }

  /* The flock is small here: a few butterflies over the meadow. Size is CSS pixels to a wing unit at a window of 1440 by
     800, speed is CSS pixels a second, a lane is a place across the air (0 at its top, 1 at its foot), and `pastel` and
     `wing` which glass and which shape. */
  const FLOCK = [
    { size: 20, speed: 40, lane: 0.3, seed: 0.13, pastel: 0, wing: 'round' },
    { size: 26, speed: 47, lane: 0.62, seed: 0.46, pastel: 1, wing: 'broad' },
    { size: 23, speed: 43, lane: 0.46, seed: 0.79, pastel: 2, wing: 'slim' },
    { size: 18, speed: 38, lane: 0.18, seed: 0.31, pastel: 0, wing: 'broad' },
  ]

  /* The air they fly in, over the hill and the meadow, in the land's terms. */
  const AIR = {
    top: [
      [-1.6, 0],
      [-1, -0.14],
      [-0.5, -0.2],
      [-0.2, -0.1],
      [0, 0],
      [0.5, 0.12],
      [1, 0.22],
      [1.6, 0.3],
    ],
    foot: [
      [-1.6, 0.8],
      [-0.5, 0.66],
      [0, 0.72],
      [0.5, 0.82],
      [1.6, 0.98],
    ],
  }

  /**
   * The lens, as on /products/agent. Through the band along an edge a point at height v shows the picture
   * from height
   *   vs = in + (1 - in) * (1 - exp(-b * t)) / b,   t = (v - in) / (1 - in)
   * which joins the untouched middle smoothly and magnifies by e^b at the edge. `band` is how much of the
   * half-width or half-height that is, and `bandMost` the most it may be in CSS pixels, so a wide window
   * does not grow a wide band. The foot of the hero has no band: it is not an edge of the screen, and the
   * page carries on under it. `round` is how round the lens's corners are, as the power of a superellipse. `halo` is the
   * soft light glass gives off onto the land around it: which mip it comes from at one pixel to the CSS pixel, and how
   * strong it is.
   */
  const LENS = {
    in: 0.72,
    bend: 3.2,
    split: 0.05,
    along: 0.05,
    soften: 3,
    band: [0.3, 0.3],
    bandMost: [170, 62],
    round: 6,
    halo: [2.6, 0.34],
  }

  /* The planets' grain, as the other heroes draw it. */
  const GRAIN =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.25' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 1.015 -0.0075 0 0 0 1.015 -0.0075 0 0 0 1.015 -0.0075 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
  const GRAIN_TILE = 160

  /* --- the modes ----------------------------------------------------------------------------------- */

  /* Every [data-hl-hero] root is drawn to a composition: the hero's, unless the root names another with data-hl-mode
     ("window" for the arched window in the closing card, "footer" for the meadow round the site's footer). A composition
     says what is drawn and when, and the engine draws whatever it is given. Its parts, and what leaving one out means:

     draw      'live' draws a frame whenever the page asks for one while the root is on the screen; 'once' paints the
               still picture (everything in, the wind at rest) when the root comes near the screen, and again only when
               its size or the theme changes. Under reduced motion every root is painted once.
     wake      null builds the root (its context, its shaders, its meadow) at once, all in one go, as the hero does;
               'idle' has the builder build it a step at a time in the page's idle time from the start; a rootMargin has it
               do so once the root comes that near the screen, and until then nothing is built (see the builder).
     near      null, or a rootMargin: how near the screen a root is painted ahead of being seen, so that it is never seen
               blank. A root with none draws again at once, on the screen or off it, whenever it has to, as the hero does.
     words     what the land keeps clear of, with a soft oval of page round it (lines.veil, lines.veilCore): a selector
               inside the root, or { at: [x, y], half: [a, b] } in shares of the canvas, or null.
     behind    a selector for what stands in front of the canvas on the page: it is measured with the canvas, nothing is
               grown where it would hide all of it, and the hooks are given its box. With land in front of it
               (land.front), it is cut out of everything drawn behind it, and its corners and `keep` are measured too.
     keep      with land in front of `behind`: a selector for what inside it the land keeps clear of. Every line of text,
               link, button and picture in it is given to the hooks as a box on the canvas (hidden.keep).
     lines     the recipe every line is drawn to, as LINES.
     inks      the land's inks, as LAND_INK: [on a light page, on a dark page].
     sky       null for the page behind the land, as the hero has; or a fill drawn under everything,
               { stops: [[share of the way down the canvas, ink], ...], grain, brush, wash }: its inks from the top down,
               how much of the grain it takes, how much it is brushed across, and the ink an opaque sheet's wash is mixed
               with in place of the page's colour.
     land      { profile, crest, relief, sheets, sink, room, foot, head, least }: the hill's line, as BLISS; where its crest
               is, as CREST; how its slopes scale with the canvas's width, as RELIEF; the sheets, as LAND (the one named
               'meadow' is where the grass and the flowers grow, and the one named 'sky' is the band the clouds float in,
               else they float between the canvas's top and the hill); how far shrubs sink, as SHRUB_SINK; and the land's
               room, foot and head in CSS pixels, as LAND_ROOM, LAND_FOOT and LAND_HEAD, each a number or a hook
               (stage) => number of the stage { w, h, hidden }. `least` is the smallest room it is given. No sheets is
               no land. `front` names the sheets in front of `behind`, in the order they are drawn; the rest are behind
               it, and anything rooted on the land in front is drawn in front of it too. A sheet's top or foot can be a
               hook of the stage (given its room and base as well), a sheet's paint can name another sheet to be painted
               as that one is, and shrubs can stand on any sheet named in `on`.
     grass     as GRASS, or null for none (a flower's stem is still drawn in its inks).
     stir      as STIR: how far a stir is felt, how long, and how far apart they are laid (their count is fixed).
     passer    as PASSER, or null for nothing going through the meadow.
     pointer   whether the pointer parts the grass.
     flowers   as FLOWERS, or null for none; `slant` is how far a flower painted with its petals is seen from the side
               (0.62 if not given, 1 faces the eye).
     paints, palettes
               as PAINTS and PALETTES: the flowers' colours, and what each drift is painted in. A new colour needs a
               place in SECOND and PALER as well.
     clouds    as CLOUDS, or [] for none; and cloudTuck, as CLOUD_TUCK.
     flock     as FLOCK, or [] for no butterflies, which is no lens either: the picture then goes straight to the screen.
     air       as AIR: the band the butterflies fly in.
     lens      as LENS; `foot: false` keeps the picture's foot, where the hero's fades out into the page under it, and
               `foot: 'ease'` eases that fade in rather than running it evenly (see LENS_FOOT).
     fit       (w, h) => how large the grass, the flowers, the clouds and the butterflies are drawn on a canvas that size.
     stillAt   the clock the still picture is painted at.
     plant     null, or a hook (garden) => {} run each time the meadow is laid out, which can plant more (see growMeadow).
     cover     the footer's only: (band) => how far its canvas reaches up behind the footer (see footerMeadow).
     onPage    whether a stroke keeps its paint where there is no land under it, as a tree's crown against the sky does;
               otherwise it fades where the land fades into the page.
     dprCap    the most canvas pixels to a CSS pixel it draws at (2 if not given), or a hook (width in CSS pixels) => that: a
               composition with many large strokes can draw at less on a dense screen, where its soft paint loses nothing
               that shows, and at less again on a very wide one.
     marks     whether its planting marks some strokes, in the hundredths of their kind (see the pricing composition's
               PR_MIST and PR_EVEN): as mist, which thins into the grain's specks across the band garden.mist gives, as
               everything does round the words, so a trunk standing beside the words on a phone ends in mist; or as even,
               drawn round in its proportions, so a long coat neither bows nor tapers and an outline over it stays true.
     push      null, or { amount, at }: the strokes that sway (those with some give) lean out from the place `at` of the
               way across the canvas, left of it to the left and right of it to the right, by up to `amount` radians at
               full give, when the page lights it (sets root.hlPushAt to performance.now()): up over a fifth of a
               second, held a moment, and back over two, as the window's hands answer its globe flaring.
     lightFoot whether the light it plants in the haze kind, marked even, goes into the canvas's foot whole rather than
               thinning into specks there, as a figure the picture's foot cuts off does (see LIGHT_FOOT).
     perch     null, or how a flock that lands does it (see the butterflies that perch): its butterflies sit on the places
               the composition's planting gives (garden.perch), take off when the pointer comes onto the tree (the shape
               garden.tree draws for it) and come back to land once it has gone. Where the words stand over the places,
               they fly off to the sides, climbing at most `climb` (0.5 when not given) of a unit for each one across and
               swerving by up to half of `swerve` pixels (120); coming back, they come in from the side as much as `rise`
               pixels (160) above the highest place and drop onto theirs from a little above it, in proportion. With `own`,
               each comes back in from the side its own place is on, and the ones about the crown fly round only the places
               clear of the glass. With `hover` ({ pose: [heading, pitch, roll], bob, sway }), one sitting in its place is on
               the wing there instead, beating its wings at `beat`, held in that pose, rising and sinking `bob` and
               drifting `sway` pixels (at a fit of 1).
     orbit     null, or how a flock that comes to the pointer does it (see the butterflies that come to the pointer):
               none of its butterflies is in the picture until the pointer rests for `call` seconds (0.25 when not
               given) in the place `zone`, an ellipse given as `words` is, { at: [x, y], half: [a, b] } in shares of the
               canvas, or as a hook (stage) => { x, y, a, b } in CSS pixels of the stage { w, h, words, base, room } (the
               lower middle of the canvas when not given).
               Then they fly in from beyond the picture's sides, through the glass, at about `come` CSS pixels a second
               (360), each `every` seconds after the one before (0.24), weaving `flutter` pixels across their way (6),
               and go round and round the pointer, each on a ring of its own, which a butterfly of the flock gives as
               `ring` (how far out it is, in CSS pixels at a fit of 1), `spin` (radians a second, its sign the way
               round), `tilt` (how far the ring's plane is tipped back from the page, so that it is seen as an ellipse
               whose far side is up the page and its butterfly smaller there), `lean` (how far the ring leans across
               the page) and `trail` (about how many seconds it follows the pointer by), or has from its seed. Once the
               pointer has been out of the place for `linger` seconds (0.8), they go off as they came, at about `leave`
               CSS pixels a second (400), out through the glass at the sides. On a touch screen a tap in the place
               brings them for `stay` seconds (7), and a tap elsewhere on the picture sends them off. Their rings keep
               clear of the words, of the glass at the sides and of the picture's foot, smaller where the place is
               short of room, and they never go over the words; with reduced motion there are none. A flock either
               perches or comes to the pointer.
     sun       null, or a disc of light standing behind the words, made of the land's own lines (see sunFragment):
               `place`, a hook (stage) => { x, y, r } in CSS pixels of the stage { w, h, words, base, room }, its middle
               and how far out its rim is; `face`, the share of that which is its bright face, the rest its limb; `halo`,
               how far its glow reaches past the rim, in its radius; `rim`, how wide the light along its rim is, in its
               radius; `rise`, a hook (stage) => [from, to] in CSS pixels down the canvas, over which its light comes in
               from nothing (it is light, not lines, so it may come in higher than the lines do); `inks`, five names in
               `inks`: its middle, its face's edge, its rim, the glow just past the rim and its halo; `light`, how much
               light of its own it lays under the lines on its face, along its rim and in its halo; `lines`, how strong
               its face's lines stay and how many of their beads they keep; each of those last two [on a light page, on a
               dark page] or one number for both; and `breathe`, its rim and halo, as the glow's. A sheet takes its
               colours as much as its own `sun` says, [into its lines, as light].
     fade      null, or how the lines of a sheet with `fade: true` come in from nothing down the canvas: `at`, a hook
               (stage) => [from, to] in CSS pixels down the canvas, above which there are none and below which they are
               at their full; `ease`, how slowly they come in (the power of the eased ramp between); and how: `pale`, how
               far towards the page their colour is where they start, `sparse`, how few of them there are (the power of
               the ramp that keeps them) and `specks`, how few beads (the same). */
  const HERO = {
    draw: 'live',
    wake: null,
    near: null,
    words: '.hl-copy',
    behind: null,
    lines: LINES,
    inks: LAND_INK,
    sky: null,
    land: {
      profile: BLISS,
      crest: CREST,
      relief: RELIEF,
      sheets: LAND,
      sink: SHRUB_SINK,
      room: LAND_ROOM,
      foot: LAND_FOOT,
      head: LAND_HEAD,
      least: 120,
    },
    grass: GRASS,
    stir: STIR,
    passer: PASSER,
    pointer: true,
    flowers: FLOWERS,
    paints: PAINTS,
    palettes: PALETTES,
    clouds: CLOUDS,
    cloudTuck: CLOUD_TUCK,
    flock: FLOCK,
    air: AIR,
    lens: LENS,
    fit: (w, h) => clamp(Math.min(w / 1300, (h + 100) / 760), 0.56, 1.3),
    stillAt: 6,
    plant: null,
  }

  /* --- the window's composition ---------------------------------------------------------------------- */

  /* The arched window at the middle of the closing card's hosting diagram: a big sky, and one daisy rising into it out
     of a few of the meadow's own flowers along the sill, seen close and soft, as through a lens focused on the sky
     beyond it, with two more further off on their stems, softer still, the hero's grass close to the eye at either
     side, and two clouds out of focus, a soft heap high on the right and a thin wisp low on the left. It is painted
     with the meadow's own brush: every petal is a stroke of paint laid from its tip in to the heart, and the heart is
     dabbed in gold. It is painted once, the still picture,
     when the card comes within a screen of view, and again only if its size or the theme changes, so it costs nothing
     a frame. The Scalar mark is an HTML SVG over the canvas, 34% of the way down, so the sky round it is kept clear
     and calm: the daisy's petals stop well short of it and the clouds keep to either side. */
  const WINDOW_INKS = {
    ...LAND_INK,
    // The sky, from the top of the window down, [on a light page, on a dark page]: a clear, deep blue day, paler towards
    // the sill; and on a dark page the same day an hour later, deeper, so the window does not glare out of the dark card.
    zenith: ['#2c66cc', '#173a85'],
    upper: ['#3b78d6', '#21489a'],
    middle: ['#6198e0', '#3762b2'],
    horizon: ['#a9cbf1', '#7092d0'],
  }
  const WINDOW = {
    ...HERO,
    draw: 'once',
    // built in idle time once within three screens, and painted when within one
    wake: '300% 0px',
    near: '100% 0px',
    // the Scalar mark's box, as shares of the canvas, which the paint keeps clear of
    words: { at: [0.5, 0.34], half: [0.13, 0.09] },
    lines: { ...LINES, veil: [10, 10], veilCore: 0.5, sink: 0.001 },
    inks: WINDOW_INKS,
    sky: {
      stops: [
        [0, 'zenith'],
        [0.32, 'upper'],
        [0.66, 'middle'],
        [1, 'horizon'],
      ],
      grain: 0.32,
      brush: 0.05,
      wash: 'horizon',
    },
    // No land: the sky comes down to the sill. The land's line is still where everything is measured from, so it is laid
    // flat along the canvas's top with a room that never changes: while the window is being resized, before the picture
    // is laid out again for its new size, the strokes then keep their places down the window and only close up across it.
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: 100,
      foot: ({ h }) => h - 100,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    // for the haze stroke the clouds are painted with (kind 0.4; see NOUGHT, which this also brings and nothing here uses)
    glyphs: true,
    // The meadow's paints, and a deep gold for the hearts' shade, a pale sky blue-white for the clouds, a paler lilac for
    // the petals at the back, and ivory for the front petals where they meet the heart.
    paints: {
      ...PAINTS,
      amber: ['#d9962a', '#e0a23a'],
      mist: ['#e4eefa', '#dbe6f7'],
      lilac: ['#dcdcf2', '#d5d7f0'],
      ivory: ['#fcf8ee', '#f9f4e8'],
    },
    clouds: [],
    flock: [],
    lens: null,
    fit: (w) => clamp(w / 300, 0.5, 1),
    plant: (garden) => {
      const { w, h, rand } = garden
      const TAU = Math.PI * 2
      // Each stroke is placed exactly: its middle at x, y, and painted in the order given, so that the far daisies go down
      // first, the near one's petals over them and its heart over those. A stroke is rooted under the canvas at its
      // order, straight under where it is painted, with no lean of its own and too stiff for the wind to move; and each
      // takes whatever else it draws, its paint's dice, from a seed of its own (`n`), so no part of the picture changes
      // when another does.
      const put = (n, { x, y, order, long, wide, turn, blur, paints, load = 0.95, kind = 0 }) => {
        rand.reseed(52711 + n * 7919)
        const root = h + order
        garden.dab({ x, y: root, stem: root - y, long, wide, turn, blur, paints, load, kind, stiff: 1, lean: 0 })
      }
      // A stem from under the sill up to a head at x, y, as a blade of the meadow's grass, soft as the head is: leaning as
      // it is told, in radians from upright, and rooted where that lean brings it up to the head.
      const stalkTo = (n, { x, y, order, wide, soft, ink = 2, mix = 0.4, lean = 0 }) => {
        rand.reseed(52711 + n * 7919)
        const root = h + order
        const tall = (root - y) / Math.cos(lean)
        garden.stalk({ x: x - Math.sin(lean) * tall, y: root, tall, wide, ink, mix, soft, stiff: 1, lean })
      }
      // A smooth jitter of its own, so a daisy is the same at every size.
      const jitter = (n) => hashed(n * 17.13 + 3.1) - 0.5
      // A heart's florets are paler on its lit side and deeper gold towards its rim.
      const floretPaints = (lit, out) => {
        if (lit > 0.2) {
          return ['butter', 'cream']
        }
        return out > 0.6 ? ['amber', 'gold'] : ['gold', 'butter']
      }
      // A daisy, face on but tipped back a little (`tilt`), its far petals a little shorter (`persp`), and those above the
      // heart shorter still by `crown`, so that a daisy high in the window keeps the sky under the mark: petals in two
      // rings laid from the tip in to the heart, the back ring a touch longer and bluer, a stroke of light along most of
      // the front ones, then the heart.
      const daisy = ({
        x,
        y,
        heart,
        long,
        wide,
        petals,
        tilt,
        persp,
        blur,
        load,
        turn0,
        order,
        id,
        crown = 0,
        shine = 0,
        florets = 0,
        even = null,
      }) => {
        const rings = [
          {
            from: 0,
            many: Math.ceil(petals / 2),
            stretch: 1.05,
            paints: ['white', 'lilac'],
            load: load * 0.9,
            at: order,
            blur: blur * 1.1,
          },
          {
            from: 0.5,
            many: Math.floor(petals / 2),
            stretch: 0.97,
            paints: ['white', 'ivory'],
            load,
            at: order + 1,
            blur,
          },
        ]
        rings.forEach((ring, r) => {
          for (let k = 0; k < ring.many; k += 1) {
            const n = id * 1000 + r * 100 + k
            const a = turn0 + ((k + ring.from) / ring.many) * TAU + jitter(n) * 0.2
            const up = Math.sin(a)
            const len =
              long *
              ring.stretch *
              (1 - persp * up) *
              (1 - crown * Math.max(0, up) ** 2) *
              (0.88 + 0.24 * (jitter(n + 7) + 0.5))
            const r0 = heart * 0.6
            const mid = r0 + len / 2
            // in the screen, y down: the petal's way out from the heart, squashed by the tilt
            const dx = Math.cos(a)
            const dy = -up * tilt
            const out = Math.hypot(dx, dy)
            const across = Math.hypot(up, Math.cos(a) * tilt)
            const spread = wide * (0.85 + 0.3 * (jitter(n + 13) + 0.5)) * across
            put(n, {
              x: x + dx * mid,
              y: y + dy * mid,
              order: ring.at + k * 0.001,
              long: (len / 2) * out,
              wide: spread / out,
              turn: Math.atan2(-dy, -dx),
              blur: ring.blur,
              paints: ring.paints,
              load: ring.load,
            })
            if (r === 1 && shine > 0 && jitter(n + 21) > -0.2) {
              const m2 = r0 + len * 0.58
              put(n + 300, {
                x: x + dx * m2 + (-dy / out) * spread * len * 0.12,
                y: y + dy * m2 + (dx / out) * spread * len * 0.12,
                order: ring.at + 0.5 + k * 0.001,
                long: len * 0.3 * out,
                wide: (spread * 0.45) / out,
                turn: Math.atan2(-dy, -dx),
                blur: Math.max(1, blur * 0.4),
                paints: ['white', 'white'],
                load: shine,
              })
            }
          }
        })
        // the heart: a disc of gold, a paler middle, a deeper rim to the lower right, and the florets dabbed in
        const hb = blur * 0.7
        const n = id * 1000 + 600
        // the heart's light warming the petals round it
        if (florets) {
          put(n + 5, {
            x,
            y,
            order: order + 1.9,
            long: heart * 1.7,
            wide: tilt,
            turn: 0,
            blur: heart * 0.9,
            paints: ['peach', 'butter'],
            load: 0.28,
          })
        }
        // (`even` is a seed whose stroke wanders the same on either side, so the heart is not lopsided)
        put(even ?? n, {
          x,
          y,
          order: order + 2,
          long: heart * tilt,
          wide: 1 / tilt,
          turn: -Math.PI / 2,
          blur: hb,
          paints: ['gold', 'butter'],
          load: 0.97,
        })
        put(n + 1, {
          x: x + heart * 0.26,
          y: y + heart * 0.3 * tilt,
          order: order + 2.01,
          long: heart * 0.6,
          wide: 0.6,
          turn: -0.5,
          blur: hb * 1.4,
          paints: ['amber', 'gold'],
          load: 0.32,
        })
        put(n + 2, {
          x: x - heart * 0.06,
          y: y - heart * 0.08 * tilt,
          order: order + 2.02,
          long: heart * 0.66 * tilt,
          wide: 1.15 / tilt,
          turn: -Math.PI / 2,
          blur: hb * 1.6,
          paints: ['butter', 'butter'],
          load: 0.85,
        })
        for (let k = 0; k < florets; k += 1) {
          const f = (k + 0.5) / florets
          const rr = heart * 0.86 * Math.sqrt(f)
          const th = k * 2.39996 + id
          const lit = Math.cos(th + 0.8) * Math.sqrt(f)
          put(n + 10 + k, {
            x: x + Math.cos(th) * rr,
            y: y + Math.sin(th) * rr * tilt,
            order: order + 2.1 + k * 0.0001,
            long: heart * (0.08 + 0.03 * (jitter(id * 7 + k) + 0.5)),
            wide: 0.85,
            turn: th,
            blur: 0.75,
            paints: floretPaints(lit, f),
            load: 0.45,
          })
        }
      }
      // The sky's strokes go down first, in the order they are laid.
      let laid = 0
      const skyward = () => {
        laid += 1
        return -h * 0.9 + laid * 0.001
      }
      // A cloud high on the right, inside the arch's curve and clear of the mark: a soft heap of lobes, [across from its
      // middle, up from its base, radius] in its `unit`, each laid in white from the highest down with a shade of mist
      // under it, so that a lower one comes in front of the shaded underside of the one above, as on a cumulus seen from
      // the side. It is out of focus, as everything beyond the daisy is, and flat-bottomed.
      const heap = ({ x, y, unit, lobes, id }) => {
        lobes
          .map(([across, up, r]) => [x + across * unit, y - up * unit, r * unit])
          .sort((a, b) => a[1] - b[1])
          .forEach(([lx, ly, r], k) => {
            const n = 90000 + id * 100 + k * 2
            put(n, {
              x: lx,
              y: ly,
              order: skyward(),
              long: r,
              wide: 0.8,
              turn: 0,
              blur: r * 0.8,
              paints: ['white', 'white'],
              load: 0.42,
              kind: 0.4,
            })
            put(n + 1, {
              x: lx + r * 0.1,
              y: ly + r * 0.45,
              order: skyward(),
              long: r * 0.85,
              wide: 0.55,
              turn: 0,
              blur: r,
              paints: ['mist', 'mist'],
              load: 0.22,
              kind: 0.4,
            })
          })
      }
      heap({
        x: w * 0.7,
        y: h * 0.2,
        unit: w * 0.075,
        lobes: [
          [-2.1, 0.25, 0.6],
          [-1.25, 0.45, 0.85],
          [-0.3, 0.55, 1.05],
          [0.7, 0.5, 0.95],
          [1.6, 0.35, 0.75],
          [-0.75, 1.05, 0.7],
          [0.3, 1.15, 0.85],
          [1.2, 0.95, 0.6],
        ],
        id: 1,
      })
      // And a wisp low on the left, a few thin strokes laid flat.
      for (let k = 0; k < 4; k += 1) {
        const n = 90200 + k
        const long = w * 0.2
        put(n, {
          x: w * 0.1 + jitter(n) * long * 0.9,
          y: h * 0.345 + jitter(n + 3) * long * 0.1,
          order: skyward(),
          long: long * (0.5 + 0.35 * (jitter(n + 5) + 0.5)),
          wide: 0.22 + 0.08 * (jitter(n + 9) + 0.5),
          turn: jitter(n + 11) * 0.06,
          blur: long * 0.22,
          paints: ['white', 'mist'],
          load: 0.38 * (0.85 + 0.3 * (jitter(n + 15) + 0.5)),
          kind: 0.4,
        })
      }
      // A few daisies further off, smaller and softer, on stems rising from below the sill, seen from below and a little
      // to the side, as the meadow stands round the eye looking up out of it.
      stalkTo(95001, { x: w * 0.13, y: h * 0.44, order: 4, wide: 2.2, soft: 1.8, ink: 1, mix: 0.5 })
      daisy({
        x: w * 0.13,
        y: h * 0.43,
        heart: w * 0.029,
        long: w * 0.088,
        wide: 0.38,
        petals: 12,
        tilt: 0.62,
        persp: 0,
        blur: 4.6,
        load: 0.7,
        turn0: 0.2,
        order: 10,
        id: 1,
      })
      stalkTo(95002, { x: w * 0.88, y: h * 0.48, order: 5, wide: 2.2, soft: 2.4, ink: 1, mix: 0.5 })
      daisy({
        x: w * 0.88,
        y: h * 0.47,
        heart: w * 0.036,
        long: w * 0.11,
        wide: 0.48,
        petals: 10,
        tilt: 0.72,
        persp: 0,
        blur: 5,
        load: 0.72,
        turn0: 0.1,
        order: 12,
        id: 2,
      })
      // A few of the meadow's own flowers along the sill, under and among the daisies' stems, close to the eye and soft:
      // buttercups and cream on the left, coral poppies on the right, cosmos under the near daisy, the nearest the largest
      // and softest. Each is painted as the hero paints the flowers at its front, strokes round a heart, each laid from
      // the rim in towards it so that its full end makes a round lobe there, one a little smaller than the rest, and a
      // soft smudge of heart to its lit side. They stand behind the near grass and the near daisy, and in front of the far
      // daisies' stems. Each paint's second, which runs into it along the stroke, and the heart it is given:
      const SECOND_PAINT = {
        coral: 'salmon',
        salmon: 'peach',
        peach: 'salmon',
        pink: 'rose',
        butter: 'gold',
        cream: 'butter',
      }
      const HEART_PAINT = {
        coral: ['red', 'coral'],
        salmon: ['coral', 'salmon'],
        peach: ['salmon', 'peach'],
        pink: ['butter', 'gold'],
        butter: ['gold', 'butter'],
        cream: ['butter', 'gold'],
      }
      const head = (n, { x, y, reach, paint, blur, order, petals = 6 }) => {
        const lie = (jitter(n) + 0.5) * TAU
        const small = Math.floor((jitter(n + 1) + 0.5) * petals)
        for (let k = 0; k < petals; k += 1) {
          const angle = lie + (k / petals) * TAU + jitter(n + 10 + k) * 0.4
          const long = reach * (0.52 + 0.12 * (jitter(n + 20 + k) + 0.5)) * (k === small ? 0.8 : 1)
          const ox = Math.cos(angle) * reach * 0.46
          const oy = -Math.sin(angle) * reach * 0.46
          put(n + 30 + k, {
            x: x + ox,
            y: y + oy,
            order: order + k * 0.001,
            long,
            wide: 0.66 + 0.16 * (jitter(n + 40 + k) + 0.5),
            turn: Math.atan2(-oy, -ox),
            blur,
            paints: [paint, SECOND_PAINT[paint]],
            load: 0.9,
          })
        }
        // a soft heart a little to the lit side, where the brush came down
        put(n + 50, {
          x: x - reach * 0.08,
          y: y - reach * 0.1,
          order: order + 0.05,
          long: reach * 0.2,
          wide: 0.9,
          turn: 0,
          blur: blur * 0.8,
          paints: HEART_PAINT[paint],
          load: 0.6,
        })
      }
      // [across, how far down, reach as a share of the width, paint, how soft, a stem's width], the furthest first
      const meadow = [
        [0.75, 0.885, 0.05, 'coral', 1.5, 1.3],
        [0.18, 0.885, 0.052, 'butter', 1.5, 1.3],
        [0.58, 0.955, 0.05, 'peach', 1.6, 0],
        [0.68, 0.975, 0.08, 'salmon', 2.2, 0],
        [0.27, 0.975, 0.085, 'cream', 2.2, 0],
        [0.46, 1, 0.085, 'pink', 2.4, 0],
        [0.06, 0.95, 0.105, 'butter', 3, 0],
        [0.87, 0.95, 0.105, 'coral', 3, 0],
      ]
      // a few soft leaves among them first: [across, how far down, length as a share of the width, lean]
      ;[
        [0.12, 0.94, 0.08, -0.3],
        [0.34, 0.975, 0.07, 0.35],
        [0.63, 0.97, 0.07, -0.3],
        [0.93, 0.93, 0.08, 0.4],
      ].forEach(([at, down, long, lean], k) => {
        put(121000 + k, {
          x: w * at,
          y: h * down,
          order: 5.6 + k * 0.01,
          long: w * long,
          wide: 0.28,
          turn: -Math.PI / 2 + lean,
          blur: 2.2,
          paints: ['leaf', 'deepGreen'],
          load: 0.6,
          kind: 0.25,
        })
      })
      meadow.forEach(([at, down, reach, paint, blur, stem], k) => {
        const x = w * at
        const y = h * down
        const order = 6 + k * 0.3
        if (stem) {
          stalkTo(120900 + k, {
            x,
            y: y + w * reach * 0.3,
            order: order - 0.1,
            wide: stem,
            soft: blur * 0.8,
            ink: 1,
            mix: 0.5,
          })
        }
        head(120000 + k * 100, { x, y, reach: w * reach, paint, blur, order })
      })
      // Grass so close to the eye that it is out of focus, the hero's blades rising from under the sill at either side and
      // leaning in, as the stems round anyone lying in a meadow do: [root across, tip across, how far up the window the tip
      // is, how wide, how soft]. The widest stand right at the edges. They stand in front of the far daisies and the
      // flowers along the sill, and behind the near daisy.
      ;[
        [-0.08, 0.1, 0.46, 15, 3.6],
        [0.02, 0.15, 0.36, 9, 2.8],
        [0.14, 0.22, 0.25, 6, 2.2],
        [0.3, 0.27, 0.17, 5, 2],
        [0.68, 0.72, 0.18, 5, 2],
        [0.86, 0.79, 0.28, 7, 2.4],
        [0.98, 0.86, 0.38, 10, 3],
        [1.08, 0.9, 0.5, 16, 3.8],
      ].forEach(([from, to, up, wide, soft], k) => {
        const root = h + 22
        const x = w * to
        const y = h - h * up
        stalkTo(96000 + k, {
          x,
          y,
          order: 22 + k * 0.01,
          wide,
          soft,
          ink: k % 3 ? 2 : 3,
          mix: 0.3 + 0.1 * (k % 3),
          lean: Math.atan2(x - w * from, root - y),
        })
      })
      // And the daisy itself, its heart about two thirds of the way down, its petals reaching up to a little under the mark,
      // with sky between, and out past the window's sides, its lower petals over the meadow's flowers and its stem rising
      // out of them.
      const near = { x: w * 0.48, y: h * 0.655, heart: w * 0.13, tilt: 0.79 }
      // the light round it, as through a soft lens
      put(97000, {
        x: near.x,
        y: near.y - h * 0.05,
        order: 30,
        long: w * 0.4,
        wide: 0.75,
        turn: 0,
        blur: w * 0.18,
        paints: ['white', 'white'],
        load: 0.16,
      })
      // its stem, as soft as it is close, from under the sill up behind its heart, in front of the flowers there
      stalkTo(97001, { x: near.x - w * 0.01, y: near.y, order: 35, wide: 6, soft: 3, ink: 2, mix: 0.45, lean: -0.04 })
      daisy({
        ...near,
        long: w * 0.4,
        wide: 0.33,
        petals: 18,
        persp: 0.25,
        crown: 0.38,
        blur: 3.6,
        load: 0.95,
        turn0: 0.07,
        order: 40,
        id: 9,
        shine: 0.45,
        florets: 22,
        even: 9175,
      })
    },
  }

  /* --- the footer's composition ---------------------------------------------------------------------- */

  /* A meadow round the site's footer, after a footer card set down in a landscape of soft rolling hills: the root is
     made in the band under the footer (see footerMeadow), fills it, and reaches up over the footer's lower part. The far
     land is behind the footer, which is cut out of it, and the near hills come up in front of its foot (`front`, and see
     the near hills). Rounded hills lie one behind another, paler and cooler the further off they are: the slate ridge far
     away, the wallpaper's hill on the left and a dome on the right, then the footer, the near hills over its foot, two
     lower hills in front of those, and the meadow at the front, rising into both corners. The flowers are fields of
     colour over all of it (see FOOTER_PAINTS), and the low sun lies along the crests (see NEAR_BANDS and CREST_GLOW).
     Where the band is wider than the footer, the far hills rise beside it under the hero's band of sky. Live while it is
     on the screen, as the hero is, and built only once the page is scrolled near it.

     Its lines are drawn in CSS pixels about the footer's foot (negative is above it) on the stage they were drawn for:
     1232 wide, with the band's 240 pixels under the footer (and the 12 between the two). There the land runs from 140
     pixels above the footer's foot to its own foot, 24 past the canvas's, and a room is 416 pixels. On any other stage a
     room is as many pixels as keeps the footer's foot at that place in the land (see `room`), so whatever the width, the
     same hills come out from under it (a phone's band, 165 pixels, has them a little lower); and the hills' rise and fall
     is scaled about the footer's foot by `relief`, so that on a narrow stage, where they would stand steep, they lie
     flatter, as the hero's hill does. The band is short and wide, so the nearer hills run across it on a slant, as the
     slopes do in a picture of a hillside, rather than lying one over another in level stripes. */
  const FOOTER_ROOM = 416
  const FOOTER_CARD = 140 / FOOTER_ROOM
  const FOOTER_PAST = 24
  const FOOTER_RELIEF = [0.7, 1.1]
  /* A line in pixels about the footer's foot, as the land's guide measured from it (see `crest`). */
  const footerLine = (points) => ({ crest: points.map(([across, px]) => [across, px / FOOTER_ROOM]) })
  /* A line through its points as the land's curves run (curveThrough). */
  const footerCurve = (points) => (x) => {
    const last = points.length - 1
    if (x <= points[0][0]) {
      return points[0][1]
    }
    if (x >= points[last][0]) {
      return points[last][1]
    }
    let k = 0
    while (points[k + 1][0] < x) {
      k += 1
    }
    const slope = (a, b) => (points[b][1] - points[a][1]) / (points[b][0] - points[a][0])
    const m0 = k > 0 ? slope(k - 1, k + 1) : slope(k, k + 1)
    const m1 = k + 1 < last ? slope(k, k + 2) : slope(k, k + 1)
    const h = points[k + 1][0] - points[k][0]
    const f = (x - points[k][0]) / h
    return (
      (2 * f ** 3 - 3 * f ** 2 + 1) * points[k][1] +
      (f ** 3 - 2 * f ** 2 + f) * h * m0 +
      (-2 * f ** 3 + 3 * f ** 2) * points[k + 1][1] +
      (f ** 3 - f ** 2) * h * m1
    )
  }
  /* The higher of two lines at each place, for the far hills' line. */
  const footerHigher = (one, other) => {
    const [a, b] = [footerCurve(one), footerCurve(other)]
    return Array.from({ length: 65 }, (_, k) => {
      const across = -1.6 + k * 0.05
      return [across, Math.min(a(across), b(across))]
    })
  }

  /* The hills, from the furthest. The band of sky, which shows only where the far hills rise beside the footer: highest
     behind the footer and falling away towards the screen's sides, so that beside the footer its top runs down and out
     rather than standing level, as a block would; and it thins into the page up there (see its paint). */
  const FOOTER_SKY = [
    [-1.6, -66],
    [-1.3, -78],
    [-1.1, -94],
    [-1, -104],
    [-0.9, -116],
    [-0.78, -125],
    [-0.6, -130],
    [-0.3, -124],
    [0, -118],
    [0.3, -120],
    [0.6, -128],
    [0.78, -124],
    [0.9, -114],
    [1, -102],
    [1.1, -92],
    [1.3, -78],
    [1.6, -66],
  ]
  /* How wide the band beside the footer must be, on one side or the other, in CSS pixels, for its sky to be drawn: a
     narrower strip shows only a sliver of it against the footer's edge, so there the far hills stand against the page. */
  const FOOTER_SIDE = 40
  /* a sky that is not drawn: a thin strip just under the far hills' crests, which hide it */
  const UNDER_HILLS = {
    hill: [
      [-1.6, 0.06],
      [1.6, 0.06],
    ],
  }
  /* The slate ridge, uneven along its top as the wallpaper's is: it shows only over the dome's shoulder on the right,
     beside the footer, and runs low behind the far hills everywhere else. */
  const FOOTER_RIDGE = [
    [-1.6, 44],
    [-1.2, 44],
    [-0.9, 44],
    [-0.6, 44],
    [-0.35, 44],
    [-0.1, 44],
    [0.15, 44],
    [0.35, 44],
    [0.5, 34],
    [0.6, 0],
    [0.7, -50],
    [0.8, -65],
    [0.88, -76],
    [0.95, -73],
    [1.02, -79],
    [1.15, -74],
    [1.4, -62],
    [1.6, -56],
  ]
  /* The wallpaper's hill: a broad, flat-topped shoulder beside the footer on the left, falling a little to the left edge
     and, from the footer's corner, down to run on a few pixels behind its foot, so that the footer sits along the hill's
     lit crest as the hero's words do; and on to the right, behind the dome. */
  const FOOTER_HILL = [
    [-1.6, -53],
    [-1.3, -71],
    [-1.1, -81],
    [-0.98, -85],
    [-0.9, -79],
    [-0.8, -50],
    [-0.7, -18],
    [-0.58, -7],
    [-0.4, -5],
    [-0.2, -5],
    [0, -5],
    [0.15, -6],
    [0.28, -9],
    [0.4, -3],
    [0.55, 16],
    [0.7, 37],
    [0.9, 65],
    [1.1, 90],
    [1.6, 136],
  ]
  /* A dome on the right, in front of it, low under the footer and rising beside it. The two meet under the footer about 5
     pixels above its foot (4.8 at the lowest), so that the footer sits on their lit crests and nothing behind them shows
     under it (see tools/valley.py); the near hills come up in front of that line everywhere under the footer anyway. */
  const FOOTER_DOME = [
    [-0.1, 108],
    [0.05, 62],
    [0.2, 24],
    [0.3, 0],
    [0.38, -10],
    [0.5, -14],
    [0.6, -18],
    [0.7, -24],
    [0.78, -36],
    [0.86, -52],
    [0.92, -59],
    [1.05, -57],
    [1.25, -50],
    [1.6, -34],
  ]
  /* How high the far land comes beside the footer, in pixels over its foot, with the shrubs on its crest: as far as the
     canvas must reach where only a sliver of the band shows beside the footer (see `cover`). */
  const FOOTER_FAR_TOP =
    8 -
    Math.min(
      ...[...FOOTER_HILL, ...FOOTER_RIDGE, ...FOOTER_DOME]
        .filter(([across]) => Math.abs(across) <= 1.1)
        .map(([, px]) => px),
    )
  /* Two lower hills in front of those, each running across the band on a slant: one rising to the right, in shade, and,
     nearer, one rising high on the left into the light and falling away across the band to the right. */
  const FOOTER_RIGHT_RISE = [
    [-0.1, 132],
    [0.1, 106],
    [0.3, 82],
    [0.5, 64],
    [0.7, 52],
    [0.9, 49],
    [1.1, 55],
    [1.4, 70],
    [1.6, 80],
  ]
  const FOOTER_LEFT_RISE = [
    [-1.6, 6],
    [-1.3, 9],
    [-1, 16],
    [-0.75, 27],
    [-0.5, 40],
    [-0.25, 54],
    [0, 68],
    [0.25, 84],
    [0.5, 103],
    [0.75, 126],
    [1, 152],
    [1.2, 176],
  ]
  /* And the meadow at the front, up into both corners and low in the middle. */
  const FOOTER_MEADOW = [
    [-1.4, 100],
    [-1.15, 108],
    [-1, 115],
    [-0.8, 127],
    [-0.5, 146],
    [-0.2, 162],
    [0, 168],
    [0.2, 165],
    [0.5, 150],
    [0.8, 128],
    [1, 114],
    [1.15, 107],
    [1.4, 100],
  ]
  /* Further off, a hill's green is cooler and paler, a third of the way to the ridge's slate (its haze for the lime), as
     [light, dark], so that the far hills step back in value rather than in the run of their lines; and the light on a far
     hill's crest, the hero's lime a tenth of the way there. The low sun gilds the lit crests nearer by: a golden lime, and
     gold at the very edge. */
  const FOOTER_INK = {
    ...LAND_INK,
    crest: ['#a8d355', '#b8de6c'],
    mist: ['#add07b', '#bcda8e'],
    sage: ['#68a161', '#84b778'],
    fern: ['#4e865b', '#6ba172'],
    glow: ['#c3d454', '#cddc69'],
    gilt: ['#e5c95c', '#ebd473'],
    // the land in front, in shade: deeper and cooler than the hero's, as the shade of a hillside at the end of the day
    green: ['#4a962c', '#4d9433'],
    deepGreen: ['#2c6a24', '#2f6629'],
    shade: ['#25502a', '#244b29'],
    night: ['#1c3f23', '#1b3a21'],
    // the paler side of grass pushed over in the shade: a lighter green, not the hero's near-white
    sheen: ['#8cc054', '#93c55c'],
  }
  /* A far hill, lit along a broad band at its crest, which is what the footer sits on, as the hero's words sit over its
     hill's lit crest; a deeper band of shade under that; and its own shade again at its foot, where the next hill comes up
     in front of it. */
  const FOOTER_FAR_PAINT = [
    [0, 'crest', 0],
    [0.03, 'crest', 0.9],
    [0.12, 'crest', 1],
    [0.25, 'mist', 1],
    [0.4, 'fern', 1],
    [0.58, 'sage', 1],
    [0.84, 'sage', 1],
    [1, 'fern', 1],
  ]
  /* and a nearer one, in the hero's own greens, gilded along its crest where the sun reaches it */
  const FOOTER_NEAR_PAINT = [
    [0, 'gilt', 0],
    [0.025, 'gilt', 0.85],
    [0.07, 'glow', 1],
    [0.16, 'lime', 1],
    [0.3, 'green', 1],
    [0.55, 'deepGreen', 1],
    [0.85, 'shade', 1],
    [1, 'shade', 1],
  ]
  /* The near hill on the left, right under the footer's foot and the furthest land a narrow screen shows, lit the longest
     along its crest, where the footer sits in the sun, and falling into shade down its slope, under the band of light. */
  const NEAR_HILL_PAINT = [
    [0, 'gilt', 0],
    [0.03, 'gilt', 0.9],
    [0.09, 'glow', 1],
    [0.18, 'lime', 1],
    [0.32, 'green', 1],
    [0.6, 'deepGreen', 1],
    [0.9, 'shade', 1],
    [1, 'shade', 1],
  ]
  /* and the right rise, turned from the light, in shade from just under its crest */
  const FOOTER_SHADE_PAINT = [
    [0, 'lime', 0],
    [0.03, 'lime', 0.8],
    [0.08, 'green', 1],
    [0.2, 'deepGreen', 1],
    [0.45, 'shade', 1],
    [1, 'night', 1],
  ]
  /* The near hills, in front of the footer: they come up over its foot, as the hills of a landscape a card is set down in
     come up in front of it, so that its foot and its corners go into the land. A broad hill rises from the left over the
     footer's lower left corner and passes under its copyright; it falls away into a valley, where more of the footer shows;
     and a smaller hill behind it rises again on the right, over the footer's lower right corner. They are the nearest of the
     hills behind the meadow's: their slopes run on down behind the two rises and the meadow in front, which hide where
     they end. Their crests are given here as shares of their height over the footer's foot, by place across. */
  const NEAR_LEFT = [
    [-1.6, 0.55],
    [-1.25, 0.72],
    [-1, 0.86],
    [-0.8, 0.96],
    [-0.62, 1],
    [-0.45, 0.96],
    [-0.28, 0.84],
    [-0.1, 0.62],
    [0.05, 0.38],
    [0.18, 0.16],
    [0.32, -0.06],
    [0.5, -0.36],
    [0.8, -0.78],
    [1.2, -1.3],
  ]
  const NEAR_RIGHT = [
    [-0.6, -0.5],
    [-0.3, -0.1],
    [-0.05, 0.14],
    [0.1, 0.22],
    [0.2, 0.28],
    [0.32, 0.42],
    [0.47, 0.6],
    [0.62, 0.68],
    [0.76, 0.66],
    [0.9, 0.56],
    [1.05, 0.45],
    [1.3, 0.32],
    [1.6, 0.24],
  ]
  const nearLeft = footerCurve(NEAR_LEFT)
  const nearRight = footerCurve(NEAR_RIGHT)
  /* the crest one sees, the higher of the two at each place */
  const nearCrest = (across) => Math.max(nearLeft(across), nearRight(across))
  /* How far the crest keeps under anything in the footer, in CSS pixels; and how far any paint planted on it does, the
     light and the flowers along it, so that the footer's last lines, the copyright among them, keep a calm margin. */
  const NEAR_CLEAR = 12
  const NEAR_CALM = 16
  /* Whether the band under the footer is a phone's short one (165 pixels, not 240), by the room from the footer's foot
     to the band's, gap and all (252 or 177), rather than by the screen's width, so that the meadow follows the band
     whatever the width it changes at. */
  const shortBand = (room) => room < 215
  /* How high the near hills come over the footer's foot at their highest: a seventh of the footer's height, within
     bounds, so that a phone's tall footer sinks no deeper than a desktop's would look right; and over a short band no
     more than 70 pixels, so that they never take over the meadow under them. */
  const nearTall = (tall, room = 252) => clamp(tall * 0.14, 36, shortBand(room) ? 70 : 92)
  /* ... and on a stage: that, lowered as a whole wherever the footer's content (`keep`, measured with the footer) comes
     within NEAR_CLEAR of the crest in any column of it, so the crest always passes under the copyright and the links. */
  const nearHeight = ({ w, h, hidden }) => {
    if (!hidden) {
      return 0
    }
    let height = nearTall(hidden.bottom - hidden.top, h - hidden.bottom)
    for (const box of hidden.keep || []) {
      let most = 0
      for (let x = Math.max(0, box.left); x <= Math.min(w, box.right); x += 2) {
        most = Math.max(most, nearCrest(x / (w / 2) - 1))
      }
      if (most > 0) {
        height = Math.min(height, (hidden.bottom - box.bottom - NEAR_CLEAR) / most)
      }
    }
    return Math.max(0, height)
  }
  /* A near hill's crest as the land's guide on a stage, from one place across to another (the land's room and base are
     known by then), or, with no footer to measure, far down behind the rest. */
  const nearGuide = (curve, from, to) => (stage) => {
    const { hidden, room, base } = stage
    const height = nearHeight(stage)
    const count = Math.round((to - from) / 0.05)
    return Array.from({ length: count + 1 }, (_, k) => {
      const across = from + k * 0.05
      return [across, hidden ? (hidden.bottom - height * curve(across) - base) / room : 0.9]
    })
  }
  /* The round shrubs peeking over the near hills' crests, as a sheet's shrubs are given: one in the valley and one in
     flower on the right hill's top, and one at the left hill's far end, each wider than it is tall, so that as small as
     they are here they read as domes and not as boxes. The light planted along the crests keeps off them. */
  const NEAR_SHRUBS_RIGHT = [
    [0.19, 13, 8, false],
    [0.66, 16, 10, true],
  ]
  const NEAR_SHRUBS_LEFT = [[-0.95, 14, 9, false]]
  /* The low sun lies along the near hills' crests, right under the footer's foot, which sits in it: a band of small
     flowers, each a dab of paint, thickest just under the crest and thinning down the slope into the green, warming as it
     goes, as [from across, to across, how deep a share of the hills' height, how much of the band's ground they cover,
     palette, seed of its patches, the palette that comes in lower down, the palette of the stretches turned from the
     light]. Far off as they are, they read as the gold of the first picture's sunlit slope, a field of colour more than
     flowers. The light is on the left two thirds; towards the right, where the hills are in shade, the band thins, and
     more and more of its stretches are cool. */
  const NEAR_BANDS = [[-1.7, 1.7, 0.55, 1.8, 'gold field', 1, 'apricots', 'cool specks']]
  /* The mean size of a dab in the band, in CSS pixels at a fit of 1: small, so that there are many of them; never under
     0.95 of it, so that a phone's band, on hills as tall as a desktop's, is no busier than a desktop's. */
  const NEAR_BAND_DAB = 3.8
  /* The low sun caught along the lit crests: a haze of soft, thin paint lying just under each crest it reaches, warm and
     out of focus, so that it reads as light on the flowers rather than as flowers, as [the crest, from across, to across,
     how strong, its tints, where across it begins to fade, how large]: gold over the near hills' band, fading on the
     right, where they turn from the light, and a softer gold over the left rise's band; and right along the near
     hills' crest, under the footer, a thin rim of paler light, where the sun catches the flowers' heads. 'near' is the near hills' crest, and any
     other a sheet's, where it is the crest one sees. The right rise, in shade, has none. */
  const GOLD_LIGHT = [
    ['saffron', 'apricot'],
    ['apricot', 'gold'],
    ['marigold', 'saffron'],
    ['gold', 'apricot'],
  ]
  const RIM_LIGHT = [
    ['butter', 'apricot'],
    ['apricot', 'butter'],
    ['saffron', 'butter'],
  ]
  const CREST_GLOW = [
    ['near', -1.7, 1.7, 1.25, GOLD_LIGHT, 0.1, 1],
    ['left rise', -1.7, 0.2, 0.9, GOLD_LIGHT, 0, 1],
    ['near', -1.7, 1.7, 0.8, RIM_LIGHT, 0.1, 0.5],
  ]
  /* the sheets in front of each crest that glows, which hide it where they stand higher */
  const GLOW_HIDDEN_BY = { 'left rise': ['meadow'], 'right rise': ['left rise', 'meadow'] }
  /* Their slopes run on down to 30 pixels under the highest of the rises and the meadow in front of them, which hide where
     they end. */
  const NEAR_FOOT = footerLine(
    footerHigher(footerHigher(FOOTER_RIGHT_RISE, FOOTER_LEFT_RISE), FOOTER_MEADOW).map(([across, px]) => [
      across,
      px + 30,
    ]),
  )

  /* The footer's flowers are fields of colour, after a hillside at the end of the day: the low sun lies along the near
     hills' crests under the footer and along the left rise's, and a broad band of small gold and orange flowers lies in
     its light along the left rise's upper slope, warming to apricot and coral at its lower edge, and runs down it as the
     hill falls; the right rise is turned from the light, with a few patches of gold along its crest and cornflowers
     rising into its shade; a field of cornflowers stands in the meadow's own shade at the front, one by one with the
     green round them, and opens in the middle, where the chat bar floats; and far off, on the near hills under the
     footer and on the far hills beside it, the flowers are only specks, gold in the light and cool in the shade, a colour
     laid over the hill. The hills' green shows between them, and the paint has a film's grain. On a dark page the golds
     are hardly lighter than on a light one, and as rich: lighter, they read there as butter rather than as gold. */
  const FOOTER_PAINTS = {
    ...PAINTS,
    marigold: ['#f5a12c', '#f6a838'],
    tangerine: ['#ee8526', '#f08d30'],
    saffron: ['#f8bd45', '#f9c352'],
    apricot: ['#fcd07a', '#fcd585'],
    gold: ['#e9b438', '#ecba42'],
    butter: ['#f7da78', '#f8dd80'],
    cornflower: ['#4c70e2', '#6889ef'],
    azure: ['#6d93f1', '#86a6f5'],
    indigo: ['#3a54c9', '#5470da'],
    periwinkle: ['#9cb1f6', '#afc1f8'],
    violet: ['#7a6cd8', '#9185e4'],
  }
  /* the colours of the cornflowers right in front of the lens (see plant) */
  const FOOTER_BOKEH = [
    ['cornflower', 'indigo'],
    ['indigo', 'violet'],
    ['azure', 'cornflower'],
    ['cornflower', 'azure'],
    ['violet', 'indigo'],
    ['indigo', 'violet'],
  ]
  /* What each field is painted in, by how often, each kept to one family of colours, so that from afar a field reads as
     one colour and the meadow has no confetti. Only these: a stray in the plain grass takes one of them too. */
  const FOOTER_PALETTES = {
    marigolds: [
      ['marigold', 4],
      ['tangerine', 1.6],
      ['saffron', 2.6],
      ['gold', 1.2],
      ['apricot', 1.2],
      ['butter', 0.5],
    ],
    sunlit: [
      ['saffron', 3],
      ['apricot', 2.4],
      ['marigold', 1.6],
      ['butter', 0.8],
      ['gold', 0.5],
    ],
    // the cornflowers, in the meadow's shade and rising into the right rise's: blue and violet alone, and only a few of
    // the palest, which out of focus at the front read as white tufts
    cornflowers: [
      ['cornflower', 4],
      ['azure', 2.2],
      ['indigo', 2.2],
      ['periwinkle', 0.4],
      ['violet', 0.9],
    ],
    // far off, specks of gold where the light is, and cool ones where it is not
    'gold specks': [
      ['marigold', 2.4],
      ['saffron', 2.2],
      ['tangerine', 0.7],
      ['apricot', 1],
      ['butter', 0.5],
    ],
    // led by the blues: periwinkle, the palest, reads as frost on a dark page
    'cool specks': [
      ['azure', 2],
      ['cornflower', 1.6],
      ['periwinkle', 0.8],
      ['violet', 0.6],
    ],
    // the band of light along the near hills' crests, and the warmer flowers lower down it and under the left rise's band
    'gold field': [
      ['marigold', 2.2],
      ['saffron', 2],
      ['gold', 2.6],
      ['butter', 1],
      ['apricot', 1.4],
      ['coral', 0.2],
    ],
    apricots: [
      ['apricot', 2.4],
      ['tangerine', 0.8],
      ['peach', 1.2],
      ['salmon', 1.2],
      ['coral', 1],
    ],
  }
  /* How near a place is (see FLOWERS) `px` pixels under the footer's foot, by place across, on the stage the lines were
     drawn for: from just under the land's crest, the far hills' line, to the land's foot. Narrower stages flatten the hills
     (`relief`), which moves a field a little down its slope there. */
  const footerProfile = footerCurve(footerHigher(FOOTER_HILL, FOOTER_DOME))
  const footerNear = (across, px) => {
    const crest = footerProfile(across) / FOOTER_ROOM
    return (px / FOOTER_ROOM - crest - 0.03) / (0.95 - FOOTER_CARD - crest - 0.03)
  }
  /* A field's line along a hill's crest, `below` pixels down its slope, from one place across to another. */
  const alongCrest = (points, below, from, to, step = 0.15) => {
    const crest = footerCurve(points)
    const count = Math.max(1, Math.round((to - from) / step))
    return Array.from({ length: count + 1 }, (_, k) => {
      const across = from + ((to - from) * k) / count
      return [across, footerNear(across, crest(across) + (typeof below === 'function' ? below(across) : below))]
    })
  }
  /* How much of the ground the flowers cover by how near (see FLOWERS), for the canvas's width and the room under the
     footer's foot: the fields far off are full, the left rise's band fullest, and the cornflowers at the front stand
     apart; over a phone's short band, whose meadow is shallow, the front is thinner still, and the fields far off a little
     thinner too, since its flowers are smaller and so many more cover the same ground. */
  const footerCover = (w, room) => {
    const front = shortBand(room) ? 0.7 : 1
    const far = shortBand(room) ? 0.8 : 1
    return [
      [0, 2.4 * far],
      [0.08, 3 * far],
      [0.14, 3.4 * far],
      [0.36, 3.2 * far],
      [0.46, 1.8],
      [0.6, 1.5],
      [0.72, 1.5],
      [0.8, 2.4 * front],
      [1, 2 * front],
    ]
  }

  const FOOTER = {
    ...HERO,
    // no opening: its first picture is the finished meadow
    intro: false,
    // Built in idle time once within a little over three screens, and first painted when within three quarters of one.
    // The canvas reaches up only as far as its land does (see `cover`), so its top is about a tenth of a screen lower
    // than it was; woken that much sooner, the build still starts where it always has, where the page's own work is calm
    // when it asks for its context (a little later down the home page, that one step sometimes took 34 ms).
    wake: '310% 0px',
    near: '75% 0px',
    words: null,
    // the footer, which the far land keeps behind and the near hills come up in front of, clear of what is in it
    behind: '.docs-global-footer',
    keep: '.footer-content',
    // How far up over the footer the canvas reaches above the band's top, in CSS pixels, for the band's width and the
    // footer's height: where the band shows beside the footer wide enough for the sky (FOOTER_SIDE, on either side: on
    // some widths the footer keeps to the left of the band), far enough for the sky over the far hills, as `relief` and
    // the band's own room scale it (a phone's shorter band has a smaller room, see `room`), with the gap between the
    // footer and the band and room for the sky's lines to breathe; where only a sliver shows, far enough for the far hills
    // there and the shrubs on them; and far enough everywhere for the near hills at their highest and the shrubs that
    // peek over them. No further: the canvas never reaches up where nothing of the land would be.
    cover: ({ width, tall }) => {
      const card = document.querySelector('.docs-global-footer')?.getBoundingClientRect()
      const band = document.querySelector('.docs-footer-band')?.getBoundingClientRect()
      const gap = card && band ? Math.max(0, band.top - card.bottom) : 12
      const room = band ? band.height + gap : 252
      const scale =
        (clamp(width / 1232, FOOTER_RELIEF[0], FOOTER_RELIEF[1]) * (room + FOOTER_PAST)) /
        (1 - FOOTER_CARD) /
        FOOTER_ROOM
      const side = card && band ? Math.max(card.left - band.left, band.right - card.right) : 0
      const near = gap + nearTall(tall || 0, room) + 26
      if (side >= FOOTER_SIDE) {
        return Math.round(Math.max(near, gap + 14 - Math.min(...FOOTER_SKY.map(([, px]) => px)) * scale))
      }
      return Math.round(side > 0.5 ? Math.max(near, gap + 12 + FOOTER_FAR_TOP * scale) : near)
    },
    // Solid down to the foot of the page, every line run the whole way across, past the screen's right edge, and fewer of
    // the beads of light along the lines, so that they glint here and there rather than sparkle over the flowers. On a
    // light page the land between the lines is lifted only a little towards white (0.08, not the hero's 0.3), so that
    // the land in shade reads as deep paint rather than as stripes.
    lines: { ...LINES, sink: 0.001, whole: true, beadChance: 0.15, lift: 0.08 },
    inks: FOOTER_INK,
    land: {
      ...HERO.land,
      profile: footerLine(footerHigher(FOOTER_HILL, FOOTER_DOME)).crest,
      crest: FOOTER_CARD,
      relief: FOOTER_RELIEF,
      sheets: [
        {
          name: 'sky',
          // where the band beside the footer is too narrow for it (FOOTER_SIDE), it lies under the far hills, unseen
          top: ({ w, hidden }) =>
            hidden && Math.max(hidden.left, w - hidden.right) < FOOTER_SIDE ? UNDER_HILLS : footerLine(FOOTER_SKY),
          // it runs on under the far hills, so that no page shows at their crests
          foot: {
            hill: [
              [-1.6, 0.07],
              [1.6, 0.07],
            ],
          },
          // light, and thinning into the page at its top: a haze of sky rather than a block of it
          paint: [
            [0, 'pale', 0],
            [0.14, 'pale', 0.32],
            [0.3, 'sky', 0.7],
            [0.46, 'blue', 0.88],
            [0.62, 'sky', 1],
            [0.8, 'pale', 1],
            [1, 'pale', 1],
          ],
          fill: 0.7,
          under: 0.38,
          flow: 1.2,
          breath: 2,
        },
        /* A strip of land under all the rest along the right edge. It was the backstop for the notches of page that the
           few lines which stopped a pixel or two short of the canvas's edge left there, before `lines.whole` carried
           every line through; it stays because each sheet's lines are seeded by its place in this list, and taking it
           out would draw all of them again differently. */
        {
          name: 'right edge',
          opaque: true,
          top: footerLine(
            FOOTER_RIDGE.filter(([across]) => across >= 0.8).map(([across, px]) => [Math.max(across, 0.84), px]),
          ),
          foot: [
            [0.84, 1.1],
            [1.6, 1.1],
          ],
          paint: [
            [0, 'slateHaze', 0],
            [0.01, 'slate', 1],
            [0.06, 'sage', 1],
            [0.5, 'green', 1],
            [1, 'olive', 1],
          ],
          fill: 0.72,
          under: 0.6,
          flow: 0.5,
          breath: 1.2,
        },
        {
          name: 'far ridge',
          opaque: true,
          top: footerLine(FOOTER_RIDGE),
          foot: {
            hill: [
              [-1.6, 0.12],
              [1.6, 0.12],
            ],
          },
          paint: [
            [0, 'slateHaze', 0],
            [0.08, 'slateHaze', 0.8],
            [0.4, 'slate', 1],
            [1, 'slate', 1],
          ],
          fill: 0.72,
          under: 0.5,
          patch: 0.2,
          flow: 0.5,
          breath: 1.2,
        },
        {
          name: 'hill',
          opaque: true,
          top: footerLine(FOOTER_HILL),
          foot: footerLine([
            [-1.6, 108],
            [-0.8, 102],
            [-0.3, 93],
            [0.2, 93],
            [0.6, 87],
            [1.6, 124],
          ]),
          paint: FOOTER_FAR_PAINT,
          lean: 0.3,
          fill: 0.74,
          under: 0.78,
          patch: 0.15,
          flow: 0.6,
          breath: 1.4,
        },
        {
          name: 'dome',
          opaque: true,
          top: footerLine(FOOTER_DOME),
          foot: footerLine([
            [-0.1, 143],
            [0.3, 93],
            [0.8, 87],
            [1.6, 93],
          ]),
          paint: FOOTER_FAR_PAINT,
          lean: 0.3,
          fill: 0.74,
          under: 0.78,
          patch: 0.15,
          flow: 0.6,
          breath: 1.4,
        },
        // gorse on the far hills' crests beside the footer, as small as the hills under them are low, and on the left further
        // in than the near hill's shrub, so that the two never stand one over the other
        {
          name: 'far shrubs',
          opaque: true,
          on: 'hill',
          shrubs: [
            [-0.8, 14, 8, true],
            [-1.03, 9, 6, false],
            [0.97, 13, 8, true],
          ],
          paint: SHRUB_PAINT,
          fill: 0.8,
          under: 0.7,
          patch: 0.25,
          flow: 0.3,
          breath: 0.8,
        },
        {
          name: 'right rise',
          opaque: true,
          top: footerLine(FOOTER_RIGHT_RISE),
          foot: footerLine([
            [-0.1, 232],
            [0.5, 224],
            [1.6, 216],
          ]),
          paint: FOOTER_SHADE_PAINT,
          lean: 0.25,
          fill: 0.88,
          under: 0.88,
          patch: 0.3,
          flow: 0.7,
          breath: 1.6,
          sheen: 0.6,
        },
        {
          name: 'left rise',
          opaque: true,
          top: footerLine(FOOTER_LEFT_RISE),
          foot: footerLine([
            [-1.6, 196],
            [-0.8, 214],
            [0, 226],
            [0.6, 222],
            [1.2, 262],
          ]),
          paint: FOOTER_NEAR_PAINT,
          lean: 0.25,
          fill: 0.88,
          under: 0.88,
          patch: 0.3,
          flow: 0.7,
          breath: 1.6,
          sheen: 0.6,
        },
        {
          name: 'meadow',
          opaque: true,
          top: footerLine(FOOTER_MEADOW),
          // the land's own foot, past the canvas's
          foot: [
            [-1.6, 1],
            [1.6, 1],
          ],
          // lit along its crest, and in its own shade under the cornflowers, deepening towards the front
          paint: [
            [0, 'lime', 0],
            [0.03, 'lime', 0.85],
            [0.07, 'lime', 1],
            [0.14, 'green', 1],
            [0.3, 'deepGreen', 1],
            [0.6, 'shade', 1],
            [1, 'night', 1],
          ],
          fill: 0.92,
          under: 0.9,
          patch: 0.2,
          flow: 0.8,
          breath: 2,
          // Where the unseen passer parts the grass it shows its paler side (FOOTER_INK's sheen), but only so far: over
          // the deep shade at the front a full sheen read as a smear of fog behind it, just as a reader arrives.
          sheen: 0.5,
        },
        // a dark shrub in flower where the meadow rises into each corner, as low as the meadow is shallow and wider than tall
        {
          name: 'near shrubs',
          opaque: true,
          on: 'meadow',
          shrubs: [
            [-0.94, 22, 11, true],
            [0.93, 24, 11, true],
          ],
          paint: SHRUB_PAINT,
          fill: 0.8,
          under: 0.7,
          patch: 0.25,
          flow: 0.3,
          breath: 0.8,
        },
        /* The near hills in front of the footer, after all the rest so that every other sheet keeps its place in this list,
           and so its lines and its patches; they are drawn where `front` puts them, in front of the footer and behind the
           rises. Each is painted as the rises are, from their row. */
        {
          name: 'near right',
          opaque: true,
          top: nearGuide(nearRight, -0.6, 1.6),
          foot: NEAR_FOOT,
          paint: 'right rise',
          lean: 0.25,
          fill: 0.88,
          under: 0.88,
          patch: 0.3,
          flow: 0.7,
          breath: 1.6,
          sheen: 0.6,
        },
        {
          name: 'near left',
          opaque: true,
          top: nearGuide(nearLeft, -1.6, 1.2),
          foot: NEAR_FOOT,
          paint: NEAR_HILL_PAINT,
          lean: 0.25,
          fill: 0.88,
          under: 0.88,
          patch: 0.3,
          flow: 0.7,
          breath: 1.6,
          sheen: 0.6,
        },
        // round shrubs peeking over their crests, clear of the footer's content (see NEAR_SHRUBS_RIGHT)
        {
          name: 'near hill shrubs',
          opaque: true,
          on: 'near right',
          shrubs: NEAR_SHRUBS_RIGHT,
          paint: 'near shrubs',
          fill: 0.8,
          under: 0.7,
          patch: 0.25,
          flow: 0.3,
          breath: 0.8,
        },
        {
          name: 'near left shrubs',
          opaque: true,
          on: 'near left',
          shrubs: NEAR_SHRUBS_LEFT,
          paint: 'near shrubs',
          fill: 0.8,
          under: 0.7,
          patch: 0.25,
          flow: 0.3,
          breath: 0.8,
        },
      ],
      // in front of the footer, in the order they are drawn: the near hills and what grows on them, then the rises and the
      // meadow; every other sheet is behind it
      front: [
        'near right',
        'near hill shrubs',
        'near left',
        'near left shrubs',
        'right rise',
        'left rise',
        'meadow',
        'near shrubs',
      ],
      // A room is as many pixels as puts the footer's foot FOOTER_CARD of the way down the land, with the land's foot
      // FOOTER_PAST pixels under the canvas's (so that nothing at the foot of the page is ever left thin); its top may
      // run up past the canvas, behind the footer, where nothing shows.
      room: ({ h, hidden }) => (h - (hidden ? hidden.bottom : 0) + FOOTER_PAST) / (1 - FOOTER_CARD),
      foot: -FOOTER_PAST,
      head: -1e4,
      least: 120,
    },
    // the unseen passer keeps to the meadow at the front
    passer: { ...PASSER, lane: 0.84 },
    // grass as short as the meadow is shallow, and deep in its shade at the front
    grass: { ...GRASS, tall: [6, 28], inks: ['lime', 'green', 'deepGreen', 'shade', 'leaf'] },
    flowers: {
      ...FLOWERS,
      // a wide screen shows the meadow on past the drifts' stage, and its front corners are in flower too
      front: 1.65,
      // Smaller at the front than the hero's and larger further back, a dab rather than a dot: a field, not a heap; and as
      // small at the front as the meadow is shallow. The eye is on the gold band, so the cornflowers in front of it are
      // soft, and the specks behind it softer still, so that far off they run together into fields of colour.
      size: { far: 2, close: 10, curve: 1.8, own: [0.65, 1.35] },
      focus: 0.28,
      blur: { behind: 0.9, deepest: 2, front: 1.05, most: 0.45, least: 1.3 },
      cover: footerCover,
      // Far off each speck is larger than its depth's size, so that fewer of them cover the same ground: dabs of a field
      // rather than a dust of dots, and a lighter load to draw.
      far: [1.05, 1.6],
      // far off they stay strong, a field of colour, not a haze
      fade: [0, 0.3, 0.72],
      crisp: 0.003,
      stems: 0.12,
      leaves: 0.15,
      bed: 0.3,
      drifts: [
        // The gold band, lying in the light along the left rise's upper slope from the left edge and down to the right as
        // the hill falls, broadest on the left and breaking into clumps as it goes; its lit core paler and fuller.
        {
          line: alongCrest(FOOTER_LEFT_RISE, (across) => 26 + 8 * Math.sin(across * 4.1 + 0.6), -1.75, 0.5, 0.1),
          wide: [0.2, 0.07],
          full: [1, 0.75],
          paints: 'marigolds',
          patchy: true,
          patchyFrom: 0.62,
          own: [0.75, 1.15],
        },
        {
          line: alongCrest(FOOTER_LEFT_RISE, (across) => 10 + 4 * Math.sin(across * 5.3 + 1.7), -1.6, 0, 0.1),
          wide: [0.1, 0.05],
          full: [1, 0.85],
          paints: 'sunlit',
          patchy: true,
          patchyFrom: 0.7,
          own: [0.9, 1.5],
        },
        // The right rise is turned from the light: a few patches of gold along its crest, where the last of it catches the
        // flowers, above the cornflowers rising into its shade, with plain green between them; each a thin, full strip, so
        // that it reads as a field's colour and not as a sprinkle of single petals.
        {
          line: alongCrest(FOOTER_RIGHT_RISE, 9, 0.3, 1.75),
          wide: [0.04, 0.05],
          full: [0.8, 0.85],
          paints: 'marigolds',
          patchy: true,
          gaps: true,
        },
        // cornflowers rising from the meadow up into the right rise's shade, under its patches of gold
        {
          line: alongCrest(FOOTER_RIGHT_RISE, (across) => 42 - 14 * across, 0.3, 1.75),
          wide: [0.08, 0.1],
          full: [0.55, 0.75],
          paints: 'cornflowers',
          patchy: true,
          gaps: true,
        },
        // The far land under the footer, on the near hills' lower slopes: specks of gold in the light on the left, fewer
        // and cool in the shade on the right.
        {
          line: [
            [-1.75, 0.1],
            [-1, 0.08],
            [-0.5, 0.06],
            [0, 0.05],
          ],
          wide: [0.11, 0.11],
          full: [0.9, 0.8],
          paints: 'gold specks',
          patchy: true,
        },
        {
          line: [
            [0.1, 0.05],
            [0.5, 0.06],
            [1, 0.08],
            [1.75, 0.1],
          ],
          wide: [0.11, 0.11],
          full: [0.55, 0.65],
          paints: 'cool specks',
          patchy: true,
        },
        // and on the far hills beside the footer, gold on the left and cool on the right
        {
          line: [
            [-1.3, 0.03],
            [-0.84, 0.05],
          ],
          wide: [0.05, 0.05],
          full: [0.9, 0.8],
          paints: 'gold specks',
          patchy: true,
        },
        {
          line: [
            [0.84, 0.05],
            [1.3, 0.03],
          ],
          wide: [0.05, 0.05],
          full: [0.45, 0.45],
          paints: 'cool specks',
          patchy: true,
          gaps: true,
        },
        // The cornflowers in the meadow's shade, broken into patches with plain green between them, reaching further up the
        // slope on the left to meet the gold; and at the front, apart from it (see cover), the larger soft ones, one by
        // one, on the left of the chat bar's lane (the right's is at the end of the list).
        {
          line: alongCrest(FOOTER_MEADOW, (across) => 22 + 8 * across, -1.75, 1.75, 0.25),
          wide: [0.17, 0.15],
          full: [0.85, 0.7],
          paints: 'cornflowers',
          patchy: true,
        },
        {
          line: [
            [-1.75, 0.92],
            [-0.36, 0.92],
          ],
          wide: [0.08, 0.08],
          full: [0.3, 0.3],
          paints: 'cornflowers',
        },
        // where the two meet, gold scattered in the blue's upper edge, small: the meadow's only gold
        {
          line: alongCrest(FOOTER_MEADOW, -5, -1.75, 1.75, 0.25),
          wide: [0.035, 0.035],
          full: [0.4, 0.3],
          paints: 'marigolds',
          patchy: true,
          gaps: true,
          own: [0.6, 0.95],
        },
        // The gold band's lower edge warming into apricot and coral, as the second picture's light does: one thin, patchy
        // drift just under it. The engine breaks each drift into clumps by its place in this list, so a drift added later
        // goes at the end, and every other keeps its clumps.
        {
          line: alongCrest(FOOTER_LEFT_RISE, (across) => 47 + 8 * Math.sin(across * 4.1 + 0.6), -1.75, 0.45, 0.1),
          wide: [0.085, 0.05],
          full: [0.7, 0.4],
          paints: 'apricots',
          patchy: true,
          own: [0.6, 0.95],
        },
        // the front's cornflowers on the right of the chat bar's lane
        {
          line: [
            [0.36, 0.92],
            [1.75, 0.92],
          ],
          wide: [0.08, 0.08],
          full: [0.3, 0.3],
          paints: 'cornflowers',
        },
      ],
      // a very few strays in the plain grass, of the meadow's own colours
      strays: 12,
    },
    paints: FOOTER_PAINTS,
    palettes: FOOTER_PALETTES,
    // the paint takes a film's grain, the soft strokes nearly as much as the sharp (see bloomFragment)
    film: [0.55, 0.45],
    clouds: [],
    flock: [],
    lens: null,
    fit: (w) => clamp(w / 1300, 0.6, 1.2),
    // the near hills' band of light (see NEAR_BANDS), the light along every lit crest (CREST_GLOW), and cornflowers right
    // in front of the lens
    plant: (garden) => {
      const { w, h, hidden, rand, blurAt, dab, ground } = garden
      if (!hidden) {
        return
      }
      const height = nearHeight({ w, h, hidden })
      const half = w / 2
      // the meadow's own scale for its flowers (see `fit`)
      const size = Math.max(0.75, clamp(w / 1300, 0.6, 1.2))
      // The crest at each CSS pixel across, and how high any paint planted there may reach (NEAR_CALM under the lowest of
      // the footer's content over it), worked out once for the thousands of strokes planted along it.
      const columns = Math.ceil(w) + 1
      const crest = new Float32Array(columns)
      const ceiling = new Float32Array(columns).fill(Number.NEGATIVE_INFINITY)
      for (let x = 0; x < columns; x += 1) {
        crest[x] = hidden.bottom - height * nearCrest(x / half - 1)
      }
      for (const box of hidden.keep || []) {
        for (let x = Math.max(0, Math.floor(box.left)); x <= Math.min(columns - 1, Math.ceil(box.right)); x += 1) {
          ceiling[x] = Math.max(ceiling[x], box.bottom + NEAR_CALM)
        }
      }
      const crestAt = (x) => crest[clamp(Math.round(x), 0, columns - 1)]
      // whether paint whose top is at `top` keeps clear of the footer's content from one place across to another
      const clear = (x0, x1, top) => {
        for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(columns - 1, Math.ceil(x1)); x += 1) {
          if (top < ceiling[x]) {
            return false
          }
        }
        return true
      }
      // nor is rooted behind a shrub on the crests, which would be painted over
      const shrubSize = Math.max(0.7, w / 1300)
      const shrubs = [...NEAR_SHRUBS_RIGHT, ...NEAR_SHRUBS_LEFT].map(([across, wide]) => [
        (across + 1) * half,
        wide * shrubSize * 1.3,
      ])
      const offShrubs = (x, r) => shrubs.every(([at, reach]) => Math.abs(x - at) > reach + r)
      const totalOf = (list) => list.reduce((sum, [, often]) => sum + often, 0)
      const pick = (list, u) => {
        let left = u * totalOf(list)
        for (const [each, often] of list) {
          left -= often
          if (left < 0) {
            return each
          }
        }
        return list[list.length - 1][0]
      }
      // A smooth random along the crests, from 0 to 1: which colour a stretch of a band comes in.
      const patch = (x, seed, every = 64) => {
        const u = x / every + seed * 7.3
        const i = Math.floor(u)
        const f = u - i
        const a = hashed(i * 1.37 + seed * 91.1)
        return a + (hashed((i + 1) * 1.37 + seed * 91.1) - a) * f * f * (3 - 2 * f)
      }
      for (const [start, end, deep, cover, palette, seed, lower, cool] of NEAR_BANDS) {
        // only what is on the canvas, as many as cover that share of the band's ground at their mean size
        const from = Math.max(start, -1.02)
        const to = Math.min(end, 1.02)
        const mean = NEAR_BAND_DAB * Math.max(size, 0.95)
        const count = Math.max(
          0,
          Math.round(((to - from) * half * deep * height * cover) / (Math.PI * 0.7 * mean * mean)),
        )
        for (let k = 0; k < count; k += 1) {
          const across = from + (to - from) * rand()
          const down = rand() ** 2
          // Fullest and largest at the crest, where they run together into the band; smaller lower down, where they stand
          // apart on the green, so that its lower edge breaks into specks of gold and not into a row of blobs.
          const r = mean * (0.7 + 0.6 * rand()) * (1.05 - 0.4 * down)
          const thin = rand()
          const tone = rand()
          const which = rand()
          const any = rand()
          const lean = rand()
          const flip = rand()
          const breadth = rand()
          const loaded = rand()
          const stiff = rand()
          const tall = rand()
          const after = rand()
          const x = (across + 1) * half
          // The light is on the left two thirds: towards the right the band thins, and its stretches turn cool.
          if (thin > (1 - 0.75 * smooth(0.15, 0.9, across)) * (0.7 + 0.3 * patch(x, seed + 7, 120))) {
            continue
          }
          const shaded = patch(x, seed + 3, 150) < 0.95 * smooth(0.35, 0.9, across)
          // most take the colour of the stretch they stand in, and the rest any of their palette's; lower down, more of
          // them are of the warmer one
          const lit = lower && which < (down - 0.4) * 1.3 ? lower : palette
          const these = FOOTER_PALETTES[shaded ? cool : lit]
          const name = pick(these, tone < 0.65 ? patch(x, seed) : any)
          const top = crestAt(x)
          const y = top + 2 + deep * height * down
          const near = 0.24 + 0.14 * down
          const stem = (1 + 3 * down) * size * (0.4 + 0.6 * tall)
          const blur = blurAt(near) * 1.25
          // a stroke lying across bows by up to half its width, so its paint can reach half as far again over its root
          if (
            x < -r ||
            x > w + r ||
            !offShrubs(x, r) ||
            !clear(x - r * 1.2, x + r * 1.2, y - stem - r * 1.5 - blur * 0.6 - 1.5)
          ) {
            continue
          }
          const slope = Math.atan2(crestAt(x + 4) - crestAt(x - 4), 8)
          const second = SECOND[name]
          dab({
            x,
            y,
            stem,
            long: r,
            wide: 0.6 + 0.3 * breadth,
            turn: slope + (lean - 0.5) * 0.8 + (flip < 0.5 ? Math.PI : 0),
            blur,
            paints: [name, second[Math.floor(after * second.length)]],
            load: (0.72 + 0.23 * loaded) * (shaded ? 0.8 : 1),
            stiff: 0.3 + 0.3 * stiff,
          })
        }
      }
      // The light along the lit crests (CREST_GLOW): round, soft dabs a little apart, each centred far enough under its
      // crest that none of its soft edge comes over it, and painted over the flowers just under that crest. Round, so
      // that when something goes by and they lean, nothing is seen to turn.
      const step = 10 * size
      for (const [name, from, to, strength, tints, fade, large] of CREST_GLOW) {
        const topAt = name === 'near' ? crestAt : (x) => ground(name, x)
        const before = GLOW_HIDDEN_BY[name] || []
        for (let x = Math.max(0, (from + 1) * half); x <= Math.min(w, (to + 1) * half); x += step) {
          const at = x + (rand() - 0.5) * step
          const top = topAt(at)
          const reach = (9 + 4.5 * rand()) * size * large
          const blur = reach * 0.85
          const tint = tints[Math.floor(rand() * tints.length)]
          const load = (0.34 + 0.16 * rand()) * strength * (fade ? 1 - 0.9 * smooth(fade, 0.7, at / half - 1) : 1)
          // its soft edge comes to a little over the crest at most, and no nearer the footer's content than NEAR_CALM; and
          // where it has faded to nothing, on the right, there is none
          const y = top + reach * 0.95 + blur * 0.5 + 1
          if (
            load < 0.04 ||
            before.some((other) => ground(other, at) < top + reach) ||
            !clear(at - reach * 2, at + reach * 2, y - reach * 1.12 - blur * 0.5 - 1.5)
          ) {
            continue
          }
          dab({
            x: at,
            y,
            stem: 0,
            long: reach,
            wide: 0.95,
            blur,
            paints: tint,
            load,
            stiff: 1,
            lean: 0,
            order: top + 30 + large,
          })
        }
      }
      // Cornflowers right in front of the lens in both front corners, larger and softer than any, cut by the canvas's
      // foot, and clear of the middle, where the chat bar floats.
      const lens = clamp(w / 1232, 0.55, 1)
      for (let k = 0; k < 8; k += 1) {
        const side = k % 2 ? 1 : -1
        const x = half + side * half * (0.55 + 0.47 * rand())
        const long = (14 + 10 * rand()) * lens
        const paint = FOOTER_BOKEH[k % FOOTER_BOKEH.length]
        dab({
          x,
          y: h + long * (0.35 * rand() - 0.25),
          long,
          wide: 0.9,
          turn: rand() * Math.PI,
          blur: long * 0.75,
          paints: paint,
          load: 0.42 + 0.12 * rand(),
          stiff: 0.7,
        })
      }
    },
  }

  /* --- the enterprise composition -------------------------------------------------------------------- */

  /* The hero of /enterprise: a valley among mountains under the calls to action, after a sturdy tree on a knoll in a
     mountain valley. Far ranges in soft greys, blue-grey and warm grey, under a thin band of the hero's sky, receding by
     value, with their crests about the buttons and one peak rising higher well to the left of the words; a nearer range
     in a deeper grey; ridges with a little of the land's green coming down into the valley; and in front the valley's
     slopes in sunlight, gold and ochre, with a little grass on them. On a knoll close by on the right stands one tree,
     seen from a few paces off, looking up into it: painted with the meadow's own brush after an oil of a twisting violet
     trunk, the trunk massive where it flares into roots that spread over the knoll towards us, leaning a little and
     tapering fast as it rises, its bark's strokes drawing together towards the sky; limbs radiating up and out from the
     crotch; and the crown overhead, seen partly from beneath, its clumps dark and cool underneath and lit along their
     upper rims, and all of it swaying a very little in the wind. Very small butterflies sit about its crown and its
     limbs, opening and closing their wings; when the pointer comes onto the tree they are off, and they come back to it
     once it has gone (see the butterflies that perch). It is the hero of its page, as the meadow is of
     the home page: built as soon as it is bound (in the builder's short steps, so the page never waits on it), live
     while on the screen, and in a dark theme the same day. */
  const ENTERPRISE_INKS = {
    ...LAND_INK,
    // The ranges as snow and ice, quiet behind the fields: snow on the peaks and upper slopes, the palest ice-blue
    // under it and the faintest blue-grey on the sides in shade, the nearer range a little deeper and still icy, so
    // they recede by value. On a dark page the snow keeps its light but is softened, so it never glares.
    snow: ['#f6f9fb', '#e4ebf1'],
    haze: ['#e5eef4', '#d5e0e9'],
    steel: ['#ccdae5', '#bccbd8'],
    mist: ['#d9e5ed', '#c9d6e1'],
    stone: ['#bccbd8', '#adbfcf'],
    stoneDeep: ['#a8bacb', '#9bafc2'],
    // The fields in late-afternoon sun: the nearer ridges a living meadow green, the light catching their crests in
    // lime; and the valley's slopes and floor gold and amber where they are lit, running into spring and meadow greens
    // through the grass and the shade.
    ridgeLit: ['#b5dc5c', '#c2e472'],
    ridge: ['#5fae46', '#72bd57'],
    ridgeDeep: ['#3f9145', '#52a356'],
    sunGold: ['#f7d566', '#f9dc7c'],
    gold: ['#f3be3c', '#f6c756'],
    amber: ['#e9a534', '#eeb14b'],
    spring: ['#a3d34c', '#b2de61'],
    meadow: ['#62b343', '#73c155'],
    meadowDeep: ['#419a43', '#53aa53'],
  }

  /* A range's line: the highest of a few peaks, each [across, how high above `base` in rooms, how far it reaches to
     either side], with flanks a little hollowed as a mountain's are and a little unevenness all along, as points close
     enough together that the land's curve through them keeps the summits. */
  const entPeaks = (base, peaks) =>
    Array.from({ length: 129 }, (_, k) => {
      const across = -1.6 + k * 0.025
      let up = 0
      for (const [at, high, wide] of peaks) {
        up = Math.max(up, high * Math.max(0, 1 - Math.abs(across - at) / wide) ** 1.3)
      }
      up += 0.008 * Math.sin(across * 41.3 + base * 7) + 0.005 * Math.sin(across * 97.1 + 2.1)
      return [Math.round(across * 1000) / 1000, Math.round((base - up) * 10000) / 10000]
    })

  /* The sheets, from the furthest, in rooms down from the land's top line, which sits a little above the foot of the
     buttons (the page gives the canvas the depth for that, as the home page does): every crest is about the
     buttons or under them, so the words have the page to themselves. The ranges are measured from the land's crest, so on
     a narrower stage they rise less (the land's `relief`), as they would seen from further off, and the one peak that
     rises higher, far to the left of the words, comes down among the rest on a phone, where the words take the whole
     width. */
  const ENT_PEAK = [
    [-0.9, 0.86, 0.32],
    [-1.2, 0.56, 0.3],
  ]
  const ENT_FAR = entPeaks(0.34, [
    [-1.38, 0.38, 0.3],
    [-0.62, 0.32, 0.26],
    [-0.3, 0.36, 0.3],
    [0.12, 0.34, 0.3],
    [0.46, 0.38, 0.28],
    [0.84, 0.44, 0.32],
    [1.2, 0.4, 0.3],
    [1.52, 0.36, 0.3],
  ])
  const ENT_RANGE = entPeaks(0.48, [
    [-1.12, 0.3, 0.32],
    [-0.52, 0.24, 0.3],
    [0.28, 0.26, 0.3],
    [0.72, 0.3, 0.3],
    [1.32, 0.32, 0.34],
  ])
  const ENT_RIDGES = [
    [-1.6, 0.27],
    [-1.2, 0.25],
    [-0.85, 0.33],
    [-0.5, 0.43],
    [-0.2, 0.49],
    [0.1, 0.51],
    [0.4, 0.45],
    [0.7, 0.37],
    [1.0, 0.31],
    [1.6, 0.31],
  ]
  // the valley's sunlit slopes, down from the left to its floor and on behind the knoll; the grass grows from them on
  const ENT_SLOPES = [
    [-1.6, 0.5],
    [-1.2, 0.52],
    [-0.8, 0.59],
    [-0.4, 0.68],
    [0, 0.745],
    [0.35, 0.73],
    [0.7, 0.67],
    [1.1, 0.63],
    [1.6, 0.61],
  ]
  // the valley's floor in front, on the left and under the words
  const ENT_FRONT = [
    [-1.6, 0.92],
    [-1.0, 0.95],
    [-0.5, 0.99],
    [0, 1.03],
    [0.4, 1.09],
    [0.8, 1.17],
    [1.6, 1.21],
  ]
  // a smooth curve through a sheet's points, as the land draws every guide (the template's curveThrough)
  const entCurve = (points) => (x) => {
    const last = points.length - 1
    if (x <= points[0][0]) {
      return points[0][1]
    }
    if (x >= points[last][0]) {
      return points[last][1]
    }
    let k = 0
    while (points[k + 1][0] < x) {
      k += 1
    }
    const [x0, y0] = points[k]
    const [x1, y1] = points[k + 1]
    const slope = (a, b) => (points[b][1] - points[a][1]) / (points[b][0] - points[a][0])
    const m0 = k > 0 ? slope(k - 1, k + 1) : slope(k, k + 1)
    const m1 = k + 1 < last ? slope(k, k + 2) : slope(k, k + 1)
    const span = x1 - x0
    const f = (x - x0) / span
    return (
      (2 * f ** 3 - 3 * f ** 2 + 1) * y0 +
      (f ** 3 - 2 * f ** 2 + f) * span * m0 +
      (-2 * f ** 3 + 3 * f ** 2) * y1 +
      (f ** 3 - f ** 2) * span * m1
    )
  }
  const entFront = entCurve(ENT_FRONT)
  /* The knoll the tree stands on, close to the eye, on the right: a broad swell, highest under the tree. The tree is
     seen from a little above the ground, so its roots come towards us down the knoll's face, and they need room there
     before the canvas's foot, where the picture fades into the page. On a wide stage, where the tree is large, the knoll
     rises higher to give it that room; on a narrow one, where the tree stands small under the words, it stays low.
     `peak` is how far down its top is, in rooms, on the narrowest stage and the widest.
     It rolls: its crest starts just under the valley floor's, in front of it, and lifts away from it as smoothly as it
     can (a smootherstep, which bends nowhere suddenly), so the two never meet at a corner and no run of it is straight,
     and its bands, which follow its crest, roll with it. Drawn as many points as that needs to stay smooth. */
  const ENT_KNOLL_PEAK = [0.9, 0.7]
  const ENT_KNOLL_RISE = [-0.15, 0.62]
  const entKnoll = (peak) =>
    Array.from({ length: 49 }, (_, i) => {
      const across = -0.3 + (i * 1.9) / 48
      const t = clamp((across - ENT_KNOLL_RISE[0]) / (ENT_KNOLL_RISE[1] - ENT_KNOLL_RISE[0]), 0, 1)
      const rise = t * t * t * (t * (t * 6 - 15) + 10)
      // its top, and on to the right a little lower again
      const ridge = peak + 0.1 * smooth(0.95, 1.6, across)
      const under = entFront(across) + 0.015
      return [Math.round(across * 10000) / 10000, Math.round((under + (ridge - under) * rise) * 10000) / 10000]
    })
  const ENT_KNOLL = ({ w }) =>
    entKnoll(ENT_KNOLL_PEAK[0] + (ENT_KNOLL_PEAK[1] - ENT_KNOLL_PEAK[0]) * smooth(760, 1160, w))
  /* The one high peak, as the land's crest measures it, so that a narrower stage lowers it; and the band of sky, a
     little over the highest of it and the far range, smoothed, measured the same way. */
  const ENT_HIGH = entPeaks(0.4, ENT_PEAK)
  const ENT_SKY = ENT_FAR.map(([across], k) => {
    let sum = 0
    let many = 0
    for (let j = Math.max(0, k - 4); j <= Math.min(ENT_FAR.length - 1, k + 4); j += 1) {
      sum += Math.min(ENT_FAR[j][1], ENT_HIGH[j][1])
      many += 1
    }
    return [across, Math.round((sum / many - 0.17) * 10000) / 10000]
  })

  /* The tree in three dimensions, in metres (see its planting): its trunk, from its foot to where it splits, as the
     four places of a curve, how thick it is at its foot and at the fork, and how far it flares out into its roots; its
     limbs, each [which way round it goes, in degrees, 0 to our right and 90 away from us, how far out, how far up, how
     thick at the fork, how much lower than the fork it leaves the trunk]; its roots, each [which way, how far out, how
     thick, how far it bends on its way, in degrees]; and the eye: where it is, what it looks at, and how far the frame
     is turned. `shares` are where across the picture its foot may stand, and `footShare` how wide the foot of its trunk
     may be, as shares of the picture. */
  const ENT_TREE = {
    trunk: [
      [-0.03, -0.45, -0.02],
      [0.21, 1.1, -0.12],
      [0.51, 2.1, -0.25],
      [0.86, 2.9, -0.39],
    ],
    foot: 0.74,
    waist: 0.5,
    flare: 0.75,
    limbs: [
      [205, 2.2, 3.2, 0.34, 0.35],
      [158, 2.44, 4.1, 0.33, 0.1],
      [112, 4.2, 4.9, 0.36, 0],
      [68, 5, 4.4, 0.34, 0.15],
      [22, 5.4, 3.6, 0.33, 0.05],
      [-28, 4.6, 3.2, 0.3, 0.3],
      [-78, 3.4, 3.7, 0.28, 0.2],
    ],
    roots: [
      [-108, 2.4, 0.33, -10],
      [-62, 2.5, 0.34, 12],
      [-12, 1.8, 0.3, -8],
      [56, 1.5, 0.27, 8],
      [110, 1.9, 0.29, 14],
      [158, 2.3, 0.31, -10],
    ],
    // A little over a metre up, a few paces off to the left of the tree and in front of it, looking up into it: low
    // enough that the tree towers and leans over us, with its trunk and limbs drawing together towards the sky, and high
    // enough that the ground round its foot is seen going away, the roots lying on it in depth, as the land round it is
    // seen. From a few centimetres up, as it was, the ground there was seen edge on, and every root ended in one line.
    eye: [-6.66, 1.2, -2.99],
    at: [3.38, 7.74, -3.66],
    roll: 0.04,
    // how much of the crown may run off the right, and how much of it is in the picture at least, as shares of it
    offRight: 0.55,
    inFrame: 0.8,
    shares: { wide: [0.78, 0.82, 0.86], phone: [0.74, 0.8, 0.86] },
    footShare: 0.32,
    // how far above the canvas's foot the roots end at least, as a share of its height
    footRoom: 0.12,
  }

  /* The drift of flowers at the tree's foot, in the meadow's own colours: whites, coral and peach and a little gold, each
     [its ink, the ink it shades into towards its heart, how many petals, how many of them in the drift, as a weight]. */
  const ENT_FOOT_FLOWERS = [
    ['white', 'cream', 11, 3],
    ['cream', 'butter', 10, 1],
    ['coral', 'salmon', 6, 2.4],
    ['peach', 'salmon', 6, 2.6],
    ['salmon', 'coral', 5, 1.2],
    ['butter', 'gold', 5, 0.8],
    ['gold', 'butter', 5, 0.3],
  ]

  const ENTERPRISE = {
    ...HERO,
    // No opening: the first picture is the finished scene, every line in, the tree whole and the butterflies sitting
    // in it, and from there it only lives (the page fades the stage in on its first picture).
    intro: false,
    // Built from the moment it is bound, by the builder, a few milliseconds at a time, and at once in tasks of its own as
    // it is on the screen when the page opens; drawn live while on the screen, as the hero is.
    wake: 'idle',
    near: '100% 0px',
    words: '.ent-copy',
    lines: { ...LINES, veil: [96, 70] },
    inks: ENTERPRISE_INKS,
    // the crown stands against the page as well as the land
    onPage: true,
    // the flowers at the tree's foot: daisies and buttercups, with a little lilac
    palettes: {
      ...PALETTES,
      roots: [
        ['white', 1.2],
        ['cream', 0.9],
        ['butter', 1.8],
        ['gold', 0.6],
        ['lilac', 0.9],
        ['peach', 0.4],
      ],
    },
    // The glass along the sides, its colours split less, and none along the top: the hero's top runs under the site's
    // header, so it is no edge of the screen, and glass there only smeared the crown, and the butterflies sitting on it,
    // into rainbows.
    lens: { ...LENS, split: 0.015, top: false },
    land: {
      ...HERO.land,
      profile: ENT_SLOPES,
      crest: 0,
      // how much of the ranges' rise there is for the stage's width: all of it from 1232 pixels, a third on a phone's
      relief: [0.18, 1],
      sheets: [
        // a thin band of the hero's sky behind the ranges and the high peak, its pale blues only
        {
          name: 'sky',
          top: { crest: ENT_SKY },
          foot: [
            [-1.6, 0.36],
            [1.6, 0.36],
          ],
          paint: [
            [0, 'pale', 0],
            [0.2, 'pale', 0.3],
            [0.55, 'sky', 0.5],
            [1, 'pale', 0.55],
          ],
          fill: 0.5,
          under: 0.12,
          flow: 1,
          breath: 1,
        },
        {
          name: 'far peak',
          opaque: true,
          top: { crest: ENT_HIGH },
          foot: [
            [-1.6, 0.42],
            [1.6, 0.42],
          ],
          paint: [
            [0, 'snow', 0],
            [0.02, 'snow', 0.85],
            [0.08, 'haze', 1],
            [0.3, 'steel', 1],
            [1, 'mist', 1],
          ],
          lean: 0.35,
          fill: 0.7,
          under: 0.55,
          patch: 0.22,
          flow: 0.35,
          breath: 0.3,
        },
        {
          name: 'far range',
          opaque: true,
          top: { crest: ENT_FAR },
          foot: [
            [-1.6, 0.56],
            [1.6, 0.56],
          ],
          paint: [
            [0, 'snow', 0],
            [0.03, 'haze', 0.85],
            [0.12, 'steel', 1],
            [0.45, 'mist', 1],
            [1, 'mist', 1],
          ],
          lean: 0.35,
          fill: 0.7,
          under: 0.55,
          patch: 0.22,
          flow: 0.35,
          breath: 0.3,
        },
        {
          name: 'range',
          opaque: true,
          top: { crest: ENT_RANGE },
          foot: [
            [-1.6, 0.66],
            [1.6, 0.66],
          ],
          paint: [
            [0, 'haze', 0],
            [0.04, 'mist', 0.9],
            [0.18, 'stone', 1],
            [0.6, 'stoneDeep', 1],
            [1, 'stone', 1],
          ],
          lean: 0.4,
          fill: 0.72,
          under: 0.6,
          patch: 0.28,
          flow: 0.35,
          breath: 0.3,
        },
        {
          name: 'ridges',
          opaque: true,
          top: ENT_RIDGES,
          foot: [
            [-1.6, 0.86],
            [1.6, 0.86],
          ],
          paint: [
            [0, 'ridgeLit', 0],
            [0.05, 'ridgeLit', 0.9],
            [0.16, 'ridge', 1],
            [0.55, 'ridgeDeep', 1],
            [1, 'ridge', 1],
          ],
          lean: 0.45,
          fill: 0.74,
          under: 0.66,
          patch: 0.3,
          flow: 0.4,
          breath: 0.3,
        },
        {
          name: 'slopes',
          opaque: true,
          top: ENT_SLOPES,
          foot: [
            [-1.6, 1.12],
            [1.6, 1.12],
          ],
          paint: [
            [0, 'sunGold', 0],
            [0.04, 'sunGold', 0.9],
            [0.12, 'gold', 1],
            [0.3, 'amber', 1],
            [0.5, 'spring', 1],
            [0.75, 'meadow', 1],
            [1, 'meadowDeep', 1],
          ],
          lean: 0.5,
          fill: 0.72,
          under: 0.62,
          patch: 0.32,
          flow: 0.5,
          breath: 0.6,
          sheen: 0.6,
        },
        {
          name: 'knoll',
          opaque: true,
          top: ENT_KNOLL,
          foot: [
            [-0.3, 1.3],
            [1.6, 1.3],
          ],
          paint: [
            [0, 'sunGold', 0],
            [0.03, 'sunGold', 0.9],
            [0.1, 'gold', 1],
            [0.3, 'amber', 1],
            [0.55, 'spring', 1],
            [0.8, 'meadow', 1],
            [1, 'meadowDeep', 1],
          ],
          lean: 0.55,
          fill: 0.72,
          under: 0.62,
          patch: 0.3,
          flow: 0.5,
          breath: 0.5,
          sheen: 0.6,
        },
        {
          name: 'meadow',
          opaque: true,
          laid: true,
          top: ENT_FRONT,
          foot: [
            [-1.6, 1.26],
            [1.6, 1.26],
          ],
          paint: [
            [0, 'gold', 0],
            [0.06, 'gold', 0.85],
            [0.28, 'amber', 1],
            [0.52, 'spring', 0.95],
            [0.76, 'meadow', 0.8],
            [0.9, 'sunGold', 0.45],
            [1, 'sunGold', 0],
          ],
          fill: 0.68,
          under: 0.5,
          patch: 0.25,
          flow: 0.7,
          breath: 1,
          sheen: 1,
        },
      ],
      foot: LAND_FOOT,
      least: 110,
    },
    // a little grass on the sunlit slopes, gold and olive, and nothing going through it but the pointer
    grass: {
      ...GRASS,
      tufts: 0.05,
      lane: 0,
      singles: 0.16,
      tall: [6, 30],
      inks: ['lime', 'meadow', 'spring', 'gold', 'sunGold'],
    },
    passer: null,
    // no flowers at all
    flowers: { ...FLOWERS, drifts: [], strays: 0 },
    // The tree's paints: a violet-brown bark, lit and in its own shade, and a crown of deep teal greens with lighter
    // flecks and the cool dark of its undersides, as [on a light page, on a dark page].
    paints: {
      ...PAINTS,
      bark: ['#54406d', '#62507b'],
      barkDeep: ['#362a4c', '#45385b'],
      barkLit: ['#8b77ae', '#9884b9'],
      barkWarm: ['#73546c', '#80627a'],
      crownUnder: ['#1d3c46', '#1a3241'],
      crownDeep: ['#21504b', '#204c49'],
      crown: ['#215853', '#2b6560'],
      crownMid: ['#2f6f63', '#3b7c70'],
      crownLit: ['#5c9a80', '#6aa88e'],
      fleck: ['#a5cd96', '#b2d6a4'],
      sunFleck: ['#d6db8a', '#dee39c'],
    },
    clouds: [],
    flock: Array.from({ length: 15 }, (_, k) => ({
      size: 10 + 3.5 * ((k * 0.7549 + 0.31) % 1),
      seed: Math.round(((k * 0.618 + 0.13) % 1) * 100) / 100,
      pastel: k % 3,
      wing: WING_NAMES[(k * 2) % 3],
      // two keep about the crown
      flit: k === 3 || k === 10,
    })),
    perch: {
      // how long one sits before going over to another leaf, and how far it goes at most, at a fit of 1
      stay: [5, 14],
      reach: 110,
      // how long the two about the crown go round it before they land for a while
      flit: [3, 6],
      // their speeds, in CSS pixels a second: hopping, coming back, and away
      hop: 140,
      come: 190,
      flee: 340,
      // how long the pointer has to be off the tree before they come back, and how far apart they come
      back: 2.6,
      every: [0.45, 1.1],
      // with no opening, every one with a seat is sitting in the tree from the first picture
      appear: 0,
      arrive: 0,
      first: 0,
      // wingbeats a second in the air, and the wings at rest, from shut to open, over a slow breath of seconds
      beat: 8,
      wings: [1.38, 0.3],
      rest: [3.5, 6.5],
      // sitting: which way it faces, how far its head is turned from us, and how far it is rolled to show its wings
      sit: [0.12, -0.35, 1.05],
      // how far its body sits above the leaf, in sizes; how far a flight wanders across its way, in CSS pixels
      lift: 0.35,
      flutter: 7,
      // how far round the tree the pointer parts no grass
      clear: 26,
    },
    fit: (w, h) => clamp(Math.min(w / 1300, (h + 100) / 760), 0.72, 1.2),
    plant: (garden) => {
      const { w, h, rand, words } = garden
      // A smooth jitter of its own, so the tree is the same at every size.
      const jitter = (n) => hashed(n * 17.13 + 3.1) - 0.5

      /* ---- the tree, in three dimensions ----
         In metres, its foot at the origin, y up, x to the right as we stand and z away from us. A massive trunk, short
         and flaring into roots that grip the knoll, splits low into great limbs that sweep up and out, each branching
         twice towards its end, and the crown is a ceiling of leafy clumps at their ends and between them. It is seen
         as by someone who has come up to it and looks up into it: from in front of it and to the left, the eye a little
         over a metre up, looking up steeply, so that the trunk leans across the picture and everything converges towards
         a point high above, the limbs fan out overhead like the ribs of an umbrella, and the crown is seen from
         underneath, while the ground at its foot is seen going away, as the land round it is. */
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
      const times = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
      const unit = (a) => {
        const l = Math.hypot(a[0], a[1], a[2]) || 1
        return [a[0] / l, a[1] / l, a[2] / l]
      }
      // a cubic through four places: where it is at t, which way it goes there, and how long it is
      const along = (p, t) => {
        const v = 1 - t
        const k = [v * v * v, 3 * v * v * t, 3 * v * t * t, t * t * t]
        return [0, 1, 2].map((i) => p[0][i] * k[0] + p[1][i] * k[1] + p[2][i] * k[2] + p[3][i] * k[3])
      }
      const wayOf = (p, t) => {
        const v = 1 - t
        const k = [-3 * v * v, 3 * v * v - 6 * v * t, 6 * v * t - 3 * t * t, 3 * t * t]
        return unit([0, 1, 2].map((i) => p[0][i] * k[0] + p[1][i] * k[1] + p[2][i] * k[2] + p[3][i] * k[3]))
      }
      const lengthOf = (p) => {
        let l = 0
        let q = along(p, 0)
        for (let i = 1; i <= 16; i += 1) {
          const r = along(p, i / 16)
          l += Math.hypot(...sub(r, q))
          q = r
        }
        return l
      }
      const deg = Math.PI / 180
      const flat = (a) => [Math.cos(a * deg), 0, Math.sin(a * deg)]

      // the trunk, from its foot to where it splits, leaning to the right and a little towards us: the lean is the
      // tree's own, so the ground it stands on stays level in the picture
      const T = ENT_TREE
      const TRUNK = T.trunk
      const fork = TRUNK[3]
      const trunkR = (t) => (T.foot - (T.foot - T.waist) * t) * (1 + T.flare * (1 - smooth(0, 0.22, t)))
      // the limbs, sweeping up and out from the fork, each starting a little round the trunk and some lower than others
      const limbs = T.limbs.map(([a, reach, rise, r0, drop], k) => {
        const h = flat(a)
        const start = add(add(fork, times(h, T.waist * 0.45)), [0, -drop, 0])
        const p = [
          start,
          add(start, add(times(h, reach * 0.14), [0, rise * 0.42, 0])),
          add(start, add(times(h, reach * 0.62), [0, rise * 0.94, 0])),
          add(start, add(times(h, reach), [0, rise * 0.84, 0])),
        ]
        return { k, a, p, r0, r1: r0 * 0.3 }
      })
      const limbR = (limb) => (t) => limb.r0 + (limb.r1 - limb.r0) * t
      // two branches off each, towards its end, turned to either side of it
      const branches = []
      limbs.forEach((limb) => {
        ;[
          [0.56, -1],
          [0.8, 1],
        ].forEach(([t, side], q) => {
          const n = limb.k * 10 + q
          const start = along(limb.p, t)
          const a = limb.a + side * (34 + 10 * hashed(n * 1.7))
          const h = flat(a)
          const reach = 1.5 + 0.9 * hashed(n * 2.3)
          const rise = 1.0 + 0.8 * hashed(n * 3.1)
          const p = [
            start,
            add(start, add(times(h, reach * 0.2), [0, rise * 0.5, 0])),
            add(start, add(times(h, reach * 0.7), [0, rise * 0.95, 0])),
            add(start, add(times(h, reach), [0, rise * 0.8, 0])),
          ]
          const r0 = limbR(limb)(t) * 0.58
          branches.push({ k: n, a, p, r0, r1: Math.max(0.035, r0 * 0.3) })
        })
      })
      // The roots: each starts deep in the trunk and high on it, at a height of its own, and runs down it steeply, so
      // that it comes out of the flare as a ridge that curves out over the ground; then it runs on along the ground, half
      // in it and thinning, bending a little on its way, and goes into it at its end, as old roots do. Left as straight
      // tubes running down into the ground, they stood round the trunk like the poles of a tent, and starting from the
      // trunk's side they stood on the flare as a collar, their tops ringing the trunk in one line.
      const flareR = trunkR(0.08)
      const roots = T.roots.map(([a, out, r0, bend = 0], k) => {
        const high = 1.2 + 0.4 * (hashed(k * 4.7 + 0.3) - 0.5)
        const p = [
          add(times(flat(a), flareR * 0.25), [0, high, 0]),
          add(times(flat(a), flareR * 0.75), [0, 0.35, 0]),
          add(times(flat(a + bend * 0.5), flareR + (out - flareR) * 0.42), [0, 0.03, 0]),
          add(times(flat(a + bend), out), [0, -0.14, 0]),
        ]
        return { k, p, r0, r1: r0 * 0.3 }
      })
      const rootR = (root) => (t) => root.r0 + (root.r1 - root.r0) * t ** 0.7
      // Whether a place is inside the trunk, by how far it is from the trunk's middle at its height: a root's bark is
      // only painted where the root has come out of the trunk, so the two meet in a ridge rather than a seam.
      const axis = Array.from({ length: 49 }, (_, i) => [...along(TRUNK, i / 48), trunkR(i / 48)])
      const inTrunk = (q, margin) => {
        let i = 0
        while (i < axis.length - 2 && axis[i + 1][1] < q[1]) {
          i += 1
        }
        const [x0, y0, z0, r0] = axis[i]
        const [x1, y1, z1, r1] = axis[i + 1]
        const f = clamp((q[1] - y0) / (y1 - y0 || 1), 0, 1)
        return Math.hypot(q[0] - (x0 + (x1 - x0) * f), q[2] - (z0 + (z1 - z0) * f)) < r0 + (r1 - r0) * f - margin
      }
      // The crown: a clump at the end of every branch and every limb, and one between each limb and the next, and one
      // overhead, each [middle, half its width, half its height].
      const clumps = []
      for (const b of branches) {
        const e = b.p[3]
        clumps.push({
          c: add(e, [0, 0.45, 0]),
          rx: 1.25 + 0.35 * hashed(b.k * 1.9),
          ry: 0.85 + 0.2 * hashed(b.k * 2.7),
        })
      }
      for (const limb of limbs) {
        const e = limb.p[3]
        clumps.push({
          c: add(e, [0, 0.55, 0]),
          rx: 1.5 + 0.3 * hashed(limb.k * 3.3),
          ry: 1.0 + 0.2 * hashed(limb.k * 4.1),
        })
      }
      const byAngle = [...limbs].sort((p, q) => p.a - q.a)
      byAngle.forEach((limb, i) => {
        const next = byAngle[(i + 1) % byAngle.length]
        if (Math.abs(((next.a - limb.a + 540) % 360) - 180) < 60) {
          return
        }
        const m = times(add(limb.p[3], next.p[3]), 0.5)
        clumps.push({ c: add(m, [0, 1.1, 0]), rx: 1.8, ry: 1.15 })
      })
      clumps.push({ c: add(fork, [0.3, 6.2, 0.4]), rx: 2.3, ry: 1.3 })

      /* ---- the eye ---- */
      const eye3 = T.eye
      const look = unit(sub(T.at, eye3))
      let right = unit(cross([0, 1, 0], look))
      let upward = cross(look, right)
      // The frame turned only a very little. Turned further, it leaned the tree across the picture, but it tilted the
      // ground under the roots with it, against the level knoll they stand on, and the tree looked to be falling.
      const roll = T.roll
      ;[right, upward] = [
        add(times(right, Math.cos(roll)), times(upward, Math.sin(roll))),
        add(times(right, -Math.sin(roll)), times(upward, Math.cos(roll))),
      ]
      // where a place is seen, in the eye's own terms (a unit is the width of the view one metre off), and how far off
      const seen = (q) => {
        const d = sub(q, eye3)
        const z = dot(d, look)
        if (z < 0.4) {
          return null
        }
        return { u: dot(d, right) / z, v: -dot(d, upward) / z, z }
      }
      const foot = seen([0, 0, 0])

      /* ---- where it stands and how large it is ----
         Its foot on the knoll, near the right; as large as it can be with nothing of it over the words or the buttons
         (nothing over their width above their foot), the crown allowed to run off the top and the right of the picture
         only a little, the foot of the trunk no wider than a share of the picture, and its roots clear of the foot of
         the canvas, where the picture fades into the page. */
      const margin = 30
      const wordsLeft = words.x - words.a - margin
      const wordsRight = words.x + words.a + margin
      const wordsFoot = words.y + words.b + margin
      // the outline to keep clear: every clump, and points along every limb, as [u, v, radius in units, a clump or not]
      const outline = []
      for (const c of clumps) {
        const q = seen(c.c)
        if (q) {
          outline.push([q.u, q.v, Math.max(c.rx, c.ry) / q.z, true])
        }
      }
      for (const b of [...limbs, ...branches]) {
        for (let t = 0; t <= 1; t += 0.25) {
          const q = seen(along(b.p, t))
          if (q) {
            outline.push([q.u, q.v, (b.r0 + (b.r1 - b.r0) * t) / q.z, false])
          }
        }
      }
      // where each root goes under the ground for good, as the painting cuts it (see onGround)
      const rootEnds = roots
        .map((root) => {
          let t = 1
          while (t > 0 && along(root.p, t)[1] + rootR(root)(t) < 0.012) {
            t -= 0.02
          }
          return seen(along(root.p, t))
        })
        .filter(Boolean)
      const trunkFoot = trunkR(0) / foot.z
      let S = 1
      let bx = 0
      let by = 0
      const toCanvas = (q) => [bx + S * (q.u - foot.u), by + S * (q.v - foot.v)]
      const fits = () => {
        let left = Number.POSITIVE_INFINITY
        let right2 = Number.NEGATIVE_INFINITY
        // how much of the crown is in the picture, its clumps as squares, by area
        let crown = 0
        let shown = 0
        for (const [u, v, r, clump] of outline) {
          const x = bx + S * (u - foot.u)
          const y = by + S * (v - foot.v)
          const R = r * S
          if (x + R > wordsLeft && x - R < wordsRight && y - R < wordsFoot) {
            return false
          }
          left = Math.min(left, x - R)
          right2 = Math.max(right2, x + R)
          if (clump) {
            crown += 4 * R * R
            shown +=
              Math.max(0, Math.min(w, x + R) - Math.max(0, x - R)) *
              Math.max(0, Math.min(h, y + R) - Math.max(0, y - R))
          }
        }
        // no root's end in the fade at the canvas's foot
        for (const q of rootEnds) {
          if (by + S * (q.v - foot.v) > h * (1 - T.footRoom)) {
            return false
          }
        }
        // not most of the crown off the right, most of it in the picture, and the foot of the trunk not too wide
        return (
          right2 - w < (right2 - left) * T.offRight && shown > crown * T.inFrame && trunkFoot * S * 2 < w * T.footShare
        )
      }
      // Seen from a little above the ground, the roots that go away from us end higher in the picture than the foot of
      // the trunk: it stands that much in front of the knoll's crest, so that all of them lie on the knoll and none runs
      // over its top onto the land beyond.
      const behind = Math.max(0, ...rootEnds.map((q) => foot.v - q.v))
      let best = null
      for (const share of w < 700 ? T.shares.phone : T.shares.wide) {
        bx = w * share
        const crest = garden.ground('knoll', bx) + 6
        for (S = 2400 * Math.max(0.5, w / 1232); S >= 100; S -= 10) {
          by = crest + behind * S
          if (fits()) {
            if (!best || S > best.S + 5) {
              best = { S, bx, by }
            }
            break
          }
        }
      }
      // (and should nothing fit, a small tree low on the right, which at least keeps off the words)
      ;({ S, bx, by } = best || { S: 100, bx: w * 0.86, by: garden.ground('knoll', w * 0.86) + 6 })
      const project = (q3) => {
        const q = seen(q3)
        if (!q) {
          return null
        }
        const [x, y] = toCanvas(q)
        return { x, y, z: q.z, px: S / q.z }
      }
      const k = clamp(w / 1232, 0.6, 1.2)

      /* ---- painting it ----
         Every stroke is kept with how far it is from the eye, and they are painted from the farthest in, so that what is
         nearer covers what is behind it; all of them at the depth of the tree's foot, so the grass in front of that is
         painted over the roots. */
      const marks = []
      const L = unit([-0.55, 0.78, -0.3])
      const BARK = ['barkDeep', 'bark', 'barkWarm', 'barkLit']
      const shade = (ramp, t, n) => {
        const at = clamp(t, 0, 0.999) * (ramp.length - 1)
        const i = Math.floor(at)
        const j = Math.min(ramp.length - 1, i + 1)
        return at - i > 0.5 + jitter(n + 13) * 0.5 ? [ramp[j], ramp[i]] : [ramp[i], ramp[j]]
      }
      // A stroke between two places, cut off where it would go under the ground, so that the tree meets the ground in a
      // clean line rather than fraying below it; and how it lies on the canvas.
      const ground = 0.012
      const onGround = (a3, b3) => {
        if (a3[1] < ground && b3[1] < ground) {
          return null
        }
        let p3 = a3
        let q3 = b3
        if (a3[1] < ground || b3[1] < ground) {
          const cut = add(a3, times(sub(b3, a3), (ground - a3[1]) / (b3[1] - a3[1])))
          if (a3[1] < ground) {
            p3 = cut
          } else {
            q3 = cut
          }
        }
        const a = project(p3)
        const b = project(q3)
        const m = project(times(add(p3, q3), 0.5))
        if (!a || !b || !m) {
          return null
        }
        return { a, b, m, long: Math.hypot(b.x - a.x, b.y - a.y) / 2 }
      }
      // A bough, as strokes of bark laid along it round the side that faces the eye, turned a little round it as bark
      // spirals, lit on the side towards the sun and dark towards its edges and underneath, as a round thing is.
      // (`fromTrunk` for one that comes out of the trunk, `coatRows` for more coats than rows of bark)
      const bough = (
        id,
        p,
        rAt,
        { twist = 0, spiral = 0.16, rowPx = 15, colPx = 6.5, fromTrunk = false, coatRows = 1 } = {},
      ) => {
        const len = lengthOf(p)
        // its length on the canvas, so that its strokes are about the same size there however near it is
        let lenPx = 0
        let prev = project(along(p, 0))
        for (let i = 1; i <= 12; i += 1) {
          const q = project(along(p, i / 12))
          if (q && prev) {
            lenPx += Math.hypot(q.x - prev.x, q.y - prev.y)
          }
          prev = q
        }
        const rows = Math.max(2, Math.round(lenPx / rowPx))
        const onCanvas = (m, pad) => m.x > -pad && m.x < w + pad && m.y > -pad && m.y < h + pad
        // First a soft coat in the bark's middle tone, a little wider than the bough is on the canvas, so nothing shows
        // through, and the coats of a root and of the trunk it leaves overlap where they meet. An upright bough's coat
        // the ground cuts across; one lying half in the ground has its coat over the part of it that is out of the ground
        // only. Where a bough swells quickly, as the trunk does into its flare, it has more of them, each as wide as the
        // bough is where it lies, so the coat neither stands out beside it nor leaves its sides bare.
        const coat = (n, c0, tan, r, reach) => {
          const lying = 1 - Math.abs(tan[1])
          const bottom = Math.max(ground, c0[1] - r)
          const above = c0[1] + r - bottom
          if (above < 0.04) {
            return
          }
          const c = [c0[0], c0[1] + lying * (bottom + above / 2 - c0[1]), c0[2]]
          const half = r + lying * (above / 2 - r)
          // (an upright one's middle above the ground only)
          if (c[1] < 0.03) {
            return
          }
          const cut = onGround(sub(c, times(tan, reach)), add(c, times(tan, reach)))
          if (!cut || !onCanvas(cut.m, half * cut.m.px + 30)) {
            return
          }
          const { a, b, m, long } = cut
          if (long < 0.4) {
            return
          }
          marks.push({
            z: m.z + r * 1.05,
            n,
            leaf: false,
            x: m.x,
            y: m.y,
            long,
            wide: clamp((half * m.px * 1.05) / long, 0.1, 4),
            turn: Math.atan2(b.y - a.y, b.x - a.x),
            paints: ['barkDeep', 'bark'],
            kind: 0.25,
            blur: 1,
          })
        }
        const coats = rows * coatRows
        for (let i = 0; i < coats; i += 1) {
          const t = (i + 0.5) / coats
          // (as wide as the bough is at its narrowest along the stroke, so that it never stands out beside it)
          const r = Math.min(rAt(t), rAt(Math.max(0, t - 0.7 / coats)), rAt(Math.min(1, t + 0.7 / coats)))
          coat(id * 100000 + 90000 + i, along(p, t), wayOf(p, t), r, (len / coats) * 0.7)
        }
        // and two more, a little wider, where it comes out of what it grows from, so the two coats overlap in the crotch
        if (fromTrunk) {
          for (const t of [0.2, 0.3]) {
            coat(id * 100000 + 99000 + t * 100, along(p, t), wayOf(p, t), rAt(t) * 1.15, len * 0.08)
          }
        }
        for (let i = 0; i < rows; i += 1) {
          const t = (i + 0.5 + jitter(id * 977 + i) * 0.3) / rows
          const c = along(p, t)
          const tan = wayOf(p, t)
          const ref = Math.abs(tan[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
          const nA = unit(cross(tan, ref))
          const nB = cross(tan, nA)
          const r = rAt(t)
          const mid = project(c)
          if (!mid || !onCanvas(mid, r * mid.px + 30)) {
            continue
          }
          // Towards a thin end its strokes are shorter and narrower and lie along it, so that a root or a branch tapers
          // to its end, rather than fanning out like the tip of a brush.
          const thin = clamp((r * mid.px) / 10, 0.2, 1)
          const cols = Math.max(5, Math.round((2 * Math.PI * r * mid.px) / colPx))
          for (let j = 0; j < cols; j += 1) {
            const n = id * 100000 + i * 211 + j
            const phi = (2 * Math.PI * (j + 0.5 + jitter(n) * 0.4)) / cols + twist * t
            const normal = add(times(nA, Math.cos(phi)), times(nB, Math.sin(phi)))
            const at = add(c, times(normal, r))
            const facing = dot(normal, unit(sub(eye3, at)))
            // nothing under the ground, and of a root nothing still inside the trunk; and towards a thin end only the
            // strokes that face the eye, so the end narrows to a point
            if (facing < 0.03 + 0.45 * (1 - thin) || at[1] < 0.02 || (fromTrunk && inTrunk(at, 0.03))) {
              continue
            }
            const dir = unit(add(tan, times(cross(normal, tan), spiral * thin * thin)))
            const reach = (len / rows) * 0.7 * (0.45 + 0.55 * thin)
            const cut = onGround(sub(at, times(dir, reach)), add(at, times(dir, reach)))
            if (!cut) {
              continue
            }
            const { a, b, m, long } = cut
            // half its breadth: a share of the way round, foreshortened towards the edge
            const breadth = ((Math.PI * r) / cols) * 1.15 * m.px * (0.4 + 0.6 * Math.sqrt(facing))
            if (long < 0.4) {
              continue
            }
            const lit = dot(normal, L)
            const edge = 1 - smooth(0.05, 0.45, facing)
            const tone = 0.42 + 0.42 * lit - 0.3 * edge + jitter(n + 3) * 0.12
            marks.push({
              z: m.z,
              n,
              leaf: false,
              x: m.x,
              y: m.y,
              long,
              wide: clamp((breadth * (0.6 + 0.4 * thin)) / long, 0.1, 1.1),
              turn: Math.atan2(b.y - a.y, b.x - a.x) + (j % 2 ? Math.PI : 0),
              paints: shade(BARK, tone, n),
            })
          }
        }
      }
      bough(1, TRUNK, trunkR, { twist: 1.1, spiral: 0.2, rowPx: 26, colPx: 5.6, coatRows: 2 })
      roots.forEach((root) => bough(20 + root.k, root.p, rootR(root), { rowPx: 20, colPx: 5.6, fromTrunk: true }))
      limbs.forEach((limb) => bough(40 + limb.k, limb.p, limbR(limb), { twist: 0.5, rowPx: 20, colPx: 5.4 }))
      branches.forEach((b) => bough(100 + b.k, b.p, (t) => b.r0 + (b.r1 - b.r0) * t, { rowPx: 12, colPx: 5.5 }))

      // The clumps, seen from underneath: each its outline on the canvas, an oval round the projected ellipsoid.
      const placed = clumps
        .map((c, j) => {
          const m = project(c.c)
          if (!m) {
            return null
          }
          let x0 = Number.POSITIVE_INFINITY
          let x1 = Number.NEGATIVE_INFINITY
          let y0 = Number.POSITIVE_INFINITY
          let y1 = Number.NEGATIVE_INFINITY
          for (const d of [
            [c.rx, 0, 0],
            [-c.rx, 0, 0],
            [0, c.ry, 0],
            [0, -c.ry, 0],
            [0, 0, c.rx],
            [0, 0, -c.rx],
          ]) {
            const q = project(add(c.c, d))
            if (q) {
              x0 = Math.min(x0, q.x)
              x1 = Math.max(x1, q.x)
              y0 = Math.min(y0, q.y)
              y1 = Math.max(y1, q.y)
            }
          }
          return { j, x: m.x, y: m.y, a: (x1 - x0) / 2, b: (y1 - y0) / 2, z: m.z, px: m.px }
        })
        .filter(Boolean)
      const nearer = (x, y, me, within = 0.62) =>
        placed.some((o) => o.z < me.z && ((x - o.x) / o.a) ** 2 + ((y - o.y) / o.b) ** 2 < within)
      const top = Math.min(...placed.map((o) => o.y - o.b))
      const low = Math.max(...placed.map((o) => o.y + o.b))
      const passes = [
        { step: 0.2, long: 0.22, wide: 0.58, edge: 1.04 },
        { step: 0.24, long: 0.15, wide: 0.5, edge: 0.98 },
        { step: 0.26, long: 0.11, wide: 0.52, edge: 1.02 },
      ]
      const spots = []
      for (const o of placed) {
        // how high in the crown, from its lowest clumps (0) to its top (1)
        const high = 1 - (o.y - top) / Math.max(1, low - top)
        passes.forEach((pass, which) => {
          const step = clamp(pass.step * o.px, 3.2, [9, 10.5, 11.5][which] * k)
          const cols = Math.ceil((o.a * 2.2) / step)
          const rows = Math.ceil((o.b * 2.2) / step)
          for (let r = 0; r <= rows; r += 1) {
            for (let c = 0; c <= cols; c += 1) {
              const n = 200000 + o.j * 30000 + which * 9000 + r * 90 + c
              const x = o.x - o.a * 1.1 + (c + 0.5 + jitter(n) * 0.9) * step
              const y = o.y - o.b * 1.1 + (r + 0.5 + jitter(n + 1) * 0.9) * step
              const ex = (x - o.x) / o.a
              const ey = (y - o.y) / o.b
              const d = Math.hypot(ex, ey)
              if (d > pass.edge + jitter(n + 2) * 0.24 || x < -16 || x > w + 16 || y < -16 || nearer(x, y, o)) {
                continue
              }
              // Seen from underneath, most of a clump is its underside, cool and dark; the light catches the rims of
              // the leaves along its upper left, where the sunlit top shows over its edge, more so high in the crown.
              const light = clamp((-ey * 0.8 - ex * 0.4) * 0.75 + (high - 0.5) * 0.4, -1, 1)
              const under = smooth(-0.35, 0.55, ey)
              let paints = light > 0.25 ? ['crown', 'crownMid'] : ['crownDeep', 'crown']
              if (which === 0) {
                if (under > 0.6) {
                  // The underside's own inks, mixed leaf by leaf so it keeps a leafy texture rather than reading as one
                  // dark mass, and on its lower rims now and then a leaf catching the light of the sky.
                  paints = jitter(n + 9) > 0 ? ['crownUnder', 'crownDeep'] : ['crownDeep', 'crown']
                  if (d > 0.8 && jitter(n + 10) > 0.3) {
                    paints = ['crown', 'crownMid']
                  }
                } else if (under > 0.3) {
                  paints = ['crownUnder', 'crownDeep']
                } else if (light < -0.2) {
                  paints = ['crownDeep', 'crownDeep']
                }
              } else if (which === 1) {
                if (light < 0.05 + jitter(n + 3) * 0.4 || under > 0.45) {
                  continue
                }
                paints = light > 0.5 ? ['crownMid', 'crownLit'] : ['crown', 'crownMid']
              } else {
                const rim = smooth(0.55, 0.95, d) * (1 - under)
                if (light + rim * 0.6 < 0.3 + jitter(n + 3) * 0.6 || under > 0.32) {
                  continue
                }
                paints = jitter(n + 4) > 0 ? ['crownLit', 'fleck'] : ['crownMid', 'crownLit']
                if (light > 0.6 && jitter(n + 4) > 0.25) {
                  paints = ['fleck', 'sunFleck']
                }
                if (d > 0.82 && d < 1.0 && hashed(n * 5.3) < 0.5) {
                  spots.push({ x, y, z: o.z, o, dice: hashed(n * 7.7) })
                }
              }
              const round = Math.atan2(y - o.y, x - o.x) + (o.j % 2 ? 1 : -1) * Math.PI * 0.5
              const brush = -0.55 + 0.5 * Math.sin(x * 0.045 + y * 0.03)
              const towards = ((((brush - round) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
              marks.push({
                z: o.z - which * 1e-3,
                n,
                leaf: true,
                x,
                y,
                long: Math.min(pass.long * o.px, [11, 8, 6][which] * k) * (0.8 + 0.45 * (jitter(n + 5) + 0.5)),
                wide: pass.wide + 0.1 * jitter(n + 6),
                turn: round + towards * 0.6 + jitter(n + 7) * 1.5,
                paints,
                load: 0.9 + 0.06 * jitter(n + 8),
              })
            }
          }
        })
      }

      // The crown sways about the fork, all of it together and a very little, as /enterprise's tree always has.
      const swayAt = project(fork) || { x: bx, y: by - 200 }
      marks.sort((p, q) => q.z - p.z)
      marks.forEach((mk, i) => {
        rand.reseed(61813 + mk.n * 7919)
        const order = by + i * 1e-5
        if (!mk.leaf) {
          garden.dab({
            x: mk.x,
            y: mk.y,
            long: mk.long,
            wide: mk.wide,
            turn: mk.turn,
            paints: mk.paints,
            blur: mk.blur ?? 0.42,
            kind: mk.kind ?? 0,
            load: 0.93,
            stiff: 1,
            lean: 0,
            order,
          })
          return
        }
        const dx = mk.x - swayAt.x
        const dy = Math.max(4, swayAt.y - mk.y)
        const tilt = Math.atan2(dx, dy)
        garden.dab({
          x: swayAt.x,
          y: swayAt.y,
          stem: Math.hypot(dx, dy),
          long: mk.long,
          wide: mk.wide,
          turn: mk.turn - tilt * 0.7,
          blur: 0.45,
          paints: mk.paints,
          load: mk.load,
          stiff: 0.94,
          lean: tilt,
          phase: 1.3,
          order,
        })
      })

      /* ---- where it meets the ground ----
         The shade it throws, soft, round its foot and away from the sun; grass in tufts round its foot and along each
         root, so that it stands in the meadow rather than on it; and flowers, daisies and buttercups with a little lilac
         as the meadow grows them, in clumps in the crotches between the roots and here and there on the knoll in front. */
      const away = unit([-L[0], 0, -L[2]])
      for (let i = 0; i < 64; i += 1) {
        const n = 950000 + i
        const a = hashed(n * 1.3) * Math.PI * 2
        const r = Math.sqrt(hashed(n * 2.1)) * 2.4
        const m = project(add([Math.cos(a) * r * 1.15, 0.005, Math.sin(a) * r * 0.9], times(away, 0.8)))
        if (!m) {
          continue
        }
        rand.reseed(61813 + n * 7919)
        garden.dab({
          x: m.x,
          y: m.y,
          long: 0.75 * m.px,
          wide: 0.5,
          turn: 0,
          paints: ['shade', 'deepGreen'],
          load: 0.26 * (1 - smooth(1.2, 2.5, r)),
          kind: 0.25,
          blur: 4,
          stiff: 1,
          lean: 0,
          order: by - 1,
        })
      }
      for (let i = 0; i < 36; i += 1) {
        const n = 951000 + i
        const a = hashed(n * 1.3) * Math.PI * 2
        const r = 0.6 + Math.sqrt(hashed(n * 2.1)) * 0.9
        const m = project([Math.cos(a) * r * 1.1, 0.005, Math.sin(a) * r])
        if (!m) {
          continue
        }
        rand.reseed(61813 + n * 7919)
        garden.dab({
          x: m.x,
          y: m.y,
          long: 0.45 * m.px,
          wide: 0.5,
          turn: 0,
          paints: ['shade', 'deepGreen'],
          load: 0.3,
          kind: 0.25,
          blur: 2.5,
          stiff: 1,
          lean: 0,
          order: by - 0.9,
        })
      }
      // Places on the ground where the tree meets it: round the side of its foot that faces us, and all along each root
      // where it lies on the ground, a little towards us, so the grass there stands in front of the root's edge.
      const toEye = unit([eye3[0], 0, eye3[2]])
      const facingUs = Math.atan2(toEye[2], toEye[0])
      const feet = []
      const footR = trunkR(0.12)
      for (let i = 0; i < 22; i += 1) {
        const a = facingUs + ((i + 0.5) / 22 - 0.5) * Math.PI * 1.25
        feet.push({ at: [Math.cos(a) * footR * 1.04, 0, Math.sin(a) * footR * 1.04] })
      }
      for (const root of roots) {
        for (let t = 0.2; t < 1; t += 0.07) {
          const c = along(root.p, t)
          const r = rootR(root)(t)
          if (c[1] - r > 0.25 || c[1] + r < 0) {
            continue
          }
          feet.push({ at: add([c[0], 0, c[2]], times(toEye, r * 0.9)) })
        }
      }
      // How near a flower at a place on the canvas is, as the meadow's flowers are sized and softened by it: never so
      // near that it is out of focus, which at the foot of a tree reads as a smear rather than a flower.
      const nearAt = (m, n) => clamp(0.5 + (m.y - by) / 260 + jitter(n) * 0.08, 0.45, 0.7)
      // the grass, as tufts of the meadow's greens
      const tuft = (n, m, near, many, reach) => {
        for (let g = 0; g < many; g += 1) {
          const nn = n * 5 + g
          rand.reseed(61813 + nn * 7919)
          garden.stalk({
            x: m.x + jitter(nn) * reach * k,
            y: m.y + jitter(nn + 1) * 3,
            tall: (12 + 20 * hashed(nn * 1.7)) * k * (0.75 + 0.5 * (near - 0.5)),
            wide: 1,
            // the meadow's greens, lime to spring, not the gold of the slopes
            ink: 0.3 + 1.4 * hashed(nn * 2.9),
            mix: 0.5,
            soft: 0,
            stiff: 0.6,
            lean: jitter(nn + 2) * 0.5,
          })
        }
      }
      feet.forEach((f, j) => {
        for (let q = 0; q < 2; q += 1) {
          const n = 970000 + j * 13 + q
          const a = hashed(n * 1.9) * Math.PI * 2
          const r = 0.22 * Math.sqrt(hashed(n * 2.7))
          const m = project([f.at[0] + Math.cos(a) * r, 0, f.at[2] + Math.sin(a) * r])
          if (!m || m.x < -10 || m.x > w + 10 || m.y > h + 10) {
            continue
          }
          tuft(n, m, nearAt(m, n + 5), 3, 12)
        }
      })
      /* The flowers: a drift of them against its foot, where the trunk comes out of the ground, heaped in the crotches
         between the roots and running along their sides in the grass, with a few strays out on the knoll; never on a
         root. Each is painted petal by petal, crisp, as the meadow's cosmos are, the ones against the bark standing
         taller and the ones along a root low, so the root still shows over them, with a leaf now and then at its foot,
         and in patches of one colour as a drift grows. As large on the canvas as reads at a glance however small the
         tree, and on a smaller tree fewer of them, so they stay flowers at its foot rather than a bed of them. */
      const onRoot = []
      for (const root of roots) {
        for (let t = 0.12; t <= 1; t += 0.04) {
          const c = along(root.p, t)
          const r = rootR(root)(t)
          if (c[1] - r < 0.3 && c[1] + r > 0) {
            onRoot.push([c[0], c[2], r])
          }
        }
      }
      // how far a place on the ground is from the edge of the nearest root lying there, in metres (less than nothing on it)
      const fromRoots = (x, z) => Math.min(...onRoot.map(([rx, rz, r]) => Math.hypot(x - rx, z - rz) - r))
      // the crotches between neighbouring roots, as the way to the middle of each
      const ways = T.roots.map(([a, , , bend = 0]) => a + bend * 0.25).sort((p, q) => p - q)
      const crotches = ways.map((a, i) => ((a + (i + 1 < ways.length ? ways[i + 1] : ways[0] + 360)) / 2) * deg)
      const angleFrom = (a, b) => Math.abs(((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)
      const weights = ENT_FOOT_FLOWERS.reduce((sum, f) => sum + f[3], 0)
      const inkOf = (dice) => {
        let left = dice * weights
        return ENT_FOOT_FLOWERS.find((f) => (left -= f[3]) < 0) || ENT_FOOT_FLOWERS[0]
      }
      const scale = clamp(S / 320, 0.72, 1.15)
      const many = clamp(S / 320, 0.45, 1)
      const footAt = trunkR(0.1)
      for (let ring = 0; ring < 16; ring += 1) {
        const rho = footAt + 0.04 + ring * 0.085
        const steps = Math.ceil((rho * Math.PI * 1.3) / 0.085)
        for (let s2 = 0; s2 < steps; s2 += 1) {
          const n = 1000000 + ring * 997 + s2
          const a = facingUs + ((s2 + 0.5 + jitter(n) * 0.8) / steps - 0.5) * Math.PI * 1.3
          const r = rho + jitter(n + 1) * 0.06
          const x = Math.cos(a) * r
          const z = Math.sin(a) * r
          const edge = fromRoots(x, z)
          if (edge < 0.05) {
            continue
          }
          // against the trunk, along the roots and in the crotches, and hardly anywhere else
          const out = r - footAt
          const against = Math.exp(-out / 0.32)
          const along2 = Math.exp(-edge / 0.16) * (1 - smooth(1.0, 1.6, out))
          const crotch =
            Math.max(...crotches.map((c) => Math.exp(-((angleFrom(a, c) / 0.32) ** 2)))) *
            Math.exp(-(((out - 0.3) / 0.45) ** 2))
          const thick =
            smooth(-0.15, 0.45, Math.cos(a - facingUs)) * (Math.max(against, along2 * 0.9, crotch) + 0.04) * many
          if (hashed(n * 2.3) > thick * (0.55 + 0.75 * hashed(Math.floor(x * 3) * 13.1 + Math.floor(z * 3) * 7.7))) {
            continue
          }
          const m = project([x, 0, z])
          if (!m || m.x < -10 || m.x > w + 10 || m.y > h * (1 - T.footRoom * 0.8)) {
            continue
          }
          // a patch of one colour now and then, as a drift has
          const patch = hashed(Math.floor(x / 0.3) * 31.7 + Math.floor(z / 0.3) * 17.3)
          const [ink, second, petals] = inkOf(hashed(n * 3.1) < 0.55 ? patch : hashed(n * 4.7))
          const low = along2 * (1 - against)
          const reach = 6.2 * scale * (0.75 + 0.5 * hashed(n * 5.3)) * (1 - 0.2 * low)
          const lean = jitter(n + 7) * 0.4
          if (hashed(n * 6.1) < 0.45) {
            rand.reseed(61813 + n * 3 * 7919)
            garden.dab({
              x: m.x + jitter(n + 8) * reach * 0.8,
              y: m.y,
              stem: reach * 0.35,
              long: reach * (1 + 0.5 * hashed(n * 8.1)),
              wide: 0.28,
              turn: -Math.PI / 2 + jitter(n + 10) * 1.2,
              paints: ['leaf', hashed(n * 4.1) < 0.6 ? 'leaf' : 'deepGreen'],
              kind: 0.25,
              blur: 0.5,
              load: 0.8,
              stiff: 0.7,
              lean,
              order: m.y - 0.01,
            })
          }
          rand.reseed(61813 + n * 7919)
          garden.bloom({
            x: m.x,
            y: m.y,
            // taller against the bark, reaching for the light beside it, and low beside a root
            stem: reach * ((0.5 + 0.6 * hashed(n * 8.9)) * (1 - 0.5 * low) + 1.6 * against),
            reach,
            petals,
            blur: 0.5,
            paints: [ink, second],
            turn: jitter(n + 9) * 0.8,
            stiff: 0.7,
            lean,
          })
          if (hashed(n * 11.3) < 0.35) {
            tuft(n, m, nearAt(m, n + 5), 2, 6)
          }
        }
      }

      /* ---- where the pointer finds it, and where the butterflies land ---- */
      for (const b of [{ p: TRUNK, r0: trunkR(0), r1: T.waist }, ...limbs, ...branches]) {
        for (let t = 0; t <= 1; t += 0.12) {
          const m = project(along(b.p, t))
          if (m) {
            garden.tree(m.x, m.y, (b.r0 + (b.r1 - b.r0) * t) * m.px + 3)
          }
        }
      }
      for (const o of placed) {
        garden.tree(o.x, o.y, Math.max(o.a, o.b) * 0.96)
      }
      spots.sort((p, q) => p.dice - q.dice)
      const taken = []
      for (const spot of spots) {
        if (spot.y < 72 || taken.length >= 46 || taken.some((t) => Math.hypot(t.x - spot.x, t.y - spot.y) < 13 * k)) {
          continue
        }
        taken.push(spot)
        garden.perch(spot.x, spot.y, spot.dice > 0.5 ? 1 : -1)
      }
      limbs.forEach((limb) => {
        for (const t of [0.3, 0.45]) {
          const m = project(add(along(limb.p, t), [0, limbR(limb)(t), 0]))
          if (m && !placed.some((o) => ((m.x - o.x) / o.a) ** 2 + ((m.y - o.y) / o.b) ** 2 < 1)) {
            garden.perch(m.x, m.y - 2, limb.a > 90 && limb.a < 270 ? -1 : 1)
          }
        }
      })
      if (window.__entDebug) {
        window.__entDebug.tree = { S, bx, by, marks: marks.length, clumps: placed.length, foot, top }
        // and the stage the tree was fitted to, for trying other eyes away from the page
        window.__entDebug.stage = {
          w,
          h,
          words,
          knoll: Array.from({ length: 129 }, (_, i) => garden.ground('knoll', (i * w) / 128)),
        }
      }
    },
  }

  /* --- the company composition ----------------------------------------------------------------------- */

  /* The hero of /company: the footer's rolling hills, and on a rise to the right of the words a figure of light sitting
     at a desk, after the photograph Cameron sent: someone on a chair at a desk with a screen on it, so bright that only
     its shape is left, and the light it gives off, as the docs overview's figure is. The hills roll in from the left,
     lit and gilded along their crests, down to a valley under the words, and rise again on the right into the low hill
     the desk stands on; a far hill closes the view behind, and a field runs along the front. The flowers are the
     footer's: gold and marigold where the light lies, cornflowers in the shade, a drift of gold round the desk's feet.
     Where the words take the whole width, as on a phone, the desk stands under them instead. In a dark theme it is the
     same hills at dusk, where the figure shines the more. */
  const CO_EVEN = 0.005
  /* The hills, as lines in the land's room from its top line (0) down, across in shares of the half-width: the far
     hill, the lit hill coming down from the left into the valley under the words, the rise on the right the desk
     stands on, and the field along the front. The land runs 1.3 rooms deep, as /enterprise's does. */
  const CO_FAR = [
    [-1.6, 0.14],
    [-1.0, 0.07],
    [-0.45, 0.1],
    [0.1, 0.05],
    [0.6, 0.02],
    [1.1, 0.06],
    [1.6, 0.12],
  ]
  const CO_LEFT = [
    [-1.6, 0.0],
    [-1.2, 0.05],
    [-0.85, 0.16],
    [-0.55, 0.32],
    [-0.25, 0.52],
    [0.05, 0.68],
    [0.4, 0.82],
    [1.6, 1.05],
  ]
  const CO_RISE = [
    [-1.6, 1.08],
    [-0.5, 0.94],
    [-0.12, 0.8],
    [0.15, 0.62],
    [0.38, 0.48],
    [0.6, 0.4],
    [0.8, 0.38],
    [1.0, 0.41],
    [1.25, 0.48],
    [1.6, 0.58],
  ]
  const CO_FIELD = [
    [-1.6, 0.8],
    [-0.9, 0.93],
    [-0.3, 1.0],
    [0.3, 1.0],
    [0.9, 0.95],
    [1.6, 0.86],
  ]
  /* The figure at its desk, traced from the photograph (its white pixels, through potrace; see scratchpad co3/trace):
     its outline as points in its own terms, x across from its middle and y down from the top of its head, both as shares
     of its height from the top of its head to the feet of the chair and the desk, which stand on the ground. */
  const CO_DESK = {
    outer: [
      [-0.2238, 0.0196],
      [-0.2403, 0.0718],
      [-0.2327, 0.1679],
      [-0.2495, 0.1878],
      [-0.3022, 0.2171],
      [-0.3296, 0.2549],
      [-0.3567, 0.3581],
      [-0.36, 0.471],
      [-0.3688, 0.4856],
      [-0.391, 0.491],
      [-0.3946, 0.4984],
      [-0.3664, 0.5472],
      [-0.3577, 0.6008],
      [-0.3532, 0.8954],
      [-0.3492, 0.9469],
      [-0.3407, 0.9754],
      [-0.3199, 0.9896],
      [-0.3071, 0.9773],
      [-0.2883, 0.8306],
      [-0.2691, 0.9714],
      [-0.2597, 1.0],
      [-0.2474, 0.9938],
      [-0.2415, 0.9601],
      [-0.2405, 0.8123],
      [-0.1069, 0.8123],
      [-0.1062, 0.8805],
      [-0.097, 0.9296],
      [-0.0755, 0.9672],
      [-0.0507, 0.9875],
      [-0.0353, 0.962],
      [-0.0122, 0.845],
      [0.0008, 0.9476],
      [0.0121, 0.9684],
      [0.0374, 0.9618],
      [0.1166, 0.9216],
      [0.1281, 0.9011],
      [0.1305, 0.838],
      [0.1172, 0.6809],
      [0.1055, 0.6394],
      [0.1085, 0.6283],
      [0.2746, 0.6204],
      [0.281, 0.9532],
      [0.2871, 0.9627],
      [0.3069, 0.9624],
      [0.3326, 0.9511],
      [0.3502, 0.9344],
      [0.362, 0.5418],
      [0.3686, 0.517],
      [0.3946, 0.4934],
      [0.3641, 0.4547],
      [0.3757, 0.3028],
      [0.3709, 0.1261],
      [0.3643, 0.1193],
      [0.3447, 0.1159],
      [0.2562, 0.1126],
      [0.0976, 0.1157],
      [0.0495, 0.1226],
      [0.0412, 0.3522],
      [0.0349, 0.3814],
      [0.0185, 0.405],
      [0.0025, 0.3783],
      [-0.0233, 0.2858],
      [-0.0372, 0.2558],
      [-0.0563, 0.2331],
      [-0.1099, 0.1915],
      [-0.1277, 0.1656],
      [-0.1128, 0.0956],
      [-0.1126, 0.0597],
      [-0.1196, 0.038],
      [-0.1466, 0.0104],
      [-0.17, 0.0],
      [-0.2014, 0.0005],
    ],
  }
  /* Where it stands: its middle this far across, in shares of the half-width, so its left side keeps clear of the
     words; as tall as this share of the canvas, at most; in the field in front of the rise, its feet this share of the
     way down from the field's top line to the canvas's foot; and its head never higher than this share of the way
     down from the far hill's line to the field's, so the whole figure stands against the green of the hills and never
     against the page, where its white would be lost. */
  const CO_AT = 0.67
  const CO_TALL = 0.36
  const CO_SINK = 0.25
  const CO_HEAD = 0.06
  /* How much of the ground the flowers cover where a drift is thickest, by how near. */
  const CO_COVER = [
    [0, 2.2],
    [0.2, 2.8],
    [0.45, 3],
    [0.7, 2.4],
    [0.85, 2.6],
    [1, 2.2],
  ]
  /* The fields, in the footer's colours: gold along the lit hill's crest and down its slope, cornflowers where the
     valley turns into shade, gold and marigold round the desk's feet on the rise, cornflowers again in the front
     corners, and far off, specks of gold on the far hill. */
  const CO_DRIFTS = [
    {
      line: [
        [-1.75, 0.04],
        [-1.25, 0.08],
        [-0.85, 0.18],
        [-0.55, 0.32],
      ],
      wide: [0.08, 0.06],
      full: [1, 0.8],
      paints: 'marigolds',
      patchy: true,
      patchyFrom: 0.62,
      own: [0.75, 1.15],
    },
    {
      line: [
        [-1.6, 0.14],
        [-1.1, 0.22],
        [-0.7, 0.36],
        [-0.42, 0.5],
      ],
      wide: [0.06, 0.05],
      full: [0.9, 0.8],
      paints: 'sunlit',
      patchy: true,
      patchyFrom: 0.66,
    },
    // the valley under the words turning into shade
    {
      line: [
        [-0.35, 0.86],
        [0, 0.9],
        [0.3, 0.84],
      ],
      wide: [0.06, 0.05],
      full: [0.9, 0.75],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    // on the rise behind the desk: gold and marigold in its light
    {
      line: [
        [0.4, 0.62],
        [0.62, 0.56],
        [0.85, 0.55],
        [1.1, 0.6],
      ],
      wide: [0.05, 0.05],
      full: [1, 1],
      paints: 'marigolds',
      patchy: true,
      patchyFrom: 0.7,
    },
    {
      line: [
        [0.5, 0.5],
        [0.75, 0.47],
        [1.0, 0.5],
      ],
      wide: [0.035, 0.035],
      full: [0.8, 0.8],
      paints: 'sunlit',
      patchy: true,
    },
    // round the desk's feet in the field: gold in its light
    {
      line: [
        [0.42, 1.06],
        [0.67, 1.1],
        [0.92, 1.06],
      ],
      wide: [0.04, 0.04],
      full: [0.9, 0.9],
      paints: 'sunlit',
      patchy: true,
      patchyFrom: 0.72,
    },
    // the front corners in cornflowers
    {
      line: [
        [-1.75, 0.82],
        [-1.2, 0.92],
        [-0.6, 0.98],
      ],
      wide: [0.12, 0.06],
      full: [0.9, 0.6],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    {
      line: [
        [1.75, 0.84],
        [1.25, 0.94],
        [0.7, 0.99],
      ],
      wide: [0.12, 0.06],
      full: [1, 0.6],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    // far off, on the far hill: specks of gold where the light reaches
    {
      line: [
        [-0.7, 0.04],
        [0, 0.03],
        [0.7, 0.03],
      ],
      wide: [0.03, 0.03],
      full: [0.7, 0.7],
      paints: 'gold specks',
      patchy: true,
    },
  ]
  const COMPANY = {
    ...HERO,
    intro: false,
    words: '.co-copy',
    // the footer's few beads, and the oval of page kept round the words shallow, so the figure's light stays whole
    lines: { ...LINES, lift: 0.08, veil: [80, 18], beadChance: 0.15 },
    film: FOOTER.film,
    inks: FOOTER_INK,
    // the motes twinkle (see the glow in the strokes' shader), and the figure is drawn in plain round strokes that
    // neither bow nor taper (the even mark)
    twinkle: true,
    marks: true,
    // its light in the haze kind, which fades smoothly at its edge rather than breaking into the grain's specks
    glyphs: true,
    land: {
      ...HERO.land,
      profile: CO_FAR,
      crest: 0,
      relief: [1, 1],
      sheets: [
        // a haze of sky over the far hill, thinning into the page at its top
        {
          name: 'sky',
          top: {
            crest: [
              [-1.6, -0.12],
              [0, -0.16],
              [1.6, -0.12],
            ],
          },
          foot: {
            hill: [
              [-1.6, 0.06],
              [1.6, 0.06],
            ],
          },
          paint: [
            [0, 'pale', 0],
            [0.2, 'pale', 0.32],
            [0.45, 'sky', 0.7],
            [0.7, 'slateHaze', 0.9],
            [1, 'slateHaze', 1],
          ],
          fill: 0.7,
          under: 0.38,
          flow: 1.2,
          breath: 2,
        },
        // the far hill closing the view, which the flowers grow on; deep green from just under its crest, so the
        // figure's head stands out against it
        {
          name: 'meadow',
          opaque: true,
          laid: true,
          top: {
            hill: [
              [-1.6, 0],
              [1.6, 0],
            ],
          },
          foot: [
            [-1.6, 1.3],
            [1.6, 1.3],
          ],
          paint: [
            [0, 'crest', 0],
            [0.02, 'crest', 0.9],
            [0.04, 'mist', 1],
            [0.12, 'sage', 1],
            [0.28, 'fern', 1],
            [0.6, 'sage', 1],
            [1, 'fern', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.78,
          patch: 0.15,
          flow: 0.6,
          breath: 1.4,
        },
        // the hill rolling in from the left, lit, gilded along its crest
        {
          name: 'left hill',
          opaque: true,
          top: { crest: CO_LEFT },
          foot: [
            [-1.6, 1.32],
            [1.6, 1.32],
          ],
          paint: [
            [0, 'gilt', 0],
            [0.025, 'gilt', 0.85],
            [0.07, 'glow', 1],
            [0.16, 'lime', 1],
            [0.3, 'green', 1],
            [0.55, 'deepGreen', 1],
            [0.85, 'shade', 1],
            [1, 'shade', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.7,
          patch: 0.2,
          flow: 0.7,
          breath: 1.5,
          sheen: 0.6,
        },
        // the rise on the right the desk stands on, its crest catching the light, its near slope going into shade
        {
          name: 'rise',
          opaque: true,
          top: { crest: CO_RISE },
          foot: [
            [-1.6, 1.32],
            [1.6, 1.32],
          ],
          paint: [
            [0, 'gilt', 0],
            [0.03, 'glow', 0.85],
            [0.09, 'lime', 1],
            [0.22, 'green', 1],
            [0.5, 'deepGreen', 1],
            [1, 'shade', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.7,
          patch: 0.2,
          flow: 0.7,
          breath: 1.5,
          sheen: 0.55,
        },
        // the field along the front
        {
          name: 'field',
          opaque: true,
          top: { crest: CO_FIELD },
          foot: [
            [-1.6, 1.34],
            [1.6, 1.34],
          ],
          paint: [
            [0, 'gilt', 0],
            [0.06, 'glow', 0.9],
            [0.25, 'lime', 1],
            [0.55, 'green', 1],
            [1, 'deepGreen', 1],
          ],
          lean: 0.3,
          fill: 0.72,
          under: 0.6,
          patch: 0.2,
          flow: 0.8,
          breath: 1.5,
          sheen: 0.8,
        },
      ],
      least: 110,
    },
    grass: FOOTER.grass,
    passer: null,
    flowers: {
      ...FOOTER.flowers,
      focus: 0.7,
      front: 1.65,
      cover: CO_COVER,
      drifts: CO_DRIFTS,
      strays: 0,
    },
    palettes: FOOTER_PALETTES,
    // the footer's paints, and the light's own: white at its heart, a breath of warmth in its glow
    paints: {
      ...FOOTER_PAINTS,
      light: ['#ffffff', '#ffffff'],
      lightWarm: ['#fffaf0', '#fff6e6'],
      lightGlow: ['#fff0cf', '#ffe6b0'],
    },
    clouds: [],
    plant: (garden) => {
      const { w, h, rand, words, ground } = garden
      const s = clamp(w / 1232, 0.42, 1.12)
      const half = w / 2
      // The figure's own width, in shares of its height.
      let x0 = Number.POSITIVE_INFINITY
      let x1 = Number.NEGATIVE_INFINITY
      for (const [x] of CO_DESK.outer) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
      }
      // Where it stands. Beside the words where there is room for it at a good size: its middle CO_AT across, its left
      // side clear of the words, its right side clear of the canvas's edge, its feet on the rise. Otherwise under the
      // words, a little right of their middle, its head clear of them.
      const margin = Math.max(20, 24 * s)
      const want = h * CO_TALL
      const clearLeft = words.x + words.a + margin
      const footAt = (x) => ground('field', x) + CO_SINK * (h - ground('field', x))
      const headAt = (x) => ground('meadow', x) + CO_HEAD * (ground('field', x) - ground('meadow', x))
      let fx = half + CO_AT * half
      let feet = footAt(fx)
      let tall = Math.min(want, feet - headAt(fx), (fx - clearLeft) / -x0, (w - margin - fx) / x1)
      const beside = tall >= want * 0.72
      if (!beside) {
        fx = Math.min(words.x + words.a * 0.3, w - margin - x1 * want)
        feet = footAt(fx)
        const headroom = feet - Math.max(headAt(fx), words.y + words.b + Math.max(24, 28 * s))
        tall = Math.max(40, Math.min(want, headroom, (w - margin * 2) / (x1 - x0)))
        fx = clamp(fx, margin - x0 * tall, w - margin - x1 * tall)
      }
      const top = feet - tall
      const at = ([x, y]) => [fx + x * tall, top + y * tall]
      const rings = [CO_DESK.outer.map(at)]
      const left = fx + x0 * tall
      const right = fx + x1 * tall
      if (window.__coDebug) {
        window.__coDebug.figure = {
          beside,
          fx: Math.round(fx),
          top: Math.round(top),
          feet: Math.round(feet),
          tall: Math.round(tall),
        }
      }
      let laid = 0
      // A stroke's seed also sets how much lighter or darker, warmer or cooler than its paint it comes out (see the
      // strokes' shader): for the light, take the first seed near its own that makes it lighter and warmer, so that no
      // stroke of it comes out a cool grey.
      const bright = (seed) => {
        for (let k = 0; k < 24; k += 1) {
          rand.reseed(seed + k * 104729)
          // (its sway takes three draws first: lean, phase and growth)
          rand()
          rand()
          rand()
          const dice = rand()
          if ((dice * 91.7) % 1 >= 0.55 && (dice * 37.3) % 1 >= 0.55) {
            return seed + k * 104729
          }
        }
        return seed
      }
      const put = (n, o) => {
        rand.reseed(o.light ? bright(61871 + n * 7919) : 61871 + n * 7919)
        laid += 1
        garden.dab({
          stiff: 1,
          lean: 0,
          blur: 0.6,
          load: 0.97,
          kind: 0.25 + CO_EVEN,
          ...o,
          order: o.order + laid * 1e-7,
        })
      }
      // Where a column down the canvas crosses the figure: its runs of figure, top to bottom.
      const runsAt = (x) => {
        const ys = []
        for (const r of rings) {
          for (let i = 0; i < r.length; i += 1) {
            const [ax, ay] = r[i]
            const [bx, by] = r[(i + 1) % r.length]
            if (ax <= x !== bx <= x) {
              ys.push(ay + ((x - ax) * (by - ay)) / (bx - ax))
            }
          }
        }
        ys.sort((a, b) => a - b)
        const runs = []
        for (let i = 0; i + 1 < ys.length; i += 2) {
          runs.push([ys[i], ys[i + 1]])
        }
        return runs
      }
      const inFigure = (x, y) => runsAt(x).some(([a, b]) => y > a && y < b)
      const HAZE = 0.4 + CO_EVEN
      // Its body filled in columns, each run in short lengths so no stroke tapers far from its ends.
      const fill = (n, { col, blur, load, paints, order }) => {
        let k = n
        for (let x = left + col / 2; x < right; x += col) {
          for (const [a, b] of runsAt(x)) {
            if (b - a < 0.6) {
              continue
            }
            const segs = Math.max(1, Math.round((b - a) / (col * 4)))
            const seg = (b - a) / segs
            for (let q = 0; q < segs; q += 1) {
              const long = seg / 2 + col * 0.55
              put(k, {
                x,
                y: a + (q + 0.5) * seg,
                long,
                wide: clamp((col * 0.78) / long, 0.02, 1.4),
                turn: Math.PI / 2,
                paints,
                load,
                blur,
                kind: HAZE,
                order,
                light: true,
              })
              k += 1
            }
          }
        }
        return k
      }
      // Its light, from the widest to the brightest, all in the smooth haze kind: a wash of light over the hills round
      // it, and a glow round its body, wide and then close; then the figure, white, its edge soft but its shape clean.
      // It stands in front of the land and of the flowers behind its feet; the grass and flowers rooted in front of its
      // feet come up over them, so it stands in the meadow rather than on it.
      const ord = feet + 4
      const mid = top + tall * 0.5
      put(1, {
        x: fx,
        y: mid,
        long: tall * 0.8,
        wide: 0.9,
        turn: Math.PI / 2,
        paints: ['lightGlow', 'lightWarm'],
        load: 0.1,
        blur: tall * 0.32,
        kind: HAZE,
        order: ord - 0.1,
        light: true,
      })
      put(2, {
        x: fx,
        y: mid,
        long: tall * 0.56,
        wide: 0.82,
        turn: Math.PI / 2,
        paints: ['lightWarm', 'lightGlow'],
        load: 0.24,
        blur: tall * 0.1,
        kind: HAZE,
        order: ord - 0.09,
        light: true,
      })
      // a little light lying on the grass at its feet
      put(3, {
        x: fx,
        y: feet - tall * 0.01,
        long: (right - left) * 0.62,
        wide: 0.16,
        turn: 0,
        paints: ['lightGlow', 'lightWarm'],
        load: 0.3,
        blur: tall * 0.05,
        kind: HAZE,
        order: ord - 0.095,
        light: true,
      })
      // Its glow held close, so the shape keeps its neck, the light between its arm and the screen, and the gap under
      // the desk; then the body, white, with a soft edge only a few pixels wide.
      fill(50000, {
        col: Math.max(4, tall * 0.02),
        blur: tall * 0.045,
        load: 0.3,
        paints: ['lightGlow', 'lightWarm'],
        order: ord - 0.085,
      })
      fill(100000, {
        col: Math.max(3, tall * 0.014),
        blur: tall * 0.018,
        load: 0.55,
        paints: ['lightWarm', 'light'],
        order: ord - 0.08,
      })
      fill(200000, {
        col: Math.max(2, tall * 0.009),
        blur: Math.max(1.6, tall * 0.007),
        load: 0.95,
        paints: ['light', 'lightWarm'],
        order: ord - 0.07,
      })
      fill(300000, {
        col: Math.max(1.4, tall * 0.006),
        blur: 1.1,
        load: 1,
        paints: ['light', 'light'],
        order: ord - 0.06,
      })
      // The motes: small round lights near it, each twinkling at its own pace, a few large and soft; none on the figure
      // and none over the words.
      for (let i = 0; i < 18; i += 1) {
        const n = 5000 + i * 3
        const a = hashed(n * 1.3) * Math.PI * 2
        const d = 0.45 + 0.7 * hashed(n * 2.1)
        const x = fx + Math.cos(a) * d * tall * 0.8
        const y = mid + Math.sin(a) * d * tall * 0.5
        const nearWords = x > words.x - words.a - 30 && x < words.x + words.a + 30 && y < words.y + words.b + 12
        if (nearWords || inFigure(x, y) || y > feet + 8) {
          continue
        }
        const big = hashed(n * 4.1) < 0.25
        const core = Math.max(1.2, (big ? 3.4 + 2 * hashed(n * 3.7) : 1.4 + 1.6 * hashed(n * 3.7)) * s)
        put(n, {
          x,
          y,
          long: core * (big ? 2.6 : 4),
          wide: 1,
          turn: 0,
          paints: ['lightGlow', 'lightWarm'],
          load: big ? 0.55 : 0.42,
          kind: 3.25,
          blur: core * (big ? 1.6 : 3.2),
          order: ord + 0.2,
        })
        put(n + 1, {
          x,
          y,
          long: core,
          wide: 0.95,
          turn: 0,
          paints: ['light', 'lightWarm'],
          load: big ? 0.75 : 0.95,
          kind: 3.4,
          blur: big ? core * 0.5 : 0.4,
          order: ord + 0.21,
        })
      }
    },
  }

  /* --- the pricing composition ---------------------------------------------------------------------- */

  /* The hero of /pricing: a sunset over the sea, after a painting of one, made of nothing but light, in the fine lines
     of /products/sdk-generator. The painting's sky, butter and peach at the sides, a soft column of pink light in its
     middle deepening to coral over a narrow band of hot orange along the horizon, and under it a still lavender sea.
     Each is a band of fine lines that sweeps gently across the stage, and the colours run through each other line by
     line where they meet. Under the header there is only the page: the sky's lines come in from nothing far below it,
     thin, few and pale at first, and are at their full only around the words and under them. Behind the words the sun
     is going down, a disc of light standing in the pink column with its foot behind the horizon: the sky's lines take
     its light as they run into it, white at its middle where the words stand, a pale gold limb and a glowing rim, a halo
     of apricot and pink round it, and its light rises softly above the lines; the horizon glows gold where it sets, and
     its reflection lies in the sea in streaks. A long wave runs through the horizon and the sea's lines roll gently.
     Every band thins into specks at its edges, so nothing is drawn as an edge. It is live, breathing and drifting, and
     in a dark theme the same sunset at dusk, the sun a deep warm glow, darkest at its middle where the words stand, its
     light in its rim and its halo. When the pointer rests on the sun's reflection, the butterflies come to it. */
  const PR_INKS = {
    // the land's inks the engine asks for, unused here
    ...LAND_INK,
    // the sky, from its top down: cream, butter at the sides, the pale light the words stand in, peach, and apricot
    // over the horizon; at dusk the top is night coming on and the words stand in its deep plum
    cream: ['#f7e2c6', '#2b2340'],
    butter: ['#f6cc80', '#4a3858'],
    light: ['#f8dcab', '#3a2c4b'],
    peach: ['#f7b386', '#7a4a66'],
    apricot: ['#f5a56c', '#b25e5e'],
    // the glow, from its pale heart to its deep foot over the horizon
    pale: ['#fbd6c6', '#40304f'],
    blush: ['#f9c4b6', '#6a4262'],
    // the column's head, over the words, dimmer at dusk
    rose: ['#f5a49a', '#6e4466'],
    pink: ['#f5a49a', '#a85674'],
    salmon: ['#f3988a', '#d0687a'],
    coral: ['#f08a6c', '#e27b5c'],
    // the horizon, its soft top and its hot middle and foot
    tangerine: ['#f39a58', '#eb7a45'],
    gold: ['#f7c070', '#ffb054'],
    flame: ['#ee7a3c', '#f2662e'],
    ember: ['#e2602e', '#df4f27'],
    // the sea, slate-lavender under the horizon and warmer towards us
    slate: ['#8c859c', '#544c6e'],
    seaHigh: ['#988ea4', '#4d4767'],
    lavender: ['#a69aae', '#443e5d'],
    lavenderLow: ['#b4a5b2', '#302b45'],
    sand: ['#c5b1a4', '#1f1c2a'],
    sheen: ['#f6dfc2', '#3e3354'],
    // the sun: its middle, nearly white on a light page and at dusk the deepest of the warm darks, so the words read on
    // it either way; its face's edge; its rim, pale gold, at dusk glowing; the glow just past it; and its halo, the pink
    // it fades into
    sunCore: ['#fffcf6', '#1c0f17'],
    sunFace: ['#ffecce', '#4a1d2b'],
    sunRim: ['#ffc98a', '#ff9a5c'],
    sunGlow: ['#ffa98a', '#f06a62'],
    sunHalo: ['#f598a0', '#a8406c'],
    // its reflection in the sea, in streaks
    sunWater: ['#f8d0a4', '#e08868'],
    sunWaterLow: ['#efb9a6', '#8f4766'],
  }

  /* The places across a guide is given at, past both sides of the stage. */
  const PR_ACROSS = Array.from({ length: 129 }, (_, k) => -1.6 + (3.2 * k) / 128)

  /* Where the words are, in the land's terms: how far across their middle is and how far either side they reach (shares
     of the half-width), and how far down their top, their middle and their foot are (rooms). Nothing is laid round
     them: the sky's bands only change colour at their height. */
  const prWords = ({ w, words, room, base }) => {
    const half = w / 2
    return {
      at: (words.x - half) / half,
      wide: (words.a + 24) / half,
      top: (words.y - words.b - base) / room,
      mid: (words.y - base) / room,
      foot: (words.y + words.b - base) / room,
    }
  }
  /* The canvas's top, in rooms above the horizon. */
  const prTop = ({ base, room }) => -base / room
  /* A long wave along a guide, in CSS pixels: so high, so long, from where; so that it reads the same on any screen. */
  const prWave = (stage, x, high, long, phase = 0) =>
    (high / stage.room) * Math.sin(((x * stage.w) / 2 / long) * Math.PI * 2 + phase)

  /* The sun: a disc of light behind the words, its middle under theirs a little above the horizon, so that it is going
     down, and its bright face reaching past every line of the copy: the heading's ends at its top (the heading is never
     wider than its text, 330 pixels), the lede's at either side, the buttons' at its foot. Worked out from the words
     each time the land is laid out. */
  const PR_SUN_FACE = 0.9
  const prSun = (stage) => {
    const { w, words, base } = stage
    const top = words.y - words.b
    const foot = words.y + words.b
    const y = foot + (base - foot) * 0.3
    const reach = Math.max(
      Math.hypot(Math.min(words.a, 168), y - top),
      Math.hypot(words.a, y - (top + words.b * 0.7)),
      Math.hypot(Math.min(words.a, 194), y - foot),
    )
    const r = (reach + 10) / PR_SUN_FACE
    if (2 * r < 0.94 * w) {
      return { x: words.x, y, r }
    }
    // On a phone the copy is as wide as the screen, and a sun holding all of it would be wider still, its rim off the
    // screen, a white sky rather than a sun. There the heading and the lede stand on the page itself (the sky's lines
    // only come in under them), and the sun goes down under them: a whole disc as wide as the screen allows, its top
    // just over the buttons, which stand on its face, and its foot behind the horizon.
    const small = Math.min(w * 0.46, (base - top) * 0.6)
    return { x: words.x, y: foot - 100 + small, r: small }
  }

  /* Where the glow is: a soft column of light centred on the words, wider than they are and reaching from the top of
     the sky to the horizon, worked out from the words each time the land is laid out (see glowPlaces), the sun standing
     in it. It breathes, a little larger and smaller, over a long slow breath. It only colours the lines passing through
     it. The sun's reflection lies in the sea under the sun, narrower than it. */
  const PR_GLOW = {
    place: (stage) => {
      const { at, wide, mid } = prWords(stage)
      return { at: [at, mid + 0.25], half: [Math.max(0.3, wide * 1.1), 1.6] }
    },
    breathe: [0.08, 14],
  }
  const prReflection = (stage) => {
    const { w } = stage
    const sun = prSun(stage)
    return { at: [(sun.x - w / 2) / (w / 2), 0.32], half: [Math.max(0.2, (sun.r * 0.55) / (w / 2)), 0.6] }
  }
  /* Where the sun goes down behind the horizon, which glows there: as wide as most of the sun, along the horizon. */
  const prSunset = (stage) => {
    const { w } = stage
    const sun = prSun(stage)
    return { at: [(sun.x - w / 2) / (w / 2), 0], half: [(sun.r * 0.85) / (w / 2), 0.3] }
  }
  /* The place that calls the butterflies: the sun's reflection, under the buttons, in CSS pixels on the canvas. */
  const prZone = (stage) => {
    const { w, room, base } = stage
    const half = w / 2
    const { at, half: size } = prReflection(stage)
    return {
      x: half + at[0] * half,
      y: base + 0.3 * room,
      a: Math.max(size[0] * half * 0.95, 110),
      b: Math.max(room * 0.24, 50),
    }
  }

  /* The horizon's foot, where the sky ends and the sea begins, nearly level; and its top, which a long wave runs along,
     so the band swells and thins as it goes. */
  const prHorizon = (stage, x, lift = 0) => lift + prWave(stage, x, 2, 1900, 0.9)
  const prHorizonTop = (stage, x) =>
    prHorizon(stage, x, -0.16) + prWave(stage, x, 10, 1500, 2.1) + prWave(stage, x, 3, 610, 0.3)
  /* How far under the canvas's top the sky's top line is, in rooms: a twenty-fifth of the stage's width at its left
     edge and nothing at its right, with a long slow wave in it; so the sky's lines, which run from it down to the level
     horizon, sweep up to the right, as the Warp hero's streaks do, the most at the top and less and less down. */
  const prDip = (stage, x) => (0.02 * stage.w * (1 - x)) / stage.room + prWave(stage, x, 6, 1700, 0.6)

  const PRICING = {
    ...HERO,
    words: '.pr-copy',
    // The hero's lines, lifted a little less between them on a light page, so the colour fields read as full as the
    // painting's; round the words a soft veil that thins the lines a little rather than clearing them (the sun does the
    // rest); and every line reaching past the canvas's right edge once it is in (`whole`), so none stops short of it in
    // a dash of page.
    lines: {
      ...LINES,
      lift: 0.15,
      veil: [150, 100],
      veilCore: 0,
      veilDepth: [0.25, 0.35],
      sink: 70,
      introMs: 2600,
      whole: true,
    },
    inks: PR_INKS,
    glow: PR_GLOW,
    waves: true,
    // The sun, behind the words: white at its middle (at dusk the deepest warm dark), a pale gold limb, glowing at its
    // rim, a halo of apricot and pink round it fading into the column and the peach. Its light comes in from a little
    // under the header, higher than the lines do, so its top is a soft glow on the page; on a light page it lays none
    // on its face, where the page is its white, and at dusk it lays its deep glow there.
    sun: {
      place: prSun,
      face: PR_SUN_FACE,
      halo: 0.45,
      rim: 0.09,
      rise: (stage) => [stage.h * 0.04, stage.words.y - stage.words.b * 0.6],
      inks: ['sunCore', 'sunFace', 'sunRim', 'sunGlow', 'sunHalo'],
      light: [
        [0, 0.7],
        [0.4, 0.6],
        [0.35, 0.45],
      ],
      lines: [
        [0.8, 0.85],
        [1, 0.08],
      ],
      breathe: [0.06, 13],
    },
    // The sky's lines come in from nothing: none at all under the header, then thin, few and pale, with hardly a bead,
    // and at their full only a little under the words; a long ramp eased in, so the top third of the canvas is the page.
    fade: {
      at: (stage) => {
        const foot = stage.words.y + stage.words.b
        return [stage.h * 0.05, foot + (stage.base - foot) * 0.15]
      },
      ease: 1.6,
      pale: 0.6,
      sparse: 0.8,
      specks: 2.5,
    },
    land: {
      ...HERO.land,
      // No hill: the land's line is the horizon, level across the stage, and its room the sea under it, the sky above
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      relief: [1, 1],
      room: 220,
      foot: 8,
      head: 0,
      least: 150,
      sheets: [
        // The sky, one band of lines from just under the header to the horizon, which hides its foot: cream at its very
        // top, butter at the sides, peach and apricot lower down; and in its middle the column of pink light, rose over
        // the words, paling to its heart where the sun stands and deepening under it to salmon and coral over the
        // horizon. Its lines rise a little to the right, and its colours with them; they come in from nothing (fade),
        // and take the sun's light as they run into it.
        {
          name: 'air',
          top: (stage) => PR_ACROSS.map((x) => [x, prTop(stage) + 2 / stage.room + Math.max(0, prDip(stage, x))]),
          foot: (stage) => PR_ACROSS.map((x) => [x, prHorizon(stage, x, -0.05)]),
          paint: [
            [0, 'cream', 0.08],
            [0.06, 'cream', 0.6],
            [0.12, 'cream', 0.95],
            [0.4, 'butter', 1],
            [0.62, 'butter', 1],
            [0.8, 'peach', 1],
            [0.93, 'apricot', 1],
            [1, 'tangerine', 0.9],
          ],
          glow: [
            [0, 'blush', 0.08],
            [0.06, 'blush', 0.6],
            [0.16, 'rose', 0.95],
            [0.3, 'rose', 1],
            [0.4, 'pale', 1],
            [0.72, 'pale', 1],
            [0.8, 'pink', 1],
            [0.9, 'salmon', 1],
            [1, 'coral', 0.95],
          ],
          glowTake: 1.5,
          sun: [1, 1],
          fade: true,
          fill: 0.6,
          under: 0.76,
          patch: 0.18,
          lean: 0.08,
          beads: [1, 0.5],
          flow: 0.6,
          breath: 4,
        },
        // The sea, slate under the horizon, lavender further down and warming to sand towards us, in stripes that run
        // through each other line by line, with the sun's reflection in it in streaks, and thinning into specks at its
        // foot. It runs on up under the horizon, which hides its top. Its lines roll gently on a wave of their own.
        {
          name: 'sea',
          top: (stage) => PR_ACROSS.map((x) => [x, prHorizon(stage, x, -0.02)]),
          // level at the horizon and rolling more and more towards us, as swells seen across still water do
          foot: (stage) =>
            PR_ACROSS.map((x) => [x, 0.98 + prWave(stage, x, 9, 900, 2.2) + prWave(stage, x, 4, 430, 0.7)]),
          paint: [
            [0, 'slate', 0.95],
            [0.08, 'slate', 1],
            [0.22, 'seaHigh', 1],
            [0.36, 'lavender', 1],
            [0.46, 'seaHigh', 1],
            [0.6, 'lavender', 1],
            [0.72, 'lavenderLow', 1],
            [0.82, 'sand', 0.8],
            [0.92, 'sand', 0.35],
            [1, 'sand', 0],
          ],
          glow: [
            [0, 'sunWater', 0.9],
            [0.3, 'sunWater', 1],
            [0.62, 'sunWaterLow', 1],
            [0.82, 'sunWaterLow', 0.8],
            [0.92, 'sunWaterLow', 0.35],
            [1, 'sunWaterLow', 0],
          ],
          glowAt: prReflection,
          glowTake: 0.85,
          shimmer: 1,
          fill: 0.62,
          under: 0.8,
          patch: 0.3,
          beads: [0.5, 0.25],
          flow: 0.3,
          breath: 2.5,
          wave: [2.5, 760, 0.28, 1.3],
        },
        // The horizon: hot orange, soft above and crisp at its foot, a long wave running along its top, and the band
        // rising and falling slowly on a longer one.
        {
          name: 'horizon',
          // it hides the sky's foot and the sea's top behind it, and its soft top comes in over the sky with its haze
          opaque: true,
          laid: true,
          top: (stage) => PR_ACROSS.map((x) => [x, prHorizonTop(stage, x)]),
          foot: (stage) => PR_ACROSS.map((x) => [x, prHorizon(stage, x, 0.012)]),
          paint: [
            [0, 'tangerine', 0],
            [0.12, 'tangerine', 0.7],
            [0.3, 'flame', 1],
            [0.4, 'gold', 1],
            [0.47, 'flame', 1],
            [0.8, 'ember', 1],
            [1, 'ember', 1],
          ],
          // where the sun goes down behind it, it glows gold
          glow: [
            [0, 'sunGlow', 0],
            [0.12, 'sunGlow', 0.75],
            [0.28, 'gold', 1],
            [0.4, 'sunRim', 1],
            [0.5, 'gold', 1],
            [0.75, 'flame', 1],
            [1, 'ember', 1],
          ],
          glowAt: prSunset,
          glowTake: 0.7,
          fill: 0.72,
          under: 0.9,
          patch: 0.15,
          flow: 0.45,
          breath: 3,
          wave: [3, 1800, 0.18, 0],
        },
      ],
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    clouds: [],
    // Five of the family, at the hero's sizes, none of them in the picture until the pointer rests on the sun's
    // reflection in the sea: then each comes in through the glass at the sides and goes round the pointer on a ring of
    // its own, so far out, so fast and that way round (one goes the other way), tipped back so far and leaning so far,
    // and trailing the pointer by so much; and they go when it does.
    flock: [
      { size: 21, seed: 0.13, pastel: 0, wing: 'round', ring: 42, spin: 1.45, tilt: 1.05, lean: 0.14, trail: 0.2 },
      { size: 25, seed: 0.46, pastel: 1, wing: 'broad', ring: 88, spin: 0.86, tilt: 1.18, lean: -0.12, trail: 0.36 },
      { size: 19, seed: 0.79, pastel: 2, wing: 'slim', ring: 66, spin: -1.05, tilt: 1.0, lean: 0.24, trail: 0.28 },
      { size: 23, seed: 0.31, pastel: 0, wing: 'broad', ring: 112, spin: 0.68, tilt: 1.24, lean: -0.06, trail: 0.44 },
      { size: 18, seed: 0.62, pastel: 2, wing: 'round', ring: 132, spin: 0.6, tilt: 1.3, lean: -0.18, trail: 0.5 },
    ],
    // the glass along the top is left out: the hero's top is the site's header
    lens: { ...LENS, top: false },
    // The place that calls them is the sun's reflection on the sea, under the buttons and clear of them: the warmest
    // light in the lower half of the picture, where the eye goes down from the sun, with the sea's room round it for
    // their rings.
    orbit: { zone: prZone },
    stillAt: 6,
  }
  /* --- the flight composition ------------------------------------------------------------------------- */

  /* The butterflies that cross /enterprise's figures and turn the cards over: the meadow's own, with the same wings and
     colours, at the sizes the Deploy page flies its own, in a band over the three cards and nothing else drawn, so that the page and the
     cards show through everywhere but the wings (`lens.clear`). Every so often they cross together, each a little after
     the one before, from beyond the left edge to beyond the right, in through the glass at the edges and out through it
     as the heroes' do, and then the band is empty for a while (`crossing`). The page turns each card over as the first of
     them reaches its middle (root.hlLead, which landing.js reads), so it is the butterflies that turn them. */
  const FLIGHT_BAND = {
    ...HERO,
    intro: false,
    // built in idle time once within two screens, and painted when within one
    wake: '200% 0px',
    near: '100% 0px',
    words: null,
    // No land: the land's line lies along the canvas's top and its room is the canvas's height, so the air below is in
    // shares of the band.
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: ({ h }) => h,
      foot: 0,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    clouds: [],
    // The hero's four, at the Deploy page's scale: its three depths' sizes (44, 64 and 90 CSS pixels to a wing unit at
    // a window of 1440 by 800), and one between.
    flock: [
      { ...FLOCK[0], size: 64 },
      { ...FLOCK[1], size: 90 },
      { ...FLOCK[2], size: 44 },
      { ...FLOCK[3], size: 56 },
    ],
    // the middle of the band, over the middle of the cards, each in the lane the hero gives it (the band has 120px of
    // room above and below the cards, for wings this size)
    air: {
      top: [
        [-1.6, 0.38],
        [1.6, 0.38],
      ],
      foot: [
        [-1.6, 0.62],
        [1.6, 0.62],
      ],
    },
    // The heroes' glass, but nothing of the picture behind the wings, since the band's canvas lies over the cards; and only
    // along its sides, where they come in and go out, as the top of the band is the middle of the page and no edge of it.
    // Its colours are hardly split at all: the split grows with the distance from the canvas's middle, which on a band
    // this wide is far, and wings this large come through it whole, so even a little more smeared them into rainbows.
    lens: { ...LENS, foot: false, top: false, clear: true, split: 0.003 },
    // As large as the Deploy page's at the same width, however short the band, up to the size they are there at 1300
    // pixels: any larger and the room over the cards is too little for their wings.
    fit: (w) => clamp(w / 1300, 0.56, 1),
    /* When they cross: every `every` seconds, taking `across` to go from beyond one edge to beyond the other, each this
       many seconds behind the first. At rest (reduced motion), how far across each one is, how far down from the
       canvas's top, in its own sizes, and how large, as a share of its size in flight: just above the cards, which start
       120px down (the page's inset), with the whole of their wings in the band and clear of the numbers. And how far
       from the band's top and foot their bodies keep in flight, in their own sizes, so that a wing beating is never cut
       off by the canvas's edge. */
    crossing: {
      every: 11,
      across: 4.4,
      after: [0, 0.5, 0.22, 0.85],
      rest: [0.3, 0.46, 0.6, 0.72],
      restY: [1.88, 1.25, 2.94, 2.05],
      restSize: 0.8,
      room: 1.35,
    },
  }

  /* --- the docs composition --- */

  /* The hero of the docs' overview page: a valley in the footer's rolling hills, after the photograph of a shining
     figure in the poppy hills. Two hills come down to it from either side, the left one lit and gilded along its crest,
     the right one turning into its own shade, a far hill closing the valley behind, and a field in front; the flowers
     are the footer's, fields of one colour each, gold and marigold where the light lies, cornflowers in the shade. In
     the valley, under the words, stands a figure of light: a silhouette so bright that it has no detail, only its shape
     and the light it gives off, which blooms out round it, lies on the flowers at its feet and drifts near it in a few
     motes. In a dark theme it is the same valley at dusk, where the figure shines the more. */
  const DOCS_EVEN = 0.005
  /* The hills, as lines in the land's room from its top line (0) down: the far hill closing the valley, the left hill
     coming down into it from the left edge, the right hill from the right, and the field in front, rising into both
     front corners. The land runs 1.3 rooms deep, as the headless page's does. */
  const DOCS_FAR = [
    [-1.6, 0.16],
    [-0.9, 0.1],
    [-0.35, 0.05],
    [0.1, 0.035],
    [0.55, 0.07],
    [1.1, 0.12],
    [1.6, 0.17],
  ]
  const DOCS_LEFT = [
    [-1.6, -0.02],
    [-1.25, 0.03],
    [-0.9, 0.13],
    [-0.6, 0.28],
    [-0.36, 0.46],
    [-0.16, 0.62],
    [0.05, 0.74],
    [0.4, 0.86],
    [1.6, 1.05],
  ]
  const DOCS_RIGHT = [
    [-1.6, 1.08],
    [-0.4, 0.9],
    [-0.08, 0.79],
    [0.14, 0.66],
    [0.34, 0.5],
    [0.62, 0.32],
    [0.95, 0.17],
    [1.3, 0.07],
    [1.6, 0.02],
  ]
  const DOCS_FIELD = [
    [-1.6, 0.78],
    [-1.0, 0.9],
    [-0.5, 0.98],
    [0, 1.0],
    [0.5, 0.98],
    [1.0, 0.9],
    [1.6, 0.78],
  ]
  /* The figure, traced from the photograph Cameron sent (its brightest pixels, through potrace, smoothed a little; see
     scratchpad docs/trace): its outline, and the light between its right arm and its waist, as points in its own terms,
     x across from the middle of its head and y down from the top of its head, both as shares of its height in the
     photograph, where the picture's foot cuts it off at the thighs. It is cut off the same way here: it stands so tall
     that the canvas's foot crosses it there, and its feet are never seen. */
  const DOCS_SILHOUETTE = {
    outer: [
      [-0.0566, 0.2035],
      [-0.0509, 0.2285],
      [-0.0521, 0.2392],
      [-0.0625, 0.2611],
      [-0.0832, 0.281],
      [-0.1371, 0.3126],
      [-0.1484, 0.322],
      [-0.1592, 0.3379],
      [-0.171, 0.3785],
      [-0.1689, 0.4373],
      [-0.1702, 0.4849],
      [-0.1913, 0.5751],
      [-0.1978, 0.5903],
      [-0.2004, 0.6196],
      [-0.2102, 0.6726],
      [-0.2106, 0.6844],
      [-0.2066, 0.7067],
      [-0.2131, 0.7385],
      [-0.2096, 0.7606],
      [-0.1997, 0.7814],
      [-0.1977, 0.7928],
      [-0.1923, 0.8011],
      [-0.1881, 0.8032],
      [-0.1843, 0.8029],
      [-0.1811, 0.7975],
      [-0.1822, 0.7609],
      [-0.1807, 0.7537],
      [-0.173, 0.751],
      [-0.1691, 0.7522],
      [-0.1633, 0.7587],
      [-0.1615, 0.7756],
      [-0.1613, 0.8515],
      [-0.154, 0.8792],
      [-0.1456, 0.8955],
      [-0.1455, 0.9145],
      [-0.1372, 0.9452],
      [-0.1321, 0.9565],
      [-0.131, 0.9622],
      [-0.1326, 0.9766],
      [-0.1272, 0.9998],
      [-0.0194, 1],
      [-0.0143, 0.999],
      [-0.0145, 0.9921],
      [-0.0049, 0.9724],
      [0.0029, 0.9681],
      [0.0089, 0.9722],
      [0.0196, 0.9984],
      [0.0248, 1],
      [0.1328, 0.9999],
      [0.1448, 0.9989],
      [0.1472, 0.9959],
      [0.1441, 0.9921],
      [0.1499, 0.9643],
      [0.1429, 0.9384],
      [0.1418, 0.899],
      [0.1479, 0.8677],
      [0.1441, 0.8513],
      [0.1447, 0.849],
      [0.1483, 0.8482],
      [0.1492, 0.8431],
      [0.1502, 0.8042],
      [0.1583, 0.7744],
      [0.1751, 0.734],
      [0.1763, 0.7179],
      [0.1829, 0.6895],
      [0.1945, 0.6573],
      [0.197, 0.6379],
      [0.2085, 0.627],
      [0.2107, 0.6225],
      [0.2123, 0.611],
      [0.2118, 0.5871],
      [0.2053, 0.5547],
      [0.2133, 0.525],
      [0.2116, 0.5139],
      [0.2045, 0.4923],
      [0.2063, 0.4568],
      [0.2052, 0.4393],
      [0.2001, 0.4229],
      [0.194, 0.3896],
      [0.1709, 0.3197],
      [0.1613, 0.3075],
      [0.1554, 0.2916],
      [0.144, 0.2851],
      [0.1322, 0.2739],
      [0.1064, 0.266],
      [0.0814, 0.2508],
      [0.054, 0.2292],
      [0.047, 0.2204],
      [0.0433, 0.2095],
      [0.0416, 0.1991],
      [0.0405, 0.192],
      [0.0411, 0.1872],
      [0.0444, 0.1842],
      [0.0492, 0.181],
      [0.0543, 0.178],
      [0.0593, 0.1747],
      [0.0631, 0.1701],
      [0.0652, 0.1645],
      [0.066, 0.1586],
      [0.0661, 0.1526],
      [0.0662, 0.1466],
      [0.0664, 0.1406],
      [0.0665, 0.1346],
      [0.0667, 0.1286],
      [0.0671, 0.1227],
      [0.0681, 0.1167],
      [0.069, 0.1108],
      [0.07, 0.1049],
      [0.071, 0.099],
      [0.0718, 0.093],
      [0.0722, 0.0871],
      [0.0727, 0.0811],
      [0.0723, 0.0751],
      [0.0719, 0.0691],
      [0.0704, 0.0633],
      [0.0678, 0.0579],
      [0.0653, 0.0525],
      [0.0625, 0.0472],
      [0.0592, 0.0422],
      [0.0551, 0.0378],
      [0.051, 0.0334],
      [0.0463, 0.0297],
      [0.0416, 0.0259],
      [0.0369, 0.0222],
      [0.0322, 0.0185],
      [0.0269, 0.0158],
      [0.0214, 0.0135],
      [0.0159, 0.0111],
      [0.0106, 0.0081],
      [0.0054, 0.0052],
      [-0.0, 0.0027],
      [-0.0057, 0.0008],
      [-0.0117, 0.0],
      [-0.0176, 0.0006],
      [-0.0236, 0.0011],
      [-0.0296, 0.0016],
      [-0.0356, 0.002],
      [-0.0415, 0.0025],
      [-0.0474, 0.0037],
      [-0.0532, 0.0053],
      [-0.0587, 0.0077],
      [-0.0636, 0.0111],
      [-0.0685, 0.0146],
      [-0.0733, 0.0181],
      [-0.0774, 0.0225],
      [-0.0809, 0.0273],
      [-0.0839, 0.0325],
      [-0.0862, 0.038],
      [-0.0889, 0.0433],
      [-0.0923, 0.0483],
      [-0.0957, 0.0532],
      [-0.0976, 0.0588],
      [-0.0991, 0.0646],
      [-0.1006, 0.0704],
      [-0.1021, 0.0763],
      [-0.1033, 0.0821],
      [-0.1035, 0.0881],
      [-0.1023, 0.0939],
      [-0.1003, 0.0996],
      [-0.0988, 0.1053],
      [-0.0985, 0.1113],
      [-0.0983, 0.1173],
      [-0.0981, 0.1233],
      [-0.0978, 0.1293],
      [-0.0973, 0.1352],
      [-0.0957, 0.141],
      [-0.0934, 0.1465],
      [-0.0903, 0.1517],
      [-0.0873, 0.1568],
      [-0.085, 0.1624],
      [-0.0827, 0.1679],
      [-0.0804, 0.1735],
      [-0.0775, 0.1786],
      [-0.0738, 0.1829],
      [-0.0689, 0.186],
      [-0.0634, 0.1883],
      [-0.0608, 0.1901],
    ],
    holes: [
      [
        [0.1286, 0.543],
        [0.1421, 0.569],
        [0.1442, 0.6101],
        [0.1363, 0.6439],
        [0.1364, 0.6728],
        [0.1313, 0.7094],
        [0.1286, 0.714],
        [0.1212, 0.7179],
        [0.1158, 0.7136],
        [0.1115, 0.7042],
        [0.1006, 0.6857],
        [0.0975, 0.6745],
        [0.0974, 0.6515],
        [0.1053, 0.638],
        [0.0973, 0.6339],
        [0.0959, 0.6308],
        [0.0953, 0.5957],
        [0.102, 0.5734],
        [0.1068, 0.5636],
        [0.1223, 0.5422],
      ],
    ],
  }
  /* How much of the ground the flowers cover where a drift is thickest, by how near. */
  const DOCS_COVER = [
    [0, 2.2],
    [0.2, 2.8],
    [0.45, 3],
    [0.7, 2.4],
    [0.85, 2.6],
    [1, 2.2],
  ]
  /* The fields, in the footer's colours: gold lying along the lit left hill and down its slope, the right hill's slope
     in cornflowers as it turns into its shade, marigolds and gold round the figure's feet in the valley, cornflowers
     again in both front corners, and far off, specks of gold on the far hill. */
  const DOCS_DRIFTS = [
    {
      line: [
        [-1.75, 0.02],
        [-1.25, 0.06],
        [-0.85, 0.16],
        [-0.55, 0.28],
      ],
      wide: [0.08, 0.06],
      full: [1, 0.8],
      paints: 'marigolds',
      patchy: true,
      patchyFrom: 0.62,
      own: [0.75, 1.15],
    },
    {
      line: [
        [-1.6, 0.12],
        [-1.1, 0.2],
        [-0.7, 0.34],
        [-0.42, 0.46],
      ],
      wide: [0.06, 0.05],
      full: [0.9, 0.8],
      paints: 'sunlit',
      patchy: true,
      patchyFrom: 0.66,
    },
    {
      line: [
        [1.75, 0.02],
        [1.2, 0.08],
        [0.85, 0.18],
        [0.55, 0.3],
      ],
      wide: [0.08, 0.07],
      full: [0.9, 0.75],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    // round the figure's feet in the valley: a field of gold and marigold in the light
    {
      line: [
        [-0.55, 0.72],
        [-0.2, 0.78],
        [0.2, 0.78],
        [0.55, 0.72],
      ],
      wide: [0.06, 0.06],
      full: [1, 1],
      paints: 'marigolds',
      patchy: true,
      patchyFrom: 0.7,
    },
    {
      line: [
        [-0.4, 0.62],
        [0, 0.66],
        [0.4, 0.62],
      ],
      wide: [0.04, 0.04],
      full: [0.8, 0.8],
      paints: 'sunlit',
      patchy: true,
    },
    // the front corners in cornflowers
    {
      line: [
        [-1.75, 0.8],
        [-1.2, 0.9],
        [-0.6, 0.96],
      ],
      wide: [0.12, 0.06],
      full: [0.9, 0.6],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    {
      line: [
        [1.75, 0.8],
        [1.2, 0.9],
        [0.6, 0.96],
      ],
      wide: [0.12, 0.06],
      full: [1, 0.6],
      paints: 'cornflowers',
      patchy: true,
      patchyFrom: 0.6,
    },
    // far off, on the far hill: specks of gold where the light reaches
    {
      line: [
        [-0.6, 0.02],
        [0, 0.01],
        [0.6, 0.03],
      ],
      wide: [0.03, 0.03],
      full: [0.7, 0.7],
      paints: 'gold specks',
      patchy: true,
    },
  ]
  const DOCS = {
    ...HERO,
    intro: false,
    words: '.dc-copy',
    // the oval of page kept round the words is shallow under them, so the figure's light just under them stays whole;
    // and the lines' beads glint only here and there, as the footer's do, so the motes are the only sparkle near it
    lines: { ...LINES, lift: 0.08, veil: [80, 18], beadChance: 0.15 },
    // the picture's foot eased in rather than faded evenly, so that the white figure going into a dark page shows no
    // line where the fade begins
    lens: { ...LENS, foot: 'ease' },
    film: FOOTER.film,
    inks: FOOTER_INK,
    // the motes twinkle (see the glow in the strokes' shader), and the figure is drawn in plain round strokes that
    // neither bow nor taper (the even mark)
    twinkle: true,
    marks: true,
    // its light in the haze kind, which fades smoothly at its edge rather than breaking into the grain's specks as paint
    // does (`glyphs` brings it)
    glyphs: true,
    // and that light goes into the canvas's foot whole, as the photograph's frame cuts the figure off: white into a light
    // page, fading smoothly into a dark one, never breaking into specks there (see LIGHT_FOOT in the strokes' shader)
    lightFoot: true,
    land: {
      ...HERO.land,
      profile: DOCS_FAR,
      crest: 0,
      relief: [1, 1],
      sheets: [
        // a haze of sky over the far hill, thinning into the page at its top
        {
          name: 'sky',
          top: {
            crest: [
              [-1.6, -0.12],
              [0, -0.16],
              [1.6, -0.12],
            ],
          },
          foot: {
            hill: [
              [-1.6, 0.06],
              [1.6, 0.06],
            ],
          },
          paint: [
            [0, 'pale', 0],
            [0.2, 'pale', 0.32],
            [0.45, 'sky', 0.7],
            [0.7, 'slateHaze', 0.9],
            [1, 'slateHaze', 1],
          ],
          fill: 0.7,
          under: 0.38,
          flow: 1.2,
          breath: 2,
        },
        // the far hill closing the valley, which the flowers grow on: lit only along its crest, under the words, and
        // deepening soon under it, so the figure's head and shoulders stand against saturated green, as the photograph's
        // white bloom stands against its hills
        {
          name: 'meadow',
          opaque: true,
          laid: true,
          top: {
            hill: [
              [-1.6, 0],
              [1.6, 0],
            ],
          },
          foot: [
            [-1.6, 1.3],
            [1.6, 1.3],
          ],
          paint: [
            [0, 'crest', 0],
            [0.03, 'crest', 0.9],
            [0.06, 'mist', 1],
            [0.14, 'sage', 1],
            [0.3, 'fern', 1],
            [0.6, 'sage', 1],
            [1, 'fern', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.78,
          patch: 0.15,
          flow: 0.6,
          breath: 1.4,
        },
        // the left hill, lit, gilded along its crest
        {
          name: 'left hill',
          opaque: true,
          top: { crest: DOCS_LEFT },
          foot: [
            [-1.6, 1.32],
            [1.6, 1.32],
          ],
          paint: [
            [0, 'gilt', 0],
            [0.025, 'gilt', 0.85],
            [0.07, 'glow', 1],
            [0.16, 'lime', 1],
            [0.3, 'green', 1],
            [0.55, 'deepGreen', 1],
            [0.85, 'shade', 1],
            [1, 'shade', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.7,
          patch: 0.2,
          flow: 0.7,
          breath: 1.5,
          sheen: 0.6,
        },
        // the right hill, turned from the light, in shade from just under its crest
        {
          name: 'right hill',
          opaque: true,
          top: { crest: DOCS_RIGHT },
          foot: [
            [-1.6, 1.32],
            [1.6, 1.32],
          ],
          paint: [
            [0, 'lime', 0],
            [0.03, 'lime', 0.8],
            [0.08, 'green', 1],
            [0.22, 'deepGreen', 1],
            [0.5, 'shade', 1],
            [1, 'night', 1],
          ],
          lean: 0.3,
          fill: 0.74,
          under: 0.7,
          patch: 0.2,
          flow: 0.7,
          breath: 1.5,
          sheen: 0.5,
        },
        // the field in front, where the figure stands, in the valley's light
        {
          name: 'field',
          opaque: true,
          top: { crest: DOCS_FIELD },
          foot: [
            [-1.6, 1.34],
            [1.6, 1.34],
          ],
          paint: [
            [0, 'gilt', 0],
            [0.06, 'glow', 0.9],
            [0.25, 'lime', 1],
            [0.55, 'green', 1],
            [1, 'deepGreen', 1],
          ],
          lean: 0.3,
          fill: 0.72,
          under: 0.6,
          patch: 0.2,
          flow: 0.8,
          breath: 1.5,
          sheen: 0.8,
        },
      ],
      least: 110,
    },
    grass: FOOTER.grass,
    passer: null,
    flowers: {
      ...FOOTER.flowers,
      focus: 0.7,
      front: 1.65,
      cover: DOCS_COVER,
      drifts: DOCS_DRIFTS,
      strays: 0,
    },
    palettes: FOOTER_PALETTES,
    // the footer's paints, and the light's own: white at its heart, a breath of warmth in its glow
    paints: {
      ...FOOTER_PAINTS,
      light: ['#ffffff', '#ffffff'],
      lightWarm: ['#fffaf0', '#fff6e6'],
      lightGlow: ['#fff0cf', '#ffe6b0'],
    },
    clouds: [],
    plant: (garden) => {
      const { w, h, rand, words } = garden
      const s = clamp(w / 1232, 0.42, 1.12)
      // Where it stands: in the valley under the middle of the words, its head just under them, so tall that the
      // canvas's foot cuts it off at the thighs, as the photograph's does.
      const fx = words.x
      const top = words.y + words.b + Math.max(24, 28 * s)
      const tall = (h - top) * 1.07
      const at = ([x, y]) => [fx + x * tall, top + y * tall]
      const rings = [DOCS_SILHOUETTE.outer.map(at), ...DOCS_SILHOUETTE.holes.map((r) => r.map(at))]
      let left = Number.POSITIVE_INFINITY
      let right = Number.NEGATIVE_INFINITY
      for (const [x] of rings[0]) {
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
      if (window.__dcDebug) {
        window.__dcDebug.figure = {
          fx: Math.round(fx),
          top: Math.round(top),
          tall: Math.round(tall),
          wide: Math.round(right - left),
        }
      }
      let laid = 0
      // A stroke's seed also sets how much lighter or darker, warmer or cooler than its paint it comes out (see the
      // strokes' shader): for the light, take the first seed near its own that makes it lighter and warmer, so that no
      // stroke of it comes out a cool grey.
      const bright = (seed) => {
        for (let k = 0; k < 24; k += 1) {
          rand.reseed(seed + k * 104729)
          // (its sway takes three draws first: lean, phase and growth)
          rand()
          rand()
          rand()
          const dice = rand()
          if ((dice * 91.7) % 1 >= 0.55 && (dice * 37.3) % 1 >= 0.55) {
            return seed + k * 104729
          }
        }
        return seed
      }
      const put = (n, o) => {
        rand.reseed(o.light ? bright(51749 + n * 7919) : 51749 + n * 7919)
        laid += 1
        garden.dab({
          stiff: 1,
          lean: 0,
          blur: 0.6,
          load: 0.97,
          kind: 0.25 + DOCS_EVEN,
          ...o,
          order: o.order + laid * 1e-7,
        })
      }
      // Where a column down the canvas crosses the figure: its runs of figure, top to bottom (even-odd, so the light at
      // its waist is left out).
      const runsAt = (x) => {
        const ys = []
        for (const r of rings) {
          for (let i = 0; i < r.length; i += 1) {
            const [x1, y1] = r[i]
            const [x2, y2] = r[(i + 1) % r.length]
            if (x1 <= x !== x2 <= x) {
              ys.push(y1 + ((x - x1) * (y2 - y1)) / (x2 - x1))
            }
          }
        }
        ys.sort((a, b) => a - b)
        const runs = []
        for (let i = 0; i + 1 < ys.length; i += 2) {
          runs.push([ys[i], ys[i + 1]])
        }
        return runs
      }
      const inFigure = (x, y) => runsAt(x).some(([a, b]) => y > a && y < b)
      const HAZE = 0.4 + DOCS_EVEN
      // Its body filled in columns, each run in short lengths so no stroke tapers far from its ends; and down to a little
      // past the canvas's foot, which cuts it off there (its light goes into the foot whole: see `lightFoot`).
      const fill = (n, { col, blur, load, paints, order }) => {
        let k = n
        for (let x = left + col / 2; x < right; x += col) {
          for (const [a, b0] of runsAt(x)) {
            const b = Math.min(b0, h + 24)
            if (b - a < 0.6) {
              continue
            }
            const segs = Math.max(1, Math.round((b - a) / (col * 4)))
            const seg = (b - a) / segs
            for (let q = 0; q < segs; q += 1) {
              const long = seg / 2 + col * 0.55
              put(k, {
                x,
                y: a + (q + 0.5) * seg,
                long,
                wide: clamp((col * 0.78) / long, 0.02, 1.4),
                turn: Math.PI / 2,
                paints,
                load,
                blur,
                kind: HAZE,
                order,
                light: true,
              })
              k += 1
            }
          }
        }
        return k
      }
      // Its light, from the widest to the brightest, all in the smooth haze kind: a faint wash of light over the valley
      // round it and an aura that hugs its body, gone by about a fifth of its height out, as the photograph's is; its
      // glow, wide and then close; and the figure, white, its edge soft rather than cut out, so its shape is the light's
      // own. It stands in front of everything, the land, the flowers and the grass, as nothing crosses the figure in the
      // photograph.
      const ord = h + 60
      put(1, {
        x: fx,
        y: top + tall * 0.45,
        long: tall * 0.95,
        wide: 0.72,
        turn: Math.PI / 2,
        paints: ['lightGlow', 'lightWarm'],
        load: 0.12,
        blur: tall * 0.42,
        kind: HAZE,
        order: ord - 0.1,
        light: true,
      })
      put(2, {
        x: fx,
        y: top + tall * 0.42,
        long: tall * 0.55,
        wide: 0.5,
        turn: Math.PI / 2,
        paints: ['lightWarm', 'lightGlow'],
        load: 0.36,
        blur: tall * 0.15,
        kind: HAZE,
        order: ord - 0.09,
        light: true,
      })
      fill(50000, {
        col: Math.max(5, tall * 0.026),
        blur: tall * 0.13,
        load: 0.38,
        paints: ['lightGlow', 'lightWarm'],
        order: ord - 0.085,
      })
      fill(100000, {
        col: Math.max(3.5, tall * 0.018),
        blur: tall * 0.065,
        load: 0.72,
        paints: ['lightWarm', 'light'],
        order: ord - 0.08,
      })
      fill(200000, {
        col: Math.max(2.4, tall * 0.01),
        blur: tall * 0.022,
        load: 0.9,
        paints: ['light', 'lightWarm'],
        order: ord - 0.07,
      })
      // (its edge no softer than this, or the shape goes vague)
      fill(300000, {
        col: Math.max(1.6, tall * 0.0065),
        blur: Math.max(1.6, tall * 0.007),
        load: 1,
        paints: ['light', 'light'],
        order: ord - 0.06,
      })
      // The motes: small round lights near it, each twinkling at its own pace, a few large and soft; none over the words,
      // and none on the figure, where one reads as a blinking eye on a blank face.
      for (let i = 0; i < 20; i += 1) {
        const n = 5000 + i * 3
        const a = hashed(n * 1.3) * Math.PI * 2
        const d = 0.4 + 0.75 * hashed(n * 2.1)
        const x = fx + Math.cos(a) * d * tall * 0.75
        const y = top + tall * 0.45 + Math.sin(a) * d * tall * 0.42
        if ((y < top + 6 && Math.abs(x - words.x) < words.a + 30) || inFigure(x, y)) {
          continue
        }
        const big = hashed(n * 4.1) < 0.25
        const core = Math.max(1.2, (big ? 3.4 + 2 * hashed(n * 3.7) : 1.4 + 1.6 * hashed(n * 3.7)) * s)
        put(n, {
          x,
          y,
          long: core * (big ? 2.6 : 4),
          wide: 1,
          turn: 0,
          paints: ['lightGlow', 'lightWarm'],
          load: big ? 0.55 : 0.42,
          kind: 3.25,
          blur: core * (big ? 1.6 : 3.2),
          order: ord + 0.2,
        })
        put(n + 1, {
          x,
          y,
          long: core,
          wide: 0.95,
          turn: 0,
          paints: ['light', 'lightWarm'],
          load: big ? 0.75 : 0.95,
          kind: 3.4,
          blur: big ? core * 0.5 : 0.4,
          order: ord + 0.21,
        })
      }
    },
  }

  /* --- the collage compositions ---------------------------------------------------------------------- */

  /* The three small pictures scattered round the headless page's closing call to action, as a collage: two hands of
     light, a butterfly over water, and daisies out of focus. Each is its own composition, painted with the meadow's
     brush and drawn live, in idle time once it is within three screens and painted when within one, as the window is. */

  /* Two hands raised in a warm glow, painted after the photograph Cameron sent: the photograph is kept as a grid of its
     colours (a cell for every ten of its pixels, in 32 tones from coral to white), and the frame is painted from it a
     stroke to a cell, each stroke laid along the light's contours, so the fingers keep the photograph's soft bends and
     the layers where one curls over another, and the arms go down into the glow as they do there. Each hand waves,
     slowly and gently, as one piece: the strokes on it and in its glow are rooted together at its arm's foot under the
     frame and lean with the same breath of wind, the glow less the further it is from the hand, so it bends softly with
     the hand rather than tearing from the orange round it. A few small lights twinkle round the fingers. */
  const HANDS_PHOTO = {
    grid: [100, 116],
    palette: [
      '#eb8964',
      '#ee8b65',
      '#f08b60',
      '#f48d5b',
      '#f88f55',
      '#fd924d',
      '#fd9252',
      '#fd9849',
      '#fd9d54',
      '#fda446',
      '#fda35c',
      '#fda86a',
      '#fdaf55',
      '#fdb347',
      '#fdb565',
      '#fdb57a',
      '#fdbe52',
      '#fdc65d',
      '#fdc290',
      '#fdc96b',
      '#fdcf78',
      '#fdd687',
      '#fddb95',
      '#fddda4',
      '#fce4b3',
      '#fdeac3',
      '#fdefd1',
      '#fef3dc',
      '#fdf5e5',
      '#fef7ec',
      '#fef8f2',
      '#fffaf5',
    ],
    cells:
      '01000000000000000000011111122222222222222222233333444666655655576788888888888888666666664444333322220000000000000000011011111112222222222222222233333444666655565777788888888aa8aaa88666666644444333322200000000000000000111111111122222222222222223333444466566555657788888aaaaaaaaaaaa888666664444443333220000000000000000011111111111222222222222223334444466555566688888aaaaaaaaaaaaaaaaa8886666664444333322000000000000000011111111111122222222222233333444446655566888888aaaabbbbbbbbbabbaaa88866666664443332200000000000000001111111121111222222222233333444455555556888888aabbbbbfffbbbbbbbbaaaa8666666644443332000000000000001001011111212122222222233333344466655556678888aaabbbfffffffffbbbbbbaaa886666664444333300000000000000111111111101012222222222333334446555555678888aaabbbfiopiffffffffbbbbaaa886666664444333000000000000000111111111110222222222233333444465555567788aaaabbffiqssoiiiifffffbbbbaa888666664444333000000000000000001111111112222222222233344446665555557788aabbbffinstspnqqniiffffbbbaa88866666644443300000000000100001111111111222222222233334444666555555888aaabbfffiptttqrttpiiiffffbbba8886666664444330110000000010000011111111122222222233333444666655777788aabbbfffinrtutqrttqniiifffbbbaa886666666444331111000000000011111111111112222222333334444666577777888aabbfffiiottutqqtspniiiifffbbbaa8666666664433011100000000000011110111112222222233334444666557777888aabbbffiinpuuutqqsrpoiiiifffbbbaa866666666443301100000000000001111021222222222333334444655657777888aaabbfffiinquuutqrtrqpniiifffbbbba88655665644330011000000000000111012222222222233333444665557777788aaabbfffiinosuuutqstttqnniiffffbbbba866556566444001100000000000001111222222222223333444455577777778aaabbbffiiinotvvutrstutroniiffffbbbbaa8665555644401110000000000000112222222222222333444665557777888aaabeefffiinnpuuvutrttttrpnmiiffffbbbba8666555644400110000000000000112222222222233334446665577778888aaeeefffiimnoquuvutrttttsqomliffffbbbbaa86655566440011100000000000222222222222233333446665577777888aaeeefffiiinnoruuuutsttttsronlkkfffbbbbba8865555544000000000000000022222222222233333444555557777888aaeeeeffiiimnopsvuuutstuuttrqomlkffffbbbbaa86555556400000000000000002222222222333334444655555777788aaeeefffimnmmnopsvuuutstvuuttsqnlkjffebbbbaaa8655556400000100000000002222222222233344444555557777888aaeeeffiipronoopsvuuutttvuutsrqnlkkjjeebbbbaa866556640000000000000002222222223323334444655557777888aaeeeffiinstrooopsvuuuttuvvutsrpmlkkjjeeebbbaaa86556560001101111110222222222223333344444655557777888aaeeffiimotutpopqtvvvtttuvvuttspmmlkjjeeeebbaaa8665566000000111111022222222223333344444465555777788aaaeefkimnpuutqopquvvvuttvvvuttspnmmmljjeeebbbaa8666666000000111012222222222233333444444455555777788aceeffimnosuutrppruvvvuttvvuuttrpooonnkjeeeebbaa8866566000000110102222222223333333444444655557777788aeeefkinoqtuutrpqsuvvutttvvutttsrrqponljjeeeebaaa886656000001110122222222333333334444446555557777888aeeefkmortuvttrqqsuuuuutuvuuttuuttsronlkjjeeebbaa886665011111111222222223333334444444666555557777888ceeefimpuvvuttrqrtuuuuuuuuuuutuutttrpnmkjjeeeebaaa8665500111111112223333333344444444466555555777788aceeefinqvvvutsrrrtuuvvuuuvvvvuttttsqomomjjjeeebaaa8666600111021122223333334444444444466555577777778aceejklnqvvvuttrrstuvuuuuuvvvuutttsrqonpnkjjeeebaaa8666601111222222233334444444444444655555777777798ceeejklnpuvvvutsssuuuuuuuuvvvuutttsrpnoqpmjhheeeaaaa866611121222223333444444444444444555557777777798ceeejklnpsvvvuutssuvuuuuuuuvvvuuttsrpprrqmjjheeebaaa866611121222333444444444446666555555557777777798ceeejklnoruvvvutttuuuuuuuuuvvvvuutsrqrsrpnkjhheebaaa86662112222233344444666666555555555555777777999ccceejklmoqtvvvuttttuuuuuvvvvvvvuuuttttsspnkjhheeeaaaa8662222233344444466666665555555555577777777999ccceejklmnpsvvvutttttttuuvvvvvvvvuuutttsrpnkjhheeeaaaa8662222333344466656655566555577777777777779999ccceejkkmnorvvvvuuuuttttuuvvvvvvvvvuuttsrqokhhgceeaaaa8662233334446666666777778887777777777777799999ccceejjklnoqvvvvuuuuuttttuuvvvvvvvvvvuttsqokjhgcceaaaa8662333444466666667888888887777777777777999999ccceejjklmnpuvvvuvvuuttttttuvvvvvvvuuuutsqokjhgcccaaaa8862334444666888888888888888887777779977999999cccehhjklmnotvvvvvvvuuutttttuuvvvvuuuvuusqokjhgcceaaaa8863344466688888aaaaaaaaaaa888999999999999999ccccghhjjklmoquvvvvvvvuuutttttuvvuuuuuuuuspokjhgcceaaaa88634444666aaaaaabbbbffbbbaaa8899999999999999ccccghhjjklmnoruvvvvvvuuuttttttuvvuuuvuuurpnkjhgcceaaaa86634466688abbbbbbffnroffbbbaa899999999999999ccccghhjjkllmnpsvvvvvvvvuuttttttuvvuuvvutrpnkjhhcceaaaa866446688aabbfffffffputoifbbbaa88999999999999ccccghhhjkklmnopsvuvvvvvvuutttttuuvuuuuutqpnkjhhcccaaaa88544688abbfiiiiiiiiouutniffbbaa8899999999999ccccgghhhjkklmopquuvvvvvvvuuttttuvvvvvutsqpmkjhhcccaaaaa866688aabfiptsoiiiiouvuqiifffbaaac999999999cccccggghhjjklmnopruvvvvvvvvuttttuvvvvvutrqpmkjhhgcccaaa88668aaabffiruutoiiintvusoiiffbbbaaccc9999cccccccggghhhjjklmnoqsvvvvvvvvuttttvvvvvvusrqpmkjhhgcccaaa88868abbffiipuvvrnnnotvvuqniiffbbbaccccccccccccccgggghhjjklmnopqtuvvvvuuutttuvvvvvvusrqomkjhhgcccaaa8888aabbfiinotvvupnnosuvusoiiiffbbeeecccccccccccccgggghhjkklmnopqtvuuuuuutttuvvvvvvtsrpomkjhhgcccaaaa888aabffinootvvvsoooquvvtqniiiffbeeeeeeeeccccccccgggghhhjkllmoopruuuuuuuttttvvvvvutsqpnlkjhhgcccaaaa888aabfinstqruvvuqoopuvvvtoniiffbeeeeeeeeeeecccccggggghhjjklmnopqsuvvvvuuuttuvvvuutsqpnlkjhhgcccaaaa888aabfiqvvurruvvspopsvvvvqniiiffffeefffffeeeecccgdggghhhjkklmnoprtvvvvuuuttuvvvuutsqpnlkjhhgccccaaa888abbfiovvvuqtvvvrpprvvvvsoniiifffffffmnmffeeeecgggggghhhjklmnopqsvvvvuuuttuvvvvuusqpnlkjhhgccccaaa888abbfinsvvvrruvvtqpquvvvupnniiifffffiqssokfjeegggggggghhjjklmnopqtvvvuuuttuuuuuuusqpnlkjhhgccccaaaa8aabbfiipvvvurtvvvrqqtvvvusonmiiifffiosttsnlkjeeegggggghhhjklmmopqsvvvuuuttuuuuutttrpnmkjhhgccccaaaa8aabbfiiouvvvtsvvvuqqtvvvuuqnnmiiikiiottttrmlkjeeggggggghhjjklmnoprtvvuuuutttttttttrpomkjhhgcccccaaa8abbffiiosvvvusuvvvrqsvvvvutpnmmiiiilosttttpmkkjehggggggghhjkllnopqsvvuuuutttttttttrqomljhhgcccccaaaaabbffinoquvvvttvvvtqrtvvvvvtpnmmlllmnsttttsolkkjjhgggggghhjkklmnopruvuuuutttttttttrqpnlkjhggccccaaa8abbffinoptvvvusuvvvsqsuvvvvvspnmmllmnqtttttrnlkkjjhgggggghjjkklnopqtvuuuuttttttttsrqpnlkjhggccccaa88abffiinopsvvvvtuvvvurrsuvvvvvsonnmmmmostttttqmlkjjhhggggghhjjklmnopsvuuuuttttttttsrqpomkjhggcccccaa8abffiinoprvvvvutvvvvtrrtvvvvvuronnnnnnqtttttsnllkjjhgggggghhjkklnopquuuuuttttttttsrrpomljhhggcccca88abffinstrrtvvvvttvvvvussuuuuuttrponnnnprsttttpmlkkjhhggggghhjjklmnopsuututttttttsssrqomljhhggcccca88abffintuvtrtvvvutuvvvvussttuutttspoonooqsttttrnmlkjjhgggggghhjklmnopqttttuutttttssssqpnlkhhggccccaa8abffinruvvrsvvvvttuvvvvtssuuuttttsqooooprtttttpmllkjhgggggghhjjklmnoprttttttttttssssrpomkjhgggcccca8abefimpuvvssuvvvutuvvvvvttuuuttttttrppppqsttttromlkjjhgggggghhjklmnopqttttttttttttssrqomljhhggccccaaabefiiotvvustvvvvvuuuvvvuuuuutttttttrpppqrtttttqnmlkjjhggggghhjjklmnoprtttttttttttsssrpnljhhgggcccaaabefiinsvvvssuuvvvvuuuuuuuuuuuuttttttsqqqrtttttspnlkkjhgggggghhjkklmnpqttttttttttttssrpomkhhgggcccc8aaeffinquvvtstuuvvvvuuuuuuuuuuuuuttttttsrstttttsromlkjhhhggggghhjklmnoprtttttttttttssrqpnljhgggdccc8aaeffimptuvutstuvvvvvvuuvvuuuuuuuuttttttttttttttrpnmlkjhhggggghhjkklmnoqsttttttttttsssrpomjhgggddcccaaeefiinquvuutsuuvvvvvuuuuuuuuuuuutttttttuttttttsqnmlkkjhgggggghhjklmnoprtttttttttttssrqomkhhgggdcccaaeeffinotuuutsstuvvvvuuuuuuuuuvuuuttttttuuuuuttsronmlkjhgggggghhjjklmnpqstttttttttttssqpnljhhggddccaaeeffimnqtuuutsttuuvvuuuuuuuuuvuuuttttttuuuuuuttsqnmlkjjhgggggghhjklmnopsttttuttttttssrqomkhhggdddc8aaeeffinostuuuutttuvvuuuuuuuuuuuuuttttuuuuuuuuttsronmlkjhgggggghhjkklnoprsttttutttttssrqpnljhgggddc8aaeeffimnqttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuvuuuuttrpomlkjhhgggggghjjklmnoqstttttttttttsrrpomkhgggddc8aaaeefiimoqstuuuvuuuuuuuuuuuuuuuuuuuuuuvvvvvvvuttsqonmkjjhggggggghjkkmnoprstttttuttttssrqomkhhggddc88aaeeffiinopstttuuuuuuuuuuuuuuuuuuuuuuvvvvvvvvuttsrpnmljjhggdgggghhjklmnoqsttttttttttssrqpnljhggddd88aaeeeffiimnortttttuuuvuuuuuuuuuuuvvvvvvvvvvvvvuttrpnmlkjhggdddggghjjlmnoprsttttttutttsrqpomkhhggdd88aaaeeeffilmnopssttttuuuuuuuuuvvuuuvvvvvvvvvvvvuutsqomlkjhggddddggghjklmnoqstttttuutttsrqponljhgggd888aaeeeefkklmmnorsstttuuuuuuuuvvuuvvvvvvvvvvvvvvutsqomlkjhggdddddgghjklmnopssttttuutttssrqpnmkhgggd888aaaaeeefkkllmnoprstttuuuuuuuuuuvvvvvvvvvvvvvvvutsqomlkjhggddddddghhjklmnprstttttttttssrqponljhggd8888aaaaeeejkkklmnnoqrsttuuuuuuuuvvvvvvvvvvvvvvvvutsromlkjhgcddddddgghjklmnoqsstttttttttsrqqpnmkhggd6888aaaaeeeeejjklmmnopqsttuuuuuvvvvvvvvvvvvvvvvvvutsqomlkjhgdddddddgghhjklmoprstttttttttssrqpomkhggd68888aaccceeeejjkllmmnoqsttuuuuvvvvvvvvvvvvvvvvvuutsqnmlkjhgddddddddgghjklmnoqssttttttttssrqponljhgg5688888aacccceejjkklmmnoprttuuuuuvvvvvvvvvvvvvvvuttrpnmkkjecdddddddddghjjllnoprstttttttttsrqqpomkhhg55688888acccccehjjjkllmnoprtttuuuuvvvvvvvvvvvvvvvttronmkjhecdddddddddgghjklmnprstttttttttssrqppnljhg55558888aaaccccehhjkkklmnoprtttttuuuvvvvvvvvvvvvuttqomlkjhecdddddddddgghjklmnoqssttttttttssrqppomkhg5555688888acccccghhjjkllmnoprtttttuuvvvvvvvvvuuuutsqomlkjeccddddddddddghhjklmoprsttttttttssrqqponljh6555568888aacccccghhjjkllmnopsttttttuuvvvvvvvuutttsqnmlkjecccdddddddddgghjklmnprssttttttttssrqppnmkh6655558888a889cccgghhjjkklmnoprstttttuuuvvvvvuutttspnmkjjecccdddddddddgghjklmnoqrsttttttttssrqqponlj66555568888889ccccgghhhjkllmnopqssstttttuvvvuuttttspnlkjeecccd99ddddddggghjklmoqrsttttttttssrqqppnmk4655555688888899ddcgghhjjkllmnopqssssttttuuuuuttttrpnlkjeeccd9999ddddddgghjklmnprstttttttttsrrqppomk44655555668888999dccgghhhjklmmnopqsssssttttttttttsrpnlkjeccc99999ddddddgghhjkmnoqrsstttttttssrqqponl34465555558888999ddddgghhjkklmnooprsssssttttuttttsronlkjeccc999999ddddddghhjklmoqrsstttttttssrqqppom344465555577888999ddddggghjjklmnopqssssstttuuuttsrqomlkjeccc999999ddddddghhjklmnprsstttttttssrrqppon334466555557777799dddddgghhjkllmnoprsssstttuutttsrqomlkjeccc9999999dddddgghhklmnorrssttttttssrrqqpon3344466555555577999dddddgghhjklmmnorsrssttuuutttsrpnmlkeeccc9999999dddddggghjklmoqrssttttttsssrqqppo33344465555575777999dddddgghjjklmnorsrssttuuutttsrpnmljeecc99999999ddddddgghjklmnprssttttttsssrqqppo333344465555577779999ddddgghhjklmnorrrsstuuuutttsrpnmkjeecc99999999ddddddgghhklmmprssstttttsssrrqppo3333344665555557779999dddggghjkklnorrrsstuuuutttsrpnlkjeecc999999999dddddggghjklmoqrsstttttsssrrqqpo2333344465555555779999ddddgghjkklnorrrsttuuuutttsronlkjeecc9999999999ddddggghjklmnprrsstttttsssrqqpo22333344665555577799999ddddgghjklnorrrsttuuuutttsronlkjeecc9999999999dddddgghjjklmpqrssssssssssrqqpp22333344666555557779999ddddgghjklnpsrrstuuvuutttsqonlkjeccc9999999999dddddgghhjklmoqrssssssssssrqqpp222233346665555577799999dddgghjklnpsssstuuuuutttrqonlkjeccc9999999999dddddggghjkkmnqrrsssssssssrqqpp222233344465555577779999dddcghjklnpsssttuvvvutttrqnmlkeecc999999999999dddddgghhjklmprrsssssssssrqqpp222233344446555557779999dddcghjklnpssstuuuvvutttrpnmlfeeccc99999999999dddddggghjklmoqrsssssssssrrqpp2222333344465555577779999dddghjkmnpssstuvvvvuttsrpnmlfeecc999999999999ddddddgghhjklnqrrssssssssrrqqp2222333334465555557779999ddggjklmnqssstuvvvvuttsrpnmlfeecc999999999999ddddddggghjklmprrssssssssrrqqp2222233334465555577779999ddcgjklmnqssstuvvvvuttsqonlkjeecc9999999999999ddddddgghjklmoqrrssssssssssrr2222223334466555557779999ddchjklmoqssstuuvvvuttsqonlkjeecc9999999999999ddddddgghhjklnqrrssssssstssss2222223334466555557779999ddcejklmoqssttuuvvuuttsqomlkjeecc99999999999999ddddddgghjklmpqrrrsssstttsss2222223334445555557779999dccejklmorssttuuvvuuttsqomlkjeecc99999999999999ddddddgghhkkloqqrrrssttttsss2222222334446555577779999dccejklmorssttuuvvuuttsqomlkfeecc999999999999999dddddggghjklnqqrrrrrtttssss2222222333444555577779999dccejklnorrsttuuuuuuttspnmlkfeecc999999999999999dddddggghjklmpqqrrrrtttssss222222233344455557777999ddcgejklnpsssttuuuuuuttrpnmlkeeccc9999999999999999dddddgghjjkloqqqqrrtttssss222222233344455557777999ddcghjkmnpsssttuuuuutttrpnmkkeecc99999999999999999dddddgghhjkloqqqqrrttssssr',
  }
  // a tone a little deeper for a dark page
  const handsDim = (hex) => {
    const v = Number.parseInt(hex.slice(1), 16)
    const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((n) => Math.round(n * 0.92))
    return `#${c.map((n) => n.toString(16).padStart(2, '0')).join('')}`
  }
  const HANDS_TONES = Object.fromEntries(HANDS_PHOTO.palette.map((hex, i) => [`tone${i}`, [hex, handsDim(hex)]]))
  // how far the wind can turn a hand (0 none, 1 as freely as the grass); how far round it, in cells of the photograph,
  // its glow goes with it whole, and how far it goes with it at all
  const HANDS_GIVE = 0.85
  const HANDS_HOLD = 9
  const HANDS_REACH = 30
  const HANDS_EVEN = 0.005
  const HANDS = {
    ...HERO,
    intro: false,
    wake: '300% 0px',
    near: '100% 0px',
    // no words in the frame: the box the paint keeps clear of is off it
    words: { at: [0.5, -4], half: [0.001, 0.001] },
    lines: { ...LINES, veil: [0, 0], veilCore: 0.5, sink: 0.001 },
    inks: {
      ...LAND_INK,
      coral: [HANDS_PHOTO.palette[0], handsDim(HANDS_PHOTO.palette[0])],
      ember: [HANDS_PHOTO.palette[7], handsDim(HANDS_PHOTO.palette[7])],
      amber: [HANDS_PHOTO.palette[13], handsDim(HANDS_PHOTO.palette[13])],
    },
    sky: {
      stops: [
        [0, 'coral'],
        [0.5, 'ember'],
        [1, 'amber'],
      ],
      grain: 0.42,
      brush: 0.06,
      wash: 'ember',
    },
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: 100,
      foot: ({ h }) => h - 100,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    glyphs: true,
    twinkle: true,
    marks: true,
    paints: {
      ...PAINTS,
      ...HANDS_TONES,
      light: ['#ffffff', '#ffffff'],
      lightWarm: ['#fffaf0', '#fff6e8'],
      lightGlow: ['#fff3cc', '#ffedbc'],
      halo: ['#ffd25e', '#ffc650'],
    },
    clouds: [],
    flock: [],
    lens: null,
    fit: (w) => clamp(w / 300, 0.5, 1),
    plant: (garden) => {
      const { w, h, rand } = garden
      const [gw, gh] = HANDS_PHOTO.grid
      const cells = HANDS_PHOTO.cells
      // the photograph covers the frame, its middle on the frame's
      const cw = Math.max(w / gw, h / gh)
      const ox = (w - gw * cw) / 2
      const oy = (h - gh * cw) / 2
      const lum = HANDS_PHOTO.palette.map((hex) => {
        const v = Number.parseInt(hex.slice(1), 16)
        return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255
      })
      const toneAt = (gx, gy) => Number.parseInt(cells[clamp(gy, 0, gh - 1) * gw + clamp(gx, 0, gw - 1)], 36)
      const L = (gx, gy) => lum[toneAt(gx, gy)]
      // The hands: the photograph's lightest cells, the left hand's left of the gap between them, the right's right of
      // it. How far each cell is from either, in cells (a chamfer distance, two passes).
      const BRIGHT = 24
      // the line between the hands, down the orange between them: clear of the right thumb above and of both arms below
      const splitAt = (gy) => gw * (0.44 + (0.14 * gy) / gh)
      const far = gw + gh
      const dists = [0, 1].map((hand) => {
        const d = new Float32Array(gw * gh).fill(far)
        for (let gy = 0; gy < gh; gy += 1) {
          for (let gx = 0; gx < gw; gx += 1) {
            const mine = hand === 0 ? gx < splitAt(gy) : gx >= splitAt(gy)
            if (mine && toneAt(gx, gy) >= BRIGHT) {
              d[gy * gw + gx] = 0
            }
          }
        }
        const pass = (dir) => {
          const ys = dir > 0 ? [...Array(gh).keys()] : [...Array(gh).keys()].reverse()
          const xs = dir > 0 ? [...Array(gw).keys()] : [...Array(gw).keys()].reverse()
          for (const gy of ys) {
            for (const gx of xs) {
              let v = d[gy * gw + gx]
              const near = [
                [-dir, 0, 1],
                [0, -dir, 1],
                [-dir, -dir, 1.414],
                [dir, -dir, 1.414],
              ]
              for (const [dx, dy, c] of near) {
                const x = gx + dx
                const y = gy + dy
                if (x >= 0 && x < gw && y >= 0 && y < gh) {
                  v = Math.min(v, d[y * gw + x] + c)
                }
              }
              d[gy * gw + gx] = v
            }
          }
        }
        pass(1)
        pass(-1)
        return d
      })
      const toCanvas = (gx, gy) => [ox + gx * cw, oy + gy * cw]
      const hands = [
        { pivot: toCanvas(gw * 0.42, gh * 1.25), phase: 1.3 },
        { pivot: toCanvas(gw * 0.74, gh * 1.32), phase: 4.4 },
      ]
      const HAZE = 0.4 + HANDS_EVEN
      // A stroke whose middle is at x, y: on a hand or in its glow, rooted at the hand's pivot under the frame, with
      // its stem leaning just so far that its head is where it is put and a stiffness that lets the wind turn it as
      // much as its hand, less the further it is from it; anywhere else, rooted straight under it and still.
      // A stroke's seed also sets how much lighter or darker, warmer or cooler than its paint it comes out (see the
      // strokes' shader): the photograph is smooth, so take the first seed near a stroke's own that leaves its tone
      // nearly as it is.
      const calm = (seed) => {
        for (let k = 0; k < 60; k += 1) {
          rand.reseed(seed + k * 104729)
          rand()
          rand()
          rand()
          const dice = rand()
          if (Math.abs(((dice * 91.7) % 1) - 0.5) < 0.08 && Math.abs(((dice * 37.3) % 1) - 0.5) < 0.15) {
            return seed + k * 104729
          }
        }
        return seed
      }
      const put = (n, { x, y, hand, weight, turn, ...o }) => {
        rand.reseed(calm(71011 + n * 7919))
        if (hand && weight > 0.02) {
          const dx = x - hand.pivot[0]
          const up = hand.pivot[1] - y
          const stem = Math.hypot(dx, up)
          const lean = Math.atan2(dx, up)
          garden.dab({
            kind: HAZE,
            ...o,
            x: hand.pivot[0],
            y: hand.pivot[1],
            stem,
            lean,
            phase: hand.phase,
            stiff: 1 - HANDS_GIVE * weight,
            turn: turn - lean * 0.7,
          })
          return
        }
        const root = h + 40
        garden.dab({ kind: HAZE, ...o, x, y: root, stem: root - y, lean: 0, stiff: 1, turn })
      }
      // A stroke to a cell, laid along the light's contour there (across the way it changes), a little jittered, and
      // painted in the cell's tone: the background first, then the glow and the hands over it, from the top down.
      for (let gy = 0; gy < gh; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const n = gy * gw + gx
          const [cx, cy] = toCanvas(
            gx + 0.5 + (hashed(n * 1.31) - 0.5) * 0.5,
            gy + 0.5 + (hashed(n * 2.17) - 0.5) * 0.5,
          )
          if (cx < -cw * 2 || cx > w + cw * 2 || cy < -cw * 2 || cy > h + cw * 2) {
            continue
          }
          const tone = toneAt(gx, gy)
          const ddx = L(gx + 1, gy) - L(gx - 1, gy)
          const ddy = L(gx, gy + 1) - L(gx, gy - 1)
          const flat = Math.hypot(ddx, ddy) < 0.012
          const turn =
            (flat ? 0.9 + 0.6 * Math.sin(gx * 0.11 + gy * 0.07) : Math.atan2(ddy, ddx) + Math.PI / 2) +
            (hashed(n * 3.7) - 0.5) * 0.5
          // each side of the gap between the hands goes with its own hand, so no stroke of one arm moves with the other,
          // and along the line between them nothing moves, so the orange there stretches as the hands lean rather than
          // opening into a seam
          const which = gx < splitAt(gy) ? 0 : 1
          const d = dists[which][n]
          const weight = (1 - smooth(HANDS_HOLD, HANDS_REACH, d)) * smooth(1, 9, Math.abs(gx + 0.5 - splitAt(gy)))
          const lit = tone >= BRIGHT
          put(n, {
            x: cx,
            y: cy,
            hand: hands[which],
            weight,
            turn,
            long: cw * (lit ? 1.35 : 1.5),
            wide: lit ? 0.85 : 0.9,
            blur: cw * (lit ? 0.9 : 1.25),
            paints: [`tone${tone}`, `tone${tone}`],
            load: lit ? 1 : 0.95,
            // the light in solid strokes, so where they overlap they keep one tone, the rest in the haze kind
            kind: lit ? 0.25 + HANDS_EVEN : HAZE,
            order: (weight > 0.02 ? 1000 + which * 1000 : 0) + gy * 0.01 + (lit ? 500 : 0),
          })
        }
      }
      // A few small lights round the fingers, which keep their places by the hand as it moves and twinkle, each at its
      // own pace: in the gold just past the fingertips, a few cells out from the hand, never on it.
      const tips = []
      for (let gy = 0; gy < gh * 0.55; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const n = gy * gw + gx
          const which = gx < splitAt(gy) ? 0 : 1
          const d = dists[which][n]
          if (d >= 2 && d <= 5 && hashed(n * 9.1) > 0.965) {
            tips.push([gx, gy, which, n])
          }
        }
      }
      tips.slice(0, 16).forEach(([gx, gy, which, n], j) => {
        const [x, y] = toCanvas(gx + 0.5, gy + 0.5)
        const core = Math.max(0.9, cw * (0.35 + 0.5 * hashed(n * 4.7)))
        put(900000 + j * 2, {
          x,
          y,
          hand: hands[which],
          weight: 1,
          turn: 0,
          long: core * 4,
          wide: 1,
          paints: ['lightGlow', 'halo'],
          load: 0.5,
          kind: 3.25,
          blur: core * 3,
          order: 5000,
        })
        put(900001 + j * 2, {
          x,
          y,
          hand: hands[which],
          weight: 1,
          turn: 0,
          long: core,
          wide: 0.95,
          paints: ['light', 'lightWarm'],
          load: 0.95,
          kind: 3.4,
          blur: 0.4,
          order: 5001,
        })
      })
    },
  }

  /* Daisies out of focus, after the photograph Cameron sent: three of them seen from below against the light, so near
     and so soft that only their shapes are left, white petals going lilac where they turn away, warm yellow hearts,
     and a stem rising to the nearest one, all on the meadow's soft green instead of the photograph's sky. Each sways a
     very little on its own stem. Butterflies come in through the glass at the frame's sides and land on the petals,
     sit opening and closing their wings, and are off again when the pointer comes over the flowers. A few small
     lights twinkle among them. */
  const DAISIES_INKS = {
    ...LAND_INK,
    // the meadow's light behind them, from the top of the frame down: a deep sage, a softer green, and a pale lime
    sage: ['#6f8f62', '#5f7d54'],
    moss: ['#8fae6f', '#7c9b5f'],
    lime: ['#c4dc94', '#adc683'],
  }
  /* The daisies, as the photograph frames them: each heart's place, in shares of the frame's width and height, and how
     far its petals reach, in shares of its width; the nearest at the top, mostly over the frame's edge, one off the
     left side and a smaller one low on the right. Each sways about a point well under the frame, at its stem's foot. */
  const DAISIES_HEADS = [
    { at: [0.6, 0.12], reach: 0.25, foot: [0.5, 1.9], phase: 0.6, turn: 0.35 },
    { at: [0.03, 0.58], reach: 0.23, foot: [0.1, 2.1], phase: 2.9, turn: 1.1 },
    { at: [0.95, 0.84], reach: 0.18, foot: [0.86, 2.3], phase: 4.7, turn: 0.2 },
  ]
  // where the butterflies sit: on the petals of each, a little out from its heart
  const DAISIES_PERCHES = [
    [0.47, 0.25, 1],
    [0.7, 0.27, -1],
    [0.16, 0.53, -1],
    [0.84, 0.7, 1],
  ]
  // how freely the wind turns a flower (the collage's hands: 0.85)
  const DAISIES_GIVE = 0.25
  const DAISIES_EVEN = 0.005
  const DAISIES = {
    ...HERO,
    intro: false,
    wake: '300% 0px',
    near: '100% 0px',
    words: { at: [0.5, -4], half: [0.001, 0.001] },
    lines: { ...LINES, veil: [0, 0], veilCore: 0.5, sink: 0.001 },
    inks: DAISIES_INKS,
    sky: {
      stops: [
        [0, 'sage'],
        [0.5, 'moss'],
        [1, 'lime'],
      ],
      grain: 0.42,
      brush: 0.06,
      wash: 'moss',
    },
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: 100,
      foot: ({ h }) => h - 100,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    glyphs: true,
    twinkle: true,
    marks: true,
    paints: {
      ...PAINTS,
      // the petals: white in the light, lilac where they turn away, and the soft white glow round them
      petal: ['#fbfafa', '#f6f4f5'],
      petalLight: ['#ffffff', '#fdfcfd'],
      petalShade: ['#e8dcec', '#ded1e4'],
      petalGlow: ['#f1f3e6', '#e6eadb'],
      // the hearts: a warm yellow, deeper towards the edge
      heart: ['#f4c14a', '#efb941'],
      heartDeep: ['#eaa83c', '#e29f36'],
      heartLight: ['#f8d26e', '#f4ca62'],
      // the stem: a deeper, fuller green than the meadow's light behind it
      stem: ['#5a9445', '#50873d'],
      stemLight: ['#7fb25e', '#72a454'],
      light: ['#ffffff', '#ffffff'],
      lightWarm: ['#fdfff4', '#f8fbea'],
      lightGlow: ['#f4fbd6', '#ecf5c7'],
      halo: ['#e6f3a8', '#d8e897'],
    },
    clouds: [],
    // the glass at the frame's sides, which the butterflies come in through, and none at its foot: this one is framed
    lens: { ...LENS, foot: false, top: false },
    flock: Array.from({ length: 4 }, (_, k) => ({
      size: 9 + 2 * ((k * 0.7549 + 0.31) % 1),
      seed: Math.round(((k * 0.618 + 0.27) % 1) * 100) / 100,
      pastel: k % 3,
      wing: WING_NAMES[(k * 2 + 1) % 3],
      flit: false,
    })),
    perch: {
      stay: [6, 15],
      reach: 50,
      flit: [3, 6],
      hop: 70,
      come: 120,
      flee: 220,
      back: 2.4,
      every: [0.6, 1.4],
      appear: 0,
      arrive: 0,
      first: 0,
      beat: 8,
      wings: [1.38, 0.3],
      rest: [3.5, 6.5],
      sit: [0.12, -0.35, 1.05],
      lift: 0.35,
      flutter: 5,
      clear: 10,
      climb: 0.3,
      swerve: 30,
      rise: 40,
    },
    fit: (w) => clamp(w / 300, 0.55, 1),
    plant: (garden) => {
      const { w, h, rand } = garden
      const size = Math.min(w, h * 1.25)
      const HAZE = 0.4 + DAISIES_EVEN
      // A stroke's seed also sets how much lighter or darker, warmer or cooler than its paint it comes out (see the
      // strokes' shader): take the first seed near its own that leaves its tone nearly as it is.
      const calm = (seed) => {
        for (let k = 0; k < 60; k += 1) {
          rand.reseed(seed + k * 104729)
          rand()
          rand()
          rand()
          const dice = rand()
          if (Math.abs(((dice * 91.7) % 1) - 0.5) < 0.08 && Math.abs(((dice * 37.3) % 1) - 0.5) < 0.15) {
            return seed + k * 104729
          }
        }
        return seed
      }
      // A stroke on a flower is rooted at its stem's foot under the frame, its stem leaning just so far that its head
      // is where it is put, and turns a little in the wind with the rest of the flower; anything else stays still.
      const put = (n, { x, y, turn = 0, head = null, ...o }) => {
        rand.reseed(calm(67021 + n * 7919))
        if (head) {
          const [fx, fy] = head.foot
          const dx = x - fx
          const up = fy - y
          const lean = Math.atan2(dx, up)
          garden.dab({
            kind: HAZE,
            ...o,
            x: fx,
            y: fy,
            stem: Math.hypot(dx, up),
            lean,
            phase: head.phase,
            stiff: 1 - DAISIES_GIVE,
            turn: turn - lean * 0.7,
          })
          return
        }
        const root = h + 40
        garden.dab({ kind: HAZE, ...o, x, y: root, stem: root - y, lean: 0, stiff: 1, turn })
      }
      const heads = DAISIES_HEADS.map((f) => ({
        x: f.at[0] * w,
        y: f.at[1] * h,
        r: f.reach * w,
        turn: f.turn,
        foot: [f.foot[0] * w, f.foot[1] * h],
        phase: f.phase,
      }))
      let n = 0
      // The stem of the nearest, a soft blade of fuller green rising from the frame's foot to a point under its heart, as
      // the photograph's leaf does, wide at the foot and narrowing, its lit side a little paler.
      const top = heads[0]
      const stemTop = [top.x - top.r * 0.3, top.y + top.r * 1.05]
      const stemFoot = [w * 0.46, h * 1.04]
      const rows = 22
      for (let k = 0; k < rows; k += 1) {
        const t = k / (rows - 1)
        const y = stemFoot[1] + (stemTop[1] - stemFoot[1]) * t
        const x = stemFoot[0] + (stemTop[0] - stemFoot[0]) * t
        const half = (0.15 * (1 - t) ** 1.2 + 0.012) * w
        const step = (stemFoot[1] - stemTop[1]) / (rows - 1)
        for (const side of [-1, 1]) {
          n += 1
          put(n, {
            x: x + side * half * 0.45,
            y,
            turn: Math.PI / 2 + Math.atan2(stemTop[0] - stemFoot[0], stemFoot[1] - stemTop[1]),
            long: step * 2.4,
            wide: clamp((half * 1.15) / (step * 2.4), 0.15, 1.6),
            blur: Math.max(2, half * 0.55),
            paints: side > 0 ? ['stemLight', 'stem'] : ['stem', 'stem'],
            load: 0.5,
            order: 10 + t,
            head: top,
          })
        }
      }
      // Each daisy, the furthest first: a soft white glow round it, then its petals as long soft strokes reaching out
      // from the heart, white, going lilac at the tips on its far side, twice round so they close into one soft shape,
      // then the heart, warm yellow, deeper at its edge and paler high on its near side.
      ;[1, 2, 0].forEach((index, depth) => {
        const f = heads[index]
        const base = 100 + depth * 100
        for (let k = 0; k < 8; k += 1) {
          n += 1
          const a = (k / 8) * Math.PI * 2 + f.turn
          put(n, {
            x: f.x + Math.cos(a) * f.r * 0.6,
            y: f.y + Math.sin(a) * f.r * 0.6,
            turn: a + Math.PI / 2,
            long: f.r * 0.9,
            wide: 0.7,
            blur: f.r * 0.38,
            paints: ['petalGlow', 'petalGlow'],
            load: 0.16,
            order: base,
            head: f,
          })
        }
        // ten petals, each its own soft lobe, then ten more between them, fainter, so the ring closes softly
        for (let pass = 0; pass < 2; pass += 1) {
          const count = 10
          for (let k = 0; k < count; k += 1) {
            n += 1
            const a = ((k + pass * 0.5) / count) * Math.PI * 2 + f.turn + (hashed(n * 1.7) - 0.5) * 0.2
            const reach = f.r * (0.85 + 0.25 * hashed(n * 2.3))
            const away = Math.sin(a + 0.9) > 0.35
            put(n, {
              x: f.x + Math.cos(a) * reach * 0.56,
              y: f.y + Math.sin(a) * reach * 0.56,
              turn: a,
              long: reach * 0.84,
              wide: 0.5,
              blur: f.r * (0.17 + 0.06 * pass),
              paints: away ? ['petal', 'petalShade'] : ['petalLight', 'petal'],
              load: pass ? 0.45 : 0.78,
              order: base + 10 + pass,
              head: f,
            })
          }
        }
        const heart = f.r * 0.3
        put(++n, {
          x: f.x,
          y: f.y,
          long: heart * 1.45,
          wide: 1,
          blur: heart * 0.5,
          paints: ['heartDeep', 'heartDeep'],
          load: 0.9,
          order: base + 40,
          head: f,
        })
        put(++n, {
          x: f.x,
          y: f.y,
          long: heart * 1.15,
          wide: 1,
          blur: heart * 0.42,
          paints: ['heart', 'heart'],
          load: 0.95,
          order: base + 41,
          head: f,
        })
        put(++n, {
          x: f.x - heart * 0.15,
          y: f.y - heart * 0.16,
          long: heart * 0.7,
          wide: 1,
          blur: heart * 0.35,
          paints: ['heartLight', 'heart'],
          load: 0.8,
          order: base + 42,
          head: f,
        })
      })
      // A few small lights among them, twinkling each at its own pace.
      for (let i = 0; i < 7; i += 1) {
        const m = 5000 + i * 3
        const x = w * (0.12 + 0.76 * hashed(m * 1.3))
        const y = h * (0.3 + 0.62 * hashed(m * 2.1))
        const core = Math.max(0.9, size * (0.004 + 0.005 * hashed(m * 4.7)))
        put(m, {
          x,
          y,
          long: core * 4,
          wide: 1,
          paints: ['lightGlow', 'halo'],
          load: 0.5,
          kind: 3.25,
          blur: core * 3,
          order: 900,
        })
        put(m + 1, {
          x,
          y,
          long: core,
          wide: 0.95,
          paints: ['light', 'lightWarm'],
          load: 0.95,
          kind: 3.4,
          blur: 0.4,
          order: 901,
        })
      }
      // The butterflies' places, and the flowers as the shape the pointer sends them off from.
      for (const [px, py, facing] of DAISIES_PERCHES) {
        garden.perch(px * w, py * h, facing)
      }
      garden.tree(w * 0.5, h * 0.45, size * 0.48)
    },
  }
  /* A butterfly of light over still water, and her light given back by it, after the glowing butterflies Cameron sent:
     a clear blue sky, paler and a little warm down at the horizon, the sea under it a deeper blue, both grainy. She
     keeps to one place in the air, on the wing there (perch.hover), a warm white with a soft halo of light round her
     (lens.glow), and the water gives her light back under her, softer and broken by its ripples (lens.mirror). The
     pointer leaves her be. */
  const MIRROR_INKS = {
    ...LAND_INK,
    // from the top of the frame down: the sky, paler towards the horizon, a bright rim along it, and the sea
    zenith: ['#5a90ea', '#4a7ed6'],
    air: ['#6c9dee', '#5b8ade'],
    haze: ['#a6c0ea', '#8ba7da'],
    rim: ['#d6deeb', '#b5c3db'],
    sea: ['#3b71d3', '#2f5fbf'],
    deep: ['#2756bb', '#1e48a3'],
  }
  // the waterline, as a share of the frame's height down it
  const MIRROR_WATER = 0.6
  const MIRROR = {
    ...HERO,
    intro: false,
    wake: '300% 0px',
    near: '100% 0px',
    words: { at: [0.5, -4], half: [0.001, 0.001] },
    lines: { ...LINES, veil: [0, 0], veilCore: 0.5, sink: 0.001 },
    inks: MIRROR_INKS,
    sky: {
      stops: [
        [0, 'zenith'],
        [0.3, 'air'],
        [MIRROR_WATER - 0.07, 'haze'],
        [MIRROR_WATER - 0.006, 'rim'],
        [MIRROR_WATER, 'sea'],
        [1, 'deep'],
      ],
      grain: 0.62,
      brush: 0.04,
      wash: 'air',
    },
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: 100,
      foot: ({ h }) => h - 100,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    glyphs: true,
    marks: true,
    // the small lights about her twinkle (see the glow in the strokes' shader)
    twinkle: true,
    paints: {
      ...PAINTS,
      shimmer: ['#8db1f0', '#789cdf'],
      glint: ['#d2e1fb', '#b6cbef'],
      light: ['#fffdf6', '#fffaf0'],
      lightWarm: ['#fff4da', '#ffeed0'],
      lightGlow: ['#fff8e8', '#fff2dc'],
      halo: ['#e4ecff', '#d4e0fa'],
    },
    clouds: [],
    lens: {
      ...LENS,
      foot: false,
      top: false,
      glow: {
        core: [1.0, 0.992, 0.965],
        cream: [1.0, 0.962, 0.865],
        halo: [1.0, 0.955, 0.86],
        body: [0.02, 0.42],
        soft: 0.0075,
        near: 0.055,
        far: 0.15,
        strength: [1.05, 0.62],
      },
      mirror: { at: MIRROR_WATER, strength: 0.75, depth: 0.42, tint: [0.9, 0.93, 1.0], blur: 0.35 },
    },
    // one butterfly, large in the frame as in the photographs; the glow, not her pastel, is what shows of her
    flock: [{ size: 38, seed: 0.41, pastel: 0, wing: 'slim', flit: false }],
    perch: {
      stay: [1e6, 1e6],
      reach: 40,
      flit: [4, 7],
      hop: 60,
      come: 90,
      flee: 180,
      back: 3,
      every: [0.6, 1.2],
      appear: 0,
      arrive: 0,
      first: 0,
      beat: 3.4,
      wings: [0.45, 0.2],
      rest: [3.5, 6.5],
      sit: [0.12, -0.35, 1.05],
      lift: 0,
      flutter: 4,
      clear: 8,
      climb: 0.3,
      swerve: 24,
      rise: 30,
      hover: { pose: [1.25, -0.6, 0.25], bob: 3, sway: 2.5 },
    },
    fit: (w) => clamp(w / 176, 0.6, 1.3),
    plant: (garden) => {
      const { w, h, rand } = garden
      const water = MIRROR_WATER * h
      // A few soft streaks of light lying on the water near the horizon, still and faint.
      for (let i = 0; i < 14; i += 1) {
        const n = 300 + i
        rand.reseed(48611 + n * 7919)
        const x = w * (0.05 + 0.9 * hashed(n * 1.9))
        const y = water + h * (0.012 + 0.16 * hashed(n * 2.7) ** 1.6)
        const long = w * (0.06 + 0.16 * hashed(n * 3.3))
        const root = h + 40
        garden.dab({
          x,
          y: root,
          stem: root - y,
          long,
          wide: 0.05,
          turn: 0,
          blur: long * 0.25,
          paints: ['shimmer', 'glint'],
          load: 0.2 + 0.14 * hashed(n * 4.1),
          kind: 0.4,
          stiff: 1,
          lean: 0,
        })
      }
      // A few small lights about her, still in the air as she moves, each twinkling at its own pace.
      const motes = [
        [-0.31, -0.15],
        [0.29, -0.21],
        [0.35, 0.07],
        [-0.25, 0.14],
        [0.06, -0.29],
        [-0.39, -0.03],
        [0.17, 0.19],
      ]
      motes.forEach(([dx, dy], j) => {
        const n = 700 + j
        rand.reseed(51217 + n * 7919)
        const x = w * (0.5 + dx)
        const y = h * (0.42 + dy * 0.6)
        const core = Math.max(0.9, w * (0.006 + 0.006 * hashed(n * 4.7)))
        garden.dab({
          x,
          y,
          stem: 0,
          long: core * 4,
          wide: 1,
          turn: 0,
          blur: core * 3,
          paints: ['lightGlow', 'halo'],
          load: 0.5,
          kind: 3.25,
          stiff: 1,
          lean: 0,
        })
        garden.dab({
          x,
          y,
          stem: 0,
          long: core,
          wide: 0.95,
          turn: 0,
          blur: 0.4,
          paints: ['light', 'lightWarm'],
          load: 0.95,
          kind: 3.4,
          stiff: 1,
          lean: 0,
        })
      })
      // her place in the air over the water
      garden.perch(w * 0.5, h * 0.42, 1)
    },
  }

  /* The window in the closing card of the home page, after the picture Cameron sent: two hands raised in a lavender
     dusk to a light between them, and in that light a globe, glowing, with the Scalar mark on it (the mark and the
     globe's lines are the page's, over the canvas). The picture is kept as a grid of its colours, a cell for every six of
     its pixels in 32 tones from violet to cream, and painted a stroke to a cell along its contours, as the collage's
     hands are; over it the globe, a ball of light painted in rings round its middle, pale pink going to a bright rim,
     with a warm halo round it that the hands' fingers rise into; and a few small lights twinkling about it. The globe
     always glows; when a packet from Your API lands, the page lights it up (see headless-window.js). */
  const GLOBE_PHOTO = {
    grid: [88, 161],
    palette: [
      '#79679e',
      '#726ca2',
      '#776ca2',
      '#756da3',
      '#786da3',
      '#7e6ca2',
      '#7a71a5',
      '#8471a5',
      '#7f76a8',
      '#8d78aa',
      '#867eb0',
      '#9482af',
      '#938ac8',
      '#9e8ab4',
      '#9d8dca',
      '#a891cd',
      '#a993b9',
      '#b493cc',
      '#bf94cd',
      '#b49fc2',
      '#b0a0d3',
      '#c8a1ce',
      '#c9b5d1',
      '#e0b1d7',
      '#dcc6d9',
      '#fbc4e0',
      '#e5d6e0',
      '#fbd2e5',
      '#fad7d4',
      '#f9e2e5',
      '#fcece0',
      '#fdf3d6',
    ],
    cells:
      '50000000000000022020222222222422244422242444444444443442244333333333333311111111111118ou000000000000000000022222222222223442422222422422422233442222333333133331111111111111111m00000000000000000002222022222222222224232222222222222332222231133111131111111111111111110000000000000000002222222222222222224223224222222222222222222311211111113111111111111111000000000000000000002222222222222222422222222222222242222222233331111111311111111111111100000000000000000000222022222222222222222422222222222222334322313311111111111111111111110000000000000000000222202222222222242224422222222222222233332223113331111111113111111111000000000000020220522222222222222222244422422222422222223433222311113311111111311311111100000000000000052225222222222222442442222422444422222422324333333333331313331133131133310000000000000055255222224222222242244424444444444222222222333223333333331133111333113113000000005000005025524524442244224244442444444442222222222233322333333333333333333331333300000000555555555552255552244422244444244444444422442222322322233333333333333333333333330000000000055555555522552444444444444444342424444444224222222223233133333333333333333333000050555555555555555555244444444444242444244444444444424242322223133333333333333333633300005055555555555555555544444444444444444424444444442444422233422433434433333333466333665000555555555555555555545555544444444444444444444444422444422433433343344444336443636366555555555555555555555556555552444444444444422424444444444442243343444344446466666666666655555555555575555555555455555464444442444444242444444244442444424444444464666666666666665555555555557575557555555555554444444444444444444442244444444444444444466466666666666666555555555577577577777757557555546444444444444424444244424444444444464664666666668668866655555577777777777777777777755555646444444444244444224444444444246446666666666666668888885577777777777777777777777777755665644424444444444424444444444446666666666666668886888888557777777777777777777777777777666564444444244242444444444444666666666666888888888888888877777777777777777777777777777777666664444444424442444244444446666666666888888888888888887777777777777999979977977777777776666444444444444244444646666666666688888888888888888888777777777999999999999997777777777786666644424444244444444666666666888888888888888888888877777779999999999999999999997777776666666444444644446664666666868888888888888888aa88aaa8777779999999999999999999999999977777766666646666444666466666668888888888888a8aaaaaaaaaaa777999999999999999999999999999999777788666666666666666666668888888888a88aaaaaaaaaaaaaaaa7799999999999999999bbbbb9bb99999997777888866666686576666888888888888aaaaaaaaaaaaaaaaaaaa7999999999999bbbbbbbbbbbbbbbb9999999777787788777777778888888888aaaaaaaaaaaaaaaaaaaaaaaaa999999999b9bbbbbbbbbbbbbbbbbbbbb99999999777777777777888888888aaaaaaaaaaaaaaaaaaaaaaaaaaa9999999bbbbbbbbbbbbbbbbdddbbbbbbbbbb9999999999999999999a99999aaaaaaaaaaabbabbbbbbbbbbaaa999999bbbbbbbbbddddddddddddddddbbbbbbbbbbb9999999999999999a9aaaabbbbbbbbbbbbbbbbbbbbbbbb9999bbbbbbbbddddddddddddddddddddddddbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb9999bbbbbbbddddddddddddddgggdddddddddddddddddbdbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb9bbbbbbbddddddddddgggggggggggggggggggdddddddddddddddddbddddddddddddddddddddddddddddddddb9bbbbbbdddddddddgggggggggggggggggggggggggggggggdddddddddddddddddddddddddddddddddddddddddbbbbbddddddddggggggggggggggjjjjjjjjjjjggggggggggggggggggggdddgddddddddddddddddddddddddddbbbbbdddddddgggggigggggjjjjjjjjjjiijiiijjjjjjjjjjjggggggggggggggggggggggggggddddddddddddbbbbbdddddgggggginljjjjjjjjjiillllllllllllliijjjjjjjjjjjjgggggggggggggggggggggggggddddddbbbdddddddgggggghnnjjjjjjllllllllllllllllllllllljjjjjjjjjjjjjjjjgggggggggggggggggggggdddbbddddddggggggggelnijjjlllllllllllllllllllllllllllllljjjjjjjjjjjjjjjjjjggjgggggggggggggdbdddddggggggggjfelplllllllllllllnnnnnnnnnnnnnnmlllllllllljjjjjjjjjjjjjjjjjjjjjggggggggggbdddddgggggggjjcelpnllllllllnnnnnnnnnnnnnnnnnnnnnmmmmlmllllllljjjjjjjjjjjjjjjjjjjjggggggddddddggggggjjfcclpnlllllmnnnnnnnnnnnnnnnnnnnnnnnnnnmmmmmmmmlllljjjjjjjjjjjjjjjjjjjjggggdddddggggggjjjecclpnlllnnnnnnnnnnnnnppppppppppnnnnnnnnmmmmmmmmmmmmllljjjjjjjjjjjjjjjjjjgddddggggggjjjfefenpnlllnnnnnnnnnnpppppppppppppppoooooonnnmmmmmmmmmmmmmljjjjjjjjjjjjjjjjjddddggggggjjjehnlnnllhlpnnnnnnnppppppppppppppppppppooooooonnmmmmmmmmmmmmmmjjjjjjjjjjjjjjddddgggggjjjhehnpnnlfhnpnnnnopppppppppppppppprppppppoooooooooommmmmmmmmmmmmmjjjjjjjjjjjjdddgggggjjjjecinpnlffinpnnoopppppppprprpprrrrrrrrrrrppqooooooooommmmmmmmmmmmmmjjjjjjjjjjddggggggjjjjeeinpnfeilpnnoppppppprrrrrrrrrrrrrrrrrrrrrqqqqooooooooommmmmmmmmmmmmmjjjjjjjddgggggjjjjfcfinnhehinpnoppppprrrrrrrrrrrrrrrrrrrrrrrrrqqqqqoooooooommmmmmmmmmmmmmmjjjjjddgggggjjjjecfinnehilnnoopppprrrrrrrrrrrrrrrrrrrrrrrrrrrrqqqqqoooooooooommmmmmmmmmmmmjjjdgggggjjjjfcchlplfiinnnoopprrrrrrrrrrrrrrrrrrrrrrrrrtrrrrrrqqqqqoooooooommmmmmmmmmmmmmmjdgggggjjjjecehlnffilnnoopprrrrrrrrrrrrrrrrrrrrrrttttttttttrrqqqqqqooooooooommmmmmmmmmmmjdgggggjjjjcceinnehlnnoooprrrrrrrrrrrrrrrrrttrtttttttttttttttrqqqqqqqoooooooommmmmmmmmmmmgggggjjjjiheeinlfinnnooprrrrrrrrrrrrrttttttttttttttttttttttttttqqqqqqqoooooooommmmmmmmmmdggggjjjjillilphhnpnooqqrrrrrrrrtttttttttttttttttttttttttttttttqqqqqqqqoooooooommmmmmmmmdggggjjjhhinnnnflpnoooqqrrrrrtttttttttttttttttttttttttttttttttttqqqqqqqqqoooooommmmmmmmmgggggjjjfhilppnhnpnoooqqrrrtttttttttttttttttttttutttttttttttttttttqqqqqqqqooooooommmmmmmgggggjjffiilpplippoooqqrrrttttttttttttuuuuuuuuuuuuuuuutttttttttttttqqqqqqqqooooooommmmmmdggggjjefiilppllpnoooqqrrtttttttttttuuuuuuuuuuuuuuuuuuuuuutttttttttttqqqqqqqooooooommmmmdggggjfchiilppllpnooqqqrrttttttttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuttttttttqqqqqqqqoooooommmmgggggjechiinpplnpnooqqrrtttttttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutttttttqqqqqqqooooooommmgggggfcehiinpplnpoooqqqttrtttttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutttttttqqqqqqqooooooommdggggeceiiinpplnpoooqqqqmnrttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuutttttttqqqqqqqooooooomdggggeceiiinpplnpooqqqqmknptuuuuuuuuuuuuvvvvvvvvuuuvuutuutqtuuuuuuuttttttqqqqqqqqoooooomdggggcceiiinppnnpooqqqojlpptuuuuuuuuuvvvvvvvvvvvvvvuurlkooikmqtuuuuuutttttqqqqqqqooooooodggggecehiinppnppooqqqmjmpptuuuuuuuuvvvvvvvvvvvvvvvvurniefiheekotuuuuttttttqqqqqqqoooooodggggfcchiinpppppnoqqqklnppsuuuuuvvvvvvvvvvvvvvvvvvvvspnhecefeeefmqtuutttttqqqqqqqoooooodggggjcchiinpppppnoqqoklnpptuuuvvvvvvvvvvvvvvvvvvvvvvuppnhecceeeecfkotutttttqqqqqqqoooooddgggjecfiilpppppnoqqmkmppstuuuvvvvvvvvvvvvvvvvvvvvvvvspplhfecceeeccekqtttttqqqqqqqqooooddgggjfcfiilpppppnoqqmknpsstuuvvvvvvvvvvvvvvvvvvvvttuvvppplhfecceffecckqtttttqqqqqqqooooddggggjeeiilppppppoqqmknpsstuvvvvvvvvvvvvvvvvvvvvvofkmqtppnlhfecceffecckqttttqqqqqqqqoooddggggjfeiilpppppppqqmlnpssuuvvvvvvvvvvvvvvvvvvvvvqiecekmnpnihfecceffeecfottttqqqqqqqooodddgggjjeiilpppppppoqmmnpssuvvvvvvvvvvvvvvvvvvvvvvunleccceinniiheccefhfecfotttqqqqqqqqoodddgggjjfhilppppppppqmmnpssuvvvvvvvvvvvvvvvvvvvvvvvspnfccccflliiheccefhfecfoqtqqqqqqqqoodddggggjjhilppppppppqmmopssuvvvvvvvvvvvvvvvvvvvvvvvvppnhecccehhhihecccehhecemqqqqqqqqqoodddggggjjiiinpppppppqomosssuvvvvvvvvvvvvvvvvvvvvvvvvvppnifecccefhihfcccehhecemqqqqqqqqooddddgggjjiiinpppppppromosssuuvvvvvvvvvvvvvvvvvvvvvvvvvppnlheccccehiifeccefhecemqqqqqqqoobdddgggjjiiilnpppppppomossssvvvvvvvvvvvvvvvvvvvvvvsmouvsppnifecccefhhhecceffcckqqqqqqqoobdddgggjjiiiiinpppppponossssvvvvvvvvvvvvvvvvvvvvvvplfkqutppniheecccehhhfccceeceoqqqqqqqobdddgggjjiiiihhlnppppppossssvvvvvvvvvvvvvvvvvvvvvvpnhfemtuppnihfecccefhheccefeemqqqqqqqobbdddgggjiiiihffkmppppppsssssvvvvvvvvvvvvvvvvvvvvvpniheefourpniihfecccehfecceeemqqqqqqqobbdddgggjiiiiihhfklnppsssssssvvvvvvvvvvvvvvvvvvvvvsplihecemtppniiiheccceheccefekqqqqqqqobbdddgggjjiiiiihffklopsssssssuvvvvvvvvvvvvvvvvvvvvupniihecemtrpniiiheccehfccehffqqqqqqoobbbddgggjjiiiiiihkkkmopssssssuvvvvvvvvvvvvvvvvvvvvvspniihfecktrpniiihecehhecehhfoqqqqqoobbbdddgggjjiiiiiikkkkmosssssssvvvvvvvvvvvvvvvvvvvvvvspniihfecktrpliiihechhfcehhfmqqqqqqobbbdddgggjjiiiiillkkkkmossssssvvvvvvvvvvvvvvvvvvvvvvvspniihfccktrniiiifcfihecfihmqqqqqooabbbddgggjjjiiiilllkkkmmqssssssvvvvvvvvvvvvvvvvvvvvvvvspniihfccktniiiifcfhhfcfihloppppnmabbbddgggjjjjiiilllllkkmmossssssvvvvvvvvvvvvvvvvvvvvvvvrpniihecemniiiiheehiheehilppnnlffabbbdddgggjkkiiillllllmmmmosssssvvvvvvvvvvvvvvvvvvvvvvvvppliiheceliiiiifehiheehiinlheeekaabbdddgggjkkkiiilllllmmmmoosssssvvvvvvvvvvvvvvvvvvvvvvvupniihfccfhiiiihehiifehiiifecekoaabbdddgggjjkkiiilllllmmmmmoosssssvvvvvvvvvvvvvvvvvvvvvvuspniihecchiiiihffiihehiihfcckooaaabbddgggjkkkkiiilllllmmmmmoosssssvvvvvvvvvvvvvvvvvvvvvvupniiifccfiiiiiffiiiffiiifcemooaaabbddegffkkkkliilllllmmmmmmoqsssssvvvvvvvvvvvvvvvvvvvvvvspliihecehiiiihfiiihhiiihekoooaaabbddeeffkkkkkiiilllllmmmmmmooqsssuvvvvvvvvvvvvvvvvvvvuuupliiifccfiiiihfhiiihiiihfmoooaaabbcceeefkkkkkkiiillllmmmmmmmooqssuuvvvvvvvvvvvvvvvvvuuuupniiihecfiiiihhhiiiiiiihkooooaaabbcceeefkkkkkkiiilllllmmmmmmooqqstuuuvvvvvvvvvvvuuuuuuuupniiiifcehiiiihhiiiiiiiimooooaaaabccceeffkkkkkiiiilllllmmmmmmmooqsuuuuvvvvvvvvvuuuuuuuuupniiiiheehiiiiiiiiiiiiiimooooaaaabccceeffkkkkkkhiiilllllmmmmmmoooqtuuuuuuuuvuvuuuuuuuuuupniiiiifefiiiiiiiiiiiiiimooooaaaacccceeffkkkkkkhhhiilllllmmmmmmmootuuuuuuuuuuuuuuuuuuuuurniiiiiheehiiiiiiiiiiiiimooooaaaacccceeffkkkkkkhhhhiilllllmmmmmmnoquuuuuuuuuuuuuuuuuuuuurniiiiiifefiiiiiiiiiiiiimooooaaaacccceeffkkkkkkhhhhiiillllllmmmmmnotuuuuuuuuuuuuuuuuuuutrniiiiiihefiiiiiiiiiiiiimooooaaaacccceeefkkkkkkkhhhhiillllllllllmmotuuuuuuuuuuuuuuuuutttrniiiiiiifehiiiiiiiiiiiloooooaaaccccceeffkkkkkkkhhhhhiiillllllkklmottttttuuuuuuuttttttttrniiiiiiihfhiiiiiiiiiiiloooooaaaccccceeefkkkkkkkffhhhiiillllllkkllotttttttttttttttttttttpniiiiiiihfhiiiiiiiiiiiooooooaaaccccceeffkkkkkkkfffhhhiiilllllkkklotttttttttttttttttttttpliiiiiiihfhiiiiiiiiiimooooooaaaccccceeffkkkkkkkffffhhiiiiiiliffhlotttttttttttttttttttttpiiiiiiiiihhiiiiiiiiiloooooomaacccccceeffkkkkkkkffffhhhiiiiiihffhlqttttttttttttttttttttrniiiiiiiiihhiiiiiiiiiooooooomaaccccceeeffkkkkkkkffffhhhiiiiiihffilqttttttttttttttttttttpliiiiiiiiiiiiiiiiiiimooooooomaaccccceeeffkkkkkkkffffhhhiiiiiihfhilrrrrrrrtrrrtrrrrrrrtrnhiiiiiiiiiiiiiiiiiilooooooommacccccceeeffkkkkkkkffffhhhiiiiiihhhinrrrrrrrrrrrrrrrrrrrrqhhiiiiiiiiiiiiiiiiiimooooooommacccccceefffkkkkkkkffffhhhiiiiiihhilprrrrrrrrrrrrrrrrrrrrmfhiiiiiiiiiiiiiiiiiloooooooommcccccceeefffkkkkkkkffffhhhiiiiiiiilorrrrrrrrrrrrrrrrrrrroffhiiiiiiiiiiiiiiiiinooooooommmaccccceeefffkkkkkkfffffhhhiiiiiiiinrrrrrrrrrrrrrrrrrrrrqkehiiiiiiiiiiiiiiiiiloooooooonmmcccccceeeffkkkkkkkfffffhhiiiiiiiilprrrrrrrrrrrrrrrrrrrrlefhiiiiiiiiiiiiiiiiinooooooonmmmccccceeefffkkkkkkhfffffhhiiiiiiiinrrrrrrrrrrrrrrrrrrrrneefiiiiiiiiiiiiiiiiiloooooooonmmmccccceeefffkkkkkkfffffhhhiiiiiiiinrrrrrrrrrrrrrrrrrrrofcehiiiiiiiiiiiiiiiiinooooooonnmmmccccceeffffkkkkkffffffhhiiiiiiiilprrrrrrrrrrrrrrrrrrpkecfhiiiiiiiiiiiiiiiilooooooonnnmmmcccceeefffkkkkkkffffffhhiiiiiiiinprrrrrrrprrrrrprrrrnecehiiiiiiiiiiiiiiiiinpoooooonnmmmmcccceeefffkkkkkffffffhhhiiiiiiiinrrrrrrpppppppprrrrpfccehiiiiiiiiiiiiiiiilooooooonnmmmmmcccceefffkkkkkkffffffhhiiiiiiiilprrrrrrrrppppppppppneccfiiiiiiiiiiiiiiiiinpoooonnnnmmmmmccceeefffkkkkkfffffffhhhiiiiiiilprrrrprprppppppppppkccehiiiiiiiiiiiiiiiiinooooonnnnmmmmmcceeeffffkkkkfffffffhhhiiiiiiiinpprrrprppppppppppppfccehiiiiiiiiiiiiiiiiinoooonnnnnmmmmmcceeeffffkkkkfffffffhhhiiiiiiiinppppppppppppppppppneccfiiiiiiiiiiiiiiiiiinnnnnnnnnnmmmmlceeeeffffkkkffffffffhhiiiiiiiilppppppppppppppppppplccefiiiiiiiiiiiiiiiiiinnnnnnnnnnmmmmlceeeffffkkkffffeeffhhhiiiiiiiilppprpppppppppppppppkccehiiiiiiiiiiiiiiiiiilnnnnnnnnmmmmmleeeeffffkkkffeeeeffhhhiiiiiiiinppprpppppppppppppppkccehiiiiiiiiiiiiiiiiiilnnnnnnnnmmmmlleeefffffkffffeeefffhhiiiiiiiiinppppppppppppppppppphccehiiiiiiiiiiiiiiiiiillnnnnnnnmmmllleeffffffffffeeeeffhhhiiiiiiiiinpppppppppppppppppppfccehiiiiiiiiiiiiiiiiiilllnnnnnnmmmllleefffffffffeeeeeffhhhiiiiiiiilpppppppppppppppppppphccehiiiiiiiiiiiiiiiiiillllmnnmmmmlllleeffffffffeeeeeeffhhhiiiiiiiilppppppppppppppppppppkccehiiiiiiiiiiiiiiiiiillllllnmmmlllllefffffffffeeeeeffhhhiiiiiiiiinpppppppppppppppppppplccehiiiiiiiiiiiiiiiiiilllllllllllllllffffffffffeeeeeffhhiiiiiiiiiinppppppppppppppppppppnecehiiiiiiiiiiiiiiiiiilllllllllllllllfffffffffeeeeefffhiiiiiiiiiiippppppppppppppppppppppfcehiiiiiiiiiiiiiiiiiilllllllllllllllffffffffeeeeeeffhhiiiiiiiiiilppppppppppppppppppppppkcehiiiiiiiiiiiiiiiiiiillllllllllllllfffffffeeeeeeeffhhiiiiiiiiiilppppppppppppppppppppppmeehiiiiiiiiiiiiiiiiiiillllllllllllllfffffffeeeeeeeffhhiiiiiiiiiinppppppppppppppppppppppnfehiiiiiiiiiiiiiiiiiiillllllllllllllfffffffeeeeeeffhhiiiiiiiiiiinppppppppppppppppppppppphehiiiiiiiiiiiiiiiiiiillllllllllllllffffffeeeeeeefhhhiiiiiiiiiiinppppppppppppppppppppppplfhiiiiiiiiiiiiiiiiiiillllllllllllllfffffeeecceeffhhhiiiiiiiiiiippppppppppppppppppppppppnfhiiiiiiiiiiiiiiiiiiillllllllllllllfffffeeceeeeffhhhiiiiiiiiiilppppppppppppppppppppppppnhhiiiiiiiiiiiiiiiiiiiilllllllllllllffffeecceeefffhiiiiiiiiiiiilppppppppppppppppppppppppnhhiiiiiiiiiiiiiiiiiiiilllllllllllllfffeeeccceeffhhhiiiiiiiiiiinppppppppppppppppppppppppphhiiiiiiiiiiiiiiiiiiiilllllllllllllffeeeccceeeffhhiiiiiiiiiiiinpppppppppppppppppppppppppiiiiiiiiiiiiiiiiiiiiiilllllllllllllffeeeccceeffhhhiiiiiiiiiiiinpppppppppppppppppppppppppiiiiiiiiiiiiiiiiiiiiiiillllllllllllfeeccccceeffhhiiiiiiiiiiiiinpppppppppppppppppppppppppliiiiiiiiiiiiiiiiiiiiiiilllllllllllfeecccceeefhhhhiiiiiiiiiiilppppppppppppppppppppppppppliiiiiiiiiiiiiiiiiiiiiilllllllllllleeecccceeffhhhiiiiiiiiiiiilppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiillllllllllleeccccceeffhhhiiiiiiiiiiiilppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiiilllllllllleeccccceefhhhiiiiiiiiiiiiilppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiillllllllllleccccceeffhhiiiiiiiiiiiiiilpppppppppppppppppppppppppppiiiiiiiiiiiiiiiiiiiiiiiiillllllllicccccceefhhhiiiiiiiiiiiiiinpppppppppppppppppppppppppppiiiiiiiiiiiiiiiiiiiiiiiiilllllllliccccceeffhhhiiiiiiiiiiiiiinpppppppppppppppppppppppppppliiiiiiiiiiiiiiiiiiiiiiiillllllliiccccceeffhhiiiiiiiiiiiiiiinpppppppppppppppppppppppppppliiiiiiiiiiiiiiiiiiiiiiiillllllllicccceeefhhhiiiiiiiiiiiiiiinpppppppppppppppppppppppppppliiiiiiiiiiiiiiiiiiiiiiiiiilllliiicccceeffhhhiiiiiiiiiiiiiiippppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiiillllllllicccceeffhhhiiiiiiiiiiiiiilppppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiccceeefhhhiiiiiiiiiiiiiiilppppppppppppppppppppppppppppniiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
  }
  const GLOBE_TONES = Object.fromEntries(GLOBE_PHOTO.palette.map((hex, i) => [`tone${i}`, [hex, handsDim(hex)]]))
  // the globe's middle and size, in shares of the frame's width (x, r) and height (y); the page puts its mark there too
  const GLOBE_AT = { x: 0.485, y: 0.43, r: 0.155 }
  // how far down the picture sits in the frame, 0 its top at the frame's top and 1 its foot at the frame's foot
  const GLOBE_DROP = 0.56
  const GLOBE_EVEN = 0.005
  /* The two hands, each with its forearm, as rough outlines in the picture's own pixels (528 by 968), and the place
     under the frame each turns about, at its arm's foot. Each hand sways a very little, slowly and on its own, as one
     piece with the paint close round it (GLOBE_REACH cells out, thinning), while the light, the globe and the small
     lights stay where they are. GLOBE_GIVE is how freely the wind turns them (the collage's hands: 0.85). */
  const GLOBE_HANDS = [
    {
      outline: [
        [95, 235],
        [150, 275],
        [150, 330],
        [128, 392],
        [150, 394],
        [170, 420],
        [178, 500],
        [215, 560],
        [240, 640],
        [292, 760],
        [300, 968],
        [100, 968],
        [62, 700],
        [35, 500],
        [28, 400],
        [58, 330],
        [80, 290],
      ],
      pivot: [215, 1150],
      phase: 1.3,
    },
    {
      outline: [
        [320, 404],
        [372, 410],
        [442, 440],
        [492, 500],
        [526, 545],
        [500, 572],
        [472, 640],
        [470, 760],
        [482, 968],
        [305, 968],
        [318, 760],
        [330, 660],
        [300, 560],
        [294, 470],
        [300, 438],
      ],
      pivot: [392, 1180],
      phase: 4.4,
    },
  ]
  const GLOBE_GIVE = 0.3
  const GLOBE_REACH = 5
  const GLOBE = {
    ...HERO,
    intro: false,
    wake: '300% 0px',
    near: '100% 0px',
    words: { at: [0.5, -4], half: [0.001, 0.001] },
    lines: { ...LINES, veil: [0, 0], veilCore: 0.5, sink: 0.001 },
    inks: {
      ...LAND_INK,
      dusk: [GLOBE_PHOTO.palette[0], handsDim(GLOBE_PHOTO.palette[0])],
      lilac: [GLOBE_PHOTO.palette[12], handsDim(GLOBE_PHOTO.palette[12])],
      blush: [GLOBE_PHOTO.palette[22], handsDim(GLOBE_PHOTO.palette[22])],
    },
    sky: {
      stops: [
        [0, 'dusk'],
        [0.5, 'lilac'],
        [1, 'blush'],
      ],
      grain: 0.4,
      brush: 0.06,
      wash: 'lilac',
    },
    land: {
      ...HERO.land,
      profile: [
        [-1.6, 0],
        [1.6, 0],
      ],
      crest: 0,
      sheets: [],
      room: 100,
      foot: ({ h }) => h - 100,
      head: 0,
      least: 20,
    },
    grass: null,
    passer: null,
    pointer: false,
    flowers: null,
    glyphs: true,
    twinkle: true,
    marks: true,
    paints: {
      ...PAINTS,
      ...GLOBE_TONES,
      // the globe: a pale pink body, warm white round its middle, and a bright rim
      orbCore: ['#fff7ee', '#fff3e8'],
      orbBody: ['#f9ddf1', '#f5d6ed'],
      orbDeep: ['#e3c1ee', '#dcb9e9'],
      orbEdge: ['#dcbcec', '#d4b3e6'],
      orbRim: ['#fff8fc', '#fff6fb'],
      // its halo, warm near it and pink further out
      glowWarm: ['#fff1d6', '#ffecca'],
      glowPink: ['#ffd9ef', '#fcd2ea'],
      light: ['#ffffff', '#ffffff'],
      lightWarm: ['#fffaf0', '#fff6e8'],
      lightGlow: ['#fff3e0', '#ffeed4'],
      halo: ['#ffd6f0', '#fbcdea'],
    },
    clouds: [],
    flock: [],
    lens: null,
    // when the page lights the globe (a packet landing), the hands lean out from it a little, and back as it settles
    push: { amount: 0.09, at: GLOBE_AT.x },
    fit: (w) => clamp(w / 300, 0.5, 1),
    plant: (garden) => {
      const { w, h, rand } = garden
      const [gw, gh] = GLOBE_PHOTO.grid
      const cells = GLOBE_PHOTO.cells
      // the picture covers the frame, across its width, set a little below the middle so the light is where the globe is
      const cw = Math.max(w / gw, h / gh)
      const ox = (w - gw * cw) / 2
      const oy = (h - gh * cw) * GLOBE_DROP
      const lum = GLOBE_PHOTO.palette.map((hex) => {
        const v = Number.parseInt(hex.slice(1), 16)
        return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255
      })
      const toneAt = (gx, gy) => Number.parseInt(cells[clamp(gy, 0, gh - 1) * gw + clamp(gx, 0, gw - 1)], 36)
      const L = (gx, gy) => lum[toneAt(gx, gy)]
      const toCanvas = (gx, gy) => [ox + gx * cw, oy + gy * cw]
      const HAZE = 0.4 + GLOBE_EVEN
      // How much of each cell goes with each hand: 1 inside its outline, thinning to nothing GLOBE_REACH cells out (a
      // chamfer distance from the outline, two passes).
      const PX = 528 / gw
      const inside = (outline, x, y) => {
        let hit = false
        for (let i = 0, j = outline.length - 1; i < outline.length; j = i, i += 1) {
          const [xi, yi] = outline[i]
          const [xj, yj] = outline[j]
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            hit = !hit
          }
        }
        return hit
      }
      const far = gw + gh
      const handWeights = GLOBE_HANDS.map((hand) => {
        const d = new Float32Array(gw * gh).fill(far)
        for (let gy = 0; gy < gh; gy += 1) {
          for (let gx = 0; gx < gw; gx += 1) {
            if (inside(hand.outline, (gx + 0.5) * PX, (gy + 0.5) * PX)) {
              d[gy * gw + gx] = 0
            }
          }
        }
        const pass = (dir) => {
          const ys = dir > 0 ? [...Array(gh).keys()] : [...Array(gh).keys()].reverse()
          const xs = dir > 0 ? [...Array(gw).keys()] : [...Array(gw).keys()].reverse()
          for (const gy of ys) {
            for (const gx of xs) {
              let v = d[gy * gw + gx]
              for (const [dx, dy, c] of [
                [-dir, 0, 1],
                [0, -dir, 1],
                [-dir, -dir, 1.414],
                [dir, -dir, 1.414],
              ]) {
                const x = gx + dx
                const y = gy + dy
                if (x >= 0 && x < gw && y >= 0 && y < gh) {
                  v = Math.min(v, d[y * gw + x] + c)
                }
              }
              d[gy * gw + gx] = v
            }
          }
        }
        pass(1)
        pass(-1)
        return d.map((v) => 1 - smooth(0, GLOBE_REACH, v))
      })
      const hands = GLOBE_HANDS.map((hand) => ({
        pivot: toCanvas(hand.pivot[0] / PX, hand.pivot[1] / PX),
        phase: hand.phase,
      }))
      // the hand a cell goes with, and how much
      const handOf = (cell) => {
        const [a, b] = handWeights.map((wts) => wts[cell])
        return a >= b ? [hands[0], a] : [hands[1], b]
      }
      // A stroke's seed sets how much lighter or darker, warmer or cooler than its paint it comes out (see the strokes'
      // shader): the picture is smooth, so take the first seed near a stroke's own that leaves its tone nearly as it is.
      const calm = (seed) => {
        for (let k = 0; k < 60; k += 1) {
          rand.reseed(seed + k * 104729)
          rand()
          rand()
          rand()
          const dice = rand()
          if (Math.abs(((dice * 91.7) % 1) - 0.5) < 0.08 && Math.abs(((dice * 37.3) % 1) - 0.5) < 0.15) {
            return seed + k * 104729
          }
        }
        return seed
      }
      // A stroke on a hand, or close round it, is rooted at the hand's pivot under the frame, its stem leaning just so
      // far that its head is where it is put, and as free to turn as its share of the hand; anything else is rooted
      // straight under it and still.
      const put = (n, { x, y, turn, hand = null, weight = 0, ...o }) => {
        rand.reseed(calm(73019 + n * 7919))
        if (hand && weight > 0.02) {
          const dx = x - hand.pivot[0]
          const up = hand.pivot[1] - y
          const lean = Math.atan2(dx, up)
          garden.dab({
            kind: HAZE,
            ...o,
            x: hand.pivot[0],
            y: hand.pivot[1],
            stem: Math.hypot(dx, up),
            lean,
            phase: hand.phase,
            stiff: 1 - GLOBE_GIVE * weight,
            turn: turn - lean * 0.7,
          })
          return
        }
        const root = h + 40
        garden.dab({ kind: HAZE, ...o, x, y: root, stem: root - y, lean: 0, stiff: 1, turn })
      }
      // The picture, a stroke to a cell, laid along its contour there (across the way it changes), a little jittered.
      for (let gy = 0; gy < gh; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const n = gy * gw + gx
          const [cx, cy] = toCanvas(
            gx + 0.5 + (hashed(n * 1.31) - 0.5) * 0.5,
            gy + 0.5 + (hashed(n * 2.17) - 0.5) * 0.5,
          )
          if (cx < -cw * 2 || cx > w + cw * 2 || cy < -cw * 2 || cy > h + cw * 2) {
            continue
          }
          const tone = toneAt(gx, gy)
          const ddx = L(gx + 1, gy) - L(gx - 1, gy)
          const ddy = L(gx, gy + 1) - L(gx, gy - 1)
          const flat = Math.hypot(ddx, ddy) < 0.012
          const turn =
            (flat ? 0.9 + 0.6 * Math.sin(gx * 0.11 + gy * 0.07) : Math.atan2(ddy, ddx) + Math.PI / 2) +
            (hashed(n * 3.7) - 0.5) * 0.5
          const [hand, weight] = handOf(n)
          put(n, {
            x: cx,
            y: cy,
            turn,
            hand,
            weight,
            long: cw * 1.5,
            wide: 0.9,
            blur: cw * 1.2,
            paints: [`tone${tone}`, `tone${tone}`],
            load: 0.95,
            order: gy * 0.01,
          })
        }
      }
      // The globe, in rings round its middle: the halo out to nearly twice its size, warm near it and pink further out,
      // then its body, warm white round the middle going to pale pink and a little deeper low on the far side, and a
      // bright rim, then a soft highlight high on the near side.
      const gx0 = w * GLOBE_AT.x
      const gy0 = h * GLOBE_AT.y
      const r = w * GLOBE_AT.r
      const step = Math.max(1.6, r / 9)
      let n = 400000
      for (let ring = 0; ring < 3; ring += 1) {
        const reach = [1.6, 1.38, 1.18][ring]
        for (let y = gy0 - r * reach; y <= gy0 + r * reach; y += step * 1.4) {
          for (let x = gx0 - r * reach; x <= gx0 + r * reach; x += step * 1.4) {
            n += 1
            const px = x + (hashed(n * 1.7) - 0.5) * step
            const py = y + (hashed(n * 2.3) - 0.5) * step
            const d = Math.hypot(px - gx0, py - gy0) / r
            if (d < 0.9 || d > reach) {
              continue
            }
            const fade = 1 - smooth(1, reach, d)
            put(n, {
              x: px,
              y: py,
              turn: Math.atan2(py - gy0, px - gx0) + Math.PI / 2,
              long: step * 3.2,
              wide: 1,
              blur: step * 2.6,
              paints: d < 1.3 ? ['glowWarm', 'glowWarm'] : ['glowPink', 'glowPink'],
              load: 0.05 + 0.2 * fade,
              order: 3000 + ring,
            })
          }
        }
      }
      for (let pass = 0; pass < 3; pass += 1) {
        for (let y = gy0 - r; y <= gy0 + r; y += step * 0.75) {
          for (let x = gx0 - r; x <= gx0 + r; x += step * 0.9) {
            n += 1
            const px = x + (hashed(n * 1.7) - 0.5) * step * 0.7
            const py = y + (hashed(n * 2.3) - 0.5) * step * 0.7
            const dx = (px - gx0) / r
            const dy = (py - gy0) / r
            const d = Math.hypot(dx, dy)
            if (d > 0.97) {
              continue
            }
            // A sphere lit from within: warm white round the middle going smoothly to pale pink and, towards the edge, to
            // lilac, deeper low on the far side, away from where its light seems to come from. Each stroke takes one of
            // the paints by a dice weighed by how far out it is, so after the blur the change has no line in it.
            const shade = smooth(0.1, 1, dx * 0.45 + dy * 0.75)
            const core = 1 - smooth(0.2, 0.78, d + (dx + dy) * 0.12)
            const edge = smooth(0.55, 1, d) * (0.55 + 0.45 * shade)
            const dice = hashed(n * 5.1)
            let paint = 'orbBody'
            if (dice < core) {
              paint = 'orbCore'
            } else if (dice > 1 - edge) {
              paint = hashed(n * 6.3) < shade ? 'orbDeep' : 'orbEdge'
            }
            put(n, {
              x: px,
              y: py,
              turn: Math.atan2(py - gy0, px - gx0) + Math.PI / 2 + (hashed(n * 3.1) - 0.5) * 0.4,
              long: step * 1.9,
              wide: 0.9,
              blur: step * 1.1,
              paints: [paint, paint],
              load: 0.55 + 0.25 * (1 - d),
              order: 4000 + pass,
            })
          }
        }
      }
      // the rim: a soft crescent of light along it high on the near side, fading out round the far side
      const around = Math.ceil((Math.PI * 2 * r) / (step * 0.8))
      for (let k = 0; k < around; k += 1) {
        n += 1
        const a = (k / around) * Math.PI * 2
        const near = Math.max(0, Math.cos(a + 2.3)) ** 1.5
        if (near < 0.05) {
          continue
        }
        put(n, {
          x: gx0 + Math.cos(a) * r * 0.95,
          y: gy0 + Math.sin(a) * r * 0.95,
          turn: a + Math.PI / 2,
          long: step * 1.7,
          wide: 0.55,
          blur: step * 0.6,
          paints: ['orbRim', 'orbRim'],
          load: 0.55 * near,
          order: 4100,
        })
      }
      // and the globe's lines, faint: two meridians and two parallels, as light across it, thinning to its edge
      const lines = [
        (t) => [Math.sin(t) * 0.42, -Math.cos(t)],
        (t) => [Math.sin(t) * 0.8, -Math.cos(t)],
        (t) => [Math.cos(t) * 0.87, -0.42 + Math.sin(t) * 0.12],
        (t) => [Math.cos(t) * 0.87, 0.42 + Math.sin(t) * 0.12],
      ]
      lines.forEach((at, j) => {
        const count = 34
        for (let k = 0; k < count; k += 1) {
          const t0 = (k / count) * Math.PI * 2
          const t1 = ((k + 1) / count) * Math.PI * 2
          const [ux, uy] = at(t0)
          const [vx, vy] = at(t1)
          // the meridians' far halves, behind the globe, are left out, and so are the parallels' (their upper arcs)
          if ((j < 2 && Math.sin(t0) < 0) || (j >= 2 && Math.sin(t0) < 0)) {
            continue
          }
          n += 1
          const mx = (ux + vx) / 2
          const my = (uy + vy) / 2
          const out = Math.hypot(mx, my)
          put(n, {
            x: gx0 + mx * r * 0.97,
            y: gy0 + my * r * 0.97,
            turn: Math.atan2(vy - uy, vx - ux),
            long: Math.max(step, Math.hypot(vx - ux, vy - uy) * r * 1.3),
            wide: 0.18,
            blur: step * 0.35,
            paints: ['orbRim', 'orbRim'],
            load: 0.45 * (1 - smooth(0.7, 1, out)),
            order: 4150,
          })
        }
      })
      // its light, glowing out from the middle, where the mark is
      for (let k = 0; k < 14; k += 1) {
        n += 1
        const a = hashed(n * 4.1) * Math.PI * 2
        const rr = r * 0.32 * Math.sqrt(hashed(n * 3.3))
        put(n, {
          x: gx0 + Math.cos(a) * rr,
          y: gy0 + Math.sin(a) * rr,
          turn: a,
          long: r * 0.9,
          wide: 1,
          blur: r * 0.55,
          paints: ['glowWarm', 'lightGlow'],
          load: 0.3,
          order: 4180,
        })
      }
      // a soft highlight high on the near side
      for (let k = 0; k < 10; k += 1) {
        n += 1
        const a = -2.3 + (hashed(n * 4.3) - 0.5) * 0.9
        const rr = r * (0.5 + 0.18 * hashed(n * 2.9))
        put(n, {
          x: gx0 + Math.cos(a) * rr,
          y: gy0 + Math.sin(a) * rr,
          turn: a + Math.PI / 2,
          long: step * 2.4,
          wide: 0.8,
          blur: step * 1.6,
          paints: ['light', 'lightWarm'],
          load: 0.4,
          order: 4200,
        })
      }
      // The hands, painted again over the globe and its halo, so they are in front of it and it is held in them: the
      // picture's cells as far out as the halo reaches that are the hands' lilac and pink, not the light's cream (more
      // blue in them than green). Each finger is whole in front of the light, not only its tip over the globe.
      const rgbOf = GLOBE_PHOTO.palette.map((hex) => {
        const v = Number.parseInt(hex.slice(1), 16)
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
      })
      for (let gy = 0; gy < gh; gy += 1) {
        for (let gx = 0; gx < gw; gx += 1) {
          const cell = gy * gw + gx
          const [cx, cy] = toCanvas(
            gx + 0.5 + (hashed(cell * 1.31) - 0.5) * 0.5,
            gy + 0.5 + (hashed(cell * 2.17) - 0.5) * 0.5,
          )
          const d = Math.hypot(cx - gx0, cy - gy0) / r
          if (d > 1.75) {
            continue
          }
          const tone = toneAt(gx, gy)
          const [cr, cg, cb] = rgbOf[tone]
          if (cb < cg + 14 || cr + cg + cb > 690) {
            continue
          }
          const ddx = L(gx + 1, gy) - L(gx - 1, gy)
          const ddy = L(gx, gy + 1) - L(gx, gy - 1)
          const [hand, weight] = handOf(cell)
          put(600000 + cell, {
            x: cx,
            y: cy,
            hand,
            weight,
            turn: Math.atan2(ddy, ddx) + Math.PI / 2 + (hashed(cell * 3.7) - 0.5) * 0.5,
            long: cw * 1.4,
            wide: 0.9,
            blur: cw * 1.05,
            paints: [`tone${tone}`, `tone${tone}`],
            load: 0.95,
            order: 4600 + gy * 0.01,
          })
        }
      }
      // A few small lights about the globe and among the fingers, each twinkling at its own pace.
      for (let k = 0; k < 16; k += 1) {
        n += 1
        const a = hashed(n * 7.7) * Math.PI * 2
        const rr = r * (1.25 + 1.1 * hashed(n * 8.9))
        const x = gx0 + Math.cos(a) * rr
        const y = gy0 + Math.sin(a) * rr * 1.15
        if (x < w * 0.06 || x > w * 0.94 || y < h * 0.08 || y > h * 0.92) {
          continue
        }
        const core = Math.max(0.9, w * (0.006 + 0.006 * hashed(n * 4.7)))
        rand.reseed(51217 + n * 7919)
        garden.dab({
          x,
          y,
          stem: 0,
          long: core * 4,
          wide: 1,
          turn: 0,
          blur: core * 3,
          paints: ['lightGlow', 'halo'],
          load: 0.5,
          kind: 3.25,
          stiff: 1,
          lean: 0,
          order: 5000,
        })
        rand.reseed(51219 + n * 7919)
        garden.dab({
          x,
          y,
          stem: 0,
          long: core,
          wide: 0.95,
          turn: 0,
          blur: 0.4,
          paints: ['light', 'lightWarm'],
          load: 0.95,
          kind: 3.4,
          stiff: 1,
          lean: 0,
          order: 5001,
        })
      }
    },
  }
  /* --- the compositions, ready --- */

  /* What the engine works out once for each composition: stand-ins for what it leaves out, the names of the colours its
     strokes can be painted in (the paints, then the leaves' greens), how a flower painted with its petals is seen, and
     whether there is a flock, and so a lens. */
  const prepare = (mode) => {
    mode.flowers = mode.flowers || { ...FLOWERS, drifts: [], strays: 0, gorse: 0 }
    mode.grass = mode.grass || { ...GRASS, tufts: 0, lane: 0, singles: 0 }
    mode.paintNames = [...Object.keys(mode.paints), ...LEAVES]
    mode.slant = mode.flowers.slant === undefined ? '0.62' : Number(mode.flowers.slant).toFixed(3)
    mode.lens = mode.lens || LENS
    mode.lensed = mode.flock.length > 0
    return mode
  }
  const MODES = {
    hero: prepare(HERO),
    window: prepare(WINDOW),
    footer: prepare(FOOTER),
    enterprise: prepare(ENTERPRISE),
    company: prepare(COMPANY),
    pricing: prepare(PRICING),
    flight: prepare(FLIGHT_BAND),
    docs: prepare(DOCS),
    hands: prepare(HANDS),
    mirror: prepare(MIRROR),
    daisies: prepare(DAISIES),
    globe: prepare(GLOBE),
  }
  const modeOf = (root) => MODES[root.dataset.hlMode] || MODES.hero

  /* --- shaders ------------------------------------------------------------------------------------- */

  /* The same little dice as the lines on /products/sdk-generator, so that a line keeps its own. */
  const DICE = `
  vec4 dice4(float p) {
    vec4 q = fract(vec4(p) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    q += dot(q, q.wzxy + 33.33);
    return fract((q.xxyz + q.yzzw) * q.zywx);
  }
  vec2 dice2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.xx + q.yz) * q.zy);
  }`

  /* A smooth random, the wind, and what the stirs do, for every shader that moves grass. */
  const MOVES = `
  #define STIRS ${STIR.count}
  uniform vec4 uStirs[STIRS];
  uniform vec2 uStirWay[STIRS];
  uniform float uReach;
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  /* How hard the wind blows at a place: a gentle sway that never stops, and gusts that run through from the left. */
  float windAt(vec2 at, float t) {
    float sway = sin(at.x * 0.0105 - t * 1.5) * 0.55 + sin(at.x * 0.024 - t * 2.2 + at.y * 0.03) * 0.25;
    float gust = smoothstep(0.42, 0.92, noise(vec2(at.x * 0.0017 - t * 0.21, at.y * 0.004 + 3.7)));
    return sway * (0.3 + 0.7 * gust) + gust * 0.75;
  }
  /* How far the stirs lean a blade rooted here. A blade answers mostly to the stir that came closest to it, which is
     when whatever it was went by: it is pushed away from its path and along its way at once, then springs back past
     upright and settles. A stir comes on over a tenth of a second rather than at once, and the stirs near a blade are
     blended, weighted heavily towards the nearest, so that as new ones are laid along the way the blade moves smoothly
     rather than in steps. A stir reaches further across than up and down, as a body going through a meadow does. */
  float stirLean(vec2 at) {
    float sum = 0.0;
    float total = 0.0;
    for (int i = 0; i < STIRS; i++) {
      vec4 s = uStirs[i];
      if (s.w <= 0.0) {
        continue;
      }
      vec2 d = at - s.xy;
      vec2 e = d / vec2(uReach, uReach * 0.62);
      float near = exp(-dot(e, e)) * s.w * smoothstep(0.0, 0.1, s.z);
      float age = max(s.z - 0.05, 0.0);
      float spring = exp(-age * 2.2) * cos(age * 6.5);
      float aside = d.x / (abs(d.x) + 9.0);
      float weight = near * near * near * near + 1e-8;
      sum += weight * near * spring * (aside * 1.1 + uStirWay[i].x * 0.7);
      total += weight;
    }
    return clamp(sum / max(total, 1e-8), -1.2, 1.2);
  }
  /* How much the grass here shows its paler side: where something has just been through it, fading as it rises again,
     and where a gust is going over. */
  float sheenOf(vec2 at, float t) {
    float trail = 0.0;
    for (int i = 0; i < STIRS; i++) {
      vec4 s = uStirs[i];
      if (s.w <= 0.0) {
        continue;
      }
      vec2 e = (at - s.xy) / vec2(uReach * 0.9, uReach * 0.38);
      trail = max(trail, exp(-dot(e, e)) * s.w * exp(-s.z * 1.1) * smoothstep(0.0, 0.1, s.z));
    }
    float gust = smoothstep(0.75, 1.35, windAt(at, t));
    return clamp(trail * 3.0 + gust * 0.24, 0.0, 1.0);
  }
  /* The same push on the land's lines, which give where the grass is parted, so that the unseen passer leaves a trodden
     way through the meadow behind it, in CSS pixels. */
  vec2 stirPush(vec2 at) {
    vec2 push = vec2(0.0);
    for (int i = 0; i < STIRS; i++) {
      vec4 s = uStirs[i];
      if (s.w <= 0.0) {
        continue;
      }
      vec2 d = at - s.xy;
      vec2 e = d / vec2(uReach * 1.2, uReach * 0.5);
      float near = exp(-dot(e, e)) * smoothstep(0.0, 0.1, s.z);
      float spring = exp(-s.z * 2.0) * cos(s.z * 6.0);
      push += vec2(d.x / (abs(d.x) + 14.0) * 4.6, 3.2) * near * s.w * spring;
    }
    return push;
  }
  /* How far a blade or a stem leans, all told: its own lean, the wind, and whatever went by. A stiffer one gives less. */
  float leanOf(vec2 root, vec4 blade, float t) {
    float give = 1.0 - blade.z;
    return blade.x + windAt(root, t + blade.y * 0.4) * 0.17 * give + stirLean(root) * mix(0.55, 1.0, give);
  }`

  /* The land is laid out in JavaScript, so its sheets can have any shape. All this does is let them breathe, and give a
     little where the grass is parted. */
  const LAND_VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aPlace;
  layout(location = 1) in vec4 aLine;
  uniform vec2 uCanvas;
  uniform float uClock;
  uniform float uBreath;
  ${MOVES}
  out vec3 vSheet;
  out float vAcross;
  out float vSheen;
  void main() {
    vSheet = aLine.xyz;
    vAcross = aLine.w;
    vSheen = sheenOf(aPlace, uClock);
    vec2 pixel = aPlace;
    pixel.y += uBreath * (sin(aPlace.x * 0.0041 + uClock * 0.27) + 0.5 * sin(aPlace.x * 0.0097 - uClock * 0.19 + aPlace.y * 0.01));
    pixel += stirPush(aPlace);
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`
  /* A composition with a glow (see the pricing composition) colours its land's lines as they pass through it: how near a
     place is to the glow's middle, in its own size across and down, goes on to the paint (vGlow). The lines run on through
     it as they are; nothing is pushed. And a composition with waves has a sheet's lines rise and fall on a long wave of
     its own as well as breathe: [how high, how long, how fast it runs, where it starts]. Without either the shader is as
     it was. */
  const LAND_PUSH = '    pixel += stirPush(aPlace);\n'
  const landVertex = (mode) => {
    if (!mode.glow && !mode.waves) {
      return LAND_VERTEX
    }
    return LAND_VERTEX.replace(
      '  out float vSheen;\n',
      '  out float vSheen;\n  out float vGlow;\n  uniform vec4 uGlow;\n  uniform vec4 uWave;\n',
    ).replace(
      LAND_PUSH,
      `${LAND_PUSH}    vec2 fromGlow = aPlace - uGlow.xy;
    vec2 inGlow = fromGlow / max(uGlow.zw, vec2(1.0));
    vGlow = exp(-dot(inGlow, inGlow));
    pixel.y += uWave.x * sin(aPlace.x * 6.2832 / max(uWave.y, 1.0) - uClock * uWave.z + uWave.w);
`,
    )
  }

  const LINE_FRAGMENT = `#version 300 es
  precision highp float;
  in vec3 vSheet;
  in float vAcross;
  in float vSheen;
  uniform float uSheen;
  uniform vec3 uSheenInk;
  uniform sampler2D uGrain;
  uniform sampler2D uPaint;
  uniform float uRow;
  uniform float uPatch;
  uniform float uLean;
  uniform float uOpaque;
  uniform float uLaid;
  uniform vec3 uPage;
  uniform float uSpecks;
  uniform float uUnder;
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform float uPitch;
  uniform float uClosest;
  uniform float uKeep;
  uniform float uFill;
  uniform float uClock;
  uniform float uFlow;
  uniform vec2 uBrick;
  uniform float uGap;
  uniform float uBeadCell;
  uniform float uBeadChance;
  uniform float uBeadSize;
  uniform float uBeadFlow;
  uniform float uGrainStrength;
  uniform vec4 uWords;
  uniform float uWordsCore;
  uniform float uSink;
  uniform float uHead;
  uniform float uDark;
  out vec4 outColor;
  const float FINEST = 8.0;
  ${DICE}
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec4 dye = vec4(0.0);
    vec2 css = vec2(gl_FragCoord.x, uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;

    float spread = max(vSheet.z, 0.001);
    float detail = max(min((1.0 - uKeep) * log2(spread / uPitch), log2(spread / uClosest)), -6.0);
    float level = floor(detail);
    float grow = smoothstep(0.0, 1.0, detail - level);
    float place = vSheet.x * exp2(level);
    float pitch = spread * exp2(-level);
    float even = floor(place + 0.5);
    float odd = floor(place) + 0.5;
    float fromEven = abs(place - even) * pitch;
    float fromOdd = abs(place - odd) * pitch;
    float shareEven = mix(pitch, pitch * 0.5, grow);
    float shareOdd = pitch * 0.5 * grow;
    bool isOdd = fromOdd - shareOdd * 0.4 < fromEven - shareEven * 0.4;
    float side = isOdd ? fromOdd : fromEven;
    float share = isOdd ? shareOdd : shareEven;
    float line = (isOdd ? floor(place) * 2.0 + 1.0 : even * 2.0) * exp2(FINEST - level - 1.0);
    vec4 dice = dice4(line);

    /* Its colour is a place across the sheet, the bands' edges interleaved a little from line to line and
       wandering slowly along it, and on the land broken into patches, as a wash of paint is. */
    float m = vAcross;
    float dabs = uPatch > 0.0 ? noise(css * vec2(0.018, 0.044) + uRow * 17.0) * 0.6 + noise(css * vec2(0.05, 0.11) - uRow * 9.0) * 0.4 - 0.5 : 0.0;
    float t = m + (dice.x - 0.5) * 0.022 + 0.018 * sin(vSheet.y * 0.0023 + m * 5.0) + dabs * uPatch * smoothstep(0.0, 0.12, m) + uLean * (css.x / uCanvas.x - 0.35) * smoothstep(0.0, 0.08, m);
    /* the patches never thin a sheet away below its top edge, so no page shows through the hill */
    t = max(t, min(m, 0.03));
    vec4 band = uRow >= 0.0 ? texture(uPaint, vec2(clamp(t, 0.0, 1.0), uRow)) : vec4(0.0);

    /* The air is only seen where a butterfly has been: a few of its lines hold the colour for a while. */
    float dyed = clamp(dye.a * 1.5, 0.0, 1.0) * step(dice.w, 0.42);
    vec3 paint = mix(band.rgb, dye.rgb / max(dye.a, 0.004), dyed);
    float body = max(band.a, dyed);
    /* Where the grass has been pushed over it shows its paler side, and the lines there catch the light. */
    paint = mix(paint, uSheenInk, vSheen * uSheen * 0.7);

    float fill = uFill * pow(body, 0.7) * (0.82 + 0.36 * dice.y);
    float halfWidth = share * min(fill, 0.94) * 0.5;
    float cover = (1.0 - smoothstep(halfWidth - 0.6, halfWidth + 0.6, side)) * min(1.0, halfWidth * 1.7);

    float travelled = vSheet.y;
    float run = mix(uBrick.x, uBrick.y, dice.w);
    float runAt = (travelled - uClock * uFlow * 1000.0 * (0.7 + 0.6 * dice.z)) / run + dice.x * 40.0;
    float runFrom = min(fract(runAt), 1.0 - fract(runAt)) * run;
    cover *= smoothstep(uGap - 0.5, uGap + 0.5, runFrom);
    /* the fainter it is, the more often a run goes missing altogether */
    cover *= step(dice2(vec2(line, floor(runAt))).x, 0.6 + body);

    /* Under the lines lies a body of the same colour. It is dithered by the grain rather than faded, so a
       band thins away into specks. */
    float haze = smoothstep(grain - 0.2, grain + 0.2, smoothstep(0.32, 0.96, body));
    vec3 color = mix(paint + (vec3(1.0) - paint) * mix(0.3, 0.0, uDark), paint * (0.92 + 0.16 * dice.y), cover);
    float alpha = max(cover, haze * uUnder);

    /* overlay, so white stays white and the colours take the grain */
    vec3 overlaid = mix(2.0 * color * grain, 1.0 - 2.0 * (1.0 - color) * (1.0 - grain), step(0.5, color));
    color = mix(color, overlaid, uGrainStrength);

    /* The beads slide along a little faster than the line does. Out where the line itself has faded they
       carry on, and that is the stipple the reference's paper is made of. */
    float spot = (travelled - uClock * uFlow * 1000.0 * uBeadFlow * (0.6 + 0.8 * dice.y)) / uBeadCell + dice.z * 57.0;
    vec2 roll = dice2(vec2(line, floor(spot)));
    float beadAt = (fract(spot) - 0.2 - 0.6 * roll.y) * uBeadCell;
    float size = fract(roll.y * 7.0);
    float radius = uBeadSize * (0.5 + 0.8 * size * size) * (isOdd ? grow : 1.0);
    float bead = 1.0 - smoothstep(radius - 0.5, radius + 0.5, length(vec2(beadAt, side)));
    bead *= step(roll.x, uBeadChance * mix(uSpecks, 1.0, smoothstep(0.0, 0.5, body))) * min(1.0, radius * 1.4);
    /* pale on the colour, and a speck of the colour off it */
    vec3 beadInk = mix(paint, vec3(1.0, 0.98, 0.94), alpha);
    color = mix(color, beadInk, bead * 0.92);
    alpha = max(alpha, bead * mix(0.62, 1.0, alpha));

    /* It shoots across on the way in, each line a little ahead of or behind the next. */
    float along = css.x / uCanvas.x;
    float front = uHead * 1.3 - dice.x * 0.3;
    float shown = 1.0 - smoothstep(front - 0.012, front, along);

    /* it thins into specks at the foot of the hero and round the words, so nothing is simply cut off */
    float sink = (uCanvas.y - css.y) / uSink;
    /* round the words a soft oval of page: clear in its middle, thinning out to its rim */
    float clear = smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw));
    float stay = clamp(min(sink, clear), 0.0, 1.0);
    float keepHere = shown * smoothstep(grain - 0.25, grain + 0.25, stay);
    alpha *= keepHere;

    /* Land hides what is behind it, under a wash of its own colour, so no page shows through between its lines.
       Its edge is thinned by the grain like everything else. */
    vec4 own = texture(uPaint, vec2(clamp(t, 0.0, 1.0), max(uRow, 0.0)));
    float covered = smoothstep(grain - 0.25, grain + 0.25, own.a * 1.8);
    /* A sheet laid on other land has no page to hide at its top edge, and a wash that came in there ahead of its haze
       would show along the seam as a strip of its own, a dark crease on a dark page and a pale line on a light one. So
       there it comes in with the haze. */
    covered = mix(covered, haze, uLaid * step(m, 0.5));
    float solid = uOpaque * keepHere * covered;
    vec3 wash = mix(uPage, own.rgb, mix(0.42, 0.34, uDark));
    outColor = vec4(min(color, vec3(1.0)) * alpha + wash * solid * (1.0 - alpha), alpha + solid * (1.0 - alpha));
  }`

  /* A blade of grass, or a flower's stem: a quad round a bent stroke, in CSS pixels from its root with y up. */
  const BLADE_VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aCorner;
  layout(location = 1) in vec4 aRoot;
  layout(location = 2) in vec4 aInk;
  layout(location = 3) in vec4 aBlade;
  uniform vec2 uCanvas;
  uniform float uClock;
  uniform float uIntro;
  ${MOVES}
  out vec2 vLocal;
  flat out vec4 vCurve;
  flat out vec4 vInk;
  flat out vec2 vWide;
  void main() {
    vec2 root = aRoot.xy;
    /* It grows up out of the land once the lines are in. */
    float grown = smoothstep(0.0, 1.0, clamp((uIntro - aBlade.w) / 0.9, 0.0, 1.0));
    float h = aRoot.z * grown;
    float lean = leanOf(root, aBlade, uClock);
    vec2 tip = vec2(sin(lean), cos(lean)) * h;
    /* it bends more towards its tip than at its root */
    vec2 ctrl = vec2(sin(lean * 0.4), cos(lean * 0.4)) * h * 0.55;
    float pad = aRoot.w + 1.5 + aInk.w * 0.5;
    vec2 lo = min(vec2(0.0), min(ctrl, tip)) - pad;
    vec2 hi = max(vec2(0.0), max(ctrl, tip)) + pad;
    vec2 local = mix(lo, hi, aCorner);
    vLocal = local;
    vCurve = vec4(ctrl, tip);
    vInk = aInk;
    vWide = vec2(aRoot.w, h);
    vec2 pixel = root + vec2(local.x, -local.y);
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`

  const bladeFragment = (mode) => `#version 300 es
  precision highp float;
  in vec2 vLocal;
  flat in vec4 vCurve;
  flat in vec4 vInk;
  flat in vec2 vWide;
  uniform sampler2D uGrain;
  uniform vec3 uInks[${mode.grass.inks.length}];
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform float uGrainStrength;
  uniform vec4 uWords;
  uniform float uWordsCore;
  uniform float uSink;
  uniform float uHead;
  out vec4 outColor;
  float dot2(vec2 v) {
    return dot(v, v);
  }
  /* The distance to a quadratic Bezier curve, after Inigo Quilez. */
  float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {
    vec2 a = B - A;
    vec2 b = A - 2.0 * B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0 / max(dot(b, b), 1e-6);
    float kx = kk * dot(a, b);
    float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
    float kz = kk * dot(d, a);
    float res = 0.0;
    float p = ky - kx * kx;
    float p3 = p * p * p;
    float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    float h = q * q + 4.0 * p3;
    if (h >= 0.0) {
      h = sqrt(h);
      vec2 x = (vec2(h, -h) - q) / 2.0;
      vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
      float t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
      res = dot2(d + (c + b * t) * t);
    } else {
      float z = sqrt(-p);
      float v = acos(q / (p * z * 2.0)) / 3.0;
      float m = cos(v);
      float n = sin(v) * 1.732050808;
      vec3 t = clamp(vec3(m + m, -n - m, n - m) * z - kx, 0.0, 1.0);
      res = min(dot2(d + (c + b * t.x) * t.x), dot2(d + (c + b * t.y) * t.y));
    }
    return sqrt(res);
  }
  void main() {
    if (vWide.y < 0.3) {
      discard;
    }
    float d = sdBezier(vLocal, vec2(0.0), vCurve.xy, vCurve.zw);
    float t = clamp(vLocal.y / max(vCurve.w, 0.001), 0.0, 1.0);
    float halfW = vWide.x * 0.5 * (1.0 - 0.78 * t);
    /* Thinner than a pixel, a line would fall between the pixels' middles and break into dashes, so how much a pixel
       shows is how much of it the line covers: a fine blade is paler, and never broken. */
    float truePx = halfW * 2.0 * uPixels;
    float cover = clamp((halfW - d) * uPixels + 0.5, 0.0, 1.0) * min(1.0, truePx);
    /* A flower's stem out of focus spreads over its soft edge, and is as much fainter as it is wider, so that it never
       grows heavier; a blade of grass is always sharp. */
    float soft = vInk.w;
    if (soft > 0.0) {
      cover = smoothstep(-0.5, 0.5, (halfW - d) / (soft + 1.0 / uPixels)) * min(1.0, halfW * 2.0 / (halfW * 2.0 + soft * 0.8));
    }
    if (cover <= 0.0) {
      discard;
    }
    int i = int(vInk.x);
    vec3 color = mix(uInks[i], uInks[min(i + 1, ${mode.grass.inks.length - 1})], vInk.y);
    color *= mix(0.92, 1.06, t);
    vec2 css = vec2(gl_FragCoord.x, uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    vec3 overlaid = mix(2.0 * color * grain, 1.0 - 2.0 * (1.0 - color) * (1.0 - grain), step(0.5, color));
    color = mix(color, overlaid, uGrainStrength);
    /* It thins into specks at the foot of the hero and round the words, as the land's lines do. */
    float sink = (uCanvas.y - css.y) / uSink;
    float stay = clamp(min(sink, smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw))), 0.0, 1.0);
    float keep = smoothstep(grain - 0.25, grain + 0.25, stay);
    float front = uHead * 1.3 - 0.15;
    keep *= 1.0 - smoothstep(front - 0.02, front, css.x / uCanvas.x);
    float alpha = cover * vInk.z * keep;
    outColor = vec4(color * alpha, alpha);
  }`

  /* A stroke of paint, or a flower painted petal by petal, at the tip of its stem: it leans with the wind and with
     whatever goes by exactly as the grass does, and turns as it leans. When something goes through, a head also bows
     aside and ducks a little, so that the flowers are seen to part, not only the grass. Its colours are looked up here,
     and each flower's are a little lighter or darker, warmer or cooler than the next one's. Lengths are CSS pixels. */
  /* A composition with fairy lights (`twinkle`) has a fourth kind of stroke: a light, given as its kind plus 3, whose
     paint comes and goes, each at its own pace (its dice), slowly and with a quicker flicker over it, as such lights do:
     mostly dim and now and then brighter. A glow (kind 3.25) comes and goes deeply; the glass of the bulb (kind 3.4,
     painted as a plain stroke without bristles) only a little, and a bulb's two strokes, given the same dice, keep time
     together. Painted once (reduced motion), it rests where the still picture's clock leaves it. Only such a
     composition's shader has it, so every other one is as it was. */
  const TWINKLE = `float kind = aPaint.z;
    float twinkle = 1.0;
    if (kind > 2.5) {
      float depth = kind > 3.3 ? 0.35 : 0.8;
      kind -= 3.0;
      float rate = 0.8 + 1.5 * fract(aDab.w * 13.7);
      float wave = 0.5 + 0.5 * sin(uClock * rate + aDab.w * 61.0);
      float flick = 0.5 + 0.5 * sin(uClock * rate * 2.7 + aDab.w * 17.0);
      twinkle = 1.0 - depth * (1.0 - pow(wave, 1.5) * (0.75 + 0.25 * flick));
    }`

  /* With `push`, a composition's swaying strokes lean out from its light as the page lights it: uPush is [how far, in
     radians at full give, the place across the canvas they lean away from]. Without it the shader is as it was. */
  const PUSH_LEAN =
    'float lean = aBlade.x + windAt(root, uClock + aBlade.y * 0.4) * 0.17 * give + stirred * mix(0.55, 1.0, give);'
  const bloomVertexOf = (mode) => {
    const vertex = bloomVertex(mode)
    if (!mode.push || !vertex.includes(PUSH_LEAN) || !vertex.includes('uniform float uPixels;')) {
      return vertex
    }
    return vertex
      .replace('uniform float uPixels;', 'uniform float uPixels;\n  uniform vec2 uPush;')
      .replace(PUSH_LEAN, PUSH_LEAN.replace('give);', 'give) + uPush.x * sign(root.x - uPush.y) * give;'))
  }
  const bloomVertex = (mode) => `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aCorner;
  layout(location = 1) in vec4 aRoot;
  layout(location = 2) in vec4 aDab;
  layout(location = 3) in vec4 aBlade;
  layout(location = 4) in vec4 aPaint;
  uniform vec2 uCanvas;
  uniform float uClock;
  uniform float uIntro;
  uniform float uPixels;
  uniform vec3 uPaints[${mode.paintNames.length}];
  ${MOVES}
  out vec2 vLocal;
  flat out vec4 vDab;
  flat out vec4 vLook;
  flat out vec3 vInk;
  flat out vec3 vSecond;
  flat out float vLoad;
  void main() {
    vec2 root = aRoot.xy;
    /* It comes up out of the land once the lines are in, and the paint goes on as it does. */
    float grown = smoothstep(0.0, 1.0, clamp((uIntro - aBlade.w) / 0.9, 0.0, 1.0));
    float open = smoothstep(0.0, 1.0, clamp((uIntro - aBlade.w - 0.4) / 0.8, 0.0, 1.0));
    /* the lean of leanOf, with the stirs' part kept to hand */
    float give = 1.0 - aBlade.z;
    float stirred = stirLean(root);
    float lean = aBlade.x + windAt(root, uClock + aBlade.y * 0.4) * 0.17 * give + stirred * mix(0.55, 1.0, give);
    vec2 tip = vec2(sin(lean), cos(lean)) * aRoot.z * grown;
    tip.x += stirred * aRoot.w * 0.6;
    tip.y *= 1.0 - 0.25 * abs(stirred);
    float scale = 0.3 + 0.7 * open;
    float reach = aRoot.w * scale;
    float breadth = aDab.x * scale;
    float blur = aDab.z;
    float dice = aDab.w;
    /* A flower painted with its petals faces us; a stroke lies along its own length. Both turn as they lean. */
    ${mode.twinkle ? `${TWINKLE}\n    bool flower = kind > 0.5;` : 'bool flower = aPaint.z > 0.5;'}
    float turn = aDab.y + lean * (flower ? 0.8 : 0.7);
    vec2 along = vec2(cos(turn), sin(turn));
    vec2 across = vec2(-along.y, along.x);
    /* the box reaches past the soft edge, and a stroke bows by up to half its width and wanders a little at its edge; a
       composition that lays many large round strokes (\`tight\`) fits the box to how far each can bow, as a round one
       hardly does, so that it shades fewer pixels for nothing */
    float pad = blur * 0.5 + 1.0 / uPixels + 0.5;
    vec2 box = flower ? vec2(reach * 1.1 + pad) : vec2(reach * 1.12 + pad, breadth * ${mode.tight ? '(1.12 + 0.48 * (1.0 - smoothstep(0.72, 0.9, breadth / max(reach, 1e-3))))' : '1.6'} + pad);
    vec2 local = (aCorner * 2.0 - 1.0) * box;
    vLocal = local;
    vDab = vec4(reach, breadth, blur, dice);
    /* which way is up in the stroke's own terms, for the light on it; how far it has come out; and what it is */
    vLook = vec4(-along.y, -along.x, open, ${mode.twinkle ? 'kind' : 'aPaint.z'});
    /* each a little lighter or darker, warmer or cooler than the next */
    float light = 1.0 + (fract(dice * 91.7) - 0.5) * 0.08;
    vec3 warm = vec3(1.0, 0.0, -1.0) * (fract(dice * 37.3) - 0.5) * 0.04;
    vInk = clamp(uPaints[int(aPaint.x + 0.5)] * light + warm, 0.0, 1.0);
    vSecond = clamp(uPaints[int(aPaint.y + 0.5)] * light + warm, 0.0, 1.0);
    /* how much paint it carries, or how many petals it has */
    vLoad = aPaint.w${mode.twinkle ? ' * twinkle' : ''};
    vec2 pixel = root + vec2(tip.x, -tip.y) + along * local.x + across * local.y;
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`

  /* A composition that traces its flowers in the code font (`glyphs`) has a third kind of stroke: a nought, an upright
     oval ring a hair wide, as the code font draws a 0, never broken into specks. It has a haze as well, a stroke of kind
     0.4 with no bristles, as a leaf has none: a cloud out of focus, whose thin body would otherwise break up into bright
     specks of the grain and sparkle where it should lie as soft as the sky behind it. Only such a composition's shader
     has them, so every other one is as it was. */
  const NOUGHT = `if (vLook.w > 1.5) {
      vec2 p = vec2(vLocal.y, vLocal.x);
      vec2 ab = vec2(breadth, reach);
      float k = length(p / ab);
      float g = length(p / (ab * ab)) / max(k, 1e-4);
      float ring = abs((k - 1.0) / max(g, 1e-4)) - max(0.3, 0.55 / uPixels);
      cover = 1.0 - smoothstep(-0.5 * spread, 0.5 * spread, ring);
      if (cover < 0.004) {
        discard;
      }
      c = ink;
      body = vLoad;
    } else `

  /* Paint, as a loaded brush lays it down. A stroke comes down full at one end and lifts away narrower at the other, and
     its edge is never quite even. Its bristles run along it a pixel and a half apart, each loaded a little differently,
     and each runs dry at its own length, so that the lifted end breaks up into fine lines, as the land's own lines do.
     Out of focus the bristles go first, as all fine texture does; the edge grows as soft as the blur is wide, evenly all
     round, and the colour thins as it spreads, as light out of focus does, though a large soft flower keeps a solid heart
     and only its edge breaks up in the grain, as dry paint does. Far up the hill a stroke is a speck that fades into the
     green. Where the land itself thins away at its foot, so does the paint. A flower painted with its petals is the same
     paint, laid from its heart out to each tip, and seen across the meadow at a slant. A composition can give its paint
     a heavier grain (`film`: how much a sharp stroke and a soft one take), as the footer's fields have a film's; without
     one the shader is as it always was. */
  /* A composition that marks its strokes (\`marks\`) carries the marks in the hundredths of a stroke's kind, which no
     other kind uses: a quarter is mist, a half is even, three quarters both. A stroke marked as mist thins into specks
     across the mist's band; one marked even is drawn round in its proportions, so a long one neither bows nor tapers. */
  const MARK = 'fract(vLook.w * 100.0 + 0.001)'
  const MIST_STAY = `
    if (abs(${MARK} - 0.251) < 0.05 || abs(${MARK} - 0.751) < 0.05) {
      stay = min(stay, smoothstep(uMist.x, uMist.y, css.y));
    }`
  const EVEN_ROUND = `
      if (abs(${MARK} - 0.501) < 0.05 || abs(${MARK} - 0.751) < 0.05) {
        roundness = 1.0;
      }`
  /* A composition whose figure of light runs off the canvas's foot (`lightFoot`), as the docs' figure does, keeps that
     light whole there: its strokes of light, the haze kind marked even, are not thinned into the grain's specks at the
     hero's foot, as the photograph's frame simply cuts its figure off. On a light page its white goes on into the page
     whole, white into white, and the rest of its light fades smoothly there, as all of it does into a dark page. Round
     the words it thins as everything does, and above the foot it fades where the land fades into the page. Only such a
     composition's shader has this; every other one's last lines are as they were. */
  const LIGHT_FOOT = (fade) => `float thin = smoothstep(grain - 0.25, grain + 0.25, stay);
    float fade = smoothstep(0.08, 0.32, land);
    if (vLook.w > 0.3 && vLook.w < 0.5 && abs(${MARK} - 0.501) < 0.05) {
      float lightPage = step(0.5, dot(uPage, vec3(0.3, 0.59, 0.11)));
      float white = smoothstep(0.96, 0.995, min(c.r, min(c.g, c.b)));
      float words = clamp(smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw)), 0.0, 1.0);
      float foot = smoothstep(0.0, 1.0, clamp(sink, 0.0, 1.0));
      thin = smoothstep(grain - 0.25, grain + 0.25, words) * mix(foot, 1.0, lightPage * white);
      fade = mix(fade, 1.0, 1.0 - step(1.0, sink));
    }
    alpha *= thin * smoothstep(0.0, 0.3, vLook.z)${fade ? ' * fade' : ''};`
  const bloomFragment = (mode) => `#version 300 es
  precision highp float;
  in vec2 vLocal;
  flat in vec4 vDab;
  flat in vec4 vLook;
  flat in vec3 vInk;
  flat in vec3 vSecond;
  flat in float vLoad;
  uniform sampler2D uGrain;
  uniform sampler2D uLand;
  uniform vec3 uPaints[${mode.paintNames.length}];
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform vec4 uWords;
  uniform float uWordsCore;
  uniform float uSink;
  uniform vec3 uPage;${mode.marks ? '\n  uniform vec2 uMist;' : ''}
  out vec4 outColor;
  float rnd(float n) {
    return fract(sin(n) * 43758.5453);
  }
  void main() {
    float reach = vDab.x;
    float breadth = vDab.y;
    float blur = vDab.z;
    float dice = vDab.w;
    float spread = blur + 1.0 / uPixels;
    vec3 ink = vInk;
    vec3 second = vSecond;
    float pale = smoothstep(0.72, 0.95, dot(ink, vec3(0.3, 0.59, 0.11)));
    vec3 c;
    float cover;
    float body;
    if (vLook.w < 0.5) {
      /* Along the stroke, from where the brush came down (-1) to where it lifted (1). It narrows as the brush lifts, and
         bows a little, one way or the other; a round dab, out of focus, hardly does either, or it would be a heart or a
         crescent. */
      float s = vLocal.x / reach;
      float roundness = smoothstep(0.72, 0.9, breadth / max(reach, 1e-3));${mode.marks ? EVEN_ROUND : ''}
      float halfW = breadth * (1.0 - 0.3 * (1.0 - 0.7 * roundness) * smoothstep(-0.5, 1.0, s));
      float y = vLocal.y + (dice - 0.5) * breadth * 0.9 * (1.0 - roundness) * (s * s - 1.0);
      float t = y / halfW;
      float a = atan(t, s);
      float wander = (0.07 * sin(a * 2.0 + dice * 40.0) + 0.05 * sin(a * 3.0 - dice * 23.0)) * halfW;
      float d = (length(vec2(s, t)) - 1.0) * halfW - wander;
      cover = 1.0 - smoothstep(-0.5 * spread, 0.5 * spread, d);
      if (cover < 0.004) {
        discard;
      }
      c = mix(ink, second, clamp(0.5 + 0.45 * s, 0.0, 1.0));
      /* The bristles. A stroke too small or too blurred to show them is smooth, and on a pale paint they show less, so
         that it never looks striped. They keep their spacing where the stroke narrows, so some simply end there rather
         than bunching up into a shell's ribs. */
      float fine = smoothstep(1.2, 3.5, breadth * uPixels) * (1.0 - smoothstep(0.7, 2.2, blur)) * (1.0 - 0.55 * pale);
      /* a leaf's are left out: on its dark green they would read as jagged steps where it narrows */
      fine *= 1.0 - step(0.2, vLook.w);
      if (fine > 0.0) {
        float lane = (clamp(y, -breadth, breadth) + breadth) / 1.5;
        /* and never evenly: the lanes wander from one to the next and a little along the stroke */
        lane += 0.3 * sin(lane * 2.3 + dice * 40.0) + 0.15 * sin(s * 3.0 + dice * 9.0);
        float id = floor(lane);
        float off = abs(fract(lane) - 0.5) * 2.0;
        float r1 = rnd(id * 7.13 + dice * 91.7);
        float r2 = rnd(id * 3.71 + dice * 17.3 + 4.1);
        float dryAt = 0.62 + 0.5 * r2;
        float dry = smoothstep(dryAt - 0.3, dryAt + 0.05, s * 0.5 + 0.5);
        float gap = smoothstep(0.4, 0.95, off);
        cover *= 1.0 - fine * clamp(dry * 0.95 + gap * (0.06 + 0.7 * dry), 0.0, 1.0);
        /* the brush's two colours run into each other a little differently on every bristle */
        c = mix(c, mix(ink, second, clamp(0.5 + 0.45 * s + (r1 - 0.5) * 0.8, 0.0, 1.0)), fine);
        c *= 1.0 + fine * ((r1 - 0.5) * 0.12 - gap * 0.035);
      }
      /* the light from above: paler on its upper side, deeper on its lower */
      float lit = dot(vec2(s * 0.4, clamp(t, -1.0, 1.0)), vLook.xy);
      c = mix(c, c * 0.9, smoothstep(0.1, 1.0, -lit) * 0.55);
      c = mix(c, c + (1.0 - c) * 0.35, smoothstep(0.2, 1.0, lit) * 0.6);
      /* Spread over its soft edge, its colour thins as much as the stroke grows, a little less for a pale paint, so that
         a blurred white does not go to milk, and a large soft one keeps much of its heart. */
      float grow = (reach * breadth) / ((reach + 0.5 * blur) * (breadth + 0.5 * blur));
      body = vLoad * mix(pow(grow, mix(0.85, 0.5, pale)), 1.0, 0.5 * smoothstep(3.0, 7.0, blur));
    } else ${mode.glyphs ? NOUGHT : ''}{
      /* A cosmos, seen across the meadow at a slant: broad petals with little teeth at their tips, no two quite alike and
         now and then one missing, each a stroke of its own from the heart out, and a soft heart of gold. */
      vec2 q = vec2(vLocal.x, -vLocal.y / ${mode.slant});
      float R = reach;
      float n = max(vLoad, 5.0);
      float rr = length(q);
      float sector = atan(q.x, q.y) / 6.2831853 * n;
      float which = floor(sector + 0.5);
      float psi = sector - which;
      float pd = rnd(which * 12.9898 + dice * 78.233);
      float edge = R * (0.78 + 0.45 * pd) * (0.5 + 0.5 * pow(max(1.0 - pow(abs(2.0 * psi), 2.6), 0.0), 0.5));
      edge -= R * 0.07 * (0.5 + 0.5 * cos(psi * 18.85));
      cover = 1.0 - smoothstep(-0.5 * spread, 0.5 * spread, rr - edge);
      cover *= max(step(0.15, rnd(which * 3.1 + dice * 9.0)), 1.0 - smoothstep(R * 0.2, R * 0.35, rr));
      if (cover < 0.004) {
        discard;
      }
      float outward = rr / max(edge, 1e-3);
      float streak = abs(fract(psi * 4.0 + pd * 3.0) - 0.5) * 2.0;
      c = mix(mix(ink, second, 0.5), ink, smoothstep(0.12, 0.8, outward));
      c *= 1.0 + (streak - 0.5) * 0.1 * smoothstep(0.2, 0.6, outward);
      /* where two petals meet, a fine line of light */
      float seam = 1.0 - smoothstep(0.0, 0.08, 0.5 - abs(psi));
      c = mix(c, c + (1.0 - c) * 0.5, seam * smoothstep(0.2, 0.5, outward) * 0.4);
      float lit = dot(q / R, vec2(vLook.x, -vLook.y));
      c = mix(c, c + (1.0 - c) * 0.3, smoothstep(0.2, 0.9, lit) * 0.5);
      float heartR = R * 0.22;
      float inHeart = 1.0 - smoothstep(-0.5 * spread, 0.5 * spread, rr - heartR);
      vec3 gold = mix(uPaints[${mode.paintNames.indexOf('gold')}], uPaints[${mode.paintNames.indexOf('butter')}], smoothstep(0.75, 0.0, length(q / heartR + vec2(0.3, -0.35))));
      c = mix(c, gold, inHeart * 0.85);
      body = 0.95;
    }
    vec2 css = vec2(gl_FragCoord.x, uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    /* overlay, so the paint takes the grain the land has; a large soft one less, so its body is smooth */
    vec3 overlaid = mix(2.0 * c * grain, 1.0 - 2.0 * (1.0 - c) * (1.0 - grain), step(0.5, c));
    c = mix(c, overlaid, ${mode.film ? `mix(${mode.film[0].toFixed(3)}, ${mode.film[1].toFixed(3)}, smoothstep(2.0, 6.0, blur))` : 'mix(0.35, 0.15, smoothstep(2.0, 6.0, blur))'});
    /* An edge breaks up into specks rather than fading, as the land's edges do, and a soft one as dry paint does. */
    float alpha = cover * body;
    alpha = mix(alpha, smoothstep(grain - 0.3, grain + 0.3, alpha), mix(0.45, 0.32, smoothstep(0.5, 3.0, blur))${mode.glyphs ? ' * step(vLook.w, 1.5) * (1.0 - step(0.3, vLook.w) * step(vLook.w, 0.5))' : ''});
    /* It thins into specks at the foot of the hero and round the words, as the land's lines do, and fades where the
       land fades into the page. The land's picture is opaque, page and all, so that is where its colour, read three
       pixels blurred so that its lines do not show through as stripes but its edge stays close, comes close to the
       page's. */
    float sink = (uCanvas.y - css.y) / uSink;
    float stay = clamp(min(sink, smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw))), 0.0, 1.0);${mode.marks ? MIST_STAY : ''}
    float land = distance(textureLod(uLand, gl_FragCoord.xy / (uCanvas * uPixels), log2(3.0 * uPixels)).rgb, uPage);
    ${mode.lightFoot ? LIGHT_FOOT(!(mode.sky || mode.onPage)) : `alpha *= smoothstep(grain - 0.25, grain + 0.25, stay) * smoothstep(0.0, 0.3, vLook.z)${mode.sky || mode.onPage ? '' : ' * smoothstep(0.08, 0.32, land)'};`}
    outColor = vec4(min(c, vec3(1.0)) * alpha, alpha);
  }`

  /* A cloud of frosted glass: a heap of balls, through which the land shows blurred and pale. */
  const CLOUD_VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aCorner;
  uniform vec2 uCanvas;
  uniform vec4 uBox;
  out vec2 vLocal;
  void main() {
    vLocal = mix(uBox.xy, uBox.zw, aCorner);
    vec2 pixel = vLocal;
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`

  const CLOUD_FRAGMENT = `#version 300 es
  precision highp float;
  in vec2 vLocal;
  uniform sampler2D uGrain;
  uniform sampler2D uLand;
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform vec4 uPuffs[8];
  uniform int uCount;
  uniform float uSize;
  uniform float uBlur;
  uniform float uDark;
  uniform vec3 uFrost;
  uniform vec3 uShade;
  uniform vec4 uWords;
  uniform float uWordsCore;
  out vec4 outColor;
  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }
  void main() {
    vec2 p = vLocal;
    float d = 1e9;
    for (int i = 0; i < 8; i++) {
      if (i >= uCount) {
        break;
      }
      vec4 puff = uPuffs[i];
      d = smin(d, length(p - puff.xy) - puff.z, uSize * 0.22);
    }
    /* a flat base */
    float base = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= uCount) {
        break;
      }
      base = max(base, uPuffs[i].y + uPuffs[i].z * 0.35);
    }
    d = max(d, p.y - base);
    float cover = clamp(0.5 - d * uPixels, 0.0, 1.0);
    if (cover <= 0.0) {
      discard;
    }
    float thick = smoothstep(0.0, uSize * 0.55, -d);
    vec2 slope = vec2(dFdx(thick), dFdy(thick)) * uPixels;
    vec2 at = gl_FragCoord.xy;
    vec2 size = uCanvas * uPixels;
    /* The land through frosted glass: blurred, a little bent, and pale. */
    vec2 bend = slope * uSize * 3.0 * uPixels;
    vec3 seen = vec3(
      textureLod(uLand, (at - bend * 1.3) / size, uBlur).r,
      textureLod(uLand, (at - bend) / size, uBlur).g,
      textureLod(uLand, (at - bend * 0.75) / size, uBlur).b
    );
    float up = clamp((base - p.y) / (uSize * 1.4), 0.0, 1.0);
    vec3 c = mix(seen, uFrost, mix(0.55, 0.45, uDark));
    /* its underside in its own shade, its top catching the light */
    c = mix(c, uShade, (1.0 - up) * 0.4 + 0.06);
    vec3 nrm = normalize(vec3(-slope * uSize * 0.8, 1.0));
    float glint = pow(max(dot(nrm, normalize(vec3(-0.3, 0.7, 0.65))), 0.0), 16.0);
    c += vec3(0.18) * glint * up;
    /* the edge comes apart into colours, as all the glass here does */
    float edgePx = -d * uPixels;
    vec3 fringe = (vec3(edgePx) + vec3(-0.4, 0.0, 0.4)) / 1.3;
    vec3 lip = vec3(1.0) - smoothstep(vec3(0.4), vec3(1.6), fringe);
    c = mix(c, mix(uShade * 0.92, vec3(1.0), 0.3 + 0.7 * up), lip * 0.8);
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    vec3 overlaid = mix(2.0 * c * grain, 1.0 - 2.0 * (1.0 - c) * (1.0 - grain), step(0.5, c));
    c = mix(c, overlaid, 0.3);
    float show = cover * mix(mix(0.5, 0.14, uDark), mix(0.85, 0.36, uDark), thick);
    /* It clears away round the words as the land does, but evenly: glass has no lines to thin. */
    vec2 css = vec2(at.x, size.y - at.y) / uPixels;
    show *= smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw));
    outColor = vec4(min(c, vec3(1.0)) * show, show);
  }`

  /* The land, drawn crisp into a texture of its own, is put on the screen as it is. */
  const FULL_VERTEX = `#version 300 es
  void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`

  const COPY_FRAGMENT = `#version 300 es
  precision highp float;
  uniform sampler2D uLand;
  out vec4 outColor;
  void main() {
    outColor = texelFetch(uLand, ivec2(gl_FragCoord.xy), 0);
  }`

  /* What stands in front of the canvas on the page, cut out of what is drawn behind it: a rounded box, in canvas pixels
     down from the top, its corners' radii from the top left round, with an edge a pixel soft. Drawn with the blend
     (zero, one minus the source's alpha), it takes colour and alpha alike out of the picture inside the box, so the page
     shows through there, premultiplied as everything else is. */
  const CUT_FRAGMENT = `#version 300 es
  precision highp float;
  uniform vec4 uBox;
  uniform vec4 uRadii;
  uniform float uHeight;
  out vec4 outColor;
  void main() {
    vec2 p = vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y);
    vec2 centre = (uBox.xy + uBox.zw) * 0.5;
    vec2 size = (uBox.zw - uBox.xy) * 0.5;
    vec2 side = step(centre, p);
    float r = mix(mix(uRadii.x, uRadii.y, side.x), mix(uRadii.w, uRadii.z, side.x), side.y);
    vec2 q = abs(p - centre) - size + r;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    outColor = vec4(0.0, 0.0, 0.0, clamp(0.5 - d, 0.0, 1.0));
  }`

  /* A sky of its own, for a composition that has one: its inks from the top of the canvas down, brushed across a little
     unevenly, as a wash of paint is, and with the grain everything else here has. The land is drawn over it. */
  const SKY_FRAGMENT = `#version 300 es
  precision highp float;
  uniform sampler2D uGrain;
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform vec3 uSky[8];
  uniform float uSkyAt[8];
  uniform int uSkyCount;
  uniform float uBrush;
  uniform float uGrainStrength;
  out vec4 outColor;
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec2 css = vec2(gl_FragCoord.x, uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    /* how far down, wandering a little from side to side, so the bands between the inks are laid on with a brush */
    float down = css.y / uCanvas.y + (noise(css * vec2(0.011, 0.06)) - 0.5) * uBrush;
    vec3 c = uSky[0];
    for (int i = 1; i < 8; i++) {
      if (i >= uSkyCount) {
        break;
      }
      c = mix(c, uSky[i], smoothstep(uSkyAt[i - 1], uSkyAt[i], down));
    }
    c *= 1.0 + (noise(css * vec2(0.02, 0.15) + 7.0) - 0.5) * uBrush * 0.5;
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    vec3 overlaid = mix(2.0 * c * grain, 1.0 - 2.0 * (1.0 - c) * (1.0 - grain), step(0.5, c));
    outColor = vec4(clamp(mix(c, overlaid, uGrainStrength), 0.0, 1.0), 1.0);
  }`

  const LENS_VERTEX = `#version 300 es
  void main() {
    // One triangle that covers the screen.
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
    gl_Position = vec4(p, 0.0, 1.0);
  }`

  const LENS_FRAGMENT = `#version 300 es
  precision highp float;
  uniform sampler2D uFlock;
  uniform sampler2D uLand;
  uniform vec2 uRes;
  uniform vec2 uCentre;
  uniform vec2 uHalf;
  uniform vec2 uBand;
  uniform float uIn;
  uniform float uBend;
  uniform float uSplit;
  uniform float uAlong;
  uniform float uSoften;
  uniform float uRound;
  uniform vec2 uHalo;
  out vec4 o;

  const int TAPS = 7;

  vec2 uvOf(vec2 px) {
    return vec2(px.x / uRes.x, 1.0 - px.y / uRes.y);
  }

  void main() {
    /* The foot of the hero is not an edge of the screen, and the page carries on under it, so the picture fades out
       there. Here and not as a mask in the page's styles, which would have the browser composite the whole canvas a
       second time every frame. */
    float foot = clamp(gl_FragCoord.y / (uRes.y * 0.1), 0.0, 1.0);
    /* the land is the same size as the screen, and no glass touches it */
    vec3 behind = texelFetch(uLand, ivec2(gl_FragCoord.xy), 0).rgb;
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    /* Glass gives off a little light onto the land around it. A lower mip of the flock is a blurred copy of it already. */
    vec4 soft = textureLod(uFlock, uvOf(px), uHalo.x);
    vec2 d = px - uCentre;
    /* How far into the band along each edge this pixel is, as the height v of the lens on /products/agent,
       and the two together as a rounded box, so the lens has no seam across its corners. */
    vec2 each = uIn + (abs(d) - (uHalf - uBand)) / uBand * (1.0 - uIn);
    each = max(each, vec2(0.0));
    /* down the page from the middle there is no glass: the foot of the hero is not an edge of the screen */
    each.y *= step(d.y, 0.0);
    float v = pow(pow(each.x, uRound) + pow(each.y, uRound), 1.0 / uRound);
    float t = clamp((v - uIn) / (1.0 - uIn), 0.0, 1.0);
    /* The level is always explicit: a derivative-chosen one breaks down where neighbouring pixels sit
       either side of the lens's edge, and draws a line across the picture there. */
    if (t <= 0.0) {
      vec4 here = textureLod(uFlock, uvOf(px), 0.0);
      behind += (vec3(1.0) - behind) * (soft.a + soft.rgb * 0.5) * uHalo.y;
      o = vec4((here.rgb + (1.0 - here.a) * behind) * foot, foot);
      return;
    }

    /* Where the lens takes its picture from: magnified more and more towards the edge, and joined to the
       untouched middle without a seam. */
    behind += (vec3(1.0) - behind) * (soft.a + soft.rgb * 0.5) * uHalo.y * (1.0 - smoothstep(0.0, 0.3, t));
    float vs = uIn + (1.0 - uIn) * (1.0 - exp(-uBend * t)) / uBend;
    vec2 src = d * (vs / max(v, 1e-4));
    vec2 dir = normalize(d);

    /* Lateral chromatic aberration: the channels are magnified by slightly different amounts, so a dark
       stroke on a light page comes apart into red and yellow on its outer side and blue and cyan on its
       inner one. */
    float split = uSplit * sqrt(t);
    /* The softening runs along the comet, not across it: taps spread down the radius, and only a light
       blur sideways, so a comet stays a long flame instead of a cloud. */
    float along = uAlong * t;
    float lod = uSoften * t * t;

    vec3 acc = vec3(0.0);
    for (int i = 0; i < TAPS; i++) {
      float f = (float(i) + 0.5) / float(TAPS) - 0.5;
      vec2 off = dir * (f * along);
      /* Each colour has its own place in the flock, so each is laid over the land on its own. A single alpha
         would stop the colours coming apart anywhere a wing is over the land. */
      vec4 red = textureLod(uFlock, uvOf(uCentre + src * (1.0 + split) + off), lod);
      vec4 green = textureLod(uFlock, uvOf(uCentre + src + off), lod);
      vec4 blue = textureLod(uFlock, uvOf(uCentre + src * (1.0 - split) + off), lod);
      acc.r += red.r + (1.0 - red.a) * behind.r;
      acc.g += green.g + (1.0 - green.a) * behind.g;
      acc.b += blue.b + (1.0 - blue.a) * behind.b;
    }
    o = vec4(acc / float(TAPS) * foot, foot);
  }`

  const FLY_VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aAB;
  layout(location = 1) in vec2 aPart;
  layout(location = 2) in vec4 iPlace;
  layout(location = 3) in vec3 iForward;
  layout(location = 4) in vec3 iLeft;
  layout(location = 5) in vec4 iFlap;
  layout(location = 6) in vec4 iWho;
  layout(location = 7) in float iShow;
  layout(location = 8) in vec4 iHold;
  layout(location = 9) in vec3 iTurn;
  uniform vec2 uCanvas;
  uniform vec4 uLight;
  uniform float uDark;
  uniform float uPixels;
  out vec2 vW;
  out vec3 vLit;
  flat out vec4 vKind;
  flat out vec4 vWho;
  flat out vec3 vMark;
  void main() {
    /* one that is hidden is put outside the picture, so none of its pixels are worked out */
    if (iShow <= 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    vec3 F = iForward;
    vec3 S = iLeft;
    vec3 U = cross(F, S);
    float kind = aPart.x;
    float side = aPart.y * iWho.w;
    vec3 P;
    vec3 N = U;
    vec3 span = S;
    vec2 flat2 = vec2(F.y, -F.x) / max(length(F.xy), 0.001);
    vW = aAB;
    if (kind < 1.5) {
      float phi = kind < 0.5 ? iFlap.x : iFlap.y;
      float lag = kind < 0.5 ? iFlap.z : iFlap.w;
      float a = aAB.x;
      float b = aAB.y;
      /* In flight the forewing is held out to the side and the hindwing comes up to meet it, which is what makes two wide
         lobes when the wings are open. This turns only where the wing is, and not how it is painted. */
      float sweep = kind < 0.5 ? ${FLIGHT.sweep[0].toFixed(2)} : ${FLIGHT.sweep[1].toFixed(2)};
      float cs = cos(sweep);
      float sn = sin(sweep);
      float a0 = a;
      a = a0 * cs - b * sn;
      b = a0 * sn + b * cs;
      /* The wing is not a board. Its tip and its trailing edge come along after the root, by as much as
         the wing is moving, which is what makes the beat look like cloth instead of a hinge. */
      float bent = phi + lag * (0.5 * b + 0.55 * max(-a, 0.0));
      span = side * S * cos(bent) + U * sin(bent);
      P = a * F + b * span;
      /* the root is a little forward of the middle for a forewing, and behind it for a hindwing */
      P += F * (kind < 0.5 ? 0.03 : -0.02);
      /* the light goes by the bent wing, so that it moves across it during a beat */
      N = U * cos(bent) - side * S * sin(bent);
      vMark = vec3(0.0);
    } else if (kind < 2.5) {
      P = aAB.x * F + vec3(flat2, 0.0) * aAB.y;
      vMark = vec3(0.0);
    } else if (kind > 5.5) {
      /* An antenna, out from the head and up off the back, bowing outwards a little. It is drawn as the thread is, a strip
         across the page as wide as it needs to be to touch every pixel the line does. */
      float t = aAB.x;
      vec3 at = F * (${ANTENNA.root.toFixed(3)} + ${ANTENNA.reach.toFixed(3)} * t) +
        S * aPart.y * (0.015 + ${ANTENNA.spread.toFixed(3)} * t + ${ANTENNA.curl.toFixed(3)} * t * t) +
        U * ${ANTENNA.rise.toFixed(3)} * t;
      float t2 = min(t + 0.05, 1.0);
      float t1 = max(t - 0.05, 0.0);
      vec3 ahead = F * ${ANTENNA.reach.toFixed(3)} * t2 + S * aPart.y * (${ANTENNA.spread.toFixed(3)} * t2 + ${ANTENNA.curl.toFixed(3)} * t2 * t2) + U * ${ANTENNA.rise.toFixed(3)} * t2;
      vec3 behind = F * ${ANTENNA.reach.toFixed(3)} * t1 + S * aPart.y * (${ANTENNA.spread.toFixed(3)} * t1 + ${ANTENNA.curl.toFixed(3)} * t1 * t1) + U * ${ANTENNA.rise.toFixed(3)} * t1;
      vec2 along = (ahead - behind).xy;
      float wide = (1.0 + 0.08 * uDark) * mix(${ANTENNA.wide[0].toFixed(2)} * clamp(iPlace.w / 80.0, 0.6, 1.0), ${ANTENNA.wide[1].toFixed(2)}, t);
      float truePx = wide * uPixels;
      float stripPx = max(truePx, 0.5) + 0.75;
      P = at + vec3(vec2(-along.y, along.x) / max(length(along), 1e-5) * aAB.y * stripPx / uPixels / iPlace.w, 0.0);
      /* the tip fades out rather than stopping square */
      vLit = vec3(truePx, stripPx, 1.0 - smoothstep(0.86, 1.0, t));
      vMark = vec3(0.0);
    } else {
      P = vec3(0.0);
      vMark = vec3(0.0);
    }
    if (kind < 4.5) {
      float lit = dot(N, uLight.xyz);
      float h = pow(abs(dot(N, normalize(uLight.xyz + vec3(0.0, 0.0, 1.0)))), 24.0);
      vLit = vec3(lit, h, abs(N.z));
    }
    /* The last place is the bead's radius in CSS pixels. */
    vKind = vec4(kind, iWho.y, aPart.y, iHold.z * iPlace.w);
    vWho = vec4(iPlace.w, iWho.z, iShow * (kind > 3.5 && kind < 5.5 ? iTurn.z : 1.0), iWho.x);

    /* In homogeneous form, so the GPU interpolates the wing's own place with perspective. */
    float w = (iPlace.z - P.z) / iPlace.z;
    vec2 pixel = iPlace.xy * w + vec2(P.x, -P.y) * iPlace.w;
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - w, w - pixel.y / uCanvas.y * 2.0, 0.0, w);
  }`

  const FLY_FRAGMENT = `#version 300 es
  precision highp float;
  in vec2 vW;
  in vec3 vLit;
  flat in vec4 vKind;
  flat in vec4 vWho;
  flat in vec3 vMark;
  uniform sampler2D uGrain;
  uniform sampler2D uShapes;
  uniform sampler2D uInks;
  uniform sampler2D uLand;
  uniform vec3 uLandLook;
  uniform float uPixels;
  uniform vec4 uCells[${WING_NAMES.length}];
  uniform vec2 uForeRange;
  uniform vec2 uHindRange;
  uniform float uShapeRows;
  uniform float uTile;
  uniform float uClock;
  uniform float uFan;
  uniform float uPitch;
  uniform float uClosest;
  uniform float uKeep;
  uniform float uFill;
  uniform vec2 uBrick;
  uniform float uGap;
  uniform float uFlow;
  uniform float uBeadCell;
  uniform float uBeadChance;
  uniform float uBeadSize;
  uniform float uBlotch;
  uniform float uGrainStrength;
  uniform float uDark;
  out vec4 outColor;
  const float FINEST = 8.0;
  ${DICE}
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  int inkRow = 0;
  vec3 ink(int which) {
    return texelFetch(uInks, ivec2(which, inkRow), 0).rgb;
  }
  vec3 overlay(vec3 c, float g, float strength) {
    vec3 o = mix(2.0 * c * g, 1.0 - 2.0 * (1.0 - c) * (1.0 - g), step(0.5, c));
    return mix(c, o, strength);
  }
  /* The colour of the glass for how much of it the light has come through: its pale glow, then its own colours one after
     another, and past the deepest of them on towards one further colour, so that the far end of a long wing is still
     changing. The last number is how much it darkens on the way, because a red that only darkens stops being glass and
     goes to lacquer. */
  vec3 stain(float t, vec3 glow, vec3 light, vec3 body, vec3 deep, vec3 beyond, float falls) {
    vec3 c = mix(glow, light, smoothstep(0.0, 0.32, t));
    c = mix(c, body, smoothstep(0.24, 0.62, t));
    c = mix(c, deep, smoothstep(0.52, 1.25, t));
    c = mix(c, beyond, smoothstep(1.1, 2.4, t));
    return pow(c, vec3(1.0 + falls * (1.0 - exp(-max(t - 0.6, 0.0) * 1.2)) * smoothstep(0.2, 0.8, max(c.r, max(c.g, c.b)))));
  }
  /* The same colour with its weaker channels pushed further down, which is cleaner and no darker. */
  vec3 vivid(vec3 c, float k) {
    float most = max(max(c.r, c.g), max(c.b, 1e-3));
    return pow(c / most, vec3(k)) * most;
  }
  void main() {
    float kind = vKind.x;
    /* the butterfly's pastel */
    inkRow = int(vWho.w);

    if (kind > 5.5) {
      /* An antenna: the thread's edge, in a plain grey that is neither the wing's colour nor the planet's. */
      float a = min(clamp(vLit.x + 0.5 - abs(vW.y) * vLit.y, 0.0, 1.0), 2.0 * vLit.x) * vLit.z * vWho.z;
      vec3 grey = mix(vec3(${ANTENNA.ink[0].map((v) => v.toFixed(2)).join(', ')}), vec3(${ANTENNA.ink[1].map((v) => v.toFixed(2)).join(', ')}), uDark);
      outColor = vec4(grey * a, a);
      return;
    }
    if (kind > 1.5) {
      /* The body is only where the wings' strokes gather: a soft dab with no edge of its own, broken along its length, deepest
         at its middle and going over to the colour that runs out into the wings. */
      float along = (vW.x + 0.08) / 0.32;
      float across = vW.y / mix(0.075, 0.03, smoothstep(0.0, 1.0, -along));
      float d = along * along + across * across;
      float streaks = noise(vec2(vW.x * 8.0 + vWho.y * 13.0, vW.y * 90.0));
      float show = (1.0 - smoothstep(0.05, 1.0, d)) * mix(0.45, 0.9, streaks) * vWho.z;
      vec3 c = mix(mix(ink(6), ink(5), 0.45), ink(6), smoothstep(0.0, 0.7, d));
      c = overlay(c, texture(uGrain, gl_FragCoord.xy / uTile).r, uGrainStrength);
      outColor = vec4(c * show, show);
      return;
    }

    vec2 p = vW;
    float r = length(p);
    float ang = atan(p.x, p.y);
    vec2 range = kind < 0.5 ? uForeRange : uHindRange;
    float across = (ang - range.x) / (range.y - range.x);
    float shapeRow = (vKind.y * 2.0 + (kind < 0.5 ? 0.5 : 1.5)) / uShapeRows;
    float rim = texture(uShapes, vec2(across, shapeRow)).r;
    float edge = rim - r;
    /* The outline's slope, taken over a little distance, because the table comes in small stairs where the outline runs
       nearly along a ray. */
    float rimStep = 7.0 / ${SHAPE_WIDTH}.0;
    float rimAhead = texture(uShapes, vec2(across + 2.0 * rimStep, shapeRow)).r;
    float rimBehind = texture(uShapes, vec2(across - 2.0 * rimStep, shapeRow)).r;
    float rimSlope = (rimAhead - rimBehind) / (4.0 * rimStep * (range.y - range.x));
    /* The edge against the picture's own pixels, for a clean silhouette. Its gradient goes by the angle and the radius,
       which are smooth, because the edge's own would carry those stairs and break a steep edge into dashes. */
    vec2 edgeSlope = rimSlope * vec2(dFdx(ang), dFdy(ang)) - vec2(dFdx(r), dFdy(r));
    float inside = clamp(edge / max(length(edgeSlope), 1e-5) + 0.5, 0.0, 1.0);
    float pxPer = vWho.x;
    float aaAng = fwidth(ang) * r * pxPer;
    if (inside <= 0.0 || across < 0.0 || across > 1.0) {
      discard;
    }
    /* How far this is from the wing's edge in CSS pixels, straight across it, which a radius is not: along the leading
       edge a ray from the root nearly runs with the edge. It goes by the outline's slope, so a steep edge has as even a
       line along it as any other. */
    /* The bright line is a fine one and would show those stairs as dashes, so where the outline runs steeply it is measured
       from an average of the outline nearby. The wing's shape stays as it is: this moves the line and not the edge. */
    float rimSteep = smoothstep(1.5, 4.0, abs(rimSlope) / max(rim, 1e-3));
    float rimEven = rim;
    if (rimSteep > 0.0) {
      float nearby = textureLod(uShapes, vec2(across + rimStep, shapeRow), 0.0).r + textureLod(uShapes, vec2(across - rimStep, shapeRow), 0.0).r;
      rimEven = mix(rim, (rim + rimAhead + rimBehind + nearby) / 5.0, rimSteep);
    }
    float edgePx = (rimEven - r) / sqrt(1.0 + rimSlope * rimSlope / max(r * r, 1e-4)) * pxPer;
    /* Both wings are in plain view from behind, so the far one is only a little lighter than the near one. */
    float near = mix(0.7, 1.0, step(vKind.z, 0.0));
    float isFore = 1.0 - step(0.5, kind);

    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    vec3 deep = ink(0);
    vec3 body = ink(1);
    vec3 light = ink(2);
    vec3 glow = ink(3);
    vec3 sheen = ink(4);
    vec3 rimInk = ink(5);
    /* One colour of glass, paler and deeper, rather than a run of colours. The inks are all of one family, so drawing them
       together keeps the wing clean and only takes out the spread. */
    glow = mix(glow, body, ${WING.mono.toFixed(2)});
    light = mix(light, body, ${WING.mono.toFixed(2)});
    deep = mix(deep, body, ${WING.mono.toFixed(2)});
    sheen = mix(sheen, body, ${WING.mono.toFixed(2)});
    float along = r / max(rimEven, 1e-3);

    /* The strokes fan out from the root, and more of them start as the fan widens. */
    float spread = max(r * pxPer / uFan, 0.001);
    float detail = max(min((1.0 - uKeep) * log2(spread / uPitch), log2(spread / uClosest)), -3.0);
    float level = floor(detail);
    float grow = smoothstep(0.0, 1.0, detail - level);
    float place = (ang * uFan + vWho.y * 97.0) * exp2(level);
    float pitch = spread * exp2(-level);
    float even = floor(place + 0.5);
    float odd = floor(place) + 0.5;
    float fromEven = abs(place - even) * pitch;
    float fromOdd = abs(place - odd) * pitch;
    float shareEven = mix(pitch, pitch * 0.5, grow);
    float shareOdd = pitch * 0.5 * grow;
    bool isOdd = fromOdd - shareOdd * 0.4 < fromEven - shareEven * 0.4;
    float side = isOdd ? fromOdd : fromEven;
    float share = isOdd ? shareOdd : shareEven;
    float line = (isOdd ? floor(place) * 2.0 + 1.0 : even * 2.0) * exp2(FINEST - level - 1.0);
    vec4 dice = dice4(line);

    float halfWidth = share * uFill * (0.88 + 0.2 * dice.y) * 0.5;
    float aa = max(aaAng * 0.6, 0.16);
    float cover = (1.0 - smoothstep(halfWidth - aa, halfWidth + aa, side)) * min(1.0, halfWidth * 2.4);
    /* Each runs slowly out along the wing, in long lengths with short breaks. */
    float travelled = r * pxPer;
    float run = mix(uBrick.x, uBrick.y, dice.w) * (0.5 + 0.5 * min(pxPer / 60.0, 1.4));
    float runAt = (travelled - uClock * uFlow * 1000.0 * (0.6 + 0.8 * dice.z)) / run + dice.x * 40.0;
    float runFrom = min(fract(runAt), 1.0 - fract(runAt)) * run;
    cover *= smoothstep(uGap - 0.5, uGap + 0.5, runFrom);

    /* The veins fan out from the root as the strokes do, and bend a little on the way. */
    float cells = kind < 0.5 ? uCells[int(vKind.y)].x : uCells[int(vKind.y)].y;
    float cellAt = (across + (kind < 0.5 ? 0.05 : -0.05) * r * r) * cells + vWho.y * 3.0;
    float cell = abs(fract(cellAt) - 0.5) * 2.0;
    float cellDice = hash(vec2(floor(cellAt), kind + vWho.y * 31.0));

    /* Where the lighter hearts of the panes end: one long sweep along a forewing's leading side, and a round end to each pane on
       the rest of it and on a hindwing. */
    float petals = isFore * (1.0 - smoothstep(0.34, 0.5, across)) + (1.0 - isFore);
    float archAt = mix(mix(0.8, 0.84, smoothstep(0.5, 0.85, across)), 0.77 - cell * cell * 0.12 + (cellDice - 0.5) * 0.04, petals);

    /* How much glass the light has come through to get here: next to none at the root, and more and more towards the
       tip. Whatever changes the wing's colour changes this, and the colour is read off it at the end, so a ray, a heart
       or a striation is always the glass itself, thinner or thicker, and never paler paint laid on top of it. */
    float reach = r / (kind < 0.5 ? 1.25 : 1.0);
    float pane = (fract(cellAt) - 0.5) * 2.0;
    float pillow = 1.0 - cell * cell;
    /* Warm glass holds its light further out: a blue can go very deep and stay clean, where a red that deep is only dark. */
    float warm = smoothstep(0.0, 0.4, body.r - body.b);
    float thick = max(reach - 0.08, 0.0) * mix(0.94, 1.36, isFore) * mix(1.0, 0.74, warm);
    /* The trailing side of a forewing is thinner, so it stays paler. */
    thick *= 1.0 - isFore * (1.0 - smoothstep(0.26, 0.6, across)) * smoothstep(0.15, 0.6, along) * 0.26;
    /* Long, slow changes in the thickness, like any glass that was made by hand, and each pane was poured on its own. */
    vec2 seedAt = vec2(vWho.y * 37.0, vWho.y * 91.0 + kind * 11.0);
    vec2 streak = vec2(ang * 2.6, r * 0.55) * uBlotch;
    float blot = noise(streak + seedAt) * 0.62 + noise(streak * 2.7 - seedAt) * 0.38;
    thick *= 1.0 + ((blot - 0.5) * 0.12 + (cellDice - 0.5) * 0.1) * ${WING.texture.toFixed(2)} * smoothstep(0.2, 0.6, along);
    /* Each pane is blown a little, thinnest at its heart and thick along its veins, and the petals show it most. */
    thick *= 1.0 + cell * cell * cell * ${(0.18 * WING.texture).toFixed(3)} * smoothstep(0.1, 0.45, along);
    thick *= 1.0 - petals * pillow * pillow * smoothstep(0.1, 0.34, along) * (1.0 - smoothstep(archAt - 0.2, archAt - 0.02, along)) * ${(0.3 * WING.texture).toFixed(3)};
    /* Light pours through the root in long beams, along the veins and between them. */
    if (reach < 0.62) {
      float rays = noise(vec2(ang * 17.0 + seedAt.x, kind * 5.0)) * 0.7 + noise(vec2(ang * 43.0 + seedAt.y, kind * 9.0)) * 0.3;
      float beam = cell * cell;
      thick *= 1.0 - (smoothstep(0.38, 0.72, rays) * mix(0.46, 0.26, warm) + beam * beam * mix(0.42, 0.3, warm)) * ${WING.texture.toFixed(2)} * (1.0 - smoothstep(0.08, 0.62, reach));
    }
    /* The strokes stay in the glass, as fine striations you find when you look closely. */
    thick *= 1.0 + ((cover - 0.7) * 0.2 + (dice.y - 0.5) * 0.24) * ${WING.texture.toFixed(2)} * smoothstep(0.12, 0.5, along);
    /* A wing turned away from us has a longer way through it, so its colour deepens as it beats, though only by a little, or
       the whole wing would pump where it should glint. */
    thick *= mix(1.0, min(1.0 / max(vLit.z, 0.2), 1.6), mix(0.35, 0.5, near)) * mix(1.0, 1.12, near);
    /* The far forewing is the same glass with more light through it. Its hindwing is not: that anchors the butterfly, so it
       stays deeper. */
    thick *= mix(mix(0.82, 0.5, isFore), 1.0, near);

    /* The land behind the glass. It is read blurred, because its lines are closer together than the strokes and the two would
       weave into a cloth, and what is left is the big shapes: sky, hills and sand. It is not seen through a near wing, only
       felt: what matters is how much of it gets through this colour of glass, and less of it is the same as more glass, which
       keeps it clean. So a wing goes deeper over the land and paler over the white page, where multiplying the two would
       have been mud. */
    vec3 seen = textureLod(uLand, gl_FragCoord.xy * uLandLook.xy, uLandLook.z).rgb;
    float gets = dot(seen, body) / max(body.r + body.g + body.b, 0.05);
    /* a dark page gives no light to speak of, and there it is the wing's own that we see */
    float landDeep = 1.0 + (1.0 - max(gets, uDark * 0.55)) * smoothstep(0.12, 0.45, along);

    vec3 far = vivid(mix(deep, sheen, 0.2), ${(1 + 0.4 * (1 - WING.mono)).toFixed(3)});
    /* A far wing takes little of its depth from the land, or red glass over green hills would go brown. */
    vec3 c = stain(thick * mix(1.0, landDeep, mix(mix(0.6, 0.25, isFore), 1.0, near)), glow, light, body, far, vivid(mix(deep, sheen, 0.5), ${(1 + 0.5 * (1 - WING.mono)).toFixed(3)}), mix(1.0, 0.4, warm));
    /* the core of the light, where the glass has almost no colour */
    c = mix(c, mix(glow, vec3(1.0), 0.5), (1.0 - smoothstep(0.0, 0.2, thick)) * 0.7);

    /* The body does not stop at its edge. Its colour runs out along the strokes, each a length of its own, which is what joins
       the wings through the middle. */
    float runsOut = 0.1 + ${(0.46 * (1 - WING.mono)).toFixed(3)} * dice.x * dice.x;
    c = mix(c, ink(6), (1.0 - smoothstep(0.03, runsOut, r)) * mix(0.55, 1.0, cover) * ${(0.85 * (1 - WING.mono * 0.5)).toFixed(3)});

    c = overlay(c, grain, uGrainStrength * ${(0.5 * (0.5 + 0.5 * WING.texture)).toFixed(3)});

    /* Bright flecks running out along the strokes: the little bubbles in hand-made glass. */
    float spot = (travelled - uClock * uFlow * 1800.0 * (0.6 + 0.8 * dice.y)) / uBeadCell + dice.z * 57.0;
    vec2 roll = dice2(vec2(line, floor(spot)));
    float beadAt = (fract(spot) - 0.2 - 0.6 * roll.y) * uBeadCell;
    float size = fract(roll.y * 7.0);
    float radius = uBeadSize * (0.5 + 0.8 * size * size) * (isOdd ? grow : 1.0);
    float bead = 1.0 - smoothstep(radius - 0.4, radius + 0.4, length(vec2(beadAt, side)));
    bead *= step(roll.x, uBeadChance) * min(1.0, radius * 1.6);
    c = mix(c, mix(c, vec3(1.0), 0.55), bead * ${(0.6 * WING.texture).toFixed(3)});

    /* Glass reflects the sky with a hard edge: a sheet of light on one side of the edge that fades away from it, sliding
       across the wing as it beats. Each pane is blown a little, so it bows the edge and shows it at a place of its own,
       and it steps at every vein. */
    vec2 lieAlong = mix(vec2(-0.7, 0.72), vec2(0.7, 0.71), isFore);
    float lieAt = dot(p, lieAlong);
    float crossing = dot(p, vec2(-lieAlong.y, lieAlong.x)) * mix(-1.0, 1.0, isFore) + lieAt * lieAt * 0.22;
    float crossingAa = max(fwidth(crossing) * 0.75, 1e-4);
    float beat = mix(1.0 - vLit.z, vLit.x + 1.0, near);
    float edgeAt = mix(mix(-0.24, 0.1, beat), mix(0.04, 0.5, beat), isFore);
    float edgeOf = (crossing - edgeAt) + pane * pane * 0.012 + (cellDice - 0.5) * 0.024;
    float sheet = (1.0 - smoothstep(-crossingAa, crossingAa, edgeOf)) * smoothstep(-0.34, 0.0, edgeOf) * smoothstep(0.3, 0.6, along);
    /* Added light goes grey on very dark glass, and on warm glass it only goes salmon. */
    float lifts = smoothstep(0.03, 0.3, dot(c, vec3(0.3, 0.55, 0.15)));
    c += mix(light, vec3(1.0), 0.35) * sheet * 0.22 * lifts * mix(1.0, 0.5, warm);

    /* And no two panes lie quite the same way, so each catches the sky at a moment of its own, all of it at once, with its
       veins for edges, and brightest against the vein on the side of the light. */
    float facet = smoothstep(0.6, 0.98, sin(beat * 2.6 + cellDice * 23.0 + kind));
    c += mix(light, vec3(1.0), 0.45) * facet * (0.3 + 0.7 * smoothstep(-1.0, 1.0, pane * mix(-1.0, 1.0, isFore))) * smoothstep(0.22, 0.55, along) * mix(0.1, 0.2, lifts) * ${WING.texture.toFixed(2)};

    /* The veins, in light: the glass's own colour, almost clear. They are brightest near the root, where the
       light comes from, nearly gone at the rim, and brighter as the reflection goes by. */
    vec3 veinInk = mix(mix(glow, light, smoothstep(0.0, 0.32, thick * 0.3)), vec3(1.0), mix(0.9, 0.3, smoothstep(0.1, 0.5, along)));
    float veinWidth = 0.34;
    float paneHalf = 0.5 / cells * (range.y - range.x) * r * pxPer;
    float veinPx = min(fract(cellAt), 1.0 - fract(cellAt)) * 2.0 * paneHalf;
    float passing = exp(-edgeOf * edgeOf * 90.0);
    /* Far off, on a dark glass, lines of light this bright would read as a wire frame, so they ease off. */
    float wire = mix(1.0, smoothstep(20.0, 44.0, pxPer), mix(0.3, 0.75, 1.0 - smoothstep(0.04, 0.2, dot(body, vec3(0.3, 0.55, 0.15)))));
    float vein = (1.0 - smoothstep(veinWidth - aa, veinWidth + aa, veinPx)) * smoothstep(0.03, 0.12, along) * wire;
    /* The glass is a little deeper beside a vein, and in its own colour: a plain grey on a pastel turns it khaki. */
    vec3 deeper = vec3(1.0) - light;
    deeper = mix(vec3(1.0), deeper / max((deeper.r + deeper.g + deeper.b) / 3.0, 0.01), 0.75);
    c *= vec3(1.0) - (cell * cell * ${(0.1 * WING.texture).toFixed(3)} + (1.0 - smoothstep(0.4, 1.7, veinPx)) * ${(0.1 * WING.veins).toFixed(3)}) * smoothstep(0.2, 0.45, along) * deeper * 0.6;
    /* They fade on the way out, so that a wing is not ruled like a fan. */
    c = mix(c, veinInk, vein * ${WING.veins.toFixed(2)} * min(mix(0.5, 0.0, smoothstep(0.16, 0.72, along)) + passing * 0.2, 1.0));
    float shrunk = min(pxPer / 80.0, 1.0);
    c += vec3(0.13) * vLit.y;

    /* Glass turned edge on to us reflects more than it lets through. */
    float fresnel = 1.0 - min(vLit.z, 1.0);
    c = mix(c, mix(glow, vec3(1.0), 0.3), fresnel * fresnel * fresnel * 0.5);

    /* The light that came in gathers along the edge it cannot get out of, which is the side away from it, and on the side
       towards it the glass has a bright lip. */
    float rimLit = smoothstep(-0.4, 0.7, dot(normalize(edgeSlope + 1e-6), vec2(0.45, -0.89)));
    /* None of the lines round the edge comes all the way in to the root, or each wing would be a petal outlined on its own. */
    float awayFromRoot = smoothstep(0.22, 0.62, r);
    float lipFade = exp(-max(edgePx, 0.0) / (3.5 * shrunk)) * awayFromRoot;
    c += light * lipFade * (1.0 - rimLit) * 0.34 * smoothstep(0.25, 0.5, along);
    c = mix(c, mix(mix(light, vec3(1.0), 0.35), vec3(1.0), 1.0 - near), lipFade * rimLit * mix(0.3, 0.55, 1.0 - near));
    c = mix(c, deep, (1.0 - smoothstep(0.35, 0.95, abs(edgePx - 1.75))) * 0.2 * near * awayFromRoot);
    /* The line round the edge is bright on the side that faces the light, and away from it takes on the colour of the
       glass, and is finer, which is also what holds the wing's shape against the white of the page. The colours come
       apart a little on the way. */
    vec3 rimGlass = mix(mix(sheen, deep, 0.25), rimInk, max(mix(0.3, 1.0, rimLit), 1.0 - smoothstep(0.12, 0.42, reach)));
    vec3 fringe = (vec3(edgePx) + vec3(-0.25, 0.0, 0.25)) / mix(0.72, 1.0, rimLit);
    vec3 rimRgb = vec3(1.0) - smoothstep(vec3(0.5), vec3(1.1), fringe);
    rimRgb *= awayFromRoot;
    c = mix(c, rimGlass, rimRgb * 0.62);
    float rimLine = rimRgb.g;

    /* Red and green add up to brown, so a warm far wing lets a little less of the land through. */
    float clearness = mix(mix(0.86, mix(0.72, 0.84, warm), smoothstep(0.2, 0.7, along)), mix(0.98, 0.95, smoothstep(0.3, 0.95, along)), near);
    /* Green hills through a pastel turn it khaki too, so it lets less of them through. */
    clearness = mix(clearness, 1.0, 0.6);
    /* The strokes thin out at the edge, each at a place of its own, so that the wing's edge is drawn and not cut. */
    float strokeEnds = 0.82 + 0.16 * dice.x;
    clearness *= 1.0 - smoothstep(strokeEnds - 0.05, strokeEnds + 0.05, along) * mix(0.42, 0.26, isFore);
    float show = inside * vWho.z * max(clearness, rimLine * 0.62);
    outColor = vec4(min(c, vec3(1.0)) * show, show);
  }`

  /* The lens fades the picture out over its foot, where the hero's page carries on under it. A composition whose
     picture runs on to the foot of the page keeps its foot instead. One with a bright shape running into its foot eases
     the fade in (`foot: 'ease'`): over a dark page, where an even fade begins shows across such a shape as a line. */
  const LENS_FOOT = 'float foot = clamp(gl_FragCoord.y / (uRes.y * 0.1), 0.0, 1.0);'
  /* A composition whose canvas lies over the page's own content (`lens.clear`) gives only its butterflies through the
     lens, not the picture behind them, so that the page shows through everywhere else: what the lens passes on keeps the
     flock's own alpha, and every channel of the glass at the edges keeps its colour without the picture under it. The
     wings still see the picture, which is the page's colour there, so they look as they do over the heroes' white page.
     Should the lens ever not be the one this expects, the canvas shows nothing at all rather than covering the page. */
  const LENS_CLEAR = [
    ['o = vec4((here.rgb + (1.0 - here.a) * behind) * foot, foot);', 'o = vec4(here.rgb * foot, here.a * foot);'],
    ['vec3 acc = vec3(0.0);', 'vec3 acc = vec3(0.0);\n    float cover = 0.0;'],
    ['acc.r += red.r + (1.0 - red.a) * behind.r;', 'acc.r += red.r;'],
    ['acc.g += green.g + (1.0 - green.a) * behind.g;', 'acc.g += green.g;'],
    [
      'acc.b += blue.b + (1.0 - blue.a) * behind.b;',
      'acc.b += blue.b;\n      cover += max(red.a, max(green.a, blue.a));',
    ],
    ['o = vec4(acc / float(TAPS) * foot, foot);', 'o = vec4(acc / float(TAPS) * foot, cover / float(TAPS) * foot);'],
  ]
  const LENS_NONE = `#version 300 es
  precision highp float;
  out vec4 o;
  void main() {
    o = vec4(0.0);
  }`
  // and one whose top is no edge of the screen either (`lens.top: false`) has no glass along it
  const LENS_TOP = 'each.y *= step(d.y, 0.0);'
  /* A composition whose butterflies fly over water (`lens.mirror`: { at, strength, depth, tint, blur }) has the glass
     draw them again in it: under the waterline, `at` of the way down the canvas, the flock as it is above the line,
     upside down about it, softer (`blur`, a mip of the flock), tinted (`tint`, multiplied into its colour) and paled
     towards the water's own light blue-white, broken a little by ripples that run across the water, and fading out `depth` of the canvas's height under the line, at most
     `strength` as strong as the butterfly itself. Only such a composition's lens has it. With a glowing flock
     (`lens.glow`), it is the glow that the water gives back, its light and halo, the tint multiplying only what the glow
     adds to the water. */
  const lensMirror = ({ at, strength = 0.5, depth = 0.4, tint = [0.75, 0.85, 1.05], blur = 0.8 }, glow = false) => {
    const f = (v) => Number(v).toFixed(4)
    const k = `        float k = ${f(strength)} * (1.0 - smoothstep(0.0, uRes.y * ${f(depth)}, below)) * (0.82 + 0.18 * sin(px.y * 0.9 / u));\n`
    if (glow) {
      return `    {
      float water = uRes.y * ${f(at)};
      float below = px.y - water;
      if (below > 0.0) {
        float u = uRes.y / 600.0;
        float wave = sin(px.y * 0.45 / u + px.x * 0.015 / u) * 1.4 * u + sin(px.y * 0.13 / u) * 2.2 * u;
        vec2 mp = vec2(px.x + wave * (0.5 + below / (uRes.y * 0.2)), water - below);
${k}        behind += (glowOver(behind, mp, ${f(blur)}) - behind) * vec3(${tint.map(f).join(', ')}) * k;
      }
    }
`
    }
    return `    {
      float water = uRes.y * ${f(at)};
      float below = px.y - water;
      if (below > 0.0) {
        float u = uRes.y / 600.0;
        float wave = sin(px.y * 0.45 / u + px.x * 0.015 / u) * 1.4 * u + sin(px.y * 0.13 / u) * 2.2 * u;
        vec2 mp = vec2(px.x + wave * (0.5 + below / (uRes.y * 0.2)), water - below);
        vec4 m = textureLod(uFlock, uvOf(mp), ${f(blur)});
${k}        vec3 seen = mix(m.rgb / max(m.a, 1e-3) * vec3(${tint.map(f).join(', ')}), vec3(0.86, 0.92, 1.0), 0.45);
        behind = mix(behind, seen, m.a * k);
      }
    }
`
  }
  /* A composition whose butterflies are light (`lens.glow`: { core, cream, halo, body, soft, near, far, strength })
     has the glass draw them as a soft shape of light, not glass: where the flock is, a warm white (`core`) going to
     `cream` towards its thinner parts, its edge softened by a mip `soft` of the canvas's width across; round it a halo
     of `halo` light laid over the picture as light is (screened), from two rings of the flock's blurred copies, one
     `near` and one `far` of the canvas's width out, as strong as `strength` gives. The pointer's glass is not drawn over
     such a flock: light is not bent by it. Only such a composition's lens has it. */
  const lensGlow = ({
    core,
    cream,
    halo,
    body = [0.04, 0.4],
    soft = 0.0045,
    near = 0.045,
    far = 0.11,
    strength = [0.75, 0.45],
  }) => {
    const f = (v) => Number(v).toFixed(4)
    const v3 = (c) => `vec3(${c.map(f).join(', ')})`
    return `  vec3 glowOver(vec3 land, vec2 p, float lod) {
    float w = uRes.x;
    float a = textureLod(uFlock, uvOf(p), log2(max(w * ${f(soft)}, 1.0)) + lod).a;
    float near = 0.0;
    float far = 0.0;
    for (int i = 0; i < 12; i++) {
      float turn = float(i) * 0.5235988 + 0.2618;
      vec2 o = vec2(cos(turn), sin(turn));
      near += textureLod(uFlock, uvOf(p + o * w * ${f(near)}), log2(w * ${f(near)}) + lod).a;
      far += textureLod(uFlock, uvOf(p + o * w * ${f(far)}), log2(w * ${f(far)}) + lod).a;
    }
    float light = 1.0 - (1.0 - min(near / 12.0 * ${f(strength[0])} * 2.0, 1.0)) * (1.0 - min(far / 12.0 * ${f(strength[1])} * 2.0, 1.0));
    vec3 c = vec3(1.0) - (vec3(1.0) - land) * (vec3(1.0) - ${v3(halo)} * light);
    return mix(c, mix(${v3(cream)}, ${v3(core)}, smoothstep(0.35, 1.0, a)), smoothstep(${f(body[0])}, ${f(body[1])}, a));
  }
`
  }
  const lensFragment = (mode) => {
    let fragment = mode.lens.foot === false ? LENS_FRAGMENT.replace(LENS_FOOT, 'float foot = 1.0;') : LENS_FRAGMENT
    if (mode.lens.foot === 'ease') {
      fragment = fragment.replace(LENS_FOOT, 'float foot = smoothstep(0.0, 1.0, gl_FragCoord.y / (uRes.y * 0.1));')
    }
    if (mode.lens.top === false) {
      if (!fragment.includes(LENS_TOP)) {
        return LENS_NONE
      }
      fragment = fragment.replace(LENS_TOP, 'each.y = 0.0;')
    }
    if (mode.lens.glow) {
      const swaps = [
        ['  void main() {', `${lensGlow(mode.lens.glow)}  void main() {`],
        ['vec4 soft = textureLod(uFlock, uvOf(px), uHalo.x);', 'vec4 soft = vec4(0.0);'],
        ['float t = clamp((v - uIn) / (1.0 - uIn), 0.0, 1.0);', 'float t = 0.0;'],
        ['vec4 here = textureLod(uFlock, uvOf(px), 0.0);', 'vec4 here = vec4(0.0);'],
      ]
      if (swaps.some(([from]) => !fragment.includes(from))) {
        return fragment
      }
      for (const [from, to] of swaps) {
        fragment = fragment.replace(from, to)
      }
    }
    if (mode.lens.mirror || mode.lens.glow) {
      const anchor = '    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);\n'
      if (!fragment.includes(anchor)) {
        return fragment
      }
      const mirror = mode.lens.mirror ? lensMirror(mode.lens.mirror, !!mode.lens.glow) : ''
      const glow = mode.lens.glow ? '    behind = glowOver(behind, px, 0.0);\n' : ''
      fragment = fragment.replace(anchor, anchor + mirror + glow)
    }
    if (mode.lens.clear) {
      for (const [from, to] of LENS_CLEAR) {
        if (!fragment.includes(from)) {
          return LENS_NONE
        }
        fragment = fragment.replace(from, to)
      }
    }
    return fragment
  }
  /* Each line shoots across on the way in, a little ahead of or behind the next, and the front of a few never quite
     reaches the canvas's right edge, so they stop a pixel or two short of it for good. The hero's land fades out before
     its edges, but land that runs off the side of the screen, as the footer's does, would show notches of page there; a
     composition whose lines run the whole way across (`lines.whole`) carries every line's front past the edge as the
     opening ends. The hero's line shader is as it was. */
  const LINE_FRONT = 'float front = uHead * 1.3 - dice.x * 0.3;'
  /* On a light page the land between a sheet's lines is lifted towards white, 0.3 of the way, as the hero has it. A
     composition can lift it less (`lines.lift`), so that its land in shade reads as deep paint rather than as stripes;
     without one the shader is as it was. */
  const LINE_LIFT = 'mix(0.3, 0.0, uDark)'
  /* In a composition's glow a sheet with a glowing part of its own (`glow`, a second paint, read across the sheet as its
     paint is) takes its colours, as much as the glow is near and the sheet takes of it (uGlowTake); a sheet that
     `shimmer`s takes it in streaks along its lines, as the sea takes a reflection, the streaks drifting slowly. */
  const LINE_BAND = '    vec4 band = uRow >= 0.0 ? texture(uPaint, vec2(clamp(t, 0.0, 1.0), uRow)) : vec4(0.0);\n'
  const LINE_OWN = '    vec4 own = texture(uPaint, vec2(clamp(t, 0.0, 1.0), max(uRow, 0.0)));\n'
  const glowFragment = (whole) =>
    whole
      .replace(
        '  in float vSheen;\n',
        '  in float vSheen;\n  in float vGlow;\n  uniform float uGlowRow;\n  uniform float uGlowTake;\n  uniform float uShimmer;\n',
      )
      .replace(
        LINE_BAND,
        `${LINE_BAND}    float lit = 0.0;
    if (uGlowRow >= 0.0) {
      float streak = noise(vec2(line * 0.043 + uRow * 31.0, css.x * 0.0105 - uClock * 0.035));
      lit = clamp(vGlow * uGlowTake * mix(1.0, 0.25 + 1.5 * streak, uShimmer), 0.0, 1.0);
      band = mix(band, texture(uPaint, vec2(clamp(t, 0.0, 1.0), uGlowRow)), lit);
    }
`,
      )
      .replace(
        LINE_OWN,
        `${LINE_OWN}    if (uGlowRow >= 0.0) {
      own = mix(own, texture(uPaint, vec2(clamp(t, 0.0, 1.0), uGlowRow)), lit);
    }
`,
      )
  /* Round the words the veil is a soft oval of page: the lines clear in its middle and come back towards its rim. A
     composition can have it thin them instead (`lines.veilDepth`, how much at its middle, [on a light page, on a dark
     page]): there a band thins as it does at its own edges, its lines finer and fewer, its haze breaking into specks and
     its beads fewer, by that much at the veil's middle and less and less out to its rim, so the words stand in a quieter
     part of the sky with the lines running on behind them, never in a hole. Without one the veil is as it was. */
  const LINE_BODY = '    float body = max(band.a, dyed);\n'
  const LINE_BEADS = 'smoothstep(0.0, 0.5, body)))'
  const LINE_CLEAR = '    float clear = smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw));\n'
  const veilFragment = (whole, [light, dark]) =>
    whole
      .replace(
        LINE_BODY,
        `${LINE_BODY}    float veil = (1.0 - smoothstep(uWordsCore, 1.0, length((css - uWords.xy) / uWords.zw))) * mix(${light.toFixed(3)}, ${dark.toFixed(3)}, uDark);
    body *= 1.0 - veil;
`,
      )
      .replace(LINE_BEADS, 'smoothstep(0.0, 0.5, body)) * (1.0 - veil))')
      .replace(LINE_CLEAR, '    float clear = 1.0;\n')
  /* A composition with a sun (see the pricing composition) has a disc of light stand behind its words, made of the land's
     own lines: every sheet that takes it (a sheet's `sun`, [lines, light]) has its lines take its colours as they run
     into it, white at its middle, warm towards its face's edge, glowing at its rim and in the glow and the halo just
     past it, and less and less out to the halo's reach, where they are their own colours again; on its face they keep
     only so much of their strength and of their beads (`lines`), and each is its ink exactly, none of them a shade
     darker than the next, so that its middle is white rather than grey. Under its lines it lays a light of its own, not lines
     at all: on its face, along its rim (brightest just inside it, `rim` wide) and in its halo, coming in from nothing
     down the canvas over `rise`, so that it can rise higher than the lines do, and sweeping in with them on the way in.
     The light takes the grain, as the sky's own wash does. */
  const LINE_DARK = '  uniform float uDark;\n'
  const LINE_SHEEN = '    paint = mix(paint, uSheenInk, vSheen * uSheen * 0.7);\n'
  const LINE_FILL = '    float fill = uFill * pow(body, 0.7) * (0.82 + 0.36 * dice.y);\n'
  const LINE_RUNS = '    cover *= step(dice2(vec2(line, floor(runAt))).x, 0.6 + body);\n'
  const LINE_CHANCE = '    bead *= step(roll.x, uBeadChance * '
  const LINE_COVERED = '    float covered = smoothstep(grain - 0.25, grain + 0.25, own.a * 1.8);\n'
  const LINE_SHADE = 'paint * (0.92 + 0.16 * dice.y)'
  const LINE_HAZE = 'float alpha = max(cover, haze * uUnder);'
  const LINE_OUT =
    '    outColor = vec4(min(color, vec3(1.0)) * alpha + wash * solid * (1.0 - alpha), alpha + solid * (1.0 - alpha));\n'
  const sunFragment = (whole) =>
    whole
      .replace(
        LINE_DARK,
        `${LINE_DARK}  uniform vec4 uSun;\n  uniform vec4 uSunShape;\n  uniform vec2 uSunRise;\n  uniform vec3 uSunInks[5];\n  uniform vec3 uSunLight;\n  uniform vec2 uSunTake;\n`,
      )
      .replace(
        LINE_SHEEN,
        `${LINE_SHEEN}    float sunAt = length(css - uSun.xy) / uSun.z;
    float sunFace = 1.0 - smoothstep(uSun.w, 1.0, sunAt);
    float sunOut = smoothstep(1.0, 1.0 + uSunShape.x, sunAt);
    vec3 sunInk = mix(uSunInks[0], uSunInks[1], smoothstep(0.0, uSun.w, sunAt));
    sunInk = mix(sunInk, uSunInks[2], smoothstep(uSun.w, 1.0, sunAt));
    sunInk = mix(sunInk, uSunInks[3], smoothstep(1.0, 1.0 + 0.35 * uSunShape.x, sunAt));
    sunInk = mix(sunInk, uSunInks[4], smoothstep(1.0 + 0.2 * uSunShape.x, 1.0 + uSunShape.x, sunAt));
    float sunTake = uSunTake.x * (1.0 - sunOut) * (1.0 - sunOut);
    paint = mix(paint, sunInk, sunTake);
    body *= mix(1.0, uSunShape.z, sunFace * uSunTake.x);
`,
      )
      .replace(LINE_CHANCE, `${LINE_CHANCE}mix(1.0, uSunShape.w, sunFace * uSunTake.x) * `)
      .replace(LINE_SHADE, 'paint * mix(0.92 + 0.16 * dice.y, 1.0, sunFace * uSunTake.x)')
      .replace(LINE_COVERED, `    own.rgb = mix(own.rgb, sunInk, sunTake);\n${LINE_COVERED}`)
      .replace(
        LINE_OUT,
        `${LINE_OUT}    float sunEdge = (sunAt - 1.0 + uSunShape.y) / uSunShape.y;
    float sunRim = exp(-sunEdge * sunEdge);
    float sunHalo = (1.0 - sunOut) * (1.0 - sunOut) * smoothstep(uSun.w, 1.0, sunAt);
    float sunFront = uHead * 1.6 - 0.3;
    float sunLight = (uSunLight.x * sunFace + uSunLight.y * sunRim + uSunLight.z * sunHalo) * smoothstep(uSunRise.x, uSunRise.y, css.y);
    sunLight = clamp(sunLight * uSunTake.y * (1.0 - smoothstep(sunFront - 0.3, sunFront, along)), 0.0, 1.0);
    vec3 sunGrain = mix(2.0 * sunInk * grain, 1.0 - 2.0 * (1.0 - sunInk) * (1.0 - grain), step(0.5, sunInk));
    outColor += vec4(min(mix(sunInk, sunGrain, 0.3), vec3(1.0)) * sunLight, sunLight) * (1.0 - outColor.a);
`,
      )
  /* A composition can have a sheet's lines (a sheet with `fade`) come in from nothing down the canvas, over a long eased
     ramp (`fade.at`, `fade.ease`), as a band thins at its own edge: they are finer, and fewer (`sparse`), their colour
     nearer the page's (`pale`), their haze breaking into the grain's specks and coming in only slowly, so that where it
     starts is no edge, and fewer beads on them (`specks`); so the top of the picture is the page itself, with at most a
     speck, and the lines are at their full only further down. */
  const fadeFragment = (whole) =>
    whole
      .replace(LINE_DARK, `${LINE_DARK}  uniform vec4 uFade;\n  uniform vec3 uFadeLook;\n`)
      .replace(
        LINE_FILL,
        `    float fade = mix(1.0, pow(smoothstep(uFade.x, uFade.y, css.y), uFade.z), uFade.w);
    body *= fade;
    paint = mix(paint, uPage, (1.0 - fade) * uFadeLook.x * uFade.w);
${LINE_FILL}`,
      )
      .replace(
        LINE_RUNS,
        `${LINE_RUNS}    cover *= step(fract(dice.z * 61.7 + dice.w * 17.3), mix(1.0, pow(fade, uFadeLook.y), uFade.w));\n`,
      )
      .replace(LINE_HAZE, 'float alpha = max(cover, haze * uUnder * mix(1.0, fade * fade, uFade.w));')
      .replace(LINE_CHANCE, `${LINE_CHANCE}mix(1.0, pow(fade, uFadeLook.z), uFade.w) * `)
  const lineFragment = (mode) => {
    const whole = mode.lines.whole
      ? LINE_FRAGMENT.replace(
          LINE_FRONT,
          'float front = uHead * 1.3 - dice.x * 0.3 + 0.03 * smoothstep(0.85, 1.0, uHead);',
        )
      : LINE_FRAGMENT
    const lifted =
      mode.lines.lift === undefined ? whole : whole.replace(LINE_LIFT, `mix(${mode.lines.lift.toFixed(3)}, 0.0, uDark)`)
    const glowing = mode.glow ? glowFragment(lifted) : lifted
    const veiled = mode.lines.veilDepth ? veilFragment(glowing, mode.lines.veilDepth) : glowing
    const sunlit = mode.sun ? sunFragment(veiled) : veiled
    return mode.fade ? fadeFragment(sunlit) : sunlit
  }
  /* --- programs ------------------------------------------------------------------------------------ */

  /* Compiling shaders is slow, and asking how it went makes the page wait for the answer. So they are sent off here, and
     nothing is asked until the browser says that they are done. */
  const startProgram = (gl, vert, frag) => {
    const program = gl.createProgram()
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vert],
      [gl.FRAGMENT_SHADER, frag],
    ]) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    return { program, uniforms: {} }
  }

  const finishProgram = async (gl, built) => {
    const parallel = gl.getExtension('KHR_parallel_shader_compile')
    while (parallel && !gl.getProgramParameter(built.program, parallel.COMPLETION_STATUS_KHR)) {
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
    if (!gl.getProgramParameter(built.program, gl.LINK_STATUS)) {
      const logs = gl
        .getAttachedShaders(built.program)
        .map((shader) => gl.getShaderInfoLog(shader))
        .filter(Boolean)
      throw new Error(gl.getProgramInfoLog(built.program) || logs.join('\n') || 'link failed')
    }
    const count = gl.getProgramParameter(built.program, gl.ACTIVE_UNIFORMS)
    for (let index = 0; index < count; index += 1) {
      const name = gl.getActiveUniform(built.program, index).name.replace('[0]', '')
      built.uniforms[name] = gl.getUniformLocation(built.program, name)
    }
  }

  /* --- helpers ------------------------------------------------------------------------------------- */

  /* A small, repeatable random, so every visit is the same meadow. It can be set back to any seed, so that a part of
     the meadow can draw from a seed of its own and stay as it is when the stage is resized a little. */
  const random = (seed) => {
    let state = seed >>> 0
    const next = () => {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    next.reseed = (value) => {
      state = value >>> 0
    }
    return next
  }
  const fract = (value) => value - Math.floor(value)
  const hashed = (value) => fract(Math.sin(value * 127.1 + 311.7) * 43758.5453)
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
  const smooth = (from, to, value) => {
    const t = clamp((value - from) / (to - from), 0, 1)
    return t * t * (3 - 2 * t)
  }

  /* Colours are asked for every frame, so each is worked out once, as 0 to 1. */
  const rgbOf = new Map()
  const rgb = (hex) => {
    let found = rgbOf.get(hex)
    if (!found) {
      const n = Number.parseInt(hex.slice(1), 16)
      found = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
      rgbOf.set(hex, found)
    }
    return found
  }
  /* The same as 0 to 255, for the textures. */
  const hexToRgb = (hex) => rgb(hex).map((c) => Math.round(c * 255))

  const loadImage = (src) =>
    new Promise((resolve) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = src
    })

  /* A closed curve through an outline's points. The spacing of the points is not even, so this is the
     centripetal kind of Catmull-Rom, which does not loop. */
  const smoothOutline = (flat) => {
    const points = []
    for (let index = 0; index < flat.length; index += 2) {
      points.push([flat[index], flat[index + 1]])
    }
    const n = points.length
    const at = (index) => points[(index + n) % n]
    const knot = (a, b) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5)
    const between = (a, b, ta, tb, t) => {
      const f = (t - ta) / (tb - ta)
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    const line = []
    for (let index = 0; index < n; index += 1) {
      const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)]
      const t1 = knot(p0, p1)
      const t2 = t1 + knot(p1, p2)
      const t3 = t2 + knot(p2, p3)
      for (let step = 0; step < 24; step += 1) {
        const t = t1 + ((t2 - t1) * step) / 24
        const a1 = between(p0, p1, 0, t1, t)
        const a2 = between(p1, p2, t1, t2, t)
        const a3 = between(p2, p3, t2, t3, t)
        const b1 = between(a1, a2, 0, t2, t)
        const b2 = between(a2, a3, t1, t3, t)
        line.push(between(b1, b2, t1, t2, t))
      }
    }
    return line
  }

  /* An outline as a radius for each angle: the farthest it reaches along that ray from the root. */
  const toRadii = (flat, range, count, [waves, depth]) => {
    const line = smoothOutline(flat)
    const radii = new Float32Array(count)
    for (let index = 0; index < line.length; index += 1) {
      const [a0, b0] = line[index]
      const [a1, b1] = line[(index + 1) % line.length]
      const ang0 = Math.atan2(a0, b0)
      const ang1 = Math.atan2(a1, b1)
      const from = Math.min(ang0, ang1)
      const to = Math.max(ang0, ang1)
      // Between the first point and the last the outline goes over the root, which is not an edge.
      if (to - from > 1) {
        continue
      }
      // Every slot it touches, and the one either side: a piece narrower than a slot would leave a hole in a steep edge.
      const first = Math.floor(((from - range[0]) / (range[1] - range[0])) * (count - 1))
      const last = Math.ceil(((to - range[0]) / (range[1] - range[0])) * (count - 1))
      for (let slot = Math.max(0, first); slot <= Math.min(count - 1, last); slot += 1) {
        const angle = range[0] + (slot / (count - 1)) * (range[1] - range[0])
        const f = to > from ? Math.max(0, Math.min(1, (angle - ang0) / (ang1 - ang0))) : 0
        const radius = Math.hypot(a0 + (a1 - a0) * f, b0 + (b1 - b0) * f)
        radii[slot] = Math.max(radii[slot], radius)
      }
    }
    // A steep edge comes out of that in small stairs, which a line along it would show as dashes, so they are sanded off.
    for (let pass = 0; pass < 4; pass += 1) {
      let before = radii[0]
      for (let slot = 1; slot < count - 1; slot += 1) {
        const here = radii[slot]
        radii[slot] = (before + here * 2 + radii[slot + 1]) / 4
        before = here
      }
    }
    if (waves) {
      for (let slot = 0; slot < count; slot += 1) {
        const u = slot / (count - 1)
        radii[slot] *= 1 - depth * (1 - Math.abs(Math.sin(Math.PI * waves * u)) ** 0.7) * 2
      }
    }
    return radii
  }

  /* A static mesh for one butterfly: the far wings, the near wings, the soft middle where they meet, and its two fine antennae, in the order they are
     painted. There are no legs, which only made it look like a bug. A wing is a grid, so that it
     can bend, and its corners are all a triangle list. */
  const buildMesh = () => {
    const out = []
    const wing = (box, kind, side) => {
      const [a0, a1, b0, b1] = box
      const n = 10
      const vertex = (i, j) => {
        out.push(a0 + ((a1 - a0) * i) / n, b0 + ((b1 - b0) * j) / n, kind, side)
      }
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          vertex(i, j)
          vertex(i + 1, j)
          vertex(i, j + 1)
          vertex(i, j + 1)
          vertex(i + 1, j)
          vertex(i + 1, j + 1)
        }
      }
    }
    const strip = (x0, x1, w, kind, side, segments) => {
      for (let index = 0; index < segments; index += 1) {
        const a = x0 + ((x1 - x0) * index) / segments
        const b = x0 + ((x1 - x0) * (index + 1)) / segments
        out.push(
          a,
          -w,
          kind,
          side,
          b,
          -w,
          kind,
          side,
          a,
          w,
          kind,
          side,
          a,
          w,
          kind,
          side,
          b,
          -w,
          kind,
          side,
          b,
          w,
          kind,
          side,
        )
      }
    }
    wing(HIND_BOX, 1, 1)
    wing(FORE_BOX, 0, 1)
    wing(HIND_BOX, 1, -1)
    wing(FORE_BOX, 0, -1)
    strip(-0.4, 0.24, 0.1, 2, 1, 1)
    strip(0, 1, 1, 6, 1, 12)
    strip(0, 1, 1, 6, -1, 12)
    return new Float32Array(out)
  }

  /* --- init ---------------------------------------------------------------------------------------- */

  /* A root is bound at once, and built at once too, unless its composition waits until it comes near the screen
     (`wake`): a page need not build a meadow far below while it is still loading. */
  const init = (root) => {
    if (root.dataset.hlHeroBound === 'true') {
      return
    }
    const canvas = root.querySelector('[data-hl-canvas]')
    if (!canvas) {
      return
    }
    root.dataset.hlHeroBound = 'true'
    const mode = modeOf(root)
    if (!mode.wake) {
      start(root, canvas, mode)
      return
    }
    // Built by the builder, a step at a time, each in a moment it fits in (see the builder), unless the root comes near
    // the screen first, when it is built at once, still a few milliseconds at a time. The job belongs to this binding of
    // the root only, so a root let go of and bound again is never started twice.
    const binding = {}
    root.hlBinding = binding
    const job = { urgent: false, next: null, steps: null }
    const soon = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          job.urgent = true
          soon.disconnect()
          builder.hurry()
        }
      },
      { rootMargin: mode.near || '0px' },
    )
    let wake = null
    // A root that leaves the page before it is built is let go of unbuilt; one that leaves while it is being built is let
    // go of by its start's own steps, or once it has one, by its own release.
    const release = () => {
      if (!canvas.isConnected) {
        wake?.disconnect()
        soon.disconnect()
        heroes.delete(release)
        delete root.dataset.hlHeroBound
      }
    }
    job.steps = (function* () {
      if (!canvas.isConnected || root.hlBinding !== binding) {
        release()
        heroes.delete(release)
        soon.disconnect()
        return
      }
      yield* gpuCalm()
      const rest = yield* startSteps(root, canvas, mode)
      if (rest) {
        yield* rest
      }
      soon.disconnect()
      // a root that went while it was being built gives back its binding, so it binds again if it comes back
      release()
      heroes.delete(release)
    })()
    heroes.add(release)
    soon.observe(canvas)
    if (mode.wake === 'idle') {
      builder.add(job)
      return
    }
    wake = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          wake.disconnect()
          builder.add(job)
        }
      },
      { rootMargin: mode.wake },
    )
    wake.observe(canvas)
  }

  /* The hero is started at once, all of it in one go. */
  const start = (root, canvas, mode) => {
    const steps = startSteps(root, canvas, mode)
    let step = steps.next()
    while (!step.done) {
      step = steps.next()
    }
    return step.value
  }

  /* A root's start, as steps: the hero runs them all at once (start), and the builder runs them for any other root, as
     many at a go as fit in the moment it has (see the builder). Each step that cannot be split, asking for the context,
     sending a program off to compile, giving the GPU a texture or a buffer, sorting the strokes, is announced first by
     yielding what it costs (COST). It returns the rest of the build, which waits for the shaders and then lays the root
     out (`building`), or nothing for the hero, which does that as it goes. */
  const startSteps = function* (root, canvas, mode) {
    yield COST.context
    if (!canvas.isConnected) {
      return null
    }
    // A root the builder builds is sized before it asks for its context, which then makes its drawing buffer once, at
    // that size, rather than at the default size and again when the canvas is sized, which costs as much as the context.
    if (mode.near) {
      const box = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(2, Math.round(Math.max(1, box.width) * ratio))
      canvas.height = Math.max(2, Math.round(Math.max(1, box.height) * ratio))
    }
    // Transparent until the first frame is drawn. No depth or stencil: nothing here uses them.
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
    })
    if (!gl) {
      if (root.dataset.hlShown !== 'true') {
        root.dataset.hlFallback = 'true'
      }
      resumes.delete(root)
      return null
    }
    contexts.add(gl)
    // A root let go of while it is still starting gives its context back at once.
    const gone = () => {
      if (canvas.isConnected) {
        return false
      }
      contexts.delete(gl)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    }

    // Only what the composition draws is compiled: no land without sheets, no glass without clouds, no wings or lens
    // without a flock, and a sky only for a composition with one of its own. Each is sent off in a step of its own.
    gl.getExtension('KHR_parallel_shader_compile')
    const { sheets } = mode.land
    const programs = []
    const send = (vert, frag) => {
      const built = startProgram(gl, vert, frag)
      programs.push(built)
      return built
    }
    const wanted = [
      ['land', sheets.length > 0, () => send(landVertex(mode), lineFragment(mode))],
      ['blades', true, () => send(BLADE_VERTEX, bladeFragment(mode))],
      ['blooms', true, () => send(bloomVertexOf(mode), bloomFragment(mode))],
      ['clouds', mode.clouds.length > 0, () => send(CLOUD_VERTEX, CLOUD_FRAGMENT)],
      ['copy', true, () => send(FULL_VERTEX, COPY_FRAGMENT)],
      ['fly', mode.lensed, () => send(FLY_VERTEX, FLY_FRAGMENT)],
      ['lens', mode.lensed, () => send(LENS_VERTEX, lensFragment(mode))],
      ['sky', !!mode.sky, () => send(FULL_VERTEX, SKY_FRAGMENT)],
      ['cut', !!(mode.behind && mode.land.front), () => send(FULL_VERTEX, CUT_FRAGMENT)],
    ]
    const sent = {}
    for (const [name, needed, make] of wanted) {
      if (!needed) {
        sent[name] = null
        continue
      }
      yield COST.program
      if (gone()) {
        return null
      }
      sent[name] = make()
    }
    const { land, blades, blooms, clouds, copy, fly, lens, sky, cut } = sent
    // the textures it keeps, and then its buffers, each a step of its own
    yield COST.texture
    if (gone()) {
      return null
    }
    // The still picture is drawn under reduced motion, and always for a composition painted once.
    const isStill = () => PREFERS_REDUCED.matches || mode.draw === 'once'
    // A root with no `near` draws again whenever it has to, as the hero always has, while it is within a screen of view;
    // any other is painted again only when it comes as near as its `near` says.
    const eager = !mode.near

    const texture = (unit) => {
      const t = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      return t
    }
    const clampLinear = () => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    /* ---- the butterflies' wings and inks, as /products/api-hosting keeps them ---- */
    const shapeRows = WING_NAMES.length * 2
    const shapes = new Float32Array(SHAPE_WIDTH * shapeRows)
    WING_NAMES.forEach((name, row) => {
      const w = WINGS[name]
      shapes.set(toRadii(w.fore, FORE_RANGE, SHAPE_WIDTH, [w.scallop[0], w.scallop[1]]), row * 2 * SHAPE_WIDTH)
      shapes.set(toRadii(w.hind, HIND_RANGE, SHAPE_WIDTH, [w.scallop[2], w.scallop[3]]), (row * 2 + 1) * SHAPE_WIDTH)
    })
    const shapesTex = texture(0)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, SHAPE_WIDTH, shapeRows, 0, gl.RED, gl.FLOAT, shapes)
    clampLinear()

    // The butterflies' pastels, seven inks to a row.
    const inkData = new Uint8Array(7 * PASTEL_NAMES.length * 4)
    PASTEL_NAMES.forEach((name, row) => {
      PASTELS[name].inks.forEach((hex, col) => {
        inkData.set([...hexToRgb(hex), 255], (row * 7 + col) * 4)
      })
    })
    const inksTex = texture(0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 7, PASTEL_NAMES.length, 0, gl.RGBA, gl.UNSIGNED_BYTE, inkData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

    // The land's colours, a row for each sheet, built for the page's theme. A sheet whose paint names another sheet is
    // painted as that one is, from its row, so sheets added after the rest leave every other sheet's row (and with it
    // its patches) as it was.
    const paintRow = sheets.map((sheet, row) =>
      typeof sheet.paint === 'string' ? sheets.findIndex((other) => other.name === sheet.paint) : row,
    )
    // With a glow, each sheet with a glowing part of its own has a row for its paint there too, after all the rest.
    const glowRow = []
    if (mode.glow) {
      let next = Math.max(1, ...paintRow.map((row) => row + 1))
      sheets.forEach((sheet, row) => {
        glowRow[row] = sheet.glow ? next++ : -1
      })
    }
    const paintRows = Math.max(1, ...paintRow.map((row) => row + 1), ...glowRow.map((row) => row + 1))
    // The order the sheets are drawn in: those in front of what stands in front of the canvas on the page (land.front, in
    // its own order) after all the rest, which are behind it.
    const frontRows = (mode.land.front || [])
      .map((name) => sheets.findIndex((sheet) => sheet.name === name))
      .filter((row) => row >= 0)
    const landOrder = [...sheets.keys()].filter((row) => !frontRows.includes(row)).concat(frontRows)
    const paintTex = gl.createTexture()
    const paintLand = (dark) => {
      const rows = paintRows
      const ramp = new Uint8Array(256 * rows * 4)
      const ramps = sheets.map((sheet, row) => [sheet.paint, row])
      sheets.forEach((sheet, row) => {
        if (glowRow[row] >= 0) {
          ramps.push([sheet.glow, glowRow[row]])
        }
      })
      ramps.forEach(([stops, row]) => {
        if (typeof stops === 'string') {
          return
        }
        for (let slot = 0; slot < 256; slot += 1) {
          const u = slot / 255
          let k = 0
          while (k < stops.length - 2 && stops[k + 1][0] < u) {
            k += 1
          }
          const [u0, ink0, a0] = stops[k]
          const [u1, ink1, a1] = stops[k + 1]
          const f = clamp((u - u0) / (u1 - u0 || 1), 0, 1)
          const c0 = hexToRgb(mode.inks[ink0][dark ? 1 : 0])
          const c1 = hexToRgb(mode.inks[ink1][dark ? 1 : 0])
          ramp.set(
            [
              c0[0] + (c1[0] - c0[0]) * f,
              c0[1] + (c1[1] - c0[1]) * f,
              c0[2] + (c1[2] - c0[2]) * f,
              (a0 + (a1 - a0) * f) * 255,
            ],
            (row * 256 + slot) * 4,
          )
        }
      })
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, paintTex)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 256, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramp)
      clampLinear()
    }

    let grainTex = null
    const buildGrain = async () => {
      const image = await loadImage(GRAIN)
      const tile = document.createElement('canvas')
      tile.width = GRAIN_TILE
      tile.height = GRAIN_TILE
      const pen = tile.getContext('2d', { willReadFrequently: true })
      if (image) {
        pen.drawImage(image, 0, 0)
      }
      const rgba = pen.getImageData(0, 0, GRAIN_TILE, GRAIN_TILE).data
      const grey = new Uint8Array(GRAIN_TILE * GRAIN_TILE)
      let sum = 0
      for (let i = 0; i < grey.length; i += 1) {
        grey[i] = rgba[i * 4]
        sum += grey[i]
      }
      // A browser that cannot draw the filter draws the square black, and the lines would all vanish.
      const mean = sum / grey.length
      if (mean < 96 || mean > 160) {
        for (let i = 0; i < grey.length; i += 1) {
          grey[i] = 128 + 96 * (hashed(i * 0.137) - 0.5)
        }
      }
      grainTex = texture(0)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, GRAIN_TILE, GRAIN_TILE, 0, gl.RED, gl.UNSIGNED_BYTE, grey)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    }

    // The land is drawn into a texture of its own, which the glass reads; the land with its clouds and flowers is the scene the
    // lens lays the butterflies over; and the butterflies are a layer of their own, which the lens reads.
    const landTex = gl.createTexture()
    const landFbo = gl.createFramebuffer()
    const sceneTex = gl.createTexture()
    const sceneFbo = gl.createFramebuffer()
    const flockTex = gl.createTexture()
    const flockFbo = gl.createFramebuffer()

    yield COST.upload
    if (gone()) {
      return null
    }
    /* ---- buffers ---- */
    const corners = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
    const emptyVao = gl.createVertexArray()
    const instanced = (layout) => {
      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, corners)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      const stride = layout.reduce((sum, size) => sum + size, 0)
      let offset = 0
      layout.forEach((size, index) => {
        gl.enableVertexAttribArray(index + 1)
        gl.vertexAttribPointer(index + 1, size, gl.FLOAT, false, stride * 4, offset * 4)
        gl.vertexAttribDivisor(index + 1, 1)
        offset += size
      })
      gl.bindVertexArray(null)
      return { vao, buffer, stride, layout, count: 0 }
    }
    // WebGL 2 has no first instance to start a draw from, so the attributes are pointed at the run's first one instead.
    const drawRun = (instances, first, count) => {
      if (count <= 0) {
        return
      }
      gl.bindVertexArray(instances.vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, instances.buffer)
      let offset = first * instances.stride
      instances.layout.forEach((size, index) => {
        gl.vertexAttribPointer(index + 1, size, gl.FLOAT, false, instances.stride * 4, offset * 4)
        offset += size
      })
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
    }
    const bladeVao = instanced([4, 4, 4])
    // A stroke of paint: its root, stem and half-length; its half-width, turn, blur and dice; how it sways and when it
    // grows, as a blade's; and its two colours, what it is, and how much paint it carries or how many petals it has.
    const bloomVao = instanced([4, 4, 4, 4])
    // The flowers' colours for each theme, worked out once.
    const paintsFor = (dark) =>
      new Float32Array(mode.paintNames.flatMap((name) => rgb((mode.paints[name] || mode.inks[name])[dark ? 1 : 0])))
    const paints = [paintsFor(false), paintsFor(true)]
    const cloudVao = gl.createVertexArray()
    gl.bindVertexArray(cloudVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
    gl.bindVertexArray(null)

    // The land's sheets as one mesh.
    const landVao = gl.createVertexArray()
    gl.bindVertexArray(landVao)
    const landVertices = gl.createBuffer()
    const landIndices = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, landVertices)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landIndices)
    gl.bindVertexArray(null)
    let landRanges = []

    yield COST.upload
    if (gone()) {
      return null
    }
    // The butterflies: one mesh, and a row of numbers for each.
    const FLOATS = 28
    const mesh = buildMesh()
    const meshCount = mesh.length / 4
    const flyVao = gl.createVertexArray()
    gl.bindVertexArray(flyVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
    const flyData = new Float32Array(Math.max(1, mode.flock.length) * FLOATS)
    const flyBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, flyBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flyData.byteLength, gl.DYNAMIC_DRAW)
    for (const [loc, size, offset] of [
      [2, 4, 0],
      [3, 3, 16],
      [4, 3, 28],
      [5, 4, 40],
      [6, 4, 56],
      [7, 1, 72],
      [8, 4, 80],
      [9, 3, 96],
    ]) {
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, FLOATS * 4, offset)
      gl.vertexAttribDivisor(loc, 1)
    }
    gl.bindVertexArray(null)

    yield
    if (gone()) {
      return null
    }
    /* ---- the stage ---- */
    // the composition's lens, which the stage and the last pass both read
    const optics = mode.lens
    // The words the land keeps clear of: an element in the root, a box on the canvas, or none, which is far away.
    const copyBox = typeof mode.words === 'string' ? root.querySelector(mode.words) : null
    let cssW = 0
    let cssH = 0
    let w = 0
    let h = 0
    let dpr = 1
    // a composition as rich as the pricing glade's draws at a little less than the screen's density (see dprCap there)
    let dprCap = mode.dprCap || 2
    let dirty = true
    let fit = 1
    // Where the words stand, in CSS pixels from the canvas's top left: their middle and half their size.
    const words = mode.words ? { x: 0, y: 0, a: 0, b: 0 } : { x: -1e5, y: -1e5, a: 1, b: 1 }
    // The box that whatever stands in front of the canvas on the page hides, in the same terms.
    let hidden = null
    let landBase = 0
    let landRoom = 1
    let glass = { bandX: 0, bandY: 0, reachX: 0 }

    /* What the land in front of the element in front of the canvas keeps clear of, as boxes on the canvas in CSS pixels:
       inside each of the composition's `keep` elements in it, every line of text, and every link, button, picture and
       control, with room round a link or a control for the ring it shows when it has the focus. */
    const RING = 4
    const keepOf = (front, rect) => {
      const boxes = []
      const add = (box, pad) => {
        if (box.width > 0 && box.height > 0) {
          boxes.push({
            left: box.left - rect.left - pad,
            top: box.top - rect.top - pad,
            right: box.right - rect.left + pad,
            bottom: box.bottom - rect.top + pad,
          })
        }
      }
      for (const holder of mode.keep ? front.querySelectorAll(mode.keep) : []) {
        const texts = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT)
        const range = document.createRange()
        for (let text = texts.nextNode(); text; text = texts.nextNode()) {
          if (text.textContent.trim()) {
            range.selectNodeContents(text)
            for (const line of range.getClientRects()) {
              add(line, 0)
            }
          }
        }
        for (const element of holder.querySelectorAll(
          'a, button, input, select, textarea, img, svg, video, canvas, [tabindex]',
        )) {
          add(
            element.getBoundingClientRect(),
            element.matches('a, button, input, select, textarea, [tabindex]') ? RING : 0,
          )
        }
      }
      return boxes
    }

    /* The stage, measured; and if the canvas's size has changed, the canvas and the textures the size of it made again,
       each in a step of its own for a root the builder builds (see startSteps). It says whether the canvas was cleared. */
    const measureSteps = function* () {
      const rect = canvas.getBoundingClientRect()
      if (perching || orbiting) {
        pageLeft = rect.left + window.scrollX
        pageTop = rect.top + window.scrollY
      }
      dpr = Math.min(window.devicePixelRatio || 1, typeof dprCap === 'function' ? dprCap(rect.width) : dprCap)
      cssW = Math.max(1, rect.width)
      cssH = Math.max(1, rect.height)
      if (copyBox) {
        const box = copyBox.getBoundingClientRect()
        words.x = box.left + box.width / 2 - rect.left
        words.y = box.top + box.height / 2 - rect.top
        words.a = box.width / 2
        words.b = box.height / 2
      } else if (Array.isArray(mode.words?.at)) {
        // (a selector that finds nothing leaves no words box: a string has an `at` method too, so ask for the array)
        words.x = cssW * mode.words.at[0]
        words.y = cssH * mode.words.at[1]
        words.a = cssW * mode.words.half[0]
        words.b = cssH * mode.words.half[1]
      }
      const front = mode.behind ? document.querySelector(mode.behind) : null
      if (front) {
        const box = front.getBoundingClientRect()
        hidden = {
          left: box.left - rect.left,
          top: box.top - rect.top,
          right: box.right - rect.left,
          bottom: box.bottom - rect.top,
        }
        if (frontRows.length) {
          // With land in front of it, its corners, which are cut out of the land behind it, and what is in it that the land in
          // front keeps clear of (see keepOf), all of which the land is lofted again for when they change.
          const style = getComputedStyle(front)
          hidden.radii = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(
            (corner) => Number.parseFloat(style.getPropertyValue(`border-${corner}-radius`)) || 0,
          )
          hidden.keep = keepOf(front, rect)
          hidden.front = [
            hidden.top,
            ...hidden.radii,
            ...hidden.keep.map((k) => [k.left, k.top, k.right, k.bottom].map(Math.round)),
          ].join(' ')
        }
      }
      fit = mode.fit(cssW, cssH)
      const bandX = Math.min(optics.band[0] * cssW * 0.5, optics.bandMost[0])
      const bandY = Math.min(optics.band[1] * cssH * 0.5, optics.bandMost[1])
      const vs = optics.in + ((1 - optics.in) * (1 - Math.exp(-optics.bend))) / optics.bend
      glass = { bandX, bandY, reachX: (cssW / 2) * vs }
      const nw = Math.max(2, Math.round(cssW * dpr))
      const nh = Math.max(2, Math.round(cssH * dpr))
      dirty = true
      if (nw === w && nh === h) {
        return false
      }
      w = nw
      h = nh
      // (a canvas given its size before its context already has it, and sizing it again would only make its drawing
      // buffer again)
      if (canvas.width !== w || canvas.height !== h) {
        yield COST.canvas
        canvas.width = w
        canvas.height = h
      }
      yield COST.texture
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, landTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      // The frosted glass and the wings read the land blurred, through these levels.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 4)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      yield COST.mipmap
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, landTex)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.bindFramebuffer(gl.FRAMEBUFFER, landFbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, landTex, 0)
      if (!mode.lensed) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        return true
      }
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)
      gl.bindTexture(gl.TEXTURE_2D, flockTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      // Only the levels the lens reads, which are remade every frame.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, Math.ceil(LENS.soften + 1))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.bindFramebuffer(gl.FRAMEBUFFER, flockFbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, flockTex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return true
    }
    /* Steps run in one go. */
    const all = (steps) => {
      let step = steps.next()
      while (!step.done) {
        step = steps.next()
      }
      return step.value
    }
    const measure = () => all(measureSteps())
    /* Data for the GPU, in one go, or for a root the builder builds a part at a time: a large buffer handed over at
       once holds the page up while the GPU process takes it in. A buffer read through a vertex array (the land's
       indices) is given with its vertex array bound. */
    const CHUNK = 1 << 18
    const upload = function* (target, buffer, data, parts, vao = null) {
      const bind = () => {
        if (vao) {
          gl.bindVertexArray(vao)
        }
        gl.bindBuffer(target, buffer)
      }
      bind()
      if (!parts || data.byteLength <= CHUNK) {
        gl.bufferData(target, data, gl.STATIC_DRAW)
      } else {
        gl.bufferData(target, data.byteLength, gl.STATIC_DRAW)
        const each = CHUNK / data.BYTES_PER_ELEMENT
        for (let from = 0; from < data.length; from += each) {
          if (from > 0) {
            yield COST.upload
            bind()
          }
          gl.bufferSubData(target, from * data.BYTES_PER_ELEMENT, data.subarray(from, from + each))
        }
      }
      if (vao) {
        gl.bindVertexArray(null)
      }
    }

    let page = [1, 1, 1]
    let dark = false
    // What an opaque sheet's wash is mixed with: the page, or the composition's own sky.
    let wash = page
    const readPage = () => {
      const probe = document.createElement('canvas')
      probe.width = 1
      probe.height = 1
      const ctx = probe.getContext('2d', { willReadFrequently: true })
      // The theme's page colour. A value the canvas cannot parse, light-dark() for one, leaves the sentinel in place, and
      // the body's resolved background stands in.
      const sentinel = '#010203'
      ctx.fillStyle = sentinel
      ctx.fillStyle = getComputedStyle(root).getPropertyValue('--scalar-background-1').trim() || sentinel
      if (ctx.fillStyle === sentinel) {
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor
      }
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      page = a === 0 ? [1, 1, 1] : [r / 255, g / 255, b / 255]
      dark = 0.2126 * page[0] + 0.7152 * page[1] + 0.0722 * page[2] < 0.5
      wash = mode.sky
        ? rgb(mode.inks[mode.sky.wash || mode.sky.stops[mode.sky.stops.length - 1][1]][dark ? 1 : 0])
        : page
    }
    // reading the page's colour asks for the page's style
    yield COST.style
    if (gone()) {
      return null
    }
    readPage()
    let painted = null

    /* A sheet's guides are a smooth curve through their points, one height for each place across. */
    const curveThrough = (points) => (x) => {
      const last = points.length - 1
      if (x <= points[0][0]) {
        return points[0][1]
      }
      if (x >= points[last][0]) {
        return points[last][1]
      }
      let k = 0
      while (points[k + 1][0] < x) {
        k += 1
      }
      const [x0, y0] = points[k]
      const [x1, y1] = points[k + 1]
      const slope = (a, b) => (points[b][1] - points[a][1]) / (points[b][0] - points[a][0])
      const m0 = k > 0 ? slope(k - 1, k + 1) : slope(k, k + 1)
      const m1 = k + 1 < last ? slope(k, k + 2) : slope(k, k + 1)
      const h = x1 - x0
      const f = (x - x0) / h
      return (
        (2 * f ** 3 - 3 * f ** 2 + 1) * y0 +
        (f ** 3 - 2 * f ** 2 + f) * h * m0 +
        (-2 * f ** 3 + 3 * f ** 2) * y1 +
        (f ** 3 - f ** 2) * h * m1
      )
    }

    /* The land, lofted between each sheet's guides, as /products/api-hosting lofts its own. A shrub is a little sheet of
       its own, lofted from a rounded heap down to the ground it sits on. */
    let landKey = ''
    // where the composition's glow is on the canvas as each sheet sees it, [x, y, half across, half down] in CSS pixels
    const glowPlaces = []
    // where its sun stands, and the band its light comes in over; and the band the lines of a sheet that fades come in over
    let sunPlace = { x: 0, y: 0, r: 1 }
    let sunRise = [0, 1]
    let fadeAt = [0, 1]
    // The crowns of the gorse in flower, in CSS pixels, for the meadow to put flowers on; and where every shrub stands, so
    // that no flower is rooted behind one and painted over it.
    const gorse = []
    const bushes = []
    let hillTop = () => mode.land.crest
    let skyTop = () => 0
    let meadowTop = () => 0.5
    let meadowFoot = () => 1
    // The top of the land in front of what stands in front of the canvas (land.front), in CSS pixels down the canvas for
    // each CSS pixel across it, and how high each of those sheets comes anywhere; null with nothing in front.
    let frontTops = null
    const sheetHigh = []
    /* Whether a place is on the land in front: anything rooted there is drawn in front of what stands in front of the
       canvas, and anything rooted higher up behind it. */
    const inFront = (x, y) => !!frontTops && y >= frontTops[clamp(Math.round(x), 0, frontTops.length - 1)] - 1
    // each sheet's top line by its name, for a composition's planting to stand things on (garden.ground)
    const sheetTops = new Map()
    const pointsOf = (g) => (Array.isArray(g) ? g : g.crest || g.hill)
    const landSteps = function* (parts) {
      const key = [
        cssW,
        cssH,
        words.y,
        words.b,
        hidden && [hidden.left, hidden.right, hidden.bottom, hidden.front || ''],
      ].join()
      if (key === landKey || cssW < 2) {
        return
      }
      landKey = key
      const shape = mode.land
      // A guide or a foot can be a hook of the stage; it is given the land's room and base once they are known.
      const stage = { w: cssW, h: cssH, hidden, words }
      const resolve = (g) => (typeof g === 'function' ? g(stage) : g)
      const value = (v) => (typeof v === 'function' ? v(stage) : v)
      const half = cssW / 2
      const relief = clamp(cssW / 1232, shape.relief[0], shape.relief[1])
      const crest = curveThrough(shape.profile)
      hillTop = (across) => shape.crest + crest(across) * relief
      const guide = (g) => {
        if (Array.isArray(g)) {
          return curveThrough(g)
        }
        const by = curveThrough(pointsOf(g))
        return g.crest ? (across) => shape.crest + by(across) * relief : (across) => hillTop(across) + by(across)
      }
      // The land's top is its sky's, or else its hill's; and its foot its meadow's, or else a room under the hill.
      const sky = sheets.find((sheet) => sheet.name === 'sky')
      const landTop = sky ? guide(resolve(sky.top)) : hillTop
      const meadow = sheets.find((sheet) => sheet.name === 'meadow')
      meadowTop = meadow ? guide(resolve(meadow.top)) : hillTop
      meadowFoot = meadow ? guide(resolve(meadow.foot)) : (across) => hillTop(across) + 1
      // The land rises from the canvas's foot at its full room: only the highest of its sky and the lowest of its meadow
      // on the stage matter.
      let highest = 0
      let deepest = 1
      for (let i = 0; i <= 32; i += 1) {
        highest = Math.min(highest, landTop(i / 16 - 1))
        deepest = Math.max(deepest, meadowFoot(i / 16 - 1))
      }
      const foot = value(shape.foot)
      const room = Math.max(
        shape.least,
        Math.min(value(shape.room), (cssH - foot - value(shape.head)) / (deepest - highest)),
      )
      const base = cssH - foot - deepest * room
      const down = (v) => base + v * room
      landBase = base
      landRoom = room
      stage.room = room
      stage.base = base
      if (mode.glow) {
        sheets.forEach((sheet, row) => {
          const place = resolve(sheet.glowAt || mode.glow.place)
          glowPlaces[row] = [half + place.at[0] * half, down(place.at[1]), place.half[0] * half, place.half[1] * room]
        })
      }
      if (mode.sun) {
        sunPlace = resolve(mode.sun.place)
        sunRise = resolve(mode.sun.rise)
      }
      if (mode.fade) {
        fadeAt = resolve(mode.fade.at)
      }
      // Without a sky of its own the clouds' band reaches up to the canvas's top.
      skyTop = sky ? landTop : () => -base / room

      // A sheet between two guides, from one place across to another, as a grid of places. `paintFrom` is where on the
      // sheet's paint its top starts.
      const loft = (top, foot, span, seed, paintFrom) => {
        const fromPx = span[0] * half
        const toPx = span[1] * half
        const cols = Math.min(320, Math.max(12, Math.round((toPx - fromPx) / 7)))
        const rows = 18
        const topAt = (x) => down(top(x / half))
        const footAt = (x) => down(foot(x / half))
        let thickest = 1
        for (let c = 0; c <= cols; c += 1) {
          const x = fromPx + ((toPx - fromPx) * c) / cols
          thickest = Math.max(thickest, footAt(x) - topAt(x))
        }
        // The coarsest lines are about 10 pixels apart where the sheet is thickest; more are added from there.
        const count = Math.max(4, Math.ceil(thickest / 10))
        const places = new Float32Array((cols + 1) * (rows + 1) * 6)
        const links = new Uint32Array(cols * rows * 6)
        const step = (toPx - fromPx) / cols
        for (let c = 0; c <= cols; c += 1) {
          const x = fromPx + step * c
          const t0 = topAt(x)
          const f0 = Math.max(t0 + 0.2, footAt(x))
          const t1 = topAt(x + step)
          const f1 = Math.max(t1 + 0.2, footAt(x + step))
          for (let r = 0; r <= rows; r += 1) {
            const a = r / rows
            const y = t0 + (f0 - t0) * a
            const slope = (t1 + (f1 - t1) * a - y) / step
            const o = (c * (rows + 1) + r) * 6
            places[o] = half + x
            places[o + 1] = y
            places[o + 2] = a * count
            places[o + 3] = x + seed
            places[o + 4] = (f0 - t0) / count / Math.sqrt(1 + slope * slope)
            places[o + 5] = paintFrom + (1 - paintFrom) * a
          }
        }
        for (let c = 0; c < cols; c += 1) {
          for (let r = 0; r < rows; r += 1) {
            const i0 = c * (rows + 1) + r
            links.set([i0, i0 + rows + 1, i0 + 1, i0 + 1, i0 + rows + 1, i0 + rows + 2], (c * rows + r) * 6)
          }
        }
        return { places, links }
      }
      // Grids one after another, as one.
      const join = (grids) => {
        const places = new Float32Array(grids.reduce((sum, g) => sum + g.places.length, 0))
        const links = new Uint32Array(grids.reduce((sum, g) => sum + g.links.length, 0))
        let placed = 0
        let linked = 0
        const ranges = grids.map((g) => {
          places.set(g.places, placed)
          const first = placed / 6
          for (let i = 0; i < g.links.length; i += 1) {
            links[linked + i] = g.links[i] + first
          }
          const range = { offset: linked * 4, count: g.links.length }
          placed += g.places.length
          linked += g.links.length
          return range
        })
        return { places, links, ranges }
      }
      // A shrub: a heap of four to six rounded lumps, highest in the middle, a little different every time, sitting down
      // into the ground. Gorse in flower keeps where its crown is, for its flowers.
      const shrub = (sheet, [across, wide, tall, flowering], seed) => {
        // on the hill's line, the meadow's top, or the top of any other sheet it names
        const named =
          sheet.on === 'hill' || sheet.on === 'meadow'
            ? null
            : sheets.find((other) => other.name === sheet.on && other.top)
        const hillOrMeadow = sheet.on === 'hill' ? hillTop : meadowTop
        const ground = named ? guide(resolve(named.top)) : hillOrMeadow
        const size = Math.max(0.7, cssW / 1300)
        const w = (wide * size) / half
        const h = (tall * size) / room
        const many = 4 + Math.floor(hashed(seed * 3.1) * 3)
        const lumps = []
        for (let k = 0; k < many; k += 1) {
          const f = k / (many - 1) - 0.5
          const c = across + (f * 1.3 + (hashed(seed * 5.7 + k * 1.3) - 0.5) * 0.18) * w
          const lw = w * (0.34 + 0.16 * hashed(seed * 2.3 + k))
          const dome = Math.sqrt(Math.max(0, 1 - (f * 1.3) ** 2))
          lumps.push([c, lw, h * (0.5 + 0.5 * dome) * (0.8 + 0.3 * hashed(seed * 9.1 + k * 2.7))])
        }
        const reach = Math.max(...lumps.map(([c, lw]) => Math.abs(c - across) + lw))
        const heap = (x) => Math.max(0, ...lumps.map(([c, lw, lh]) => lh * Math.max(0, 1 - ((x - c) / lw) ** 2) ** 0.5))
        const top = (x) => ground(x) - heap(x)
        if (flowering) {
          gorse.push({
            from: (across - reach * 0.9) * half + half,
            to: (across + reach * 0.9) * half + half,
            top: (x) => down(top(x / half - 1)),
            seed,
          })
        }
        bushes.push({
          from: (across - reach) * half + half,
          to: (across + reach) * half + half,
          top: (x) => down(top(x / half - 1)),
          base: (x) => down(ground(x / half - 1) + shape.sink),
          front: sheet.front,
        })
        return loft(top, (x) => ground(x) + shape.sink, [across - reach, across + reach], seed * 53, 0)
      }
      gorse.length = 0
      bushes.length = 0
      // a sheet at a time
      const made = []
      frontTops = frontRows.length ? new Float32Array(Math.ceil(cssW) + 1).fill(Number.POSITIVE_INFINITY) : null
      for (let row = 0; row < sheets.length; row += 1) {
        const sheet = sheets[row]
        const front = frontRows.includes(row)
        if (sheet.shrubs) {
          made.push(join(sheet.shrubs.map((bush, index) => shrub({ ...sheet, front }, bush, row * 11 + index))))
        } else {
          const top = resolve(sheet.top)
          const points = pointsOf(top)
          const topAt = guide(top)
          // its top line by name, for a composition's planting to stand things on (garden.ground)
          sheetTops.set(sheet.name, topAt)
          made.push(loft(topAt, guide(resolve(sheet.foot)), [points[0][0], points[points.length - 1][0]], row * 137, 0))
          // the land in front, where it comes highest
          if (front) {
            sheetHigh[row] = Number.POSITIVE_INFINITY
            const [from, to] = [points[0][0], points[points.length - 1][0]]
            for (let x = 0; x < frontTops.length; x += 1) {
              const across = x / half - 1
              if (across >= from && across <= to) {
                const y = down(topAt(across))
                frontTops[x] = Math.min(frontTops[x], y)
                sheetHigh[row] = Math.min(sheetHigh[row], y)
              }
            }
          }
        }
        if (front && sheet.shrubs) {
          sheetHigh[row] = Number.POSITIVE_INFINITY
          for (const bush of bushes.filter((each) => each.front)) {
            for (
              let x = Math.max(0, Math.ceil(bush.from));
              x <= Math.min(frontTops.length - 1, Math.floor(bush.to));
              x += 1
            ) {
              const y = bush.top(x)
              frontTops[x] = Math.min(frontTops[x], y)
              sheetHigh[row] = Math.min(sheetHigh[row], y)
            }
          }
        }
        yield
      }
      const mesh = join(made)
      landRanges = mesh.ranges
      yield COST.upload
      yield* upload(gl.ARRAY_BUFFER, landVertices, mesh.places, parts)
      yield COST.upload
      yield* upload(gl.ELEMENT_ARRAY_BUFFER, landIndices, mesh.links, parts, landVao)
    }
    const buildLand = () => all(landSteps(false))

    /* Where a place on the land is on the screen, in CSS pixels. */
    const airTop = curveThrough(mode.air.top)
    const airFoot = curveThrough(mode.air.foot)
    const toScreen = (across, down) => [cssW / 2 + across * (cssW / 2), landBase + down * landRoom]

    /* ---- the grass and the flowers ---- */
    // The meadow is drawn in bands of depth, each band's grass and then its flowers, as [first blade, how many, first
    // stroke, how many].
    const BANDS = 32
    const BEHIND = 4
    const bands = new Int32Array(BANDS * 4)
    // the band the cut comes before (see cutFront), or none
    let cutBand = -1
    /* It is laid out in steps, the grass, then the flowers a column of the drifts' grid at a time, so that a root built in
       the page's idle time can lay its meadow out a little at a time (see the builder); the hero lays it out all at
       once, as growMeadow. */
    const growSteps = function* (parts = false) {
      const rand = random(7919)
      const blades = []
      const grass = mode.grass
      const wordsLeft = words.x - words.a - 10
      const wordsRight = words.x + words.a + 10
      const wordsFoot = words.y + words.b + 6
      // How near a place is, from the hill's crest (0) to the land's foot (1), and where it is.
      const placeAt = (across, near) => {
        const top = hillTop(across) + 0.03
        const foot = meadowFoot(across) - 0.05
        return toScreen(across, top + (foot - top) * near)
      }
      const inkFor = (near, r) => {
        // the land's inks by how near: lime far up the hill, deep green in the body, olive and straw at the foot
        const at = clamp(1.2 + near * 2.0 + (r - 0.5) * 1.1, 0, grass.inks.length - 1.001)
        return [Math.floor(at), fract(at)]
      }
      const blade = (x, y, near, tall, lean, r) => {
        // none reaches up into the words
        if (y - tall < wordsFoot && x > wordsLeft && x < wordsRight) {
          return
        }
        // nor stands where whatever is in front of the canvas on the page hides it, unless on the land in front of that
        if (hidden && y < hidden.bottom - 2 && x > hidden.left + 4 && x < hidden.right - 4 && !inFront(x, y)) {
          return
        }
        const wide = grass.wide[0] + (grass.wide[1] - grass.wide[0]) * near
        const [ink, mix] = inkFor(near, r)
        const grow = 0.7 + 1.1 * (x / cssW) + 0.2 * rand()
        blades.push([x, y, tall, wide, ink, mix, 0.7 + 0.28 * rand(), 0, lean, rand() * 6, 0.1 * rand(), grow])
      }
      // Tufts, mostly towards the front: a few blades from about one place, fanned a little.
      const tufts = Math.round(cssW * grass.tufts)
      for (let index = 0; index < tufts; index += 1) {
        const across = -1.04 + rand() * 2.08
        const near = 0.25 + 0.75 * rand() ** 0.6
        const [x, y] = placeAt(across, near)
        const tall = (grass.tall[0] + (grass.tall[1] - grass.tall[0]) * near ** 1.4) * Math.max(0.75, fit)
        const many = grass.blades[0] + Math.floor(rand() * (grass.blades[1] - grass.blades[0] + 1))
        const r = rand()
        for (let k = 0; k < many; k += 1) {
          const f = many > 1 ? k / (many - 1) - 0.5 : 0
          blade(
            x + f * 6 * near + (rand() - 0.5) * 2,
            y + rand() * 1.5,
            near,
            tall * (0.6 + 0.5 * rand()) * (1 - Math.abs(f) * 0.35),
            f * grass.fan + (rand() - 0.5) * grass.rest,
            r,
          )
        }
      }
      // Tall grass along the way the unseen thing goes, which is where the horse was best: the meadow parting round it.
      const lane = Math.round(cssW * grass.lane)
      for (let index = 0; index < lane; index += 1) {
        const across = -1.04 + rand() * 2.08
        const near = clamp((mode.passer || PASSER).lane + (rand() + rand() - 1) * 0.16, 0.2, 1)
        const [x, y] = placeAt(across, near)
        const tall =
          (grass.tall[0] + (grass.tall[1] - grass.tall[0]) * near ** 1.2) * (0.8 + 0.4 * rand()) * Math.max(0.75, fit)
        const many = 2 + Math.floor(rand() * 4)
        const r = rand()
        for (let k = 0; k < many; k += 1) {
          const f = many > 1 ? k / (many - 1) - 0.5 : 0
          blade(
            x + f * 5 + (rand() - 0.5) * 2,
            y + rand() * 1.5,
            near,
            tall * (0.7 + 0.4 * rand()),
            f * grass.fan + (rand() - 0.5) * grass.rest,
            r,
          )
        }
      }
      // And single blades here and there, far up the hill as well.
      const singles = Math.round(cssW * grass.singles)
      for (let index = 0; index < singles; index += 1) {
        const across = -1.04 + rand() * 2.08
        const near = rand() ** 0.7
        const [x, y] = placeAt(across, near)
        const tall =
          (grass.tall[0] + (grass.tall[1] - grass.tall[0]) * near ** 1.4) * (0.4 + 0.5 * rand()) * Math.max(0.75, fit)
        blade(x, y, near, tall, (rand() - 0.5) * grass.rest * 2, rand())
      }
      // the drifts' grid next, stamped the first time a set of drifts is laid out
      yield COST.grid
      // The flowers, painted: drifts of strokes heaped at the front and sweeping back across the meadow and up the slope,
      // dark leaves under them, a few strays in the plain grass, and gold on the gorse. Each flower stands at its own
      // depth, and its size, its stem and how far out of focus it is all follow from that.
      const { flowers, palettes, paintNames } = mode
      const size = Math.max(0.75, fit)
      const ink = (name) => paintNames.indexOf(name)
      const any = (list) => list[Math.floor(rand() * list.length)]
      // A smooth random over the meadow, from 0 to 1: where the drifts break into clumps and gaps, and which colours
      // come in patches.
      const field = (x, y) => {
        const ix = Math.floor(x)
        const iy = Math.floor(y)
        const fx = x - ix
        const fy = y - iy
        const ux = fx * fx * (3 - 2 * fx)
        const uy = fy * fy * (3 - 2 * fy)
        const at = (i, j) => hashed(i * 57.31 + j * 131.7)
        const a = at(ix, iy)
        const b = at(ix + 1, iy)
        const c = at(ix, iy + 1)
        const d = at(ix + 1, iy + 1)
        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
      }
      // A drift's colours come in patches, as wildflowers do: most flowers take the colour of the patch they stand in,
      // and the rest are any of the drift's colours.
      const totals = Object.fromEntries(
        Object.entries(palettes).map(([name, list]) => [name, list.reduce((sum, [, often]) => sum + often, 0)]),
      )
      const pickPaint = (palette, across, near) => {
        const list = palettes[palette]
        const total = totals[palette]
        const patch = clamp((field(across * 3.2 + 40, near * 6 + 9) - 0.5) * 2.4 + 0.5, 0, 0.999)
        let u = (rand() < 0.6 ? patch : rand()) * total
        for (const [name, often] of list) {
          u -= often
          if (u < 0) {
            return name
          }
        }
        return list[list.length - 1][0]
      }

      // The drifts are laid out on a stage no wider than flowers.stage each side of the middle, so a wide screen shows
      // more of them rather than stretching them flat. `across` below is in the stage's terms, and `onLand` turns it
      // into the land's.
      const half = cssW / 2
      const reach = Math.min(half, flowers.stage)
      const onLand = reach / half
      // The meadow's top and foot across the stage, worked out once for the thousands of flowers to read.
      const columns = 480
      const tops = new Float32Array(columns + 1)
      const feet = new Float32Array(columns + 1)
      for (let i = 0; i <= columns; i += 1) {
        const across = -1.2 + (2.4 * i) / columns
        tops[i] = hillTop(across) + 0.03
        feet[i] = meadowFoot(across) - 0.05
      }
      const span = (land) => {
        const f = clamp((land + 1.2) / 2.4, 0, 1) * columns
        const i = Math.min(columns - 1, Math.floor(f))
        const u = f - i
        return [tops[i] + (tops[i + 1] - tops[i]) * u, feet[i] + (feet[i + 1] - feet[i]) * u]
      }
      const placeQuick = (across, near) => {
        const land = across * onLand
        const [top, foot] = span(land)
        return toScreen(land, top + (foot - top) * near)
      }
      // How large a flower is at a depth, how tall it stands, and how soft its edge is, as through a lens focused on the
      // middle of the meadow; and how many there are to a square CSS pixel where a drift is thickest. All of it depends
      // only on the depth, so it is tabled once a layout.
      const { size: SIZE, stem: STEM, blur: BLUR } = flowers
      const sizeAt = (near) => (SIZE.far + (SIZE.close - SIZE.far) * clamp(near, 0, 1) ** SIZE.curve) * size
      const stemAt = (near) => (STEM.far + (STEM.close - STEM.far) * clamp(near, 0, 1) ** STEM.curve) * size
      const focused = sizeAt(flowers.focus)
      const blurAt = (near) => {
        const r = sizeAt(near)
        const soft =
          r > focused
            ? Math.min((r - focused) * BLUR.front, r * BLUR.most)
            : Math.min(BLUR.deepest * size, (focused - r) * BLUR.behind)
        return Math.max(BLUR.least, soft)
      }
      // how much paint a far flower carries, where the composition says (see `fade`)
      const fadeAt = (near) => 0.95 - (0.95 - flowers.fade[2]) * (1 - smooth(flowers.fade[0], flowers.fade[1], near))
      // far up the hill the flowers are smaller than their depth's size, so the specks there are many and faint
      const ownAt = (near, own) => {
        const far = 1 - smooth(0.3, 0.45, near)
        return [own[0] + (flowers.far[0] - own[0]) * far, own[1] + (flowers.far[1] - own[1]) * far]
      }
      // A composition can give its cover as a hook of the canvas's width and of the room under what stands in front of the
      // canvas (the footer's front thins over a phone's short band); the hero's is the table itself.
      const coverStops =
        typeof flowers.cover === 'function' ? flowers.cover(cssW, hidden ? cssH - hidden.bottom : cssH) : flowers.cover
      const coverAt = (near) => {
        let k = 0
        while (k < coverStops.length - 2 && coverStops[k + 1][0] < near) {
          k += 1
        }
        const [n0, c0] = coverStops[k]
        const [n1, c1] = coverStops[k + 1]
        return c0 + (c1 - c0) * clamp((near - n0) / (n1 - n0), 0, 1)
      }
      const DEPTHS = 256
      const thickTable = new Float32Array(DEPTHS + 1)
      for (let k = 0; k <= DEPTHS; k += 1) {
        const near = k / DEPTHS
        const [lo, hi] = ownAt(near, SIZE.own)
        const r = sizeAt(near) * (lo + hi) * 0.5
        thickTable[k] = coverAt(near) / (Math.PI * 0.65 * r * r)
      }
      const thickAt = (near) => thickTable[Math.round(clamp(near, 0, 1) * DEPTHS)]
      // The lie of the land at a place: strokes follow it, as a painter's do.
      const slopeAt = (across, near) => {
        const [x0, y0] = placeQuick(across - 0.02, near)
        const [x1, y1] = placeQuick(across + 0.02, near)
        return Math.atan2(y1 - y0, x1 - x0)
      }

      // How thick each drift is over the meadow, on a coarse grid of [across, near]; which drift is thickest where, and
      // how far along it. Each drift's line is walked and stamped into the grid with a soft edge, as wide as the drift is
      // there. It depends on nothing but the drifts, so it is made once for each set of them.
      const GRID = [192, 40]
      const RANGE = 2.4
      if (!driftGrids.has(flowers)) {
        const thickness = new Float32Array(GRID[0] * GRID[1])
        const owner = new Int8Array(GRID[0] * GRID[1]).fill(-1)
        const way = new Float32Array(GRID[0] * GRID[1])
        // a place along a drift's line, which runs smoothly through its places
        const along = (points, t) => {
          const f = t * (points.length - 1)
          const i = Math.min(points.length - 2, Math.floor(f))
          const u = f - i
          const p0 = points[Math.max(0, i - 1)]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = points[Math.min(points.length - 1, i + 2)]
          return [0, 1].map(
            (k) =>
              p1[k] +
              0.5 *
                u *
                (p2[k] -
                  p0[k] +
                  u * (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k] + u * (3 * (p1[k] - p2[k]) + p3[k] - p0[k]))),
          )
        }
        for (let index = 0; index < flowers.drifts.length; index += 1) {
          const drift = flowers.drifts[index]
          const length = drift.line
            .slice(1)
            .reduce((sum, p, k) => sum + Math.hypot(p[0] - drift.line[k][0], p[1] - drift.line[k][1]), 0)
          const steps = Math.ceil(length / 0.02)
          for (let step = 0; step <= steps; step += 1) {
            const t = step / steps
            const [a, n] = along(drift.line, t)
            const wide = drift.wide[0] + (drift.wide[1] - drift.wide[0]) * t
            const full = drift.full[0] + (drift.full[1] - drift.full[0]) * t
            const ci = ((a + RANGE) / (2 * RANGE)) * GRID[0] - 0.5
            const cj = n * GRID[1] - 0.5
            const ri = (wide * 1.3 * GRID[0]) / (2 * RANGE) + 1
            const rj = wide * GRID[1] + 1
            for (let i = Math.max(0, Math.floor(ci - ri)); i <= Math.min(GRID[0] - 1, Math.ceil(ci + ri)); i += 1) {
              for (let j = Math.max(0, Math.floor(cj - rj)); j <= Math.min(GRID[1] - 1, Math.ceil(cj + rj)); j += 1) {
                const cell = j * GRID[0] + i
                if (thickness[cell] >= full) {
                  continue
                }
                const da = (((i + 0.5) / GRID[0]) * 2 * RANGE - RANGE - a) / (wide * 1.3)
                const dn = ((j + 0.5) / GRID[1] - n) / wide
                const far = da * da + dn * dn
                if (far >= 1) {
                  continue
                }
                const at = full * (1 - smooth(0.55, 1, Math.sqrt(far)))
                if (at > thickness[cell]) {
                  thickness[cell] = at
                  owner[cell] = index
                  way[cell] = t
                }
              }
            }
          }
          // A root the builder makes stamps a drift a step, so that a composition of many broad drifts never asks for one
          // long step; the hero, built all at once, goes straight on.
          if (mode.wake) {
            yield
          }
        }
        driftGrids.set(flowers, { thickness, owner, way })
        yield
      }
      const { thickness, owner, way } = driftGrids.get(flowers)
      const cellOf = (across, near) => [((across + RANGE) / (2 * RANGE)) * GRID[0] - 0.5, near * GRID[1] - 0.5]
      const thickOf = (across, near) => {
        const [fi, fj] = cellOf(across, near)
        const i = clamp(Math.floor(fi), 0, GRID[0] - 2)
        const j = clamp(Math.floor(fj), 0, GRID[1] - 2)
        const u = clamp(fi - i, 0, 1)
        const v = clamp(fj - j, 0, 1)
        const at = (di, dj) => thickness[(j + dj) * GRID[0] + i + di]
        return (at(0, 0) * (1 - u) + at(1, 0) * u) * (1 - v) + (at(0, 1) * (1 - u) + at(1, 1) * u) * v
      }
      const nearestOf = (across, near) => {
        const [fi, fj] = cellOf(across, near)
        return clamp(Math.round(fj), 0, GRID[1] - 1) * GRID[0] + clamp(Math.round(fi), 0, GRID[0] - 1)
      }

      // One stroke of the brush: when it is painted (the far ones first), where it is rooted, how high it stands, how
      // long and wide it is, which way it lies, how soft it is, its two colours, what it is (a stroke, or a cosmos painted
      // with its petals), how much paint it carries or how many petals it has, and how it sways.
      const dabs = []
      const stroke = (order, x, y, stem, long, breadth, turn, blur, [first, second], kind, extra, sway) => {
        dabs.push([
          order,
          x,
          y,
          stem,
          long,
          breadth,
          turn,
          blur,
          rand(),
          sway.lean,
          sway.phase,
          sway.stiff,
          sway.grow,
          ink(first),
          ink(second),
          kind,
          extra,
        ])
      }
      const swayAt = (x, stiff) => ({
        lean: (rand() - 0.5) * 0.3,
        phase: rand() * 6,
        stiff,
        grow: 1.1 + 1.1 * (x / cssW) + 0.3 * rand(),
      })
      const onStage = (x, y, stem, out) => {
        // clear of the words, soft edge and all, and on the stage
        if (y - stem - out * 1.6 < wordsFoot + 4 && x + out * 2 > wordsLeft && x - out * 2 < wordsRight) {
          return false
        }
        if (x < -out * 2 || x > cssW + out * 2) {
          return false
        }
        // nor where whatever stands in front of the canvas on the page would hide all of it, unless it is on the land in
        // front of that
        if (hidden && x - out > hidden.left && x + out < hidden.right && y < hidden.bottom - 2 && !inFront(x, y)) {
          return false
        }
        // nor rooted behind a shrub, which it would be painted over
        return !bushes.some((bush) => x > bush.from && x < bush.to && y > bush.top(x) - 2 && y < bush.base(x))
      }
      // A leaf, brushed in dark under the flowers. Its kind is 0.25: a stroke, but one the shader paints without
      // bristles, which on a dark leaf would read as jagged steps.
      const leaf = (across, near, order, x, y, stem, long, blur, sway) => {
        stroke(
          order,
          x,
          y,
          stem,
          long,
          long * (0.22 + 0.13 * rand()),
          slopeAt(across, near) + (rand() - 0.5) * 1.4 + (rand() < 0.5 ? Math.PI : 0),
          blur,
          [any(['shade', 'deepGreen']), 'leaf'],
          0.25,
          0.6,
          sway,
        )
      }
      const crisp = []
      // The soft heads at the very front, so that no two stack into a target, one centred on the other.
      const nearHeads = []
      const flower = (across, near, drift, thick, stray = false, at = null) => {
        const placed = at || placeQuick(across, near)
        let x = placed[0]
        const y = placed[1]
        const [lo, hi] = ownAt(near, drift.own || SIZE.own)
        const reachOf = sizeAt(near) * (lo + (hi - lo) * rand()) * (stray ? 0.7 : 1)
        const blur = blurAt(near)
        const stem = stemAt(near) * (STEM.own[0] + (STEM.own[1] - STEM.own[0]) * rand())
        // out of focus at the front, a flower is soft and lies any way
        const front = smooth(0.62, 0.85, near)
        // A soft head at the front that would sit almost on top of a larger one is moved aside, or left out.
        if (front >= 0.5) {
          const under = nearHeads.find((h) => Math.hypot(h.x - x, h.y - (y - stem)) < Math.max(h.reach, reachOf) * 0.45)
          if (under) {
            if (rand() < 0.5) {
              return
            }
            x += (rand() < 0.5 ? -1 : 1) * Math.max(under.reach, reachOf) * 0.8
          }
        }
        if (!onStage(x, y, stem, reachOf + blur * 0.5)) {
          return
        }
        if (front >= 0.5) {
          nearHeads.push({ x, y: y - stem, reach: reachOf })
        }
        let name = pickPaint(drift.paints, across, near)
        // At the front, a pale one out of focus reads as milk on the pale ground there, so most of them are painted in a
        // stronger colour instead, never one on its own, and a white is cream. The largest are warm, as in both
        // pictures, with the pinks, the rose and the lilac kept further back, where they are smaller.
        if (near > 0.85 && PALE.includes(name) && (rand() < 0.6 || thick < 0.35)) {
          for (let k = 0; k < 4 && PALE.includes(name); k += 1) {
            name = pickPaint(drift.paints, across + 0.37 * (k + 1), near)
          }
          if (PALE.includes(name)) {
            name = any(['coral', 'salmon', 'pink'])
          }
        }
        if (near > 0.85 && name === 'white') {
          name = 'cream'
        }
        if (front >= 0.5 && name === 'lilac') {
          name = any(['pink', 'cream'])
        }
        if (near > 0.85 && reachOf > 12) {
          if (name === 'pink' && rand() < 0.5) {
            name = any(['salmon', 'peach'])
          } else if (name === 'rose') {
            name = 'coral'
          }
        }
        const flat = slopeAt(across, near)
        const sway = swayAt(x, 0.25 + 0.3 * rand())
        // Far up the hill it is a faint speck, fading into the green; a pale one, which shows far more on green, more so.
        const pale = name === 'white' || name === 'cream' || name === 'butter'
        // A composition can keep its far flowers stronger (`fade`), so that far off they are a field of colour.
        const load =
          (flowers.fade ? fadeAt(near) : 0.95 - 0.6 * (1 - smooth(0.12, 0.5, near))) * (pale && near < 0.5 ? 0.6 : 1)
        // Now and then a dark leaf at its feet, though most of the green under a drift is brushed in on its own. At the
        // front, soft leaves stand up round it instead, so that the flowers there sit in green, as in both pictures, and
        // not on the bare ground at the foot.
        if (!stray && rand() < flowers.leaves * thick * smooth(0.3, 0.7, near) * (1 - smooth(0.7, 0.8, near))) {
          leaf(
            across,
            near,
            y - 0.5,
            x + (rand() - 0.5) * reachOf * 2.2,
            y + rand() * 2,
            stem * (0.1 + 0.3 * rand()),
            reachOf * (1.1 + 0.7 * rand()),
            blur,
            sway,
          )
        }
        if (!stray && front > 0.5 && thick > 0.3) {
          const leaves = rand() < 0.6 ? 2 : 1
          // the second leans the same way as the first, so that two never cross into an X
          const leaning = (rand() < 0.5 ? -1 : 1) * (0.15 + 0.35 * rand())
          for (let k = 0; k < leaves; k += 1) {
            const long = reachOf * (1.2 + 0.6 * rand())
            const late = rand() < 0.3
            const aside = (rand() * 2 - 1) * reachOf * 1.1
            // A leaf rises from near its root into the flower rather than hanging below it, and one drawn over its flower
            // does so only beside the head, never across its heart.
            const lift = Math.max(stem * (0.4 + 0.25 * rand()), long * 0.6)
            stroke(
              late && Math.abs(aside) > reachOf * 0.6 ? y + 0.1 : y - 0.5,
              x + aside,
              y,
              lift,
              long,
              long * 0.3,
              -Math.PI / 2 + leaning * 1.3 + (rand() - 0.5) * 0.35,
              blur * 0.7,
              [any(['leaf', 'deepGreen']), 'leaf'],
              0.25,
              0.6 + 0.15 * rand(),
              sway,
            )
          }
        }
        // Its stem: fine and dark on some in the middle distance, which bends with it exactly and shows it parting when
        // something goes through, and soft on most at the front, so that a blade of grass there is not read as its string.
        const stemmed = front > 0.5 ? 0.6 : flowers.stems * smooth(0.36, 0.5, near)
        if (!stray && near > 0.36 && rand() < stemmed) {
          blades.push([
            x,
            y,
            stem,
            Math.max(0.6, reachOf * 0.12),
            2,
            0.4 + 0.5 * rand(),
            0.85,
            blur > 1.2 ? blur : 0,
            sway.lean,
            sway.phase,
            sway.stiff,
            sway.grow,
          ])
        }
        // Now and then, in the middle distance and among its own colours, a cosmos painted with its petals, for the eye
        // to find.
        if (
          !stray &&
          near > 0.45 &&
          near < 0.75 &&
          DEEPER[name] &&
          drift.paints !== 'buttercups' &&
          rand() < flowers.crisp
        ) {
          const R = reachOf * 1.1
          if (!crisp.some((f) => Math.hypot(f.x - x, f.y - y) < (R + f.R) * 3)) {
            crisp.push({ x, y, R })
            stroke(
              y + 0.02,
              x,
              y,
              stem,
              R,
              R,
              (rand() - 0.5) * 0.6,
              Math.max(1.2, blur),
              [name, DEEPER[name]],
              1,
              8,
              sway,
            )
            return
          }
        }
        // Otherwise a stroke, now and then two, the second smaller and often the light catching it. Some whites, every
        // stray in the plain grass, and every soft flower at the front are a few short strokes fanned round a heart
        // instead: petals rather than one dab, so out of focus a flower keeps a lobed shape and is not a disc.
        const round = front >= 0.5
        const fanned = round || stray || ((name === 'white' || name === 'cream') && reachOf > 2.5 && rand() < 0.9)
        let many = 1
        if (round) {
          many = 5 + Math.floor(rand() * 2)
        } else if (fanned) {
          many = 2 + (rand() < 0.4 ? 1 : 0)
        } else if (reachOf >= 1.6) {
          many = (rand() < 0.25 ? 2 : 1) + (rand() < 0.04 ? 1 : 0)
        }
        const lie = round ? rand() * Math.PI * 2 : flat + (rand() - 0.5) * 0.8 + (rand() < 0.5 ? Math.PI : 0)
        const missing = round && many > 5 && rand() < 0.4 ? Math.floor(rand() * many) : -1
        const smaller = round ? Math.floor(rand() * many) : -1
        for (let k = 0; k < many; k += 1) {
          if (k === missing) {
            continue
          }
          const wide = flowers.wide[0] + (flowers.wide[1] - flowers.wide[0]) * rand()
          let long = reachOf * (k === 0 ? 1 : 0.5 + 0.3 * rand())
          let turn = lie + (k === 0 ? 0 : (rand() - 0.5) * 0.6)
          let dx = k === 0 ? 0 : (rand() - 0.5) * reachOf * 0.7
          let dy = k === 0 ? 0 : (rand() - 0.3) * reachOf * 0.35
          if (round) {
            // Petals round the heart, each laid from the rim in towards it, so that the full end of the stroke makes a
            // round lobe at the rim and the lifted end meets the others at the heart; one a little smaller than the rest.
            const angle = lie + (k / many) * Math.PI * 2 + (rand() - 0.5) * 0.5
            long = reachOf * (0.5 + 0.12 * rand()) * (k === smaller ? 0.75 + 0.15 * rand() : 1)
            turn = angle + Math.PI
            dx = Math.cos(angle) * reachOf * 0.46
            dy = -Math.sin(angle) * reachOf * 0.46
          } else if (fanned) {
            long = reachOf * (0.6 + 0.2 * rand())
            turn = lie + (k - (many - 1) / 2) * 0.55 + (rand() - 0.5) * 0.2
            dx = 0
            dy = 0
          }
          const paler = !fanned && k > 0 && k === many - 1 && rand() < 0.5
          stroke(
            y + k * 0.01,
            x + dx,
            y,
            stem + dy,
            long,
            long * (round ? 0.6 + 0.2 * rand() : wide),
            turn,
            blur,
            [paler ? PALER[name] : name, any(SECOND[name])],
            0,
            load,
            sway,
          )
        }
        // A heart now and then: a smudge of butter or cream towards where the brush came down, not a dot in the middle.
        // A pale flower at the front has a small soft one among its petals, to the lit side, so out of focus it still
        // reads as a flower and not as an egg.
        if ((name === 'white' || name === 'cream') && round) {
          const long = reachOf * 0.22
          stroke(
            y + 0.05,
            x - reachOf * 0.12,
            y,
            stem + reachOf * 0.15,
            long,
            long * 0.9,
            rand() * 6.28,
            blur,
            ['butter', 'cream'],
            0,
            0.45,
            sway,
          )
        } else if ((name === 'white' || name === 'cream') && reachOf > 3 && rand() < 0.35) {
          const long = reachOf * (0.16 + 0.14 * rand())
          const back = fanned ? 0 : -reachOf * 0.3
          stroke(
            y + 0.05,
            x + Math.cos(lie) * back,
            y,
            stem - Math.sin(lie) * back,
            long,
            long * 0.85,
            rand() * 6.28,
            blur,
            [any(['butter', 'butter', 'cream']), 'gold'],
            0,
            load,
            sway,
          )
        }
      }

      // The drifts. The grid's cells are visited in turn, each with a seed of its own, and given as many flowers as the
      // drift there can hold at that depth, so the flowers stay where they are when the stage is resized a little. A
      // place is then kept as thick as the drift is there, broken into clumps and gaps; and dark leaves are brushed in on
      // their own wherever a drift is thick, a green for the flowers to sit in.
      const landRoomOf = (land) => {
        const [top, foot] = span(land)
        return (foot - top) * landRoom
      }
      const cellAcross = (2 * RANGE) / GRID[0]
      const cellNear = 1 / GRID[1]
      const shown = 1.05 / onLand
      for (let i = 0; i < GRID[0] - 1; i += 1) {
        const a0 = ((i + 0.5) / GRID[0]) * 2 * RANGE - RANGE
        if (a0 + cellAcross < -shown || a0 > shown) {
          continue
        }
        const height = landRoomOf((a0 + cellAcross * 0.5) * onLand)
        const width = cellAcross * reach
        for (let j = 0; j < GRID[1] - 1; j += 1) {
          const cell = j * GRID[0] + i
          const most = Math.max(
            thickness[cell],
            thickness[cell + 1],
            thickness[cell + GRID[0]],
            thickness[cell + GRID[0] + 1],
          )
          if (most <= 0.01) {
            continue
          }
          const n0 = (j + 0.5) / GRID[1]
          const densest = Math.max(thickAt(n0), thickAt(n0 + cellNear * 0.5), thickAt(n0 + cellNear))
          const expected = most * densest * width * height * cellNear
          rand.reseed(7919 + cell * 0x9e3779b9)
          const count = Math.floor(expected + rand())
          for (let k = 0; k < count; k += 1) {
            const across = a0 + cellAcross * rand()
            const near = n0 + cellNear * rand()
            if (Math.abs(across) > shown || (near > 0.74 && Math.abs(across) > flowers.front)) {
              continue
            }
            const thick = thickOf(across, near)
            if (rand() * most * densest > thick * thickAt(near)) {
              continue
            }
            const at = nearestOf(across, near)
            const which = owner[at]
            if (which < 0) {
              continue
            }
            const drift = flowers.drifts[which]
            const patchy = drift.patchy
              ? smooth((drift.patchyFrom || 0) - 0.1, (drift.patchyFrom || 0) + 0.1, way[at])
              : 0
            const clump = smooth(
              0.25 + 0.17 * patchy,
              0.6 + 0.12 * patchy,
              field(across * 5 + which * 17.3, near * 9 + which * 5.1),
            )
            const floor = 0.4 - 0.2 * patchy
            const open = drift.gaps ? smooth(0.42, 0.56, field(across * 1.7 + 61.3, near * 2.2 + 4.7)) : 1
            if (
              rand() <
              flowers.bed * thick * open * (0.5 + 0.5 * clump) * smooth(0.35, 0.6, near) * (1 - smooth(0.72, 0.8, near))
            ) {
              const [x, y] = placeQuick(across, near)
              const stem = stemAt(near) * (0.1 + 0.25 * rand())
              const long = sizeAt(near) * (0.8 + 0.5 * rand())
              if (onStage(x, y, stem, long)) {
                const sway = swayAt(x, 0.5)
                leaf(across, near, y - 0.5, x - long * 0.35, y, stem, long, blurAt(near), sway)
                leaf(across, near, y - 0.5, x + long * 0.35, y + 1, stem * 0.8, long * 0.85, blurAt(near), sway)
              }
            }
            if (rand() > open * (floor + (1 - floor) * clump)) {
              continue
            }
            flower(across, near, drift, thick)
          }
        }
        yield
      }
      // and a few strays in the plain grass
      const strays = Math.round(flowers.strays * clamp(cssW / 1232, 0.45, 1.3))
      const kinds = Object.keys(palettes)
      for (let index = 0; index < strays; index += 1) {
        rand.reseed(104729 + index * 0x9e3779b9)
        flower((-1.05 + rand() * 2.1) / onLand, 0.4 + 0.32 * rand(), { paints: any(kinds) }, 0, true)
      }
      // The gorse flowers all over its crown, thickest on top, in dabs of gold, and hardly moves.
      gorse.forEach((crown) => {
        rand.reseed(crown.seed * 7919 + 17)
        const many = Math.round((crown.to - crown.from) * flowers.gorse)
        for (let index = 0; index < many; index += 1) {
          const x = crown.from + (crown.to - crown.from) * rand()
          const y = crown.top(x) + 1 + 6 * rand() ** 1.6 * size
          const bud = (flowers.bud[0] + (flowers.bud[1] - flowers.bud[0]) * rand()) * size
          stroke(
            y,
            x,
            y,
            1,
            bud,
            bud * (0.5 + 0.2 * rand()),
            (rand() - 0.5) * 0.9 + (rand() < 0.5 ? Math.PI : 0),
            0.3,
            [rand() < 0.6 ? 'gold' : 'butter', 'butter'],
            0,
            0.95,
            swayAt(x, 0.85),
          )
        }
      })
      yield mode.plant ? COST.plant : undefined
      // A composition can plant more of its own once the meadow is laid out (see `plant` in the modes): a flower of a
      // drift's palette at a place on the meadow, a flower painted petal by petal, a single stroke, or a stem, anywhere
      // on the canvas. All of it sways, parts and is painted in depth order with the rest.
      if (mode.plant) {
        // A planted stroke or stem can be given its own lean, in radians from upright, so that its head is exactly where
        // it is put; without one it leans as the meadow's do. The random's draw for the lean is taken either way, so
        // whatever else it draws, its sway and its paint's dice, is the same.
        const planted = (x, stiff, lean, phase) => {
          const sway = swayAt(x, stiff)
          if (lean !== undefined) {
            sway.lean = lean
          }
          // and a phase of the wind of its own, so that strokes given the same one sway together, as one crown
          if (phase !== undefined) {
            sway.phase = phase
          }
          return sway
        }
        perches.length = 0
        shelter.length = 0
        mistBand = [-1e5, -99999]
        mode.plant({
          w: cssW,
          h: cssH,
          hidden,
          rand,
          place: placeQuick,
          sizeAt,
          stemAt,
          blurAt,
          // where the words stand, and the top line of a sheet of the land at a place across, in CSS pixels
          words: { x: words.x, y: words.y, a: words.a, b: words.b },
          ground: (name, x) => landBase + (sheetTops.get(name) || hillTop)(x / (cssW / 2) - 1) * landRoom,
          // A stroke can be given the depth it is painted at (`order`), so that a tree painted from its trunk out to its
          // leaves goes into the meadow at the depth of its foot, and the grass in front of that is painted over it.
          flower: (across, near, paints = 'meadow', thick = 1) => flower(across, near, { paints }, thick),
          // a meadow flower as the drifts paint one at that depth, rooted at a place of the composition's own choosing
          flowerAt: (x, y, near, paints = 'meadow', thick = 1) =>
            flower(x / (cssW / 2) - 1, near, { paints }, thick, false, [x, y]),
          inFront,
          bloom: ({
            x,
            y,
            stem = 0,
            reach: r,
            petals = 8,
            blur = 1.2,
            paints = ['white', 'cream'],
            turn = 0,
            stiff = 0.6,
            lean,
            order,
            phase,
          }) =>
            stroke(order ?? y + 0.02, x, y, stem, r, r, turn, blur, paints, 1, petals, planted(x, stiff, lean, phase)),
          dab: ({
            x,
            y,
            stem = 0,
            long,
            wide = 0.7,
            turn = 0,
            blur = 0.6,
            paints,
            load = 0.95,
            kind = 0,
            stiff = 0.5,
            lean,
            order,
            phase,
          }) =>
            stroke(
              order ?? y,
              x,
              y,
              stem,
              long,
              long * wide,
              turn,
              blur,
              paints,
              kind,
              load,
              planted(x, stiff, lean, phase),
            ),
          stalk: ({ x, y, tall, wide = 1, ink: at = 2, mix = 0.5, soft = 0, stiff = 0.6, lean }) => {
            const sway = planted(x, stiff, lean)
            blades.push([x, y, tall, wide, at, mix, 0.85, soft, sway.lean, sway.phase, sway.stiff, sway.grow])
          },
          // a place a butterfly can land, facing left (-1) or right (1), and a disc of the tree's shape (see `perch`)
          perch: (x, y, facing = 1) => {
            perches.push([x, y, facing])
          },
          tree: (x, y, r) => {
            shelter.push([x, y, r])
          },
          // the band, in CSS pixels down the canvas, across which strokes marked as mist thin away upward (see `mist`)
          mist: (from, to) => {
            mistBand = [from, to]
          },
        })
        if (perching) {
          shelterAt()
        }
      }
      // Far ones first, so the near grass stands in front.
      // With land in front of what stands in front of the canvas, everything behind that comes first, and then everything
      // on the land in front of it, each from the farthest.
      yield COST.sort
      blades.sort((a, b) => a[1] - b[1])
      let bladesBehind = blades.length
      if (frontTops) {
        const ahead = blades.filter((b) => inFront(b[0], b[1]))
        const behind = blades.filter((b) => !inFront(b[0], b[1]))
        bladesBehind = behind.length
        behind.forEach((b, i) => {
          blades[i] = b
        })
        ahead.forEach((b, i) => {
          blades[bladesBehind + i] = b
        })
      }
      const bladeData = new Float32Array(blades.length * 12)
      blades.forEach((b, i) => bladeData.set(b, i * 12))
      yield COST.upload
      yield* upload(gl.ARRAY_BUFFER, bladeVao.buffer, bladeData, parts)
      bladeVao.laid = bladeData
      bladeVao.count = blades.length
      // And the far strokes first, so the near ones are painted over them.
      yield COST.sort
      dabs.sort((a, b) => a[0] - b[0])
      let dabsBehind = dabs.length
      if (frontTops) {
        const ahead = dabs.filter((d) => inFront(d[1], d[2]))
        const behind = dabs.filter((d) => !inFront(d[1], d[2]))
        dabsBehind = behind.length
        behind.forEach((d, i) => {
          dabs[i] = d
        })
        ahead.forEach((d, i) => {
          dabs[dabsBehind + i] = d
        })
      }
      yield COST.sort
      const bloomData = new Float32Array(dabs.length * 16)
      dabs.forEach((d, i) => {
        for (let k = 0; k < 16; k += 1) {
          bloomData[i * 16 + k] = d[k + 1]
        }
      })
      yield COST.upload
      yield* upload(gl.ARRAY_BUFFER, bloomVao.buffer, bloomData, parts)
      bloomVao.laid = bloomData
      bloomVao.count = dabs.length
      yield
      // Where each band of depth starts in the grass and in the strokes, both sorted from the farthest: the grass of a
      // band is drawn over the flowers of every band behind it, so near blades cross the flowers further back. With land
      // in front of what stands in front of the canvas, the first BEHIND bands hold what is behind that, and the rest what
      // is in front of it, and the cut comes between them (see draw).
      const layBands = (bladeEnd, dabEnd, first, count) => {
        const bladeFrom = first === 0 ? 0 : bladesBehind
        const dabFrom = first === 0 ? 0 : dabsBehind
        const ends = [
          bladeEnd > bladeFrom ? blades[bladeFrom][1] : null,
          dabEnd > dabFrom ? dabs[dabFrom][0] : null,
        ].filter((v) => v !== null)
        const lasts = [
          bladeEnd > bladeFrom ? blades[bladeEnd - 1][1] : null,
          dabEnd > dabFrom ? dabs[dabEnd - 1][0] : null,
        ].filter((v) => v !== null)
        const deepest = Math.min(...ends, ...(ends.length ? [] : [0]))
        const nearest = Math.max(...lasts, ...(lasts.length ? [] : [0]))
        let bladeAt = bladeFrom
        let dabAt = dabFrom
        for (let band = 0; band < count; band += 1) {
          const edge =
            band === count - 1 ? Number.POSITIVE_INFINITY : deepest + ((nearest - deepest) * (band + 1)) / count
          const fromBlade = bladeAt
          const fromDab = dabAt
          while (bladeAt < bladeEnd && blades[bladeAt][1] < edge) {
            bladeAt += 1
          }
          while (dabAt < dabEnd && dabs[dabAt][0] < edge) {
            dabAt += 1
          }
          bands.set([fromBlade, bladeAt - fromBlade, fromDab, dabAt - fromDab], (first + band) * 4)
        }
      }
      if (frontTops) {
        layBands(bladesBehind, dabsBehind, 0, BEHIND)
        layBands(blades.length, dabs.length, BEHIND, BANDS - BEHIND)
        cutBand = BEHIND
      } else {
        layBands(blades.length, dabs.length, 0, BANDS)
        cutBand = -1
      }
    }
    const growMeadow = () => {
      const steps = growSteps()
      let step = steps.next()
      while (!step.done) {
        step = steps.next()
      }
    }

    /* The meadow is laid out for one stage, and laying it out takes a while: far too long to do on every frame of a
       window being dragged. So when the stage changes the land is lofted again at once, and the meadow is laid out
       again only once the stage has been still for a moment. Until then it is moved with the land (see moveMeadow).
       This is the stage it was laid out for. */
    const grownFor = { key: '', w: 1, base: 0, room: 1 }
    let meadowTimer = 0
    // The meadow is laid out for the stage as it is now.
    const grown = () => {
      grownFor.key = landKey
      grownFor.w = cssW
      grownFor.base = landBase
      grownFor.room = landRoom
      // The frames it holds up say nothing about the GPU.
      hush()
      dirty = true
      settled = false
    }
    const meadowNow = () => {
      clearTimeout(meadowTimer)
      meadowTimer = 0
      if (!landKey || cssW < 2) {
        return
      }
      growMeadow()
      grown()
    }
    // A root built by the builder lays its first meadow out a step at a time (see the end of start).
    let building = null
    const meadowAfter = (ms) => {
      clearTimeout(meadowTimer)
      meadowTimer = setTimeout(() => {
        meadowNow()
        sync()
      }, ms)
    }

    /* Until then each blade and each stroke is moved with the land, which is lofted again at once: across with the
       stage's width, and down from the land's top as far as its room has grown or shrunk. Only where it is rooted
       moves, the first two of its numbers (aRoot.xy to the shaders), so that nothing is squashed and the rest is as it
       was laid out. */
    const moveMeadow = () => {
      const sx = cssW / grownFor.w
      const sy = landRoom / grownFor.room
      for (const run of [bladeVao, bloomVao]) {
        const laid = run.laid
        if (!laid) {
          continue
        }
        if (run.moved?.length !== laid.length) {
          run.moved = new Float32Array(laid.length)
        }
        const moved = run.moved
        moved.set(laid)
        for (let i = 0; i < laid.length; i += run.stride) {
          moved[i] = laid[i] * sx
          moved[i + 1] = landBase + (laid[i + 1] - grownFor.base) * sy
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, run.buffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, moved)
      }
    }

    /* ---- the stirs: the unseen passer, and the pointer ---- */
    const stirs = []
    const stirData = new Float32Array(STIR.count * 4)
    const stirWay = new Float32Array(STIR.count * 2)
    const lay = (x, y, push, wayX, wayY) => {
      stirs.push({ x, y, age: 0, push, wayX, wayY })
      if (stirs.length > STIR.count) {
        stirs.shift()
      }
    }
    const passer = { on: false, x: 0, y: 0, laidX: -1e9, laidY: -1e9 }
    let clock = 0
    // A root whose context was lost starts again from the finished picture, as does one painted only once, and one whose
    // composition has no opening.
    let intro = resumes.has(root) || mode.intro === false || mode.draw === 'once' ? 99 : 0
    resumes.delete(root)
    if (mode.draw === 'once') {
      clock = mode.stillAt
    }
    const placePasser = () => {
      const walk = mode.passer
      if (!walk) {
        passer.on = false
        return
      }
      const t = clock - walk.first
      const cycle = t < 0 ? -1 : t % walk.every
      if (cycle < 0 || cycle > walk.across) {
        passer.on = false
        return
      }
      const f = cycle / walk.across
      const across = -1.15 + 2.3 * f
      const near = walk.lane + walk.wander * Math.sin(f * 7.1 + Math.floor(t / walk.every) * 2.3)
      const top = hillTop(across) + 0.03
      const foot = meadowFoot(across) - 0.05
      const [x, y] = toScreen(across, top + (foot - top) * near)
      passer.on = true
      passer.x = x
      passer.y = y
    }
    const pointer = { x: 0, y: 0, laidX: -1e9, laidY: -1e9, lastT: 0 }
    const onPointer = (event) => {
      if (PREFERS_REDUCED.matches || !inView) {
        return
      }
      // A composition whose flock perches places the pointer by where the canvas was last measured on the page, so a
      // pointer never asks the page for its layout.
      const rect = perching
        ? {
            left: pageLeft - (event.pageX - event.clientX),
            top: pageTop - (event.pageY - event.clientY),
            width: cssW,
            height: cssH,
          }
        : canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      // On the tree, the pointer sends its butterflies off and parts nothing (a finger only does so when it taps it).
      if (perching) {
        const at = treeAt(x, y)
        if (event.pointerType !== 'touch' && (at === 1) !== overTree) {
          overTree = at === 1
          if (overTree) {
            scatter(x, y)
          } else {
            leftTree = clock
          }
        }
        if (at > 0) {
          return
        }
      }
      // only on the land, and not over the words
      const overWords = y < words.y + words.b + 14 && Math.abs(x - words.x) < words.a + 10
      if (x < 0 || x > rect.width || y < landBase - 10 || y > rect.height || overWords) {
        return
      }
      const now = performance.now()
      const moved = Math.hypot(x - pointer.laidX, y - pointer.laidY)
      if (moved > mode.stir.every) {
        const dt = Math.max(16, now - pointer.lastT) / 1000
        const speed = moved / dt
        const way = moved || 1
        lay(x, y, clamp(speed / 900, 0.12, 0.55), (x - pointer.laidX) / way, (y - pointer.laidY) / way)
        pointer.laidX = x
        pointer.laidY = y
        pointer.lastT = now
      }
      settled = false
      sync()
    }
    if (mode.pointer) {
      window.addEventListener('pointermove', onPointer, { passive: true })
    }

    /* ---- the butterflies ---- */
    const flock = mode.flock.map((b, index) => ({
      ...b,
      index,
      family: WING_NAMES.indexOf(b.wing),
      u: fract(index / mode.flock.length + b.seed * 0.37),
      phase: b.seed * 7,
      glide: 0,
      hindLag: null,
      lastFlap: 0,
      lift: 0,
      pose: FLIGHT.pose[0] + (FLIGHT.pose[1] - FLIGHT.pose[0]) * hashed(index * 3.3 + 0.2),
      flap: 0.4,
      hind: 0.34,
      lag: 0,
      show: 0,
      screenX: 0,
      screenY: 0,
      size: b.size,
      heading: 0,
      pitch: 0,
      roll: 0,
    }))
    const laneY = (m, x) => {
      const n = x / (cssW / 2)
      const top = airTop(n)
      return landBase + (top + (airFoot(n) - top) * m) * landRoom
    }

    /* ---- the butterflies that perch ---- */
    /* A composition with `perch` has a flock that lands: very small butterflies on the places its planting gives
       (garden.perch), where they sit opening and closing their wings, now and then going over to another leaf, with one
       or two about the crown all the while. When the pointer comes onto the tree (the shape garden.tree draws, stamped
       into a coarse grid once a layout, so that a pointer is looked up and never measured), they all take off, up and
       away from it, out through the lens at the edges; and once it has been off the tree for a while they come back one
       by one and land again. Each goes along a curve from where it is to where it is going, timed on the meadow's own
       clock. The places and the grid are in the terms the meadow was laid out in, as everything planted is, and move
       with it until it is laid out again (see moveMeadow). */
    const perching = !!mode.perch
    const perchWay = mode.perch || {}
    const perches = []
    // where the strokes marked as mist thin away (see `mist`)
    let mistBand = [-1e5, -99999]
    const shelter = []
    const SHELTER_CELL = 6
    let shelterGrid = null
    let shelterCols = 0
    let shelterRows = 0
    // the box the places to land are in, which the ones about the crown fly round
    const crownBox = { x: 0, y: 0, a: 1, b: 1 }
    // the canvas's place on the page, read when the stage is measured, so a pointer is placed without asking the page
    let pageLeft = 0
    let pageTop = 0
    let overTree = false
    let leftTree = -1e9
    let nextBack = 0
    let owners = []
    let flockPlaced = false
    const shelterAt = () => {
      shelterCols = Math.ceil(cssW / SHELTER_CELL) + 1
      shelterRows = Math.ceil(cssH / SHELTER_CELL) + 1
      shelterGrid = new Uint8Array(shelterCols * shelterRows)
      // 1 on the tree, and 2 close round it, where the pointer parts no grass either, so the crown never rocks
      const round = perchWay.clear || 0
      for (const [x, y, r] of shelter) {
        const reach = r + round
        const rows = [
          Math.max(0, Math.floor((y - reach) / SHELTER_CELL)),
          Math.min(shelterRows - 1, Math.floor((y + reach) / SHELTER_CELL)),
        ]
        const cols = [
          Math.max(0, Math.floor((x - reach) / SHELTER_CELL)),
          Math.min(shelterCols - 1, Math.floor((x + reach) / SHELTER_CELL)),
        ]
        for (let row = rows[0]; row <= rows[1]; row += 1) {
          for (let col = cols[0]; col <= cols[1]; col += 1) {
            const at = row * shelterCols + col
            const d = Math.hypot((col + 0.5) * SHELTER_CELL - x, (row + 0.5) * SHELTER_CELL - y) - SHELTER_CELL * 0.5
            if (d < r) {
              shelterGrid[at] = 1
            } else if (d < reach && shelterGrid[at] === 0) {
              shelterGrid[at] = 2
            }
          }
        }
      }
      if (perches.length) {
        // (laid out just now, so a place's terms are the canvas's as it is)
        const clear = perchWay.own ? perches.filter(([x, y]) => clearOfGlass(x, y)) : perches
        const box = clear.length ? clear : perches
        const xs = box.map((p) => p[0])
        const ys = box.map((p) => p[1])
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
        Object.assign(crownBox, {
          x: (x0 + x1) / 2,
          y: (y0 + y1) / 2,
          a: Math.max(8, (x1 - x0) / 2),
          b: Math.max(8, (y1 - y0) / 2),
        })
      }
    }
    // where a place laid out with the meadow is now, and the other way
    const nowX = (x) => (x * cssW) / grownFor.w
    const nowY = (y) => landBase + ((y - grownFor.base) * landRoom) / grownFor.room
    // 1 on the tree, 2 close round it, 0 elsewhere
    const treeAt = (x, y) => {
      if (!shelterGrid) {
        return 0
      }
      const col = Math.floor((x * grownFor.w) / cssW / SHELTER_CELL)
      const row = Math.floor((grownFor.base + ((y - landBase) * grownFor.room) / landRoom) / SHELTER_CELL)
      return col >= 0 && row >= 0 && col < shelterCols && row < shelterRows ? shelterGrid[row * shelterCols + col] : 0
    }
    const onTree = (x, y) => treeAt(x, y) === 1
    const perchNow = (k) => [nowX(perches[k][0]), nowY(perches[k][1])]
    // A place inside the lens's band along the picture's edges would show its butterfly smeared for as long as it sat
    // there, so only those clear of it are landed on.
    const clearOfGlass = (x, y) => x > glass.bandX + 8 && x < cssW - glass.bandX - 8 && y > glass.bandY + 8
    const usable = (k) => clearOfGlass(nowX(perches[k][0]), nowY(perches[k][1]))
    // A free place to land, any of them or one within `within` of a point, chosen by a dice of the butterfly's own.
    const freePerch = (b, near = null, within = 0) => {
      const free = []
      perches.forEach((p, k) => {
        if (owners[k] >= 0 || k === b.at || !usable(k)) {
          return
        }
        if (near && Math.hypot(nowX(p[0]) - near[0], nowY(p[1]) - near[1]) > within) {
          return
        }
        free.push(k)
      })
      return free.length ? free[Math.floor(hashed(b.seed * 53.1 + clock * 1.7) * free.length)] : -1
    }
    // a curve from where it is to an end (a place to land, `to`, or a point), the second handle kept beside the end
    const flyTo = (b, state, x1, y1, dx2, dy2, to, end, dur, ease, delay = 0) => {
      b.state = state
      b.path = [b.x, b.y, x1, y1, dx2, dy2, end ? end[0] : 0, end ? end[1] : 0]
      b.to = to
      b.from = clock + delay
      b.dur = Math.max(0.2, dur)
      b.ease = ease
    }
    const alight = (b, k) => {
      b.state = 'perched'
      b.at = k
      b.landed = clock
      b.wait = clock + perchWay.stay[0] + (perchWay.stay[1] - perchWay.stay[0]) * hashed(b.seed * 7.1 + clock)
    }
    const placeFlock = (still) => {
      owners = new Array(perches.length).fill(-1)
      // spread over the tree by a fixed order of its places, all but the last few, which come in during the opening
      const order = perches
        .map((_, k) => k)
        .filter(usable)
        .sort((p, q) => hashed(p * 3.7 + 1.3) - hashed(q * 3.7 + 1.3))
      flock.forEach((b, i) => {
        b.air = 0
        b.hindLag = null
        b.flitUntil = 0
        const arriving = !still && i >= flock.length - perchWay.arrive
        if (arriving || i >= order.length) {
          b.state = 'away'
          b.at = -1
          b.x = -1e4
          b.y = -1e4
          return
        }
        alight(b, order[i])
        owners[order[i]] = i
        b.landed = -1e9
        const [x, y] = perchNow(order[i])
        b.x = x
        b.y = y
      })
      nextBack = Math.max(nextBack, perchWay.first)
      flockPlaced = true
    }
    // Whether the words stand over the crown, as on a narrow screen, where they fly off to the sides rather than over them.
    const wordsOver = () => words.y + words.b < nowY(crownBox.y) - crownBox.b
    // Off they go, up and away from the pointer, the nearest first, each out through the edge of the picture, and never
    // back across the words.
    const scatter = (px, py) => {
      const margin = 40
      const over = wordsOver()
      for (const b of flock) {
        if (b.state === 'away' || b.state === 'flee') {
          continue
        }
        const d = Math.hypot(b.x - px, b.y - py) || 1
        const r1 = hashed(b.seed * 31.7 + clock * 3.1)
        const r2 = hashed(b.seed * 13.3 + clock * 7.9)
        let ax = (b.x - px) / d + (r1 - 0.5) * 0.9
        let ay = Math.min((b.y - py) / d, 0) * 0.5 - 0.75 - r2 * 0.5
        const away = b.x > words.x ? 1 : -1
        if (over) {
          ax = away * Math.max(Math.abs(ax), 0.9)
          ay = Math.max(ay, -(perchWay.climb ?? 0.5))
        } else {
          ax = away * Math.max(away * ax, 0.15)
        }
        const n = Math.hypot(ax, ay) || 1
        ax /= n
        ay /= n
        let tx = 1e9
        if (ax > 0) {
          tx = (cssW + margin - b.x) / ax
        } else if (ax < 0) {
          tx = (-margin - b.x) / ax
        }
        const ty = (-margin - b.y) / ay
        const t = Math.max(40, Math.min(tx, ty))
        const end = [b.x + ax * t, b.y + ay * t]
        const speed = perchWay.flee * (0.85 + 0.3 * r1)
        const swerve = (r2 - 0.5) * (perchWay.swerve ?? 120)
        flyTo(
          b,
          'flee',
          b.x + ax * 50 - ay * swerve * 0.3,
          b.y + ay * 50 + ax * swerve * 0.3,
          -ax * 140 - ay * swerve,
          -ay * 140 + ax * swerve,
          -1,
          end,
          t / speed,
          'in',
          d / 700 + r2 * 0.12,
        )
        b.at = -1
      }
      owners.fill(-1)
    }
    const easeOf = (ease, t) => {
      if (ease === 'in') {
        return t ** 1.7
      }
      if (ease === 'out') {
        return 1 - (1 - t) ** 2.4
      }
      return t * t * (3 - 2 * t)
    }
    const along = (b, u) => {
      const p = b.path
      const end = b.to >= 0 ? perchNow(b.to) : [p[6], p[7]]
      const v = 1 - u
      const [k0, k1, k2, k3] = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]
      return [
        k0 * p[0] + k1 * p[2] + k2 * (end[0] + p[4]) + k3 * end[0],
        k0 * p[1] + k1 * p[3] + k2 * (end[1] + p[5]) + k3 * end[1],
      ]
    }
    const turnTo = (from, to, f) =>
      from + (((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * f
    const perchFlock = (dt, still) => {
      if (!perches.length) {
        for (const b of flock) {
          b.show = 0
        }
        return
      }
      const seats = still ? perches.filter((_, k) => usable(k)).length : 0
      if (
        !flockPlaced ||
        owners.length !== perches.length ||
        (still && flock.some((b, i) => b.state !== 'perched' && i < seats))
      ) {
        placeFlock(still)
      }
      const way = perchWay
      for (const b of flock) {
        const { seed } = b
        const size = mode.flock[b.index].size * fit
        b.size = size
        let vx = 0
        let vy = 0
        let aloft = 0
        if (still) {
          if (b.state !== 'perched') {
            b.show = 0
            continue
          }
        } else if (b.state === 'perched') {
          // now and then off to another leaf, or for one that keeps about the crown, a turn round it; and at once, from
          // a leaf the lens has come over since the stage was resized
          if ((clock >= b.wait && !overTree) || !usable(b.at)) {
            if (mode.flock[b.index].flit) {
              b.flitUntil = clock + way.flit[0] + (way.flit[1] - way.flit[0]) * hashed(seed * 9.3 + clock)
              owners[b.at] = -1
              b.at = -1
              b.state = 'flit'
              b.path = null
            } else {
              const k = freePerch(b, usable(b.at) ? [b.x, b.y] : null, way.reach * fit)
              if (k >= 0) {
                const [x3, y3] = perchNow(k)
                const lift = 14 + Math.hypot(x3 - b.x, y3 - b.y) * 0.4
                owners[b.at] = -1
                owners[k] = b.index
                flyTo(
                  b,
                  'hop',
                  b.x,
                  b.y - lift,
                  0,
                  -lift,
                  k,
                  null,
                  0.5 + Math.hypot(x3 - b.x, y3 - b.y) / way.hop,
                  'both',
                )
              }
              b.wait = clock + way.stay[0] + (way.stay[1] - way.stay[0]) * hashed(seed * 5.3 + clock)
            }
          }
        } else if (b.state === 'away') {
          // back one at a time, once the pointer has been off the tree long enough, from just outside the picture
          if (!overTree && clock - leftTree > way.back && clock >= nextBack) {
            const k = freePerch(b)
            if (k >= 0) {
              const r1 = hashed(seed * 41.9 + clock * 2.3)
              const r2 = hashed(seed * 17.7 + clock * 5.1)
              const right = perchWay.own ? perchNow(k)[0] > cssW / 2 : crownBox.x > cssW / 2
              const side = r1 < 0.6 || wordsOver()
              const edge = right ? cssW + 30 : -30
              // how far above the places it comes in from the side, and drops onto its place from
              const rise = way.rise ?? 160
              b.x = side ? edge : nowX(crownBox.x) + (r2 - 0.3) * crownBox.a * 2.4
              b.y = side ? nowY(crownBox.y) - crownBox.b - r2 * rise : -30
              const [x3, y3] = perchNow(k)
              const inward = side ? Math.sign(cssW / 2 - edge) : 0
              owners[k] = b.index
              flyTo(
                b,
                'come',
                b.x + inward * 140,
                b.y + (side ? 30 : 140),
                (r2 - 0.5) * 80,
                (-70 - r1 * 50) * (rise / 160),
                k,
                null,
                Math.hypot(x3 - b.x, y3 - b.y) / way.come,
                'out',
              )
              b.at = -1
              nextBack = clock + way.every[0] + (way.every[1] - way.every[0]) * r2
            }
          }
        }
        if (b.state === 'flit' && (!b.path || clock >= b.from + b.dur)) {
          // once round is enough: down onto a free leaf, or on round the crown if there is none
          const k = clock >= b.flitUntil ? freePerch(b) : -1
          const hx = b.path ? b.x - b.px : 1
          const hy = b.path ? b.y - b.py : 0
          const hn = Math.hypot(hx, hy) || 1
          if (k >= 0) {
            const [x3, y3] = perchNow(k)
            owners[k] = b.index
            flyTo(
              b,
              'hop',
              b.x + (hx / hn) * 40,
              b.y + (hy / hn) * 40,
              0,
              -40,
              k,
              null,
              0.6 + Math.hypot(x3 - b.x, y3 - b.y) / way.hop,
              'out',
            )
          } else {
            const a = -Math.PI * (0.05 + 0.9 * hashed(seed * 3.9 + clock * 1.3))
            const ring = 1.15 + 0.25 * hashed(seed * 8.1 + clock)
            const end = [
              clamp(nowX(crownBox.x) + Math.cos(a) * crownBox.a * ring, glass.bandX + 20, cssW - glass.bandX - 20),
              Math.max(glass.bandY + 20, nowY(crownBox.y) + Math.sin(a) * crownBox.b * ring * 1.3),
            ]
            const turn = (hashed(seed * 2.2 + clock * 4.4) - 0.5) * 100
            flyTo(
              b,
              'flit',
              b.x + (hx / hn) * 50,
              b.y + (hy / hn) * 50,
              turn,
              (hashed(seed + clock) - 0.5) * 80,
              -1,
              end,
              0.9 + 0.6 * hashed(seed * 6.6 + clock),
              'both',
            )
          }
        }
        // where it is, and how it is going
        if (b.state === 'perched') {
          ;[b.x, b.y] = perchNow(b.at)
          if (way.hover) {
            // on the wing in its place, rising and sinking a little and drifting from side to side
            aloft = 1
            b.x += way.hover.sway * fit * Math.sin(clock * 0.83 + seed * 7.1)
            b.y += way.hover.bob * fit * Math.sin(clock * 1.9 + seed * 3.3)
          }
        } else if (b.state !== 'away') {
          const t = clamp((clock - b.from) / b.dur, 0, 1)
          const u = easeOf(b.ease, t)
          const [x, y] = along(b, u)
          const [x2, y2] = along(b, Math.min(1, u + 0.02))
          const [x0, y0] = along(b, Math.max(0, u - 0.02))
          vx = x2 - x0
          vy = y2 - y0
          // a flutter across its way, none at either end
          const n = Math.hypot(vx, vy) || 1
          const wob = Math.sin(Math.PI * t) * way.flutter * fit * Math.sin(clock * 9.5 + seed * 20)
          b.px = b.x
          b.py = b.y
          b.x = x - (vy / n) * wob
          b.y = y + (vx / n) * wob
          aloft = clock >= b.from - 0.08 ? 1 : 0
          if (t >= 1) {
            if (b.state === 'flee') {
              b.state = 'away'
            } else if (b.state === 'hop' || b.state === 'come') {
              alight(b, b.to)
            }
          }
        }
        // its wings: a slow opening and closing at rest, a quick beat in the air, and a moment between the two
        const rate = (dt > 0 ? 1 : 0) * aloft
        b.air = still ? 0 : clamp(b.air + (aloft - b.air) * Math.min(1, dt * (aloft > b.air ? 9 : 2.5)), 0, 1)
        b.phase += dt * way.beat * (0.85 + seed * 0.3) * Math.max(rate, b.air)
        const turn = b.phase * Math.PI * 2
        const shut =
          (0.5 + 0.5 * Math.sin(turn + 0.35 * Math.sin(turn))) ** FLIGHT.snap *
          (1 - FLIGHT.shallow * (0.5 + 0.5 * Math.sin(b.phase * 1.37 + seed * 23)))
        const beating = FLIGHT.open + (FLIGHT.shut - FLIGHT.open) * shut
        const cycle = way.rest[0] + (way.rest[1] - way.rest[0]) * hashed(b.index * 7.7 + 1.3)
        const slow = 0.5 - 0.5 * Math.cos(((clock + seed * 13) / cycle) * Math.PI * 2)
        // each opens its wings as far as it likes, some all the way and some hardly at all
        const opens = 0.3 + 0.7 * hashed(b.index * 5.1 + 0.7)
        const resting = way.wings[0] + (way.wings[1] - way.wings[0]) * smooth(0.3, 0.9, slow) * opens
        const open = resting + (beating - resting) * b.air
        b.hindLag = b.hindLag === null || dt === 0 ? open : b.hindLag + (open - b.hindLag) * (1 - Math.exp(-dt / 0.035))
        const velocity = dt > 0 ? (open - b.lastFlap) / dt : 0
        b.lastFlap = open
        b.flap = open
        b.hind = b.hindLag - 0.06
        b.lag = clamp(-velocity * 0.04, -0.26, 0.26)
        // sitting, it faces along its leaf, seen a little from above; flying, from behind, as the others fly
        let facing = vx < 0 ? -1 : 1
        if (b.at >= 0 && b.state === 'perched') {
          facing = perches[b.at][2]
        }
        // and sits a little its own way
        const tilt = (hashed(b.index * 2.9 + 0.4) - 0.5) * 0.5
        const sitRoll = way.sit[2] * (0.8 + 0.4 * hashed(b.index * 4.3 + 0.1)) * facing
        const sat = facing > 0 ? way.sit[0] + tilt : Math.PI - way.sit[0] - tilt
        const heading = Math.hypot(vx, vy) > 1e-3 ? Math.atan2(-vy, vx) : sat
        const leftward = Math.cos(heading) < 0 ? -1 : 1
        b.heading = turnTo(sat, heading, b.air)
        b.pitch = way.sit[1] + (FLIGHT.away + 0.1 * (seed - 0.5) - way.sit[1]) * b.air
        b.roll = sitRoll + ((b.pose + 0.05 * Math.sin(clock * 1.3 + seed * 61)) * leftward - sitRoll) * b.air
        if (way.hover && b.state === 'perched') {
          // and seen as it holds there, from a little behind and above, turning a little this way and that
          b.heading = way.hover.pose[0] + 0.06 * Math.sin(clock * 0.61 + seed * 5.3)
          b.pitch = way.hover.pose[1] + 0.05 * Math.sin(clock * 0.47 + seed * 2.9)
          b.roll = way.hover.pose[2] + 0.08 * Math.sin(clock * 1.07 + seed * 9.7)
        }
        b.screenX = b.x
        // its body sits a little above the leaf it is on
        b.screenY = b.y - size * way.lift * (1 - b.air)
        const opening = still ? 1 : smooth(way.appear, way.appear + 0.6, intro)
        // the ones sitting from the start show as the crown is painted
        b.show = b.landed === -1e9 ? opening : 1
        if (b.state === 'away') {
          b.show = 0
        }
      }
    }
    // A tap on the tree sends them off too, and a finger leaves it as it lifts; a pointer that leaves the page has left
    // the tree.
    const onPress = (event) => {
      if (PREFERS_REDUCED.matches || !inView) {
        return
      }
      const x = event.pageX - pageLeft
      const y = event.pageY - pageTop
      if (onTree(x, y)) {
        scatter(x, y)
        overTree = event.pointerType === 'mouse'
        leftTree = clock
      }
    }
    const onLeave = () => {
      if (overTree) {
        overTree = false
        leftTree = clock
      }
    }
    if (perching) {
      window.addEventListener('pointerdown', onPress, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave, { passive: true })
    }

    /* ---- the butterflies that come to the pointer ---- */
    /* A composition with `orbit` has a flock that is nowhere in the picture until the pointer rests in a certain place in
       it (orbit.zone). Then they come in from beyond the picture's sides, in through the glass at its edges, each on a
       curve that joins its own ring round the pointer going the way the ring goes, as the flock that perches flies down
       onto a leaf; and they go round and round the pointer, each on its own ring: so far out, so fast and that way round,
       its plane tipped back from the page and leaning across it, so that the ring is seen as an ellipse whose far side is
       up the page, behind the pointer, where the butterfly is a little smaller. They follow the pointer about the place
       smoothly, each trailing it by as much as it likes. Once the pointer has been out of the place for a moment they go
       as they came, each on the way it is flying, out through the glass at the sides. Where nothing hovers, a tap in the
       place brings them to it for a while, and a tap elsewhere on the picture sends them off. Their rings are kept clear
       of the words, of the glass at the sides and of the picture's foot, and made smaller where the place has too little
       room for them; on the way in and out they keep under the words, as the free flock keeps off the buttons. In a still
       picture there are none, and with reduced motion the pointer calls none. Their wings beat in bursts and glide
       between them as the free flock's do, harder on the way in and out, and they are seen from behind and a little
       above as the free flock is, turned the way they are flying as the flock that perches is in the air, and banked
       into their turn. All of it is timed on the meadow's own clock, and a pointer is placed by where the canvas was last
       measured on the page, so that nothing asks the page for its layout. */
    const orbiting = !!mode.orbit && !perching
    const orbitWay = mode.orbit || {}
    // Each one's ring, its own or from its seed: how far out at a fit of 1, how fast and which way round, how far its
    // plane is tipped back from the page and how far it leans across it, and how many seconds it trails the pointer by.
    const rings = orbiting
      ? mode.flock.map((own) => ({
          ring: own.ring ?? 50 + 46 * hashed(own.seed * 3.1 + 0.4),
          spin: own.spin ?? (0.9 + 0.7 * hashed(own.seed * 5.7 + 0.2)) * (hashed(own.seed * 9.1 + 0.3) < 0.25 ? -1 : 1),
          tilt: own.tilt ?? 0.95 + 0.35 * hashed(own.seed * 2.3 + 0.9),
          lean: own.lean ?? (hashed(own.seed * 7.3 + 0.1) - 0.5) * 0.5,
          trail: own.trail ?? 0.2 + 0.3 * hashed(own.seed * 4.9 + 0.6),
        }))
      : []
    if (orbiting) {
      for (const b of flock) {
        Object.assign(b, {
          state: 'away',
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          cx: 0,
          cy: 0,
          cvx: 0,
          cvy: 0,
          theta: 0,
          depth: 0,
          depthFrom: 0,
          handle: 0,
          bank: 0,
          path: null,
        })
      }
    }
    // The pointer: whether a hovering one is in the place, since when, and since when it has been out of it; where it
    // was last in it, on the canvas in CSS pixels; until when a tap holds them; whether they are called; and a finger
    // that has just come down.
    const call = { hover: false, since: 0, left: -1e9, until: -1e9, x: 0, y: 0, on: false, down: null }
    // the place as it is now, an ellipse on the canvas in CSS pixels
    const zoneNow = () => {
      const zone = orbitWay.zone || { at: [0.5, 0.8], half: [0.2, 0.12] }
      if (typeof zone === 'function') {
        return zone({
          w: cssW,
          h: cssH,
          words: { x: words.x, y: words.y, a: words.a, b: words.b },
          base: landBase,
          room: landRoom,
        })
      }
      return { x: cssW * zone.at[0], y: cssH * zone.at[1], a: cssW * zone.half[0], b: cssH * zone.half[1] }
    }
    const inZone = (zone, x, y, grow = 1) => ((x - zone.x) / zone.a) ** 2 + ((y - zone.y) / zone.b) ** 2 <= grow * grow
    // Where the rings go round, and how large they are: the pointer, held in the place, and kept where every ring, and
    // the wings going round on it, is clear of the words, of the glass at the sides and of the picture's foot.
    const aim = { x: 0, y: 0, scale: 1 }
    const aimAt = (zone) => {
      let dx = call.x - zone.x
      let dy = call.y - zone.y
      const out = Math.hypot(dx / zone.a, dy / zone.b)
      if (out > 1) {
        dx /= out
        dy /= out
      }
      let x = zone.x + dx
      let y = zone.y + dy
      // the largest ring's reach across the page and down it, and the largest wing's
      let rx = 1
      let ry = 1
      let wing = 0
      rings.forEach((r, i) => {
        const reach = r.ring * fit
        const [c, s, k] = [Math.cos(r.lean), Math.sin(r.lean), Math.cos(r.tilt)]
        rx = Math.max(rx, Math.hypot(reach * c, reach * k * s))
        ry = Math.max(ry, Math.hypot(reach * s, reach * k * c))
        wing = Math.max(wing, mode.flock[i].size * fit * 1.3)
      })
      const foot = cssH - (optics.foot === false ? 0 : cssH * 0.1) - wing * 0.6
      const under = Math.abs(x - words.x) < words.a + rx + wing ? words.y + words.b + 14 : -1e5
      const top = Math.max(optics.top === false ? 0 : glass.bandY, under) + wing
      const scale = clamp((foot - top) / (2 * ry), 0.35, 1)
      const [low, high] = [top + ry * scale, foot - ry * scale]
      y = low > high ? (low + high) / 2 : clamp(y, low, high)
      const side = glass.bandX + rx * scale + wing
      x = side > cssW - side ? cssW / 2 : clamp(x, side, cssW - side)
      aim.x = x
      aim.y = y
      aim.scale = scale
    }
    // A place on its ring now, its far side up the page and away; how far away it is there, from -1 (nearest) to 1; and
    // which way it is going round there, across the page and down it.
    const onRing = (b) => {
      const r = rings[b.index]
      const reach = r.ring * fit * aim.scale * (1 + 0.1 * Math.sin(clock * (0.5 + b.seed * 0.4) + b.seed * 13))
      const [c, s] = [Math.cos(b.theta), Math.sin(b.theta)]
      const [cl, sl, k] = [Math.cos(r.lean), Math.sin(r.lean), Math.cos(r.tilt)]
      const way = Math.sign(r.spin) || 1
      const [px, py] = [reach * c, -reach * s * k]
      const [tx, ty] = [-s * way, -c * k * way]
      // and a drift of its own up and down the page, as the free flock's
      const drift = Math.sin(clock * (0.47 + b.seed * 0.3) + b.seed * 17) * 6 * (0.5 + b.seed) * fit
      return [
        b.cx + px * cl - py * sl,
        b.cy + px * sl + py * cl + drift,
        s * Math.sin(r.tilt),
        tx * cl - ty * sl,
        tx * sl + ty * cl,
      ]
    }
    // On its way: a curve from where it is, with a handle of its own (`path`), to its ring as the ring is then, with a
    // handle beside it along the ring ('come'), or to a place beyond the picture's side with a handle of its own ('leave'),
    // on the meadow's clock.
    const orbitTo = (b, state, x1, y1, dur, ease, delay = 0, end = [0, 0, 0, 0]) => {
      b.state = state
      b.path = [b.x, b.y, x1, y1, ...end]
      b.from = clock + delay
      b.dur = Math.max(0.2, dur)
      b.ease = ease
    }
    const orbitAlong = (b, u, end, handle) => {
      const p = b.path
      const v = 1 - u
      const [k0, k1, k2, k3] = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]
      return [
        k0 * p[0] + k1 * p[2] + k2 * (end[0] + handle[0]) + k3 * end[0],
        k0 * p[1] + k1 * p[3] + k2 * (end[1] + handle[1]) + k3 * end[1],
      ]
    }
    // The lowest a butterfly of this size may be anywhere across the words, and the lowest on the picture.
    const underWords = (size) => (words.x > -1e4 ? words.y + words.b + 14 + size * 1.4 : glass.bandY + size)
    const lowest = (size) => cssH * (optics.foot === false ? 0.94 : 0.86) - size
    // They come: each from beyond a side of the picture, one from each side in turn and the first from the side the
    // pointer is nearer, each a little after the one before, from higher or lower than the rings, swooping in to join
    // its ring where the ring goes across the page the way it came; and one on its way out turns back from where it is.
    const sendIn = (dt) => {
      const first = aim.x < cssW / 2 ? -1 : 1
      let k = 0
      for (const b of flock) {
        if (b.state === 'come' || b.state === 'ring') {
          continue
        }
        const r = rings[b.index]
        const size = mode.flock[b.index].size * fit
        const r1 = hashed(b.seed * 23.1 + clock * 1.9)
        const r2 = hashed(b.seed * 11.7 + clock * 3.7)
        const turning = b.state === 'leave' && clock >= b.from
        // (turning back, from the side it is on)
        const from = turning ? b.x - aim.x : first * (k % 2 === 0 ? 1 : -1)
        const side = from < 0 ? -1 : 1
        const delay = turning ? -dt : k * (orbitWay.every ?? 0.24) + r1 * 0.12
        const [high, low] = [Math.max(underWords(size), aim.y - 170 * fit), Math.min(lowest(size), aim.y + 110 * fit)]
        if (!turning) {
          k += 1
          b.x = cssW / 2 + side * (glass.reachX + size * 1.6 + 8)
          b.y = clamp(aim.y + (r2 - 0.5) * 260 * fit, high, Math.max(high, low))
          b.vx = 0
          b.vy = 0
          b.glide = 1
        }
        if (!turning) {
          b.cx = aim.x
          b.cy = aim.y
          b.cvx = 0
          b.cvy = 0
        }
        const dist = Math.max(40, Math.hypot(aim.x - b.x, aim.y - b.y))
        const dur = dist / ((orbitWay.come ?? 360) * Math.max(0.7, fit)) + 0.35
        // where it joins its ring, by the time it gets there: where the ring goes across the page the way it comes
        const way = Math.sign(r.spin) || 1
        b.theta = side * way * (Math.PI / 2) + (r2 - 0.5) * 0.6 - r.spin * (delay + dur)
        b.handle = dist * 0.3
        if (turning) {
          // on the way it was going, and round
          const v = Math.hypot(b.vx, b.vy) || 1
          const h = clamp((v * dur) / 4.5, 10, dist * 0.4)
          orbitTo(b, 'come', b.x + (b.vx / v) * h, b.y + (b.vy / v) * h, dur, 'both', delay)
        } else {
          // in from the side, swooping up or down on the way
          const swoop = clamp(b.y + (r1 - 0.5) * dist * 0.5, high, Math.max(high, low))
          b.heading = Math.atan2(b.y - swoop, -side * dist * 0.35)
          orbitTo(b, 'come', b.x - side * dist * 0.35, swoop, dur, 'both', delay)
        }
      }
    }
    // They go: each the way it is going round its ring across the page (or, going up or down it there, to the nearer
    // side), some a little up and some a little down, and out through the glass at that side, setting off as fast as it
    // was going; and one that has not yet set out does not.
    const sendOff = (dt) => {
      for (const b of flock) {
        if (b.state === 'away' || b.state === 'leave') {
          continue
        }
        if (b.state === 'come' && clock < b.from) {
          b.state = 'away'
          continue
        }
        const size = mode.flock[b.index].size * fit
        const r1 = hashed(b.seed * 31.3 + clock * 2.9)
        const across = b.state === 'ring' ? onRing(b)[3] : b.vx / (Math.hypot(b.vx, b.vy) || 1)
        const going = Math.abs(across) > 0.35 ? across : b.x - cssW / 2
        const dir = going < 0 ? -1 : 1
        const ex = cssW / 2 + dir * (glass.reachX + size * 1.6 + 12)
        const ey = clamp(b.y + (0.3 - r1) * 160 * fit, underWords(size), Math.max(underWords(size), lowest(size)))
        const dist = Math.hypot(ex - b.x, ey - b.y)
        const dur = dist / ((orbitWay.leave ?? 400) * Math.max(0.7, fit)) + 0.25
        const v = Math.hypot(b.vx, b.vy) || 1
        const h = clamp((v * dur) / 3, 6, Math.max(6, dist * 0.3))
        b.depthFrom = b.depth
        orbitTo(b, 'leave', b.x + (b.vx / v) * h, b.y + (b.vy / v) * h, dur, clamp((v * dur) / (3 * h), 0.05, 1), -dt, [
          ex,
          ey,
          -dir * dist * 0.3,
          6,
        ])
      }
    }
    const orbitFlock = (dt, still) => {
      if (still) {
        for (const b of flock) {
          b.state = 'away'
          b.show = 0
        }
        call.on = false
        return
      }
      aimAt(zoneNow())
      const wanted =
        clock < call.until ||
        (call.hover
          ? call.on || clock - call.since >= (orbitWay.call ?? 0.25)
          : call.on && clock - call.left < (orbitWay.linger ?? 0.8))
      if (wanted !== call.on) {
        call.on = wanted
        if (wanted) {
          sendIn(dt)
        } else {
          sendOff(dt)
        }
      }
      for (const b of flock) {
        const { seed } = b
        const r = rings[b.index]
        const base = mode.flock[b.index].size * fit
        if (b.state === 'away') {
          b.show = 0
          b.size = base
          continue
        }
        // each follows the pointer a little behind it, as far behind as it likes, as on a spring that never overshoots,
        // so that where the pointer jumps to (a tap) it sets off smoothly; and goes on round its ring
        const pull = 2.15 / r.trail
        b.cvx += (pull * pull * (aim.x - b.cx) - 2 * pull * b.cvx) * dt
        b.cvy += (pull * pull * (aim.y - b.cy) - 2 * pull * b.cvy) * dt
        b.cx += b.cvx * dt
        b.cy += b.cvy * dt
        b.theta += dt * r.spin * (1 + 0.12 * Math.sin(clock * 0.37 + seed * 29))
        const ring = onRing(b)
        let [x, y, depth] = ring
        if (b.state !== 'ring') {
          const t = clamp((clock - b.from) / b.dur, 0, 1)
          if (b.state === 'come') {
            // onto its ring, going round it as it gets there
            const u = easeOf(b.ease, t)
            const round = Math.hypot(ring[3], ring[4]) || 1
            ;[x, y] = orbitAlong(b, u, ring, [(-ring[3] / round) * b.handle, (-ring[4] / round) * b.handle])
            depth *= u
            if (t >= 1) {
              b.state = 'ring'
            }
          } else {
            const u = b.ease * t + (1 - b.ease) * t * t
            const p = b.path
            ;[x, y] = orbitAlong(b, u, [p[4], p[5]], [p[6], p[7]])
            depth = b.depthFrom * (1 - u)
            if (t >= 1) {
              b.state = 'away'
            }
          }
        }
        if (dt > 0) {
          b.vx = (x - b.x) / dt
          b.vy = (y - b.y) / dt
        }
        b.x = x
        b.y = y
        b.depth = depth
        // and on its way in or out, a weave across it, none at either end, as the flock that perches flutters
        let wob = 0
        if (b.state === 'come' || b.state === 'leave') {
          const t = clamp((clock - b.from) / b.dur, 0, 1)
          wob = Math.sin(Math.PI * t) * (orbitWay.flutter ?? 6) * fit * Math.sin(clock * 9.5 + seed * 20)
        }
        const pace = Math.hypot(b.vx, b.vy) || 1
        // its wings, as the free flock's: bursts of beats with glides between them going round, and beating all the way
        // in and out
        const beat =
          b.state === 'ring' &&
          0.5 + 0.5 * Math.sin(clock * (FLIGHT.bursts[0] + seed * FLIGHT.bursts[1]) + seed * 91) < 0.2
            ? 0
            : 1
        b.glide += (beat - b.glide) * Math.min(1, dt * 3.2)
        b.phase += dt * 3.4 * (0.85 + seed * 0.3) * (0.3 + 0.7 * b.glide) * (b.state === 'ring' ? 1 : 1.2)
        const turn = b.phase * Math.PI * 2
        const shut =
          (0.5 + 0.5 * Math.sin(turn + 0.35 * Math.sin(turn))) ** FLIGHT.snap *
          (1 - FLIGHT.shallow * (0.5 + 0.5 * Math.sin(b.phase * 1.37 + seed * 23)))
        const open = FLIGHT.soar + (FLIGHT.open + (FLIGHT.shut - FLIGHT.open) * shut - FLIGHT.soar) * b.glide
        b.hindLag = b.hindLag === null || dt === 0 ? open : b.hindLag + (open - b.hindLag) * (1 - Math.exp(-dt / 0.035))
        const flapping = dt > 0 ? (open - b.lastFlap) / dt : 0
        b.lastFlap = open
        b.flap = open
        b.hind = b.hindLag - 0.06
        b.lag = clamp(-flapping * 0.04, -0.26, 0.26)
        // turned the way it is flying, and banked into its turn
        if (dt > 0 && Math.hypot(b.vx, b.vy) > 1) {
          const before = b.heading
          b.heading = turnTo(b.heading, Math.atan2(-b.vy, b.vx), 1 - Math.exp(-dt / 0.07))
          const rate = turnTo(0, b.heading - before, 1) / dt
          b.bank += (clamp(rate * 0.1, -0.4, 0.4) - b.bank) * Math.min(1, dt * 6)
        }
        b.pitch = FLIGHT.away + 0.1 * (seed - 0.5) + 0.05 * Math.sin(clock * (0.27 + seed * 0.2) + seed * 47)
        b.roll =
          (b.pose + 0.05 * Math.sin(clock * (0.33 + seed * 0.2) + seed * 61)) *
            clamp(Math.cos(b.heading) * 2.5, -1, 1) +
          b.bank
        // a little smaller behind the pointer, and thrown up the page and along its way by each beat
        const size = base * (1 - 0.14 * depth)
        b.size = size
        const bob = Math.cos(turn) * FLIGHT.hop * b.glide * size
        const ripple = Math.cos(turn) * FLIGHT.surge * size * b.glide
        const sx = x - (b.vy / pace) * wob + Math.cos(b.heading) * ripple
        let sy = y + (b.vx / pace) * wob + bob - Math.sin(b.heading) * ripple
        // and never over the words: under them it keeps its wings off them, as the free flock keeps off the buttons
        const q = clamp((Math.abs(sx - words.x) - words.a - size * 0.9) / 140, 0, 1)
        sy += Math.max(0, words.y + words.b + 14 + size * 1.4 - sy) * (1 - q * q * (3 - 2 * q))
        b.screenX = sx
        b.screenY = sy
        b.show = b.state === 'come' && clock < b.from ? 0 : 1
      }
    }
    // A pointer's place on the canvas, by where the canvas was last measured on the page.
    const orbitPlace = (event) => [event.pageX - pageLeft, event.pageY - pageTop]
    // A hovering pointer (a mouse's, or a pen's) calls them while it is in the place, and a little way round it once they
    // have come; a finger never hovers, and its moves are the page being scrolled.
    const onOrbitMove = (event) => {
      if (PREFERS_REDUCED.matches || !inView || event.pointerType === 'touch') {
        return
      }
      const [x, y] = orbitPlace(event)
      if (inZone(zoneNow(), x, y, call.hover ? 1.25 : 1)) {
        if (!call.hover) {
          call.hover = true
          call.since = clock
          call.until = -1e9
        }
        call.x = x
        call.y = y
      } else if (call.hover) {
        call.hover = false
        call.left = clock
      }
    }
    const onOrbitLeave = () => {
      if (call.hover) {
        call.hover = false
        call.left = clock
      }
    }
    // A finger (or a pen) that comes down and lifts again within a moment, without moving, has tapped: in the place, it
    // brings them there for a while; anywhere else on the picture, it sends them off.
    const onOrbitDown = (event) => {
      call.down =
        event.pointerType === 'mouse'
          ? null
          : { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() }
    }
    const onOrbitUp = (event) => {
      const { down } = call
      call.down = null
      if (!down || down.id !== event.pointerId || PREFERS_REDUCED.matches || !inView) {
        return
      }
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 12 || performance.now() - down.at > 600) {
        return
      }
      const [x, y] = orbitPlace(event)
      if (inZone(zoneNow(), x, y)) {
        call.x = x
        call.y = y
        call.until = clock + (orbitWay.stay ?? 7)
      } else if (call.on && x >= 0 && y >= 0 && x <= cssW && y <= cssH) {
        call.until = -1e9
        call.left = -1e9
      }
    }
    const onOrbitCancel = () => {
      call.down = null
    }
    if (orbiting) {
      window.addEventListener('pointermove', onOrbitMove, { passive: true })
      window.addEventListener('pointerdown', onOrbitDown, { passive: true })
      window.addEventListener('pointerup', onOrbitUp, { passive: true })
      window.addEventListener('pointercancel', onOrbitCancel, { passive: true })
      document.documentElement.addEventListener('pointerleave', onOrbitLeave, { passive: true })
    }

    /* How much the glass at the sides magnifies the flock, away from the canvas's middle, for a part of it that far
       across from the middle, in CSS pixels. Each place on the screen shows what is nearer the middle in the flock, by
       as much as the lens there says (see LENS_FRAGMENT), so where on the screen that part is seen is found by halving
       the screen until a place there shows it. */
    const glassAt = (across) => {
      const half = cssW / 2
      const times = (seen) => {
        const v = optics.in + ((seen - (half - glass.bandX)) / glass.bandX) * (1 - optics.in)
        const t = clamp((v - optics.in) / (1 - optics.in), 0, 1)
        return t > 0 ? v / (optics.in + ((1 - optics.in) * (1 - Math.exp(-optics.bend * t))) / optics.bend) : 1
      }
      let near = across
      let far = Math.max(across, half)
      for (let i = 0; i < 20; i += 1) {
        const mid = (near + far) / 2
        if (mid / times(mid) < across) {
          near = mid
        } else {
          far = mid
        }
      }
      return times(far)
    }
    const advance = (dt) => {
      const still = isStill()
      clock += dt
      intro += dt
      // the stirs age, and go once the grass they pushed has settled
      for (const stir of stirs) {
        stir.age += dt
      }
      while (stirs.length && stirs[0].age > mode.stir.life) {
        stirs.shift()
      }
      // the passer lays a stir every few pixels of its way
      placePasser()
      if (passer.on && !still) {
        const moved = Math.hypot(passer.x - passer.laidX, passer.y - passer.laidY)
        if (moved > mode.stir.every / 2) {
          const way = moved || 1
          const fresh = moved > 60
          lay(
            passer.x,
            passer.y,
            mode.passer.push,
            fresh ? 1 : (passer.x - passer.laidX) / way,
            fresh ? 0 : (passer.y - passer.laidY) / way,
          )
          passer.laidX = passer.x
          passer.laidY = passer.y
        }
      }
      stirData.fill(0)
      stirWay.fill(0)
      stirs.forEach((stir, i) => {
        stirData.set([stir.x, stir.y, stir.age, stir.push], i * 4)
        stirWay.set([stir.wayX, stir.wayY], i * 2)
      })

      if (perching) {
        perchFlock(dt, still)
        return
      }
      if (orbiting) {
        orbitFlock(dt, still)
        return
      }
      // the butterflies, as /products/api-hosting flies its own, only small, and with nothing to carry
      for (const b of flock) {
        const { seed } = b
        const { crossing } = mode
        // (at rest a crossing flock is a little smaller than in flight, `crossing.restSize`, so that the whole of the
        // largest of them is in the band's room above what it crosses, and none of it over what is written there)
        const size = mode.flock[b.index].size * fit * (crossing && still ? crossing.restSize : 1)
        b.size = size
        const exit = glass.reachX + size * 1.6
        const way = exit * 2
        const speed = crossing
          ? way / crossing.across
          : b.speed * Math.max(0.7, fit) * (1 + FLIGHT.glide * (1 - b.glide))
        if (crossing) {
          // Where it is in this pass, from beyond the left edge (0) to beyond the right (1), on the meadow's clock: they
          // go over together now and then, each a little after the first, and are away between; at rest, part-way over.
          const into = still
            ? crossing.rest[b.index] * crossing.across
            : (((clock - crossing.after[b.index]) % crossing.every) + crossing.every) % crossing.every
          b.u = Math.min(1, into / crossing.across)
        } else {
          if (!still) {
            b.u += (dt * speed) / way
          }
          if (b.u >= 1) {
            b.u -= 1
          }
        }
        const gust = still ? 1 : Math.min(1, intro / (3.2 + seed * 0.9))
        const eased = 1 - (1 - gust) ** 3
        let x = -exit + b.u * way * eased
        x += Math.sin(clock * (0.31 + seed * 0.2) + seed * 40) * 14 * (0.5 + seed)
        const envelope = 0.5 + 0.5 * Math.sin(clock * (FLIGHT.bursts[0] + seed * FLIGHT.bursts[1]) + seed * 91)
        const wantsGlide = envelope < 0.2 ? 0 : 1
        b.glide += (wantsGlide - b.glide) * Math.min(1, dt * 3.2)
        const rate = 3.4 * (0.85 + seed * 0.3) * (0.3 + 0.7 * b.glide)
        b.phase += dt * rate
        const turn = b.phase * Math.PI * 2
        const shut =
          (0.5 + 0.5 * Math.sin(turn + 0.35 * Math.sin(turn))) ** FLIGHT.snap *
          (1 - FLIGHT.shallow * (0.5 + 0.5 * Math.sin(b.phase * 1.37 + seed * 23)))
        const open = still
          ? 0.42 + seed * 0.6
          : FLIGHT.soar + (FLIGHT.open + (FLIGHT.shut - FLIGHT.open) * shut - FLIGHT.soar) * b.glide
        b.hindLag = b.hindLag === null ? open : b.hindLag + (open - b.hindLag) * (1 - Math.exp(-dt / 0.035))
        const velocity = dt > 0 ? (open - b.lastFlap) / dt : 0
        b.lastFlap = open
        b.flap = open
        b.hind = b.hindLag - 0.06
        b.lag = clamp(-velocity * 0.04, -0.26, 0.26)
        const bob = (still ? 0 : Math.cos(turn) * FLIGHT.hop * b.glide) * size
        const climbing = (FLIGHT.sink * (1 - b.glide) - FLIGHT.rise * b.glide) * (size / 64) - b.lift * FLIGHT.settle
        b.lift += climbing * dt
        let y = laneY(b.lane, x) + b.lift + bob + Math.sin(clock * (0.47 + seed * 0.3) + seed * 17) * 7 * (0.5 + seed)
        // and at rest, a crossing flock waits just above what it crosses, so many of its own sizes down from the canvas's
        // top, so that however large the band makes them their wings, which at rest reach less than a size from the body,
        // are in it
        if (crossing && still) {
          y = crossing.restY[b.index] * size
        }
        const ripple = still ? 0 : Math.cos(turn) * FLIGHT.surge * size * b.glide
        b.screenX = cssW / 2 + x + ripple
        // Under the words it keeps its wings off the buttons, however far up they beat.
        const q = clamp((Math.abs(x + cssW / 2 - words.x) - words.a - size * 0.9) / 140, 0, 1)
        b.screenY = y + Math.max(0, words.y + words.b + 14 + size * 1.4 - y) * (1 - q * q * (3 - 2 * q))
        // A crossing flock's band is only as tall as its wings need, and it keeps them in it: a wing reaches about
        // `crossing.room` of its size from the body, so towards the band's top or its foot a butterfly is eased back from
        // the edge, as its own beat would carry it, rather than cut off by it. Through the glass at the sides the flock is
        // magnified away from the canvas's middle, up and down as much as across, so there it needs more room: as much
        // more as the glass magnifies its outer wing where on the screen that is seen.
        if (crossing && !still) {
          const outer = Math.abs(b.screenX - cssW / 2) + size * crossing.room
          const edge = cssH / 2 - cssH / 2 / glassAt(outer) + size * crossing.room
          const ease = size * 0.3
          if (b.screenY < edge + ease) {
            b.screenY = edge + ease * Math.exp((b.screenY - edge - ease) / ease)
          } else if (b.screenY > cssH - edge - ease) {
            b.screenY = cssH - edge - ease * Math.exp((cssH - edge - ease - b.screenY) / ease)
          }
        }
        const swing = Math.sin(clock * (0.41 + seed * 0.27) + seed * 29)
        const slope = (laneY(b.lane, x + 16) - laneY(b.lane, x - 16)) / 32 + climbing / speed
        b.heading =
          clamp(
            FLIGHT.slant - Math.atan(slope) * 0.3 + FLIGHT.spread * (seed - 0.5) * 2 + swing * 0.07,
            FLIGHT.slant - FLIGHT.leans[0],
            FLIGHT.slant + FLIGHT.leans[1],
          ) + (still ? 0 : 0.05 * b.glide * (1 - 2 * shut))
        b.pitch = FLIGHT.away + 0.1 * (seed - 0.5) + 0.05 * Math.sin(clock * (0.27 + seed * 0.2) + seed * 47)
        b.roll = b.pose + 0.05 * Math.sin(clock * (0.33 + seed * 0.2) + seed * 61) - 0.02 * swing
        b.show = Math.abs(x) > exit - 2 || (crossing && b.u >= 1) ? 0 : 1
      }
    }

    /* ---- one picture ---- */
    let ready = false
    // The composition's own sky, its inks for the theme from the top of the canvas down.
    const skyInks = new Float32Array(24)
    const skyAt = new Float32Array(8)
    const paintSky = () => {
      const stops = mode.sky.stops.slice(0, 8)
      stops.forEach(([at, name], i) => {
        skyInks.set(rgb(mode.inks[name][dark ? 1 : 0]), i * 3)
        skyAt[i] = at
      })
      gl.disable(gl.BLEND)
      gl.useProgram(sky.program)
      const u = sky.uniforms
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, grainTex)
      gl.uniform1i(u.uGrain, 0)
      gl.uniform2f(u.uCanvas, cssW, cssH)
      gl.uniform1f(u.uPixels, w / cssW)
      gl.uniform1f(u.uTile, GRAIN_TILE * (w / cssW))
      gl.uniform3fv(u.uSky, skyInks)
      gl.uniform1fv(u.uSkyAt, skyAt)
      gl.uniform1i(u.uSkyCount, stops.length)
      gl.uniform1f(u.uBrush, mode.sky.brush ?? 0)
      gl.uniform1f(u.uGrainStrength, mode.sky.grain ?? 0.4)
      gl.bindVertexArray(emptyVao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const { lines } = mode
    const lineUniforms = (u) => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, grainTex)
      gl.uniform1i(u.uGrain, 0)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, paintTex)
      gl.uniform1i(u.uPaint, 2)
      gl.uniform2f(u.uCanvas, cssW, cssH)
      gl.uniform1f(u.uPixels, w / cssW)
      gl.uniform1f(u.uTile, GRAIN_TILE * (w / cssW))
      gl.uniform1f(u.uPitch, lines.pitch)
      gl.uniform1f(u.uClosest, lines.closest)
      gl.uniform1f(u.uKeep, lines.keep)
      gl.uniform1f(u.uClock, clock)
      gl.uniform2f(u.uBrick, lines.brick[0], lines.brick[1])
      gl.uniform1f(u.uGap, lines.gap)
      gl.uniform1f(u.uBeadCell, lines.beadCell)
      gl.uniform1f(u.uBeadChance, lines.beadChance)
      gl.uniform1f(u.uBeadSize, lines.beadSize)
      gl.uniform1f(u.uBeadFlow, lines.beadFlow)
      gl.uniform1f(u.uGrainStrength, lines.grain)
      gl.uniform4f(u.uWords, words.x, words.y, words.a + lines.veil[0], words.b + lines.veil[1])
      gl.uniform1f(u.uWordsCore, lines.veilCore)
      gl.uniform1f(u.uSink, lines.sink)
      gl.uniform1f(u.uHead, isStill() ? 1 : Math.min(1, (intro * 1000) / lines.introMs))
      gl.uniform1f(u.uDark, dark ? 1 : 0)
      gl.uniform3f(u.uPage, wash[0], wash[1], wash[2])
      gl.uniform3fv(u.uSheenInk, rgb(mode.inks.sheen[dark ? 1 : 0]))
      gl.uniform4fv(u.uStirs, stirData)
      gl.uniform2fv(u.uStirWay, stirWay)
      gl.uniform1f(u.uReach, mode.stir.reach * Math.max(0.8, fit))
      gl.uniform1f(u.uIntro, isStill() ? 99 : intro)
      if (mode.push && u.uPush) {
        gl.uniform2f(u.uPush, pushNow(), cssW * mode.push.at)
      }
    }
    // How far the swaying strokes lean out from the light just now (see `push`): up over a fifth of a second from when
    // the page lit it, held a moment, and back over two; none in a still picture.
    const pushNow = () => {
      const lit = root.hlPushAt
      if (!mode.push || !lit || isStill()) {
        return 0
      }
      const t = (performance.now() - lit) / 1000
      return mode.push.amount * smooth(0, 0.22, t) * (1 - smooth(0.45, 2.4, t))
    }

    /* A sheet's part in the composition's glow: where the glow is on the canvas as the sheet sees it (see glowPlaces),
       breathing slowly larger and smaller, all of it together, so that no seam shows between neighbouring sheets; how much
       of its colour its lines take; the sheet's own long wave; and its beads. */
    const sheetGlow = (u, sheet, row) => {
      const [amount, period] = mode.glow?.breathe || [0, 1]
      const swell = 1 + amount * Math.sin((clock * Math.PI * 2) / period)
      const [cx, cy, hx, hy] = glowPlaces[row] || [0, 0, 1, 1]
      gl.uniform4f(u.uGlow, cx, cy, hx * swell, hy * swell)
      gl.uniform1f(u.uGlowRow, glowRow[row] >= 0 ? (glowRow[row] + 0.5) / paintRows : -1)
      gl.uniform1f(u.uGlowTake, sheet.glowTake ?? 1)
      gl.uniform1f(u.uShimmer, sheet.shimmer ?? 0)
      const wave = sheet.wave || [0, 1, 0, 0]
      gl.uniform4f(u.uWave, wave[0], wave[1], wave[2], wave[3])
      // and how many beads its lines carry, as a share of the recipe's (the Warp hero's sheets each have their own), or
      // [on a light page, on a dark page]
      const beads = Array.isArray(sheet.beads) ? sheet.beads[dark ? 1 : 0] : (sheet.beads ?? 1)
      gl.uniform1f(u.uBeadChance, lines.beadChance * beads)
    }

    /* The composition's sun, and how its sheets that fade come in (see sunFragment and fadeFragment): its light breathes
       along its rim and in its halo, as the glow does. A sheet's own part in them is set with the sheet. */
    const theme = (pair) => (Array.isArray(pair) ? pair[dark ? 1 : 0] : pair)
    const sunUniforms = (u) => {
      const { sun, fade } = mode
      if (sun) {
        const [amount, period] = sun.breathe || [0, 1]
        const swell = 1 + amount * Math.sin((clock * Math.PI * 2) / period)
        gl.uniform4f(u.uSun, sunPlace.x, sunPlace.y, Math.max(1, sunPlace.r), sun.face)
        gl.uniform4f(u.uSunShape, sun.halo, sun.rim, theme(sun.lines[0]), theme(sun.lines[1]))
        gl.uniform2f(u.uSunRise, sunRise[0], sunRise[1])
        gl.uniform3fv(
          u.uSunInks,
          sun.inks.flatMap((name) => rgb(mode.inks[name][dark ? 1 : 0])),
        )
        gl.uniform3f(u.uSunLight, theme(sun.light[0]), theme(sun.light[1]) * swell, theme(sun.light[2]) * swell)
      }
      if (fade) {
        gl.uniform3f(u.uFadeLook, fade.pale ?? 0, fade.sparse ?? 0, fade.specks ?? 0)
      }
    }
    const sheetSun = (u, sheet) => {
      const take = sheet.sun || [0, 0]
      gl.uniform2f(u.uSunTake, take[0], take[1])
      gl.uniform4f(u.uFade, fadeAt[0], Math.max(fadeAt[1], fadeAt[0] + 1), mode.fade?.ease ?? 1, sheet.fade ? 1 : 0)
    }

    /* The land's sheets, in the order given, each with its own look. */
    const drawSheets = (rows) => {
      const u = land.uniforms
      if (mode.sun || mode.fade) {
        sunUniforms(u)
      }
      rows.forEach((row) => {
        const sheet = sheets[row]
        const range = landRanges[row]
        if (!range) {
          return
        }
        gl.uniform1f(u.uRow, (paintRow[row] + 0.5) / paintRows)
        gl.uniform1f(u.uPatch, sheet.patch ?? 0)
        gl.uniform1f(u.uOpaque, sheet.opaque ? 1 : 0)
        gl.uniform1f(u.uLaid, sheet.laid ? 1 : 0)
        gl.uniform1f(u.uUnder, sheet.under)
        gl.uniform1f(u.uFill, sheet.fill)
        gl.uniform1f(u.uSpecks, 0.2)
        gl.uniform1f(u.uFlow, lines.flow * (sheet.flow ?? 1))
        gl.uniform1f(u.uBreath, sheet.breath ?? 0)
        gl.uniform1f(u.uSheen, sheet.sheen ?? 0)
        gl.uniform1f(u.uLean, sheet.lean ?? 0)
        if (mode.glow || mode.waves) {
          sheetGlow(u, sheet, row)
        }
        if (mode.sun || mode.fade) {
          sheetSun(u, sheet)
        }
        gl.drawElements(gl.TRIANGLES, range.count, gl.UNSIGNED_INT, range.offset)
      })
    }

    /* With land in front of what stands in front of the canvas on the page (land.front), that element is cut out of all
       that is drawn behind it, so the page shows it there whole, and then the land in front of it, which is in the land's
       picture already, is drawn again over the hole only, so it hides the element's foot where it rises over it, its
       edge breaking into specks over the element as it does over the land. Everything that grows on that land is drawn
       after this (see the bands). */
    const cutFront = () => {
      if (!cut || !hidden) {
        return
      }
      const sx = w / cssW
      const sy = h / cssH
      const box = [hidden.left * sx, hidden.top * sy, hidden.right * sx, hidden.bottom * sy]
      const x0 = clamp(Math.floor(box[0]) - 1, 0, w)
      const x1 = clamp(Math.ceil(box[2]) + 1, 0, w)
      const y0 = clamp(Math.floor(box[1]) - 1, 0, h)
      const y1 = clamp(Math.ceil(box[3]) + 1, 0, h)
      if (x1 <= x0 || y1 <= y0) {
        return
      }
      gl.enable(gl.SCISSOR_TEST)
      gl.scissor(x0, h - y1, x1 - x0, y1 - y0)
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(cut.program)
      const most = Math.min(box[2] - box[0], box[3] - box[1]) / 2
      const [tl, tr, br, bl] = (hidden.radii || [0, 0, 0, 0]).map((r) => Math.min(r * sx, most))
      gl.uniform4f(cut.uniforms.uBox, box[0], box[1], box[2], box[3])
      gl.uniform4f(cut.uniforms.uRadii, tl, tr, br, bl)
      gl.uniform1f(cut.uniforms.uHeight, h)
      gl.bindVertexArray(emptyVao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      if (land) {
        gl.useProgram(land.program)
        gl.bindVertexArray(landVao)
        drawSheets(frontRows.filter((row) => (sheetHigh[row] ?? Number.POSITIVE_INFINITY) < hidden.bottom + 8))
      }
      gl.disable(gl.SCISSOR_TEST)
    }

    const draw = () => {
      if (!ready || !w) {
        return
      }
      dirty = false
      if (dark !== painted) {
        painted = dark
        paintLand(dark)
      }

      // Pass 1: the land, crisp, on the page's colour or on the composition's own sky, into the land's texture.
      gl.bindFramebuffer(gl.FRAMEBUFFER, landFbo)
      gl.viewport(0, 0, w, h)
      if (sky) {
        paintSky()
      } else {
        gl.clearColor(page[0], page[1], page[2], 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      let u = null
      if (land) {
        gl.useProgram(land.program)
        gl.bindVertexArray(landVao)
        u = land.uniforms
        lineUniforms(u)
        drawSheets(landOrder)
      }

      // The glass and the wings read the land blurred.
      gl.activeTexture(gl.TEXTURE4)
      gl.bindTexture(gl.TEXTURE_2D, landTex)
      gl.generateMipmap(gl.TEXTURE_2D)

      // Pass 2: the scene the butterflies fly over: the land as it is, the clouds of glass, and the grass and the flowers
      // painted on it. With no butterflies it is the picture, and goes straight to the screen.
      gl.bindFramebuffer(gl.FRAMEBUFFER, mode.lensed ? sceneFbo : null)
      gl.viewport(0, 0, w, h)
      gl.disable(gl.BLEND)
      gl.useProgram(copy.program)
      gl.uniform1i(copy.uniforms.uLand, 4)
      gl.bindVertexArray(emptyVao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.enable(gl.BLEND)

      if (clouds) {
        gl.useProgram(clouds.program)
        u = clouds.uniforms
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, grainTex)
        gl.uniform1i(u.uGrain, 0)
        gl.uniform1i(u.uLand, 4)
        gl.uniform2f(u.uCanvas, cssW, cssH)
        gl.uniform1f(u.uPixels, w / cssW)
        gl.uniform1f(u.uTile, GRAIN_TILE * (w / cssW))
        gl.uniform1f(u.uBlur, Math.log2(4 * (w / cssW)))
        gl.uniform1f(u.uDark, dark ? 1 : 0)
        gl.uniform3fv(u.uFrost, dark ? [0.86, 0.9, 0.98] : [1, 1, 1])
        gl.uniform3fv(u.uShade, dark ? [0.62, 0.7, 0.86] : [0.7, 0.78, 0.92])
        gl.uniform4f(u.uWords, words.x, words.y, words.a + lines.veil[0], words.b + lines.veil[1])
        gl.uniform1f(u.uWordsCore, lines.veilCore)
        gl.bindVertexArray(cloudVao)
        const reveal = isStill() ? 1 : smooth(1.4, 2.6, intro)
        if (reveal > 0) {
          mode.clouds.forEach((cloud, index) => {
            const [across, along] = cloud.at
            const sky = skyTop(across)
            const hill = hillTop(across)
            const size = Math.min(cloud.size * fit, ((hill - sky) * landRoom) / 1.7) * (0.85 + 0.15 * reveal)
            const drift = isStill() ? 0 : Math.sin(clock * 0.05 + index * 2.1) * 24
            const [cx, placed] = toScreen(across, sky + (hill - sky) * along)
            // It sinks a little where its top would rise out of the sky, but never so far that its foot meets the hill.
            const rise = Math.max(...cloud.puffs.map(([, py, pr]) => pr - py)) * size
            const foot = Math.max(...cloud.puffs.map(([, py, pr]) => py + pr * 0.35)) * size
            const highest = landBase + sky * landRoom + mode.cloudTuck + rise
            const lowest = landBase + hill * landRoom - foot
            const cy = Math.min(Math.max(placed, highest), lowest)
            const puffs = new Float32Array(32)
            let [x0, y0, x1, y1] = [
              Number.POSITIVE_INFINITY,
              Number.POSITIVE_INFINITY,
              Number.NEGATIVE_INFINITY,
              Number.NEGATIVE_INFINITY,
            ]
            cloud.puffs.forEach(([px, py, pr], i) => {
              const x = cx + drift + px * size
              const y = cy + py * size
              const r = pr * size
              puffs.set([x, y, r, 0], i * 4)
              x0 = Math.min(x0, x - r)
              x1 = Math.max(x1, x + r)
              y0 = Math.min(y0, y - r)
              y1 = Math.max(y1, y + r)
            })
            gl.uniform4f(u.uBox, x0 - 3, y0 - 3, x1 + 3, y1 + 3)
            gl.uniform4fv(u.uPuffs, puffs)
            gl.uniform1i(u.uCount, cloud.puffs.length)
            gl.uniform1f(u.uSize, size)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
          })
        }
      }

      // The grass and the flowers, from the farthest band to the nearest: each band's grass, then its flowers.
      gl.useProgram(blades.program)
      lineUniforms(blades.uniforms)
      gl.uniform3fv(
        blades.uniforms.uInks,
        mode.grass.inks.flatMap((name) => rgb(mode.inks[name][dark ? 1 : 0])),
      )
      gl.uniform1f(blades.uniforms.uGrainStrength, 0.6)
      gl.useProgram(blooms.program)
      lineUniforms(blooms.uniforms)
      gl.uniform3fv(blooms.uniforms.uPaints, paints[dark ? 1 : 0])
      gl.uniform1i(blooms.uniforms.uLand, 4)
      if (mode.marks) {
        gl.uniform2f(blooms.uniforms.uMist, mistBand[0], mistBand[1])
      }
      for (let band = 0; band < BANDS; band += 1) {
        if (band === cutBand) {
          cutFront()
        }
        gl.useProgram(blades.program)
        drawRun(bladeVao, bands[band * 4], bands[band * 4 + 1])
        gl.useProgram(blooms.program)
        drawRun(bloomVao, bands[band * 4 + 2], bands[band * 4 + 3])
      }

      // The first picture of a root painted ahead of being seen is what lets it fade in.
      if (!eager && !announced) {
        announced = true
        root.dataset.hlReady = 'true'
        root.dataset.hlShown = 'true'
      }
      if (!mode.lensed) {
        return
      }

      // The butterflies, from the small to the large; those that come to the pointer from the far side of their rings
      // to the near, so that one going round in front of the pointer is over one going round behind it.
      const drawn = orbiting ? [...flock].sort((p, q) => q.depth - p.depth) : flock
      drawn.forEach((b, i) => {
        const ch = Math.cos(b.heading)
        const sh = Math.sin(b.heading)
        const cp = Math.cos(b.pitch)
        const sp = Math.sin(b.pitch)
        const fx = ch * cp
        const fy = sh * cp
        const fz = sp
        const len = Math.hypot(fx, fy) || 1
        const s0x = -fy / len
        const s0y = fx / len
        const u0x = -fz * s0y
        const u0y = fz * s0x
        const u0z = fx * s0y - fy * s0x
        const cr = Math.cos(b.roll)
        const sr = Math.sin(b.roll)
        const o = i * FLOATS
        flyData.fill(0, o, o + FLOATS)
        flyData.set(
          [
            b.screenX,
            b.screenY,
            3.4,
            b.size,
            fx,
            fy,
            fz,
            s0x * cr - u0x * sr,
            s0y * cr - u0y * sr,
            -u0z * sr,
            b.flap,
            b.hind,
            b.lag,
            b.lag * 1.2,
            b.pastel,
            b.family,
            b.seed,
            1,
            b.show,
          ],
          o,
        )
      })
      // Pass 3: the butterflies, on nothing at all.
      gl.bindFramebuffer(gl.FRAMEBUFFER, flockFbo)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(fly.program)
      gl.bindVertexArray(flyVao)
      gl.bindBuffer(gl.ARRAY_BUFFER, flyBuffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, flyData)
      u = fly.uniforms
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, grainTex)
      gl.uniform1i(u.uGrain, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, shapesTex)
      gl.uniform1i(u.uShapes, 1)
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, inksTex)
      gl.uniform1i(u.uInks, 3)
      gl.uniform1i(u.uLand, 4)
      gl.uniform3f(u.uLandLook, 1 / w, 1 / h, Math.log2(5 * (w / cssW)))
      gl.uniform1f(u.uPixels, w / cssW)
      gl.uniform1f(u.uDark, dark ? 1 : 0)
      gl.uniform2f(u.uCanvas, cssW, cssH)
      gl.uniform4f(u.uLight, -0.32, 0.5, 0.8, 0)
      gl.uniform2f(u.uForeRange, FORE_RANGE[0], FORE_RANGE[1])
      gl.uniform2f(u.uHindRange, HIND_RANGE[0], HIND_RANGE[1])
      gl.uniform1f(u.uShapeRows, shapeRows)
      gl.uniform1f(u.uTile, GRAIN_TILE * (w / cssW))
      gl.uniform1f(u.uClock, clock)
      gl.uniform1f(u.uFan, WING.fan)
      gl.uniform1f(u.uPitch, WING.pitch)
      gl.uniform1f(u.uClosest, WING.closest)
      gl.uniform1f(u.uKeep, WING.keep)
      gl.uniform1f(u.uFill, WING.fill)
      gl.uniform2f(u.uBrick, WING.brick[0], WING.brick[1])
      gl.uniform1f(u.uGap, WING.gap)
      gl.uniform1f(u.uFlow, WING.flow)
      gl.uniform1f(u.uBeadCell, WING.beadCell)
      gl.uniform1f(u.uBeadChance, WING.beadChance)
      gl.uniform1f(u.uBeadSize, WING.beadSize)
      gl.uniform1f(u.uBlotch, WING.blotch)
      gl.uniform1f(u.uGrainStrength, WING.grain)
      gl.uniform4fv(u.uCells, CELLS)
      gl.drawArraysInstanced(gl.TRIANGLES, 0, meshCount, flock.length)

      // Pass 4: the butterflies through the lens, over the scene, onto the screen.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.activeTexture(gl.TEXTURE5)
      gl.bindTexture(gl.TEXTURE_2D, flockTex)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.activeTexture(gl.TEXTURE6)
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.viewport(0, 0, w, h)
      gl.disable(gl.BLEND)
      gl.useProgram(lens.program)
      gl.bindVertexArray(emptyVao)
      const ul = lens.uniforms
      const px = w / cssW
      gl.uniform1i(ul.uFlock, 5)
      gl.uniform1i(ul.uLand, 6)
      gl.uniform2f(ul.uRes, w, h)
      gl.uniform2f(ul.uCentre, w / 2, h / 2)
      gl.uniform2f(ul.uHalf, w / 2, h / 2)
      gl.uniform2f(ul.uBand, glass.bandX * px, glass.bandY * px)
      gl.uniform1f(ul.uIn, optics.in)
      gl.uniform1f(ul.uBend, optics.bend)
      gl.uniform1f(ul.uSplit, optics.split)
      gl.uniform1f(ul.uAlong, optics.along * h)
      gl.uniform1f(ul.uSoften, optics.soften + Math.log2(px))
      gl.uniform1f(ul.uRound, optics.round)
      gl.uniform2f(ul.uHalo, optics.halo[0] + Math.log2(px), optics.halo[1])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    }

    /* ---- the loop ---- */
    /* The root's frames come from the conductor, which gives each frame to one meadow only. It asks for every frame while
       it is live on the screen (`running`), or for one, to be painted ahead of being seen or as a still picture
       (`pending`, which goes first). */
    let last = null
    let running = false
    let pending = false
    let inView = eager
    let near = eager
    // How much of the canvas is on the screen, in square CSS pixels.
    let area = 0
    let settled = false
    let alive = true
    let slowFrames = 0
    let announced = false
    // Whether frames went to other meadows since this one's last, which says nothing about the GPU.
    let rested = false
    // A frame held up by the page's own work, a resize or the meadow being laid out, says nothing about the GPU, so no
    // slow frame is counted until a moment after it.
    let quietUntil = 0
    const hush = () => {
      quietUntil = performance.now() + 500
      slowFrames = 0
    }
    // whether the picture last drawn in a frame was blank (see `crossing`)
    let blank = false

    const frame = (now) => {
      if (!ready || root.hlHold) {
        return
      }
      const still = isStill()
      const gap = last === null ? 16 : now - last
      const dt = Math.min(gap / 1000, 0.05)
      last = now
      if (still) {
        // The still picture shows everything in, the wind at rest, and the butterflies spread out.
        intro = 99
        clock = Math.max(clock, mode.stillAt)
        advance(0)
      } else {
        advance(dt)
        // Too heavy for this machine: one pixel for each CSS pixel. It takes slow frames in a run to say so, and a pause of
        // a tenth of a second or more is the page doing something else, as are the frames just after a resize or a
        // layout of the meadow (see hush).
        if (gap < 100 && now > quietUntil && !rested) {
          slowFrames = gap > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 0.25)
          if (slowFrames > 40 && (typeof dprCap === 'function' || dprCap > 1)) {
            slowFrames = 0
            dprCap = 1
            measure()
          }
        }
      }
      // A band that is only crossed now and then (`crossing`) has nothing to draw between the crossings: once a blank
      // picture is on its canvas it is left there, its clock running on all the while, so that where the butterflies
      // are, and when the next crossing comes, are just as they would have been.
      const empty = !!mode.crossing && !still && !flock.some((b) => b.show > 0)
      if (!empty || !blank || dirty) {
        draw()
      }
      blank = empty
      pending = false
      rested = false
      if (still) {
        settled = true
        stop()
      } else if (!inView) {
        // a live meadow off the screen was only being painted ahead of being seen
        stop()
      }
    }

    const scene = {
      frame,
      skip: () => {
        rested = true
      },
      area: () => area,
      pending: () => pending,
      held: () => !ready || !!root.hlHold,
    }
    const ask = () => {
      if (!running) {
        last = null
        running = true
        conductor.want(scene)
      }
    }
    const paintSoon = () => {
      pending = true
      ask()
    }
    const stop = () => {
      running = false
      pending = false
      conductor.drop(scene)
    }

    const sync = () => {
      if (!alive) {
        return
      }
      if (inView && !document.hidden && ready && !settled && (eager || grownFor.key)) {
        if (isStill() || (!eager && dirty)) {
          paintSoon()
        } else {
          ask()
        }
        return
      }
      if (running && !pending) {
        stop()
      }
      // Off the screen, a root is drawn again only while it is near it: one far away is drawn when it comes near.
      if (dirty && near) {
        if (eager) {
          draw()
        } else if (ready && grownFor.key && !document.hidden) {
          paintSoon()
        }
      }
    }

    yield
    if (gone()) {
      return null
    }
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting
          area = entry.intersectionRect.width * entry.intersectionRect.height
        })
        // a tree scrolled away has no pointer on it
        if (!inView) {
          onLeave()
        }
        sync()
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    seen.observe(canvas)
    // A root is told when it comes near: one painted ahead of being seen paints then, and one that draws whenever it has
    // to, as the hero does, draws only while within a screen of view, so a window resized far below it does not draw it.
    const nearby = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          near = entry.isIntersecting
        })
        sync()
      },
      { rootMargin: mode.near || '100% 0px' },
    )
    nearby.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    let lastResize = 0
    const resized = new ResizeObserver(() => {
      const before = landKey
      const wasDirty = dirty
      const cleared = measure()
      buildLand()
      // A root painted ahead of being seen whose canvas and land are as they were has nothing to do, as when it first
      // starts to watch its size.
      if (!eager && !cleared && landKey === before) {
        dirty = wasDirty
        return
      }
      hush()
      // A stage with no meadow yet, which happens when the hero was bound while hidden, gets one in a task of its own.
      // Otherwise the meadow is moved with the land until the stage is still, unless the stage has jumped by more than a
      // tenth since the meadow was laid out, when moving it would show. While a window is being dragged a larger change
      // is let through, so a long drag does not stop to lay the meadow out every few frames.
      const now = performance.now()
      const jumped = now - lastResize > 120
      lastResize = now
      if (!grownFor.key) {
        if (landKey && !meadowTimer) {
          meadowAfter(0)
        }
      } else if (grownFor.key !== landKey) {
        const wider = cssW / grownFor.w
        const taller = landRoom / grownFor.room
        const flat = (cssW < 677 && grownFor.w < 677) || (cssW > 1417 && grownFor.w > 1417)
        let most = flat ? 1.2 : 1.15
        if (jumped) {
          most = 1.1
        }
        if (Math.max(wider, 1 / wider, taller, 1 / taller) > most) {
          meadowNow()
        } else {
          moveMeadow()
          meadowAfter(150)
        }
      }
      // Resizing clears the canvas, and this runs after the frame, so the picture is drawn again here, but only for a root
      // that is near the screen: at once for one that draws whenever it has to, and for any other only if its canvas was
      // cleared; otherwise in the next frame the conductor gives it, or once it comes near.
      if (near && (eager || cleared)) {
        advance(0)
        draw()
      } else {
        dirty = true
      }
      // the still picture of a root painted once is done if it was drawn here; anything else carries on
      settled = !eager && !dirty && isStill()
      sync()
    })
    const watchSize = () => {
      try {
        resized.observe(canvas, { box: 'device-pixel-content-box' })
      } catch {
        resized.observe(canvas)
      }
      if (copyBox) {
        resized.observe(copyBox)
      }
      // what stands in front of the canvas, whose box and content the land in front of it is fitted to (fonts coming in,
      // a page's content changing it), measured again here and never in a frame
      const front = frontRows.length && mode.behind ? document.querySelector(mode.behind) : null
      if (front) {
        resized.observe(front)
      }
    }
    if (eager) {
      watchSize()
      measure()
      buildLand()
      // The first meadow is laid out in a task of its own, so that it does not hold up the first frame along with all
      // of the rest of this. None of it shows before the opening has run for more than half a second.
      meadowAfter(0)
    }

    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    const retheme = () => {
      if (!canvas.isConnected) {
        teardown()
        return
      }
      const before = page.join()
      readPage()
      if (page.join() !== before) {
        dirty = true
        settled = false
        sync()
      }
    }
    const themed = new MutationObserver(retheme)
    for (const target of [document.documentElement, document.body]) {
      themed.observe(target, { attributes: true, attributeFilter: ['class'] })
    }
    scheme.addEventListener('change', retheme)

    const motion = () => {
      dirty = true
      settled = false
      sync()
    }
    PREFERS_REDUCED.addEventListener('change', motion)

    const lost = (event) => {
      if (!alive) {
        return
      }
      event.preventDefault()
      const shown = root.dataset.hlShown === 'true'
      teardown()
      const now = performance.now()
      const lostAt = losses.get(root) || []
      losses.set(root, lostAt)
      lostAt.push(now)
      while (lostAt.length && now - lostAt[0] > 60000) {
        lostAt.shift()
      }
      if (lostAt.length < 3) {
        resumes.add(root)
        requestAnimationFrame(run)
      } else {
        root.dataset.hlHeroBound = 'true'
        if (!shown) {
          root.dataset.hlFallback = 'true'
        }
      }
    }
    canvas.addEventListener('webglcontextlost', lost)

    const teardown = () => {
      if (!alive) {
        return
      }
      alive = false
      stop()
      clearTimeout(meadowTimer)
      seen.disconnect()
      nearby.disconnect()
      resized.disconnect()
      themed.disconnect()
      scheme.removeEventListener('change', retheme)
      PREFERS_REDUCED.removeEventListener('change', motion)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPress)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointermove', onOrbitMove)
      window.removeEventListener('pointerdown', onOrbitDown)
      window.removeEventListener('pointerup', onOrbitUp)
      window.removeEventListener('pointercancel', onOrbitCancel)
      document.documentElement.removeEventListener('pointerleave', onOrbitLeave)
      canvas.removeEventListener('webglcontextlost', lost)
      ready = false
      contexts.delete(gl)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      heroes.delete(release)
      canvas.replaceWith(canvas.cloneNode(false))
      delete root.dataset.hlHeroBound
      delete root.dataset.hlReady
    }
    const release = () => {
      if (!canvas.isConnected) {
        teardown()
      }
    }
    heroes.add(release)

    // A hook for captures and tests: run the meadow forward to a moment, with the opening finished and the meadow laid
    // out for the stage as it is, and optionally send the unseen passer through at a place across, from -1 to 1. It says
    // whether the root was ready to draw (its shaders compiled); a capture of a root that is not tries again.
    // where the first of the flock is across the canvas, in CSS pixels, for a page that times things to their passing
    // (see `crossing`); none showing is none at all
    root.hlLead = () => {
      let lead = Number.NEGATIVE_INFINITY
      for (const b of flock) {
        if (b.show > 0) {
          lead = Math.max(lead, b.screenX)
        }
      }
      return lead
    }
    root.hlSeek = (seconds, passAt) => {
      if (meadowTimer) {
        meadowNow()
      }
      if (building && ready) {
        let step = building.next()
        while (!step.done) {
          step = building.next()
        }
      }
      intro = 99
      clock = seconds
      if (passAt !== undefined) {
        const walk = mode.passer || PASSER
        clock = walk.first + ((passAt + 1.15) / 2.3) * walk.across
      }
      advance(0)
      dirty = true
      settled = false
      draw()
      blank = false
      sync()
      return { passer: { ...passer }, stirs: stirs.length, ready }
    }
    // And for a flock that perches, whose butterflies go about their own business: run the meadow on by `seconds` in
    // steps of a sixtieth, from the opening if asked, and draw where it has got to.
    if (perching) {
      root.hlRun = (seconds, restart = false) => {
        if (meadowTimer) {
          meadowNow()
        }
        if (building && ready) {
          let step = building.next()
          while (!step.done) {
            step = building.next()
          }
        }
        if (restart) {
          clock = 0
          intro = mode.intro === false ? 99 : 0
          flockPlaced = false
          overTree = false
          leftTree = -1e9
          nextBack = 0
        }
        for (let left = seconds; left > 1e-6; left -= 1 / 60) {
          advance(Math.min(1 / 60, left))
        }
        dirty = true
        settled = false
        draw()
        return {
          ready,
          clock,
          flock: flock.map((b) => b.state),
          perches: perches.length,
          crown: [nowX(crownBox.x), nowY(crownBox.y), crownBox.a, crownBox.b],
          page: [pageLeft, pageTop],
        }
      }
    }

    // And for a flock that comes to the pointer: where the place is, where the rings go round and where each butterfly
    // is; and the meadow run on by `seconds` in steps of a sixtieth, from the start if asked, and drawn where it has got to.
    if (orbiting) {
      root.hlOrbit = () => ({
        zone: zoneNow(),
        aim: { ...aim },
        on: call.on,
        hover: call.hover,
        page: [pageLeft, pageTop],
        words: { ...words },
        flock: flock.map((b) => ({
          state: b.state,
          x: b.screenX,
          y: b.screenY,
          px: b.x,
          py: b.y,
          size: b.size,
          show: b.show,
          depth: b.depth,
        })),
      })
      root.hlRun = (seconds, restart = false) => {
        if (meadowTimer) {
          meadowNow()
        }
        if (building && ready) {
          let step = building.next()
          while (!step.done) {
            step = building.next()
          }
        }
        if (restart) {
          clock = 0
          intro = mode.intro === false ? 99 : 0
          Object.assign(call, { hover: false, since: 0, left: -1e9, until: -1e9, on: false, down: null })
          for (const b of flock) {
            b.state = 'away'
            b.show = 0
          }
        }
        for (let left = seconds; left > 1e-6; left -= 1 / 60) {
          advance(Math.min(1 / 60, left))
        }
        dirty = true
        settled = false
        draw()
        return { ready, clock, flock: flock.map((b) => b.state), orbit: root.hlOrbit() }
      }
    }

    Promise.all(programs.map((built) => finishProgram(gl, built)).concat(buildGrain()))
      .then(() => {
        if (!alive) {
          return
        }
        ready = true
        // The first picture has the meadow in it, even if its own task has not run yet, and the first frames, which
        // draw everything for the first time, are not counted against the GPU either.
        if (meadowTimer) {
          meadowNow()
        }
        hush()
        advance(0)
        dirty = true
        // A root painted ahead of being seen draws its first picture when the conductor next gives it a frame.
        if (eager) {
          draw()
          root.dataset.hlReady = 'true'
          root.dataset.hlShown = 'true'
        }
        sync()
      })
      .catch((error) => {
        // A hero let go of while it was still getting ready has nothing left to say, and nor does one whose context was
        // taken from it: the event that says so is on its way, and it binds again.
        if (alive && !gl.isContextLost()) {
          console.warn('[headless-hero]', error)
          root.dataset.hlFallback = 'true'
        }
      })

    if (eager) {
      return null
    }
    /* The rest of a root the builder builds: it waits for its shaders, so that it has done with the GPU before the next
       root asks it for a context; then lays out its stage and its land, and then its meadow a column at a time; and
       only then watches its size and asks for its first picture. */
    building = (function* () {
      const parallel = gl.getExtension('KHR_parallel_shader_compile')
      while (
        alive &&
        parallel &&
        !programs.every((built) => gl.getProgramParameter(built.program, parallel.COMPLETION_STATUS_KHR))
      ) {
        yield LATER
      }
      if (!alive) {
        return
      }
      // its stage, its land and its meadow, a step at a time, its data handed to the GPU a part at a time
      for (const part of [measureSteps(), landSteps(true), growSteps(true)]) {
        for (let step = part.next(); !step.done; step = part.next()) {
          yield step.value
          if (!alive) {
            return
          }
        }
      }
      grown()
      building = null
      watchSize()
      sync()
    })()
    return building
  }

  /** Each bound root's release(), which lets the root go once it has left the page. */
  const heroes = new Set()
  /** When the browser took each root's context, over the last minute: a root gives up only if it keeps happening. */
  const losses = new WeakMap()
  /** The roots binding again after a lost context, which start from the finished picture. */
  const resumes = new WeakSet()
  /** The contexts the meadows hold. */
  const contexts = new Set()
  /**
   * Asking the browser for a context makes the page wait for as long as the GPU process is busy, and it is busy when the
   * page has just been scrolled a long way (it is drawing all of the page that has come into view) or another script is
   * starting up on the GPU: a context that takes 3 milliseconds can then take 30. That cannot be seen from the page. So
   * two frames are let go by first, which puts whatever the page has just asked of the GPU ahead of what comes next;
   * then a fence is set in a context the meadows already hold, and a root built by the builder asks for its own context
   * once the fence has passed (looking does not wait), or after half a second, whatever happens.
   */
  const gpuCalm = function* () {
    const gl = [...contexts].find((held) => !held.isContextLost())
    if (!gl) {
      return
    }
    const from = performance.now()
    const waited = () => gl.isContextLost() || performance.now() - from > 500
    let frames = 0
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        frames = 2
      }),
    )
    while (frames < 2 && !waited()) {
      yield LATER
    }
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
    if (!fence) {
      return
    }
    gl.flush()
    while (!waited() && gl.getSyncParameter(fence, gl.SYNC_STATUS) !== gl.SIGNALED) {
      yield LATER
    }
    gl.deleteSync(fence)
  }

  /**
   * The conductor: the page's one loop for every meadow on it. Each frame goes to one meadow only, so that however many
   * are on the page the main thread's work for a frame is never more than one's: first any that asked for a single
   * picture (to be painted ahead of being seen, as a still picture, or after a change), one a frame; otherwise the live
   * ones take turns. A meadow keeps the picture it last drew until its turn comes, and its clock runs on in real time.
   */
  const conductor = (() => {
    const scenes = new Set()
    let raf = 0
    let served = null
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // the first that asked for a single picture, or else the next live one after the one served last
      let lead = null
      let next = null
      let first = null
      let passed = !scenes.has(served)
      for (const scene of scenes) {
        if (!scene.held()) {
          if (scene.pending()) {
            lead = scene
            break
          }
          if (passed && !next) {
            next = scene
          }
          first = first || scene
        }
        if (scene === served) {
          passed = true
        }
      }
      lead = lead || next || first
      served = lead
      for (const scene of scenes) {
        if (scene !== lead) {
          scene.skip()
        }
      }
      lead?.frame(now)
    }
    return {
      want: (scene) => {
        scenes.add(scene)
        if (!raf) {
          raf = requestAnimationFrame(tick)
        }
      },
      drop: (scene) => {
        scenes.delete(scene)
        if (!scenes.size && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
    }
  })()

  /**
   * The builder: a root that is not the hero is built in the page's idle time, one root at a time and a few
   * milliseconds at a go, so that building it never holds up a frame: its context, its shaders (which it waits for, so
   * that no two roots compile at once, which is when asking the browser for a context takes longest), its stage and its
   * land, and its meadow, a column of the drifts' grid at a time. A job's steps are a generator: each `yield` is a place
   * where it can stop, a yielded COST says that the next step cannot be split and about how long it takes, and LATER asks
   * for the next idle time while it waits on the GPU. A step that cannot be split starts only at the start of an idle
   * time with at least that long left, so it never runs into the next frame; anything else goes on while the slice has
   * time. An urgent job, one whose root has come near the screen, goes ahead of any other and waits for none of that: it
   * goes on in short tasks of its own, one step that cannot be split to a task, until it is done.
   */
  const LATER = 'later'
  /* What each step that cannot be split costs, in milliseconds, at least: each is measured as it runs and the time kept
     goes up with what it takes (and back down to this as it takes less). `plant` is a composition's own planting, `grid`
     the stamping of its drifts into the grid the flowers are laid out from, `canvas` sizing the canvas, `mipmap` making
     the levels of the land's texture, and `style` reading the page's colour, which asks the page for its style. */
  const COST = {
    context: { least: 6, ms: 6 },
    program: { least: 1, ms: 1 },
    texture: { least: 1.5, ms: 1.5 },
    upload: { least: 1.5, ms: 1.5 },
    sort: { least: 2.5, ms: 2.5 },
    plant: { least: 3, ms: 3 },
    grid: { least: 3, ms: 3 },
    canvas: { least: 1.5, ms: 1.5 },
    mipmap: { least: 1.5, ms: 1.5 },
    style: { least: 1.5, ms: 1.5 },
  }
  const builder = (() => {
    // the most a slice goes on for, in milliseconds, unless it is one step that cannot be split and has the time
    const STEP = 4
    const jobs = []
    let cancel = null
    const idle = window.requestIdleCallback
      ? (fn) => {
          const id = window.requestIdleCallback(fn)
          return () => window.cancelIdleCallback(id)
        }
      : // Where there is no idle callback, the time after a frame is drawn, up to where the next would start at 120 Hz.
        (fn) => {
          let id = 0
          const frame = requestAnimationFrame((at) => {
            id = setTimeout(
              () => fn({ didTimeout: false, timeRemaining: () => Math.max(0, at + 8 - performance.now()) }),
              0,
            )
          })
          return () => {
            cancelAnimationFrame(frame)
            clearTimeout(id)
          }
        }
    const soon = (fn, ms = 0) => {
      const id = setTimeout(fn, ms)
      return () => clearTimeout(id)
    }
    // whether the job in hand is waiting on the GPU
    let waiting = false
    const slice = (deadline) => {
      cancel = null
      if (!jobs.length) {
        return
      }
      // An urgent job goes first, between any other's steps: each job's state is its own, so one left part way picks up
      // where it was.
      const at = jobs.findIndex((job) => job.urgent)
      if (at > 0) {
        jobs.unshift(jobs.splice(at, 1)[0])
      }
      const job = jobs[0]
      const from = performance.now()
      // what this slice has: a task of its own if the job is urgent, else what is left of the idle time
      const idleLeft = deadline && !deadline.didTimeout ? deadline.timeRemaining() : 0
      const left = job.urgent ? STEP : idleLeft
      for (let first = true; ; first = false) {
        const now = performance.now()
        const room = first ? left : Math.min(STEP, left) - (now - from)
        const cost = job.next
        // A step that does not fit waits for the next slice, unless it is an urgent job's first in its task.
        if (!(first && job.urgent) && ((cost && cost.ms > room) || room <= 0)) {
          break
        }
        const step = job.steps.next()
        if (cost) {
          const took = performance.now() - now
          cost.ms = Math.max(cost.least, (cost.ms + took) / 2)
        }
        if (step.done) {
          // the next job starts in a slice of its own
          jobs.shift()
          break
        }
        job.next = step.value?.least ? step.value : null
        if (step.value === LATER) {
          waiting = true
          break
        }
      }
      schedule()
    }
    const schedule = () => {
      if (!cancel && jobs.length) {
        cancel = jobs.some((job) => job.urgent) ? soon(slice, waiting ? 8 : 0) : idle(slice)
        waiting = false
      }
    }
    return {
      add: (job) => {
        jobs.push(job)
        schedule()
      },
      // a job has turned urgent: it goes on in tasks of its own from now, not in the next idle time
      hurry: () => {
        cancel?.()
        cancel = null
        schedule()
      },
    }
  })()

  /* --- the footer's meadow ------------------------------------------------------------------------- */

  /* The site's footer is outside a page's content: a grey card, and under it a band of its own, which holds the footer
     planets on other pages. A page asks for a meadow round it with a marker in its content,
     <div data-hl-footer-meadow hidden></div>, and with the rules that go with it in its own style, so they go when it goes:
     the band positioned and letting the meadow reach up out of it, and the root (.hl-footer-meadow) laid in it, fading in
     once drawn. The root comes after the card in the page, so it is painted over it, and lets the pointer through to it;
     its picture has the card cut out of everything behind the card, and only the land in front of the card's foot is
     drawn over it (see cutFront). While the marker is on the page a root of the footer's composition is made at the start
     of the band, and when the page goes, so does the root. The root fills the band and reaches up over the card's lower
     part, as far as the composition's `cover` says for as much of the band as shows beside the card and for how tall the
     card is. It is made only once the page's rules apply (the band no longer clips what rises out of it): before they do,
     as while the page is still loading, the root would be laid out somewhere else entirely, and measured, built and
     painted there. */
  let footer = null
  const footerMeadow = () => {
    const band = document.querySelector('[data-hl-footer-meadow]') ? document.querySelector('.docs-footer-band') : null
    if (footer && footer.band === band && footer.root.isConnected) {
      return
    }
    if (footer) {
      footer.fit.disconnect()
      footer.root.remove()
      footer = null
    }
    const card = band && document.querySelector(MODES.footer.behind)
    if (!card) {
      return
    }
    const banded = getComputedStyle(band)
    if (banded.position === 'static' || banded.overflowY !== 'visible') {
      // not yet: the page's style is not in, or the site's; looked at again when the page next changes or has loaded
      if (document.readyState !== 'complete') {
        window.addEventListener('load', run, { once: true })
      }
      return
    }
    const root = document.createElement('div')
    root.className = 'hl-footer-meadow'
    root.setAttribute('aria-hidden', 'true')
    root.dataset.hlHero = ''
    root.dataset.hlMode = 'footer'
    const canvas = document.createElement('canvas')
    canvas.dataset.hlCanvas = ''
    root.append(canvas)
    // How far up behind the card it reaches, for how much of the band shows beside the card.
    const reach = () => {
      const box = band.getBoundingClientRect()
      const front = document.querySelector(MODES.footer.behind)?.getBoundingClientRect()
      const margin = front ? Math.max(0, Math.min(front.left - box.left, box.right - front.right)) : 0
      root.style.top = `${-MODES.footer.cover({ width: box.width, margin, tall: front ? front.height : 0 })}px`
    }
    const fit = new ResizeObserver(reach)
    band.prepend(root)
    reach()
    fit.observe(band)
    fit.observe(card)
    footer = { root, band, fit }
  }

  const run = () => {
    heroes.forEach((release) => release())
    footerMeadow()
    document.querySelectorAll('[data-hl-hero]').forEach(init)
  }

  const observe = () => {
    const target = document.documentElement || document.body
    if (!target) {
      requestAnimationFrame(observe)
      return
    }
    new MutationObserver(run).observe(target, { childList: true, subtree: true })
    run()
  }

  observe()
})()
