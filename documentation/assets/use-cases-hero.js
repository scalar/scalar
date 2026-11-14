/**
 * The use cases pages' heroes, a plugin of headless-hero.js: the forest on /use-cases and the painting on each
 * industry's page. Only those pages load it, so the engine, which every page loads for the footer's meadow, does not
 * carry them. It hands the engine a function in its queue of plugins (see the engine's plugins), and the engine calls
 * it with the kit, the parts of the engine these compositions are made of, whether this runs before or after it. The
 * kit is worked out for this file as the two are built, so they ship together.
 */
;(() => {
  // The docs run a route's scripts again on every visit; the compositions only need handing over once.
  if (window.__scalarUseCasesHero) {
    return
  }
  window.__scalarUseCasesHero = true

  ;(window.__scalarHeroModes = window.__scalarHeroModes || []).push((kit) => {
    // An engine from another build may lack a part: stopping here, where the engine catches it, leaves the stage to
    // close up as for any composition that never comes, rather than failing partway through a picture.
    const lacking = [
      'clamp',
      'FLOWERS',
      'FOOTER',
      'hashed',
      'HERO',
      'LAND_FOOT',
      'LAND_INK',
      'LENS',
      'LINES',
      'PAINTS',
      'PALETTES',
      'rippleDab',
      'SK_INKS',
      'SK_SCALE',
      'SKY',
      'smooth',
      'STIR',
    ].filter((name) => !(name in kit))
    if (lacking.length) {
      throw new Error(`use-cases-hero.js needs ${lacking.join(', ')} from headless-hero.js: the two ship together`)
    }
    const {
      clamp,
      FLOWERS,
      FOOTER,
      hashed,
      HERO,
      LAND_FOOT,
      LAND_INK,
      LENS,
      LINES,
      PAINTS,
      PALETTES,
      rippleDab,
      SK_INKS,
      SK_SCALE,
      SKY,
      smooth,
      STIR,
    } = kit

    /* --- the forest composition ----------------------------------------------------------------------------- */

    /* The hero of the use cases page (/use-cases), after Cameron's picture (a forest seen from above, in gouache): under
       the calls to action, the crowns of a forest heaped row behind row up into the mist, every green from yellow lime in
       the sun to deep teal in the shade, each crown a cauliflower of clumps with ragged, sponged edges, lit along their
       tops and stippled with light, dark branches forking up through gaps in the lit ones; the far crowns small and going
       into the mist, the near ones few and large; a tall dark pine on the right, its needles in ragged pads on drooping
       boughs under a rounded head; and white egrets flying through over the mist, far, middle and near, coming in and
       going out through the glass at the sides as the sky's birds do on /products. */
    const FO_EVEN = 0.005
    const FO_HAZE = 0.4 + FO_EVEN
    /* Marks in the hundredths of a kind (see `marks`): a leaf marked as mist thins into the grain's specks upward across
       the mist's band (garden.mist), so the far crowns go into the mist. A leaf is paint with no bristles, whose soft edge
       breaks into the grain's specks as dry gouache does. */
    const FO_LEAF = 0.25
    const FO_LEAF_MIST = 0.25 + 0.0025
    // the night's stars: lights (see TWINKLE), a heart that comes and goes and a soft glow round it that does so a little
    const FO_TWINKLE = 3.25 + FO_EVEN
    const FO_GLIMMER = 3.4 + FO_EVEN
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const foHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    // a colour's channels and back, a mix of two, and the same green at night under a moon: deeper, cooler, bluer
    const foRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    const foHex = (rgb) =>
      `#${rgb
        .map((v) =>
          Math.round(Math.min(255, Math.max(0, v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`
    const foMix = (a, b, t) => foHex(foRgb(a).map((v, i) => v + (foRgb(b)[i] - v) * t))
    const foNight = (hex) =>
      foHex(foRgb(hex).map((v, i) => 255 * (v / 255) ** 1.35 * [0.42, 0.52, 0.58][i] + [6, 12, 16][i]))
    // The mist's inks, light and dark: a pale mint where its lines come in under the buttons, deepening to the
    // reference's mint, so that the white egrets show against it. The greens below the top are close in value, so that
    // its lines, each a little nearer one or the other, never stripe the open mist.
    const FO_INKS = {
      ...LAND_INK,
      foTop: ['#d3e8da', '#131917'],
      foHigh: ['#9acfb0', '#18292a'],
      foMid: ['#86c6a2', '#1c3532'],
      foLow: ['#7abe98', '#1e3a35'],
      foFoot: ['#6cb38c', '#1a3530'],
    }
    /* How large the forest's strokes are drawn on a canvas this wide; past a laptop's they grow only slowly, and only
       on a canvas much wider than that, so that a wide screen's forest is still a few rows of large crowns rather than
       a hedge along the foot. */
    const FO_SCALE = (w) => Math.max(0.5, Math.min(w / 1232, 1.15 + Math.max(0, w - 1600) / 2600))
    // and its egrets, a little larger on a phone than that alone would make them, and no larger on a wide screen, whose
    // hero is no taller
    const FO_BIRD_SCALE = (w) => Math.max(0.8, Math.min(1.2, FO_SCALE(w)))
    /* The egrets, at three depths, each a group that keeps together, its birds in lanes of their own across its share of
       the band and spaced along the round as the golden ratio spaces them (as the sky's flock is, see SK_BIRDS): the far
       ones smaller, slower and a little misty, high over the far crowns; the middle ones; the near ones larger and faster;
       and two nearer still, low over the near crowns, only on a canvas wider than a phone's. Each depth: how many, its
       share of the band (0 at its top, 1 at its foot), its size (CSS pixels at 1232), its pace and how far the mist has
       it (1 the farthest). Their wings beat slowly and are held long as they glide, never raised past about fifty
       degrees, so that they never read as a rabbit's ears. A depth's lanes lie close together (its birds keep apart
       along the way), and the depths well apart, about a third of a bird's length, so that one passing another never
       flies wing through wing. A phone flies two of each. */
    const FO_DEPTHS = [
      { count: 3, lanes: [0, 0.16], size: 50, speed: 24, far: 1 },
      { count: 3, lanes: [0.32, 0.48], size: 60, speed: 32, far: 0.5 },
      { count: 3, lanes: [0.64, 0.8], size: 70, speed: 40, far: 0 },
    ]
    const FO_UPPER = 0.84
    const FO_NEAR_FROM = 700
    const foBird = (h, lane, phase, size, speed, far) => ({
      size: size * (0.92 + 0.16 * h(1)),
      speed,
      lane,
      phase,
      drift: (3 + 2.5 * h(5)) * (1 - 0.4 * far),
      period: 5 + 3 * h(6),
      surge: (3 + 4 * h(11)) * (1 - 0.5 * far),
      surgePeriod: 3 + 2 * h(12),
      beat: 1.6 + 0.5 * h(7) + 0.25 * far,
      wag: 0,
      flap: 0.24 * (0.85 + 0.3 * h(8)),
      glide: 3 + 3 * h(9),
      seed: h(10),
      far,
    })
    const FO_BIRDS = [
      ...FO_DEPTHS.flatMap(({ count, lanes, size, speed, far }, g) =>
        Array.from({ length: count }, (_, j) => {
          const i = FO_DEPTHS.slice(0, g).reduce((a, b) => a + b.count, 0) + j
          const h = (k) => foHash(i * 13.7 + k * 2.9 + 0.5)
          const lane = Math.min(
            1,
            Math.max(0, lanes[0] + ((j + 0.5) / count) * (lanes[1] - lanes[0]) + (h(3) - 0.5) * 0.03),
          )
          const along = (((j * 0.618034 + g * 0.31) % 1) - 0.5) * 0.22 + (h(4) - 0.5) * 0.03
          const bird = foBird(h, lane, g / FO_DEPTHS.length + 0.04 + along, size, speed, far)
          return j < 2 ? bird : { ...bird, from: FO_NEAR_FROM }
        }),
      ),
      ...[0, 1].map((j) => {
        const h = (k) => foHash(j * 29.3 + k * 4.1 + 3.3)
        const bird = foBird(h, 0.93 + 0.07 * h(3), (j + 0.3 + 0.4 * h(4)) / 2, 64, 50, 0)
        return { ...bird, from: FO_NEAR_FROM }
      }),
    ]
    // the pine: where it stands across the canvas
    const FO_PINE = { x: 0.87 }
    /* Each green as a ramp from its deepest shade to its highlight, sampled off the reference: the lime of the crowns in
       the sun, the leaf greens, emerald, the deep teal of the crowns in shade, a warm sage, the blue-green of the mist
       under the near crowns and the pine's dark green. At night each is the same green under a moon (foNight). */
    const FO_DAY = {
      lime: ['#2f7f3e', '#4f9a40', '#7cb548', '#9dc853', '#b4d666', '#c8e17c', '#dcec9c'],
      green: ['#1f5f37', '#2c7a3e', '#3f9040', '#56a13c', '#6db248', '#89c45e', '#a9d57e'],
      emerald: ['#164a32', '#1d5e3e', '#287349', '#348650', '#4a9b5c', '#66b06c', '#8ac688'],
      deep: ['#113524', '#16432d', '#1b5136', '#215f40', '#2a6f4a', '#3a8354', '#529965'],
      sage: ['#285c3a', '#3f784c', '#5a925c', '#73aa6a', '#8cbe7c', '#a5cf92', '#bddfab'],
      far: ['#4c9373', '#579f7c', '#62a984', '#6cb18b', '#77ba94', '#88c6a1', '#a0d3b4'],
      pine: ['#0e2a1f', '#123323', '#173d2a', '#1d4a31', '#265b3c', '#337149', '#4c8a5c'],
    }
    /* The pine at night is a silhouette against the moonlit mist, its pads' tops just caught by the moon; and a lime
       crown keeps a little of its warmth at night, a moss green on its lit tops, so that the lime crowns and the teal
       ones are still different trees. */
    const FO_NIGHT = {
      pine: ['#08140f', '#0b1a14', '#0f2219', '#142c21', '#1a3628', '#1f3d2e', '#2d5240'],
      lime: ['#16351f', '#1f4424', '#2e5a2c', '#3e6c33', '#4f7e3b', '#638f47', '#7aa45a'],
    }
    /* How far into the mist the far rows are: each green mixed towards a mint, deeper than the page (the reference's
       mint), so that the far crowns go back into the mist as softer, bluer crowns, not as flat discs; at night towards a
       moonlit teal, lighter than the near crowns, so that the night forest has depth too. */
    const FO_FOG = [0, 0.26, 0.46, 0.62]
    const FO_FOG_AIR = [null, ['#6db787', '#3a6a5e'], ['#7cc095', '#3f7064'], ['#8ecaa6', '#43756a']]
    const FO_FOGGED = ['lime', 'green', 'emerald', 'deep']
    const FO_PAINTS = {
      ...Object.fromEntries(
        Object.entries(FO_DAY).flatMap(([tone, ramp]) =>
          ramp.map((day, i) => [`fo_${tone}${i}`, [day, FO_NIGHT[tone]?.[i] ?? foNight(day)]]),
        ),
      ),
      ...Object.fromEntries(
        FO_FOGGED.flatMap((tone) =>
          [1, 2, 3].flatMap((level) =>
            FO_DAY[tone].map((day, i) => {
              const night = FO_NIGHT[tone]?.[i] ?? foNight(day)
              return [
                `fo_${tone}f${level}_${i}`,
                [foMix(day, FO_FOG_AIR[level][0], FO_FOG[level]), foMix(night, FO_FOG_AIR[level][1], FO_FOG[level])],
              ]
            }),
          ),
        ),
      ),
    }
    const FOREST = {
      ...HERO,
      intro: false,
      words: '.uc-copy, .dc-copy, .hl-copy',
      // a few beads, the oval of page kept round the words shallow, and every line carried to the canvas's edges
      lines: { ...LINES, lift: 0.08, veil: [80, 18], beadChance: 0.05, whole: true },
      film: FOOTER.film,
      // drawn at a little less than the screen's density on a canvas wider than any laptop's, as the sky is
      dprCap: (w) => Math.min(2, 2 * Math.sqrt(1800 / w)),
      inks: FO_INKS,
      twinkle: true,
      marks: true,
      glyphs: true,
      // the crowns at the sides and the pine stand up against the page beside the words, as well as over the mist
      onPage: true,
      /* the mist's lines come in from nothing under the buttons, pale and few, so that where they start is no edge: slowly,
         over more than half the picture, so that they are at their full only down among the crowns, and the open mist is
         the wash over them (see the plant); never a lone hairline across the whole canvas, and never a striped sky */
      fade: {
        at: (stage) => {
          const foot = stage.words.y + stage.words.b
          return [foot - 2, foot + (stage.h - foot) * 0.6]
        },
        ease: 1.15,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      land: {
        ...HERO.land,
        profile: [
          [-1.6, 0],
          [1.6, 0],
        ],
        crest: 0,
        relief: [1, 1],
        sheets: [
          // the mist, from just under the buttons' foot down, in the land's fine lines (as the sky's air is)
          {
            name: 'air',
            top: (stage) => {
              const under = Math.min((stage.words.y + stage.words.b + 3 - stage.base) / stage.room, 0.12)
              return [
                [-1.6, under],
                [1.6, under],
              ]
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'foTop', 0.4],
              [0.13, 'foTop', 1],
              [0.28, 'foHigh', 1],
              [0.52, 'foMid', 1],
              [0.8, 'foLow', 1],
              [1, 'foFoot', 1],
            ],
            fade: true,
            fill: 0.9,
            under: 0.95,
            patch: 0.05,
            flow: 1.1,
            breath: 2,
            // the lines' pale beads are the paper's stipple by day; at night they would be stars down among the crowns,
            // so the night's stars are planted instead, up in the mist (see the plant)
            beads: [1, 0],
          },
          // the land's foot, under the crowns: it lays the land out and draws nothing
          {
            name: 'meadow',
            top: [
              [-1.6, 1.24],
              [1.6, 1.24],
            ],
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'foFoot', 0],
              [1, 'foFoot', 0],
            ],
            fill: 0,
            under: 0,
          },
        ],
        least: 110,
      },
      grass: null,
      flowers: null,
      passer: null,
      pointer: false,
      clouds: [],
      /* No butterflies: the egrets are this forest's flock, and they come in and go out through glass as every hero's
         creatures do. It is the sky's even glass (see SKY.lens), so a white egret is drawn out level and never shown twice,
         but stronger than the sky's and as wide as the butterflies' band (LENS.bandMost), so that an egret is plainly bent
         and magnified across at the edge. It softens them well towards the edge, so that the egret drawn out there is a
         soft wisp of white through frosted glass rather than a hard white streak, and its colours stay together, since
         white birds come apart into rainbow streaks. */
      flock: [],
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 2.6,
        halo: [2.6, 0.2],
      },
      school: {
        fish: FO_BIRDS,
        size: FO_BIRD_SCALE,
        turn: 0.18,
        // over the mist, from a little under the buttons (clear of them with their wings up) down over the far crowns,
        // rising a little to the right, as the sky's band does
        band: ({ w, h, words }) => {
          const rise = h * 0.06 * Math.min(1, w / 1232)
          const under = words.y + words.b
          const top = under + 40 + rise / 2 + 12 * FO_BIRD_SCALE(w)
          const foot = Math.max(top + 110, under + 0.62 * (h - under))
          return [top, w < FO_NEAR_FROM ? top + (foot - top) / FO_UPPER : foot, -rise]
        },
        scatter: { radius: 120, push: 340, back: 1.3 },
      },
      paints: {
        ...PAINTS,
        ...FO_PAINTS,
        skBird: ['#ffffff', '#ffffff'],
        skBirdSoft: ['#f1f7f2', '#e8f2ec'],
        skBirdShade: ['#dce8e0', '#cfdfd6'],
        skBirdGlow: ['#ffffff', '#eaf6ee'],
        foBirdFar: ['#f4f9f5', '#e2efe8'],
        foBirdFarShade: ['#d9e8df', '#c3d8cc'],
        foBill: ['#5b6148', '#c9bd78'],
        foLeg: ['#465246', '#9aa89c'],
        foBark: ['#2a482c', '#0c1913'],
        foBarkLit: ['#41603a', '#1a3125'],
        foPineBark: ['#3a2a1f', '#120c09'],
        foPineBarkLit: ['#4a3526', '#1b130d'],
        foMist: ['#9fd2b5', '#2f5a53'],
        foMistLit: ['#c4e7d3', '#46766c'],
        // the wash over the open mist, from under the buttons down to the far crowns
        foWashTop: ['#d9eee2', '#141d1b'],
        foWashHigh: ['#c2e2cf', '#172624'],
        foWash: ['#a9d6bb', '#1a2f2c'],
        foWashDeep: ['#96ccad', '#1d3632'],
        // the night's stars, up in the mist: hardly to be told from it by day
        foStar: ['#eaf4ee', '#f4fbff'],
        foStarGlow: ['#d8ebdf', '#fff7dc'],
      },
      plant: (garden) => {
        const { w, h, rand, ground, words } = garden
        const half = w / 2
        const sc = FO_SCALE(w)
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = (n, { x, y, ...o }) => {
          rand.reseed(77001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: FO_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const r = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.29)
          const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * u
          const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875
        const top = ground('air', half)
        const pic = h - top
        // radii keep more of their size on a narrow canvas than the width alone would give them, so a phone's forest is
        // still a few big crowns and not a carpet of small ones
        const rs = Math.max(sc, Math.min(0.8, pic / 420))
        // and the near crowns and the pine grow with the picture's height too, so that a tall screen's forest is a few
        // great crowns and a tall pine, not a carpet
        const tall = clamp(pic / 330, 1, 1.35)
        // and on a laptop's canvas narrower than the 1232 one, the crowns keep their size, so it is not a carpet of small ones
        const cs = w < FO_NEAR_FROM ? rs : Math.max(rs, Math.min(0.95, pic / 340))
        // the finest mark: a CSS pixel, or a little more on a large canvas
        const px = Math.max(0.8, Math.sqrt(rs))
        const ramp = (tone, i, fog = 0) =>
          fog && FO_FOGGED.includes(tone)
            ? `fo_${tone}f${fog}_${clamp(Math.round(i), 0, 6)}`
            : `fo_${tone}${clamp(Math.round(i), 0, 6)}`
        // the far crowns go into the mist across this band
        garden.mist(top + 0.02 * pic, top + 0.24 * pic)
        // the valley of mist under the words, where the birds fly over open mist and the far crowns sink deeper
        const valleyHalf = clamp(words.a + 60, 0.22 * w, 0.4 * w)
        const valley = (x) => Math.exp(-1.6 * ((x - words.x) / valleyHalf) ** 2)
        // whether a thing standing between these places across is clear of the words, and can stand up beside them
        const clearOfWords = (x0, x1) => x1 < words.x - words.a - 90 || x0 > words.x + words.a + 90
        // the pine and the great crown stand near the sides, and on a canvas much wider than a laptop's no further from
        // the words than on one, so that they still frame them rather than standing off at the screen's far edges
        const pineX = Math.min(FO_PINE.x * w, words.x + words.a + 240 * sc)
        const bigR = 150 * rs
        const bigX = Math.max(0.07 * w, words.x - words.a - 240 * sc - 0.5 * bigR)

        /* The picture is planned first, far to near, as layers of strokes, each with the solid shapes it covers; then,
           from the nearest back, a stroke wholly behind what is nearer is left out, so that the paint goes where it shows. */
        const layers = []
        let layer = null
        const begin = () => {
          layer = { strokes: [], solid: [] }
          layers.push(layer)
        }
        const add = (o) => {
          // (one wholly under the canvas's foot is never seen)
          if (o.y - o.long - (o.blur || 0) < h) {
            layer.strokes.push(o)
          }
        }
        const solid = (x, y, a, b) => {
          layer.solid.push([x, y, a, b])
        }
        // A length of branch from one place to another, in round pieces narrowing from one width to the other.
        const limb = (ax, ay, bx, by, w0, w1, paint, shade = paint, blur = 0.45) => {
          const len = Math.max(1, Math.hypot(bx - ax, by - ay))
          const pieces = Math.max(1, Math.min(6, Math.round(len / Math.max(5, w0 * 4))))
          const turn = Math.atan2(by - ay, bx - ax)
          for (let i = 0; i < pieces; i += 1) {
            const u = (i + 0.5) / pieces
            const width = w0 + (w1 - w0) * u
            const long = (len / pieces) * 0.6 + width * 0.3
            add({
              x: ax + (bx - ax) * u,
              y: ay + (by - ay) * u,
              long,
              wide: clamp(width / 2 / long, 0.004, 0.9),
              turn,
              blur,
              paints: [paint, shade],
              load: 0.94,
              kind: FO_HAZE,
            })
          }
        }

        // The forest's own shade under every crown, deep teal low down and paling into the mist up where the far crowns
        // stand, so that no page or mist shows between the near crowns; and a light in the mist over the valley, and a
        // mint mist where the egrets fly, so that they show white against it.
        begin()
        const ug = 22 * rs
        for (let gy = top + 0.18 * pic; gy < h + ug; gy += ug) {
          for (let gx = -ug; gx < w + ug; gx += ug) {
            const q = Math.round(gx / ug) * 6113 + Math.round(gy / ug) * 92821 + 17
            const x = gx + (hashed(q * 0.013 + 0.3) - 0.5) * ug * 0.6
            const y = gy + (hashed(q * 0.017 + 0.2) - 0.5) * ug * 0.6
            const yy = (y - top) / pic
            const sink = valley(x) * 0.1
            const fade = smooth(0.18 + sink, 0.36 + sink, yy)
            if (fade <= 0.02) {
              continue
            }
            const deep = smooth(0.34 + sink, 0.85, yy)
            const paints =
              deep < 0.3 ? ['fo_far2', 'fo_far0'] : deep < 0.65 ? ['fo_emerald2', 'fo_deep1'] : ['fo_deep2', 'fo_deep0']
            add({
              x,
              y,
              long: ug * 0.95,
              wide: 0.95,
              turn: 1.2,
              blur: ug * (fade < 0.99 ? 0.5 : 0.3),
              paints,
              load: 0.95 * fade,
              kind: fade < 0.99 ? FO_HAZE : FO_LEAF,
            })
          }
        }
        /* A wash of mint over the open mist, in rows deepening down it, so that its lines show through only as a grain in
           the paint and never as stripes across it; coming in slowly under the buttons, over where the lines come in, so
           that the first of them are in it and not standing alone over the page. */
        const washStep = 0.05 * w + 40
        const WASH = [
          [0.05, 'foWashTop', 0.16],
          [0.12, 'foWashHigh', 0.36],
          [0.19, 'foWash', 0.4],
          [0.27, 'foWash', 0.36],
          [0.35, 'foWashDeep', 0.38],
        ]
        WASH.forEach(([at, paint, most], row) => {
          const cols = Math.ceil(w / washStep) + 2
          for (let i = 0; i < cols; i += 1) {
            const q = row * 131 + i * 17 + 3
            const x = (i - 0.5 + (row % 2) * 0.5 + (hashed(q * 1.3) - 0.5) * 0.4) * washStep
            const yy = at + (hashed(q * 2.1) - 0.5) * 0.025
            add({
              x,
              y: top + yy * pic,
              long: washStep * 0.95,
              wide: 0.5,
              blur: washStep * 0.55,
              paints: [paint, paint],
              load: most * (0.85 + 0.3 * hashed(q * 4.3)),
              kind: FO_HAZE,
            })
          }
        })
        // and a light in the mist over the valley under the words
        for (let k = 0; k < 7; k += 1) {
          const x = words.x + ((k + 0.5) / 7 - 0.5) * 2.2 * valleyHalf
          const y = top + (0.2 + 0.04 * Math.sin(k * 1.7)) * pic
          add({
            x,
            y,
            long: 0.06 * w + 30,
            wide: 0.45,
            blur: 0.04 * w + 20,
            paints: ['foMistLit', 'foMistLit'],
            load: (0.12 + 0.06 * hashed(k * 2.7)) * valley(x),
            kind: FO_HAZE,
          })
        }
        /* The night's stars, few and small, high over the forest: in the top of the mist and, beside the words, over the
           crowns standing up against the page, none down among the crowns; by day hardly to be told from the mist. */
        for (let k = 0; k < 22; k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const beside = Math.abs(x - words.x) > words.a + 70
          const y = top + (beside ? -0.16 : 0.015) * pic + hashed(k * 3.7 + 0.9) ** 1.4 * (beside ? 0.26 : 0.085) * pic
          const r = (0.8 + 1.4 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          add({
            x,
            y,
            long: r * 1.5,
            wide: 1,
            blur: r * 1.1,
            paints: ['foStarGlow', 'foStarGlow'],
            load: 0.1,
            kind: FO_GLIMMER,
          })
          add({ x, y, long: r * 0.5, wide: 1, blur: r * 0.2, paints: ['foStar', 'foStar'], load: 1, kind: FO_TWINKLE })
        }

        // The crowns, row behind row: small and close far off, up in the mist, and few and large near the canvas's foot.
        const rows = clamp(Math.round(2 + pic / (100 * cs)), 4, 7)
        const rFar = 30 * cs
        // (never so large that the nearest crowns rise up over the pine and the great crown on a wide, short canvas)
        const rNear = Math.min(190 * cs * tall, 0.72 * pic)
        const items = []
        // where a row's crowns stand at a place across: lower in the valley, rising and falling along the row
        const rowAt = (k, d, x) =>
          top +
          pic * (0.16 + 0.88 * d) +
          (1 - d) ** 1.4 * valley(x) * 0.15 * pic +
          (1 - d) * (fbm(x / (260 * rs) + k * 3.1, 0.7) - 0.5) * 0.14 * pic
        for (let k = 0; k < rows; k += 1) {
          const d = k / (rows - 1)
          const r = rFar + (rNear - rFar) * d ** 1.8
          const step = r * (1.45 - 0.12 * d)
          let x = -step * (0.2 + 0.6 * hashed(k * 3.7 + 0.2))
          for (let j = 0; x < w + step * 0.7; j += 1) {
            const q = k * 97 + j * 13 + 5
            // now and then a far crown stands taller than the rest, out of the mist; and now and then a near one is much
            // larger than its neighbours, as the reference's foreground crowns are
            const tallOne = d < 0.5 && hashed(q * 6.1) < 0.13 ? 1.4 : 1
            const great = d > 0.7 && hashed(q * 7.3) < 0.3 ? 1.22 : 1
            const cr = r * tallOne * great * (0.78 + (0.3 + 0.25 * (1 - d)) * hashed(q * 1.31))
            const lift =
              (hashed(q * 2.17) - 0.5) * (0.35 + 0.45 * (1 - d)) * cr - (tallOne - 1) * 0.5 * r - (great - 1) * 0.4 * r
            items.push({
              kind: 'crown',
              x: x + (hashed(q * 3.3) - 0.5) * 0.25 * cr,
              y: rowAt(k, d, x) + lift,
              r: cr,
              d,
              q,
            })
            x += step * (0.78 + 0.44 * hashed(q * 4.9)) * (great > 1 ? 1.2 : 1)
          }
          if (d < 0.8) {
            items.push({ kind: 'veil', d: d + 1e-4, y: 1e9, r, k })
          }
        }
        // a great lime crown in the sun at the left, up to the top of the picture, as in the reference
        const bigTop = clearOfWords(bigX - bigR, bigX + bigR * 0.8) ? top - 0.1 * pic : top + 0.04 * pic
        items.push({
          kind: 'crown',
          x: bigX,
          y: bigTop + 0.6 * bigR,
          r: bigR,
          d: 0.56,
          q: 7001,
          tone: 'lime',
          special: true,
        })
        // the pine, among the middle rows, in front of all but the nearest
        items.push({ kind: 'pine', d: 0.7, y: 0 })
        items.sort((a, b) => a.d - b.d || a.y - b.y)

        // Each crown's green: lime where the light falls in pools through the forest, deep teal where it does not, and
        // never the same as the crown before it; and how far into the mist it is.
        const NEXT = { lime: 'green', green: 'emerald', emerald: 'deep', deep: 'emerald', sage: 'green' }
        let prev = ''
        items.forEach((c) => {
          if (c.kind !== 'crown') {
            return
          }
          c.fog = c.special ? 0 : c.d < 0.1 ? 3 : c.d < 0.3 ? 2 : c.d < 0.5 ? 1 : 0
          if (c.tone) {
            return
          }
          const sun =
            (fbm(c.x / (340 * rs) + 3.1, c.y / (260 * rs) + 1.7) - 0.5) * 2.4 + (hashed(c.q * 5.3) - 0.5) * 0.9
          let tone = sun > 0.24 ? 'lime' : sun > -0.02 ? 'green' : sun > -0.22 ? 'emerald' : 'deep'
          if (tone === prev) {
            tone = NEXT[tone]
          }
          // the farthest are all blue-green in the mist, with no lime
          if (c.fog === 3 && tone === 'lime') {
            tone = 'green'
          }
          // now and then a sage one, but never by the pine, against which it would read grey
          if (c.d > 0.5 && hashed(c.q * 8.1) < 0.06 && Math.abs(c.x - pineX) > 0.14 * w) {
            tone = 'sage'
          }
          c.tone = tone
          prev = tone
        })

        /* A crown: a cauliflower of clumps in tiers, the upper ones laid first and the lower, nearer ones over them, each
           lit along its top (its own roundness and the crown's, from the upper left) and shaded under, its edge sponged
           in dabs of every size at a ragged reach, and its lit side stippled with specks of lighter paint. Over the crown
           behind it, just above its top, its shadow. In a lit crown, dark branches fork up from a gap among its clumps. */
        const crown = (c) => {
          begin()
          const { x: cx, y: cy, r, tone, d, fog } = c
          const seed = c.q * 1.37 + 0.5
          const misty = d < 0.3 && !c.special
          const kLeaf = misty ? FO_LEAF_MIST : FO_LEAF
          const con = 0.62 + 0.38 * Math.min(1, d / 0.6)
          const bias = { lime: 0.6, green: 0.25, emerald: -0.15, deep: -0.35, sage: 0.2 }[tone]
          const F = (f) => ramp(tone, 3 + (f + bias - 3) * con, fog)
          const fine = d > 0.25
          // a crown in the sun is lit through, so its creases are a deeper lime rather than dark
          const lit = tone === 'lime' || tone === 'green' || tone === 'sage'
          // its shade inside, which shows in the creases between its clumps
          solid(cx, cy, r * 0.74, r * 0.38)
          // (well inside its clumps, so that none of it shows past them as a smooth dome)
          const bs = r * 0.24
          for (let gy = cy - 0.24 * r; gy <= cy + 0.3 * r; gy += bs) {
            for (let gx = cx - 0.64 * r; gx <= cx + 0.65 * r; gx += bs) {
              const nx = (gx - cx) / (0.66 * r)
              const ny = (gy - cy) / (0.3 * r)
              if (nx * nx + ny * ny > 1) {
                continue
              }
              add({
                x: gx,
                y: gy,
                long: bs * 0.85,
                wide: 0.95,
                turn: 1.2,
                blur: Math.min(bs * 0.2, 3),
                paints: lit ? [F(2.2), F(1)] : [F(1.1), F(0.1)],
                load: 0.95,
                kind: kLeaf,
              })
            }
          }
          // the clumps, tier under tier; a great crown in more, smaller ones, so that it is lumpy at every size
          const great = r > 90 * rs
          const tiers = r > 115 * rs ? 5 : r > 70 * rs ? 4 : r > 34 * rs ? 3 : 2
          const masses = []
          for (let t = 0; t < tiers; t += 1) {
            const ft = t / (tiers - 1)
            const ty = cy - 0.44 * r + ft * (tiers > 2 ? 0.72 : 0.56) * r
            const span = r * (0.42 + 0.52 * Math.sqrt(ft))
            const a0 = r * (great ? 0.24 + 0.08 * ft : 0.3 + 0.1 * ft)
            const count = Math.max(1, Math.round((2 * span) / (1.55 * a0)))
            for (let i = 0; i < count; i += 1) {
              const u = count === 1 ? (hashed(seed + t) - 0.5) * 0.4 : (i / (count - 1)) * 2 - 1
              const qq = seed + t * 7.3 + i * 3.1
              const a = a0 * (0.75 + 0.5 * hashed(qq))
              masses.push({
                x: cx + u * Math.max(0, span - a * 0.75) + (hashed(qq + 1.1) - 0.5) * a * 0.5,
                y: ty + (hashed(qq + 2.3) - 0.5) * a * 0.3 + u * u * r * 0.12,
                a,
                b: a * (0.44 + 0.16 * hashed(qq + 3.7)),
                qq,
                t,
                u,
              })
            }
          }
          masses.sort((p, q) => p.y - q.y)
          // its shadow over the crown behind it, just above its top, so that a nearer crown stands clear of a farther one
          if (d > 0.35 && !c.special) {
            masses
              .filter((m) => m.t === 0 || (m.t === 1 && Math.abs(m.u) > 0.6))
              .forEach((m) => {
                add({
                  x: m.x + m.a * 0.08,
                  y: m.y - m.b * 0.62,
                  long: m.a * 1.02,
                  wide: 0.55,
                  turn: 0,
                  blur: m.b * 0.55,
                  paints: ['fo_deep1', 'fo_deep0'],
                  load: 0.46,
                  kind: FO_HAZE,
                })
              })
          }
          const mass = (m) => {
            const { x, y, a, b } = m
            const ux = (x - cx) / r
            const uy = (y - cy) / r
            const lc = clamp(0.62 - 0.4 * ux - 0.8 * uy, 0.12, 1)
            const fB = 0.8 + 2.6 * lc
            // down in the canvas's foot, where it fades into the page, its light is quieter, so its top is no row of beads
            const low = smooth(h - 0.3 * pic, h - 0.06 * pic, y)
            solid(x, y + b * 0.12, a * 0.78, b * 0.66)
            /* Its body, a few round dabs lit from the upper left, their edges breaking into the grain as a sponge's paint
               does. Down in the canvas's foot, where the paint thins away into the page and dabs laid over one another
               would show their rims there as rings, it is one oval instead, its top scalloped and its sides plain; in the
               crown's own shade rather than its light, so that it reads as leaves going into the shade and not as a pale
               dome, and what breaks into the grain at the foot is green rather than frost. */
            const faded = low > 0.4
            if (faded) {
              add({
                x,
                y: y + b * 0.08,
                long: a * 0.98,
                wide: b / a,
                turn: 0,
                blur: b * 0.14 + 0.5,
                paints: [F(fB - 0.3), F(fB - 1.5)],
                load: 0.97 * (1 - 0.3 * low),
                kind: FO_HAZE,
              })
            } else {
              const nb = Math.max(1, Math.round((a / b) * 1.5))
              for (let i = 0; i < nb; i += 1) {
                const u = nb === 1 ? 0 : (i / (nb - 1)) * 2 - 1
                const rr = b * (0.72 + 0.28 * hashed(m.qq + i * 1.7))
                add({
                  x: x + u * Math.max(0, a - rr * 1.02),
                  y: y + u * u * b * 0.25 + (b - rr) * 0.4,
                  long: rr,
                  wide: 0.95,
                  turn: 1.3,
                  blur: Math.min(rr * 0.14, 2.4 * px) + 0.3,
                  paints: [F(fB + 1.1), F(fB - 1.9)],
                  load: 0.97,
                  kind: kLeaf,
                })
              }
            }
            /* Its edge, round its top and down its sides: small round dabs of leaves, close enough to run together, each
               the colour of the body where it is, so that its outline is scalloped as a heap of leaves is, without a row
               of beads along it. Over a faded one's plain oval its leaves are thinner and hardly lit, or each would stand
               on it as a bead of its own. */
            const sMin = (misty ? 2.8 : 1.8) * px
            const sweep = Math.PI + 0.6
            const arc = sweep * Math.sqrt((a * a + b * b) / 2)
            if (low < 0.8) {
              let th = faded ? -Math.PI + 0.3 : -Math.PI - 0.3
              let k = 0
              while (th < (faded ? -0.3 : 0.3) && k < 80) {
                const sz = Math.max(sMin, b * (0.1 + 0.26 * hashed(m.qq + k * 3.7) ** 1.8) * (1 - 0.3 * low))
                const ex = Math.cos(th)
                const ey = Math.sin(th)
                const lt = clamp(-(ex * 0.55 + ey * 0.85), 0, 1)
                const f = faded
                  ? fB - 0.9 + 0.6 * lt * (1 - low) + (hashed(m.qq + k * 2.9) - 0.5) * 0.35
                  : fB - 0.8 + 1.95 * lt * (1 - 0.85 * low) + (hashed(m.qq + k * 2.9) - 0.5) * 0.7
                const rad = 1 - (0.5 * sz) / b + (hashed(m.qq + k * 1.33) - 0.5) * 0.2
                add({
                  x: x + ex * a * rad,
                  y: y + ey * b * rad,
                  long: sz,
                  wide: 0.8 + 0.16 * hashed(m.qq + k * 4.1),
                  turn: 1.3 + (hashed(m.qq + k * 6.1) - 0.5) * 0.8,
                  blur: sz * 0.26 + 0.3,
                  paints: [F(f + 0.2), F(f - 0.2)],
                  load: faded ? 0.55 : 0.96,
                  kind: kLeaf,
                })
                th += ((sz * (0.9 + 0.5 * hashed(m.qq + k * 0.53))) / arc) * sweep
                k += 1
              }
            }
            if (!fine) {
              return
            }
            // the stipple: fine specks of lighter paint over its lit side, and darker ones under
            const ns = Math.round(a * b * 0.014 * (1 - 0.5 * low))
            for (let i = 0; i < ns; i += 1) {
              const ang = hashed(m.qq + i * 0.613) * Math.PI * 2
              const rad = Math.sqrt(hashed(m.qq + i * 1.237 + 0.3))
              const ex = Math.cos(ang) * rad
              const ey = Math.sin(ang) * rad
              const lt = clamp(0.4 - 0.6 * ex - 0.8 * ey, 0, 1.2)
              const dark = ey > 0.1 && hashed(m.qq + i * 7.3) < 0.7
              const f = dark
                ? fB - 0.8 - 0.6 * ey
                : fB + 0.6 + 0.9 * lt * (1 - 0.4 * low) + (hashed(m.qq + i * 2.7) - 0.5) * 0.6
              const s = (0.7 + 1.0 * hashed(m.qq + i * 3.9) ** 2) * px
              add({
                x: x + ex * a * 0.95,
                y: y + ey * b * 0.9,
                long: s,
                wide: 0.9,
                turn: 1.25,
                blur: 0.35 + s * 0.3,
                paints: [F(f + 0.4), F(f + 0.1)],
                load: 0.45 + 0.45 * hashed(m.qq + i * 4.7),
                kind: FO_LEAF,
              })
            }
          }
          /* The branches: in a lit crown, as in the reference, a trunk up from under it into a gap in its leaves, in the
             crown's shade, where it forks; from the fork a few limbs, thick at the fork and narrowing, spreading wide as
             they rise and forking once, out over its leaves and into them, tufts of leaves over their tips and here and
             there along them, and all of it well inside the crown. */
          const fx = cx + (hashed(seed + 9.1) - 0.5) * r * 0.36
          const fy = cy + (0.12 + 0.08 * hashed(seed + 1.9)) * r
          // only a big crown, and not one whose fork is down in the fade at the canvas's foot, where it would be a twig
          const big = r > 72 * rs && fy < h - 0.24 * pic
          const chance = { lime: 0.85, sage: 0.7, green: 0.5, emerald: 0.15, deep: 0 }[tone]
          const branchy = !misty && fog === 0 && big && hashed(seed + 0.3) < chance
          masses.forEach(mass)
          if (!branchy) {
            return
          }
          // slender, as the reference's are: a heavy limb across a crown reads as a crack in it
          const wT = Math.max(1.7 * px, 0.021 * r)
          const tips = []
          const along = []
          const segs = []
          // the crown's inside, in which every limb ends
          const inside = (x, y) => ((x - cx) / (0.72 * r)) ** 2 + ((y - cy + 0.02 * r) / (0.48 * r)) ** 2 < 1
          let twigs = 0
          const bough = (x0, y0, ang, len, w0, bend, forks) => {
            let x = x0
            let y = y0
            let a = ang
            let wd = w0
            for (let s = 0; s < 3; s += 1) {
              const nx = x + (Math.cos(a) * len) / 3
              const ny = y + (Math.sin(a) * len) / 3
              if (!inside(nx, ny)) {
                break
              }
              const w1 = Math.max(0.8 * px, wd * 0.72)
              segs.push([x, y, nx, ny, wd, w1, s > 0 && hashed(seed + twigs * 2.9) < 0.4])
              twigs += 1
              if (s > 0) {
                along.push([nx, ny])
              }
              x = nx
              y = ny
              wd = w1
              a += bend + (hashed(seed + twigs * 3.77) - 0.5) * 0.55
            }
            tips.push([x, y, a, forks])
            // two twigs off its end, as the reference's limbs have
            if (forks > 0) {
              ;[-1, 1].forEach((k) => {
                bough(
                  x,
                  y,
                  a + k * (0.4 + 0.3 * hashed(seed + twigs * 2.11 + k)),
                  len * (0.32 + 0.18 * hashed(seed + twigs + k)),
                  wd * 0.8,
                  bend * 0.5,
                  forks - 1,
                )
              })
            }
          }
          // the trunk, up from under the crown to the fork, and the limbs off the fork, spreading wide
          // the trunk leans, and the fork is lopsided: its main limb goes on the way the trunk leans, a shorter one
          // goes off the other way and now and then a third, short, between them, never a symmetrical Y; and the trunk
          // is seen from the fork down to the crown's foot, so that the fork stands on something
          const lean = hashed(seed + 4.4) < 0.5 ? -1 : 1
          const footX = fx - lean * (0.06 + 0.1 * hashed(seed + 4.9)) * r
          segs.push([footX, cy + 0.5 * r, fx, fy, wT * 1.1, wT * 0.8, false])
          const LIMBS = [
            [lean * (0.45 + 0.25 * hashed(seed + 2.3)), 0.32 + 0.08 * hashed(seed + 3.9), 1],
            [-lean * (0.3 + 0.2 * hashed(seed + 2.9)), 0.26 + 0.08 * hashed(seed + 3.1), 0.85],
            ...(hashed(seed + 5.5) < 0.6
              ? [[lean * (0.08 + 0.14 * hashed(seed + 2.7)), 0.22 + 0.08 * hashed(seed + 3.3), 0.65]]
              : []),
          ]
          LIMBS.forEach(([tilt, len, thick], i) => {
            bough(
              fx,
              fy - 0.015 * r * i,
              -Math.PI / 2 + tilt,
              len * r,
              wT * 0.76 * thick,
              Math.sign(tilt) * (0.05 + 0.07 * hashed(seed + i * 1.1)),
              i < 2 ? 2 : 1,
            )
          })
          // and a lower limb off the trunk, out the other way, so that the fork is one of several and not a lone Y
          const lowAt = 0.45 + 0.2 * hashed(seed + 6.1)
          bough(
            footX + (fx - footX) * lowAt,
            cy + 0.5 * r + (fy - cy - 0.5 * r) * lowAt,
            -Math.PI / 2 - lean * (0.75 + 0.2 * hashed(seed + 6.7)),
            (0.2 + 0.06 * hashed(seed + 6.9)) * r,
            wT * 0.6,
            -lean * 0.12,
            1,
          )
          /* Cut into the leaves: first along every length of branch a channel of the crown's shade a little wider than
             it, so that the branch is seen in a gap among the leaves, as the reference's are; then the branches in it. */
          const gapW = 3.2 * px
          segs.forEach(([x0, y0, x1, y1, w0, w1]) => {
            limb(x0, y0, x1, y1, w0 + gapW, w1 + gapW * 0.8, F(0.9), F(0.3), 1.6)
          })
          segs.forEach(([x0, y0, x1, y1, w0, w1, lit]) => {
            limb(x0, y0, x1, y1, w0, w1, 'foBark', lit ? 'foBarkLit' : 'foBark')
          })
          // and leaves painted back over them: tufts over their tips and here and there along them, and a clump to
          // either side of the trunk's foot, which leaves the trunk itself to be seen
          // (a limb that forks into twigs at its end shows its twigs, which go into the tufts)
          tips.forEach(([x, y, ang, forks], i) => {
            if (forks > 0 || hashed(seed + i * 5.9) > 0.85) {
              return
            }
            const a = r * (0.05 + 0.05 * hashed(seed + i * 8.3))
            mass({
              x: x + Math.cos(ang) * a * 0.55,
              y: y + Math.sin(ang) * a * 0.55 - a * 0.1,
              a,
              b: a * 0.6,
              qq: seed + 50 + i * 2.1,
            })
          })
          along.forEach(([x, y], i) => {
            if (hashed(seed + i * 3.1) > 0.7) {
              return
            }
            const a = r * (0.05 + 0.05 * hashed(seed + i * 4.3))
            mass({
              x: x + (hashed(seed + i * 9.7) - 0.5) * a * 0.4,
              y: y - a * 0.1,
              a,
              b: a * 0.6,
              qq: seed + 70 + i * 2.3,
            })
          })
          ;[-1, 1].forEach((k) => {
            const a = r * (0.14 + 0.04 * hashed(seed + k * 7.7))
            mass({ x: footX + k * (a * 1.05 + wT * 2), y: cy + 0.34 * r, a, b: a * 0.6, qq: seed + 90 + k * 3.3 })
          })
        }

        // Mist lying in the hollows of a row, following its line, lobed, so that the row in front of it stands out.
        const veil = (v) => {
          begin()
          const count = Math.ceil(w / (1.5 * v.r)) + 2
          for (let i = 0; i < count; i += 1) {
            const x = ((i - 0.5 + hashed(v.k * 9.1 + i * 1.7) * 0.6) * w) / Math.max(1, count - 2)
            const lift = hashed(v.k * 5.3 + i * 2.9)
            add({
              x,
              y: rowAt(v.k, v.d, x) + (0.05 + 0.35 * lift) * v.r,
              long: (0.9 + 0.6 * hashed(v.k * 4.1 + i * 3.3)) * v.r,
              wide: 0.5 + 0.2 * lift,
              turn: (hashed(v.k * 2.2 + i * 1.9) - 0.5) * 0.3,
              blur: 0.6 * v.r,
              paints: ['foMist', 'foMist'],
              load: (0.26 - 0.24 * v.d) * (0.6 + 0.7 * hashed(v.k * 3.3 + i)),
              kind: FO_HAZE,
            })
          }
        }

        /* The pine: a tall dark conifer, as the reference's: a rounded head of clumps at its top; under it, out from its
           trunk on either side and never quite level, irregular pads of needles on drooping boughs, the higher ones short,
           now and then one missing, each lit along its top from the left and deep in its shade under it, with tufts
           hanging under, about half of them starting on the trunk's far side, so that its needles cross it; and its
           trunk, a little crooked, warm brown and tapering to its head, showing in the gaps between them. */
        const pine = () => {
          const x0 = pineX
          const ps = rs * tall
          const high = clearOfWords(x0 - 70 * ps, x0 + 70 * ps)
          const tip = high ? top - 0.12 * pic : top + 0.05 * pic
          const len = h + 10 - tip
          const wideMost = 74 * ps
          const P = (f) => ramp('pine', f)
          // the mist behind it, so that it stands dark against the light as the reference's does
          begin()
          for (let k = 0; k < 7; k += 1) {
            const y = top + (0.2 + 0.07 * k + 0.04 * hashed(k * 1.3)) * pic
            add({
              x: x0 + (hashed(k * 2.1) - 0.5) * 60 * ps,
              y,
              long: 70 * ps,
              wide: 0.6,
              blur: 50 * ps,
              paints: ['foMistLit', 'foMist'],
              load: 0.38 - 0.03 * k,
              kind: FO_HAZE,
            })
          }
          begin()
          const trunkAt = (f) => x0 + Math.sin(f * 5.1 + 0.6) * 2.2 * ps + (f - 0.5) * 3 * ps
          // its trunk, in four lengths, thin under its head and thick at its foot
          for (let j = 0; j < 4; j += 1) {
            const f0 = 0.04 + j * 0.25
            const f1 = Math.min(1.02, f0 + 0.27)
            const thick = (1.7 + 7 * ((f0 + f1) / 2)) * ps
            limb(
              trunkAt(f1),
              tip + f1 * len,
              trunkAt(f0),
              tip + f0 * len,
              thick,
              thick * 0.78,
              'foPineBark',
              'foPineBarkLit',
            )
          }
          // a pad of needles, its dabs short and roundish along the bough, lit on its top and on the left, deep under;
          // from `from` along it, which below 0 is on the trunk's far side
          const pad = (bx, by, side, reach, padTall, droop, id, f, from) => {
            const yAt = (u) => by - reach * 0.1 * u + droop * u * u
            limb(bx, by + 1, bx + side * reach * 0.8, yAt(0.8), (1.1 + 1.4 * f) * ps, 0.9 * ps, 'foPineBark')
            solid(bx + side * reach * 0.58, yAt(0.58), reach * 0.4, padTall * 0.42)
            const s = Math.max(2.8 * ps, reach * 0.075)
            for (let u = from; u < 1.04; u += s / reach) {
              // heaviest two thirds out along its bough, as the reference's pads are
              const swell = Math.sin(Math.PI * clamp((u - from) / (1 - from), 0, 1) ** 1.6) ** 0.55
              const thick = padTall * (0.35 + 0.65 * swell) * (0.75 + 0.5 * noise(u * 5 + id * 1.7, side * 3 + id))
              const cx = bx + side * reach * u
              const cyy = yAt(u)
              for (let v = -0.7; v <= 0.55; v += s / Math.max(thick, 1)) {
                const q = id * 977 + Math.round(u * 40) * 31 + Math.round(v * 20) * 7 + (side + 1) * 13
                const x = cx + (hashed(q * 0.11) - 0.5) * s * 0.8
                const y = cyy + v * thick + (hashed(q * 0.13) - 0.5) * s * 0.5
                const g = clamp(1.3 - v * 2.9 + (side < 0 ? 0.7 : 0) - u * 0.3 + (hashed(q * 0.17) - 0.5) * 0.9, 0, 6)
                const dab = s * (0.8 + 0.55 * hashed(q * 0.19))
                add({
                  x,
                  y,
                  long: dab * 1.1,
                  wide: 0.75,
                  turn: side * (0.06 + 0.2 * u * u) + (hashed(q * 0.23) - 0.5) * 0.5,
                  blur: dab * 0.25,
                  paints: [P(g + 0.6), P(g - 0.6)],
                  load: 0.95,
                  kind: FO_LEAF,
                })
              }
            }
            // a few tufts hanging under it
            for (let j = 0; j < 3; j += 1) {
              const u = 0.3 + 0.6 * hashed(id * 5.3 + j * 1.9)
              const dab = (2.5 + 2.5 * hashed(id * 6.1 + j * 2.3)) * ps
              add({
                x: bx + side * reach * u,
                y: yAt(u) + padTall * 0.55,
                long: dab,
                wide: 0.7,
                turn: side * 0.3,
                blur: dab * 0.3,
                paints: [P(1), P(0)],
                load: 0.9,
                kind: FO_LEAF,
              })
            }
          }
          // its head: round clumps heaped at the top of its trunk
          const headR = 0.3 * wideMost
          const hx = trunkAt(0)
          const hy = tip + headR
          const HEAD = [
            [0.02, -0.75, 0.42],
            [-0.32, -0.2, 0.5],
            [0.3, -0.12, 0.46],
            [-0.62, 0.42, 0.5],
            [0.05, 0.3, 0.56],
            [0.6, 0.5, 0.48],
          ]
          HEAD.forEach(([ox, oy, rad], k) => {
            const mx = hx + ox * headR * 1.3
            const my = hy + oy * headR
            const rr = rad * headR
            solid(mx, my, rr * 0.8, rr * 0.7)
            const s = Math.max(2.6 * ps, rr * 0.2)
            for (let yy = -rr * 0.8; yy <= rr * 0.75; yy += s * 0.8) {
              const across = rr * Math.sqrt(Math.max(0, 1 - (yy / (rr * 0.85)) ** 2)) * 1.1
              for (let xx = -across; xx <= across; xx += s * 0.9) {
                const q = k * 431 + Math.round(xx / s) * 17 + Math.round(yy / s) * 29
                const nx = xx / rr
                const ny = yy / rr
                const g = clamp(
                  2.2 - 2.4 * ny - 1.2 * nx - 0.8 * (oy + ox * 0.5) + (hashed(q * 0.31) - 0.5) * 1.0,
                  0,
                  6,
                )
                const dab = s * (0.75 + 0.5 * hashed(q * 0.37))
                add({
                  x: mx + xx + (hashed(q * 0.41) - 0.5) * s * 0.6,
                  y: my + yy + (hashed(q * 0.43) - 0.5) * s * 0.5,
                  long: dab,
                  wide: 0.78,
                  turn: (hashed(q * 0.47) - 0.5) * 0.8,
                  blur: dab * 0.25,
                  paints: [P(g + 0.6), P(g - 0.6)],
                  load: 0.95,
                  kind: FO_LEAF,
                })
              }
            }
          })
          // its pads, from under its head down: at each height a bough out to one side, the sides taking turns but not
          // always, and now and then a shorter one out to the other side as well
          let f = (headR * 1.6) / len
          let t = 0
          let side = -1
          while (f < 0.98) {
            const hp = (k) => hashed(t * 13.7 + k * 1.9 + 0.4)
            const env = wideMost * (0.32 + 0.68 * Math.min(1, f / 0.45) ** 0.8)
            const step = (0.036 + 0.04 * hp(0)) * (0.8 + 0.4 * f)
            const both = hp(1) < 0.45
            ;[side, ...(both ? [-side] : [])].forEach((sd, k) => {
              // the boughs to the left reach further, into the light, as the reference's do
              const reach = env * (0.6 + 0.6 * hp(2 + k * 7)) * (sd < 0 ? 1.12 : 0.9) * (k ? 0.65 : 1)
              const y0 = tip + f * len + (hp(3 + k * 7) - 0.5) * step * len * 0.6 + k * step * len * 0.45
              const droop = reach * (0.12 + 0.14 * hp(4 + k * 7))
              const padTall = clamp(reach * (0.24 + 0.16 * hp(5 + k * 7)), 6 * ps, 32 * ps)
              const from = hp(8 + k * 7) < 0.5 ? -0.12 - 0.1 * hp(9 + k * 7) : 0.1
              pad(trunkAt(f), y0, sd, reach, padTall, droop, t * 2 + k + 1, f, from)
            })
            side = hp(6) < 0.8 ? -side : side
            f += step
            t += 1
          }
        }

        items.forEach((it) => {
          if (it.kind === 'crown') {
            crown(it)
          } else if (it.kind === 'veil') {
            veil(it)
          } else {
            pine()
          }
        })

        // Leave out what is wholly behind something nearer: a grid of the canvas, marked where a nearer layer is solid.
        const cell = 4
        const gw = Math.ceil(w / cell) + 1
        const gh = Math.ceil(h / cell) + 1
        const mask = new Uint8Array(gw * gh)
        const open = (x, y) => {
          const i = Math.floor(x / cell)
          const j = Math.floor(y / cell)
          return i >= 0 && j >= 0 && i < gw && j < gh && mask[j * gw + i] === 0
        }
        const shows = (s) => {
          const breadth = s.long * s.wide
          const ax = Math.cos(s.turn ?? 0)
          const ay = Math.sin(s.turn ?? 0)
          const l = s.long * 0.7
          const b = breadth * 0.7
          return (
            open(s.x, s.y) ||
            open(s.x + ax * l, s.y + ay * l) ||
            open(s.x - ax * l, s.y - ay * l) ||
            open(s.x - ay * b, s.y + ax * b) ||
            open(s.x + ay * b, s.y - ax * b)
          )
        }
        const fill = ([x, y, a, b]) => {
          const j0 = Math.max(0, Math.floor((y - b) / cell))
          const j1 = Math.min(gh - 1, Math.floor((y + b) / cell))
          for (let j = j0; j <= j1; j += 1) {
            const t = ((j + 0.5) * cell - y) / b
            if (t * t >= 1) {
              continue
            }
            const reach = a * Math.sqrt(1 - t * t)
            const i0 = Math.max(0, Math.ceil((x - reach) / cell))
            const i1 = Math.min(gw - 1, Math.floor((x + reach) / cell) - 1)
            for (let i = i0; i <= i1; i += 1) {
              mask[j * gw + i] = 1
            }
          }
        }
        for (let li = layers.length - 1; li >= 0; li -= 1) {
          layers[li].strokes = layers[li].strokes.filter(shows)
          layers[li].solid.forEach(fill)
        }
        let n = 0
        layers.forEach((l, li) => {
          l.strokes.forEach((s, si) => {
            put((n += 1), { ...s, order: 560.5 + li * 0.01 + si * 1e-6 })
          })
        })

        // The egrets. Each painted round the canvas's middle (the shader carries it where it is, see schoolVertex), as
        // the reference's are: a soft light round it, its long wings raised in a shallow V from its shoulder, each a
        // brush stroke broad at the arm, a narrower one out to the wrist's far side and a fine one to a pointed tip (the
        // near wing larger), a slender body, its neck forward to a small head and a fine bill, and its legs trailing
        // behind. A far one is a little misty.
        const hx = half
        const hy = h / 2
        const birdScale = FO_BIRD_SCALE(w)
        FO_BIRDS.forEach((b, i) => {
          const len = b.size * birdScale
          const phase = 400 + i
          const base = 2000 + i * 0.1
          const at = (lx, ly) => ({ x: hx + lx * len, y: hy + ly * len })
          const span = (a, z) => ({
            ...at((a[0] + z[0]) / 2, (a[1] + z[1]) / 2),
            long: (Math.hypot(z[0] - a[0], z[1] - a[1]) / 2) * len,
            turn: Math.atan2(z[1] - a[1], z[0] - a[0]),
          })
          const id = 90000 + i * 20
          const far = b.far === 1
          const near = far ? ['foBirdFar', 'foBirdFarShade'] : ['skBird', 'skBirdSoft']
          const back = far ? ['foBirdFarShade', 'foBirdFarShade'] : ['skBirdSoft', 'skBirdShade']
          const wing = (k, s, wr, tp, part, paints, order) => {
            const pre = [wr[0] + (tp[0] - wr[0]) * 0.55, wr[1] + (tp[1] - wr[1]) * 0.55]
            // the hand broad to its end and rounded there, as a heron's is, not a tern's needle
            const end = [tp[0] + (tp[0] - wr[0]) * 0.02, tp[1] + (tp[1] - wr[1]) * 0.02]
            put(id + k, {
              ...span(s, wr),
              wide: 0.44,
              blur: len * 0.008,
              paints,
              load: 0.97,
              kind: FO_LEAF,
              order: base + order,
              phase: phase + part,
            })
            put(id + k + 1, {
              ...span([s[0] + (wr[0] - s[0]) * 0.8, s[1] + (wr[1] - s[1]) * 0.8], pre),
              wide: 0.36,
              blur: len * 0.006,
              paints,
              load: 0.96,
              kind: FO_LEAF,
              order: base + order + 0.0002,
              phase: phase + part,
            })
            put(id + k + 2, {
              ...span(pre, end),
              wide: 0.28,
              blur: len * 0.005,
              paints,
              load: 0.95,
              kind: FO_LEAF,
              order: base + order + 0.0004,
              phase: phase + part,
            })
          }
          put(id, {
            ...at(0, -0.06),
            long: len * 0.3,
            wide: 0.7,
            blur: len * 0.25,
            paints: ['skBirdGlow', 'skBirdGlow'],
            load: far ? 0.05 : 0.08,
            order: base,
            phase,
          })
          // the far wing, up and back
          wing(1, [-0.02, -0.01], [-0.17, -0.095], [-0.41, -0.2], 0.2, back, 0.001)
          // the legs, long and trailing well behind its tail as an egret's do, the body, the neck, the head and its bill
          put(id + 4, {
            ...span([-0.15, 0.012], [-0.44, 0.034]),
            wide: 0.04,
            blur: 0.4,
            paints: ['foLeg', 'foLeg'],
            load: 0.8,
            kind: FO_LEAF,
            order: base + 0.0025,
            phase,
          })
          put(id + 5, {
            ...span([-0.18, 0.014], [0.1, -0.004]),
            wide: 0.25,
            blur: len * 0.008,
            paints: near,
            load: 0.98,
            kind: FO_LEAF,
            order: base + 0.003,
            phase,
          })
          put(id + 6, {
            ...span([0.07, -0.002], [0.17, -0.045]),
            wide: 0.27,
            blur: len * 0.006,
            paints: [near[0], near[0]],
            load: 0.97,
            kind: FO_LEAF,
            order: base + 0.004,
            phase,
          })
          put(id + 7, {
            ...at(0.183, -0.048),
            long: len * 0.028,
            wide: 0.95,
            blur: len * 0.005,
            paints: [near[0], near[0]],
            load: 0.98,
            kind: FO_LEAF,
            order: base + 0.005,
            phase,
          })
          put(id + 8, {
            ...span([0.198, -0.048], [0.28, -0.042]),
            wide: 0.1,
            blur: 0.4,
            paints: ['foBill', 'foBill'],
            load: 0.85,
            kind: FO_LEAF,
            order: base + 0.006,
            phase,
          })
          // the near wing, up and forward, larger
          wing(9, [0.01, -0.01], [0.17, -0.105], [0.39, -0.225], 0.4, near, 0.007)
        })
      },
    }

    /* --- the ai-platforms page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/ai-platforms, after Cameron's picture: a soft blue sky over the dark shoulder of a hill in
       deep shadow, and across the slope under it a broad band of flowers in a beam of light, coral, peach, pink and a
       fresh green, soft as if out of focus, and tiny white flowers in the dark grass in front. Now and then a breath of
       wind goes through the band from the left, unseen, as the home page's passer goes through its meadow: the flowers and
       the grass part round it and spring back after it, the grass it has just gone through is swept up behind it, and a
       few pale petals fly after it, rising and falling, coming in and going out through the glass at the sides. The sky
       comes in from nothing just under the buttons, as the overview's forest's mist does, so that it has no top edge and
       nothing is painted behind or round the words. Under the words the hill
       stays low and comes in as a dusky blue that darkens down the slope; out to the right of them its shoulder rises
       steeply beside the buttons, and on the left it falls away. The band runs down across it from the left, where the
       light reaches up to the crest, and narrows to the right, and the dark slope rises across the foot and fades into
       the page. By day the sky is a soft blue; at night it is deep, a few stars are out over the hill and the band still
       glows, as if lit from within. */
    const AP_EVEN = 0.005
    const AP_HAZE = 0.4 + AP_EVEN
    // paint with no bristles, whose soft edge breaks into the grain's specks as dry paint does
    const AP_LEAF = 0.25
    const AP_TWINKLE = 3.25 + AP_EVEN
    const AP_GLIMMER = 3.4 + AP_EVEN
    // the larger and the smaller of two lines, met in a round rather than a corner (k is how broad the round is)
    const apMax = (a, b, k) => (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2
    const apMin = (a, b, k) => (a + b - Math.sqrt((a - b) ** 2 + k * k)) / 2
    // how far past a place a line has gone, coming on gently over `knee` pixels rather than at a corner
    const apPast = (x, from, knee) => {
      const z = (x - from) / knee
      return z > 20 ? x - from : knee * Math.log1p(Math.exp(z))
    }
    /* The picture's lines, in CSS pixels down the canvas at a place across it. Their slants are slants on the screen,
       not shares of the picture, so that a wide canvas keeps the picture's diagonals rather than flattening them into
       stripes; on a phone, where the picture is nearly as tall as it is wide, they are as steep as its shares give.
         The crest: low under the words (never higher than four tenths of the way down the picture there), rising
       gently to the right and falling away to the left; and past the words on the right, the hill's shoulder, rising
       steeply and rounding over beside the buttons, never above them.
         The shade's edge, the band's top: just under the crest on the left, where the light reaches up to it, and going
       down across the slope to the right.
         The dark slope's top, the band's foot: low on the left and rising to the right, so that the band narrows that
       way, as the light falls across the slope in the picture; never narrower than an eighth of the picture. */
    const apLines = ({ w, h, words }) => {
      const top = words.y + words.b + 3
      const pic = h - top
      const sc = SK_SCALE(w)
      const mid = words.x
      const narrow = 1 - smooth(560, 980, w)
      const gentle = Math.max(0.05, (0.2 * pic) / w)
      const crestMid = top + (0.46 - 0.1 * narrow) * pic
      const lowest = top + 0.62 * pic
      const from = words.x + words.a + 28
      const knee = 46
      // how high the shoulder may climb: to a little under the buttons' foot, beside them, never above it
      const cap = top + 0.06 * pic
      const room = Math.max(0, crestMid - gentle * (from - mid) - cap)
      const crestBase = (x) => crestMid - gentle * (x - mid - apPast(x, from, knee))
      const shoulder = (x) => (room > 1 ? room * (1 - Math.exp((-apPast(x, from, knee) * 0.26) / room)) : 0)
      const crest = (x) =>
        apMin(lowest, crestBase(x), 30) -
        shoulder(x) +
        (2.2 * Math.sin(x / 151 + 1.3) + 0.9 * Math.sin(x / 47 + 0.4)) * Math.max(0.7, sc)
      const sl = Math.max(0.03, (0.13 * pic) / w)
      const slopeMid = top + (0.8 - 0.03 * narrow) * pic
      const slope = (x) =>
        apMax(top + 0.6 * pic, apMin(h - 0.035 * pic, slopeMid - sl * (x - mid), 16), 16) +
        1.6 * Math.sin(x / 97 + 0.5) * Math.max(0.7, sc)
      const sh = Math.max(0.045, (0.175 * pic) / w)
      const shadeMid = crestBase(mid) + (0.045 + 0.1 * narrow) * pic
      const shadow = (x) =>
        apMax(
          crest(x) + 0.035 * pic,
          apMin(
            shadeMid + sh * (x - mid) + 2.6 * Math.sin(x / 173 + 2) * Math.max(0.7, sc),
            slope(x) - 0.13 * pic,
            0.06 * pic,
          ),
          0.05 * pic,
        )
      return { top, pic, crest, shadow, slope }
    }
    /* The wind's way through the band, in the land's terms. The land is laid out as the engine lays it out (see landSteps):
       a room of at most 256 CSS pixels standing on the canvas's foot, 1.3 rooms deep from the hill's line to the land's
       foot, which on every canvas this page gives puts the band's middle about this far down at the canvas's middle and
       falling a little to the right (so much more or less at either edge), however the band's own lines run on the
       screen. The passer walks the hill's line 0.03 under it (see placePasser, with no `wander` and its lane at the line),
       so the hill's line, which nothing here draws, is laid that far over the way. */
    const AP_ROOM = 256
    const AP_FOOT = 19
    const AP_HEAD = 12
    const AP_DEEP = 1.3
    const AP_LEAST = 110
    const apLand = (h) => {
      const room = Math.max(AP_LEAST, Math.min(AP_ROOM, (h - AP_FOOT - AP_HEAD) / AP_DEEP))
      return { room, base: h - AP_FOOT - AP_DEEP * room }
    }
    const AP_D0 = 0.962
    const AP_D1 = -0.03
    /* How the wind goes, so that the passer keeps with the petals on any canvas: the school is scaled with the canvas's
       width (see `size`), so its round takes the same time on all of them, and the passer's walk across and its round are
       those times. The wind crosses any canvas in AP_CROSS seconds; at the clock's start it is AP_START of the width
       across, so that it is a little left of the middle at the clock the still picture is painted at (see stillAt). The
       school's first fish is the grass swept up behind it, whose length (more than it is ever drawn) gives the round its
       run in and out at the sides, and so the pause between one breath and the next. */
    const AP_UNIT = 1232
    /* the width of the canvas the school was last scaled to (see school.size): the wind lays its stirs at a steady time
       apart rather than a steady distance, so that on a phone, where it goes slower across, its parting runs on smoothly
       instead of coming and going in pulses */
    let apW = AP_UNIT
    const AP_CROSS = 15
    const AP_WAKE_UNIT = 90
    const AP_MARGIN = (2.5 * AP_WAKE_UNIT) / AP_UNIT
    const AP_SPAN = 1 + 2 * AP_MARGIN
    const AP_START = -0.173
    const AP_PHASE = (AP_START + AP_MARGIN) / AP_SPAN
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const apHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    // how large the swept grass and the petals are drawn: as on a laptop, a little smaller on a phone
    const apSize = (w) => Math.min(1.1, Math.max(0.8, w / AP_UNIT))
    /* The swept grass, and the petals after it: each petal at the wind's pace, a little behind it and above, rising and
       falling slowly and turning over as it goes (its `flap`, about its own middle). */
    const AP_PETALS = 6
    const AP_FISH = [
      {
        size: AP_WAKE_UNIT,
        speed: AP_UNIT / AP_CROSS,
        lane: 1,
        phase: AP_PHASE,
        drift: 0,
        period: 4,
        surge: 0,
        surgePeriod: 0,
        // the swept blades flick a little, a wave running back along them
        beat: 0.8,
        wag: 0.02,
        flap: 0,
        glide: 0,
        seed: 0.31,
      },
      ...Array.from({ length: AP_PETALS }, (_, k) => {
        const r = (j) => apHash(k * 7.9 + j * 3.3 + 1.7)
        return {
          size: 8,
          speed: AP_UNIT / AP_CROSS,
          lane: 0.15 + 0.6 * r(1),
          phase: AP_PHASE - (0.025 + 0.08 * ((k * 0.618034 + 0.2) % 1)) / AP_SPAN,
          drift: 5 + 6 * r(2),
          period: 2.8 + 1.8 * r(3),
          surge: 4 + 6 * r(4),
          surgePeriod: 3 + 2.5 * r(5),
          beat: 0.4 + 0.35 * r(6),
          wag: 0,
          flap: 0.9 + 0.5 * r(7),
          glide: 0,
          seed: r(8),
          ...(k >= 4 ? { from: 700 } : {}),
        }
      }),
    ]
    // one of those lines as a sheet's guide, in the land's terms (a share of the half-width across, rooms down), so many
    // places along it that the land's curve through them keeps to it within a fraction of a pixel
    const apGuide = (pick) => (stage) => {
      const line = pick(apLines(stage))
      return Array.from({ length: 97 }, (_, k) => {
        const across = -1.6 + k * (3.2 / 96)
        const y = line(((1 + across) / 2) * stage.w)
        return [Math.round(across * 10000) / 10000, Math.round(((y - stage.base) / stage.room) * 100000) / 100000]
      })
    }
    // The land's inks, light and dark: the sky, the hill in its shade, the band in the light and the dark slope.
    const AP_INKS = {
      ...SK_INKS,
      apSkyTop: ['#d3e3f7', '#141b38'],
      apSkyHigh: ['#a6c8ef', '#172044'],
      apSkyMid: ['#7aade5', '#1a244e'],
      apSkyLow: ['#78abe4', '#1b2652'],
      // the hill: a dusky blue where it comes in at its crest, darkening down into its deep shade
      apHillMist: ['#6f88c6', '#0e1430'],
      apHillDusk: ['#34477e', '#0a0f24'],
      apHillTop: ['#111e2c', '#080b1a'],
      apHill: ['#0e1a26', '#05070f'],
      apHillLow: ['#1a2a55', '#0a1029'],
      apBandTop: ['#5862ba', '#353a8e'],
      apPeach: ['#f39a58', '#f0904c'],
      apCoral: ['#ee7f5f', '#ec6f58'],
      apGreen: ['#9cbf5a', '#8cb64e'],
      apPink: ['#ef8fa6', '#ea7c9a'],
      apSalmon: ['#f39582', '#f08470'],
      apGlow: ['#f8b0a0', '#f49c8c'],
      apSlopeTop: ['#19251f', '#0c130f'],
      apSlope: ['#111a17', '#080d0b'],
      apSlopeFoot: ['#4b5856', '#0b110f'],
      apSlopeLow: ['#c9d1d4', '#0c1210'],
      // where the wind has just gone through the band its lines show their paler side, warm in the light
      sheen: ['#fde4c8', '#f8d0ac'],
      // the leaves among the flowers, a fresh green in the light
      deepGreen: ['#5fa45a', '#4a8a4c'],
      shade: ['#4f9256', '#3c7646'],
      leaf: ['#8cc46c', '#6eaa5e'],
    }
    const AP_FADE_AT = (stage) => {
      const foot = stage.words.y + stage.words.b
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    const UC_AI_PLATFORMS = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      inks: AP_INKS,
      // no beads (on the hill they read as stars by day), and none of no size either: a chance of none still lets
      // through the one bead whose dice come up exactly nought, a white speck on the dark hill; the gaps between the lines
      // not lifted at all and only short breaks in their long runs, so that the hill reads as deep velvet paint rather
      // than as corduroy or brickwork; and the small oval of page
      lines: { ...SKY.lines, beadChance: 0, beadSize: 0, lift: 0, brick: [90, 260], gap: 0.5, veil: [80, 18] },
      /* The sky's lines come in from nothing under the buttons, pale and few, so that where they start is no edge: slowly,
         over more than half the picture, as the overview's forest's mist does. */
      fade: {
        at: AP_FADE_AT,
        ease: 1.15,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      onPage: true,
      land: {
        ...SKY.land,
        // the hill's line, under the wind's way (see AP_D0): the passer walks it; nothing draws it
        profile: [
          [-1.6, AP_D0 - 0.03 - 1.6 * AP_D1],
          [1.6, AP_D0 - 0.03 + 1.6 * AP_D1],
        ],
        sheets: [
          // the sky, from just under the buttons' foot down, fading in
          {
            ...SKY.land.sheets[0],
            paint: [
              [0, 'apSkyTop', 0.4],
              [0.1, 'apSkyTop', 1],
              [0.2, 'apSkyHigh', 1],
              [0.32, 'apSkyMid', 1],
              [0.45, 'apSkyLow', 1],
              [1, 'apSkyLow', 1],
            ],
            fade: true,
            fill: 0.9,
            under: 1,
            patch: 0.05,
            beads: [0, 0],
          },
          /* The hill in its shade, from its crest down to a little under the band's top, where the band covers it: a
             dusky blue at the crest, darkening over its first stretch into the deep shade, so that under the words the
             dark comes in down the slope rather than all at once at the crest. Its paint is a share of the way from the
             crest to its foot, which is never less than this far under the crest, so the darkening is the same depth
             everywhere. */
          {
            name: 'hill',
            opaque: true,
            laid: true,
            top: apGuide((l) => l.crest),
            foot: apGuide((l) => (x) => apMax(l.crest(x) + 0.45 * l.pic, l.shadow(x) + 0.1 * l.pic, 12)),
            paint: [
              [0, 'apHillMist', 0.8],
              [0.1, 'apHillDusk', 0.9],
              [0.22, 'apHillTop', 1],
              [0.32, 'apHill', 1],
              [0.8, 'apHill', 1],
              [1, 'apHillLow', 1],
            ],
            fill: 0.9,
            under: 1,
            patch: 0.12,
            flow: 0,
            breath: 0,
            beads: [0, 0],
          },
          // the band in the light, from the hill's shade down to under the dark slope's top
          {
            name: 'band',
            opaque: true,
            laid: true,
            top: apGuide((l) => l.shadow),
            foot: apGuide((l) => (x) => l.slope(x) + 0.03 * l.pic),
            paint: [
              [0, 'apBandTop', 0],
              [0.06, 'apBandTop', 0.5],
              [0.15, 'apPeach', 0.95],
              [0.3, 'apCoral', 1],
              [0.42, 'apGreen', 1],
              [0.66, 'apGreen', 1],
              [0.76, 'apPink', 1],
              [0.9, 'apSalmon', 1],
              [1, 'apGlow', 1],
            ],
            fill: 0.9,
            under: 0.9,
            patch: 0.2,
            flow: 0.3,
            breath: 0.6,
            beads: [0.4, 0.4],
            sheen: 1,
          },
          // the dark slope in front, down to the canvas's foot, where it pales by day so that it goes into the page gently
          {
            name: 'slope',
            opaque: true,
            laid: true,
            top: apGuide((l) => l.slope),
            foot: (stage) => {
              const y = (stage.h + 2 - stage.base) / stage.room
              return [
                [-1.6, y],
                [1.6, y],
              ]
            },
            paint: [
              [0, 'apSlopeTop', 0.95],
              [0.08, 'apSlope', 1],
              [0.55, 'apSlope', 1],
              [0.85, 'apSlopeFoot', 1],
              [1, 'apSlopeLow', 1],
            ],
            fill: 1,
            under: 1,
            patch: 0.15,
            flow: 0,
            breath: 0,
            beads: [0, 0],
          },
          SKY.land.sheets[1],
        ],
      },
      // the engine's painted flowers, out of focus, planted along the band (see the plant); none of its own drifts
      flowers: {
        ...FLOWERS,
        drifts: [],
        strays: 0,
        focus: 0.3,
        blur: { behind: 0.9, deepest: 1.8, front: 0.8, most: 0.55, least: 0.85 },
        crisp: 0,
        stems: 0,
        leaves: 0.12,
        bed: 0,
        fade: [0.1, 0.32, 0.72],
      },
      // the band's flowers by where in it they stand, glowing in the light: no whites or creams except a few at its foot
      palettes: {
        ...PALETTES,
        apHigh: [
          ['peach', 3],
          ['butter', 2],
          ['salmon', 2],
          ['coral', 1.2],
          ['gold', 0.6],
        ],
        apMid: [
          ['coral', 3],
          ['salmon', 2],
          ['pink', 1.4],
          ['peach', 1],
          ['red', 0.4],
        ],
        apGreen: [
          ['coral', 2.4],
          ['salmon', 1.4],
          ['pink', 1],
          ['peach', 0.6],
          ['red', 0.3],
        ],
        apLow: [
          ['pink', 3],
          ['rose', 1],
          ['lilac', 1.1],
          ['salmon', 1.4],
        ],
        apEdge: [
          ['salmon', 2.5],
          ['pink', 2.4],
          ['cream', 0.2],
          ['white', 0.15],
          ['coral', 1.4],
        ],
      },
      /* The wind: the home page's unseen passer, walking the hill's line at the petals' pace, starting where they start at
         the clock's start (AP_START) and coming round with them, so that the band parts wherever they fly. */
      passer: {
        first: (-0.075 - AP_START) * AP_CROSS,
        every: AP_SPAN * AP_CROSS,
        across: 1.15 * AP_CROSS,
        lane: 0,
        wander: 0,
        push: 1.8,
      },
      stir: {
        ...STIR,
        reach: 58,
        life: 3,
        get every() {
          return Math.max(2.4, Math.min(9, (9 * apW) / AP_UNIT))
        },
      },
      clouds: [],
      flock: [],
      // the forest's glass: soft frosted wisps at the sides as a petal comes in and goes out, no long bars, nothing twice
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 2.6,
        halo: [2.6, 0.2],
      },
      stillAt: 8,
      school: {
        fish: AP_FISH,
        // scaled with the canvas's width, so that a round takes the same time on any (see AP_CROSS)
        size: (w) => {
          apW = w
          return w / AP_UNIT
        },
        turn: 0.14,
        // the swept grass on the wind's way, the petals up to a little over a blade's height above it, all rising to the
        // left as the way does
        band: ({ w, h }) => {
          const { room, base } = apLand(h)
          const y0 = base + room * AP_D0
          return [y0 - 50 * apSize(w), y0, 2 * room * AP_D1]
        },
        reach: [0.8, 0.8],
        // they never swerve from the pointer: the wind does not see it
        scatter: { radius: 1, push: 0, back: 1 },
      },
      paints: {
        ...PAINTS,
        // the flowers in the light: glowing corals, peaches and pinks, a little lilac, and whites warmed by the light
        red: ['#ef715c', '#f87a62'],
        coral: ['#f27a5c', '#fb7f5e'],
        salmon: ['#f6977c', '#fc9c80'],
        peach: ['#f8a76a', '#feae6e'],
        pink: ['#f28aa4', '#fa90ab'],
        rose: ['#ec809b', '#f58aa4'],
        lilac: ['#c8a8e6', '#cbaaef'],
        butter: ['#f6c25a', '#fcca62'],
        gold: ['#f2b14e', '#f8bb5a'],
        cream: ['#fde2cf', '#ffe5d2'],
        white: ['#fff2ea', '#fff3ec'],
        // the wash over the sky where it comes in under the buttons, one even blue down to the hill (and one at night)
        apWashTop: ['#e6eefa', '#161d3e'],
        apWashHigh: ['#cddff5', '#18214a'],
        apWashMid: ['#a9c9ef', '#1a2450'],
        apWash: ['#8ab6e8', '#1b2654'],
        // the hill's own dusky colour at its crest, as its land ink is
        apHillMist: ['#6f88c6', '#0e1430'],
        // the night's stars, hardly to be told from the sky by day
        apStar: ['#a8c9ef', '#ffffff'],
        apStarGlow: ['#a0c3ed', '#fff4d8'],
        // the hill: the blue in its shade, and the light off the band glowing up into it
        apHillSpeck: ['#3a56a8', '#24337a'],
        apHillGlow: ['#3f4fb4', '#283490'],
        // the band's light
        apGlowViolet: ['#7c78d2', '#5a56b6'],
        apGlowPeach: ['#f5a560', '#f29452'],
        apGlowGold: ['#f6b552', '#f4a646'],
        apGlowBeam: ['#f9cc72', '#f6bb5c'],
        apGlowCoral: ['#f07c5c', '#ec6c54'],
        apGlowGreen: ['#a6c862', '#92bc58'],
        apGlowPink: ['#f292aa', '#ec7e9c'],
        apGlowSalmon: ['#f59a84', '#f18a74'],
        apGlowWhite: ['#f9bba8', '#f4a894'],
        // the veil of light over the flowers
        apVeilWarm: ['#fde8d2', '#fbd3b4'],
        apVeilPink: ['#fde3e6', '#fcd0d6'],
        // the lit grass in the band
        apGrassLit: ['#bcd86a', '#a8cc60'],
        apGrass: ['#94c25c', '#80b456'],
        apGrassDeep: ['#68a650', '#58944a'],
        // the dark slope's grass, and the light catching a blade's tip against the band
        apEdgeDark: ['#121b18', '#080d0b'],
        apBlade: ['#14201d', '#080e0c'],
        apBladeDeep: ['#0d1512', '#050907'],
        apBladeLit: ['#34483f', '#22322a'],
        apBladeWarm: ['#b97a6c', '#a86a5c'],
        // the grass the wind sweeps up behind it, and the light catching its tips
        apWake: ['#9cc85e', '#86b854'],
        apWakeDeep: ['#6aa452', '#5a9248'],
        apWakeTip: ['#e6e79a', '#dcd88a'],
        // the petals after it
        apPetal: ['#fff5ee', '#fff0e8'],
        apPetalShade: ['#f7d9cc', '#ecc7b8'],
        // the tiny white flowers in it
        apDot: ['#e6eefa', '#d8e3f6'],
        apFootMist: ['#d4dce2', '#0f1412'],
        apDotBlue: ['#b6c8ea', '#a2b6e0'],
      },
      plant: (garden) => {
        const { w, h, rand } = garden
        const sc = SK_SCALE(w)
        const { top, pic, shadow: shadowY, slope: slopeY } = apLines(garden)
        const at = (f) => top + f * pic
        // the hill's top line as the land draws it, so that what is laid along it keeps to it to the pixel
        const crestY = (x) => garden.ground('hill', x)
        // strokes keep more of their size on a short or narrow canvas than the width alone would give them
        const rs = Math.max(sc, Math.min(0.85, pic / 380))
        // and on a canvas much wider than a laptop's, the fine things a little sparser, so that it costs no more to paint
        const wideFew = Math.max(1, (w / 1300) ** 0.35)
        const wideFewer = Math.max(1, (w / 1300) ** 0.6)
        let n = 0
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = (o) => {
          n += 1
          rand.reseed(58001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: AP_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            y: root,
            stem: root - o.y,
            lean: 0,
            stiff: 1,
          })
        }
        // how much of its load a stroke shows, by the engine's measure: a soft one's colour thins as it spreads
        const bodyOf = (reach, breadth, blur) => {
          const grow = ((reach * breadth) / ((reach + 0.5 * blur) * (breadth + 0.5 * blur))) ** 0.85
          return grow + (1 - grow) * 0.5 * smooth(3, 7, blur)
        }
        /* A soft level stroke, laid as an upright one of the same shape and softness. The engine lights every stroke from
           above, paler along its upper side; along a long level stroke that is a pale line, so that rows of them read as
           streaks, and a dark one along the crest as a line of light. An upright one is lit only at its top end, hardly
           at all. (half: its half-length across; depth: its half-thickness; soft: how soft its upper and lower edges are;
           slant: the angle it lies at.) */
        const lay = ({ x, y, half, depth, soft, slant = 0, paints, load, order }) => {
          const d = Math.max(0.4, depth)
          const blur = (soft * half) / d
          const k = bodyOf(half, d, soft) / bodyOf(d, half, blur)
          put({
            x,
            y,
            long: d,
            wide: half / d,
            turn: Math.PI / 2 + slant,
            blur,
            paints,
            load: Math.min(1, load * k),
            order,
          })
        }
        // a stroke standing on its own foot, which sways in the wind about it: a blade of grass
        const grow = ({ x, y, tall, ...o }) => {
          n += 1
          rand.reseed(59001 + n * 7919)
          garden.dab({
            kind: AP_LEAF,
            blur: 0.5,
            load: 0.85,
            stiff: 0.55,
            ...o,
            x,
            y,
            stem: tall / 2,
            long: tall / 2,
            turn: -Math.PI / 2,
          })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const r = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.53)
          const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * u
          const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875
        // the highest and the lowest a line comes on the canvas
        const span = (line) => {
          let lo = Number.POSITIVE_INFINITY
          let hi = Number.NEGATIVE_INFINITY
          for (let x = -20; x <= w + 20; x += 8) {
            lo = Math.min(lo, line(x))
            hi = Math.max(hi, line(x))
          }
          return [lo, hi]
        }

        /* The wash over the sky, so that its lines show through it only as a grain: rows from just under the buttons down to
           the hill's crest, each following the crest as a share of the way down to it and overlapping the next, so that
           they lie as one wash however close the crest comes and none stands out as a stripe; coming in from nothing under
           the buttons, pale at first, and the last row right along the crest, never over the hill. Each is laid upright
           (see lay), so that no row has a pale upper edge to read as a streak. */
        const washLong = clamp(0.035 * w, 28, 60)
        const WASH_ROWS = 20
        // (from nearly the page's own white where it comes in, through paler blues, to the sky's, as the forest's mint does)
        const washInk = (f) => (f < 0.06 ? 'apWashTop' : f < 0.14 ? 'apWashHigh' : f < 0.24 ? 'apWashMid' : 'apWash')
        const rowAt = (x, t) => top + 3 + t * (crestY(x) - 1.5 - top - 3)
        for (let r = 0; r < WASH_ROWS; r += 1) {
          for (let k = -1; k * washLong * 0.8 < w + washLong; k += 1) {
            const q = r * 131 + k * 17 + 9
            const x = (k + hashed(q * 1.3)) * washLong * 0.8
            if (crestY(x) - top < 10) {
              continue
            }
            // (each stroke a little off its row, up or down, so that the rows' edges never line up into ridges)
            const t = clamp((r + 0.5 + (hashed(q * 5.7) - 0.5) * 1.0) / WASH_ROWS, 0.01, 0.985)
            const y = rowAt(x, t)
            const spacing = (crestY(x) - top) / WASH_ROWS
            // (each well over the next, and the last ones short of the crest, so that their edges do not all pile up along
            // it into a line of light)
            const depth = Math.max(0.8, Math.min(spacing * 2, (crestY(x) - y) * 0.7 + 0.6))
            const f = (y - top) / pic
            // (in early, as the forest's wash is, so that the first of the lines are in it rather than standing alone
            // over the page as hairlines)
            const come = smooth(0, 0.22, f)
            if (come < 0.01) {
              continue
            }
            const ink = washInk(f + (hashed(q * 2.9) - 0.5) * 0.03)
            const turn = Math.atan2(rowAt(x + 8, t) - rowAt(x - 8, t), 16)
            const most = 0.4 + 0.12 * smooth(0.45, 0.75, t)
            lay({
              x,
              y,
              half: washLong,
              depth,
              soft: depth,
              slant: turn,
              paints: [ink, ink],
              load: most * come * (0.9 + 0.2 * hashed(q * 4.3)),
              order: 100 + t,
            })
          }
        }
        // and one fine row of the hill's own dusky colour right on its crest, its soft edges closing the hair of page that
        // would show between the sky and the hill (in short strokes, so that each keeps to the crest where it curves, and
        // upright, since a level one's pale upper edge would be a line of light along the crest)
        for (let x = -6; x < w + 6; x += 3) {
          const turn = Math.atan2(crestY(x + 3) - crestY(x - 3), 6)
          lay({
            x,
            y: crestY(x) - 0.6,
            half: 2.4,
            depth: 1.3,
            soft: 0.6,
            slant: turn,
            paints: ['apHillMist', 'apHillMist'],
            load: 0.95,
            order: 101,
          })
        }
        // A few stars over the hill, out at night and hardly to be told from the sky by day.
        for (let k = 0; k < 26; k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const ceil = crestY(x) - 8
          const y = at(0.12) + hashed(k * 3.7 + 0.9) ** 1.2 * (ceil - at(0.12))
          if (y > ceil || y < at(0.1)) {
            continue
          }
          const r = (0.8 + 1.3 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          put({
            x,
            y,
            long: r * 1.5,
            wide: 1,
            blur: r * 1.1,
            paints: ['apStarGlow', 'apStarGlow'],
            load: 0.1,
            kind: AP_GLIMMER,
            order: 110,
          })
          put({
            x,
            y,
            long: r * 0.5,
            wide: 1,
            blur: r * 0.2,
            paints: ['apStar', 'apStar'],
            load: 1,
            kind: AP_TWINKLE,
            order: 110.1,
          })
        }

        /* The hill: its shade is its lines; over them, specks of a deeper blue, more and more of them down towards the
           band, and the band's light glowing up into it there. */
        const specks = Math.round((w * pic * 0.2) / (45 * wideFew * wideFew))
        for (let k = 0; k < specks; k += 1) {
          const x = hashed(k * 1.37 + 0.2) * w
          const c = crestY(x) + 3
          const s = shadowY(x)
          if (s - c < 4) {
            continue
          }
          const t = hashed(k * 2.11 + 0.7)
          const y = c + t * (s - c)
          if (hashed(k * 3.3 + 0.1) > 0.12 + 0.88 * t ** 1.6) {
            continue
          }
          const r = (0.6 + 0.9 * hashed(k * 4.7) ** 2) * Math.max(0.8, rs)
          put({
            x,
            y,
            long: r,
            wide: 0.8,
            turn: hashed(k * 5.9) * 3,
            blur: 0.4,
            paints: ['apHillSpeck', 'apHillSpeck'],
            load: 0.25 + 0.45 * t,
            kind: AP_LEAF,
            order: 150,
          })
        }
        const glowStep = clamp(0.04 * w, 26, 60)
        for (let x = -glowStep; x < w + glowStep; x += glowStep * 0.7) {
          const d = shadowY(x) - crestY(x)
          const v = Math.min(0.045 * pic, d * 0.3)
          if (v < 2) {
            continue
          }
          lay({
            x,
            y: shadowY(x) - v * 0.7,
            half: glowStep,
            depth: v,
            soft: v * 0.9,
            paints: ['apHillGlow', 'apHillGlow'],
            load: 0.16 + 0.06 * hashed(x * 0.37),
            order: 160,
          })
        }

        /* The band's light: soft broad strokes along it, from the violet where the hill's shade ends, through the warm peach
           and gold at its top, coral, the fresh green in its broad middle and pink, to the glow along its lower edge, each
           row following the band's slant at its height and no deeper than the room it has over the dark slope. */
        const bandAt = (x, v) => shadowY(x) + v * (slopeY(x) - shadowY(x))
        // the band's colours lie in drifts across it rather than in stripes along it: a slow wander of each zone up and down
        const wander = (x, v) => 0.09 * (fbm(x / (230 * rs) + 1.7, v * 2.2 + 3.1) - 0.5)
        const ZONES = [
          [0.02, 'apGlowViolet', 0.28],
          [0.12, 'apGlowPeach', 0.5],
          [0.24, 'apGlowGold', 0.5],
          [0.36, 'apGlowCoral', 0.45],
          [0.47, 'apGlowGreen', 0.55],
          [0.56, 'apGlowGreen', 0.6],
          [0.65, 'apGlowGreen', 0.5],
          [0.76, 'apGlowPink', 0.45],
          [0.87, 'apGlowSalmon', 0.5],
          [0.95, 'apGlowWhite', 0.55],
        ]
        const zoneStep = clamp(0.035 * w + 14, 22, 70)
        ZONES.forEach(([v, paint, most], z) => {
          for (let k = -1; k * zoneStep * 0.75 < w + zoneStep; k += 1) {
            const q = z * 131 + k * 17 + 3
            const x = (k + (z % 2) * 0.5 + (hashed(q * 1.3) - 0.5) * 0.4) * zoneStep * 0.75
            const vv = clamp(
              v + (hashed(q * 2.1) - 0.5) * 0.04 + (z > 0 && z < ZONES.length - 1 ? wander(x, v) : 0),
              0.01,
              0.97,
            )
            const y = bandAt(x, vv)
            const band = slopeY(x) - shadowY(x)
            const turn = Math.atan2(bandAt(x + 10, vv) - bandAt(x - 10, vv), 20)
            const depth = Math.min(band * 0.13, Math.max(1.2, (slopeY(x) - y) * 0.6))
            // (the green the most broken, in patches, as the grass shows between the flowers)
            const lit =
              paint === 'apGlowGreen'
                ? 0.45 + 1.0 * fbm(x / (110 * rs) + z * 1.3, 4.1)
                : 0.8 + 0.4 * fbm(x / (180 * rs) + z * 1.3, 2.7)
            lay({
              x,
              y,
              half: zoneStep * 0.9,
              depth,
              soft: depth * 0.9,
              slant: turn,
              paints: [paint, paint],
              load: most * lit,
              order: 200 + v,
            })
          }
        })
        /* Where the beam comes in, on the left, the band's top is brightest, a warm gold going into the peach, fading off to
           the right. */
        const beamStep = clamp(0.05 * w + 16, 30, 90)
        for (let k = 0; k * beamStep * 0.6 < 0.55 * w; k += 1) {
          const x = k * beamStep * 0.6
          const fall = 1 - smooth(0, 0.55 * w, x)
          const band = slopeY(x) - shadowY(x)
          const y = bandAt(x, 0.16 + 0.04 * hashed(k * 2.3))
          const turn = Math.atan2(bandAt(x + 10, 0.16) - bandAt(x - 10, 0.16), 20)
          lay({
            x,
            y,
            half: beamStep,
            depth: band * 0.14,
            soft: band * 0.12,
            slant: turn,
            paints: ['apGlowBeam', 'apGlowGold'],
            load: 0.45 * fall,
            order: 260,
          })
        }
        // the fresh green in the band's middle: a stipple of lit grass, among which the flowers stand
        const grassMany = Math.round((w * pic * 0.1) / (8 * rs * rs * wideFewer * wideFewer))
        for (let k = 0; k < grassMany; k += 1) {
          const x = hashed(k * 1.91 + 0.4) * w
          const v = 0.4 + 0.34 * hashed(k * 2.37 + 0.1)
          const y = bandAt(x, v)
          const middle = 1 - Math.abs(v - 0.57) / 0.18
          if (hashed(k * 3.9) > middle * (0.6 + 0.6 * fbm(x / (120 * rs), v * 4))) {
            continue
          }
          const near = (y - top) / pic
          const r = (1.1 + 1.6 * hashed(k * 4.3)) * (0.6 + 0.8 * near) * rs
          const pick = hashed(k * 6.1)
          const paints =
            pick < 0.35
              ? ['apGrassLit', 'apGrass']
              : pick < 0.8
                ? ['apGrass', 'apGrassDeep']
                : ['apGrassDeep', 'apGrass']
          put({
            x,
            y,
            long: r * 1.4,
            wide: 0.45,
            turn: (hashed(k * 7.7) - 0.5) * 0.8,
            blur: 0.5 + r * 0.25,
            paints,
            load: 0.75,
            kind: AP_LEAF,
            order: 300,
          })
        }

        /* The flowers: the engine's own, painted as the meadow's are, each at its depth, small and soft up on the slope and
           larger towards the band's lower edge, out of focus all the way, in patches of colour by where in the band they
           stand: peach and butter at its top, coral, coral among the green, pink and lilac, and the glow at its foot. */
        const yHigh = span(shadowY)[0] - 2
        const yLow = span(slopeY)[1]
        for (let y = yHigh, row = 0; y < yLow; row += 1) {
          const f = (y - top) / pic
          const near = 0.16 + 0.4 * smooth(0.4, 0.86, f)
          const size = garden.sizeAt(near)
          const step = Math.max(3.3 * Math.max(0.8, rs), size * 1.3) * wideFewer
          const dy = step * 0.72
          for (let gx = -step, col = 0; gx < w + step; gx += step, col += 1) {
            const q = row * 7919 + col * 104729 + 11
            const x = gx + (hashed(q * 0.013 + 0.1) - 0.5) * step
            const fy = y + (hashed(q * 0.017 + 0.6) - 0.5) * dy
            const s0 = shadowY(x)
            const s1 = slopeY(x)
            const v = (fy - s0) / (s1 - s0)
            if (v < 0.02 || v > 0.985) {
              continue
            }
            // fewer at the band's top, where it is more light than flowers, and in the green; clumped
            const thick =
              smooth(0.03, 0.32, v) *
              (1 - 0.75 * Math.exp(-(((v - 0.56) / 0.11) ** 2))) *
              (0.55 + 0.7 * fbm(x / (70 * rs) + 3.3, fy / (40 * rs)))
            if (hashed(q * 0.029) > thick) {
              continue
            }
            const vd = v - wander(x, v) + (hashed(q * 0.041) - 0.5) * 0.1
            const palette =
              vd < 0.3 ? 'apHigh' : vd < 0.46 ? 'apMid' : vd < 0.68 ? 'apGreen' : vd < 0.87 ? 'apLow' : 'apEdge'
            rand.reseed(71001 + q)
            garden.flowerAt(x, fy, near + (hashed(q * 0.053) - 0.5) * 0.05, palette, thick)
          }
          y += dy
        }

        /* A veil of light over the flowers, so that they are soft as in a picture taken out of focus: broad, faint strokes
           along the band in the light's own pale colours, none of it reaching down over the dark slope. */
        const VEIL = [
          [0.2, 'apVeilWarm', 0.07],
          [0.45, 'apVeilWarm', 0.05],
          [0.68, 'apVeilPink', 0.06],
          [0.88, 'apVeilPink', 0.08],
        ]
        const veilStep = clamp(0.06 * w + 20, 40, 120)
        VEIL.forEach(([v, paint, most], z) => {
          for (let k = -1; k * veilStep * 0.7 < w + veilStep; k += 1) {
            const q = z * 71 + k * 13 + 5
            const x = (k + (z % 2) * 0.5) * veilStep * 0.7
            const y = bandAt(x, v + (hashed(q * 1.7) - 0.5) * 0.06)
            const band = slopeY(x) - shadowY(x)
            const depth = Math.min(band * 0.2, Math.max(1.5, (slopeY(x) - y) * 0.55))
            const turn = Math.atan2(bandAt(x + 10, v) - bandAt(x - 10, v), 20)
            lay({
              x,
              y,
              half: veilStep * 0.85,
              depth,
              soft: depth,
              slant: turn,
              paints: [paint, paint],
              load: most * (0.7 + 0.6 * hashed(q * 3.1)),
              order: 650 + v,
            })
          }
        })

        /* The dark slope's edge against the band: its own dark just under it, so that no light runs past it, and blades of
           grass standing up out of it in silhouette, a few catching the light at their tips. */
        const edgeStep = clamp(0.025 * w, 14, 34)
        for (let x = -edgeStep; x < w + edgeStep; x += edgeStep * 0.6) {
          const rise = (fbm(x / (60 * rs) + 7.1, 1.9) - 0.5) * 6 * rs
          lay({
            x,
            y: slopeY(x) + 3 * rs + rise,
            half: edgeStep,
            depth: 4.5 * rs,
            soft: 2 * rs,
            slant: Math.atan2(slopeY(x + 5) - slopeY(x - 5), 10),
            paints: ['apEdgeDark', 'apEdgeDark'],
            load: 0.92,
            order: 690,
          })
        }
        /* The blades along it: fine, short, here and there a few standing taller as a meadow's edge does, all leaning a
           little the same way in the wind, dark against the band and now and then one catching its light at the tip. */
        const bladeStep = (1.1 / Math.max(0.8, sc)) * wideFew
        for (let x = -4; x < w + 4; x += bladeStep) {
          const q = Math.round(x * 13.1) + 7
          const bx = x + (hashed(q * 0.013 + 0.3) - 0.5) * bladeStep * 2
          const tuft = smooth(0.55, 0.85, fbm(bx / (30 * rs) + 5.3, 4.4))
          // a fine fringe all along, and here and there a few blades standing taller out of it
          const tall = (2 + 3 * hashed(q * 0.023 + 0.2) + tuft * (1 + 3.5 * hashed(q * 0.047) ** 1.5)) * rs
          const y = slopeY(bx) + (1.2 + 2.2 * hashed(q * 0.019)) * rs
          const warm = tuft > 0.3 && hashed(q * 0.029) < 0.3
          const paints = warm
            ? ['apBladeWarm', 'apBlade']
            : hashed(q * 0.031) < 0.3
              ? ['apBladeLit', 'apBlade']
              : ['apBlade', 'apBladeDeep']
          grow({
            x: bx,
            y,
            tall,
            wide: clamp((0.5 * rs) / (tall / 2), 0.02, 0.3),
            blur: 0.45,
            paints,
            load: 0.85,
            lean: -0.12 + (hashed(q * 0.037) - 0.5) * (0.45 + 0.5 * tuft),
            order: 700 + tuft * 0.5,
          })
        }

        /* The dark slope: a few finer blades in it, a little lighter than its dark, and the tiny white flowers scattered
           through it, more and larger towards the front, all of them in its solid dark rather than where it pales. */
        const fineMany = Math.round((w * 0.25 * pic) / 110)
        for (let k = 0; k < fineMany; k += 1) {
          const x = hashed(k * 2.71 + 0.3) * w
          const s = slopeY(x) + 8 * rs
          if (s > h) {
            continue
          }
          const y = s + hashed(k * 3.17 + 0.5) ** 0.8 * 0.75 * (h - s)
          const tall = (3 + 6 * hashed(k * 4.1)) * rs * (0.8 + (0.6 * (y - s)) / Math.max(1, h - s))
          grow({
            x,
            y,
            tall,
            wide: clamp((0.5 * rs) / (tall / 2), 0.02, 0.25),
            blur: 0.4,
            paints: ['apBladeLit', 'apBlade'],
            load: 0.5,
            lean: (hashed(k * 5.3) - 0.5) * 0.7,
            order: 705,
          })
        }
        const dots = Math.round((w * 0.25 * pic) / (115 * wideFew))
        for (let k = 0; k < dots; k += 1) {
          const x = hashed(k * 3.91 + 0.7) * w
          const s = slopeY(x) + 6 * rs
          if (s > h) {
            continue
          }
          const t = hashed(k * 2.33 + 0.2) ** 0.7 * 0.5
          const y = s + t * (h - s)
          const r = (0.8 + 1.1 * hashed(k * 5.7) ** 2) * (0.75 + 1.6 * t) * Math.max(0.85, rs)
          const paints = hashed(k * 6.3) < 0.6 ? ['apDot', 'apDotBlue'] : ['apDotBlue', 'apDot']
          if (r > 1.6 && hashed(k * 7.1) < 0.5) {
            rand.reseed(73001 + k)
            garden.bloom({ x, y, stem: r * 1.5, reach: r, petals: 5, blur: 0.4, paints, stiff: 0.6, order: 710 + t })
            n += 1
          } else {
            put({
              x,
              y,
              long: r,
              wide: 0.85,
              turn: hashed(k * 8.3) * 3,
              blur: 0.35,
              paints,
              load: 0.6 + 0.35 * hashed(k * 9.1),
              kind: AP_LEAF,
              order: 710 + t,
            })
          }
        }

        // The slope's foot, where the picture goes into the page: a soft haze over it, pale by day and dark at night.
        const mistLong = clamp(0.05 * w, 36, 90)
        const MIST = [0.55, 0.45, 0.32, 0.2, 0.1]
        MIST.forEach((most, r) => {
          for (let k = -1; k * mistLong * 0.75 < w + mistLong; k += 1) {
            const q = r * 53 + k * 11 + 3
            const x = (k + (r % 2) * 0.5) * mistLong * 0.75
            const y = h - (0.015 + 0.03 * r) * pic
            lay({
              x,
              y,
              half: mistLong,
              depth: mistLong * 0.22,
              soft: mistLong * 0.18,
              paints: ['apFootMist', 'apFootMist'],
              load: most * (0.85 + 0.3 * hashed(q * 1.9)),
              order: 708,
            })
          }
        })

        /* Along the wind's way, through the green in the band's middle, the grass stands a little taller, lithe (it gives
           to the wind far more than the rest), its tips lit: what the wind parts as it goes through, so that the ripple it
           leaves shows, pushed on after it, springing back past upright and settling. A loose drift, thickest on the way and
           thinning off either side of it and broken into tufts, so that it never reads as a row. */
        const { room, base } = apLand(h)
        const wayY = (x) => base + room * (AP_D0 + AP_D1 * ((2 * x) / w - 1))
        const litheStep = 1.5 * Math.max(0.8, rs) * wideFew
        for (let x = -6, k = 0; x < w + 6; x += litheStep, k += 1) {
          const q = k * 7 + 3
          const bx = x + (hashed(q * 0.11) - 0.5) * litheStep
          const off = (hashed(q * 0.13) + hashed(q * 0.17) + hashed(q * 0.19) - 1.5) * 15 * rs
          // (in tufts along the way, and fewer the further off it)
          if (
            hashed(q * 0.07) >
            (0.25 + 0.95 * smooth(0.32, 0.62, fbm(bx / (70 * rs) + 2.2, off / (30 * rs) + 6.1))) *
              Math.exp(-((off / (12 * rs)) ** 2))
          ) {
            continue
          }
          const y = wayY(bx) + off
          // (and only in the green, however high or low in the band the way runs on this canvas, shorter towards its edges,
          // so that none stands up into the light at the band's top or over its foot)
          const v = (y - shadowY(bx)) / (slopeY(bx) - shadowY(bx))
          const green = smooth(0.28, 0.42, v) * (1 - smooth(0.72, 0.84, v))
          if (hashed(q * 0.37) > green) {
            continue
          }
          const tall = (8 + 7 * hashed(q * 0.23) ** 1.3) * rs * (0.6 + 0.4 * green)
          // (in the band's own greens, so that standing still they are only more of its grass, and they show as they bow)
          const pick = hashed(q * 0.29)
          const paints =
            pick < 0.5 ? ['apGrassDeep', 'apGrass'] : pick < 0.9 ? ['apGrass', 'apGrassLit'] : ['apWakeDeep', 'apWake']
          grow({
            x: bx,
            y,
            tall,
            wide: clamp((0.9 * rs) / (tall / 2), 0.05, 0.3),
            blur: 0.6,
            paints,
            load: 0.8,
            stiff: 0.15,
            lean: (hashed(q * 0.31) - 0.5) * 0.45 + 0.08,
            order: y - 0.2,
          })
        }

        // a stroke of the school, rooted far under the canvas, where nothing that goes by can stir it
        let f = 0
        const fishPut = (o) => {
          f += 1
          rand.reseed(83001 + f * 7919)
          const root = h + 400
          garden.dab({
            kind: AP_LEAF,
            blur: 0.6,
            load: 0.95,
            turn: 0,
            ...o,
            y: root,
            stem: root - o.y,
            lean: 0,
            stiff: 1,
          })
        }
        /* The grass the wind has just gone through, swept up behind it, painted round the canvas's middle (the shader
           carries it where the wind is, see schoolVertex), its middle on the wind's way: blades rising behind it and
           curving back, the band's green at their feet and lit at their tips, fading behind, and a flower or two tossed up
           in it. Soft, as everything in the band is. */
        const hx = w / 2
        const hy = h / 2
        const D = 40 * apSize(w)
        const wake = (lx, ly, r, paints, o = {}) =>
          fishPut({
            x: hx + lx * D,
            y: hy + ly * D,
            long: r * D,
            wide: o.wide ?? 0.9,
            turn: o.turn ?? 0,
            blur: (o.blur ?? 0.14) * r * D + 0.3,
            paints,
            load: o.load ?? 0.9,
            kind: o.kind ?? AP_LEAF,
            order: 2000 + f * 1e-4,
            phase: 400,
          })
        for (let j = 0; j < 18; j += 1) {
          const s = j / 17
          const g = (m) => apHash(j * 5.7 + m * 1.9 + 0.3)
          const lx = -0.08 - 0.9 * s + (g(1) - 0.5) * 0.06
          const tall = (0.44 - 0.26 * s) * (0.72 + 0.56 * g(2))
          const lean = 0.45 + 0.55 * s + (g(3) - 0.5) * 0.3
          const ly = 0.1 + (g(4) - 0.5) * 0.06
          const fade = 1 - 0.75 * s ** 1.2
          // each blade in two strokes, its tip bent back further than its foot, so that it curves as swept grass does
          const l1 = lean * 0.6
          const a1 = tall * 0.55
          const mx = lx - Math.sin(l1) * a1
          const my = ly - Math.cos(l1) * a1
          wake((lx + mx) / 2, (ly + my) / 2, a1 / 2, [j % 3 ? 'apGrass' : 'apGrassDeep', 'apWake'], {
            wide: 0.24,
            turn: -Math.PI / 2 - l1,
            blur: 0.2,
            load: 0.85 * fade,
          })
          const l2 = lean * 1.35
          const a2 = tall * 0.5
          wake(
            mx - Math.sin(l2) * a2 * 0.5,
            my - Math.cos(l2) * a2 * 0.5,
            a2 / 2,
            ['apWake', j % 2 ? 'apWakeTip' : 'apGrassLit'],
            { wide: 0.22, turn: -Math.PI / 2 - l2, blur: 0.2, load: 0.85 * fade },
          )
        }
        ;[
          [-0.36, -0.24, 0.05, 'coral'],
          [-0.62, -0.16, 0.045, 'pink'],
          [-0.25, -0.34, 0.04, 'peach'],
        ].forEach(([lx, ly, r, paint]) => {
          wake(lx, ly, r, [paint, paint], { wide: 0.85, blur: 0.4, load: 0.85 })
        })
        // The petals: each a pale petal, turning over about its own middle as it flies.
        for (let i = 1; i <= AP_PETALS; i += 1) {
          const long = (2.3 + 0.9 * apHash(i * 3.3)) * apSize(w)
          fishPut({
            x: hx,
            y: hy,
            long,
            wide: 0.42,
            turn: apHash(i * 5.1) * Math.PI,
            blur: 0.5,
            paints: ['apPetal', 'apPetalShade'],
            load: 0.95,
            order: 2001 + i * 0.01,
            phase: 400 + i + 0.2,
          })
        }
      },
    }

    /* --- the developer-tools page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/developer-tools, after Cameron's picture (a coral reef in thick gouache): under the calls to
       action, sunlit water in the land's own fine lines, coming in from nothing just under the buttons as the overview's
       forest's mist does, with light falling down through it in soft shafts and a few glints; a reef rising from the foot,
       far corals going back into the blue, a great orange coral beside the words on the left, its paddles fanning out from
       its heart, lit gold on the side the light comes from and deep red-orange in its shade, branching corals in blue,
       violet and lilac rising beside it and on the right, a pale pink finger coral, and low heaps of deep blue coral along
       the foot; and a few small clownfish, orange with white bands, swimming through the open water and out at the sides
       through glass, as the company's fish and the forest's egrets do. At night it is a deep reef, the
       corals glowing softly at their tips. */
    const DT_EVEN = 0.005
    const DT_MIST = 0.0025
    const DT_HAZE = 0.4 + DT_EVEN
    const DT_LEAF = 0.25
    const DT_LEAF_MIST = 0.25 + DT_MIST
    const DT_TWINKLE = 3.25 + DT_EVEN
    const DT_GLIMMER = 3.4 + DT_EVEN
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const dtHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const dtRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    const dtHex = (rgb) =>
      `#${rgb
        .map((v) =>
          Math.round(Math.min(255, Math.max(0, v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`
    const dtMix = (a, b, t) => dtHex(dtRgb(a).map((v, i) => v + (dtRgb(b)[i] - v) * t))
    /* A coral's colour at night, at its level of its ramp (0 its deepest shade, 6 its light): its shade goes down into the
       dark of the water, still its own colour, and its light glows in the ramp's full colour rather than its pale one, so
       that at night the reef is lit softly at its tips. */
    const dtNight = (ramp, i) => {
      const t = i / 6
      /* (only its lightest steps glow, so that its body goes down into the dark and its tips are lit, and in its full
         colour, not its pale one: the great coral an ember orange rather than gold) */
      const glow = dtRgb(i >= 6 ? dtMix(ramp[3], ramp[4], 0.6) : ramp[Math.min(i, 3)])
      const deep = dtRgb(ramp[i]).map((v, c) => v * 0.27 + [2, 6, 18][c])
      const lit = deep.map((v, c) => v + (glow[c] * 0.97 - v) * t ** 2.2)
      // and fuller in its colour than the day's, as a light is in the dark, rather than going grey or ochre on the way
      const grey = (lit[0] + lit[1] + lit[2]) / 3
      return dtHex(lit.map((v) => grey + (v - grey) * (1 + 0.35 * t)))
    }
    // The water's inks, light and dark: a pale aqua where its lines come in under the buttons, turquoise, and cerulean
    // down at the reef; at night a deep blue.
    const DT_INKS = {
      ...LAND_INK,
      dtTop: ['#d0f0ef', '#0c1a2e'],
      dtHigh: ['#98dfe2', '#0b2444'],
      dtMid: ['#6ccedb', '#0a2b5a'],
      dtLow: ['#4cb5dd', '#0b3268'],
      dtFoot: ['#3e9ad8', '#0c336a'],
    }
    /* How large the reef's strokes are drawn on a canvas this wide; past a laptop's they grow only slowly, so that a wide
       screen's reef is still a few great corals rather than a hedge along the foot (as the forest's crowns are). */
    const DT_SCALE = (w) => Math.max(0.5, Math.min(w / 1232, 1.15 + Math.max(0, w - 1600) / 2600))
    // and the fish, a little larger on a phone than that alone would make them, and no larger on a wide screen
    const DT_FISH_SCALE = (w) => Math.max(0.85, Math.min(1.15, DT_SCALE(w)))
    /* Each coral as a ramp from its deepest shade to its light, after the reference's gouache: the great coral's orange,
       from a deep red-orange in its shade to gold where the light catches it; the branching corals' blue, violet and
       lilac; the finger coral's pink; and the deep blue of the heaps along the foot. */
    const DT_DAY = {
      orange: ['#a83a1c', '#c64e1e', '#df6626', '#ee8230', '#f69e40', '#fab956', '#fdd27a'],
      blue: ['#24308a', '#2c42a8', '#3858c4', '#4a70d8', '#638ae6', '#86a8f0', '#aac4f6'],
      violet: ['#352a86', '#4637a0', '#5949bc', '#705fd0', '#8b7ade', '#a898ea', '#c6bbf4'],
      lilac: ['#5f4fae', '#7766c4', '#8f7fd6', '#a698e4', '#bcb0ee', '#d1c8f5', '#e6e0fb'],
      pink: ['#a75592', '#c06ba6', '#d684ba', '#e69fcb', '#f0b8da', '#f7d0e6', '#fce6f0'],
      navy: ['#161f66', '#1d2a80', '#25389a', '#2f47b0', '#3a59c2', '#4d70d2', '#6889de'],
    }
    /* How far into the blue the far corals are: each colour mixed towards the water's, so that the far reef goes back
       into it as softer, bluer shapes; at night towards the deep water. */
    const DT_FOG = [0, 0.34, 0.55, 0.72]
    const DT_FOG_AIR = [null, ['#5fb0d8', '#123462'], ['#6ec0da', '#112f58'], ['#80cbdc', '#102b50']]
    const DT_FOGGED = ['blue', 'violet', 'pink', 'lilac']
    const DT_PAINTS = {
      ...Object.fromEntries(
        Object.entries(DT_DAY).flatMap(([tone, ramp]) =>
          ramp.map((day, i) => [`dt_${tone}${i}`, [day, dtNight(ramp, i)]]),
        ),
      ),
      ...Object.fromEntries(
        DT_FOGGED.flatMap((tone) =>
          [1, 2, 3].flatMap((level) =>
            DT_DAY[tone].map((day, i) => [
              `dt_${tone}f${level}_${i}`,
              [
                dtMix(day, DT_FOG_AIR[level][0], DT_FOG[level]),
                dtMix(dtNight(DT_DAY[tone], Math.min(6, i + 1)), DT_FOG_AIR[level][1], DT_FOG[level] * 0.85),
              ],
            ]),
          ),
        ),
      ),
    }
    /* The clownfish: three small groups, a third of their round apart, so that one is always somewhere in the water, each
       swimming at one pace so that it keeps together, its fish close in lanes of their own and a little apart along the
       way, each rising and falling and surging a little at its own rate and beating its tail quickly, as a small fish
       does. Its lanes are far enough apart that two fish rising and falling towards each other never come into one row,
       where one swimming close behind another would touch its tail, and the glass at the sides would draw it out into a
       tail on the one ahead. For each: its length (CSS pixels at a canvas 1232 wide), pace, lane (0 at the band's top, 1
       at its foot), where it is in the round, how far it rises and falls and how often, how far it surges and how often,
       its tail's beats a second and how far it swings, a seed of its own, and for a few, that it swims only on a canvas
       wider than a phone's, whose water is small. */
    const DT_GROUPS = [3, 2, 2]
    const DT_LANES = [0.22, 0.78, 0.5]
    const DT_FISH = DT_GROUPS.flatMap((count, g) =>
      Array.from({ length: count }, (_, j) => {
        const i = DT_GROUPS.slice(0, g).reduce((a, b) => a + b, 0) + j
        const h = (k) => dtHash(i * 17.3 + k * 3.7 + 0.9)
        const lane = Math.min(1, Math.max(0, DT_LANES[g] + (j - (count - 1) / 2) * 0.25 + (h(3) - 0.5) * 0.02))
        return {
          size: 27 + 8 * h(1),
          // one pace for all three groups, so that they keep a third of their round apart and never overtake one
          // another: two groups' fish in nearly one lane would otherwise meet, and the glass would draw one into a tail on
          // the other, or show the two as one doubled fish
          speed: 38,
          lane,
          phase: g / DT_GROUPS.length + 0.22 + (((j * 0.618034) % 1) - 0.5) * 0.06 + (h(4) - 0.5) * 0.015,
          drift: 4 + 4 * h(5),
          period: 3 + 2.5 * h(6),
          surge: 5 + 6 * h(11),
          surgePeriod: 2.2 + 2 * h(12),
          beat: 2.6 + 1.4 * h(7),
          wag: 0.07 + 0.03 * h(8),
          seed: h(10),
          from: j === 2 || (g === 2 && j === 1) ? 700 : 0,
        }
      }),
    )
    const UC_DEVELOPER_TOOLS = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      // a few beads (the water's motes), the oval of page kept round the words shallow, every line to the canvas's edges
      lines: { ...LINES, lift: 0.08, veil: [80, 18], beadChance: 0.05, whole: true },
      inks: DT_INKS,
      stillAt: 8,
      // the corals at the sides stand up against the page beside the words, as well as in the water
      onPage: true,
      /* the water's lines come in from nothing under the buttons, pale and few, so that where they start is no edge:
         slowly, over more than half the picture, so that they are at their full only down at the reef (as the overview's
         forest's mist is); never a lone hairline across the whole canvas, and never a striped band */
      fade: {
        at: (stage) => {
          const foot = stage.words.y + stage.words.b
          return [foot - 2, foot + (stage.h - foot) * 0.6]
        },
        ease: 1.15,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      land: {
        ...SKY.land,
        sheets: [
          // the water, from just under the buttons' foot down, in the land's fine lines
          {
            name: 'air',
            top: (stage) => {
              const under = Math.min((stage.words.y + stage.words.b + 3 - stage.base) / stage.room, 0.12)
              return [
                [-1.6, under],
                [1.6, under],
              ]
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'dtTop', 0.4],
              [0.13, 'dtTop', 1],
              [0.28, 'dtHigh', 1],
              [0.52, 'dtMid', 1],
              [0.8, 'dtLow', 1],
              [1, 'dtFoot', 1],
            ],
            fade: true,
            fill: 0.9,
            under: 0.95,
            patch: 0.05,
            flow: 1.1,
            breath: 2,
            beads: [1, 0],
          },
          // the land's foot, under the reef: it lays the land out and draws nothing
          {
            name: 'meadow',
            top: [
              [-1.6, 1.24],
              [1.6, 1.24],
            ],
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'dtFoot', 0],
              [1, 'dtFoot', 0],
            ],
            fill: 0,
            under: 0,
          },
        ],
      },
      flock: [],
      /* The fish come in and go out through glass at the sides, as every hero's creatures do: the forest's even glass, so
         that one is drawn out level, never shown twice and never smeared into a comet's tail, as wide as the butterflies'
         band and bent harder than the forest's, since a clownfish is less than half an egret's length: one going out is
         drawn out across to a soft wisp about three times its length at the very edge, magnified, softened and haloed,
         and one coming in grows out of such a wisp. Its colours stay together: split, the narrow white bands of a fish
         this small come apart into yellow, green and magenta stripes across the whole band. */
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 2,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 3,
        halo: [2.6, 0.2],
      },
      school: {
        fish: DT_FISH,
        size: DT_FISH_SCALE,
        turn: 0.22,
        // through the open water, from well under the buttons down over the low corals, falling a little to the right
        band: ({ w, h, words }) => {
          const under = words.y + words.b
          const fall = (h - under) * 0.08 * Math.min(1, w / 1232)
          const top = under + 46 + 10 * DT_FISH_SCALE(w)
          const foot = Math.max(top + 80, under + 0.66 * (h - under))
          return [top, foot, fall]
        },
        reach: [0.75, 0.6],
        glow: [1.1, 0.95],
        scatter: { radius: 110, push: 300, back: 1.3 },
      },
      paints: {
        ...PAINTS,
        ...DT_PAINTS,
        // the wash over the open water, from under the buttons down to the reef
        dtWashTop: ['#d3f2f0', '#0d1c32'],
        dtWashHigh: ['#ade6e7', '#0c2546'],
        dtWash: ['#86d6df', '#0b2a56'],
        dtWashDeep: ['#68c4df', '#0b3064'],
        // the reef's own shade low in the water, behind the corals
        dtShade: ['#3f90d0', '#0e2a52'],
        dtShadeDeep: ['#2f74c2', '#0c234a'],
        // the light coming down through the water, and the glints in it
        dtRay: ['#ffffff', '#183a68'],
        dtRayEnd: ['#c3ebef', '#112c52'],
        dtGlint: ['#ffffff', '#9fe8d8'],
        dtGlintGlow: ['#e9fbfa', '#4f9e9a'],
        // (half the glints are gone into the water at night, where they would read as stars)
        dtGlintDay: ['#ffffff', '#0e2238'],
        dtGlintDayGlow: ['#e9fbfa', '#0e2238'],
        // the corals' glow at night, lost in the water by day
        dtGlowWarm: ['#9fdbe2', '#ff8a4a'],
        dtGlowCool: ['#98d4e2', '#6f86ff'],
        dtGlowPink: ['#a2d8e2', '#f28ad0'],
        // the clownfish, a deeper orange than the great coral's light, so that one passing it still reads
        dtFishOrange: ['#e4521c', '#ff7d34'],
        dtFishDeep: ['#b83a12', '#d85a22'],
        dtFishWhite: ['#fff8ef', '#f3eee6'],
        dtFishInk: ['#6e2c14', '#1a1622'],
        dtFishGlow: ['#d2f1f2', '#ffb27a'],
      },
      plant: (garden) => {
        const { w, h, rand, ground, words } = garden
        const half = w / 2
        const sc = DT_SCALE(w)
        /* A stroke standing still where it is painted (rooted under the canvas, its stem up to it); or, given a sway, rooted
           at its coral's foot and leaning out to where it is painted, turned back by as much as the lean turns it, so that
           all of a coral's strokes rock together about its foot in the current, a little, as one. */
        const put = (n, { x, y, sway, ...o }) => {
          rand.reseed(52001 + n * 7919)
          if (sway) {
            const dx = x - sway.x
            const dy = sway.y - y
            const lean = Math.atan2(dx, dy)
            garden.dab({
              kind: DT_HAZE,
              blur: 0.6,
              load: 0.9,
              ...o,
              turn: (o.turn || 0) - 0.7 * lean,
              x: sway.x,
              y: sway.y,
              stem: Math.hypot(dx, dy),
              lean,
              stiff: 1 - sway.give,
              phase: sway.phase,
            })
            return
          }
          const root = h + 40
          garden.dab({
            kind: DT_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const r = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.53)
          const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * u
          const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875
        const top = ground('air', half)
        const pic = h - top
        const at = (f) => top + f * pic
        // sizes keep more of themselves on a narrow canvas than the width alone would give them
        const rs = Math.max(sc, Math.min(0.8, pic / 420))
        const tall = clamp(pic / 330, 1, 1.3)
        const px = Math.max(0.8, Math.sqrt(rs))
        // how much of the canvas's width the words take: where they take most of it, nothing rises beside them
        const narrow = smooth(0.55, 0.85, (2 * words.a) / Math.max(1, w))
        const wl = words.x - words.a
        const wr = words.x + words.a
        // whether a thing standing between these places across is clear of the words, and can rise up beside them
        const clearOfWords = (x0, x1) => narrow < 0.5 && (x1 < wl - 90 || x0 > wr + 90)
        // how far over the words a place across is: nothing out beside them, all of it under their middle
        const overWords = (x) => 1 - smooth(words.a - 20, words.a + 110, Math.abs(x - words.x))
        const tone = (name, i, fog = 0) =>
          fog && DT_FOGGED.includes(name)
            ? `dt_${name}f${fog}_${clamp(Math.round(i), 0, 6)}`
            : `dt_${name}${clamp(Math.round(i), 0, 6)}`
        // the far corals go back into the blue upward across this band
        garden.mist(at(0.12), at(0.5))

        /* The picture is planned first, far to near, as layers of strokes, each with the solid shapes it covers; then, from
           the nearest back, a stroke wholly behind what is nearer is left out, so that the paint goes where it shows. */
        const layers = []
        let layer = null
        const begin = (clear = true, sway = null) => {
          layer = { strokes: [], solid: [], clear, sway }
          layers.push(layer)
        }
        // how much a coral gives to the current, and a phase of its own, so that no two rock together
        let swayed = 0
        const current = (x, y, give = 0.03) => {
          swayed += 1
          return { x, y, give, phase: 2 + ((swayed * 1.618) % 1) * 9 }
        }
        /* How crowded the words would be by paint at a place: none under the water's top or well out beside them, and more
           and more from a little under a hundred pixels out from their box, above it, so that a coral rising beside them
           thins out raggedly, paddle by paddle, before it comes near them, rather than ending along a line. */
        const crowding = (x, y) => (y > top + 14 ? 0 : 1 - smooth(45, 105, Math.max(wl - x, x - wr, 0)))
        const add = (o) => {
          if (o.y - o.long - (o.blur || 0) >= h) {
            return
          }
          // (a branching coral thins out limb by limb instead, see coral)
          if (layer.clear && !layer.limbs) {
            const ax = Math.cos(o.turn || 0) * o.long
            const ay = Math.sin(o.turn || 0) * o.long
            const c = Math.max(
              crowding(o.x + ax, o.y + ay),
              crowding(o.x - ax, o.y - ay),
              crowding(o.x, o.y - o.long * o.wide),
            )
            if (c > 0 && hashed(o.x * 0.37 + o.y * 0.71) < c * 1.25) {
              return
            }
          }
          layer.strokes.push(o)
        }
        const solid = (x, y, a, b) => {
          layer.solid.push([x, y, a, b])
        }

        /* The water. A soft wash over its lines from where they come in under the buttons down to the reef, in the water's
           own colour at each height and as much as it has come in there, so that its lines show through it only as a grain
           and never as stripes, and none stands alone over the page (as the healthcare wood's body is laid); flat strokes
           near the top, so that none reaches up past the buttons' foot. */
        const inWater = (y) => {
          const t = clamp((y - top - 2) / Math.max(1, pic * 0.5), 0, 1)
          // (some of it already where the first lines come in, so that none of them lies alone over the page)
          return Math.max((t * t * (3 - 2 * t)) ** 1.25, 0.8 * smooth(top + 2, top + 0.16 * pic, y))
        }
        const WATER = [
          [0.16, 'dtWashTop'],
          [0.32, 'dtWashHigh'],
          [0.52, 'dtWash'],
        ]
        const waterInk = (y, q) => {
          const p = (y - top) / (0.95 * pic) + (hashed(q) - 0.5) * 0.08
          return (WATER.find(([under]) => p < under) || [0, 'dtWashDeep'])[1]
        }
        begin(false)
        // (its strokes no smaller than this on a phone, where strokes a share of the width long would lie in streaks)
        const washLong = clamp(0.06 * w, 56, 110)
        const washStep = 15
        for (let y = top + 8; y < at(0.84); y += washStep) {
          const cols = Math.ceil((w + 2 * washLong) / (0.9 * washLong)) + 1
          for (let k = 0; k < cols; k += 1) {
            const q = k * 3.1 + y * 0.07
            const x = ((k + (hashed(q) - 0.5) * 0.4 + ((y - top) / washStep) * 0.5) % cols) * 0.9 * washLong - washLong
            const wy = y + (hashed(q * 1.7 + 0.3) - 0.5) * washStep
            const flat = smooth(top, at(0.25), wy)
            const veil = Math.hypot((x - words.x) / (words.a + 80), (wy - words.y) / (words.b + 18))
            const ink = waterInk(wy, q * 2.3)
            add({
              x,
              y: wy,
              long: washLong,
              wide: 0.18 + 0.22 * flat,
              blur: (0.2 + 0.33 * flat) * washLong,
              paints: [ink, ink],
              load: 0.66 * inWater(wy) * smooth(0.95, 1.15, veil),
              kind: DT_HAZE,
            })
          }
        }
        /* The light coming down through the water from above and a little to the right: soft broad shafts, slanting, few
           and uneven, palest at their tops and gone into the blue before the reef; fainter under the words. */
        const slant = 0.2
        const shafts = Math.max(5, Math.round(10 * (w / 1232) ** 0.55))
        for (let k = 0; k < shafts; k += 1) {
          const u = (k + 0.5 + (hashed(k * 3.1 + 0.4) - 0.5) * 0.8) / shafts
          const xt = u * (w + 0.4 * pic) - 0.05 * pic
          const yt = at(0.12 + 0.08 * hashed(k * 1.7))
          const len = (0.45 + 0.3 * hashed(k * 2.3)) * pic
          const broad = (9 + 20 * hashed(k * 4.9) ** 1.5) * sc
          const cx = xt - Math.sin(slant) * len * 0.5
          const cy = yt + Math.cos(slant) * len * 0.5
          add({
            x: cx,
            y: cy,
            long: len * 0.5,
            wide: broad / (len * 0.5),
            turn: Math.PI / 2 + slant,
            blur: broad * 0.8 + 5,
            paints: ['dtRay', 'dtRayEnd'],
            load: (0.55 + 0.3 * hashed(k * 6.1)) * (1 - 0.5 * overWords(xt)),
            kind: DT_HAZE,
          })
        }
        // glints of the light in the water, few and small, high in it; at night a few motes glowing
        for (let k = 0; k < Math.round(30 * (w / 1232) ** 0.7); k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const y = at(0.08 + hashed(k * 3.7 + 0.9) ** 1.2 * 0.5)
          const r = (0.8 + 1.4 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          const day = k % 2 ? 'Day' : ''
          add({
            x,
            y,
            long: r * 1.6,
            wide: 1,
            blur: r * 1.2,
            paints: [`dtGlint${day}Glow`, `dtGlint${day}Glow`],
            load: 0.12,
            kind: DT_GLIMMER,
          })
          add({
            x,
            y,
            long: r * 0.5,
            wide: 1,
            blur: r * 0.25,
            paints: [`dtGlint${day}`, `dtGlint${day}`],
            load: 0.85,
            kind: DT_TWINKLE,
          })
        }
        /* The reef's own shade low in the water, behind all the corals, deepening down to the foot, so that no page shows
           between them; coming in from nothing a little under the open water. */
        const ug = 24 * rs
        for (let gy = at(0.46); gy < h + ug; gy += ug) {
          for (let gx = -ug; gx < w + ug; gx += ug) {
            const q = Math.round(gx / ug) * 6113 + Math.round(gy / ug) * 92821 + 17
            const x = gx + (hashed(q * 0.013 + 0.3) - 0.5) * ug * 0.6
            const y = gy + (hashed(q * 0.017 + 0.2) - 0.5) * ug * 0.6
            const yy = (y - top) / pic
            const sink = overWords(x) * 0.08
            const fade = smooth(0.5 + sink, 0.76 + sink, yy)
            if (fade <= 0.02) {
              continue
            }
            add({
              x,
              y,
              long: ug * 0.95,
              wide: 0.95,
              turn: 1.2,
              blur: ug * 0.5,
              paints: yy < 0.84 ? ['dtShade', 'dtShade'] : ['dtShade', 'dtShadeDeep'],
              load: 0.7 * fade,
              kind: DT_HAZE,
            })
          }
        }

        /* A paddle of coral, as the reference paints them: broad and round at its outer end and narrowing in to where it
           grows from, laid from its end inward; lit along its upper side when the light is on it. `a` is which way it
           points, from straight up (radians, to the right for more than nothing). */
        const paddle = (F, x0, y0, a, l, f, kind, soft = 0, q = 0, plain = false) => {
          const ox = Math.sin(a)
          const oy = -Math.cos(a)
          const br = l * (0.36 + 0.12 * hashed(q * 0.37 + 0.11))
          const cx = x0 + ox * l * 0.95
          const cy = y0 + oy * l * 0.95
          const turn = Math.atan2(-oy, -ox)
          add({
            x: cx,
            y: cy,
            long: l,
            wide: br / l,
            turn,
            blur: Math.min(br * 0.2, 1.4) + 0.3 + soft,
            paints: [F(f + 0.8), F(f - 1.3)],
            load: 0.96,
            kind,
          })
          if (f > 3 && !soft && !plain && l > 4 * px) {
            const sgn = ox > 0 ? -1 : 1
            add({
              x: cx + ox * l * 0.15 - oy * sgn * br * 0.42,
              y: cy + oy * l * 0.15 + ox * sgn * br * 0.42,
              long: l * 0.62,
              wide: clamp((br * 0.34) / (l * 0.62), 0.05, 0.5),
              turn,
              blur: 0.5,
              paints: [F(f + 1.9), F(f + 0.8)],
              load: 0.82,
              kind: 0,
            })
          }
        }

        /* A branching coral, as the reference's blue and violet ones are painted: its limbs rising from its foot and
           forking, leaning up the way a coral grows towards the light, hardly seen themselves (dark and bare only low down)
           under a mass of short paddles clustered along them, each pointing up and out to the side it grows on; laid in
           two passes, those behind in its shade and those in front in its light, lit from above and a little from the
           right and deeper low down. Far ones are fewer, softer and misty, going into the blue upward. */
        const coral = (c) => {
          const {
            x: x0,
            foot,
            tall: high,
            tone: tn,
            fog = 0,
            haze = 0,
            seed,
            spread = 0.4,
            leaf = 1,
            width = 1,
            trunks = 3,
            lean = 0,
            bias = 0,
            glow,
            levels = 3,
            sparse = 1,
            soft = 0,
            tips,
          } = c
          begin(true, fog ? null : current(x0, foot))
          layer.limbs = true
          if (high < 12) {
            return
          }
          const kind = fog ? DT_LEAF_MIST : DT_LEAF
          // (`haze`, a coral a little back in the water: its colours going into the blue, but whole to its tips)
          const F = (f) => tone(tn, f + bias, fog || haze)
          // (some of the paddles at its tips in a second colour, as the reference's violet corals go pink at their tips)
          const T = tips ? (f) => tone(tips, f - 0.3, fog || haze) : F
          const ratio = 0.7
          let sum = 0
          for (let d = 0; d <= levels; d += 1) {
            sum += ratio ** d
          }
          const len0 = (high / sum) * 0.92
          const w0 = 2.2 * width * Math.max(0.75, rs) * (high / (190 * rs)) ** 0.4
          const pl = clamp(0.062 * high, 4.6 * px, 13 * rs) * leaf
          const lightOf = (ang, x, y) =>
            0.34 +
            0.26 * Math.cos(ang) +
            0.14 * Math.sin(ang) +
            0.34 * ((foot - y) / high - 0.45) +
            0.1 * clamp((x - x0) / (0.4 * high), -1, 1)
          let q = seed * 1000
          if (glow && !fog) {
            // its glow at night, round its crown, behind it
            for (let k = 0; k < 3; k += 1) {
              add({
                x: x0 + (k - 1) * high * 0.2,
                y: foot - high * (0.55 + 0.1 * hashed(seed + k)),
                long: high * 0.3,
                wide: 0.85,
                blur: high * 0.2,
                paints: [glow, glow],
                load: 0.14 * (1 - 0.45 * narrow) * (haze ? 0.6 : 1),
                kind: DT_HAZE,
              })
            }
          }
          // its limbs
          const segs = []
          const limb = (sx, sy, ang, len, wd, d) => {
            q += 1
            const myq = q
            const mid = ang + (hashed(myq * 1.31 + seed) - 0.5) * 0.18
            const ex = sx + Math.sin(mid) * len
            const ey = sy - Math.cos(mid) * len
            /* Near the words a limb is left out whole, with all that grows from it, more often the nearer it would reach
               them, so that the coral thins out raggedly, branch by branch, and leaves no paddle standing alone. */
            const reachOut = pl * 1.1
            const near = Math.max(
              crowding(ex, ey),
              crowding(ex + Math.sin(mid) * reachOut, ey - Math.cos(mid) * reachOut),
            )
            if (near > 0 && hashed(myq * 9.13 + seed) < near * 1.25) {
              return
            }
            segs.push({ sx, sy, ex, ey, wd, d, a: mid, q: myq, len })
            if (d === 0) {
              return
            }
            const kids = d < levels && hashed(myq * 2.1) < 0.4 ? 3 : 2
            for (let k = 0; k < kids; k += 1) {
              const u = (k / (kids - 1)) * 2 - 1
              const a = mid * 0.8 + u * spread * (0.75 + 0.5 * hashed(myq * 3.7 + k)) + lean * 0.15
              limb(ex, ey, a, len * ratio * (0.85 + 0.3 * hashed(myq * 6.1 + k)), wd * 0.72, d - 1)
            }
          }
          for (let t = 0; t < trunks; t += 1) {
            const u = trunks === 1 ? 0 : (t / (trunks - 1)) * 2 - 1
            const a = lean + u * spread * 0.9 + (hashed(seed * 3.3 + t) - 0.5) * 0.25
            limb(x0 + u * w0 * 1.4, foot, a, len0 * (0.9 + 0.2 * hashed(seed * 5.1 + t)), w0, levels)
          }
          // the limbs low down, dark and bare between the paddles
          segs.forEach(({ sx, sy, ex, ey, wd, d, a }) => {
            if (d < levels - 1) {
              return
            }
            const long = Math.hypot(ex - sx, ey - sy) / 2 + wd * 0.5
            const f = 0.4 + 1.2 * lightOf(a, ex, ey)
            add({
              x: (sx + ex) / 2,
              y: (sy + ey) / 2,
              long,
              wide: clamp(wd / long, 0.03, 0.9),
              turn: Math.atan2(ey - sy, ex - sx),
              blur: Math.min(wd * 0.3, 1.2) + 0.3 + soft,
              paints: [F(f - 0.6), F(f + 0.3)],
              load: 0.96,
              kind,
            })
          })
          // the paddles, those behind first and then those in front
          ;[0, 1].forEach((pass) => {
            segs.forEach(({ sx, sy, ex, ey, d, a: sa, q: sq, len }) => {
              const step = Math.max(3.4 * px, pl * 0.56) * sparse * (pass ? 1.3 : 1)
              const many = Math.max(1, Math.round(len / step))
              const nx = Math.cos(sa)
              const ny = Math.sin(sa)
              for (let k = 0; k < many; k += 1) {
                const qq = sq * 7.7 + k * 1.37 + pass * 0.5
                const g = (k + hashed(qq)) / many
                // (the foot of a trunk is bare)
                if (d === levels && g < 0.6) {
                  continue
                }
                const side = hashed(qq * 1.9) - 0.5
                const bx = sx + (ex - sx) * g + nx * side * pl * 0.9
                const by = sy + (ey - sy) * g + ny * side * pl * 0.9
                const a = sa * 0.7 + side * 1.9 + (hashed(qq * 2.3) - 0.5) * 0.5
                const l = pl * (0.62 + 0.55 * hashed(qq * 3.1)) * (d === 0 ? 1.08 : 0.92)
                const lit = lightOf(a, bx, by)
                const f = (pass ? 1.5 : 0.1) + 2.7 * lit + (hashed(qq * 4.7) - 0.5) * 0.7
                paddle(
                  pass && d === 0 && hashed(qq * 5.3) < 0.4 ? T : F,
                  bx,
                  by,
                  a,
                  l,
                  f,
                  kind,
                  soft + (pass ? 0 : 0.4),
                  qq,
                  pass === 0,
                )
              }
              // and at a tip, a few more, out along it
              if (d === 0 && pass) {
                for (let k = 0; k < 2; k += 1) {
                  const qq = sq * 3.9 + k * 2.1
                  const a = sa * 0.85 + (k - 0.5) * 0.7 + (hashed(qq) - 0.5) * 0.3
                  paddle(
                    hashed(qq * 6.1) < 0.45 ? T : F,
                    ex,
                    ey,
                    a,
                    pl * (0.8 + 0.4 * hashed(qq * 1.7)),
                    1.9 + 2.7 * lightOf(a, ex, ey),
                    kind,
                    soft,
                    qq,
                  )
                }
              }
            })
          })
        }

        /* A finger coral, as the reference's pale pink one: thick round fingers rising from a clump and forking once or
           twice, each a row of round dabs, lilac in its shade low down and paling to a pink-white knob at its tip. */
        const fingers = (c) => {
          const { x: x0, foot, tall: high, seed, spread = 0.36, width = 1, trunks = 4, lean = 0, glow, haze = 0 } = c
          begin(true, current(x0, foot, 0.03))
          if (high < 12) {
            return
          }
          const P = (f) => tone('pink', f, haze)
          const Lc = (f) => tone('lilac', f, haze)
          const ratio = 0.78
          const len0 = (high / (1 + ratio + ratio * ratio)) * 0.98
          const w0 = 5.4 * width * Math.max(0.8, rs) * (high / (150 * rs)) ** 0.35
          let q = seed * 1000
          if (glow) {
            for (let k = 0; k < 2; k += 1) {
              add({
                x: x0 + (k - 0.5) * high * 0.3,
                y: foot - high * 0.55,
                long: high * 0.32,
                wide: 0.85,
                blur: high * 0.2,
                paints: [glow, glow],
                load: 0.13 * (1 - 0.45 * narrow),
                kind: DT_HAZE,
              })
            }
          }
          const knob = (x, y, r, f, ang, low) => {
            const lo = low > 0.5
            add({
              x,
              y,
              long: r,
              wide: 0.88,
              turn: ang + Math.PI / 2,
              blur: Math.min(r * 0.22, 1.4) + 0.3,
              paints: lo ? [Lc(f + 0.4), Lc(f - 0.8)] : [P(f + 0.5), P(f - 0.9)],
              load: 0.96,
              kind: DT_LEAF,
            })
          }
          const limb = (sx, sy, ang, len, wd, d) => {
            q += 1
            const myq = q
            const mid = ang + (hashed(myq * 1.31 + seed) - 0.5) * 0.18
            const ex = sx + Math.sin(mid) * len
            const ey = sy - Math.cos(mid) * len
            const wEnd = wd * 0.88
            const steps = Math.max(2, Math.ceil(len / (wd * 1.25)))
            for (let s = 0; s <= steps; s += 1) {
              const g = s / steps
              const y = sy + (ey - sy) * g
              const up = clamp((foot - y) / high, 0, 1)
              const r = wd + (wEnd - wd) * g
              const jx = (hashed(myq * 3.1 + s * 1.7) - 0.5) * r * 0.22
              knob(
                sx + (ex - sx) * g + jx,
                y,
                r * (0.94 + 0.12 * hashed(myq + s * 2.3)),
                0.8 + 3.2 * up + 0.5 * Math.sin(mid) + (hashed(myq + s) - 0.5) * 0.5,
                mid,
                up < 0.28 ? 1 : 0,
              )
            }
            // a short finger off it now and then
            if (d >= 1 && hashed(myq * 4.4) < 0.7) {
              const g = 0.5 + 0.3 * hashed(myq * 5.5)
              const side = hashed(myq * 6.6) < 0.5 ? -1 : 1
              limb(
                sx + (ex - sx) * g,
                sy + (ey - sy) * g,
                mid + side * (0.5 + 0.3 * hashed(myq * 7.7)),
                len * 0.45,
                wd * 0.82,
                -1,
              )
            }
            if (d <= 0) {
              knob(ex, ey - wEnd * 0.2, wEnd * 1.12, 5.2 + 0.6 * hashed(myq), mid, 0)
              return
            }
            ;[-1, 1].forEach((u, k) => {
              limb(
                ex,
                ey,
                mid * 0.75 + u * spread * (0.75 + 0.5 * hashed(myq * 3.7 + k)) + lean * 0.2,
                len * ratio * (0.85 + 0.3 * hashed(myq * 6.1 + k)),
                wEnd,
                d - 1,
              )
            })
          }
          for (let t = 0; t < trunks; t += 1) {
            const u = trunks === 1 ? 0 : (t / (trunks - 1)) * 2 - 1
            limb(
              x0 + u * w0 * 2.2,
              foot,
              lean + u * spread * 0.8 + (hashed(seed * 3.3 + t) - 0.5) * 0.2,
              len0 * (0.85 + 0.3 * hashed(seed * 5.1 + t)),
              w0,
              2,
            )
          }
        }

        /* The great orange coral: paddles fanning out from its heart low on its left, each broad and round at its outer end
           and narrowing in towards the heart, as the reference's are, packed close, the outer ones first and the inner ones
           laid over their roots; lit gold on its upper right, where the light comes from, and deep red-orange in its shade
           low on its left, each lit one lit along its upper side; its edge ragged with the paddles' ends against the water,
           and narrowing at its foot to the heart. `reach` is how far it rises over its heart and `half` how far it spreads
           to its right (less to its left). */
        const fan = (c) => {
          const { x: hx0, y: hy0, reach: RB, half: AH, seed, glow = 'dtGlowWarm', clear = 1e9 } = c
          const F = (f) => tone('orange', f)
          // its outline, how far out from its heart at each angle (from straight up, to the right for more than nothing)
          const shape = (phi) =>
            (0.5 + 0.5 * Math.cos((phi - 0.3) * 1.0)) ** 0.6 *
            (0.84 + 0.26 * fbm(phi * 2.1 + seed, seed * 0.7) + 0.06 * Math.sin(phi * 7 + seed))
          const polar = (x, y) => {
            const u = (x - hx0) / AH
            const v = (hy0 - y) / RB
            return [Math.hypot(u, v), Math.atan2(u, v)]
          }
          begin(true, current(hx0, hy0, 0.025))
          // its glow at night, behind it
          for (let k = 0; k < 4; k += 1) {
            add({
              x: hx0 + (0.05 + 0.25 * k) * AH,
              y: hy0 - (0.4 + 0.15 * (k % 2)) * RB,
              long: AH * 0.5,
              wide: 0.9,
              blur: AH * 0.32,
              paints: [glow, glow],
              load: 0.15 * (1 - 0.4 * narrow),
              kind: DT_HAZE,
            })
          }
          // its shade inside, which shows between its paddles
          const bs = 0.17 * Math.min(AH, RB)
          for (let gy = hy0 - RB; gy <= hy0; gy += bs) {
            for (let gx = hx0 - AH; gx <= hx0 + AH * 1.1; gx += bs) {
              const [rn, phi] = polar(gx, gy)
              if (Math.abs(phi) > 1.5 || rn > 0.8 * shape(phi) || rn < 0.06 || (gy < top + 30 && gx > clear - 20)) {
                continue
              }
              const lt = clamp(0.4 + 0.35 * Math.sin(phi) + 0.4 * rn, 0, 1)
              add({
                x: gx,
                y: gy,
                long: bs * 0.9,
                wide: 0.95,
                turn: 1.2,
                blur: Math.min(bs * 0.2, 3),
                paints: [F(0.5 + 1.7 * lt), F(0.1 + 1.0 * lt)],
                load: 0.95,
                kind: DT_LEAF,
              })
            }
          }
          solid(hx0 + 0.25 * AH, hy0 - 0.45 * RB, AH * 0.55, RB * 0.38)
          // the paddles, from places scattered through it, each pointing out from its heart
          const L = 0.076 * Math.min(AH * 1.6, RB) * clamp(rs, 0.85, 1.15)
          const spacing = L * 0.8
          const paddles = []
          for (let gy = hy0 - 1.25 * RB; gy <= hy0; gy += spacing * 0.86) {
            for (let gx = hx0 - 1.2 * AH; gx <= hx0 + 1.3 * AH; gx += spacing) {
              const qq = Math.round(gx / spacing) * 7.31 + Math.round(gy / spacing) * 13.7 + seed
              const x = gx + (hashed(qq * 1.1) - 0.5) * spacing * 0.8
              const y = gy + (hashed(qq * 1.7) - 0.5) * spacing * 0.8
              const [rn, phi] = polar(x, y)
              const s = shape(phi)
              // (never up beside the words, where it would stand over them: under the buttons it may spread)
              if (Math.abs(phi) > 1.55 || rn > s || rn < 0.1 || (y < top + 24 && x > clear)) {
                continue
              }
              paddles.push({ x, y, d: rn / s, rn, phi, qq })
            }
          }
          paddles.sort((p, q) => q.d - p.d)
          paddles.forEach(({ x, y, d, rn, phi, qq }) => {
            const ang = Math.atan2(x - hx0, hy0 - y) + (hashed(qq * 2.3) - 0.5) * 0.4
            // how lit: upper right lit, the outer ones more, and a little of its own
            const lt = clamp(0.24 + 0.55 * Math.sin(phi + 0.1) + 0.42 * Math.cos(phi) * rn + 0.4 * (d - 0.5), 0, 1.2)
            // (those up against the page beside the words no paler than the gold, so that its edge stays clear on white)
            const f = Math.min(0.1 + 5.2 * lt + (hashed(qq * 3.1) - 0.5) * 0.9, y < top + 6 ? 4.2 : 9)
            const l = L * (0.8 + 0.45 * hashed(qq * 4.7)) * (0.5 + 0.6 * Math.min(1, rn * 1.6))
            // (each pushed out a little, so its round end is where it was placed)
            paddle(F, x - Math.sin(ang) * l * 0.9, y + Math.cos(ang) * l * 0.9, ang, l, f, DT_LEAF, 0, qq)
          })
          // its stalk, down from its heart into the heaps at its foot
          const sw = 0.09 * AH
          add({
            x: hx0,
            y: hy0 + 0.06 * RB,
            long: 0.1 * RB,
            wide: clamp(sw / (0.1 * RB), 0.1, 0.9),
            turn: -Math.PI / 2,
            blur: 1.5,
            paints: [F(0.5), F(1.5)],
            load: 0.95,
            kind: DT_LEAF,
          })
        }

        /* A heap of deep blue coral along the foot, as the reference's: round mounds heaped low and broad, the upper ones
           behind, each a deep body under short paddles packed close and fanning up and out from its foot, in the great
           coral's strokes, the outer ones first and the inner ones over their roots, lit on its top and deep under it. */
        const heap = (c) => {
          begin()
          const { x: x0, foot, r: R, seed, tn = 'navy', bias = 0 } = c
          const F = (f) => tone(tn, f + bias)
          const many = 4 + Math.round(3 * hashed(seed * 1.3))
          const plates = []
          for (let k = 0; k < many; k += 1) {
            const u = (k / (many - 1)) * 2 - 1 + (hashed(seed * 2.9 + k) - 0.5) * 0.3
            const a = R * (0.3 + 0.18 * hashed(seed * 2.1 + k))
            plates.push({
              x: x0 + u * R * 0.8,
              y: foot - (0.2 + 0.5 * (1 - u * u)) * R * 0.75 + (hashed(seed * 4.3 + k) - 0.5) * 0.2 * R,
              a,
              b: a * (0.64 + 0.14 * hashed(seed * 3.7 + k)),
              q: seed * 31 + k * 7.7,
            })
          }
          plates.sort((p, q) => p.y - q.y)
          plates.forEach(({ x, y, a, b, q }) => {
            solid(x, y + b * 0.2, a * 0.7, b * 0.6)
            // its body, deep in its own shade, which shows between its paddles
            add({
              x,
              y: y + b * 0.05,
              long: b * 0.72,
              wide: clamp((0.85 * a) / (0.72 * b), 0.6, 1.8),
              turn: Math.PI / 2,
              blur: 3,
              paints: [F(1.2), F(0)],
              load: 0.97,
              kind: DT_LEAF,
            })
            const L = clamp(0.2 * b, 3.5 * px, 9 * rs)
            const sp = L * 1.5
            const ps = []
            for (let gy = y - b; gy <= y + 0.85 * b; gy += sp * 0.85) {
              for (let gx = x - a; gx <= x + a; gx += sp) {
                const qq = q * 3.1 + Math.round((gx - x) / sp) * 7.31 + Math.round((gy - y) / sp) * 13.7
                const px0 = gx + (hashed(qq * 1.1) - 0.5) * sp * 0.8
                const py0 = gy + (hashed(qq * 1.7) - 0.5) * sp * 0.8
                const r = Math.hypot((px0 - x) / a, (py0 - y) / b)
                if (r < 0.95) {
                  ps.push({ px0, py0, r, qq })
                }
              }
            }
            ps.sort((p1, p2) => p2.r - p1.r)
            ps.forEach(({ px0, py0, r, qq }) => {
              const ang = Math.atan2(px0 - x, y + 1.1 * b - py0) + (hashed(qq * 2.3) - 0.5) * 0.45
              const low = (py0 - (y - b)) / (1.55 * b)
              const lt = clamp(0.95 - 0.8 * low + 0.15 * Math.sin(ang) + (hashed(qq * 3.1) - 0.5) * 0.3, 0, 1.1)
              const l = L * (0.8 + 0.4 * hashed(qq * 4.7)) * (0.6 + 0.5 * r)
              paddle(
                F,
                px0 - Math.sin(ang) * l * 0.9,
                py0 + Math.cos(ang) * l * 0.9,
                ang,
                l,
                0.3 + 3.8 * lt,
                DT_LEAF,
                0,
                qq,
              )
            })
          })
        }

        // The far reef, along the whole canvas, small, soft and misty, going back into the blue.
        const farStep = 54 * rs
        let fi = 0
        for (let x = -farStep * 0.4; x < w + farStep; x += farStep * (0.7 + 0.6 * hashed(fi * 1.37 + 0.2))) {
          fi += 1
          const fog = overWords(x) > 0.5 ? 3 : 2
          const pick = hashed(fi * 4.1 + 0.6)
          const farTone = ['blue', 'violet', 'pink'][(pick > 0.45) + (pick > 0.8)]
          coral({
            x,
            foot: at(0.86 + 0.06 * hashed(fi * 2.3)),
            tall: (0.2 + 0.2 * hashed(fi * 1.9)) * pic * (1 - 0.3 * overWords(x)),
            tone: farTone,
            fog,
            seed: 100 + fi,
            spread: 0.5,
            leaf: 1.35,
            width: 0.9,
            trunks: 2,
            levels: 2,
            sparse: 1.6,
            soft: 1.2,
            lean: (hashed(fi * 7.7) - 0.5) * 0.3,
          })
        }

        /* The tall corals beside the words, where there is room for them, and lower where there is not: on the left, a
           violet one at the edge and the great orange one; on the right, a tall blue one with a lilac one behind it. */
        const highTop = top - 0.14 * pic * tall
        // (the great coral a little lower than the tall blue one, so that it is a broad round fan)
        const fanTop = top - 0.06 * pic * tall
        const lowTop = at(0.1 + 0.08 * narrow)
        // (well off the words and a good deal smaller on a phone, so that the water has room for the fish)
        const AH = 230 * rs * Math.min(1.12, tall) * (1 - 0.35 * narrow)
        const heartX = Math.max((0.3 - 0.15 * narrow) * AH, wl - 140 - 0.6 * AH)
        const fanHigh = clearOfWords(heartX - 0.35 * AH, heartX + 0.42 * AH)
        const heartY = at(0.95)
        // the violet one at the left, behind the orange
        const leftX = Math.max(0.035 * w, heartX - 0.45 * AH)
        const leftHigh = clearOfWords(leftX - 60 * rs, leftX + 60 * rs)
        coral({
          x: leftX,
          foot: at(0.94),
          tall: at(0.94) - (leftHigh ? top - 0.03 * pic : at(0.2)),
          tone: 'violet',
          seed: 11,
          spread: 0.36,
          leaf: 1.05,
          width: 1.1,
          trunks: 3,
          lean: 0.1,
          glow: 'dtGlowCool',
          tips: 'pink',
          haze: w > 1700 ? 1 : 0,
        })
        fan({
          x: heartX,
          y: heartY,
          reach: heartY - (fanHigh ? fanTop : lowTop),
          half: AH,
          seed: 7.3,
          clear: fanHigh ? wl - 90 : w,
        })
        // on the right, the lilac one behind and the tall blue one
        const rightX = Math.min(w - (0.06 - 0.03 * narrow) * w, wr + 90 + 100 * sc)
        const rightHigh = clearOfWords(rightX - 80 * rs, rightX + 80 * rs)
        coral({
          x: rightX + 100 * rs,
          foot: at(0.9),
          tall: at(0.9) - (rightHigh ? at(-0.02) : at(0.22)),
          tone: 'lilac',
          haze: 1,
          seed: 23,
          spread: 0.4,
          width: 1,
          trunks: 3,
          lean: -0.05,
          glow: 'dtGlowPink',
          tips: 'pink',
        })
        coral({
          x: rightX,
          foot: at(0.95),
          tall: at(0.95) - (rightHigh ? top - 0.16 * pic * tall : narrow > 0.5 ? at(0.3) : lowTop),
          tone: 'blue',
          seed: 31,
          spread: 0.36,
          leaf: 1.05,
          width: 1.15,
          trunks: 3,
          lean: 0.04,
          glow: 'dtGlowCool',
          tips: 'lilac',
        })

        /* On a canvas wider than a laptop's, more corals out towards its edges beyond those, a little lower, so that the
           reef does not thin out there; and on the right, a smaller orange one answering the great one. */
        const sideCoral = (x, k, warm) => {
          const tallK = (0.48 + 0.18 * hashed(k * 3.1 + 0.7)) * pic
          if (warm) {
            fan({ x, y: at(0.97), reach: 0.62 * pic, half: 120 * rs, seed: 40 + k })
            return
          }
          const pick = k % 3
          if (pick === 2) {
            fingers({
              x,
              foot: at(1.03),
              tall: tallK * 0.75,
              seed: 700 + k,
              spread: 0.32,
              width: 1.05,
              trunks: 4,
              lean: (hashed(k * 4.1) - 0.5) * 0.2,
              glow: 'dtGlowPink',
            })
          } else {
            coral({
              x,
              foot: at(0.96),
              tall: tallK,
              tone: pick ? 'lilac' : 'blue',
              haze: 1,
              seed: 600 + k,
              spread: 0.38,
              width: 1,
              trunks: 3,
              lean: (hashed(k * 5.3) - 0.5) * 0.2,
              glow: pick ? 'dtGlowPink' : 'dtGlowCool',
            })
          }
        }
        let sk = 0
        for (let x = leftX - 190 * rs; x > -50 * rs; x -= (165 + 70 * hashed(sk * 2.7)) * rs) {
          sideCoral(x, (sk += 1), false)
        }
        let rk = 0
        for (let x = rightX + 230 * rs; x < w + 50 * rs; x += (165 + 70 * hashed(sk * 2.7)) * rs) {
          sk += 1
          rk += 1
          sideCoral(rk === 2 && w > 1900 ? Math.min(x, w - 110 * rs) : x, sk, rk === 2 && w > 1900)
        }

        /* The near row along the foot, all the way across: heaps of deep blue, pink finger corals and small branching ones,
           low under the words, where the fish swim over open water, and taller out at the sides. */
        const nearStep = 96 * rs
        let ni = 0
        let lastHeap = false
        for (let x = -nearStep * 0.3; x < w + nearStep * 0.5; x += nearStep * (0.75 + 0.5 * hashed(ni * 2.9 + 0.3))) {
          ni += 1
          const under = overWords(x)
          const pick = hashed(ni * 5.7 + 0.2)
          const lift = (0.2 + 0.16 * hashed(ni * 3.3)) * (1 - 0.3 * under)
          const foot = at(1.02 + 0.04 * hashed(ni * 1.3))
          // (a heap now and then, never two side by side, so that they are no dark band along the foot; paler under the words)
          const heaped = pick < 0.14 && !lastHeap
          lastHeap = heaped
          if (heaped) {
            heap({ x, foot, r: (60 + 36 * hashed(ni * 2.2)) * rs, seed: 300 + ni, bias: 1.2 * under })
          } else if (pick < 0.44) {
            // (those under the words a little back in the water, so that the reef is calm there and full in colour at the sides)
            fingers({
              x,
              foot,
              tall: lift * pic * 1.15,
              haze: under > 0.5 ? 1 : 0,
              seed: 400 + ni,
              spread: 0.34,
              width: 0.95,
              trunks: 3,
              lean: (hashed(ni * 4.4) - 0.5) * 0.3,
              glow: 'dtGlowPink',
            })
          } else {
            coral({
              x,
              foot,
              tall: lift * pic * 1.35,
              tone: hashed(ni * 6.6) < 0.5 ? 'blue' : 'violet',
              haze: under > 0.5 ? 1 : 0,
              seed: 500 + ni,
              spread: 0.45,
              trunks: 2,
              lean: (hashed(ni * 4.4) - 0.5) * 0.3,
              glow: 'dtGlowCool',
            })
          }
        }
        // the great orange coral's foot hidden in heaps of deep blue, and a pink finger coral at the right's foot
        heap({ x: heartX - 0.12 * AH, foot: at(1.04), r: 115 * rs, seed: 901 })
        heap({ x: heartX + 0.5 * AH, foot: at(1.07), r: 95 * rs, seed: 902 })
        fingers({
          x: rightX + 30 * rs,
          foot: at(1.04),
          tall: 0.46 * pic,
          seed: 903,
          spread: 0.32,
          width: 1.15,
          trunks: 4,
          lean: -0.05,
          glow: 'dtGlowPink',
        })

        // Leave out what is wholly behind something nearer: a grid of the canvas, marked where a nearer layer is solid.
        const cell = 4
        const gw = Math.ceil(w / cell) + 1
        const gh = Math.ceil(h / cell) + 1
        const mask = new Uint8Array(gw * gh)
        const open = (x, y) => {
          const ci = Math.floor(x / cell)
          const cj = Math.floor(y / cell)
          return ci < 0 || cj < 0 || ci >= gw || cj >= gh || mask[cj * gw + ci] === 0
        }
        const shows = (s) => {
          const breadth = s.long * s.wide
          const ax = Math.cos(s.turn ?? 0)
          const ay = Math.sin(s.turn ?? 0)
          const l = s.long * 0.7
          const b = breadth * 0.7
          return (
            open(s.x, s.y) ||
            open(s.x + ax * l, s.y + ay * l) ||
            open(s.x - ax * l, s.y - ay * l) ||
            open(s.x - ay * b, s.y + ax * b) ||
            open(s.x + ay * b, s.y - ax * b)
          )
        }
        const fill = ([x, y, a, b]) => {
          const j0 = Math.max(0, Math.floor((y - b) / cell))
          const j1 = Math.min(gh - 1, Math.floor((y + b) / cell))
          for (let j = j0; j <= j1; j += 1) {
            const t = ((j + 0.5) * cell - y) / b
            if (t * t >= 1) {
              continue
            }
            const reach = a * Math.sqrt(1 - t * t)
            const i0 = Math.max(0, Math.ceil((x - reach) / cell))
            const i1 = Math.min(gw - 1, Math.floor((x + reach) / cell) - 1)
            for (let ci = i0; ci <= i1; ci += 1) {
              mask[j * gw + ci] = 1
            }
          }
        }
        for (let li = layers.length - 1; li >= 0; li -= 1) {
          layers[li].strokes = layers[li].strokes.filter(shows)
          layers[li].solid.forEach(fill)
        }
        let n = 0
        layers.forEach((l, li) => {
          l.strokes.forEach((s, si) => {
            put((n += 1), { ...s, order: 560 + li * 0.01 + si * 1e-6, sway: l.sway })
          })
        })

        /* The clownfish. Each painted facing right round the canvas's middle (the shader carries it where it is, see
           schoolVertex), softly, with no outline of ink: a soft light round it (a little of the water's by day, warm at
           night), its tail fan, its round orange body, deeper to the tail, its fins, three white bands (behind its head,
           round its middle and at its tail's root), each with only a faint deeper edge, and a small dark eye. */
        const hx = half
        const hy = h / 2
        const fishScale = DT_FISH_SCALE(w)
        DT_FISH.forEach((f, k) => {
          const len = f.size * fishScale
          const phase = 400 + k
          const base = 2000 + k * 0.1
          const fat = (lx, ly) => ({ x: hx + lx * len, y: hy + ly * len })
          const id = 90000 + k * 40
          const fin = { blur: len * 0.012, kind: DT_LEAF, phase }
          put(id, {
            ...fat(0, 0),
            long: len * 0.6,
            wide: 0.62,
            blur: len * 0.4,
            paints: ['dtFishGlow', 'dtFishGlow'],
            load: 0.2,
            order: base,
            phase,
          })
          // its tail, a fan with a faint deeper edge
          put(id + 1, {
            ...fat(-0.39, 0),
            long: len * 0.13,
            wide: 0.92,
            turn: Math.PI,
            paints: ['dtFishInk', 'dtFishInk'],
            load: 0.4,
            order: base + 0.001,
            ...fin,
          })
          put(id + 2, {
            ...fat(-0.375, 0),
            long: len * 0.112,
            wide: 0.88,
            turn: Math.PI,
            paints: ['dtFishOrange', 'dtFishDeep'],
            load: 0.97,
            order: base + 0.002,
            ...fin,
          })
          // its fins, over its back and under it, likewise
          put(id + 3, {
            ...fat(-0.03, -0.168),
            long: len * 0.19,
            wide: 0.3,
            turn: Math.PI + 0.14,
            paints: ['dtFishInk', 'dtFishInk'],
            load: 0.3,
            order: base + 0.003,
            ...fin,
          })
          put(id + 4, {
            ...fat(-0.025, -0.16),
            long: len * 0.185,
            wide: 0.3,
            turn: Math.PI + 0.14,
            paints: ['dtFishOrange', 'dtFishDeep'],
            load: 0.97,
            order: base + 0.004,
            ...fin,
          })
          put(id + 5, {
            ...fat(-0.08, 0.155),
            long: len * 0.11,
            wide: 0.42,
            turn: Math.PI - 0.3,
            paints: ['dtFishInk', 'dtFishInk'],
            load: 0.35,
            order: base + 0.005,
            ...fin,
          })
          put(id + 6, {
            ...fat(-0.075, 0.143),
            long: len * 0.095,
            wide: 0.38,
            turn: Math.PI - 0.3,
            paints: ['dtFishOrange', 'dtFishDeep'],
            load: 0.97,
            order: base + 0.006,
            ...fin,
          })
          // its body, round at its head and narrowing to its tail, its faint edge and its deep red-orange keeping it clear of
          // the great coral it swims past
          put(id + 8, {
            ...fat(0.025, 0.004),
            long: len * 0.35,
            wide: 0.615,
            turn: Math.PI,
            paints: ['dtFishInk', 'dtFishInk'],
            load: 0.32,
            order: base + 0.0065,
            ...fin,
          })
          put(id + 7, {
            ...fat(0.03, 0),
            long: len * 0.335,
            wide: 0.6,
            turn: Math.PI,
            paints: ['dtFishOrange', 'dtFishDeep'],
            load: 0.98,
            order: base + 0.007,
            ...fin,
          })
          // its bands, each white over a dark edge
          ;[
            [0.2, 0.15, 0.065],
            [0.0, 0.19, 0.08],
            [-0.24, 0.1, 0.06],
          ].forEach(([lx, tallB, thick], j) => {
            put(id + 10 + j * 2, {
              ...fat(lx, 0),
              long: len * tallB,
              wide: (thick + 0.02) / tallB,
              turn: Math.PI / 2,
              paints: ['dtFishInk', 'dtFishInk'],
              load: 0.4,
              order: base + 0.008 + j * 0.0002,
              ...fin,
            })
            put(id + 11 + j * 2, {
              ...fat(lx, 0),
              long: len * tallB * 0.97,
              wide: thick / tallB,
              turn: Math.PI / 2,
              paints: ['dtFishWhite', 'dtFishWhite'],
              load: 0.97,
              order: base + 0.0081 + j * 0.0002,
              ...fin,
            })
          })
          // its fin by its side, and its eye, small and dark
          put(id + 20, {
            ...fat(0.1, 0.06),
            long: len * 0.07,
            wide: 0.5,
            turn: Math.PI - 0.5,
            paints: ['dtFishOrange', 'dtFishDeep'],
            load: 0.9,
            order: base + 0.01,
            ...fin,
          })
          put(id + 21, {
            ...fat(0.27, -0.045),
            long: len * 0.028,
            wide: 1,
            paints: ['dtFishInk', 'dtFishInk'],
            load: 0.8,
            order: base + 0.011,
            ...fin,
          })
        })
      },
    }

    /* --- the ecommerce page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/ecommerce, after Cameron's two pictures: a green hill covered in small yellow wildflowers
       under a saturated blue sky, deep soft shadows lying across it, and a meadow with the grass and petals swept up as
       something runs through it. Under the calls to action the sky comes in from nothing, in the land's own fine lines,
       deepening to blue at the hill's crest; the hill rises from the left to a knoll on the right, a hollow of deep shade
       on its left under the crest, a band of sun running up it from the lower left, and the near shade along its foot,
       fading into the page; yellow flowers in drifts over all of it, bright in the sun and dim in the shade. Along the
       band of sun an unseen breeze runs up the hill, as the home page's meadow has one: it parts the grass and the
       flowers as it goes (it is the home page's passer: see `passer`), sweeps a wake of grass up behind it, and a few
       daisy petals drift after it. Nothing of what runs is seen, only what it moves. By day it is the bright blue day; at
       night the same hill at dusk, a warm glow low behind it, the knoll rising into the indigo, and a few stars. */
    const EC_EVEN = 0.005
    const EC_HAZE = 0.4 + EC_EVEN
    const EC_PLAIN = 0.25
    const EC_BRISTLE = 0
    const EC_TWINKLE = 3.25 + EC_EVEN
    const EC_GLIMMER = 3.4 + EC_EVEN
    // (its own, as in a one-file build the engine's hashed, clamp and smooth come after this, worked out as it loads)
    const ecHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const ecClamp = (v, a, b) => Math.min(b, Math.max(a, v))
    /* The land, laid out as the engine lays it out (see landSteps): a room of at most 256 CSS pixels, standing on the
       canvas's foot, 1.3 rooms deep from the hill's line to the meadow's foot. The breeze's way is worked out in it,
       since the passer's is. */
    const EC_ROOM = 256
    const EC_FOOT = 19
    const EC_HEAD = 12
    const EC_DEEP = 1.3
    const EC_LEAST = 110
    const ecLand = (h) => {
      const room = Math.max(EC_LEAST, Math.min(EC_ROOM, (h - EC_FOOT - EC_HEAD) / EC_DEEP))
      return { room, base: h - EC_FOOT - EC_DEEP * room }
    }
    /* The breeze's way up the hill, in the land's terms: so far down at the canvas's middle, and so much more or less at
       its right and left edges. The passer walks the hill's line 0.03 under it (see placePasser, with no `wander` and its
       lane at the line), so the hill's line is laid that far over the way, and the passer is wherever the breeze's slot
       in the school is: just ahead of its wake, the petals behind it. */
    const EC_D0 = 0.895
    const EC_D1 = -0.15
    /* How the breeze runs, so that the passer keeps with it on any canvas: the school is scaled with the canvas's width
       (see `size`), so its round takes the same time on all of them, and the passer's walk across and its round are
       those times. The breeze crosses any canvas in EC_CROSS seconds; at the clock's start it is EC_START of the width
       across. */
    const EC_UNIT = 1232
    const EC_CROSS = 15
    /* The breeze's length in the school. Nothing of it is drawn but its wake, which is much shorter, but it is the
       largest of the school, so its run in and out at the sides (two and a half lengths: see schoolNow's margin) sets
       the round's span, and with it the petals' and the passer's timing; it is kept as long as that timing was found
       with. */
    const EC_DOG_UNIT = 90
    const EC_MARGIN = (2.5 * EC_DOG_UNIT) / EC_UNIT
    const EC_SPAN = 1 + 2 * EC_MARGIN
    const EC_START = -0.05
    const EC_PHASE = (EC_START + EC_MARGIN) / EC_SPAN
    // how large the wake and the petals are drawn: the wake's unit (`D` in the planting) 44 CSS pixels on a laptop
    const ecScale = (w) => ecClamp(w / EC_UNIT, 0.8, 1.1)
    /* The width of the canvas the breeze last ran on (set as the land is laid out and as the school is placed). Its pace
       goes with the width, so that the passer keeps with it however the canvas is resized, but its wake's size hardly
       does, so the wake's ripple does instead: on a phone it rises and falls more slowly, and on a very wide screen more
       quickly, so that it never looks hurried or dragged along. `ecGait` is its pace in its own lengths a second,
       against a laptop's. */
    let ecW = EC_UNIT
    const ecGait = () => ecW / EC_UNIT / ecScale(ecW)
    /* The breeze, and its petals after it: each petal at the breeze's pace, a little behind it and above, rising and
       falling slowly and turning over as it goes (its `flap`, about its own middle). The breeze stays the school's
       first, with its length, pace and place in the round, though nothing of it but its wake is painted (see the
       planting): taking it out would shorten the round (see EC_DOG_UNIT) and move every petal and the passer with it. */
    const EC_PETALS = 6
    const EC_FISH = [
      {
        size: EC_DOG_UNIT,
        speed: EC_UNIT / EC_CROSS,
        lane: 1,
        phase: EC_PHASE,
        // its wake lifting and settling a little and its blades waving (the tail's wave, see schoolVertex) with each beat
        drift: 0.5,
        get period() {
          return 1 / this.beat
        },
        surge: 0,
        surgePeriod: 0,
        get beat() {
          return (1 / 0.38) * ecGait() ** 0.6
        },
        wag: 0.012,
        glide: 0,
        seed: 0.31,
      },
      ...Array.from({ length: EC_PETALS }, (_, k) => {
        const h = (j) => ecHash(k * 7.9 + j * 3.3 + 1.7)
        return {
          size: 8,
          speed: EC_UNIT / EC_CROSS,
          lane: 0.15 + 0.6 * h(1),
          phase: EC_PHASE - (0.02 + 0.075 * ((k * 0.618034 + 0.2) % 1)) / EC_SPAN,
          drift: 6 + 7 * h(2),
          period: 2.6 + 1.8 * h(3),
          surge: 4 + 6 * h(4),
          surgePeriod: 3 + 2.5 * h(5),
          beat: 0.45 + 0.4 * h(6),
          wag: 0,
          flap: 0.9 + 0.5 * h(7),
          glide: 0,
          seed: h(8),
          ...(k >= 4 ? { from: 700 } : {}),
        }
      }),
    ]
    /* The hill's crest, as a share of the picture down from the buttons' foot: low at the left, rising to a round knoll
       two thirds of the way across, low enough that the sky has room to deepen to its blue. Past either side (only a very
       wide screen shows it) the land goes on in low swells rather than lying level. */
    const EC_CREST = [
      [-0.95, 0.335],
      [-0.62, 0.312],
      [-0.4, 0.292],
      [-0.25, 0.276],
      [-0.11, 0.318],
      [0, 0.354],
      [0.12, 0.352],
      [0.25, 0.341],
      [0.38, 0.314],
      [0.5, 0.271],
      [0.6, 0.236],
      [0.67, 0.21],
      [0.725, 0.196],
      [0.77, 0.193],
      [0.815, 0.204],
      [0.87, 0.236],
      [0.94, 0.29],
      [1, 0.33],
      [1.14, 0.352],
      [1.36, 0.3],
      [1.62, 0.33],
      [1.9, 0.35],
    ]
    const ecCurve = (points) => (x) => {
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
    const ecCrestCurve = ecCurve(EC_CREST)
    // with a little roughness, a hair's worth, so that it is a hill's line and not a drawn one
    const ecCrestF = (u) => ecCrestCurve(u) + 0.005 * Math.sin(u * 41 + 0.4) + 0.003 * Math.sin(u * 97 + 1.9)
    /* Where a place across is in the hill's own terms (0 its left, 1 its right): the canvas's width, up to a laptop's;
       on a wider one the hill keeps that breadth about the middle, so that it is still a hill and not a long low rise,
       and goes on past it either side in low swells of its own (see EC_CREST). */
    const ecU = (x, w) => 0.5 + (x - w / 2) / Math.min(w, 1500)
    // where the picture starts, under the buttons' foot, and how tall it is
    const ecPicture = ({ h, words }) => {
      const top = words.y + words.b + 3
      return { top, pic: h - top }
    }
    /* The band, in CSS pixels down the canvas, over which the sky's and the hill's lines come in from nothing, as the
       forest's mist does: from the buttons' foot, slowly, over more than half the picture. */
    const ecFadeAt = (stage) => {
      const foot = stage.words.y + stage.words.b
      ecNarrow = Math.min(1, Math.max(0, (900 - stage.w) / 420))
      ecW = stage.w
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    /* How much the canvas the land was last laid out on is a phone's (set as its fade is worked out, above): there, where
       the sky is a narrow band and few of its lines are seen at once, they come in more slowly at first (the fade's
       `ease`, which the engine reads as it draws), so that none of them stands alone across the sky, as the fintech
       sky's do. */
    let ecNarrow = 0
    // The inks of the sky and the hill's lines, light and dark: the bright blue day, and the same hill at dusk.
    const EC_INKS = {
      ...LAND_INK,
      ecTop: ['#e0ebfa', '#151b3a'],
      ecSky: ['#b7cff2', '#1f2758'],
      ecSkyDeep: ['#2f6bcf', '#30366e'],
      ecHorizon: ['#3c79d6', '#5a4f80'],
      ecCrest: ['#8db63a', '#24381c'],
      ecHill: ['#5c9228', '#1a2c16'],
      ecHillDeep: ['#2f611c', '#112012'],
      ecHillFoot: ['#204a15', '#0b170d'],
      // where the breeze has been through the grass, its paler side
      sheen: ['#e9f2a6', '#56653a'],
    }
    /* The hill's greens and its flowers' yellows, each a ramp from the deepest shade to the full sun, sampled off the
       picture; at dusk the same, deeper and cooler, the sun's side keeping a little warmth. */
    const EC_DAY = {
      wash: ['#0f2e0d', '#174213', '#265b1b', '#427924', '#6c9a2b', '#97b533', '#bccb44'],
      grass: ['#0c290b', '#143c11', '#22541a', '#3d7222', '#62932a', '#8db132', '#b4c946'],
      bloom: ['#56641b', '#76811f', '#9e9d25', '#c6b82b', '#e1cb2f', '#f1d93a', '#fde55c'],
    }
    const EC_DUSK = {
      wash: ['#050f0a', '#09150d', '#0d1d10', '#172d17', '#23391a', '#34471e', '#475422'],
      grass: ['#060f0a', '#09160d', '#0f2011', '#162b15', '#223819', '#33451d', '#465221'],
      bloom: ['#363d1f', '#485023', '#606127', '#7c742b', '#978a31', '#b09c39', '#c4ab44'],
    }
    const EC_PAINTS = Object.fromEntries(
      Object.entries(EC_DAY).flatMap(([tone, ramp]) =>
        ramp.map((day, i) => [`ec_${tone}${i}`, [day, EC_DUSK[tone][i]]]),
      ),
    )
    const UC_ECOMMERCE = {
      ...HERO,
      intro: false,
      words: '.uc-copy, .dc-copy, .hl-copy',
      // a few beads, the sky's small, shallow oval of page round the words, and every line carried to the canvas's edges
      lines: { ...LINES, lift: 0.06, veil: [80, 18], beadChance: 0.04, whole: true },
      film: FOOTER.film,
      dprCap: (w) => Math.min(2, 2 * Math.sqrt(1800 / w)),
      inks: EC_INKS,
      twinkle: true,
      marks: true,
      onPage: true,
      fade: {
        at: ecFadeAt,
        get ease() {
          return 1.15 + 0.35 * ecNarrow
        },
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      land: {
        ...HERO.land,
        // the hill's line, under the breeze's way (see EC_D0): the passer walks it
        profile: [
          [-1.6, EC_D0 - 0.03 - 1.6 * EC_D1],
          [1.6, EC_D0 - 0.03 + 1.6 * EC_D1],
        ],
        crest: 0,
        relief: [1, 1],
        room: EC_ROOM,
        foot: EC_FOOT,
        head: EC_HEAD,
        least: EC_LEAST,
        sheets: [
          // the sky, from just under the buttons' foot down, coming in from nothing
          {
            name: 'air',
            top: (stage) => {
              const under = Math.min((stage.words.y + stage.words.b + 3 - stage.base) / stage.room, 0.12)
              return [
                [-1.6, under],
                [1.6, under],
              ]
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            // (its inks change only where the hill hides them, so that no level line of a change crosses the sky)
            paint: [
              [0, 'ecTop', 0.4],
              [0.1, 'ecTop', 1],
              [0.3, 'ecSky', 1],
              [0.5, 'ecSkyDeep', 1],
              [0.7, 'ecHorizon', 1],
              [1, 'ecHorizon', 1],
            ],
            fade: true,
            fill: 0.62,
            under: 0.95,
            patch: 0.1,
            flow: 1.1,
            breath: 2,
            beads: [1, 0],
          },
          // the hill, from its crest down, in the land's lines, close and still, parted where the breeze goes
          {
            name: 'hill',
            opaque: true,
            laid: true,
            top: (stage) => {
              const { top, pic } = ecPicture(stage)
              // (closely enough that its line between two points never lies over the crest, and a pixel and a half under
              // it, so that the wash's crisp first row, not the sheet's faded edge, is the line against the sky)
              return Array.from({ length: 161 }, (_, i) => {
                const a = -1.6 + (3.2 * i) / 160
                return [
                  a,
                  (top + ecCrestF(ecU(((a + 1) / 2) * stage.w, stage.w)) * pic + 1.5 - stage.base) / stage.room,
                ]
              })
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'ecCrest', 0.9],
              [0.12, 'ecHill', 1],
              [0.5, 'ecHillDeep', 1],
              [1, 'ecHillFoot', 1],
            ],
            fade: true,
            lean: 0.25,
            fill: 0.9,
            under: 0.9,
            patch: 0.2,
            flow: 0,
            breath: 0,
            sheen: 1,
          },
          // the land's foot: it lays the land out and draws nothing
          {
            name: 'meadow',
            top: [
              [-1.6, 1.24],
              [1.6, 1.24],
            ],
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'ecHillFoot', 0],
              [1, 'ecHillFoot', 0],
            ],
            fill: 0,
            under: 0,
          },
        ],
      },
      grass: null,
      flowers: null,
      /* The breeze is the passer: it walks the hill's line at the breeze's pace in the school, starting where the
         breeze's slot is at the clock's start (EC_START) and coming round with it, so the grass and the flowers part just
         ahead of the wake and under the petals, as if something unseen ran through them. */
      passer: {
        first: (-0.075 - EC_START) * EC_CROSS,
        every: EC_SPAN * EC_CROSS,
        across: 1.15 * EC_CROSS,
        lane: 0,
        wander: 0,
        push: 1.2,
      },
      stir: { ...STIR, reach: 40, life: 3 },
      pointer: true,
      clouds: [],
      flock: [],
      /* The petals and the wake come in and go out through glass at the canvas's sides, as every hero's creatures do. It
         is the forest's even glass (see LENS_EVEN), so a white petal is drawn out level across, magnified more and more
         out to the edge, and never shown twice; it softens it towards the edge, so that drawn out there it is a soft
         wisp of white through frosted glass rather than a hard white streak; and its colours stay together, since white
         comes apart into rainbow streaks. Drawn out, nothing of the school is ever a bright bar there. */
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 2.6,
        halo: [2.6, 0.2],
      },
      stillAt: 5,
      school: {
        fish: EC_FISH,
        // scaled with the canvas's width, so that a round takes the same time on any (see EC_CROSS); the wake's ripple
        // goes with it
        size: (w) => {
          ecW = w
          return w / EC_UNIT
        },
        turn: 0.14,
        // the breeze on the passer's way, its petals up to 70 of the wake's pixels above it, all rising to the right
        band: ({ w, h }) => {
          const { room, base } = ecLand(h)
          const y0 = base + room * EC_D0
          return [y0 - 70 * ecScale(w), y0, 2 * room * EC_D1]
        },
        reach: [0.8, 0.8],
        scatter: { radius: 1, push: 0, back: 1 },
      },
      paints: {
        ...PAINTS,
        ...EC_PAINTS,
        // the sky's blues from the top, nearly the page, down to the crest's saturated blue (and at dusk, from the dark
        // page down to its deep indigo)
        ec_sky0: ['#dfeafa', '#171c3e'],
        ec_sky1: ['#bcd2f3', '#1a2049'],
        ec_sky2: ['#8fb4ea', '#1e2453'],
        ec_sky3: ['#6094e0', '#21285b'],
        ec_sky4: ['#3d78d6', '#242b61'],
        ec_sky5: ['#2a66cc', '#272e66'],
        // (by day each row of the light at the horizon is the sky's own blue where it lies, so that it adds no band of its
        // own; at dusk it warms from mauve to amber down to the horizon)
        ecGlow0: ['#3f79d6', '#4c4174'],
        ecGlow1: ['#3a75d5', '#6a5381'],
        ecGlow2: ['#3470d2', '#8f667d'],
        ecGlow3: ['#2e6bcf', '#ad7a75'],
        ecStar: ['#d3e2f7', '#f6f7ff'],
        ecStarGlow: ['#c6d8f3', '#fff1d8'],
        // the daisies' petals
        ecPetal: ['#ffffff', '#e4e7ee'],
        ecPetalShade: ['#e9ece6', '#b9bfcc'],
        // the grass the breeze sweeps up behind it, lit, and the tips of it catching the sun
        ecWake: ['#b9d257', '#4d5c2c'],
        ecWakeTip: ['#e4ef9c', '#76804a'],
      },
      plant: (garden) => {
        const { w, h, rand, words } = garden
        const { room, base } = ecLand(h)
        const { top, pic } = ecPicture({ h, words })
        const fy = (f) => top + f * pic
        const ff = (y) => (y - top) / pic
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = (n, { x, y, ...o }) => {
          rand.reseed(71001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: EC_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        /* A level stroke of wash, laid as an upright one as wide as it is long and turned a quarter: the engine lights a
           stroke along its upper side, which on a wash of level strokes would show every one as a pale-rimmed scale (a
           cobbled hill at dusk); an upright one's light falls along its length, where it hardly shows. */
        const lay = (n, { long, wide, turn = 0, ...o }) =>
          put(n, { ...o, long: long * wide, wide: 1 / wide, turn: turn + Math.PI / 2 })
        // a stroke of the school, rooted far under the canvas, where nothing that goes by can stir it
        const fishPut = (n, { x, y, ...o }) => {
          rand.reseed(73001 + n * 7919)
          const root = h + 400
          garden.dab({
            kind: EC_PLAIN,
            blur: 0.6,
            load: 0.95,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // a blade standing on its own foot, which sways in the wind and parts as the breeze goes by
        const grow = (n, { x, y, tall, ...o }) => {
          rand.reseed(75001 + n * 7919)
          garden.dab({
            kind: EC_PLAIN,
            blur: 0.5,
            load: 0.85,
            stiff: 0.6,
            ...o,
            x,
            y,
            stem: tall / 2,
            long: tall / 2,
            turn: -Math.PI / 2,
          })
        }
        // a flower on a short stem, which nods in the wind and is pushed aside as the breeze goes by
        const speck = (n, { x, y, r, stem, ...o }) => {
          rand.reseed(77001 + n * 7919)
          garden.dab({ kind: EC_PLAIN, blur: 0.4, load: 0.9, stiff: 0.7, wide: 0.82, ...o, x, y, stem, long: r })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const r = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.53)
          const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * u
          const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875
        const crestY = (x) => fy(ecCrestF(ecU(x, w)))
        // the breeze's way (the passer's), on the canvas
        const pathY = (x) => base + room * (EC_D0 + EC_D1 * ((2 * x) / w - 1))
        // how near a place on the hill is, from its crest (0) to the canvas's foot (1)
        const depthAt = (x, y) => clamp((y - crestY(x)) / Math.max(1, h - crestY(x)), 0, 1)
        // strokes keep their size with the picture, which is as tall on any canvas, a little smaller on a phone
        const sz = clamp(w / 1000, 0.85, 1)
        // and on a canvas much wider than a laptop's they are laid a little further apart (the grass and the flowers the
        // most), so that it is not twice the work
        const spread = Math.max(1, (w / 1400) ** 0.5)
        const ramp = (tone, i) => `ec_${tone}${clamp(Math.round(i), 0, 6)}`
        /* The light on the hill at a place, from deep shade (0) to the full sun (1): sunnier up to the right; a band of sun
           along the breeze's way, running up the hill from the lower left; a hollow of deep shade on the left under the crest,
           over the band, its edge sweeping down to the left as the reference's does; the near shade along the foot; and
           the light broken a little everywhere, as by the grass's own lie. */
        const lightAt = (x, y) => {
          const u = ecU(x, w)
          const f = ff(y)
          const c = ecCrestF(u)
          // how far under the breeze's way, as a share of the picture (less than nothing over it), a little wavering
          const below = f - ff(pathY(x)) + 0.012 * Math.sin(u * 8.3 + 1.1) + 0.014 * Math.sin(u * 3.1 + 2.2)
          // over the way the upper slope, sunnier to the right; under it a middling green
          const upper = 0.66 + 0.16 * (clamp(u, 0, 1.1) - 0.5)
          let light = upper + (0.42 - upper) * smooth(-0.02, 0.09, below)
          const edge = 0.64 - 1.25 * (f - c)
          // the hollow (on a screen wide enough to show the land past the hill's left, ending before the far swell there)
          const hollow =
            smooth(c + 0.03, c + 0.16, f) *
            (1 - smooth(edge - 0.12, edge + 0.1, u)) *
            (1 - smooth(-0.11, -0.045, below)) *
            smooth(-0.3, -0.06, u)
          light += (0.02 - light) * hollow
          // and the far right, where the hill turns away from the sun
          light -= 0.22 * smooth(0.86, 1.02, u) * (1 - smooth(-0.08, 0, below))
          // and the shadow of a cloud on the upper slope to the right of the knoll
          light -=
            0.4 * Math.exp(-(((u - 0.9) / 0.07) ** 2) - ((f - c - 0.1) / 0.06) ** 2) * (1 - smooth(-0.07, -0.02, below))
          // the near shade, its edge sweeping up and down in long lobes, so that across a wide screen it is no level band
          const near = 0.12 + 0.06 * Math.sin(u * 4.1 + 0.4) + 0.03 * Math.sin(u * 9.7 + 1.3)
          light += (0.05 - light) * smooth(near - 0.03, near + 0.05, below)
          // the band of sun, wider in some places than in others, so that on a wide screen it is no ruled stripe either
          const wide = (0.07 + 0.045 * clamp(u, -0.3, 1.3)) * (1 + 0.22 * Math.sin(u * 4.7 + 0.9))
          light += (0.98 - light) * Math.exp(-(((below + 0.008) / wide) ** 2))
          light += (fbm(x / 150, y / 80) - 0.5) * 0.16
          return clamp(light, 0, 1)
        }
        let n = 0

        /* The sky's wash: soft blue over its lines, the saturated blue by the hill and coming in from almost nothing under
           the buttons. Each row lies at its own share of the way down to the crest under it, so the blue deepens along
           the hill's line, never a level one; each stroke as soft as it can be without reaching past the buttons, jittered
           by half a row so no row's edge shows; the ramp of blues, more than the paint's load, deepens it. */
        const washStep = 0.05 * w + 40
        const skyF = (x) => ecCrestF(ecU(x, w))
        // (under it, the deepest blue in short strokes along the crest, which long ones leave bare on a steep shoulder)
        for (let x = -8; x < w + 8; x += 9) {
          const y = crestY(x) - 4
          if (y - top < 14) {
            continue
          }
          lay((n += 1), {
            x,
            y,
            long: 9,
            wide: 0.6,
            turn: Math.atan2(crestY(x + 6) - crestY(x - 6), 12),
            blur: 7,
            paints: ['ec_sky5', 'ec_sky5'],
            load: 0.7,
            order: 39.9,
          })
        }
        const SKY_ROWS = 10
        const cols = Math.ceil(w / washStep) + 2
        for (let row = 0; row < SKY_ROWS; row += 1) {
          for (let i = 0; i < cols; i += 1) {
            const q = row * 131 + i * 17 + 3
            const x = (i - 0.5 + (row % 3) / 3 + (hashed(q * 1.3) - 0.5) * 0.4) * washStep
            const c = skyF(x)
            const sky = (c - 0.03) * pic
            const k = clamp((row + 0.5 + (hashed(q * 2.1) - 0.5) * 0.9) / SKY_ROWS, 0.03, 1.02)
            const y = fy(0.03) + k * sky
            const gap = sky / SKY_ROWS
            const load = (0.07 + 0.68 * smooth(0, 0.6, k)) * (0.88 + 0.24 * hashed(q * 4.3))
            const paint = `ec_sky${clamp(Math.round(5 * k ** 1.1 + (hashed(q * 5.9) - 0.5) * 0.6), 0, 5)}`
            const blur = clamp(y - top, 4, washStep * 0.5)
            const tall = clamp(0.4 * (y - top), 2, Math.min(0.42 * washStep * 0.95, 1.3 * gap))
            lay((n += 1), {
              x,
              y,
              long: washStep * 0.95,
              wide: tall / (washStep * 0.95),
              turn: Math.atan2(skyF(x + 30) - skyF(x - 30), 60 / pic) * k,
              blur,
              paints: [paint, paint],
              load,
              order: 40 + row * 0.01,
            })
          }
        }
        /* and low in the sky the light at the horizon, which is level, behind the hill: at dusk a warm glow over the low
           land to the left and right, with the knoll rising above it into the indigo; by day only the sky's own deep
           blue, as it is there. In broad soft rows, wavering a little across the canvas so that none lies along a ruled
           line (the hill hides their foot). */
        ;[0.22, 0.27, 0.32, 0.37].forEach((at, row) => {
          for (let i = -1; i < w / (washStep * 0.7) + 1; i += 1) {
            const q = row * 977 + i * 31 + 5
            const x = (i + (row % 2) * 0.5 + (hashed(q * 1.7) - 0.5) * 0.4) * washStep * 0.7
            const f =
              at +
              0.014 * Math.sin((x / w) * 4.3 + row * 1.9) +
              0.02 * (fbm(x / 260, row * 2.7) - 0.5) +
              (hashed(q * 2.3) - 0.5) * 0.02
            if (fy(f) > crestY(x) + 0.08 * pic) {
              continue
            }
            const room = fy(f) - top
            const blur = Math.min(washStep * 0.55, 0.9 * room)
            const tall = Math.min(washStep * 0.7 * 0.3, 0.45 * room)
            lay((n += 1), {
              x,
              y: fy(f),
              long: washStep * 0.7,
              wide: tall / (washStep * 0.7),
              blur,
              paints: [`ecGlow${row}`, `ecGlow${row}`],
              load: (0.12 + 0.09 * row) * (0.8 + 0.4 * hashed(q * 3.1)),
              order: 41 + row * 0.01,
            })
          }
        })
        // a few stars, high in the sky, hardly to be told from it by day
        for (let k = 0; k < 18; k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const y = fy(0.05 + hashed(k * 3.7 + 0.9) * 0.6 * (ecCrestF(ecU(x, w)) - 0.08))
          const r = (0.8 + 1.3 * hashed(k * 7.3) ** 2) * sz
          put((n += 1), {
            x,
            y,
            long: r * 1.5,
            wide: 1,
            blur: r * 1.1,
            paints: ['ecStarGlow', 'ecStarGlow'],
            load: 0.1,
            kind: EC_GLIMMER,
            order: 42,
          })
          put((n += 1), {
            x,
            y,
            long: r * 0.5,
            wide: 1,
            blur: r * 0.2,
            paints: ['ecStar', 'ecStar'],
            load: 0.9,
            kind: EC_TWINKLE,
            order: 42.1,
          })
        }

        /* The hill's body: a wash of soft strokes over its lines, in rows that follow its crest near the top and lie
           level further down, each the green of the light where it is, so that its lines show through it as a grain and
           its crest is one smooth line, not a row of heaps; the first rows thin, so that the crest is crisp against the
           sky. Over every other row, a haze of the flowers' yellow where the sun is, the far flowers too small to be seen
           one by one: the yellow the hill is covered in. */
        // (under its first rows, a solid strip of the crest's green, so the sky never shows through as a grey rim)
        for (let x = -6; x < w + 6; x += 7) {
          const c = crestY(x)
          const tone = ramp('wash', lightAt(x, c + 6) * 6)
          lay((n += 1), {
            x,
            y: c + 6.3,
            long: 7,
            wide: 0.8,
            turn: Math.atan2(crestY(x + 5) - crestY(x - 5), 10),
            blur: 1.4,
            paints: [tone, tone],
            load: 1,
            order: 99,
          })
        }
        const ug = 17 * sz * spread
        // (from the crest's highest place, its knoll, down past the canvas's foot)
        const highest = Math.min(...Array.from({ length: 33 }, (_, i) => crestY((i / 32) * w)))
        const rows = Math.ceil((h + ug - highest) / (ug * 0.5))
        for (let r = 0; r < rows; r += 1) {
          const thin = r < 2
          const step = ug * (thin ? 1.4 : 1)
          for (let gx = -step; gx < w + step; gx += step) {
            const q = r * 7919 + Math.round(gx / step) * 131 + 17
            const x = gx + (r % 2) * step * 0.5 + (hashed(q * 0.013 + 0.3) - 0.5) * step * 0.4
            const c = crestY(x)
            const t = thin ? 0 : (r - 1.5) / (rows - 1.5)
            // (jittered by a whole row and more down the hill, so that the rows never show as stripes)
            let y = thin
              ? c + (r ? 7 : 1.9) * sz
              : c +
                9 * sz +
                t * (h + ug - c - 9 * sz) +
                (hashed(q * 0.017 + 0.2) - 0.5) * ug * Math.min(1.1, 0.25 + r * 0.2)
            if (y > h + ug) {
              continue
            }
            let long = thin ? step * 0.8 : ug * (0.85 + 0.6 * hashed(q * 0.023))
            let wide = thin ? (r ? 0.18 : 0.12) : 0.42 + (0.2 + 0.25 * t) * hashed(q * 0.031)
            const blur = thin ? 1.6 : ug * 0.4
            // near the crest none pokes up over it, soft edge and all, which would heap the crest into a row of mounds: it
            // is laid lower instead, as large as it was, so that it leaves no hole under the crest either
            if (!thin && r < 6) {
              y = Math.max(y, c + 1 + long * wide + 0.35 * blur)
            }
            const lie = Math.atan2(crestY(x + 20) - crestY(x - 20), 40) * (1 - t) ** 1.5
            let turn = lie + (thin ? 0 : (hashed(q * 0.029) - 0.5) * (0.3 + 0.5 * t) * Math.min(1, r / 5))
            /* Where the light changes steeply (a shadow's edge), a round stroke across the change would show as a heap on
               it, so there the stroke is longer and flatter and lies along the edge. */
            if (!thin) {
              const across = lightAt(x + 6, y) - lightAt(x - 6, y)
              const down = lightAt(x, y + 6) - lightAt(x, y - 6)
              if (Math.abs(down) > 0.15 || Math.abs(across) > 0.15) {
                let along = Math.atan2(across, -down)
                along = along > Math.PI / 2 ? along - Math.PI : along < -Math.PI / 2 ? along + Math.PI : along
                turn = clamp(along, -0.6, 0.6)
                long *= 1.4
                wide = Math.min(wide, 0.32)
              }
            }
            const d = depthAt(x, y)
            const light = lightAt(x, y)
            const i = light * 6 + (hashed(q * 0.019) - 0.5) * 0.5
            // (fuller in the deepest shade, so that nothing under it lifts the shadow)
            const load = thin ? 0.9 : 0.8 + 0.06 * (1 - smooth(0.05, 0.3, light))
            lay((n += 1), {
              x,
              y,
              long,
              wide,
              turn,
              blur,
              paints: [ramp('wash', i + 0.35), ramp('wash', i - 0.35)],
              load,
              order: 100 + r * 0.001,
            })
            if (r % 2 === 1 && light > 0.35) {
              lay((n += 1), {
                x: x + step * 0.3,
                y,
                long: ug * 0.95,
                wide: 0.48,
                turn: lie,
                blur: ug * 0.4,
                paints: [ramp('bloom', light * 6 - 0.3), ramp('bloom', light * 6 - 1.2)],
                load: (0.2 + 0.32 * (1 - d)) * smooth(0.35, 0.95, light),
                order: 101 + r * 0.001,
              })
            }
          }
        }

        /* The grass over it: short upright strokes, bristled where they are near enough for it to show, the green of the
           light where they stand, taller and further apart down the hill; taller still along the breeze's way, where they
           part as it goes by. */
        for (let gy = fy(0.08); gy < h + 4; ) {
          const dep = clamp((gy - fy(0.15)) / (h - fy(0.15)), 0, 1)
          const step = (5.2 + 7 * dep) * sz * spread ** 1.4
          for (let gx = -step; gx < w + step; gx += step) {
            const q = Math.round(gx * 7.1) * 7919 + Math.round(gy * 3.3) * 104729 + 11
            const x = gx + (hashed(q * 0.013 + 0.1) - 0.5) * step * 1.4
            const y = gy + (hashed(q * 0.017 + 0.6) - 0.5) * step * 0.8
            const c = crestY(x)
            if (y < c + 1.5) {
              continue
            }
            const d = depthAt(x, y)
            const way = Math.exp(-(((y - pathY(x) - 6) / 22) ** 2))
            const tall = (3 + 10 * d ** 1.1) * sz * (0.6 + 0.8 * hashed(q * 0.023)) * (1 + 0.7 * way)
            const light = lightAt(x, y)
            const i = light * 6 + (hashed(q * 0.029) - 0.5) * 0.9
            grow((n += 1), {
              x,
              y,
              tall,
              wide: clamp((0.7 + 0.7 * d) / (tall / 2), 0.05, 0.45),
              blur: 0.35 + 0.3 * d,
              paints: [ramp('grass', i + 0.6), ramp('grass', i - 0.2)],
              load: 0.75 + 0.2 * hashed(q * 0.031),
              kind: tall > 5 ? EC_BRISTLE : EC_PLAIN,
              lean: (hashed(q * 0.037) - 0.5) * 0.6 + 0.12,
            })
          }
          gy += step * 0.9
        }

        /* Along the breeze's way the grass stands taller and closer, lit, a flower in it here and there: what it parts as
           it runs through (see `passer`). */
        /* Three close rows, lithe (they give to the wind and the breeze far more than the rest), their tips lit, so that
           the ripple the breeze leaves in them shows: pushed on after it, springing back past upright, settling. */
        for (let x = -6; x < w + 6; x += 1.9 * sz * spread) {
          for (let j = 0; j < 3; j += 1) {
            const q = Math.round(x * 13.7) * 31 + j * 104729 + 7
            const bx = x + (hashed(q * 0.11) - 0.5) * 3
            if (fbm(bx / 90, j * 3.1) < 0.3 && hashed(q * 0.07) < 0.6) {
              continue
            }
            const y = pathY(bx) + [-3, 3, 9][j] * sz + (hashed(q * 0.13) - 0.5) * 9 * sz
            const light = lightAt(bx, y)
            const tall = (12 + 10 * hashed(q * 0.17) ** 1.3) * sz
            grow((n += 1), {
              x: bx,
              y,
              tall,
              wide: clamp(1.1 / (tall / 2), 0.05, 0.3),
              blur: 0.45,
              paints: [ramp('grass', light * 6 - 0.6), ramp('grass', light * 6 + 1.2 - 0.5 * j)],
              load: 0.8,
              kind: EC_BRISTLE,
              stiff: 0.28,
              lean: (hashed(q * 0.19) - 0.5) * 0.5 + 0.15,
            })
            if (hashed(q * 0.23) < 0.22) {
              speck((n += 1), {
                x: bx + 1,
                y,
                r: (1.2 + 0.8 * hashed(q * 0.29)) * sz,
                stem: tall * (0.5 + 0.4 * hashed(q * 0.31)),
                stiff: 0.3,
                paints: [ramp('bloom', light * 6 + 0.5), ramp('bloom', light * 6 - 0.5)],
                load: 0.9,
              })
            }
          }
        }

        /* The flowers: small yellow specks over all of it, on short stems over the grass, smaller and closer far up the
           hill, bright in the sun and dim in the shade, and more of them where the sun is. */
        for (let gy = fy(0.08); gy < h + 4; ) {
          const dep = clamp((gy - fy(0.15)) / (h - fy(0.15)), 0, 1)
          const step = (3.9 + 6 * dep) * sz * spread ** 1.4
          for (let gx = -step; gx < w + step; gx += step) {
            const q = Math.round(gx * 5.3) * 6151 + Math.round(gy * 2.9) * 92821 + 29
            const x = gx + (hashed(q * 0.011 + 0.4) - 0.5) * step * 1.3
            const y = gy + (hashed(q * 0.019 + 0.8) - 0.5) * step * 0.9
            if (y < crestY(x) + 1) {
              continue
            }
            const light = lightAt(x, y)
            if (hashed(q * 0.041) > 0.2 + 0.8 * light) {
              continue
            }
            // gathered in drifts, as wildflowers grow, thinner in the shade, rather than spread as evenly as dots
            if (fbm(x / 60, y / 30) < 0.3 + 0.25 * (1 - light)) {
              continue
            }
            const d = depthAt(x, y)
            const hh = hashed(q * 0.043)
            // mostly fine specks, a few larger, each a little oval and turned its own way
            const r = (0.8 + 1.1 * d ** 1.4) * sz * (0.72 + 0.7 * hh * hh)
            const i = light * 6 + (hashed(q * 0.047) - 0.5) * 1.6
            speck((n += 1), {
              x,
              y,
              r,
              wide: 0.68 + 0.25 * hashed(q * 0.067),
              stem: r * 1.2 + 3 * d * hashed(q * 0.053),
              turn: hashed(q * 0.059) * Math.PI,
              paints: [ramp('bloom', i + 0.4), ramp('bloom', i - 0.6)],
              load: (0.8 + 0.18 * hashed(q * 0.061)) * (0.55 + 0.45 * smooth(0.1, 0.45, light)),
            })
          }
          gy += step * 0.85
        }

        /* The grass on the crest against the sky: tufts here and there up out of its line, a few blades each, of all
           heights and leaning a little in the wind, in the lit green of the crest; and now and then a flower. */
        for (let x = -4; x < w + 4; x += 7 * sz * spread) {
          const q = Math.round(x * 10.3) + 501
          if (hashed(q * 0.3) < 0.35) {
            continue
          }
          const many = 2 + Math.floor(hashed(q * 0.9) * 4)
          for (let j = 0; j < many; j += 1) {
            const bx = x + (hashed(q * 1.1 + j * 2.3) - 0.5) * 6 * sz
            const y = crestY(bx) + 1.2 + hashed(q * 0.7 + j) * 1.5
            const light = lightAt(bx, y + 6)
            const tall = (1.6 + 4.2 * hashed(q * 1.3 + j * 3.1) ** 2) * sz
            // (never the palest of the greens, which along a sunlit shoulder read as a pale rim drawn round the hill)
            grow((n += 1), {
              x: bx,
              y,
              tall,
              wide: clamp(0.5 / (tall / 2), 0.05, 0.4),
              blur: 0.45,
              paints: [ramp('grass', Math.min(4.6, light * 6 + 0.4)), ramp('grass', Math.min(4, light * 6 - 0.3))],
              load: 0.8,
              lean: (hashed(q * 2.1 + j) - 0.5) * 0.8 + 0.12,
            })
          }
          if (hashed(q * 3.7) < 0.3) {
            const light = lightAt(x, crestY(x) + 6)
            speck((n += 1), {
              x: x + 1,
              y: crestY(x) + 1.5,
              r: 0.7 * sz,
              stem: 2.5 * sz,
              paints: [ramp('bloom', light * 6 + 0.3), ramp('bloom', light * 6 - 0.5)],
              load: 0.85,
            })
          }
        }

        // A few daisies down the hill, the most near the breeze's way, where its petals come from.
        for (let k = 0; k < Math.round(34 * (w / EC_UNIT) ** 0.8); k += 1) {
          const x = hashed(k * 3.9 + 0.7) * w
          const nearWay = hashed(k * 5.3 + 0.2) < 0.6
          const y = nearWay ? pathY(x) + (hashed(k * 6.1) - 0.3) * 40 : fy(0.55 + 0.4 * hashed(k * 7.7))
          if (y < crestY(x) + 0.2 * pic || y > h - 10) {
            continue
          }
          const d = depthAt(x, y)
          const r = (1.3 + 1.6 * d) * sz * (0.8 + 0.4 * hashed(k * 8.3))
          rand.reseed(79001 + k)
          garden.bloom({
            x,
            y,
            stem: r * 2.2,
            reach: r,
            petals: 9 + Math.floor(hashed(k * 9.1) * 4),
            blur: 0.4 + 0.3 * d,
            paints: ['ecPetal', 'ecPetalShade'],
            stiff: 0.6,
            order: y + 0.5,
          })
        }

        /* The breeze's wake, painted round the canvas's middle (the shader carries it where it is, see schoolVertex) as
           the school's first, behind its middle, which is on the passer's way: the grass it has just run through, swept
           up behind it as in the second picture, blades rising and curving back, a little deeper green at their feet
           than the sunlit grass round them and paler at their tips, as grass turned over by the wind is, fading behind,
           a daisy or two and a few yellow flowers tossed up in it. Nothing is painted at its middle or ahead of it, so
           what runs is never seen, only the grass it sweeps up and the meadow parting round it (see `passer`); and the
           wake rises out of the grass at its front rather than standing there at its full height, which with nothing in
           front of it would read as a dark tuft carried along. Painted with the school, it is in every still; in motion
           the meadow ripples too. */
        const hx = w / 2
        const hy = h / 2
        const D = 44 * ecScale(w)
        {
          const id = 90000
          // (its strokes keep the numbers, and so the seeds and the order, they were found with)
          let k = 1
          const dab = (lx, ly, r, paints, o = {}) => {
            k += 1
            fishPut(id + k, {
              x: hx + lx * D,
              y: hy + ly * D,
              long: r * D,
              wide: o.wide ?? 0.92,
              turn: o.turn ?? 0,
              blur: (o.blur ?? 0.14) * r * D + 0.3,
              paints,
              load: o.load ?? 0.97,
              kind: o.kind ?? EC_PLAIN,
              order: 2000 + k * 1e-4,
              phase: 400,
            })
          }
          // (the grass parted under it, a little in shadow, along the way it has come)
          dab(-0.52, 0.03, 0.4, ['ec_grass3', 'ec_grass2'], {
            wide: 0.3,
            turn: 0.32,
            blur: 0.6,
            load: 0.3,
            kind: EC_HAZE,
          })
          for (let j = 0; j < 22; j += 1) {
            const s = j / 21
            const g = (m) => ecHash(j * 5.7 + m * 1.9 + 0.3)
            const lx = -0.16 - 0.78 * s + (g(1) - 0.5) * 0.05
            // (rising from a third of its height at the front to its full height a third of the way back)
            const rise = smooth(0, 0.33, s)
            const tall = (0.6 - 0.4 * s) * (0.72 + 0.56 * g(2)) * (0.35 + 0.65 * rise)
            const lean = 0.5 + 0.5 * s + (g(3) - 0.5) * 0.3
            const ly = 0.13 + (g(4) - 0.5) * 0.04
            const fade = (1 - 0.72 * s ** 1.3) * (0.45 + 0.55 * rise)
            // each blade in two strokes, its tip bent back further than its foot, so that it curves as swept grass does
            const l1 = lean * 0.6
            const a1 = tall * 0.55
            const mx = lx - Math.sin(l1) * a1
            const my = ly - Math.cos(l1) * a1
            dab((lx + mx) / 2, (ly + my) / 2, a1 / 2, [j % 3 ? 'ec_grass3' : 'ec_grass2', 'ec_grass4'], {
              wide: 0.2,
              turn: -Math.PI / 2 - l1,
              blur: 0.05,
              load: 0.9 * fade,
            })
            const l2 = lean * 1.35
            const a2 = tall * 0.5
            dab(
              mx - Math.sin(l2) * a2 * 0.5,
              my - Math.cos(l2) * a2 * 0.5,
              a2 / 2,
              ['ec_grass4', j % 2 ? 'ecWakeTip' : 'ecWake'],
              { wide: 0.18, turn: -Math.PI / 2 - l2, blur: 0.05, load: 0.9 * fade },
            )
          }
          ;[
            [-0.38, -0.24, 0.036],
            [-0.6, -0.15, 0.03],
            [-0.27, -0.36, 0.028],
          ].forEach(([lx, ly, r]) => {
            dab(lx, ly, r, ['ecPetal', 'ecPetalShade'], { wide: 0.9, blur: 0.3, load: 0.92 })
            dab(lx, ly, r * 0.35, ['ec_bloom6', 'ec_bloom4'], { wide: 1, blur: 0.3 })
          })
          ;[
            [-0.47, -0.31],
            [-0.72, -0.08],
            [-0.33, -0.12],
          ].forEach(([lx, ly]) => {
            dab(lx, ly, 0.024, ['ec_bloom6', 'ec_bloom5'], { wide: 0.8, blur: 0.3 })
          })
        }

        // Its petals: each a daisy's petal, turning over about its own middle as it drifts.
        for (let i = 1; i <= EC_PETALS; i += 1) {
          const long = (1.9 + 0.8 * ecHash(i * 3.3)) * ecScale(w)
          fishPut(91000 + i * 10, {
            x: hx,
            y: hy,
            long,
            wide: 0.4,
            turn: ecHash(i * 5.1) * Math.PI,
            blur: 0.5,
            paints: ['ecPetal', 'ecPetalShade'],
            load: 0.95,
            order: 2001 + i * 0.01,
            phase: 400 + i + 0.2,
          })
        }
      },
    }

    /* --- the fintech page's hero ------------------------------------------------------------------------------- */

    /* The hero of /use-cases/fintech, after the three pictures of the northern lights Cameron sent and the card first
       painted from them: a night sky in the land's own fine lines (the blue hour on a light page, deeper on a dark one)
       that starts just under the buttons and comes in from nothing there, slowly, as the forest's mist does, so that it
       has no top edge anywhere and nothing is painted behind or round the words; the aurora's long curtain sweeping
       across it, coming down from the upper left to its lowest over a saddle and folding up again to the right and out,
       the words standing in the V it makes, its arms rising beside them (never over them), dimming and shortening as they
       climb and thinning away into the page; its light in fine upright rays, white and cyan along its lower edge and going
       blue and lilac as they rise, rippling slowly in the wind; stars; and a range of snowy mountains along the foot, a
       high peak on the right, fading into the page. */
    const UF_EVEN = 0.005
    // marked as mist and even: thins into the grain's specks above the band the planting gives (garden.mist)
    const UF_MIST = 0.0075
    const UF_HAZE = 0.4 + UF_EVEN
    const UF_HAZE_MIST = 0.4 + UF_MIST
    const UF_BRUSH_MIST = 0.0025
    const UF_TWINKLE = 3.25 + UF_EVEN
    const UF_GLIMMER = 3.4 + UF_EVEN
    const UF_GLIMMER_MIST = 3.4 + UF_MIST
    /* How far the aurora keeps from the words: an oval as wide and tall as the words' box and this much more to either side
       and above and below, into which a curtain fades as it comes towards them. It is the aurora's own; the lines' veil
       stays the sky's small one, since the sky starts under the buttons and never comes up round the words. */
    const UF_CLEAR = [300, 100]
    // and how wide, as a share of the canvas, its half is at most where the curtain's arms come by it (see `armA`)
    const UF_CLEAR_SHARE = 0.445
    /* How much room there is beside the words for the picture to go on up: none on a phone, where they are as wide as the
       canvas. A hook of the stage or the garden, both of which know the canvas's size and where the words are. */
    const ufRoomy = ({ w, words }) => smooth(60, 300, w / 2 - words.a)
    /* The band, in CSS pixels down the canvas, over which the sky's lines come in from nothing (the mode's `fade`), as the
       forest's mist does: from the buttons' foot, slowly, over more than half the picture, so that where they start is no
       edge and they are at their full only down among the mountains. */
    const ufFadeAt = (stage) => {
      const foot = stage.words.y + stage.words.b
      ufNarrow = smooth(700, 480, stage.w)
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    /* How much the canvas the sky was last laid out on is a phone's (set as its fade is worked out, above). There its
       lines come in more slowly at first (the fade's `ease`, below, which the engine reads as it draws), so that its first
       ones are as faint as on a wider canvas and none of them stands alone above the rest; lower down, where the fade is
       nearly whole, the night is as deep as it was. */
    let ufNarrow = 0
    /* The band over which the curtains' light thins away upward into the page (garden.mist): with room beside the words,
       from a little under their top to a little under their middle, beside which an arm of the curtain rises, already
       faint there (see `climb` in the planting), so that only its last light breaks into specks and it is gone well
       before the header; with none, as on a phone, where the curtain lies wholly under the words, from the buttons' foot
       a fifth of the way down the picture, over which the rays' tips go into the sky as it comes in. */
    const ufMistAt = (stage) => {
      const { h, words } = stage
      const roomy = ufRoomy(stage)
      const foot = words.y + words.b
      const pic = h - foot
      const beside = [words.y - 0.8 * words.b, words.y + 0.2 * words.b]
      const under = [foot - 0.05 * pic, foot + 0.2 * pic]
      return [under[0] + (beside[0] - under[0]) * roomy, under[1] + (beside[1] - under[1]) * roomy]
    }
    // how freely the wind moves a curtain: a few pixels either way, rooted far under the canvas
    const UF_GIVE = 0.045
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const ufHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    /* A range's line: the peaks, each [across, how high above `base` in rooms, how far it reaches to its left and to its
       right], with flanks hollowed as a mountain's are, running into each other at rounded saddles rather than notches,
       and crags all along. On a narrow canvas the peaks reach further across (`wide`), so a phone's are not needles. */
    const ufPeaks = (base, peaks, rough, seed, wide = 1, tall = 1) =>
      Array.from({ length: 129 }, (_, k) => {
        const across = -1.6 + k * 0.025
        let sum = 0
        for (const [at, high, left, right] of peaks) {
          const reach = (across < at ? left : right) * wide
          sum += Math.exp(60 * high * tall * Math.max(0, 1 - Math.abs(across - at) / reach) ** 1.5)
        }
        let up = Math.log(Math.max(1, sum)) / 60
        const a = across / wide
        up +=
          rough *
          (Math.sin(a * 37.3 + seed) * 0.6 +
            Math.sin(a * 83.1 + seed * 2.3) * 0.4 +
            (ufHash(k * 1.7 + seed) - 0.5) * 0.6)
        return [Math.round(across * 1000) / 1000, Math.round((base - up) * 10000) / 10000]
      })
    // how much further across a peak reaches on a canvas this wide; and how high it stands there, lower on a phone's, where
    // the peaks would otherwise be steep and fill too much of the picture; and how craggy its line is, less on a phone's
    const ufWide = (w) => Math.min(2.2, Math.max(1, 1232 / w) ** 0.55)
    const ufTall = (w) => 0.74 + 0.26 * smooth(480, 900, w)
    const ufRough = (w, rough) => rough * (0.55 + 0.45 * smooth(480, 900, w))
    // the ranges' bases, in rooms: the far one's valleys, and the near one's, which run into the canvas's foot
    const UF_FAR_BASE = 1.02
    const UF_NEAR_BASE = 1.12
    const UF_FAR_PEAKS = [
      [-1.2, 0.2, 0.35, 0.3],
      [-0.82, 0.24, 0.32, 0.34],
      [-0.42, 0.18, 0.3, 0.36],
      [-0.02, 0.1, 0.28, 0.28],
      [0.3, 0.2, 0.3, 0.28],
      [0.86, 0.26, 0.34, 0.3],
      [1.25, 0.2, 0.3, 0.3],
    ]
    const UF_NEAR_PEAKS = [
      [-1.12, 0.26, 0.3, 0.3],
      [-0.92, 0.36, 0.26, 0.42],
      [-0.5, 0.2, 0.24, 0.3],
      [-0.15, 0.12, 0.3, 0.28],
      [0.14, 0.18, 0.22, 0.2],
      [0.36, 0.22, 0.16, 0.14],
      [0.56, 0.52, 0.42, 0.34],
      [0.98, 0.3, 0.2, 0.3],
      [1.3, 0.24, 0.3, 0.3],
    ]
    /* The curtains, from the furthest, each along a curve, its lower edge, as places the curve goes through in turn (so it
       can fold back on itself, as a curtain does): [share across, share of the picture under the buttons down from the
       buttons' foot where there is room beside the words, the same where there is not, as on a phone]; above the buttons'
       foot is less than nothing. Where there is room beside the words the curtain comes down from high on the left past
       them and goes up and out on the right past them, so that the words stand in the V it makes; on a phone, where the
       words are as wide as the canvas, it all lies under them, as the card's did. How tall its rays are (a share of the
       picture) and how bright it is, both as [share of the way along, value]; how it is painted; its phase in the wind;
       and where it is painted. (The far faint one that stood high on the right is gone: up there now is the page.) */
    const UF_CURTAINS = [
      {
        /* The long sweep, as the third picture has it: a broad curtain coming down from the top left in a long diagonal to
           its lowest, just over the saddle left of the high peak, and a narrower one going up again from there to the
           right and out, folding back on itself once on the way. */
        edge: [
          [-0.26, -0.03, 0.08],
          [-0.1, 0.03, 0.12],
          [0.06, 0.11, 0.18],
          [0.2, 0.21, 0.26],
          [0.32, 0.31, 0.33],
          [0.43, 0.42, 0.42],
          [0.52, 0.52, 0.5],
          [0.585, 0.58, 0.56],
          [0.63, 0.51, 0.51],
          [0.66, 0.42, 0.43],
          [0.645, 0.34, 0.36],
          [0.71, 0.26, 0.3],
          [0.83, 0.16, 0.24],
          [0.97, 0.07, 0.19],
          [1.12, 0.0, 0.14],
          [1.3, -0.05, 0.1],
        ],
        tall: [
          [0, 0.72],
          [0.3, 0.68],
          [0.46, 0.52],
          [0.53, 0.34],
          [0.59, 0.25],
          [0.66, 0.34],
          [0.8, 0.46],
          [1, 0.52],
        ],
        bright: [
          [0, 0.9],
          [0.1, 1],
          [0.46, 1],
          [0.53, 0.9],
          [0.59, 0.65],
          [0.66, 0.72],
          [0.82, 0.74],
          [1, 0.7],
        ],
        tone: 'near',
        phase: 3.7,
        order: 500,
      },
    ]
    // The night's inks, light and dark: the blue hour on a light page, and a deeper night on a dark one.
    const UC_FINTECH_INKS = {
      ...SK_INKS,
      // the sky, from where it comes in under the buttons down to the glow over the mountains: by day a pale blue where it
      // comes in, so its first lines are hardly to be told from the page, deepening through a dusk blue to the night
      ufTop: ['#d3dbf6', '#141c58'],
      ufDusk: ['#6b82d6', '#10185a'],
      ufHigh: ['#141f68', '#0b1244'],
      ufMid: ['#13307e', '#0b1d52'],
      ufLow: ['#173f8e', '#0f2a64'],
      ufHorizon: ['#2558a6', '#173c7c'],
      // the far range, in the night's own blue and a little deeper than the sky over it
      ufFar: ['#2a5598', '#1b3f78'],
      ufFarDeep: ['#22498a', '#16356a'],
      // the near range's rock, a deep night blue
      ufRock: ['#10214e', '#0f1f48'],
      ufRockDeep: ['#0a1638', '#091433'],
    }
    const UC_FINTECH = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      /* No beads: on the rock they only crawled, and the stars are painted. The gaps between the lines lifted only a very
         little on a light page, so the night reads as a deep, grainy blue rather than in pale pinstripes; and the sky's
         small, shallow oval of page round the words, since the sky starts under the buttons. */
      lines: { ...SKY.lines, beadChance: 0, lift: 0.03, veil: [80, 18] },
      inks: UC_FINTECH_INKS,
      /* The sky's lines come in from nothing under the buttons (see ufFadeAt), pale and few, so that where they start is
         no edge: never a lone hairline across the canvas, and never a striped band. */
      fade: {
        at: ufFadeAt,
        get ease() {
          return 1.15 + 0.25 * ufNarrow
        },
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      // the curtains' arms rise beside the words against the page, and thin away into it (garden.mist)
      onPage: true,
      land: {
        ...SKY.land,
        sheets: [
          /* The night, from just under the buttons' foot down, as the forest's mist is: it comes in from nothing there (its
             `fade`), so it has no top line of its own and nothing of it is behind or round the words. Its colours by its
             height, from the indigo where it comes in to the deep blue, royal blue lower down and the glow over the
             mountains. */
          {
            ...SKY.land.sheets[0],
            paint: [
              [0, 'ufTop', 0.4],
              [0.18, 'ufTop', 1],
              [0.34, 'ufDusk', 1],
              [0.48, 'ufHigh', 1],
              [0.63, 'ufMid', 1],
              [0.78, 'ufLow', 1],
              [0.93, 'ufHorizon', 1],
              [1, 'ufHorizon', 1],
            ],
            fade: true,
            fill: 0.94,
            under: 0.95,
          },
          // the far range, low and hazy, and the near one, its high peak on the right, in the land's lines, close and still
          {
            name: 'far',
            opaque: true,
            laid: true,
            top: ({ w }) => ufPeaks(UF_FAR_BASE, UF_FAR_PEAKS, ufRough(w, 0.006), 1.3, ufWide(w), ufTall(w)),
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'ufFar', 0.9],
              [0.3, 'ufFarDeep', 1],
              [1, 'ufFarDeep', 1],
            ],
            lean: 0.3,
            fill: 0.9,
            under: 0.85,
            patch: 0.15,
            flow: 0,
            breath: 0,
          },
          {
            name: 'near',
            opaque: true,
            laid: true,
            top: ({ w }) => ufPeaks(UF_NEAR_BASE, UF_NEAR_PEAKS, ufRough(w, 0.007), 4.1, ufWide(w), ufTall(w)),
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'ufRock', 0.9],
              [0.25, 'ufRock', 1],
              [1, 'ufRockDeep', 1],
            ],
            lean: 0.4,
            fill: 0.9,
            under: 0.85,
            patch: 0.2,
            flow: 0,
            breath: 0,
          },
          SKY.land.sheets[1],
        ],
      },
      // no birds: the aurora is what moves in this sky
      school: { ...SKY.school, fish: [] },
      paints: {
        ...PAINTS,
        // the aurora: white along its lower edge, aqua, a teal body, going blue and lilac as it rises, and its glow
        auCore: ['#f4fffd', '#ecfefb'],
        auBright: ['#aefbf1', '#9ef2e9'],
        auAqua: ['#5ff0e4', '#52e4da'],
        auTeal: ['#2fcfd2', '#29c0c6'],
        auBlue: ['#3f93e6', '#3784d8'],
        auLilac: ['#949ff4', '#8693e8'],
        auLilacPale: ['#d3d8fc', '#c4cbf8'],
        auGlow: ['#46e4ec', '#3cd6e0'],
        auGlowSoft: ['#2fb0ea', '#2aa0dc'],
        // the haze over its rays: blue by day, so that the white page does not grey it, and lilac at night
        auHalo: ['#5c8ef0', '#8693e8'],
        /* The same by day where an arm lies on the page rather than on the night (see `byDay`): deeper inks, so that the
           light page does not wash it out into a pale haze and it still reads as an aurora; at night just as above. */
        auCoreDay: ['#1cc9bb', '#ecfefb'],
        auBrightDay: ['#12b5ad', '#9ef2e9'],
        auAquaDay: ['#0aa9a3', '#52e4da'],
        auTealDay: ['#0f98aa', '#29c0c6'],
        auBlueDay: ['#2160cc', '#3784d8'],
        auLilacDay: ['#5a52d6', '#8693e8'],
        auGlowDay: ['#14aabd', '#3cd6e0'],
        auGlowSoftDay: ['#1d84cc', '#2aa0dc'],
        auHaloDay: ['#4a74e4', '#8693e8'],
        // the snow, lit and in shade, and where it thins over the rock; and the rock's ribs
        ufSnowLit: ['#eef7fd', '#dfeef9'],
        ufSnowCool: ['#a9c6ea', '#93b2dc'],
        ufSnowDim: ['#5b7cb6', '#4d6ca4'],
        ufStone: ['#142a5e', '#132653'],
        ufStoneDeep: ['#0b1940', '#0c1a3e'],
        ufFarLit: ['#8fb0de', '#7d9dcd'],
        ufFarCool: ['#5479b4', '#4a6ca6'],
        // the mist low in the valleys along the foot: on a light page a pale snow blue, so that the ranges go into the white
        // through it and not through grey; on a dark one a faint night blue, a little lighter than the rock it lies on
        ufValley: ['#b4c3ea', '#1a2a5c'],
        // and lowest, where the picture fades out: as pale on a light page, and going into the dark on a dark one
        ufValleyLow: ['#b4c3ea', '#121d44'],
        // the stars
        ufStar: ['#f4f8ff', '#ffffff'],
        ufStarGlow: ['#dce9ff', '#e8f0ff'],
        // the wash over the top of the sky, where its lines come in under the buttons, deepening down it
        ufWashTop: ['#e6ecfc', '#121422'],
        ufWashHigh: ['#cad6f8', '#13182f'],
        ufWash: ['#a3b6f0', '#141c3c'],
        ufWashDeep: ['#7893e2', '#14204a'],
      },
      plant: (garden) => {
        const { w, h, rand, ground, words } = garden
        // the land's room and base (its meadow's foot is LAND_FOOT over the canvas's, 0.06 of a room under its top)
        const room = (h - LAND_FOOT - ground('meadow', w / 2)) / 0.06
        const landBase = ground('meadow', w / 2) - 1.24 * room
        const farBase = landBase + UF_FAR_BASE * room
        const nearBase = landBase + UF_NEAR_BASE * room
        // the picture's top, just under the buttons, and how tall the picture under it is: the curtains are laid out from
        // these, and go above it where there is room beside the words
        const top = words.y + words.b + 3
        const pic = h - top
        // where the sky comes in from nothing, as its lines have it, and where the curtains' light thins away upward
        const [fade0, fade1] = ufFadeAt(garden)
        const [mist0, mist1] = ufMistAt(garden)
        // the oval the aurora keeps clear round the words: how far out in it a place is (1 at its rim)
        const ovalA = words.a + UF_CLEAR[0]
        const ovalB = words.b + UF_CLEAR[1]
        const oval = (x, y) => Math.hypot((x - words.x) / ovalA, (y - words.y) / ovalB)
        // how much room there is beside the words: none on a phone, where they are as wide as the canvas
        const roomy = ufRoomy(garden)
        /* The same oval as the curtains keep it, narrower on a canvas with less room beside the words: the curtain is laid
           out in shares of the canvas, so that with the oval at its full width the left arm, which comes down close by its
           rim, would run under its low ceiling on a canvas of about 1050 to 1150 pixels, and break, leaving a streak of
           light floating apart beyond the gap. Narrowed with the canvas, it gives the arm the room it has on a wider one. */
        const armA = ovalA - Math.max(0, ovalA - UF_CLEAR_SHARE * w) * roomy ** 2
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
        let n = 0
        // A stroke rooted straight under it, far below the canvas, so that it sways (with `give`) as the strokes of its
        // curtain on either side of it do, the wind running along the curtain; or standing still.
        const deep = h * 2
        const put = ({ x, y, give = 0, phase, ...o }) => {
          n += 1
          rand.reseed(calm(52021 + n * 7919))
          garden.dab({
            kind: UF_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: deep,
            stem: deep - y,
            lean: 0,
            stiff: 1 - give,
            phase,
          })
        }
        /* The curtains' light thins away upward into the page (the strokes marked as mist), so that where an arm rises
           beside the words it goes into the page softly and is gone by about their middle, and under them the rays' tips
           go into the sky as it comes in. */
        garden.mist(mist0, mist1)
        /* How high a ray can reach at a place across: under the words, no higher than a little under the buttons (a tenth
           of the picture on a phone, where the whole curtain is under them), so none comes up behind them and only its
           tips go into the mist; beside them, up to where the mist has taken all of it, so that no tip is ever cut. */
        const ceilFloor = words.y + words.b + pic * (0.1 - 0.06 * roomy)
        /* Where the curtain lies wholly under the words (with little room beside them), its ceiling there comes down a
           little here and there, never up, so that where an arm climbs to it its rays' tops do not all end along one
           level line under the buttons. With room beside the words it stays as it was. */
        const dipAt = (x) =>
          (1 - roomy) * pic * 0.045 * (0.5 + 0.5 * Math.sin(x / 47 + 1.9)) * (0.55 + 0.45 * Math.sin(x / 19 + 0.7))
        const ceilAt = (x) => {
          const u = Math.abs(x - words.x) / armA
          const low = Math.max(ceilFloor + dipAt(x), words.y + ovalB * Math.sqrt(Math.max(0, 0.72 * 0.72 - u * u)))
          return low + (mist0 - low) * smooth(0.6, 1, u)
        }
        /* Beside the words, on a wide canvas, where the arms run a long way up beside them, how far up to its ceiling a ray
           standing in a fold of the curtain (`f`, 1 in the fold) can reach at most: all the way in the folds, and well short
           of it between them, so that the arm's top rises and falls along it, and between its folds climbs with it, rather
           than all its rays standing up into the mist's level band and making a flat-topped band of it. On a canvas up to
           about 1250 pixels wide it is as it was. */
        const reachAt = (x, f) =>
          1 - 0.65 * smooth(1250, 1700, w) * smooth(0.75, 1, Math.abs(x - words.x) / armA) * (1 - f) ** 1.5
        /* How much of its light a thing standing upright at a place across from `y0` down to `y1` keeps for the words' oval
           of page: all of it clear of the oval, and less and less the deeper into it it reaches, so that the curtain fades
           smoothly as it goes behind the words rather than breaking into specks at the oval's rim, as strokes there do. On a
           phone, where the oval is wider than the canvas and the whole curtain lies under it, only close to its middle. */
        const veiled = (x, y0, y1) => {
          const v0 = (y0 - words.y) / ovalB
          const v1 = (y1 - words.y) / ovalB
          const v = v0 <= 0 && v1 >= 0 ? 0 : Math.min(Math.abs(v0), Math.abs(v1))
          return smooth(0.45 + 0.15 * roomy, 0.7 + 0.2 * roomy, Math.hypot((x - words.x) / armA, v))
        }
        // how high the curtains' broad glow can reach: no higher than the rays, and only where the sky has come in, so
        // that it never lies as a cloud on the page
        const glowCeil = (x) => Math.max(ceilAt(x), fade0 + 0.4 * (fade1 - fade0))
        /* How much of its light a curtain keeps where its lower edge is at `yb`: all of it a little under the buttons'
           foot, and less and less as an arm climbs beside the words (or, on a phone, up towards the buttons), slowly, so
           that it goes into the page softly, as a whole, and does not only break into specks where the mist takes its
           rays. Its rays overlap, so their light adds up: it has to be very little before it looks like little. */
        const climb0 = words.y + words.b * (1 - 1.3 * roomy)
        const climb1 = words.y + words.b + pic * (0.25 - 0.15 * roomy)
        const climb = (yb) => smooth(climb0, climb1, yb) ** 2
        // and its rays grow shorter there too, so that an arm tapers as it goes and its top follows it up into the page,
        // rather than its rays all standing up to the mist's ceiling and ending along a level line
        const taper = (yb) => 0.2 + 0.8 * smooth(climb0, climb1, yb) ** 1.3
        /* How tall a thing rising from `yb` can be, given how tall it would be: under its ceiling, each ending at a height
           of its own (`r`), anywhere from a little over halfway up to it, and easing into that, so that where many reach it
           their tips stay ragged rather than standing in a row along a line. */
        const under = (x, yb, raw, r, reach = 1) => {
          const cap = (yb - ceilAt(x)) * (0.45 + 0.55 * r) * reach
          const knee = cap * 0.6
          return raw <= knee ? raw : knee + (cap - knee) * (1 - Math.exp(-(raw - knee) / Math.max(1, cap - knee)))
        }
        // the mountains' line, the higher of the two ranges at each place
        const sky = (x) => Math.min(ground('far', x), ground('near', x))
        const UP = -Math.PI / 2
        // how the curtains' folds are sized: as the card's were, a little larger on a wide canvas
        const fu = 36 * clamp(w / 1232, 0.75, 1.3)
        // a value along a curtain, from [share of the way along, value] pairs, eased between them
        const along = (pairs) => (s) => {
          if (s <= pairs[0][0]) {
            return pairs[0][1]
          }
          for (let k = 1; k < pairs.length; k += 1) {
            if (s <= pairs[k][0]) {
              const f = (s - pairs[k - 1][0]) / (pairs[k][0] - pairs[k - 1][0])
              return pairs[k - 1][1] + (pairs[k][1] - pairs[k - 1][1]) * f * f * (3 - 2 * f)
            }
          }
          return pairs[pairs.length - 1][1]
        }
        // A curtain's curve through its places in turn (Catmull-Rom), walked at even steps of `step` CSS pixels: each
        // step's place, its share of the way along and the way the curve runs there. Its places are where there is room
        // beside the words, where there is not, or between.
        const walk = (c, step) => {
          const pts = c.edge.map(([x, roomyY, narrowY]) => [x * w, top + (narrowY + (roomyY - narrowY) * roomy) * pic])
          const fine = []
          for (let k = 0; k < pts.length - 1; k += 1) {
            const p0 = pts[Math.max(0, k - 1)]
            const p1 = pts[k]
            const p2 = pts[k + 1]
            const p3 = pts[Math.min(pts.length - 1, k + 2)]
            for (let i = 0; i < 24; i += 1) {
              const t = i / 24
              const t2 = t * t
              const t3 = t2 * t
              fine.push(
                [0, 1].map(
                  (a) =>
                    0.5 *
                    (2 * p1[a] +
                      (-p0[a] + p2[a]) * t +
                      (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 +
                      (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3),
                ),
              )
            }
          }
          fine.push(pts[pts.length - 1])
          const lengths = [0]
          for (let k = 1; k < fine.length; k += 1) {
            lengths.push(lengths[k - 1] + Math.hypot(fine[k][0] - fine[k - 1][0], fine[k][1] - fine[k - 1][1]))
          }
          const total = lengths[lengths.length - 1]
          const out = []
          let k = 1
          for (let d = 0; d <= total; d += step) {
            while (k < fine.length - 1 && lengths[k] < d) {
              k += 1
            }
            const f = (d - lengths[k - 1]) / Math.max(1e-6, lengths[k] - lengths[k - 1])
            const a = fine[k - 1]
            const b = fine[k]
            out.push({
              x: a[0] + (b[0] - a[0]) * f,
              y: a[1] + (b[1] - a[1]) * f,
              s: d / total,
              turn: Math.atan2(b[1] - a[1], b[0] - a[0]),
              d,
            })
          }
          return out
        }
        /* A curtain's shape: how tall and bright it is along its way; its folds, where it turns towards us and is brighter
           and its rays taller, a few broad ones along it and the rays bunched in narrower ones within them, as the third
           picture's are; and its lower edge, a little uneven and coming down a little in the folds. */
        const shape = (c) => {
          const seed = c.phase * 1000
          const fold = (d) =>
            clamp(
              0.5 +
                0.5 *
                  (Math.sin(d / fu + seed) * 0.55 +
                    Math.sin(d / (fu * 0.42) + seed * 1.7) * 0.35 +
                    Math.sin(d / (fu * 0.16) + seed * 2.9) * 0.3),
              0,
              1,
            )
          const footAt = (p) =>
            Math.min(p.y + 1.5 * Math.sin(p.d / 20 + seed * 0.7) + 3.5 * fold(p.d) ** 2, sky(p.x) - 10)
          const bright = along(c.bright)
          return {
            seed,
            tall: along(c.tall),
            bright: c.roomy ? (s) => bright(s) * roomy : bright,
            fold,
            footAt,
            near: c.tone === 'near',
          }
        }

        /* A wash over the top of the sky, in rows deepening down it, as the forest's over its mist: so that the first of the
           sky's lines, few and pale, are in paint and never stand alone as hairlines over the page, and the night comes in
           from the page as one soft blue. Its first row is low enough that none of it comes up beside the buttons. */
        const washStep = 0.05 * w + 40
        const WASH = [
          [0.13, 'ufWashTop', 0.2],
          [0.2, 'ufWashHigh', 0.4],
          [0.27, 'ufWash', 0.4],
          [0.35, 'ufWash', 0.32],
          [0.43, 'ufWashDeep', 0.28],
        ]
        WASH.forEach(([at, paint, most], row) => {
          const cols = Math.ceil(w / washStep) + 2
          for (let i = 0; i < cols; i += 1) {
            const q = row * 131 + i * 17 + 3
            const x = (i - 0.5 + (row % 2) * 0.5 + (ufHash(q * 1.3) - 0.5) * 0.4) * washStep
            const y = top + (at + (ufHash(q * 2.1) - 0.5) * 0.02) * pic
            put({
              x,
              y,
              long: washStep * 0.95,
              wide: 0.36,
              blur: washStep * 0.45,
              paints: [paint, paint],
              load: most * (0.85 + 0.3 * ufHash(q * 4.3)),
              kind: UF_HAZE,
              order: 50 + row + i * 0.001,
            })
          }
        })

        // The stars, fine, most of them a point and a few with rays, none on the mountains or round the words, few in the
        // aurora's light, and fainter as the sky fades into the page.
        const sweep = UF_CURTAINS.find((c) => c.tone === 'near')
        const main = shape(sweep)
        const bodies = walk(sweep, 3).map((p) => {
          const foot = main.footAt(p)
          return { x: p.x, foot, top: foot - main.tall(p.s) * pic * 0.8, bright: main.bright(p.s) }
        })
        const lit = (x, y) => bodies.some((b) => Math.abs(b.x - x) < 4 && y < b.foot + 2 && y > b.top && b.bright > 0.3)
        const starTop = fade0 + 0.25 * (fade1 - fade0)
        const stars = Math.round(220 * clamp(w / 1232, 0.4, 1.6))
        for (let k = 0; k < stars; k += 1) {
          const x = ufHash(k * 5.1 + 0.4) * w
          const y = starTop + ufHash(k * 3.7 + 0.9) ** 1.1 * (nearBase - starTop)
          if (y > sky(x) - 4 || oval(x, y) < 1.02) {
            continue
          }
          const inLight = lit(x, y)
          // the aurora's light drowns most of the faint ones
          if (inLight && ufHash(k * 4.3 + 0.2) < 0.6) {
            continue
          }
          const dim = (inLight ? 0.5 : 1) * smooth(starTop, fade1, y) * smooth(1.02, 1.25, oval(x, y))
          if (dim < 0.08) {
            continue
          }
          const big = ufHash(k * 7.3) > 0.94
          const r = big ? 1 + 1 * ufHash(k * 2.9) : 0.4 + 0.5 * ufHash(k * 2.9)
          if (big) {
            put({
              x,
              y,
              long: r * 2.4,
              wide: 0.06,
              blur: 0.3,
              paints: ['ufStar', 'ufStarGlow'],
              load: 0.7 * dim,
              kind: UF_TWINKLE,
              order: 100 + k * 0.001,
            })
            put({
              x,
              y,
              long: r * 1.7,
              wide: 0.08,
              turn: Math.PI / 2,
              blur: 0.3,
              paints: ['ufStar', 'ufStarGlow'],
              load: 0.7 * dim,
              kind: UF_TWINKLE,
              order: 100.5 + k * 0.001,
            })
          }
          put({
            x,
            y,
            long: big ? 0.7 : r,
            wide: 1,
            blur: big ? 0.2 : r * 0.5,
            paints: ['ufStarGlow', 'ufStar'],
            load: (big ? 0.9 : 0.6 + 0.3 * ufHash(k * 1.9)) * dim,
            kind: UF_GLIMMER,
            order: 101 + k * 0.001,
          })
        }

        /* How much of its light a curtain keeps at each place along its way, worked out once at its rays' step: all of it
           a little under the buttons, and less as an arm climbs beside the words (climb), goes behind the words' oval
           (veiled, for a ray of middling height) or is squeezed under its ceiling, where its rays have no room. Outward from
           the foot of the V each way, once it has faded well down it never comes back, so that an arm grazing the oval's
           edge never leaves a streak of light floating apart beyond it. Where an arm ends on the canvas, rather than
           running off it, it thins away over a long way instead of stopping in a point, and the other arm goes no higher
           than it does, so that the V is never lopsided. */
        const RAY_STEP = 1.5
        const lightAlong = (c, { tall, footAt }) => {
          const pts = walk(c, RAY_STEP)
          const n = pts.length
          const veil = new Float32Array(n)
          const keep = new Float32Array(n)
          // (and the foot of the V, its lowest place)
          let low = 0
          for (let k = 0; k < n; k += 1) {
            const p = pts[k]
            const yb = footAt(p)
            const t = under(p.x, yb, tall(p.s) * pic * 0.75 * taper(yb), 0.5)
            veil[k] = veiled(p.x, yb - t, yb)
            keep[k] = climb(yb) * veil[k] * smooth(3, 12, yb - ceilAt(p.x))
            if (p.y > pts[low].y) {
              low = k
            }
          }
          // (an arm that dims only a little on its way, and is never near gone, may brighten again)
          for (const way of [-1, 1]) {
            let least = 1
            for (let k = low; k >= 0 && k < n; k += way) {
              least = Math.min(least, keep[k])
              keep[k] = Math.min(keep[k], least + (1 - least) * smooth(0.35, 0.65, least))
            }
          }
          // where an arm ends on the canvas, faded or as high as `cut`; or -1, where it runs off the canvas first
          const endOf = (way, cut) => {
            for (let k = low; k >= 0 && k < n; k += way) {
              if (pts[k].x < -6 || pts[k].x > w + 6) {
                return -1
              }
              if (keep[k] < 0.05 || pts[k].y < cut) {
                return k
              }
            }
            return -1
          }
          // the lower of the heights at which the arms end on the canvas, which neither then goes above
          const first = [endOf(-1, -1e9), endOf(1, -1e9)].filter((k) => k >= 0)
          const cut = first.length ? Math.max(...first.map((k) => pts[k].y)) : -1e9
          // and how far back from where it ends an arm starts to thin away
          const thin = clamp(0.1 * w, 90, 130)
          for (const way of [-1, 1]) {
            const end = endOf(way, cut)
            if (end < 0) {
              continue
            }
            for (let k = low; k >= 0 && k < n; k += way) {
              keep[k] =
                (k - end) * way >= 0 ? 0 : Math.min(keep[k], smooth(0, thin, Math.abs(pts[end].d - pts[k].d)) ** 2)
            }
          }
          const at = (values) => (d) => values[clamp(Math.round(d / RAY_STEP), 0, n - 1)]
          return { keep: at(keep), veil: at(veil) }
        }
        /* By day, the deeper inks for a stroke of an arm standing at `y` where it lies on the page and not yet on the night:
           all of them up there, and fewer and fewer of them down through where the sky comes in, so that there is no line
           where they change. At night the two are the same. */
        const dayAt = (y) => 1 - smooth(fade0 + 0.2 * (fade1 - fade0), fade0 + 0.6 * (fade1 - fade0), y)
        const byDay = (names, y, r) => (r < dayAt(y) ? names.map((name) => `${name}Day`) : names)
        // A stroke's share of the light its place along the curtain keeps, for how deep into the words' oval it reaches:
        // a tall one, deeper than the middling ray the curtain's light was worked out for, keeps less
        const share = (light, d, v) => Math.min(1, v / Math.max(1e-3, light.veil(d)))

        // The curtains.
        for (const c of UF_CURTAINS) {
          const { seed, tall, bright, fold, footAt, near } = shape(c)
          const light = lightAlong(c, { tall, footAt })
          // the glow round it, broad and soft, laid first: a halo over its rays, and a brighter one just over its foot,
          // both stopping at its lower edge, under which the night is dark again
          for (const p of walk(c, 28)) {
            const yb = footAt(p)
            // its glow stays where the sky is mostly in, and out of the words' oval
            const t = Math.min(tall(p.s) * pic * taper(yb), (yb - glowCeil(p.x)) / 1.15)
            // (soft and broad, it reaches out to either side as far as it does up)
            const b =
              bright(p.s) *
              light.keep(p.d) *
              (0.6 + 0.4 * fold(p.d)) *
              share(
                light,
                p.d,
                Math.min(veiled(p.x - t * 0.25, yb - t * 1.1, yb), veiled(p.x + t * 0.25, yb - t * 1.1, yb)),
              )
            if (b < 0.02 || t < 4) {
              continue
            }
            put({
              x: p.x,
              y: yb - t * 0.6,
              long: t * 0.5,
              wide: 0.5,
              turn: UP,
              blur: t * 0.3,
              paints: byDay(
                near ? ['auGlowSoft', 'auHalo'] : ['auHalo', 'auLilac'],
                yb - t * 0.6,
                ufHash(p.d * 0.53 + seed + 13),
              ),
              load: (near ? 0.42 : 0.3) * b,
              kind: UF_GLIMMER_MIST,
              order: c.order,
              give: UF_GIVE,
              phase: c.phase,
            })
            put({
              x: p.x,
              y: yb - t * 0.24,
              long: t * 0.22,
              wide: 0.7,
              turn: UP,
              blur: t * 0.08,
              paints: byDay(
                near ? ['auBright', 'auGlow'] : ['auGlow', 'auBlue'],
                yb - t * 0.24,
                ufHash(p.d * 0.61 + seed + 17),
              ),
              load: (near ? 0.36 : 0.14) * b,
              kind: UF_HAZE_MIST,
              order: c.order + 0.1,
              give: UF_GIVE,
              phase: c.phase,
            })
            // and a very little of its light in the air under it
            const below = Math.min(t * 0.22, (sky(p.x) - yb) * 0.4)
            if (near && below > 4) {
              put({
                x: p.x,
                y: yb + below * 0.5,
                long: below,
                wide: 0.9,
                turn: UP,
                blur: below * 0.9,
                paints: ['auGlowSoft', 'auGlowSoft'],
                load: 0.04 * b,
                kind: UF_HAZE_MIST,
                order: c.order - 0.1,
                give: UF_GIVE,
                phase: c.phase,
              })
            }
          }
          // the curtain's body of light, soft and upright, between its rays: teal going blue as it rises (blue going lilac
          // far off), brightest in the folds
          for (const p of walk(c, near ? 5 : 7)) {
            const yb = footAt(p)
            const f = fold(p.d)
            const t = under(
              p.x,
              yb,
              tall(p.s) * pic * (0.55 + 0.35 * f) * taper(yb),
              ufHash(p.d * 0.37 + seed),
              reachAt(p.x, f),
            )
            const b = bright(p.s) * light.keep(p.d) * (0.35 + 0.65 * f) * share(light, p.d, veiled(p.x, yb - t, yb))
            if (b < 0.03 || t < 6) {
              continue
            }
            put({
              x: p.x,
              y: yb - t * 0.45,
              long: t * 0.45,
              wide: 5 / (t * 0.45),
              turn: UP,
              blur: 3.5,
              paints: byDay(
                near ? ['auTeal', 'auBlue'] : ['auBlue', 'auLilac'],
                yb - t * 0.45,
                ufHash(p.d * 0.83 + seed + 19),
              ),
              load: (near ? 0.22 : 0.18) * b,
              kind: UF_HAZE_MIST,
              order: c.order + 0.3,
              give: UF_GIVE,
              phase: c.phase,
            })
          }
          // the rays, each from the lower edge up
          for (const p of walk(c, near ? 1.5 : 2.3)) {
            const r1 = ufHash(p.d * 1.31 + seed)
            const r2 = ufHash(p.d * 2.17 + seed + 3)
            const r3 = ufHash(p.d * 0.71 + seed + 7)
            const r4 = ufHash(p.d * 1.93 + seed + 23)
            const f = fold(p.d)
            // a little to either side of the curve, so the rays are not in one row
            const x = p.x + (r1 - 0.5) * 1.2
            const yb = footAt(p)
            // no taller than its ceiling, so that under the words it ends short of their clear oval
            const reach = reachAt(x, f)
            const most = (yb - ceilAt(x)) * reach
            const t = under(x, yb, tall(p.s) * pic * (0.5 + 0.4 * f + 0.25 * r1) * taper(yb), r2, reach)
            const b = bright(p.s) * light.keep(p.d) * (0.28 + 0.72 * f) * share(light, p.d, veiled(x, yb - t, yb))
            if (b < 0.03 || t < 4) {
              continue
            }
            // the long body of the ray, teal going blue or lilac (blue going lilac far off)
            put({
              x,
              y: yb - t * 0.5,
              long: t * 0.5,
              wide: (1.1 + 1.9 * r2) / (t * 0.5),
              turn: UP,
              blur: 0.9,
              kind: UF_BRUSH_MIST,
              paints: byDay(
                near ? [f > 0.6 ? 'auAqua' : 'auTeal', r1 > 0.45 ? 'auLilac' : 'auBlue'] : ['auBlue', 'auLilac'],
                yb - t * 0.5,
                r4,
              ),
              load: (near ? 0.24 + 0.22 * r3 : 0.3 + 0.2 * r3) * b,
              order: c.order + 1,
              give: UF_GIVE,
              phase: c.phase,
            })
            // now and then one reaching on up, faint and lilac
            const up = Math.min(t * (0.5 + 0.5 * r2), (most - t * 0.6) / 1.1)
            if (r3 > 0.55 && up > 4) {
              const upLoad = 0.28 * b * veiled(x, yb - t * 0.6 - up * 1.1, yb - t * 0.6)
              put({
                x,
                y: yb - t * 0.6 - up * 0.5,
                long: up * 0.6,
                wide: (0.8 + r1) / (up * 0.6),
                turn: UP,
                blur: 1.2,
                kind: UF_BRUSH_MIST,
                paints: byDay(['auBlue', 'auLilac'], yb - t * 0.6 - up * 0.5, r4),
                load: upLoad,
                order: c.order + 0.5,
                give: UF_GIVE,
                phase: c.phase,
              })
            }
            // and its lit foot, white and aqua, brightest in the folds: smooth light, its lower end the curtain's edge
            const foot = t * (0.1 + 0.14 * r2)
            put({
              x,
              y: yb - foot,
              long: foot,
              wide: (0.8 + 1.3 * r1) / foot,
              turn: UP,
              blur: 1.2,
              kind: UF_HAZE_MIST,
              paints: near ? byDay(['auCore', 'auBright'], yb - foot, r4) : ['auLilacPale', 'auLilac'],
              load: (near ? 0.3 + 0.55 * f * r2 + 0.15 * f : 0.26 + 0.2 * r2) * b,
              order: c.order + 2,
              give: UF_GIVE,
              phase: c.phase,
            })
          }
        }

        /* The snow on the mountains, in three layers over the rock: a soft field of it down from each high crest along the
           fall of the face, lit on the faces towards the aurora (the left) and cool on the others; ribs of dark rock coming
           down through it; and quick strokes of snow over both, along the crests and here and there down the faces. */
        const slopeAt = (range, x) => (ground(range, x + 3) - ground(range, x - 3)) / 6
        // how far a stroke laid from a place along `turn` can run and stay on the range's face, `half` inside its line
        const reachOn = (range, x, y, turn, most, half) => {
          const cx = Math.cos(turn)
          const cy = Math.sin(turn)
          for (let l = 1; l <= most; l += 1) {
            if (y + cy * l - half < ground(range, x + cx * l)) {
              return l - 1
            }
          }
          return most
        }
        // the way down the fall of a face from a place on it: steeper than the face itself, and on a gentle ridge nearly
        // along the ground, as snow lies on one
        const fallAt = (slope) => {
          const way = Math.sign(slope) || 1
          const steep = smooth(0.2, 0.6, Math.abs(slope))
          const angle = Math.min(1.45, Math.atan(Math.abs(slope)) + 0.08 + 0.32 * steep)
          return { turn: way > 0 ? angle : Math.PI - angle, steep }
        }
        // the snow fields, on the faces that stand high enough to hold them
        const field = (range, x, order, far) => {
          const top0 = ground(range, x)
          const slope = slopeAt(range, x)
          const stand = (far ? farBase : nearBase) - top0
          if (stand < room * (far ? 0.07 : 0.15) || Math.abs(slope) < 0.3) {
            return
          }
          const r1 = ufHash(x * 0.91 + (far ? 17 : 5))
          const r2 = ufHash(x * 1.37 + (far ? 23 : 9))
          const lit = slope < 0
          // straighter down than the snow on the crests, as it lies in the gullies of a steep face
          const angle = Math.min(1.38, Math.atan(Math.abs(slope)) + 0.45)
          const turn = slope > 0 ? angle : Math.PI - angle
          const depth = stand * (0.2 + 0.3 * r1) * (lit ? 1 : 0.8)
          const breadth = 1.4 + 1.2 * r2
          const y0 = top0 + 1 + breadth * 0.3
          const long = reachOn(range, x, y0, turn, depth / Math.max(0.5, Math.sin(turn)), breadth * 0.7) / 2
          if (
            long < 1.5 ||
            (far && y0 + Math.sin(turn) * long * 2 > ground('near', x + Math.cos(turn) * long * 2) - 1)
          ) {
            return
          }
          put({
            x: x + Math.cos(turn) * long,
            y: y0 + Math.sin(turn) * long,
            long,
            wide: breadth / long,
            turn,
            blur: 1.4,
            kind: UF_HAZE,
            paints: far ? ['ufFarLit', 'ufFarCool'] : lit ? ['ufSnowLit', 'ufSnowCool'] : ['ufSnowCool', 'ufSnowDim'],
            load: far ? 0.3 : 0.5 * (lit ? 1 : 0.8),
            order,
          })
        }
        // the rock's ribs, down the fall of the face through the snow, every few pixels
        const rib = (range, x, k, order) => {
          const top0 = ground(range, x)
          const slope = slopeAt(range, x)
          const stand = nearBase - top0
          if (stand < room * 0.12 || Math.abs(slope) < 0.3) {
            return
          }
          const r1 = ufHash(k * 2.3 + x * 0.1)
          const r2 = ufHash(k * 4.1 + 0.6)
          const { turn } = fallAt(slope)
          // it comes out from under the crest's snow a little way down
          const from = 2 + 4 * r2
          const breadth = 0.6 + 0.6 * r2
          const x0 = x + Math.cos(turn) * from
          const y0 = top0 + Math.sin(turn) * from
          const long =
            reachOn(range, x0, y0, turn, (stand * (0.12 + 0.2 * r1)) / Math.max(0.5, Math.sin(turn)), breadth) / 2
          if (long < 1.5) {
            return
          }
          put({
            x: x0 + Math.cos(turn) * long,
            y: y0 + Math.sin(turn) * long,
            long,
            wide: breadth / long,
            turn,
            blur: 0.6,
            kind: 0,
            paints: ['ufStone', 'ufStoneDeep'],
            load: 0.7 + 0.2 * r1,
            order,
          })
        }
        // Snow: from a range's crest down its faces, the brush coming down on the crest and lifting as it goes.
        const snow = (range, x, below, scale, order, far) => {
          const r1 = ufHash(x * 1.7 + below * 3.1 + 11)
          const r2 = ufHash(x * 2.9 + below * 1.3 + 23)
          const top0 = ground(range, x)
          // less of it on the low ridges, where it only caught in a few places
          const low = far ? 1 : 0.45 + 0.55 * smooth(nearBase - 0.05 * room, nearBase - 0.18 * room, top0)
          const slope = slopeAt(range, x)
          const { turn, steep } = fallAt(slope)
          const breadth = 0.6 + 0.9 * r2
          const y = top0 + 0.5 + below
          const long =
            reachOn(
              range,
              x,
              y + breadth * 0.3,
              turn,
              2 * (2.5 + 8 * r1) * clamp(Math.abs(slope) * 1.2 + 0.25, 0.35, 1.2) * scale * low * (0.5 + 0.5 * steep),
              breadth * 0.6,
            ) / 2
          const lit = slope < 0
          // hidden behind the near range
          if (long < 1 || (far && y + Math.sin(turn) * long * 2 > ground('near', x + Math.cos(turn) * long * 2) - 1)) {
            return
          }
          put({
            x: x + Math.cos(turn) * long,
            y: y + Math.sin(turn) * long,
            long,
            wide: breadth / long,
            turn,
            blur: far ? 0.8 : 0.5,
            kind: 0,
            paints: far
              ? lit
                ? ['ufFarLit', 'ufFarCool']
                : ['ufFarCool', 'ufFarCool']
              : lit
                ? ['ufSnowLit', 'ufSnowCool']
                : ['ufSnowCool', 'ufStone'],
            load: (far ? 0.4 : 0.55 + 0.35 * r2) * (lit ? 1 : 0.85),
            order,
          })
        }
        // where the crest is bare rock: more of it on the faces in shade and on the low ridges
        const bareAt = (x, phase) =>
          0.5 + 0.5 * (Math.sin(x / 6.3 + phase) * 0.6 + Math.sin(x / 2.7 + phase * 0.4) * 0.4)
        for (let x = -2; x <= w + 2; x += 2.5) {
          field('far', x, 785 + x * 0.0001, true)
          field('near', x, 795 + x * 0.0001, false)
        }
        for (let x = 0, k = 0; x <= w; x += 4 + 4 * ufHash(k * 1.9 + 0.3), k += 1) {
          rib('near', x, k, 797 + x * 0.0001)
        }
        // the far range's crests, faint and broken, then the near range's, then a little more snow down the near faces,
        // the more of it the higher the face
        for (let x = 0; x <= w; x += 3) {
          if (bareAt(x, 2.3) > 0.7) {
            continue
          }
          snow('far', x, 0, 0.6, 790 + x * 0.0001, true)
        }
        for (let x = 0; x <= w; x += 2) {
          const shade = slopeAt('near', x) > 0
          const bare = bareAt(x, 1.1)
          if (bare > (shade ? 0.72 : 0.86)) {
            continue
          }
          if (ground('near', x) > nearBase - 0.1 * room && bare > 0.55) {
            continue
          }
          snow('near', x, 0, 1, 800 + x * 0.0001, false)
        }
        const extra = Math.round(360 * clamp(w / 1232, 0.4, 1.6))
        for (let k = 0; k < extra; k += 1) {
          const x = ufHash(k * 3.3 + 0.5) * w
          const top0 = ground('near', x)
          if (Math.abs(slopeAt('near', x)) < 0.3) {
            continue
          }
          const stand = nearBase - top0
          const below = ufHash(k * 5.7 + 0.2) ** 1.6 * stand * 0.45
          const keep = (1 - below / Math.max(1, stand * 0.45)) * clamp(0.3 + (2 * stand) / room, 0, 1)
          if (ufHash(k * 7.1 + 0.9) < keep) {
            snow('near', x, below, 0.8, 801 + k * 0.0001, false)
          }
        }
        /* A low bank of mist in the valleys along the foot, level, soft at its top and thickening down, in which the ranges'
           feet are lost, so that the picture goes into the page through it. */
        for (let x = -30, k = 0; x <= w + 30; x += 24, k += 1) {
          for (let row = 0; row < 3; row += 1) {
            const r1 = ufHash(k * 3.1 + row * 7.7 + 0.3)
            const r2 = ufHash(k * 5.3 + row * 1.9 + 4.1)
            put({
              x: x + (r2 - 0.5) * 14,
              // its top rising and falling a little along the foot, as mist lies
              y:
                h -
                48 +
                row * 16 +
                (r1 - 0.5) * 8 +
                (1 - row / 2) * (6 * Math.sin(x / 140 + 1.3) + 3 * Math.sin(x / 53 + 0.4)),
              long: 30 + 14 * r2,
              wide: 0.42,
              blur: 8 + 4 * r1,
              paints: row < 2 ? ['ufValley', 'ufValley'] : ['ufValleyLow', 'ufValleyLow'],
              load: 0.3 + 0.26 * row,
              kind: UF_HAZE,
              order: 805 + row * 0.1 + k * 0.0001,
            })
          }
        }
      },
    }

    /* --- the healthcare page's hero ------------------------------------------------------------------------------- */

    /* The hero of /use-cases/healthcare, after Cameron's picture of butterflies of light flying through a wood round a
       tree that fades out, painted in full colour as the developer tools reef is: a wood in blossom, alive and calm. The
       wood comes in under the buttons, as the overview's forest does: from nothing just under their foot, slowly, in the
       land's own fine lines, in a glowing turquoise light, so that where it starts is no edge and nothing of it lies
       behind or round the words. Far trees go back into that light as soft clouds of blossom in pink, lilac, violet and
       cobalt on slender trunks; nearer ones stand on warm, lit trunks under crowns of violet, cobalt and pink; at the left
       a great crown of orange and gold rises beside the words with a violet one behind it, and at the right a cobalt one,
       with the near tree in front of it, its trunk lit gold along its left side, holding out a branch to either side with
       a spray of blossom along it, orange rising from the one and pink hanging from the other, and rising past the words
       to fade out into the page. Every crown is heaped of long leaves packed close, as the reef's corals are of their
       paddles. Soft shafts of light come down through the wood and a
       few motes glimmer in it; a strip of meadow glows lime and gold in two pools of light in the clearing, with flowers
       of every colour at the foot; and butterflies of light fly through the wood and past the tree both ways, as the
       sky's birds fly on /products (a school), their wings raised in a V as they are seen from behind, each beating them
       and now and then gliding, white with a soft light round each, coming in and going out through the glass at the
       sides as the home page's butterflies do.
       By day it is bright and full of colour, and at night a deep blue wood whose blossom and meadow glow. */
    const HC_EVEN = 0.005
    const HC_MIST = 0.0025
    const HC_HAZE = 0.4 + HC_EVEN
    // (the trunks are both: drawn even, and thinning into the grain upward across the band garden.mist gives)
    const HC_TRUNK = 0.4 + HC_EVEN + HC_MIST
    // the bark's furrows and the twigs: plain strokes that taper as a brush's do, thinning into the grain upward too
    const HC_BARK = 0.25 + HC_MIST
    // the crowns' leaves and blossom: plain strokes of paint, as the reef's paddles are
    const HC_LEAF = 0.25
    const HC_TWINKLE = 3.25 + HC_EVEN
    const HC_GLIMMER = 3.4 + HC_EVEN
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const hcHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const hcRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
    const hcHex = (rgb) =>
      `#${rgb
        .map((v) =>
          Math.round(Math.min(255, Math.max(0, v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`
    const hcMix = (a, b, t) => hcHex(hcRgb(a).map((v, i) => v + (hcRgb(b)[i] - v) * t))
    /* A crown's colour at night, at its level of its ramp (0 its deepest shade, 6 its light), as the reef's corals are lit
       at night: its shade goes down into the dark of the wood, still its own colour, and its light glows in the ramp's
       full colour rather than its pale one, so that at night the blossom is lit softly where the light catches it. */
    const hcNight = (ramp, i) => {
      const t = i / 6
      const glow = hcRgb(i >= 6 ? hcMix(ramp[3], ramp[4], 0.6) : ramp[Math.min(i, 3)])
      const deep = hcRgb(ramp[i]).map((v, c) => v * 0.27 + [2, 6, 18][c])
      const lit = deep.map((v, c) => v + (glow[c] * 0.97 - v) * t ** 2.2)
      const grey = (lit[0] + lit[1] + lit[2]) / 3
      return hcHex(lit.map((v) => grey + (v - grey) * (1 + 0.35 * t)))
    }
    // The wood's inks, light and dark: a pale aqua where its lines come in under the buttons, turquoise light, and a
    // cerulean low behind the trunks; at night a deep blue.
    const HC_INKS = {
      ...LAND_INK,
      hcTop: ['#c9f0ec', '#0d1c34'],
      hcVeil: ['#9fe2e0', '#0c2442'],
      hcHigh: ['#5cc6d6', '#0c2b4e'],
      hcMid: ['#46b4ce', '#0d335a'],
      hcLow: ['#44aad2', '#0f3a64'],
      hcFoot: ['#3e94ce', '#103c6a'],
    }
    /* Each crown as a ramp from its deepest shade to its light, in the developer tools reef's colours: the great crown's
       orange, from a deep red-orange in its shade to gold where the light catches it; the cobalt, violet and lilac of the
       others; and the pink of the blossom. */
    const HC_DAY = {
      orange: ['#a83a1c', '#c64e1e', '#df6626', '#ee8230', '#f69e40', '#fab956', '#fdd27a'],
      blue: ['#24308a', '#2c42a8', '#3858c4', '#4a70d8', '#638ae6', '#86a8f0', '#aac4f6'],
      violet: ['#352a86', '#4637a0', '#5949bc', '#705fd0', '#8b7ade', '#a898ea', '#c6bbf4'],
      lilac: ['#5f4fae', '#7766c4', '#8f7fd6', '#a698e4', '#bcb0ee', '#d1c8f5', '#e6e0fb'],
      pink: ['#a75592', '#c06ba6', '#d684ba', '#e69fcb', '#f0b8da', '#f7d0e6', '#fce6f0'],
    }
    /* How far into the light the far crowns are: each colour mixed towards the wood's air, so that the far wood goes back
       into it as softer, paler shapes; at night towards the deep blue. */
    const HC_FOG = [0, 0.32, 0.52, 0.7]
    const HC_FOG_AIR = [null, ['#5cc4d6', '#0f3058'], ['#78d2da', '#0e2c50'], ['#9adfe0', '#0d2848']]
    const HC_RAMPS = {
      ...Object.fromEntries(
        Object.entries(HC_DAY).flatMap(([tone, ramp]) =>
          ramp.map((day, i) => [`hc_${tone}${i}`, [day, hcNight(ramp, i)]]),
        ),
      ),
      ...Object.fromEntries(
        Object.keys(HC_DAY).flatMap((tone) =>
          [1, 2, 3].flatMap((level) =>
            HC_DAY[tone].map((day, i) => [
              `hc_${tone}f${level}_${i}`,
              [
                hcMix(day, HC_FOG_AIR[level][0], HC_FOG[level]),
                hcMix(hcNight(HC_DAY[tone], Math.min(6, i + 1)), HC_FOG_AIR[level][1], HC_FOG[level] * 0.85),
              ],
            ]),
          ),
        ),
      ),
    }
    // how large the wood's strokes are drawn on a canvas this wide
    const HC_SCALE = (w) => Math.min(1.15, Math.max(0.5, w / 1232))
    /* How much of the canvas's width the words take: a little over a third on a laptop, all of it on a phone. Where they
       take most of it, nothing can rise up beside them. */
    const hcNarrow = ({ w, words }) => {
      const t = Math.min(1, Math.max(0, ((2 * words.a) / Math.max(1, w) - 0.55) / 0.3))
      return t * t * (3 - 2 * t)
    }
    /* Where the wood's lines come in from the page, down the canvas, as the overview's forest's do: from nothing just
       under the buttons' foot to their full more than halfway down the picture, eased in (the engine fades them over it,
       see fadeFragment), so that there is no ruled edge, no lone hairline and no striped band. */
    const HC_FADE_EASE = 1.15
    const hcFadeAt = (stage) => {
      const foot = stage.words.y + stage.words.b
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    /* How far the wood's body has come in at a height: its wash, its haze and its far trunks, painted over its lines so
       that those show through it only as a grain. It comes in from nothing just under the buttons too, but sooner than
       the lines, so that the butterflies fly through a deep wood; and in the wood's own colour at each height (see
       woodInk in the plant), so that where the lines show through it they are no stripes and none lies on the page. */
    const hcBodyOf = (stage, y) => {
      const foot = stage.words.y + stage.words.b
      const t = Math.min(1, Math.max(0, (y - foot - 2) / Math.max(1, (stage.h - foot) * 0.5)))
      return (t * t * (3 - 2 * t)) ** 1.25
    }
    /* The butterflies: two thirds of them flying left to right and a third the other way, so that they cross each other
       round the tree. Each way they all keep one pace, spread evenly round the round with a little give, so that they
       come to either side one at a time, a few seconds apart, however long the page is open and however wide it is:
       butterflies at paces of their own drew up on each other and now and then four or five of them crossed one side
       together and kept its glass white for seconds. The two ways' paces differ a little, so a butterfly going one way
       meets one going the other at a different place each time round, and at most one of each is ever at a side at once.
       Each in a lane of its own through the band, the lanes shuffled so that two following each other along the way are
       at different heights; each rising and falling more than a bird and surging a little at a rate of its own, its wings
       beating slowly and now and then held as it glides. For each: its size (CSS pixels at a canvas 1232 wide), pace
       (less than nothing for one flying to the left), lane, place in the round, how far it rises and falls and how often,
       how far it surges and how often, its wingbeats a second, how far its wings swing, how often it glides, and a seed
       of its own. They are small and quick, so that the bright middle of one is not much wider than the strip of the
       wood the glass at the sides draws out across most of its band: one as wide as that strip, or wider, sat in the
       glass as a white bar for as long as it took to cross it. */
    const HC_COUNT = 15
    const HC_RIGHTWARD = 10
    const HC_LEFTWARD = HC_COUNT - HC_RIGHTWARD
    const HC_BUTTERFLIES = Array.from({ length: HC_COUNT }, (_, k) => {
      const h = (j) => hcHash(k * 9.7 + j * 3.1 + 0.6)
      const left = k % 3 === 1
      // its place among those flying its way, along the round
      const j = left ? (k - 1) / 3 : k - Math.floor((k + 2) / 3)
      const many = left ? HC_LEFTWARD : HC_RIGHTWARD
      // (those flying to the left a little further back, in the upper half of the band, and so a little smaller)
      const lane = Math.min(
        1,
        Math.max(0, ((j * 0.618034 + (left ? 0.43 : 0.11)) % 1) * (left ? 0.5 : 0.94) + 0.03 + (h(3) - 0.5) * 0.05),
      )
      // the lower in the band, the nearer, the larger
      const near = lane * lane
      return {
        size: (left ? 27 + 11 * h(1) : 30 + 13 * h(1)) + 13 * near,
        speed: left ? -40 : 45,
        lane,
        phase: ((j + 0.5 + (h(4) - 0.5) * 0.2) / many + (left ? 0.07 : 0)) % 1,
        drift: 9 + 10 * h(5),
        period: 3 + 3 * h(6),
        // (the nearer ones surging further and more slowly, so that the flock is no row keeping step)
        surge: 6 + 8 * h(11) + 12 * near,
        surgePeriod: 1.6 + 1.8 * h(12) + 5 * near,
        beat: 2.6 + 1.2 * h(7),
        wag: 0,
        flap: 0.42 + 0.16 * h(8),
        glide: 4 + 4 * h(9),
        seed: h(10),
      }
    })
    /* The near tree at the right, which rises past the words: where it stands across, its foot (a share of the picture
       down), its width (CSS pixels at 1232) and how far it leans (radians, its top to the left for less than nothing);
       and its two boughs of blossom, sprays along branches it holds out to either side: where each branch reaches for
       (a share of the canvas's width and of the picture's height), how long and how deep its spray is (CSS pixels at
       1232; its clumps are a little over half as wide as it is deep), and its colour, with the colour of its tips. The two nearer trees at the left stand under the great crowns there: where each stands, its foot, its
       width, how dark it is and how far it leans. */
    const HC_TREE = {
      x: 0.79,
      foot: 0.8,
      wide: 40,
      lean: -0.045,
      boughs: [
        [0.665, 0.29, 84, 40, 'orange', 'pink'],
        [0.93, 0.38, 72, 40, 'pink', 'lilac'],
      ],
    }
    const HC_NEARISH = [
      { x: 0.07, foot: 0.7, wide: 22, dark: 0.9, lean: 0.03 },
      { x: 0.215, foot: 0.69, wide: 19, dark: 0.85, lean: -0.022 },
    ]
    const UC_HEALTHCARE = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      inks: HC_INKS,
      /* No beads to speak of and no lift between the lines on a light page, so the wood is a body of colour in fine lines
         rather than lines on white; and the sky's small oval of page round the words. */
      lines: { ...SKY.lines, lift: 0, beadChance: 0.02, brick: [90, 260], gap: 0.7 },
      /* The wood's lines come in from nothing just under the buttons, pale and few, so that where they start is no edge:
         slowly, over more than half the picture, so that they are at their full only down among the trunks (as the
         overview's forest's are). */
      fade: {
        at: hcFadeAt,
        ease: HC_FADE_EASE,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      // the crowns and the near tree rise past the picture beside the words into the page, and the butterflies' light
      // reaches over it
      onPage: true,
      land: {
        ...SKY.land,
        sheets: [
          // the wood, from just under the buttons' foot down (the sky's 'air'), in the land's fine lines, fading in
          {
            ...SKY.land.sheets[0],
            fade: true,
            fill: 1,
            under: 1,
            patch: 0,
            paint: [
              [0, 'hcTop', 0.4],
              [0.16, 'hcTop', 1],
              [0.3, 'hcVeil', 1],
              [0.45, 'hcHigh', 1],
              [0.6, 'hcMid', 1],
              [0.8, 'hcLow', 1],
              [1, 'hcFoot', 1],
            ],
          },
          {
            ...SKY.land.sheets[1],
            paint: [
              [0, 'hcFoot', 0],
              [1, 'hcFoot', 0],
            ],
          },
        ],
      },
      flock: [],
      /* The butterflies come in and go out through the glass at the sides as the home page's butterflies do, through as
         wide a band, softened as strongly, so that each is seen passing through glass rather than slipping off the
         picture's edge. It is bent as the overview forest's glass is for its egrets, not as strongly as the home page's:
         a white butterfly of light is far brighter against the wood than the home page's pastel ones are against the
         page, and glass bent that strongly draws the last few pixels of the wood it shows out across most of its band,
         so one sat in it as a long white bar for seconds, coming in and going out, and flashed a bar with every
         wingbeat. Bent as the egrets' glass is, one comes in as a soft frosted wisp, drawn out across, and is through in a
         second or so. The glass is even, so that it draws them out only across and never shows one strip of the flock
         twice, which would smear a bright butterfly into a comet's tail with a second copy in it. It leaves out the home
         page's colours: a white butterfly of light comes apart in them into a rainbow, and the red reaches into the
         strip that even glass never shows and draws a red ghost of a butterfly there. The halo is as gentle as it was,
         since it is the light round every butterfly in the wood, not only at the sides. */
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 3,
        halo: [2.6, 0.24],
      },
      school: {
        fish: HC_BUTTERFLIES,
        size: (w) => Math.max(0.62, HC_SCALE(w)),
        /* Level: they fly both ways, and the school turns a fish only to the right, so one flying to the left would tip
           over; a butterfly's flight is all in its rising and falling and its wings anyway. */
        turn: 0,
        /* From well under the buttons, so that none flies close under them, down to a little over the strip of grass,
           rising a little across the canvas to the right. */
        band: ({ w, h, words }) => {
          const under = words.y + words.b
          const rise = (h - under) * 0.12 * Math.min(1, w / 1232)
          // and on a phone, where the picture is short, not up where the wood is still faint
          const faded = hcFadeAt({ w, h, words })
          const top =
            Math.max(
              under + 58 * Math.max(0.7, HC_SCALE(w)),
              faded[0] + (faded[1] - faded[0]) * 0.45 * hcNarrow({ w, words }),
            ) +
            rise / 2
          const foot = Math.max(top + 60, under + (h - under) * 0.64)
          return [top, foot, -rise]
        },
        // its light reaches about twice its length out, and one comes or goes only once that is out of sight too
        glow: [1.9, 1.9],
        scatter: { radius: 110, push: 300, back: 1.2 },
      },
      paints: {
        ...PAINTS,
        ...HC_RAMPS,
        // the trunks, warm and lit: the far ones a soft violet hardly darker than the light, the nearer ones plum and rust
        hcTrunkFar: ['#9a8ed4', '#221f58'],
        hcTrunkBack: ['#b28cc8', '#2c1e58'],
        hcTrunkMid: ['#984a68', '#2c1436'],
        hcTrunk: ['#8c3a34', '#24101c'],
        hcTrunkDeep: ['#5e2232', '#170a16'],
        hcTrunkLit: ['#ffb24c', '#ff8a3a'],
        hcTrunkFarLit: ['#f4b0d0', '#c6589a'],
        hcTrunkSide: ['#d06a40', '#6a2424'],
        hcBark: ['#8a3a3e', '#2a1222'],
        hcTrunkShine: ['#ffd2e6', '#f282bc'],
        // the bark: its furrows, deep, and its ridges, catching the light on the lit side
        hcFurrow: ['#3c1022', '#0a0410'],
        hcFurrowFar: ['#6c64b0', '#161844'],
        hcRidge: ['#aa4c40', '#4c1a28'],
        hcRidgeLit: ['#ffc274', '#ff9c4c'],
        hcRidgeFar: ['#aaa0e2', '#2e2c6c'],
        // a trunk going up into the mist, paler and pinker towards the page by day, and into the dark at night
        hcTrunkU1: ['#b0627c', '#1e0e1e'],
        hcTrunkU2: ['#d8a2bc', '#160c18'],
        hcTrunkU3: ['#f2d8e6', '#121014'],
        /* the butterflies, white, their wings going softly to a tint of their own at the root by day (pink, gold or lilac,
           so that they read against the light) and white at night; and the light round them, white at their middle and
           a pale aqua by day (a warm one goes green over the turquoise), turquoise at night */
        hcWing: ['#ffffff', '#ffffff'],
        hcWingSoft: ['#fffaf0', '#f0fffb'],
        hcWingPink: ['#ffc0dd', '#f2fffb'],
        hcWingGold: ['#ffd48c', '#f4fff8'],
        hcWingLilac: ['#d0c6ff', '#eefcff'],
        hcHaloCore: ['#fcffff', '#f2fffb'],
        hcHalo: ['#e4fafc', '#bff6ea'],
        hcHaloFar: ['#c6f1f5', '#7fe8dc'],
        // the wash over the wood where it comes in under the buttons, in the wood's own colours (see HC_INKS)
        hcWashTop: ['#c9f0ec', '#0d1c34'],
        hcWashVeil: ['#9fe2e0', '#0c2442'],
        hcWashHigh: ['#5cc6d6', '#0c2b4e'],
        hcWashMid: ['#46b4ce', '#0d335a'],
        // the turquoise light glowing low in the wood, and the deeper blue high in it, behind the crowns
        hcHaze: ['#7ce8de', '#16808a'],
        hcDark: ['#3c8ed2', '#0a2246'],
        // the light coming down through the wood, and the motes glimmering in it
        hcRay: ['#ffffff', '#1f6274'],
        hcRayEnd: ['#d0f6f0', '#123c58'],
        hcMote: ['#fffbe0', '#f0ffb0'],
        hcMoteGlow: ['#fff6c8', '#6cd8a8'],
        // the crowns' glow at night, lost in the light by day
        hcGlowWarm: ['#8cdcdc', '#ff8a4a'],
        hcGlowCool: ['#86d6dc', '#6f86ff'],
        hcGlowPink: ['#90dade', '#f28ad0'],
        // the strip of meadow in the clearing, glowing lime and gold, mint and turquoise where it goes into the flowers
        hcGlow: ['#e8f8c4', '#86d49a'],
        hcMeadowWarm: ['#fff2bc', '#e8e488'],
        hcGrassLit: ['#fbf8d4', '#eef2a6'],
        hcGrass: ['#9ce4b4', '#46c4a0'],
        hcGrassCool: ['#46c6bc', '#1e9c9e'],
        hcGrassDeep: ['#3a8ec8', '#185c92'],
        // the flowers at the foot, on their own bed of cobalt and violet
        hcBed: ['#4a66cc', '#1e3082'],
        hcBedDeep: ['#5a48b8', '#22186c'],
        hcStar: ['#ffffff', '#f6f2ff'],
        // the flowers' own colours: full by day, and glowing at night as the crowns' light does
        ...Object.fromEntries(
          ['pink', 'orange', 'violet', 'blue', 'lilac'].flatMap((tn) => [
            [`hcFl_${tn}`, [HC_DAY[tn][tn === 'lilac' ? 5 : 4], hcNight(HC_DAY[tn], 6)]],
            [`hcFl_${tn}Deep`, [HC_DAY[tn][tn === 'lilac' ? 3 : 2], hcNight(HC_DAY[tn], 5)]],
          ]),
        ),
        hcButter: ['#ffd65a', '#ffd04a'],
      },
      plant: (garden) => {
        const { w, h, rand, words } = garden
        const half = w / 2
        const sc = HC_SCALE(w)
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = (n, { x, y, ...o }) => {
          rand.reseed(61001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: HC_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // a stroke standing on its own foot, which sways in the wind about it: a blade of grass, a flower's stem
        const grow = (n, { x, y, tall, ...o }) => {
          rand.reseed(63001 + n * 7919)
          garden.dab({
            kind: 0.25,
            blur: 0.5,
            load: 0.8,
            stiff: 0.55,
            ...o,
            x,
            y,
            stem: tall / 2,
            long: tall / 2,
            turn: -Math.PI / 2,
          })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const r = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.41)
          const a = r(xi, yi) + (r(xi + 1, yi) - r(xi, yi)) * u
          const b = r(xi, yi + 1) + (r(xi + 1, yi + 1) - r(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875
        // The picture is laid out from the buttons' foot down, where the wood's sheet starts.
        const top = words.y + words.b + 3
        const pic = h - top
        const at = (f) => top + f * pic
        const narrow = hcNarrow({ w, words })
        // how far into the wood's body a place is, from the page (0) to its full (1)
        const inBody = (y) => hcBodyOf({ w, h, words }, y)
        /* The wood's ink at a height, as its sheet paints its lines there (see the sheet's paint): its sheet runs from the
           buttons' foot to 1.3 rooms down, which is about 0.9 of the way to the canvas's foot. A little of the next ink is
           dithered in so that no row of the wash lies on one. */
        const woodInk = (y, q) => {
          const p = (y - top) / (0.95 * pic) + (hashed(q) - 0.5) * 0.08
          return p < 0.2 ? 'hcWashTop' : p < 0.36 ? 'hcWashVeil' : p < 0.52 ? 'hcWashHigh' : 'hcWashMid'
        }
        // trunks and flowers keep more of their size on a narrow canvas than the width alone would give them
        const rs = Math.max(sc, Math.min(0.8, pic / 420))
        const px = Math.max(0.8, Math.sqrt(rs))
        // a crown's colour at a level of its ramp, a little back in the light (fog 1 to 3) or not
        const tone = (name, i, fog = 0) =>
          fog ? `hc_${name}f${fog}_${clamp(Math.round(i), 0, 6)}` : `hc_${name}${clamp(Math.round(i), 0, 6)}`
        let n = 0
        /* How far over the words a thing standing at x is: nothing out beside them, all of it under their middle. A trunk
           there ends in the wood's fade, and one beside them goes on up into the page. */
        const overWords = (x) => 1 - smooth(words.a - 10, words.a + 90, Math.abs(x - words.x))
        // where a tree at x ends: up beside the words where it is clear of them, and in the wood's fade where it is not
        const tipAt = (x, high, low) => high + (low - high) * Math.max(overWords(x), narrow)
        // whether a place is clear of the words (under the buttons, or out beside them), for a branch's tip
        const clearOfWords = (x, y) => y > top + 8 || Math.abs(x - words.x) > words.a + 36
        /* How crowded the words would be by paint at a place, for a crown's leaves: none under the buttons' foot or well
           out beside them, and more and more from a little under a hundred pixels out from their box, above it, so that a
           crown rising beside them thins out raggedly, leaf by leaf, before it comes near them, rather than ending along a
           line (as the reef's corals do). */
        const crowding = (x, y) => (y > top + 10 ? 0 : 1 - smooth(45, 105, Math.abs(x - words.x) - words.a))
        /* Strokes marked as mist (the trunks, their bark and branches) thin into the grain upward across this band: from
           about the heading's top down to a little into the wood, so that the trees rising past the words go up into the
           page and are gone without an edge (on a phone, where nothing rises beside the words, from the buttons' foot to
           a little under it). */
        const mistHigh = words.y - words.b
        garden.mist(mistHigh + (top - 6 - mistHigh) * narrow, at(0.24) - (at(0.24) - at(0.2)) * narrow)

        // A deeper blue high in the wood, behind the crowns, and the turquoise light glowing low between the trunks: soft
        // round clouds of each, scattered up and down so that neither lies along a line, and coming in with the wood.
        for (let k = 0; k < 18; k += 1) {
          const x = ((k + 0.2 + 0.6 * hashed(k * 1.3 + 0.2)) / 18) * w
          const dy = at(0.3 + 0.22 * hashed(k * 5.1 + 0.4))
          put((n += 1), {
            x,
            y: dy,
            long: 0.07 * w,
            wide: 0.5,
            blur: 0.04 * w,
            paints: ['hcDark', 'hcDark'],
            load: (0.14 + 0.08 * hashed(k * 2.3)) * inBody(dy - 0.04 * w) ** 2,
            order: 560,
          })
          const hy = at(0.44 + 0.14 * hashed(k * 3.7 + 0.9))
          put((n += 1), {
            x,
            y: hy,
            long: 0.08 * w,
            wide: 0.45,
            blur: 0.04 * w,
            paints: ['hcHaze', 'hcHaze'],
            load: (0.2 + 0.1 * hashed(k * 4.1)) * inBody(hy - 0.04 * w) ** 2,
            order: 561,
          })
        }

        /* The wood's body: a soft wash over its lines from where it comes in under the buttons down into the wood, in the
           wood's own colour at each height and as much as its body has come in there, so that its lines show through it
           only as a grain and never as stripes, and none stands alone over the page. Flat strokes near the top, so that
           none reaches up past the buttons' foot; none in the small oval of page the engine keeps round the words. */
        // (its strokes no smaller than this on a phone, where strokes a share of the width long would lie in streaks)
        const washLong = clamp(0.06 * w, 56, 110)
        const washStep = 15
        for (let y = top + 8; y < at(0.62); y += washStep) {
          // (from a stroke's length out past either side, so that the canvas's edges are as covered as its middle, and
          // the lines show through there no more than anywhere else)
          const cols = Math.ceil((w + 2 * washLong) / (0.9 * washLong)) + 1
          for (let k = 0; k < cols; k += 1) {
            const q = k * 3.1 + y * 0.07
            const x = ((k + (hashed(q) - 0.5) * 0.4 + ((y - top) / washStep) * 0.5) % cols) * 0.9 * washLong - washLong
            const wy = y + (hashed(q * 1.7 + 0.3) - 0.5) * washStep
            const flat = smooth(top, at(0.25), wy)
            const veil = Math.hypot((x - words.x) / (words.a + 80), (wy - words.y) / (words.b + 18))
            const ink = woodInk(wy, q * 2.3)
            put((n += 1), {
              x,
              y: wy,
              long: washLong,
              wide: 0.18 + 0.22 * flat,
              blur: (0.2 + 0.33 * flat) * washLong,
              paints: [ink, ink],
              load: 0.9 * inBody(wy) * smooth(0.95, 1.15, veil),
              order: 559,
            })
          }
        }

        /* The light coming down through the wood from above and a little to the left, where the clearing is: soft broad
           shafts, slanting, few and uneven, palest at their tops and gone into the wood before the meadow; coming in with
           the wood, and fainter under the words. */
        const slant = -0.22
        const shafts = Math.max(4, Math.round(8 * (w / 1232) ** 0.55))
        for (let k = 0; k < shafts; k += 1) {
          const u = (k + 0.5 + (hashed(k * 3.1 + 0.7) - 0.5) * 0.8) / shafts
          const xt = u * (w + 0.4 * pic) - 0.35 * pic
          const yt = at(0.1 + 0.08 * hashed(k * 1.7 + 0.3))
          const len = (0.4 + 0.25 * hashed(k * 2.3 + 0.1)) * pic
          const broad = (8 + 18 * hashed(k * 4.9 + 0.2) ** 1.5) * sc
          const cx = xt - Math.sin(slant) * len * 0.5
          const cy = yt + Math.cos(slant) * len * 0.5
          put((n += 1), {
            x: cx,
            y: cy,
            long: len * 0.5,
            wide: broad / (len * 0.5),
            turn: Math.PI / 2 + slant,
            blur: broad * 0.8 + 5,
            paints: ['hcRay', 'hcRayEnd'],
            load: (0.45 + 0.3 * hashed(k * 6.1)) * (1 - 0.55 * overWords(xt)) * inBody(yt + 0.45 * len) ** 0.6,
            order: 562,
          })
        }
        // motes of light drifting in it, few and small, high in the wood: pollen in the day's light, at night fireflies
        for (let k = 0; k < Math.round(26 * (w / 1232) ** 0.7); k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const y = at(0.12 + hashed(k * 3.7 + 0.9) ** 1.2 * 0.46)
          if (overWords(x) > 0.6 && y < at(0.22)) {
            continue
          }
          const r = (0.8 + 1.3 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          put((n += 1), {
            x,
            y,
            long: r * 1.8,
            wide: 1,
            blur: r * 1.3,
            paints: ['hcMoteGlow', 'hcMoteGlow'],
            load: 0.16 * inBody(y),
            kind: HC_GLIMMER,
            order: 577.9,
          })
          put((n += 1), {
            x,
            y,
            long: r * 0.5,
            wide: 1,
            blur: r * 0.25,
            paints: ['hcMote', 'hcMote'],
            load: 0.85 * inBody(y),
            kind: HC_TWINKLE,
            order: 577.91,
          })
        }

        // how much paint a stroke carries for the trunk to be this solid where about this many of them lie over each other
        const cover = (solid, deep = 3) => 1 - (1 - clamp(solid, 0, 0.999)) ** (1 / deep)

        /* A leaf or a petal of blossom, as the reef paints its paddles: long, broad and round at its outer end and
           narrowing in to its root, laid from its end inward, from its own colour where the light is on its end to its
           shade at its root; a lit one with a streak of light along its upper side. `a` is which way it points, from
           straight up (radians, to the right for more than nothing); it lies over (x0, y0), its round end a leaf's
           half-length out from there. */
        const paddle = (P, x0, y0, a, l, f, q, o, { soft = 0, streak = true, load = 0.95 } = {}) => {
          const ox = Math.sin(a)
          const oy = -Math.cos(a)
          const br = l * (0.33 + 0.1 * hashed(q * 0.37 + 0.11))
          const cx = x0 + ox * l * 0.05
          const cy = y0 + oy * l * 0.05
          const turn = Math.atan2(-oy, -ox)
          put((n += 1), {
            x: cx,
            y: cy,
            long: l,
            wide: br / l,
            turn,
            blur: Math.min(br * 0.2, 1.2) + 0.3 + soft,
            paints: [P(f + 0.8), P(f - 1.3)],
            load,
            kind: HC_LEAF,
            order: o,
          })
          if (streak && f > 3.1 && l > 4 * px) {
            const sgn = ox > 0 ? -1 : 1
            put((n += 1), {
              x: cx + ox * l * 0.15 - oy * sgn * br * 0.42,
              y: cy + oy * l * 0.15 + ox * sgn * br * 0.42,
              long: l * 0.62,
              wide: clamp((br * 0.34) / (l * 0.62), 0.05, 0.5),
              turn,
              blur: 0.5,
              paints: [P(f + 1.9), P(f + 0.8)],
              load: load * 0.85,
              kind: 0,
              order: o + 1e-9,
            })
          }
        }

        /* A crown of leaves or blossom, painted as the reef's corals are: a few heaped clumps of uneven size, the upper
           ones rising unevenly and one overhanging at a side, the upper ones behind and the lower ones laid over them.
           Each is a deep body of its own shade, kept a leaf's length inside its leaves so that none of it ever shows past
           them, under long leaves packed close and fanning up and out from the clump's foot (and a little out from the
           crown's), as the reef's paddles do, the outer ones first and the inner ones over their roots, so that each
           clump is one heaped mass and the crown is a mass of them rather than a ball of loose leaves. The lit clumps,
           on its upper left where the clearing's light comes from, have the larger leaves; each leaf is lit as its clump
           is round, deeper where the clump in front shades it; its edge is ragged with the leaves' ends against the air.
           Some of the lit leaves at its edge are in a second colour (`tips`), as the reef's violet corals go pink at
           their tips. A crown a little back in the light (`fog`) has its colours going into it; one in the wood (`wood`)
           comes in only as the wood around it does; and near the words its leaves are left out more and more, so that
           it thins out raggedly before it comes near them, its body with them. A bough of blossom (`line`, the curve of
           the branch it grows on) is a spray of small clumps along the branch's outer part instead, hanging from it,
           its blossom drooping if it is `droop`. At night a soft glow behind it. */
        const crown = (c) => {
          const {
            x: cx,
            y: cy,
            rx,
            ry,
            tone: tn,
            tips = null,
            seed,
            order,
            fog = 0,
            leaf = 1,
            wood = false,
            glow = null,
            soft = 0,
            body = 0.92,
            lift = 0,
            line = null,
            droop = false,
          } = c
          if (rx < 6 || ry < 6) {
            return
          }
          const streak = !fog && !soft
          const F = (f) => tone(tn, f + lift, fog)
          const T = tips ? (f) => tone(tips, f - 0.2 + lift, fog) : F
          const into = (y) => (wood ? inBody(y) : 1)
          let clumps
          if (line) {
            /* along the branch's outer part, smaller to its tip, each hanging a little under it, as many as it takes for
               them to run into each other however long the branch is, so that the spray is one */
            const r0 = ry * 0.62
            let reach = 0
            for (let g = 0.4; g < 1.02; g += 0.062) {
              const [ax, ay] = line(g)
              const [bx2, by2] = line(g + 0.062)
              reach += Math.hypot(bx2 - ax, by2 - ay)
            }
            const many = clamp(Math.round(reach / (0.95 * r0)) + 1, 4, 12)
            clumps = Array.from({ length: many }, (_, k) => {
              const g = 0.4 + (0.62 * k) / (many - 1)
              const [lx, ly] = line(g)
              const [mx, my] = line(g + 0.02)
              const r = r0 * (1 - 0.38 * (k / (many - 1))) * (0.88 + 0.24 * hashed(seed * 3.1 + k))
              // (the way its leaves lie: out along the branch towards its tip, turned up, or down for a drooping one)
              const tl = Math.hypot(mx - lx, my - ly) || 1
              const dx = (mx - lx) / tl
              const dy = (my - ly) / tl + (droop ? 1.3 : -0.9)
              const dl = Math.hypot(dx, dy) || 1
              return {
                x: lx + (hashed(seed * 4.3 + k) - 0.5) * 0.3 * r,
                y: ly + (droop ? 0.55 : 0.15) * r + (hashed(seed * 2.7 + k) - 0.5) * 0.3 * r,
                r,
                k,
                dir: [dx / dl, dy / dl],
              }
            })
          } else {
            // its clumps, spread through it as a sunflower's seeds are, broad and heaped, of uneven sizes
            const many = clamp(Math.round((rx * ry) / (1250 * rs * rs)), 3, 13)
            const rc = Math.sqrt((rx * ry) / many) * 1.1
            clumps = Array.from({ length: many }, (_, k) => {
              const a = k * 2.39996 + seed * 1.7
              const d = Math.sqrt((k + 0.4) / many) * 0.72
              const r = rc * (0.76 + 0.52 * hashed(seed * 3.1 + k))
              // (the upper ones rising unevenly, so that its top is no dome)
              const up = Math.cos(a) > 0.2 ? (hashed(seed * 5.3 + k) - 0.3) * 0.4 * r : 0
              return { x: cx + Math.sin(a) * d * (rx - 0.6 * r), y: cy - Math.cos(a) * d * (ry - 0.5 * r) - up, r, k }
            })
            // and one overhanging at a side, lower down and smaller
            if (many >= 4) {
              const side = hashed(seed * 7.7) < 0.5 ? -1 : 1
              clumps.push({ x: cx + side * rx * 0.74, y: cy + 0.14 * ry, r: rc * 0.72, k: many })
            }
          }
          clumps.sort((p, q) => p.y - q.y)
          clumps.forEach((cl) => {
            cl.dabs = []
            cl.cand = 0
            cl.crowd = 0
            // how much of the light it is in, on the crown's upper left, for the size of its leaves
            cl.lit = line ? 0.5 : clamp(0.55 - 0.45 * ((cl.x - cx) / rx) - 0.5 * ((cl.y - cy) / ry), 0, 1)
          })
          // a clump's outline: how far out from its middle at an angle, a little lumpy, and flatter underneath
          const edgeOf = (cl, dx, dy) => {
            const phi = Math.atan2(dx, -dy)
            const lumpy =
              0.86 +
              0.32 * (fbm(phi * 0.9 + cl.k * 3.7 + seed, seed * 0.71 + cl.k) - 0.5) +
              0.07 * Math.sin(phi * 4 + cl.k * 1.9)
            return cl.r * lumpy * (dy > 0 ? 1 - 0.18 * (dy / Math.hypot(dx, dy || 1)) ** 2 : 1)
          }
          // (its glow no nearer the words than its leaves go: a glow reaching out from it is left out where it would; a
          // spray's along its clumps)
          if (glow) {
            const gx0 = line ? clumps.reduce((a, cl) => a + cl.x, 0) / clumps.length : cx
            const gy0 = line ? clumps.reduce((a, cl) => a + cl.y, 0) / clumps.length : cy
            const grx = line
              ? (Math.max(...clumps.map((cl) => cl.x)) - Math.min(...clumps.map((cl) => cl.x))) / 2 + ry * 0.4
              : rx
            for (let k = 0; k < 3; k += 1) {
              const gx = gx0 + (k - 1) * grx * 0.35
              const gy = gy0 + (hashed(seed + k) - 0.5) * ry * 0.4
              const reach = Math.max(grx, ry) * 0.65
              const near = Math.max(crowding(gx - 1.6 * reach, gy - reach), crowding(gx + 1.6 * reach, gy - reach))
              put((n += 1), {
                x: gx,
                y: gy,
                long: reach,
                wide: 0.85,
                blur: reach * 0.6,
                paints: [glow, glow],
                load: 0.15 * (1 - 0.45 * narrow) * into(cy) * (1 - near),
                kind: HC_HAZE,
                order: order - 0.003,
              })
            }
          }
          // a leaf's half-length (the lit clumps' larger), and the spacing they are packed at
          const L = clamp((line ? 0.16 : 0.13) * Math.min(rx, ry), 3.4 * px, 13 * rs) * leaf
          const sp = L * 0.88
          const x0 = Math.min(...clumps.map((cl) => cl.x - 1.4 * cl.r))
          const x1 = Math.max(...clumps.map((cl) => cl.x + 1.4 * cl.r))
          const y0 = Math.min(...clumps.map((cl) => cl.y - 1.4 * cl.r))
          const y1 = Math.max(...clumps.map((cl) => cl.y + 1.4 * cl.r))
          for (let gy = y0; gy <= y1; gy += sp * 0.82) {
            for (let gx = x0; gx <= x1; gx += sp) {
              const q = Math.round(gx / sp) * 7.31 + Math.round(gy / sp) * 13.7 + seed * 101
              const x = gx + (hashed(q * 1.1) - 0.5) * sp * 0.8
              const y = gy + (hashed(q * 1.7) - 0.5) * sp * 0.8
              if (y > h + 4) {
                continue
              }
              // the frontmost (lowest) clump it is in; none, and it is a gap in the crown
              let own = null
              let rn = 0
              const ins = []
              for (const cl of clumps) {
                const e = Math.hypot(x - cl.x, y - cl.y) / edgeOf(cl, x - cl.x, y - cl.y)
                if (e < 1) {
                  own = cl
                  rn = e
                  ins.push(cl)
                }
              }
              if (!own) {
                continue
              }
              // which way it points: fanning up and out from its clump's foot (down and out from above it, drooping),
              // and a little out from the crown's
              const hy = droop ? own.y - 1.3 * own.r : own.y + 1.7 * own.r
              let ux = x - own.x
              let uy = y - hy
              const ul = Math.hypot(ux, uy) || 1
              ux /= ul
              uy /= ul
              if (own.dir) {
                ux = 0.6 * ux + 0.4 * own.dir[0]
                uy = 0.6 * uy + 0.4 * own.dir[1]
              } else {
                const vx = x - cx
                const vy = y - (cy + 1.4 * ry)
                const vl = Math.hypot(vx, vy) || 1
                ux = 0.5 * ux + (0.5 * vx) / vl
                uy = 0.5 * uy + (0.5 * vy) / vl
              }
              const a = Math.atan2(ux, -uy) + (hashed(q * 2.3) - 0.5) * 0.45
              const l =
                L * (0.82 + 0.36 * own.lit) * (0.8 + 0.4 * hashed(q * 4.7)) * (0.72 + 0.4 * Math.min(1, rn * 1.3))
              const tx = x + Math.sin(a) * l
              const ty = y - Math.cos(a) * l
              for (const cl of ins) {
                cl.cand += 1
              }
              // near the words, left out more and more, its far end judged as well as its middle
              const c2 = Math.max(crowding(x, y), crowding(tx, ty))
              if (c2 > 0 && hashed(q * 9.13) < c2 * 1.25) {
                for (const cl of ins) {
                  cl.crowd += 1
                }
                continue
              }
              // broken a little at its edge, and thinning out up its top
              const high = line ? 0 : smooth(cy - 0.35 * ry, cy - 1.1 * ry, y)
              if (hashed(q * 6.7) < smooth(0.85, 1, rn) * 0.18 + high * 0.2) {
                continue
              }
              own.dabs.push({ x, y, q, rn, a, l })
            }
          }
          clumps.forEach((cl, ci) => {
            if (!cl.dabs.length) {
              return
            }
            const o0 = order + ci * 0.0001
            /* its body, deep in its own shade, which shows between its leaves: a leaf's length inside their ends all round,
               softened less than that, so that it never shows past them as a soft blot; and fading where its leaves are
               left out near the words, so that none of it is left standing there */
            const kept = smooth(0.8, 0.98, 1 - cl.crowd / Math.max(1, cl.cand))
            const inset = 1.1 * L * (0.82 + 0.36 * cl.lit)
            // (its top a leaf's length in from the lowest of its upper outline, and its sides and foot less, where its
            // leaves are thicker)
            const rTop = Math.min(
              ...[-1.1, -0.55, 0, 0.55, 1.1].map((phi) => edgeOf(cl, Math.sin(phi), -Math.cos(phi))),
            )
            const bTop = cl.y - (rTop * 0.92 - inset)
            const bFoot = cl.y + edgeOf(cl, 0, 1) * 0.8
            const bx = Math.min(cl.r * 0.92 - 0.6 * inset, rTop * 0.95 - 0.3 * inset)
            const by = (bFoot - bTop) / 2
            // (and none of it where its own top would come near the words, where a faint one is a speckled smudge)
            const keep =
              kept *
              (1 -
                smooth(
                  0,
                  0.25,
                  Math.max(
                    crowding(cl.x - bx, bTop + 0.3 * by),
                    crowding(cl.x, bTop),
                    crowding(cl.x + bx, bTop + 0.3 * by),
                  ),
                ))
            if (cl.dabs.length > 4 && bx > 3 && by > 3 && keep > 0.02) {
              const my = (bTop + bFoot) / 2
              put((n += 1), {
                x: cl.x,
                y: my,
                long: bx,
                wide: clamp(by / bx, 0.45, 1.6),
                turn: 0.15,
                blur: Math.min(0.5 * inset, 0.3 * by) + soft,
                paints: [F(1.1), F(0.3)],
                load: body * into(my) * keep,
                kind: HC_LEAF,
                order: o0,
              })
            }
            // the clumps in front of it, which shade it where they meet it
            const fronts = clumps.slice(ci + 1)
            const leaves = cl.dabs.map((d) => {
              const u = clamp((d.x - cl.x) / cl.r, -1, 1)
              const v = clamp((d.y - cl.y) / cl.r, -1, 1)
              const z = Math.sqrt(Math.max(0, 1 - u * u - v * v))
              let shade = 0
              for (const fr of fronts) {
                const e = Math.hypot(d.x - fr.x, d.y - fr.y) / fr.r
                shade = Math.max(shade, 1 - smooth(1, 1.45, e))
              }
              const lt =
                0.46 +
                0.6 * (-0.42 * u - 0.6 * v + 0.62 * z) -
                0.14 * ((d.y - cy) / ry) -
                0.42 * shade +
                (hashed(d.q * 3.1) - 0.5) * 0.24
              return { ...d, lt: clamp(lt, 0, 1.1), key: d.rn + (hashed(d.q * 8.3) - 0.5) * 0.25 }
            })
            // the outer ones first and the inner ones over their roots
            leaves.sort((p, q) => q.key - p.key)
            leaves.forEach(({ x, y, q, lt, rn, a, l }, di) => {
              const f = 0.1 + 5.3 * lt ** 1.1
              const P = tips && lt > 0.55 && rn > 0.45 && hashed(q * 5.3) < 0.5 ? T : F
              paddle(P, x, y, a, l, f, q, o0 + (di + 1) * 1e-8, { soft, streak, load: 0.95 * into(y) })
            })
          })
        }

        /* A limb: a branch or a twig, from where it leaves its trunk (or branch) out to its tip along a gentle curve,
           narrowing as it goes and its paint thinning out towards the tip, in the trunk's own inks at each height (paler
           up in the mist), lit along its upper side when its tree is; and a twig off it or two. */
        const limb = (seed, bx, by, ex, ey, half0, look, depth = 0) => {
          const { order, inkAt, fadeAt, load, lit, blur, twigs = 0, kind = HC_TRUNK, tipOut = 0, overlap = 0.95 } = look
          const dx = ex - bx
          const dy = ey - by
          const len = Math.hypot(dx, dy)
          if (len < 4) {
            return
          }
          // the curve's middle, pushed a little to one side of the straight line (or as far as the look says, for a limb
          // that leaves its trunk outward and turns up as it goes)
          const bend = look.bend === undefined || depth ? (hashed(seed * 3.3 + 0.4) - 0.5) * 0.24 * len : look.bend
          const cx = bx + dx * 0.5 - (dy / len) * bend
          const cy = by + dy * 0.5 + (dx / len) * bend
          const step = Math.max(3.5, half0 * 1.3)
          const count = Math.max(2, Math.ceil(len / step))
          const pointAt = (g) => [
            (1 - g) * (1 - g) * bx + 2 * (1 - g) * g * cx + g * g * ex,
            (1 - g) * (1 - g) * by + 2 * (1 - g) * g * cy + g * g * ey,
          ]
          for (let k = 0; k <= count; k += 1) {
            const g = k / count
            const [x, y] = pointAt(g)
            const [x2, y2] = pointAt(Math.min(1, g + 0.02))
            const [x1, y1] = pointAt(Math.max(0, g - 0.02))
            const turn = Math.atan2(y2 - y1, x2 - x1)
            const b = half0 * (1 - 0.72 * g) + 0.35
            const fade = fadeAt(y)
            const ink = inkAt(fade, seed * 13 + k)
            // (a limb going on up into the page, as a tree's top does, runs out of paint to nothing at its tip)
            const thin = (1 - 0.55 * g * g) * (1 - 0.7 * fade) * (1 - tipOut * smooth(0.25, 1, g))
            const o = order - 0.002 + depth * 0.0001 + k * 0.000001
            put((n += 1), {
              x,
              y,
              long: step * overlap,
              wide: clamp(b / (step * overlap), 0.03, 1.2),
              turn,
              blur,
              paints: [ink, ink],
              load: cover(load * thin, 3 * Math.max(1, overlap / 0.95)),
              kind,
              order: o,
            })
            // its upper side catching the light
            if (lit && g < 0.85) {
              const nx = Math.sin(turn) * (turn > -Math.PI / 2 && turn < Math.PI / 2 ? 1 : -1)
              const ny = -Math.abs(Math.cos(turn))
              put((n += 1), {
                x: x + nx * b * 0.55,
                y: y + ny * b * 0.55,
                long: step * 0.95,
                wide: clamp((b * 0.28) / (step * 0.95), 0.02, 0.4),
                turn,
                blur: Math.max(0.6, blur * 0.7),
                paints: ['hcTrunkLit', 'hcTrunkLit'],
                load: cover(lit * (1 - fade) ** 2 * (1 - g), 3),
                kind,
                order: o + 0.0000005,
              })
            }
          }
          // a twig or two off its outer half
          if (depth === 0 && len > 26 && twigs) {
            for (let j = 0; j < (len > 70 ? twigs : 1); j += 1) {
              const g = 0.45 + 0.35 * hashed(seed * 5.7 + j * 2.1)
              const [tx, ty] = pointAt(g)
              const base = Math.atan2(ey - by, ex - bx)
              const off = (j % 2 ? 1 : -1) * (0.45 + 0.35 * hashed(seed * 7.9 + j))
              // a twig leaning upward rather than down
              const turn = Math.sin(base + off) > 0.2 ? base - off : base + off
              const tl = len * (0.25 + 0.2 * hashed(seed * 9.1 + j))
              const tex = tx + Math.cos(turn) * tl
              const tey = ty + Math.sin(turn) * tl
              if (clearOfWords(tex, tey)) {
                limb(seed * 3.1 + j + 1, tx, ty, tex, tey, Math.max(0.5, half0 * (1 - 0.72 * g) * 0.55), look, 1)
              }
            }
          }
          // (its curve, for a bough of blossom to grow along)
          return pointAt
        }

        /* A tree, standing as real trunks do: flared where it goes into the ground and tapering as it rises, leaning a
           little with a slow bow and a hair of wander; painted in soft strokes laid along its axis, its body in one shade
           (two columns on a wide one, the right one in shade), lit along its left side by the clearing's light, with the
           bark's furrows running up it in fine broken strokes, now and then a knot, and the odd branch going up and out.
           From `fadeFrom` up to its tip it fades out: paler (towards the page by day), thinner and, marked as mist, into
           the grain. A far one (`wood`) comes in only as the wood around it does. */
        const tree = (id, x0, foot, tip, width, look) => {
          const {
            order,
            load = 0.9,
            blur = 1.6,
            dark = 1,
            lean = 0,
            taper = 0.32,
            flare = 0.6,
            fadeFrom = foot,
            body,
            shade = body,
            ups,
            lit = 0,
            shine = 0,
            furrows = 0,
            bark = ['hcFurrow', 'hcRidge', 'hcRidgeLit'],
            knots = 0,
            branches = 0,
            reach = 0.2,
            twigs = 0,
            limbs = [],
            roots = 0,
            fork = false,
            wood = false,
          } = look
          const tall = foot - tip
          if (tall < 10) {
            return
          }
          const half0 = width / 2
          const bow = (hashed(id * 2.3 + 0.7) - 0.5) * 0.035 * tall
          const axis = (f) =>
            x0 +
            lean * f * tall +
            bow * Math.sin(f * Math.PI) +
            (fbm(id * 3.1, (foot - f * tall) / 150) - 0.5) * width * 0.28
          const halfAt = (f) => half0 * (1 + flare * (1 - smooth(0, 0.1, f)) ** 2) * (1 - taper * f)
          const turnAt = (f) => Math.atan2(tall * 0.01, axis(f) - axis(f + 0.01))
          const fadeAt = (y) => {
            const u = clamp((fadeFrom - y) / Math.max(1, fadeFrom - tip), 0, 1)
            return u * u * (3 - 2 * u)
          }
          const woodAt = (y) => (wood ? 0.1 + 0.9 * inBody(y) : 1)
          // paler going up, into the mist, a few rows of each shade running into the next
          const inkAt = (fade, k) => {
            const lvl = fade * (ups.length + 0.3) + (hashed(id * 5.1 + k * 2.3) - 0.5) * 0.7
            return lvl < 0.5 ? body : ups[clamp(Math.floor(lvl - 0.5), 0, ups.length - 1)]
          }
          const wide = half0 >= 5
          const step = wide ? Math.max(6, half0 * 0.45) : Math.max(6, half0 * 2.6)
          const rows = Math.ceil(tall / step)
          const base = order + id * 0.01
          /* where it puts out its top limb, if it rises past the words (see below): the trunk goes on over it as its leader,
             a little thinner for what the limb took, up to its tip */
          const forkF = fork && tip < top - 10 ? fork + 0.06 * hashed(id * 4.7) : 2
          /* A trunk rising into the page narrows a little more as it goes up into the mist, as a trunk seen going away into
             it does; one whose top is in the wood keeps its width, a trunk going up into the fog rather than a post with
             a point. */
          const thinUp = tip < top ? 0.3 : 0.06
          const widthAt = (f, fade) =>
            halfAt(f) * (1 - thinUp * fade) * (forkF < 1 ? 1 - 0.5 * smooth(forkF - 0.03, forkF + 0.16, f) : 1)
          for (let k = 0; k <= rows; k += 1) {
            const f = k / rows
            const y = foot - f * tall
            const x = axis(f)
            const turn = turnAt(f)
            const fade = fadeAt(y)
            const hw = widthAt(f, fade)
            const into = woodAt(y)
            const ink = inkAt(fade, k)
            // (and one whose top is in the wood is gone into the fog at its tip, not ended there)
            /* and over its fork the leader goes on only a little past its top limbs, thinning away by paint, so that it never
               stands up over them as a needle with a stub */
            const lead = forkF < 1 ? 1 - smooth(forkF + (1 - forkF) * 0.5, forkF + (1 - forkF) * 0.85, f) : 1
            const solid = load * dark * into * lead * (1 - (tip < top ? 0.78 : 0.85) * fade)
            const a = step * (wide ? 3 : 1.8)
            const o = base + k * 0.000001
            if (wide) {
              // the left half in the body's shade and the right in the shade beyond it, so it is round
              for (const side of [-1, 1]) {
                const deep = side > 0 && ink === body ? shade : ink
                put((n += 1), {
                  x: x + side * hw * 0.36,
                  y,
                  long: a,
                  wide: clamp((hw * 0.66) / a, 0.04, 1.2),
                  turn,
                  blur,
                  paints: [deep, deep],
                  load: cover(solid, 6),
                  kind: HC_TRUNK,
                  order: o,
                })
              }
              // and between its lit edge and its body, the light turning away round it
              if (lit && ink === body) {
                put((n += 1), {
                  x: x - hw * 0.6,
                  y,
                  long: a,
                  wide: clamp((hw * 0.22) / a, 0.02, 0.5),
                  turn,
                  blur: blur * 1.3,
                  paints: ['hcTrunkSide', 'hcTrunkSide'],
                  load: cover(0.75 * lit * dark * (1 - fade) ** 2, 6),
                  kind: HC_TRUNK,
                  order: o + 0.0000002,
                })
              }
            } else {
              put((n += 1), {
                x,
                y,
                long: a,
                wide: clamp((hw * 0.95) / a, 0.04, 1.4),
                turn,
                blur,
                paints: [ink, ink],
                load: cover(solid, 3),
                kind: HC_TRUNK,
                order: o,
              })
            }
            // the light along its left side, gone first as it fades
            if (lit) {
              put((n += 1), {
                x: x - hw * 0.8,
                y,
                long: a,
                wide: clamp((hw * (wide ? 0.24 : 0.34)) / a, 0.02, 0.5),
                turn,
                blur: Math.max(0.6, blur * 1.1),
                paints: [wide ? 'hcTrunkLit' : 'hcTrunkFarLit', wide ? 'hcTrunkLit' : 'hcTrunkFarLit'],
                load: cover(lit * dark * into * (1 - fade) ** 2.5, wide ? 4 : 3),
                kind: HC_TRUNK,
                order: o + 0.0000003,
              })
            }
            // and a fine pale streak down its right, as the reference's tree has
            if (shine && f > 0.03) {
              put((n += 1), {
                x: x + hw * 0.6,
                y,
                long: a,
                wide: clamp((0.6 * rs) / a, 0.005, 0.2),
                turn,
                blur: 0.9,
                paints: ['hcTrunkShine', 'hcTrunkShine'],
                load: cover(shine * (1 - fade) ** 2.4 * smooth(0.03, 0.15, f), 6),
                kind: HC_TRUNK,
                order: o + 0.0000006,
              })
            }
          }
          /* The bark: furrows running up the trunk, each a run of fine strokes of its own lengths with gaps between, so
             that it is broken as bark is, following the trunk's lean and taper; dark in the shade, and on the lit side
             its ridges catching the light. */
          for (let j = 0; j < furrows; j += 1) {
            const u = -0.82 + (1.64 * (j + 0.5 + (hashed(id * 3.7 + j * 1.9) - 0.5) * 0.7)) / furrows
            let f = 0.015 + 0.04 * hashed(id + j * 4.3)
            let s = 0
            while (f < 0.97 && s < 120) {
              const q = id * 131 + j * 17 + s * 3.1
              s += 1
              const len = ((10 + 30 * hashed(q * 1.3)) * Math.max(0.8, rs)) / tall
              const gap = ((3 + 12 * hashed(q * 2.9)) * Math.max(0.8, rs)) / tall
              const fc = Math.min(0.99, f + len / 2)
              f += len + gap
              if (hashed(q * 4.7) < 0.12) {
                continue
              }
              const y = foot - fc * tall
              const fade = fadeAt(y)
              if (fade > 0.97) {
                break
              }
              const hw = widthAt(fc, fade)
              const x = axis(fc) + u * hw + (fbm(q * 0.1, fc * 9) - 0.5) * hw * 0.12
              const litSide = u < -0.3
              const ridge = litSide ? hashed(q * 6.1) < 0.6 : hashed(q * 6.1) < 0.35
              const paints = ridge ? (litSide && lit ? [bark[2], bark[1]] : [bark[1], bark[1]]) : [bark[0], bark[0]]
              const long = (len * tall) / 2
              const thick = (0.55 + 0.45 * hashed(q * 7.3)) * Math.max(0.8, Math.sqrt(rs)) * (ridge ? 0.85 : 1)
              put((n += 1), {
                x,
                y,
                long,
                wide: clamp(thick / long, 0.004, 0.25),
                turn: turnAt(fc) + (hashed(q * 8.9) - 0.5) * 0.05,
                blur: 0.5,
                paints,
                load: cover((ridge ? 0.6 : 0.7) * dark * woodAt(y) * (1 - fade) ** 1.5, 2),
                kind: HC_BARK,
                order: base + 0.00001 + j * 0.0000001,
              })
            }
          }
          // now and then a knot, where a branch was lost: a dark eye across the bark with its lower lip lit
          for (let j = 0; j < knots; j += 1) {
            const fk = 0.2 + 0.5 * hashed(id * 9.3 + j * 3.7)
            const y = foot - fk * tall
            const fade = fadeAt(y)
            const hw = halfAt(fk)
            const x = axis(fk) + (hashed(id * 4.4 + j) - 0.6) * hw * 0.8
            const r = hw * (0.22 + 0.12 * hashed(id * 6.6 + j))
            put((n += 1), {
              x,
              y,
              long: r,
              wide: 0.5,
              turn: 0.1,
              blur: 0.8,
              paints: [bark[0], bark[0]],
              load: cover(0.8 * dark * (1 - fade) ** 1.5, 2),
              kind: HC_BARK,
              order: base + 0.00002,
            })
            put((n += 1), {
              x,
              y: y + r * 0.42,
              long: r * 0.9,
              wide: 0.16,
              turn: 0.1,
              blur: 0.6,
              paints: [bark[1], bark[1]],
              load: cover(0.5 * dark * (1 - fade) ** 1.5, 2),
              kind: HC_BARK,
              order: base + 0.000021,
            })
          }
          const limbLook = {
            order: base,
            inkAt,
            fadeAt,
            load: load * dark * 0.85,
            lit: lit * 0.7,
            blur: Math.max(0.9, blur * 0.9),
            twigs,
          }
          /* the branches it holds out to given places, each leaving the trunk at a height of its own and rising to its
             place at an angle of its own, so that the two are no pair of arms held out level */
          const curves = limbs.map(([ex, ey], j) => {
            const side = ex < x0 ? -1 : 1
            const by = Math.min(foot - 0.2 * tall, ey + Math.abs(ex - x0) * (0.36 + 0.18 * j))
            const fb = clamp((foot - by) / tall, 0, 1)
            // (on a phone, where the trunk fades from low down, its branches fade less, so that it is no bare column)
            const look = {
              ...limbLook,
              fadeAt: (y) => fadeAt(y) * (1 - 0.6 * narrow),
              bend: -side * (0.1 + 0.08 * j) * Math.hypot(ex - x0, ey - by),
            }
            return limb(id * 7 + j * 3 + 1, axis(fb) + side * halfAt(fb) * 0.55, by, ex, ey, halfAt(fb) * 0.3, look)
          })
          /* and the odd branch of its own, going up and out: low enough that it is in the wood, where it is drawn against
             the dark, and not a lone stroke high in the pale fog */
          for (let j = 0; j < branches; j += 1) {
            const from = Math.max(at(wood ? 0.38 : 0.3), tip + 0.2 * tall)
            const by = from + (foot - 0.25 * tall - from) * hashed(id * 2.9 + j * 5.3)
            const fb = (foot - by) / tall
            if (fadeAt(by) > 0.7 || by > foot - 0.2 * tall) {
              continue
            }
            let side = (j + Math.floor(hashed(id * 1.7) * 2)) % 2 ? 1 : -1
            const up = 0.5 + 0.45 * hashed(id * 3.9 + j * 2.2)
            // (shortened, as it is, where it would go up past the wood's dark into the fog)
            const len = Math.min(
              tall * reach * (0.6 + 0.6 * hashed(id * 6.1 + j * 1.3)),
              (by - at(wood ? 0.26 : 0.2)) / Math.cos(up),
            )
            if (len < 8) {
              continue
            }
            const hw = halfAt(fb)
            const end = (sd) => [axis(fb) + sd * (hw * 0.6 + Math.sin(up) * len), by - Math.cos(up) * len]
            let [ex, ey] = end(side)
            if (!clearOfWords(ex, ey)) {
              side = -side
              ;[ex, ey] = end(side)
            }
            if (!clearOfWords(ex, ey)) {
              continue
            }
            limb(id * 11 + j * 5 + 2, axis(fb) + side * hw * 0.5, by, ex, ey, Math.max(0.6, hw * 0.34), limbLook)
          }
          /* where it rises past the words, its top: the trunk goes on up as its leader, and puts out a limb on the side away
             from the words, leaving it wide and turning up as it goes, as a tree's top limbs do (and, where there is room
             for it clear of the words, a shorter one a little lower on their side). Each is plain paint rather than the
             mist's specks, running out of paint to nothing at its tip, so that it is no spray of broken strokes. */
          if (forkF < 1) {
            const topLook = {
              ...limbLook,
              kind: HC_HAZE,
              tipOut: 1,
              lit: 0,
              overlap: 2,
              blur: Math.max(2.2, blur * 1.4),
              twigs: 1,
            }
            const away = Math.sign(x0 - words.x) || 1
            const reachOut = (side, fb, spread, share, seed) => {
              const by = foot - fb * tall
              const hw = widthAt(fb, fadeAt(by))
              const len = (by - tip) * share
              const bx = axis(fb) + side * hw * 0.4
              const ex = bx + side * Math.sin(spread) * len
              const ey = by - Math.cos(spread) * len
              if (!clearOfWords(ex, ey)) {
                return false
              }
              limb(seed, bx, by, ex, ey, hw * 0.5, { ...topLook, bend: side * 0.25 * len })
              return true
            }
            reachOut(away, forkF, 0.45 + 0.2 * hashed(id * 5.3), 0.8 + 0.15 * hashed(id * 6.9), id * 13 + 7)
            const low = Math.max(0.2, forkF - 0.12)
            const share = 0.35 + 0.1 * hashed(id * 8.3)
            ;[
              [0.5, share],
              [0.38, share],
              [0.25, share],
              [0.3, 0.22],
            ].find(([spread, part]) => reachOut(-away, low, spread, part, id * 13 + 9))
          }
          // its roots, spreading into the ground at its foot
          for (let k = 0; k < roots; k += 1) {
            const side = k % 2 ? 1 : -1
            const len = (18 + 16 * hashed(k * 3.9 + id)) * rs * (half0 / 23)
            const ang = side * (0.35 + 0.35 * hashed(k * 2.3 + id))
            const rx = x0 + side * half0 * 0.6
            const ry = foot - 4 * rs
            put((n += 1), {
              x: rx + Math.sin(ang) * len * 0.5,
              y: ry + Math.cos(ang) * len * 0.25,
              long: len * 0.6,
              wide: 0.22,
              turn: side > 0 ? 0.35 : Math.PI - 0.35,
              blur: 1.2,
              paints: [body, shade],
              load: 0.9 * dark,
              kind: HC_HAZE,
              order: base + 0.003,
            })
          }
          // where its top is, for a crown to be put on it
          return { x: axis(1), y: tip, xAt: (y) => axis(clamp((foot - y) / tall, 0, 1)), curves }
        }
        const treeX = HC_TREE.x * w
        const treeHalf = (HC_TREE.wide * rs) / 2

        // The far trees, going back into the light: slender trunks, out of focus and hardly darker than the air, gathered
        // here and sparse there, each going up into the wood as it fades, under a soft cloud of blossom at a height of
        // its own.
        const far = Math.max(7, Math.round(19 * (w / 1232) ** 0.8))
        for (let k = 0; k < far; k += 1) {
          const u = (k + 0.5 + 0.9 * (hashed(k * 3.3 + 0.1) - 0.5)) / far
          const x = (u + 0.05 * Math.sin(u * 13.7 + 1.1)) * w
          if (Math.abs(x - treeX) < treeHalf * 1.6) {
            continue
          }
          const width = (2.4 + 7 * hashed(k * 5.7 + 0.3) ** 2) * rs
          // (none standing under the words goes up close under the buttons: one there would point at them)
          // (and on a phone, where the wood is short, none up in its haze, where a crown is a pale smudge)
          const tip = Math.max(
            at(0.02 + 0.26 * hashed(k * 8.1) + 0.16 * narrow),
            overWords(x) > 0.3 ? at(0.14 + 0.12 * narrow) : 0,
          )
          // its crown, a soft cloud of blossom going back into the light
          const fr = (17 + 17 * hashed(k * 6.9 + 0.5)) * rs
          const pick = hashed(k * 4.1 + 0.6)
          crown({
            x: x + (hashed(k * 2.7) - 0.5) * fr * 0.6,
            y: tip + fr * 0.35,
            rx: fr * 1.25,
            ry: fr,
            tone: ['pink', 'lilac', 'violet', 'blue'][Math.floor(pick * 4)],
            seed: 300 + k,
            order: 563 + (100 + k) * 0.01 + 0.005,
            fog: overWords(x) > 0.5 && narrow < 0.5 ? 2 : 1,
            leaf: 1.9,
            wood: true,
            soft: 1 - 0.6 * narrow,
            body: 0.85,
          })
          tree(100 + k, x, at(0.6 + 0.03 * hashed(k * 2.9)), tip, width, {
            order: 563,
            load: 0.45,
            blur: Math.max(0.8, width * 0.3),
            lean: (hashed(k * 4.9 + 0.2) - 0.5) * 0.07,
            taper: 0.42,
            flare: 0.35,
            fadeFrom: at(0.4 + 0.08 * hashed(k * 7.7)),
            body: hashed(k * 6.3) < 0.5 ? 'hcTrunkFar' : 'hcTrunkBack',
            ups: ['hcTrunkU2', 'hcTrunkU3'],
            lit: hashed(k * 9.1 + 0.4) < 0.45 ? 0.5 : 0,
            furrows: width > 6 ? 2 : 0,
            bark: ['hcFurrowFar', 'hcRidgeFar', 'hcRidgeFar'],
            branches: width > 4.5 && hashed(k * 2.2 + 0.9) < 0.3 ? 1 : 0,
            reach: 0.3,
            wood: true,
          })
        }
        // and nearer ones, fewer, wider and warmer, kept off the nearer trees, each under a crown of its own in the wood
        const mid = Math.max(2, Math.round(5 * (w / 1232) ** 0.8))
        for (let k = 0; k < mid; k += 1) {
          const x = ((k + 0.5 + 0.8 * (hashed(k * 7.1 + 0.6) - 0.5)) / mid) * w
          if (
            Math.abs(x - treeX) < treeHalf * 3.2 ||
            HC_NEARISH.some((t) => Math.abs(x - t.x * w) < t.wide * rs * 1.6)
          ) {
            continue
          }
          const width = (7 + 9 * hashed(k * 4.3 + 0.8)) * rs
          // (one under the words ends well under the buttons, so that it does not point at them)
          // (and its crown down in the wood, so that it is part of the wood rather than a ball up on the page beside the
          // words)
          const tip = Math.max(
            tipAt(x, top + (0.08 - 0.3 * hashed(k * 6.7 + 0.2)) * pic, at(0.06 + 0.14 * hashed(k * 6.7))),
            overWords(x) > 0.3 ? at(0.14) : at(0.08 + 0.1 * hashed(k * 3.9 + 0.1)),
          )
          const made = tree(200 + k, x, at(0.64 + 0.03 * hashed(k * 1.9)), tip, width, {
            order: 565,
            load: 0.75,
            blur: Math.max(1, width * 0.12),
            lean: (hashed(k * 3.1 + 0.5) - 0.5) * 0.06,
            taper: 0.36,
            flare: 0.45,
            fadeFrom: Math.max(tip + 30, at(0.36)),
            body: 'hcTrunkMid',
            shade: 'hcTrunk',
            ups: ['hcTrunkU1', 'hcTrunkU2', 'hcTrunkU3'],
            lit: 0.45,
            furrows: Math.max(2, Math.round(width / 4)),
            knots: hashed(k * 5.5) < 0.5 ? 1 : 0,
            branches: hashed(k * 8.3) < 0.7 ? 1 : 0,
            reach: 0.22,
          })
          /* its crown, in full colour, over its top: violet, cobalt, pink or lilac, each with tips of another; under the
             words a little back in the light and coming in with the wood */
          if (made) {
            const under = overWords(x) > 0.3
            const mr = (34 + 22 * hashed(k * 9.7 + 0.3)) * rs * (under ? 0.8 : 1)
            const pick = [
              ['violet', 'pink'],
              ['blue', 'lilac'],
              ['pink', 'lilac'],
              ['lilac', 'pink'],
              ['blue', 'violet'],
            ][k % 5]
            crown({
              x: made.x,
              y: made.y + mr * 0.2,
              rx: mr * 1.5,
              ry: mr * 0.85,
              tone: pick[0],
              tips: pick[1],
              seed: 400 + k * 3,
              order: 565 + (200 + k) * 0.01 + 0.005,
              fog: under ? 2 : 1,
              wood: under,
              leaf: 1.3,
              glow: pick[0] === 'pink' ? 'hcGlowPink' : 'hcGlowCool',
            })
          }
        }

        /* The strip of grass in the clearing, glowing: a soft light along it that rolls a little up and down and runs a
           little uphill to the right, pooling in two places, in the open at the left and round the near tree's foot, and
           dim between them; a brighter core in it, lime and gold, and over that the blades, pale and warm in the light,
           mint and then turquoise at the front, where it goes into the flowers. */
        const stripMid = (x) => at(0.665 + 0.035 * (fbm(x / (230 * sc), 4.2) - 0.5) - 0.035 * (x / w - 0.5))
        const pool = (x, at0, wide) => Math.exp(-(((x - at0) / wide) ** 2))
        const stripLight = (x) =>
          (0.18 + 0.95 * Math.max(pool(x, 0.3 * w, 0.17 * w), pool(x, treeX - 0.02 * w, 0.12 * w))) *
          (0.8 + 0.4 * fbm(x / (320 * sc) + 2.1, 7.7))
        for (let k = 0; k < 26; k += 1) {
          const x = ((k + 0.5) / 26) * w
          const lit = stripLight(x)
          put((n += 1), {
            x,
            y: stripMid(x) + 0.01 * pic,
            long: 0.05 * w,
            wide: 0.3,
            blur: 0.026 * w,
            paints: ['hcGlow', 'hcGlow'],
            load: 0.36 * lit,
            order: 575,
          })
          put((n += 1), {
            x: x + 0.02 * w,
            y: stripMid(x + 0.02 * w),
            long: 0.045 * w,
            wide: 0.12,
            blur: 0.014 * w,
            paints: ['hcMeadowWarm', 'hcGrassLit'],
            load: 0.5 * lit,
            order: 575.1,
          })
        }

        /* The great crowns beside the words, where there is room for them, and lower in the wood where there is not: on
           the left a great one of orange and gold, its gold on its upper left where the light comes from, with a violet
           one behind it at the edge, each on one of the two nearer trees; on the right a cobalt one behind the near tree.
           Each rises to about the heading, thinning out raggedly before it comes near the words. On a phone, where the
           words take all of the width, they are smaller and down in the wood under the buttons. */
        const wl = words.x - words.a
        const wr = words.x + words.a
        const sideR = (1 - 0.45 * narrow) * rs
        const sideY = (f) => top + (f + (0.34 - f) * narrow) * pic
        const great = {
          x: Math.max(0.05 * w, Math.min(0.17 * w, wl - 50 - 118 * sideR)),
          y: sideY(0),
          rx: Math.min(160 * sideR, Math.max(70 * sideR, 0.75 * (wl - 40))),
          ry: Math.max(70, 0.42 * pic) * (1 - 0.4 * narrow),
        }
        const back = {
          x: Math.max(0.01 * w, great.x - 125 * sideR),
          y: sideY(-0.06),
          rx: 105 * sideR,
          ry: Math.max(60, 0.38 * pic) * (1 - 0.4 * narrow),
        }
        const cob = {
          x: Math.min(0.99 * w, Math.max(0.93 * w, wr + 50 + 105 * sideR)),
          y: sideY(0.01),
          rx: 140 * sideR,
          ry: Math.max(64, 0.4 * pic) * (1 - 0.4 * narrow),
        }
        crown({ ...back, tone: 'violet', tips: 'pink', seed: 11, order: 573.9, glow: 'hcGlowCool' })
        crown({ ...cob, tone: 'blue', tips: 'violet', seed: 31, order: 573.95, glow: 'hcGlowCool' })

        // The two nearer trees at the left, behind the strip's light, going up into those crowns.
        ;[back, great].forEach((c, i) => {
          const t = HC_NEARISH[i]
          // (each under its own crown, wherever the room beside the words puts that)
          const x = c.x + (i ? 0.28 : -0.12) * c.rx + (t.x - HC_NEARISH[i].x) * w
          const halfW = (t.wide * rs * (1 - 0.3 * narrow)) / 2
          const tip = c.y + 0.15 * c.ry
          tree(i + 1, x, at(t.foot), tip, halfW * 2, {
            order: 574,
            blur: 1.1,
            dark: t.dark,
            lean: t.lean,
            taper: 0.34,
            flare: 0.55,
            fadeFrom: tip + 30,
            body: 'hcTrunk',
            shade: 'hcTrunkDeep',
            ups: ['hcTrunkU1', 'hcTrunkU2', 'hcTrunkU3'],
            lit: 0.85,
            furrows: Math.round(halfW / 2),
            knots: 1,
            branches: 1,
            reach: 0.2,
            roots: 4,
          })
        })
        crown({ ...great, tone: 'orange', seed: 7, order: 574.5, glow: 'hcGlowWarm' })

        /* The near tree at the right, in front of the strip's light and of the cobalt crown: its trunk warm, lit along its
           left side in gold, with its bark's furrows and a fine pink streak down its right; it holds out a branch to
           either side, each with a bough of blossom; from a little way down the picture up to its top beside the heading,
           it fades out, its light first. */
        const nearTip = tipAt(treeX, words.y - 0.6 * words.b, at(0.12))
        const boughs = HC_TREE.boughs.map(([bx, by, brx, bry, tn, tips]) => [
          bx * w,
          at(by),
          brx * rs,
          bry * rs,
          tn,
          tips,
        ])
        const nearTree = tree(0, treeX, at(HC_TREE.foot), nearTip, treeHalf * 2, {
          order: 576.6,
          lean: HC_TREE.lean,
          taper: 0.3,
          flare: 0.55,
          fadeFrom: Math.max(nearTip + 20, Math.min(at(HC_TREE.foot) - 40, at(0.34 + 0.08 * narrow))),
          body: 'hcTrunk',
          shade: 'hcTrunkDeep',
          ups: ['hcTrunkU1', 'hcTrunkU2', 'hcTrunkU3'],
          lit: 0.85,
          shine: 0.4,
          furrows: Math.round(treeHalf / 2.4),
          knots: 2,
          branches: 1,
          reach: 0.16,
          twigs: 1,
          fork: 0.5,
          limbs: boughs.map(([bx, by]) => [bx + (bx < treeX ? 0.25 : -0.25) * (bx - treeX), by + 4]),
          roots: 6,
        })
        /* its boughs of blossom, sprays along the outer parts of the branches it holds out rather than balls at their
           tips: the orange one rising from its branch, and the pink one under the cobalt crown hanging from it */
        boughs.forEach(([cx, cy, brx, bry, tn, tips], c) => {
          const line = nearTree?.curves?.[c]
          crown({
            x: cx,
            y: cy,
            rx: brx,
            ry: bry,
            tone: tn,
            tips,
            seed: 51 + c * 13,
            order: 576.65 + c * 0.01,
            glow: tn === 'orange' ? 'hcGlowWarm' : 'hcGlowPink',
            line,
            droop: c === 1,
          })
        })

        /* (the grass and the flowers number their strokes from here, so that how many strokes the wood and its trees take
           never changes how the blades and petals are painted) */
        n = 500000
        // the blades over the strip's light, the back rows short and pale in it, the front ones taller and cooler
        const bladeStep = 2.3 / Math.max(0.8, sc)
        const bladeRows = 5
        for (let x = 0; x < w; x += bladeStep) {
          for (let r = 0; r < bladeRows; r += 1) {
            const q = Math.round(x * 13.1) + r * 104729
            const bx = x + (hashed(q * 0.013 + 0.3) - 0.5) * bladeStep * 2
            const depth = (r + hashed(q * 0.019)) / bladeRows
            const y = stripMid(bx) + (depth - 0.4) * 0.17 * pic
            const tall = (6 + 12 * hashed(q * 0.023 + 0.2)) * rs * (0.6 + 0.8 * depth)
            const lit = clamp(stripLight(bx) * (1.2 - Math.abs(depth - 0.35) * 2), 0, 1)
            const paints =
              lit > 0.55
                ? ['hcGrassLit', 'hcMeadowWarm']
                : lit > 0.25
                  ? ['hcGrassLit', 'hcGrass']
                  : depth > 0.75
                    ? ['hcGrassCool', 'hcGrassDeep']
                    : ['hcGrass', 'hcGrassCool']
            grow((n += 1), {
              x: bx,
              y,
              tall,
              wide: clamp((0.5 * rs) / (tall / 2), 0.02, 0.2),
              blur: 0.4,
              paints,
              load: 0.5 + 0.35 * hashed(q * 0.031),
              lean: (hashed(q * 0.037) - 0.5) * 0.5,
              order: 576 + depth,
            })
          }
        }

        // The flowers at the foot: a bed of cobalt and violet, flowers of every colour of the crowns on it, pink, orange,
        // violet, cobalt and lilac, and a few white and yellow ones, the nearer the larger.
        for (let k = 0; k < 14; k += 1) {
          const x = ((k + 0.5) / 14) * w
          put((n += 1), {
            x,
            y: at(0.86 + 0.03 * Math.sin(k * 2.1)),
            long: 0.08 * w,
            wide: 0.3,
            blur: 0.035 * w,
            paints: ['hcBed', 'hcBedDeep'],
            load: 0.5,
            order: 577,
          })
        }
        const flowerStep = 5.5 / Math.max(0.9, sc)
        for (let gy = at(0.7); gy < h; gy += flowerStep * 0.8) {
          for (let gx = -flowerStep; gx < w + flowerStep; gx += flowerStep) {
            const q = Math.round(gx / flowerStep) * 7919 + Math.round(gy / flowerStep) * 104729
            const x = gx + (hashed(q * 0.013 + 0.1) - 0.5) * flowerStep
            const y = gy + (hashed(q * 0.017 + 0.6) - 0.5) * flowerStep
            const near = clamp((y - at(0.7)) / (0.3 * pic), 0, 1)
            /* fewer at the back, where they go into the grass, and gathered in drifts with the bed showing between them,
               each drift mostly of one colour going into the next (cobalt, violet, lilac, pink, orange), with a few white
               and yellow ones through them all, rather than every colour scattered everywhere as confetti */
            const dense = fbm(x / (90 * sc) + 8.1, y / (45 * sc) + 4.4)
            if (hashed(q * 0.029) > (0.2 + 0.62 * near) * (0.35 + 1.3 * smooth(0.3, 0.7, dense))) {
              continue
            }
            const hue = clamp(
              smooth(0.28, 0.72, fbm(x / (150 * sc) + 3.3, y / (60 * sc) + 1.7)) +
                (hashed(q * 0.041 + 0.5) - 0.5) * 0.32,
              0,
              0.999,
            )
            const sparkle = hashed(q * 0.083 + 0.2)
            const paints =
              sparkle < 0.05
                ? ['hcStar', 'hcFl_lilac']
                : sparkle < 0.09
                  ? ['hcButter', 'hcFl_orange']
                  : [
                      ['hcFl_blue', 'hcFl_blueDeep'],
                      ['hcFl_violet', 'hcFl_violetDeep'],
                      ['hcFl_lilac', 'hcFl_lilacDeep'],
                      ['hcFl_pink', 'hcFl_pinkDeep'],
                      ['hcFl_orange', 'hcFl_orangeDeep'],
                    ][Math.floor(hue * 5)]
            const reach = (1.4 + 2.1 * near + 0.9 * hashed(q * 0.053)) * Math.max(0.95, rs)
            rand.reseed(67001 + q)
            garden.bloom({
              x,
              y,
              stem: reach * 0.6,
              reach,
              petals: 8 + Math.floor(hashed(q * 0.061) * 4),
              blur: 0.4 + near * 0.5,
              paints,
              stiff: 0.6,
              order: 578 + near,
            })
            // a stem and a leaf under it, in the meadow's deep colour
            if (hashed(q * 0.071) < 0.5) {
              grow((n += 1), {
                x: x + 0.5,
                y: y + reach * 2,
                tall: reach * 2.4,
                wide: 0.08,
                paints: ['hcGrassDeep', 'hcGrassCool'],
                load: 0.7,
                order: 577.5 + near,
              })
            }
          }
        }

        /* The butterflies. Each painted round the canvas's middle (the shader carries it where it is, see schoolVertex),
           seen from behind with its wings raised in a V: on either side a forewing, from the body up and out to a broad
           rounded tip, and under it a smaller hindwing, out and a little down, and a slender body between. The strokes
           of a wing are laid from its tip in to the body, so that each is broad at the tip and narrower at the root. */
        const hx = half
        const hy = h / 2
        const flyScale = Math.max(0.62, sc)
        HC_BUTTERFLIES.forEach((b, i) => {
          const len = b.size * flyScale
          const phase = 400 + i
          const base = 2000 + i * 0.1
          const id = 90000 + i * 20
          const tint = ['hcWingPink', 'hcWingGold', 'hcWingLilac'][i % 3]
          // a stroke from a tip in to a root, in the butterfly's own terms, on the side given (-1 left, 1 right)
          const wing = (k, side, tip, root, wide, part, load = 0.96) => {
            const ax = side * tip[0]
            const bx = side * root[0]
            put(id + k, {
              x: hx + ((ax + bx) / 2) * len,
              y: hy + ((tip[1] + root[1]) / 2) * len,
              long: (Math.hypot(bx - ax, root[1] - tip[1]) / 2) * len,
              wide,
              turn: Math.atan2(root[1] - tip[1], bx - ax),
              blur: len * 0.035,
              paints: ['hcWing', tint],
              load,
              kind: 0.25,
              order: base + 0.001 * k,
              phase: phase + part,
            })
          }
          // each a little its own shape: how high its forewings are raised and how long they are, and its hindwings
          const raise = 0.6 + 0.35 * hashed(i * 1.7 + 0.2)
          const reach = 0.46 + 0.08 * hashed(i * 3.3 + 0.5)
          const fore = [Math.cos(raise) * reach, -Math.sin(raise) * reach]
          const hind = [0.25 + 0.05 * hashed(i * 5.9), 0.12 + 0.07 * hashed(i * 7.3)]
          for (const [side, part, k] of [
            [-1, 0.2, 0],
            [1, 0.4, 4],
          ]) {
            wing(k + 1, side, fore, [0.03, -0.03], 0.52 + 0.1 * hashed(i * 2.9), part)
            wing(k + 2, side, hind, [0.03, 0.0], 0.6 + 0.1 * hashed(i * 4.1), part, 0.62 + 0.15 * hashed(i * 6.7))
            // the forewing's rounded tip
            put(id + k + 3, {
              x: hx + side * (fore[0] - 0.06) * len,
              y: hy + (fore[1] + 0.05) * len,
              long: 0.1 * len,
              wide: 0.85,
              turn: side * 0.6,
              blur: len * 0.035,
              paints: ['hcWing', 'hcWing'],
              load: 0.96,
              kind: 0.25,
              order: base + 0.001 * (k + 3),
              phase: phase + part,
            })
          }
          // the light round it, in three soft layers, the nearest the brightest
          put(id + 10, {
            x: hx,
            y: hy - 0.06 * len,
            long: len * 0.42,
            wide: 0.8,
            blur: len * 0.22,
            paints: ['hcHaloCore', 'hcHalo'],
            load: 0.42,
            order: base - 0.001,
            phase,
          })
          put(id + 11, {
            x: hx,
            y: hy - 0.05 * len,
            long: len * 0.8,
            wide: 0.8,
            blur: len * 0.45,
            paints: ['hcHalo', 'hcHalo'],
            load: 0.22,
            order: base - 0.002,
            phase,
          })
          put(id + 12, {
            x: hx,
            y: hy - 0.04 * len,
            long: len * 1.25,
            wide: 0.82,
            blur: len * 0.7,
            paints: ['hcHalo', 'hcHaloFar'],
            load: 0.11,
            order: base - 0.003,
            phase,
          })
          put(id + 9, {
            x: hx,
            y: hy + 0.01 * len,
            long: 0.075 * len,
            wide: 0.32,
            turn: Math.PI / 2,
            blur: len * 0.015,
            paints: ['hcWing', 'hcWing'],
            load: 0.96,
            kind: 0.25,
            order: base + 0.009,
            phase,
          })
        })
      },
    }

    /* --- the logistics page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/logistics, after Cameron's two pictures of moon jellyfish: deep blue water under the calls to
       action, in the land's own fine lines, coming in from nothing just under the buttons as the overview's forest's mist
       does, luminous aqua-blue by day and deep night water in the dark; and moon jellies drifting slowly up and across it,
       a few large near ones and many small far ones, each a translucent bell glowing at its rim, four pink rings inside,
       fine tentacles and frilled arms trailing under it, pulsing slowly as it goes (a school, see `school`); soft pink orbs
       of light, little sparkles and a few soft shafts of light in the water. Nothing stands beside the words: a jelly held
       still there would only sway, never pulse or drift as the school does, so the water alone is the picture. */
    const LG_EVEN = 0.005
    // marked as mist (thins into the grain upward across the band garden.mist gives), as mist and even, and a nought
    const LG_MIST = 0.0025
    const LG_HAZE = 0.4 + LG_EVEN
    const LG_HAZE_MIST = 0.4 + LG_EVEN + LG_MIST
    const LG_LINE = 0.25 + LG_MIST
    const LG_RING = 2 + LG_MIST
    const LG_TWINKLE = 3.25 + LG_EVEN + LG_MIST
    const LG_GLIMMER = 3.4 + LG_EVEN + LG_MIST
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const lgHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    // The water's inks, light and dark: a pale aqua where it comes in under the buttons, deepening to azure and a
    // cornflower blue at the foot by day; deep night blue in the dark.
    const LG_INKS = {
      ...LAND_INK,
      lgTop: ['#c9e9f8', '#0c1734'],
      lgHigh: ['#93cff1', '#0b1b4a'],
      lgMid: ['#5eaae9', '#0c215a'],
      lgLow: ['#478bdf', '#0e2766'],
      lgFoot: ['#4276d6', '#102b6e'],
    }
    /* The wash over the water's lines in ten even steps down it, mixed from those inks as the sheet's paint lays them (see
       the sheet's `paint`), so that one row of the wash is never a shade apart from the next and none lies as a stripe. */
    const LG_STOPS = [
      [0, 'lgTop'],
      [0.14, 'lgTop'],
      [0.3, 'lgHigh'],
      [0.52, 'lgMid'],
      [0.76, 'lgLow'],
      [1, 'lgFoot'],
    ]
    const lgMix = (a, b, t) => {
      const ch = (hex, i) => Number.parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)
      return `#${[0, 1, 2]
        .map((i) =>
          Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`
    }
    const LG_WASH = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => {
        const p = i / 9
        const j = Math.max(
          1,
          LG_STOPS.findIndex(([at]) => at >= p),
        )
        const [p0, a] = LG_STOPS[j - 1]
        const [p1, b] = LG_STOPS[j]
        const t = (p - p0) / Math.max(1e-6, p1 - p0)
        return [`lgWash${i}`, [0, 1].map((m) => lgMix(LG_INKS[a][m], LG_INKS[b][m], t))]
      }),
    )
    // how large the water's strokes are drawn on a canvas this wide
    const LG_SCALE = (w) => Math.min(1.15, Math.max(0.5, w / 1232))
    // and the jellies, a little larger on a phone than that alone would make them
    const LG_JELLY_SCALE = (w) => Math.max(0.62, LG_SCALE(w))
    /* Where the water's lines come in from the page, down the canvas, as the overview's forest's do: from nothing just
       under the buttons' foot to their full more than halfway down the picture, eased in, so that there is no ruled edge,
       no lone hairline and no striped band. */
    const lgFadeAt = (stage) => {
      const foot = stage.words.y + stage.words.b
      lgNarrow = Math.min(1, Math.max(0, (700 - stage.w) / 220))
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    /* How much the canvas the water was last laid out on is a phone's (set as its fade is worked out, above), as the
       fintech sky does: there its lines come in more slowly at first, so that its first ones are as faint as on a wider
       canvas and none of them stands alone above the rest as a hairline. */
    let lgNarrow = 0
    /* How far the water's body (its wash, over its lines) has come in at a height: from nothing under the buttons too,
       but sooner than the lines, so that the first of them, pale and few, come in inside it and none stands alone over
       the page as a hairline. */
    const lgBodyOf = (stage, y) => {
      const foot = stage.words.y + stage.words.b
      const t = Math.min(1, Math.max(0, (y - foot - 2) / Math.max(1, (stage.h - foot) * 0.4)))
      return t * t * (3 - 2 * t)
    }
    /* The jellies, at three depths, far ones first so that the near ones are painted over them: many small far ones high
       in the band, slow; a few middling ones; and a few large near ones low in it, faster. Each in a lane of its own,
       spaced round the round as the golden ratio spaces them; each pulsing slowly (its bell's two halves swing about its
       top, see schoolVertex, so that its margin draws down and in and opens again), now and then coasting, rising and
       falling a little, its top leaning towards the way it drifts. For each depth: how many, its share of the band, the
       size of its bells (CSS pixels across at a canvas 1232 wide), their pace, how far each pulse swings a half and how
       far they are seen from above (radians: 0 from the side, a half pi from overhead). */
    const LG_DEPTHS = [
      { count: 22, lanes: [0, 0.55], size: [20, 34], speed: [4.5, 6.5], flap: 0.09, el: [0.35, 0.8] },
      { count: 10, lanes: [0.2, 0.75], size: [54, 76], speed: [7.5, 9.5], flap: 0.12, el: [0.25, 0.62] },
      { count: 6, lanes: [0.25, 0.9], size: [114, 148], speed: [12, 13.5], flap: 0.15, el: [0.28, 0.5] },
      // and two nearer still, larger, low in the band, only on a canvas wider than a phone's
      { count: 2, lanes: [0.9, 1.04], size: [168, 188], speed: [15, 17], flap: 0.14, el: [0.24, 0.4], from: 700 },
    ]
    /* Lanes and places in the round are spread over all the jellies at once, not depth by depth, so that a far, a middling
       and a near one never start out one over another in a column, as a tiered cake, and no two near ones share a lane. */
    const LG_JELLIES = LG_DEPTHS.flatMap((d, g) =>
      Array.from({ length: d.count }, (_, j) => {
        const i = LG_DEPTHS.slice(0, g).reduce((a, b) => a + b.count, 0) + j
        const h = (k) => lgHash(i * 12.7 + k * 3.3 + 0.9)
        const u = Math.min(1, Math.max(0, ((i * 0.5698 + 0.13) % 1) + (h(3) - 0.5) * 0.06))
        const beat = 0.3 + 0.18 * h(7) + 0.12 * (2 - g) * 0.5
        const size = d.size[0] + (d.size[1] - d.size[0]) * h(1)
        return {
          size,
          speed: d.speed[0] + (d.speed[1] - d.speed[0]) * h(2),
          lane: d.lanes[0] + u * (d.lanes[1] - d.lanes[0]),
          phase: (i * 0.618034 + 0.04 * h(4)) % 1,
          drift: 3 + 5 * h(5),
          period: 7 + 5 * h(6),
          /* a push ahead with each pulse, as its bell closes: (its sign puts the push with the closing, since the surge's
             sway and the beat's start a little apart in each jelly's seed; see schoolNow) */
          surge: -0.035 * size * (0.8 + 0.4 * h(11)),
          surgePeriod: 1 / beat,
          beat,
          wag: 0,
          flap: d.flap * (0.85 + 0.3 * h(8)),
          // it pulses all the time, as a moon jelly does, never coasting with its bell held still
          glide: 0,
          seed: h(10),
          depth: Math.max(0, 2 - g),
          // its top leaning towards the right, the way it drifts, a few a little to the left
          tilt: h(13) < 0.2 ? -0.18 * h(14) : 0.04 + 0.42 * h(14) ** 1.4,
          el: d.el[0] + (d.el[1] - d.el[0]) * h(12),
          from: d.from || (g < 2 && j % 3 === 2 ? 600 : 0),
        }
      }),
    )
    const UC_LOGISTICS = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      // a few beads, the sky's small, shallow oval of page round the words, and every line carried to the canvas's edges
      lines: { ...SKY.lines, lift: 0.04, veil: [80, 18], beadChance: 0.05 },
      inks: LG_INKS,
      /* The water's lines come in from nothing under the buttons, pale and few, so that where they start is no edge:
         slowly, over more than half the picture, as the overview's forest's mist does. */
      fade: {
        at: lgFadeAt,
        get ease() {
          return 1.15 + 0.3 * lgNarrow
        },
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      /* the strokes keep their own paint where the water's lines have not yet come in, so that the water's body, which
         comes in a little sooner than its lines (see lgBodyOf), is what brings each of them in */
      onPage: true,
      land: {
        ...SKY.land,
        sheets: [
          // the water, from just under the buttons' foot down (the sky's 'air'), in the land's fine lines, fading in
          {
            ...SKY.land.sheets[0],
            paint: [
              [0, 'lgTop', 0.4],
              [0.14, 'lgTop', 1],
              [0.3, 'lgHigh', 1],
              [0.52, 'lgMid', 1],
              [0.76, 'lgLow', 1],
              [1, 'lgFoot', 1],
            ],
            fade: true,
            fill: 0.92,
            under: 0.95,
            patch: 0,
            flow: 0.3,
            // the lines' pale beads are the paper's stipple by day; at night the water's specks are painted instead
            beads: [1, 0],
          },
          {
            ...SKY.land.sheets[1],
            paint: [
              [0, 'lgFoot', 0],
              [1, 'lgFoot', 0],
            ],
          },
        ],
      },
      flock: [],
      /* The jellies come in and go out through glass at the sides, as every hero's creatures do: the overview forest's even
         glass, as strong as for its egrets and as wide as the butterflies' band, so that a bell coming in is plainly bent
         and drawn out across, level, and softened towards the edge into frosted light rather than a white streak or a
         second bell. Its colours stay together: a split takes a jelly's fine rims, rings and tentacles apart into threads
         of red, green and blue, each drawn three times. */
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 2.6,
        halo: [2.6, 0.2],
      },
      school: {
        fish: LG_JELLIES,
        size: LG_JELLY_SCALE,
        // a jelly rocks only a little as it rises and falls, never tipping over as a fish turns
        turn: 0.05,
        // its tentacles trail a bell's width and more behind it, and its light reaches a little past them
        reach: [1.05, 0.7],
        glow: [1.25, 0.95],
        /* From a little under the buttons, so that none drifts close under them, down to well into the deep water, rising
           across the canvas to the right as they drift up. */
        band: ({ w, h, words }) => {
          const under = words.y + words.b
          const pic = h - under
          const rise = pic * 0.3 * Math.min(1, w / 1232)
          const top = under + 24 * LG_JELLY_SCALE(w) + rise / 2
          const foot = Math.max(top + 70, under + pic * 0.62)
          return [top, foot, -rise]
        },
        // they drift aside from the pointer only a little, and slowly back
        scatter: { radius: 110, push: 120, back: 0.6 },
      },
      paints: {
        ...PAINTS,
        // the wash over the water's lines, in its own inks at each height (see LG_INKS)
        ...LG_WASH,
        // the light in the water from above, and its deep
        lgLight: ['#d2f0fc', '#1a3c82'],
        lgLightAqua: ['#a6e2f6', '#16407e'],
        lgDeep: ['#3462c6', '#07123c'],
        // and the shafts of it slanting down
        lgShaft: ['#e6f7ff', '#4370c2'],
        // a near jelly: its rim, the glow along it, its translucent bell, the light round it, its tentacles and arms
        lgRim: ['#f8fdff', '#e4f5ff'],
        lgRimGlow: ['#dcf3ff', '#7cc6ff'],
        lgFill: ['#e6f6ff', '#3c86e0'],
        lgFillDeep: ['#cfeafc', '#2a62bc'],
        lgHalo: ['#e2f6ff', '#4d9cf2'],
        lgHaloFar: ['#bde6fb', '#2f6cd4'],
        lgTent: ['#eef9ff', '#aad6ff'],
        lgArm: ['#f6eaf8', '#b9a8ee'],
        lgArmPink: ['#f8cde6', '#d48ed0'],
        // a middling one, a little bluer
        lgRimMid: ['#eef8ff', '#c8e6ff'],
        lgFillMid: ['#d9f0fd', '#2e6ccc'],
        // a far one, inked in blue by day so that it shows on the pale water up there, glowing at night
        lgRimFar: ['#4d92de', '#92c8f8'],
        lgFillFar: ['#e2f3fd', '#244f9e'],
        lgTentFar: ['#6aa8e6', '#709fe2'],
        // the four rings, and their glow
        lgRing: ['#ffd4ec', '#ffb0dc'],
        lgRingGlow: ['#ffe2f2', '#cf72c0'],
        lgRingFar: ['#f2a6d2', '#e27cc0'],
        // the orbs: pink and lilac, with a pale heart and a brighter rim
        lgOrb: ['#f6b6da', '#d983c4'],
        lgOrbLilac: ['#dcbaf2', '#a98ae4'],
        lgOrbCore: ['#fff2f9', '#ffdcf0'],
        lgOrbRim: ['#ffcce8', '#f2a6d8'],
        // sparkles, and the specks drifting in the water
        lgSpark: ['#ffffff', '#ffffff'],
        lgSparkGlow: ['#eef8ff', '#c4e2ff'],
        lgSnow: ['#f4fbff', '#b4d6ff'],
      },
      plant: (garden) => {
        const { w, h, rand, words } = garden
        const half = w / 2
        const sc = LG_SCALE(w)
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = (n, { x, y, ...o }) => {
          rand.reseed(71001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: LG_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // The picture is laid out from the buttons' foot down, where the water's sheet starts.
        const top = words.y + words.b + 3
        const pic = h - top
        const at = (f) => top + f * pic
        const inBody = (y) => lgBodyOf({ w, h, words }, y)
        /* The water's ink at a height, as its sheet paints its lines there (see the sheet's paint and LG_WASH): its sheet
           runs from the buttons' foot to about 0.95 of the way to the canvas's foot. A little of the next step is dithered
           in so that no row of the wash lies on one. */
        const waterInk = (y, q) => {
          const p = (y - top) / (0.95 * pic) + (hashed(q) - 0.5) * 0.06
          return `lgWash${clamp(Math.round(p * 9), 0, 9)}`
        }
        // how much room there is beside the words for anything to rise there: none on a phone
        const roomy = smooth(60, 300, w / 2 - words.a)
        // strokes marked as mist thin away upward across this band: beside the words, or on a phone just under the buttons
        const mistBeside = [words.y - 0.3 * words.b, top - 8]
        const mistUnder = [top - 10, top + 0.16 * pic]
        const mist = [
          mistUnder[0] + (mistBeside[0] - mistUnder[0]) * roomy,
          mistUnder[1] + (mistBeside[1] - mistUnder[1]) * roomy,
        ]
        garden.mist(mist[0], mist[1])
        let n = 0

        /* The water's body: a soft wash over its lines from where it comes in under the buttons down to the foot, in the
           water's own colour at each height and as much as its body has come in there, so that its lines show through it
           only as a grain and never as stripes. Flat strokes near the top, so that none reaches up past the buttons' foot;
           none in the small oval of page the engine keeps round the words. */
        // (round soft dabs on a shaken grid, overlapping well, so that the wash lies even and never in rows or streaks)
        const cell = clamp(0.032 * w, 24, 42)
        const rows = Math.ceil((h - top) / (0.6 * cell)) + 1
        const cols = Math.ceil(w / cell) + 3
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            const q = r * 131.7 + c * 17.3 + 0.5
            const x = (c - 1 + (r % 2) * 0.5 + (hashed(q) - 0.5) * 0.6) * cell
            const wy = top + 6 + (r + (hashed(q * 1.7 + 0.3) - 0.5) * 0.6) * 0.6 * cell
            const veil = Math.hypot((x - words.x) / (words.a + 80), (wy - words.y) / (words.b + 18))
            const ink = waterInk(wy, q * 2.3)
            put((n += 1), {
              x,
              y: wy,
              long: cell * 1.4,
              wide: 0.6 + 0.12 * hashed(q * 3.1),
              blur: cell * 0.9,
              paints: [ink, ink],
              load: 0.4 * inBody(wy) * smooth(0.95, 1.15, veil),
              order: 559,
            })
          }
        }
        // The light in the water from above, soft and broad high in it, and the deep at the foot's corners.
        // (pools of it, as large on a phone as the picture is tall, scattered up and down so that they never lie in a band)
        const poolLong = Math.max(0.09 * w, 0.28 * pic)
        const pools = Math.max(4, Math.round((1.15 * w) / poolLong))
        for (let k = 0; k < pools; k += 1) {
          const x = ((k + 0.2 + 0.6 * hashed(k * 1.7 + 0.3)) / pools) * w
          const y = at(0.24 + 0.3 * hashed(k * 4.3 + 0.8))
          const near = Math.exp(-(((x - words.x) / (0.45 * w)) ** 2))
          put((n += 1), {
            x,
            y,
            long: poolLong,
            wide: 0.55 + 0.2 * hashed(k * 2.1),
            blur: 0.6 * poolLong,
            paints: k % 2 ? ['lgLight', 'lgLight'] : ['lgLightAqua', 'lgLightAqua'],
            load: (0.22 + 0.18 * near) * inBody(y - 0.3 * poolLong) ** 1.5,
            order: 560,
          })
        }
        /* And a few broad soft shafts of that light slanting down through the water from above, each its own width and
           slant, well apart, coming in with the water's body and lifting away as they go down. */
        // (unevenly spaced, so that they never read as a row of stripes)
        const shafts = Math.max(3, Math.round((4.5 * w) / 1232))
        for (let k = 0; k < shafts; k += 1) {
          const long = (0.22 + 0.14 * hashed(k * 2.7 + 0.4)) * pic
          const slant = 0.22 + 0.22 * hashed(k * 6.1 + 0.2)
          const x = ((k + 0.05 + 0.9 * hashed(k * 5.9 + 0.1)) / shafts) * w
          const y = at(0.18) + 0.8 * long * Math.cos(slant)
          put((n += 1), {
            x,
            y,
            long,
            wide: 0.14 + 0.14 * hashed(k * 8.3 + 0.6),
            turn: -Math.PI / 2 - slant,
            blur: 0.16 * long,
            paints: ['lgShaft', 'lgShaft'],
            load: (0.16 + 0.14 * hashed(k * 4.4 + 0.9)) * inBody(y - 0.6 * long),
            order: 560.2,
          })
        }
        for (let k = 0; k < 10; k += 1) {
          const x = ((k + 0.5) / 10) * w
          const side = Math.abs(x - half) / half
          const y = at(0.86 + 0.08 * hashed(k * 2.9))
          put((n += 1), {
            x,
            y,
            long: 0.1 * w,
            wide: 0.4,
            blur: 0.06 * w,
            paints: ['lgDeep', 'lgDeep'],
            load: 0.1 + 0.14 * side * side,
            order: 560.5,
          })
        }

        /* The orbs: soft discs of pink or lilac light out of focus, each with a paler heart and a brighter rim, scattered
           through the water, more in its upper part. */
        const orb = (k, x, y, r, lilac, load = 1) => {
          const paint = lilac ? 'lgOrbLilac' : 'lgOrb'
          put((n += 1), {
            x,
            y,
            long: r,
            wide: 1,
            blur: r * 0.42,
            paints: [paint, paint],
            load: 0.26 * load,
            kind: LG_HAZE_MIST,
            order: 562 + k * 1e-4,
          })
          put((n += 1), {
            x,
            y: y - r * 0.12,
            long: r * 0.3,
            wide: 1,
            blur: r * 0.42,
            paints: ['lgOrbCore', 'lgOrbCore'],
            load: 0.5 * load,
            kind: LG_HAZE_MIST,
            order: 562 + k * 1e-4 + 2e-5,
          })
          if (r > 12) {
            put((n += 1), {
              x,
              y,
              long: r * 0.9,
              wide: 1,
              blur: r * 0.16,
              paints: ['lgOrbRim', 'lgOrbRim'],
              load: 0.14 * load,
              kind: LG_RING,
              order: 562 + k * 1e-4 + 4e-5,
            })
          }
          // and on a large one, a star of light glinting at its top
          // (its two rays sharing a seed, so that they twinkle together and never show as one lone streak)
          if (r > 20 && hashed(k * 3.3 + 0.7) < 0.6) {
            const star = (n += 1)
            for (const turn of [0.2, 0.2 + Math.PI / 2]) {
              put(star, {
                x: x + r * 0.1,
                y: y - r * 0.32,
                long: r * 0.3,
                wide: 0.05,
                turn,
                blur: 0.5,
                paints: ['lgSpark', 'lgSpark'],
                load: 0.6 * load,
                kind: LG_TWINKLE,
                order: 562 + k * 1e-4 + 6e-5,
              })
            }
          }
        }
        // (all in the water, as much as its body has come in where each is, so that none lies on the bare page above it)
        const orbs = Math.round(16 * Math.max(0.5, w / 1232))
        for (let k = 0; k < orbs; k += 1) {
          const x = ((k + 0.5 + 0.8 * (hashed(k * 3.7 + 0.2) - 0.5)) / orbs) * w
          const y = at(0.14 + 0.64 * hashed(k * 5.3 + 0.6) ** 1.4)
          const r = (5 + 34 * hashed(k * 7.1 + 0.4) ** 2.5) * Math.max(0.7, sc)
          orb(k, x, y, r, hashed(k * 9.7) < 0.35, 0.15 + 0.85 * inBody(y - 0.5 * r))
        }

        // The sparkles: little stars of light that twinkle, and the specks drifting in the water.
        const sparks = Math.round(26 * Math.max(0.5, w / 1232))
        for (let k = 0; k < sparks; k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const y = at(0.04 + 0.9 * hashed(k * 3.7 + 0.9))
          const r = (0.8 + 1.6 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          // (its glow, its heart and its rays sharing a seed, so that they twinkle together)
          const star = (n += 1)
          put(star, {
            x,
            y,
            long: r * 2.2,
            wide: 1,
            blur: r * 1.4,
            paints: ['lgSparkGlow', 'lgSparkGlow'],
            load: 0.22,
            kind: LG_GLIMMER,
            order: 563,
          })
          put(star, {
            x,
            y,
            long: r * 0.6,
            wide: 1,
            blur: r * 0.25,
            paints: ['lgSpark', 'lgSpark'],
            load: 1,
            kind: LG_TWINKLE,
            order: 563.1,
          })
          // now and then a star of four rays
          if (hashed(k * 9.1 + 0.2) < 0.3) {
            for (const turn of [0, Math.PI / 2]) {
              put(star, {
                x,
                y,
                long: r * 3.5,
                wide: 0.06,
                turn,
                blur: 0.5,
                paints: ['lgSpark', 'lgSpark'],
                load: 0.75,
                kind: LG_TWINKLE,
                order: 563.2,
              })
            }
          }
        }
        const specks = Math.round(140 * Math.max(0.45, w / 1232))
        for (let k = 0; k < specks; k += 1) {
          const x = hashed(k * 2.9 + 0.7) * w
          const y = at(0.05 + 0.95 * hashed(k * 4.1 + 0.3))
          const r = (0.5 + 0.9 * hashed(k * 6.7) ** 2) * Math.max(0.8, Math.sqrt(sc))
          put((n += 1), {
            x,
            y,
            long: r,
            wide: 1,
            blur: 0.4,
            paints: ['lgSnow', 'lgSnow'],
            load: (0.35 + 0.5 * hashed(k * 8.9)) * (0.3 + 0.7 * inBody(y)),
            kind: LG_GLIMMER,
            order: 561,
          })
        }

        /* A moon jelly, painted in its own terms and handed out stroke by stroke. Its bell is a dome with round shoulders,
           `len` across, seen from `el` above its margin's plane: its outline is the dome's crown (or the margin's far side,
           where that rises over it) above and the margin's near side below; tilted by `tilt` (its top towards the right),
           its top at the origin, about which its two halves swing as it pulses (see schoolVertex). Its rim glows, brightest
           on its shoulders, with a softer light inside it, as the bell's curve catches the light; its margin is a frilled
           fainter edge; through its bell, four pink rings in a clover; under it, four frilled arms, and fine tentacles from
           its margin, trailing. `look` names its paints, `fine` how much of it is drawn. */
        const jelly = (spec, emit) => {
          const { len, tilt, el, look, fine, seed, flap = 0 } = spec
          const R = len / 2
          const H = (look.dome - 0.06 + 0.2 * hashed(seed * 3.1)) * R
          const se = Math.sin(el)
          const ce = Math.cos(el)
          // the dome's height at a distance out from its middle: flat on top, round at the shoulders
          const zAt = (r) => H * Math.max(0, 1 - (r / R) ** 2.4) ** 0.62
          // the outline's top, at x across the bell: the highest of the dome's points behind that place, or the margin's
          const crown = (x) => {
            const lim = Math.sqrt(Math.max(0, R * R - x * x))
            let best = -lim * se
            for (let j = 0; j < 16; j += 1) {
              const t = lim * (j / 16)
              best = Math.min(best, -(zAt(Math.hypot(x, t)) * ce + t * se))
            }
            return best
          }
          const front = (x) => Math.sqrt(Math.max(0, R * R - x * x)) * se
          const top0 = crown(0)
          const cs = Math.cos(tilt)
          const sn = Math.sin(tilt)
          const px = Math.max(0.8, Math.sqrt(len / 60))
          /* A stroke in the bell's terms (x across, y down from the outline's top), tilted and handed out, its half by x.
             The two halves swing apart and together about the top as it pulses, so that a stroke across the middle, which
             belongs to both, would part at the margin's middle: one there is laid twice, once with either half, its paint
             shared between them as it lies nearer the one or the other, so that the middle of the margin slides along
             itself as the halves part and never breaks. A stroke given its part (0 for one that stays still, down the
             middle) is laid once. */
          const zone = 0.42 * R
          const out = (k, { x, y, turn = 0, ...o }, part) => {
            const yy = y - top0
            const placed = { ...o, x: x * cs - yy * sn, y: x * sn + yy * cs, turn: turn + tilt }
            if (part !== undefined) {
              emit(k, placed, part)
              return
            }
            const left = clamp((zone - x) / (2 * zone), 0, 1)
            if (left > 0.02) {
              emit(k, { ...placed, load: placed.load * left }, 0.2)
            }
            if (left < 0.98) {
              emit(k + 500, { ...placed, load: placed.load * (1 - left) }, 0.4)
            }
          }
          // a run of strokes along a curve given as a function of s in [0, 1], each a short piece of it
          const along = (k0, f, pieces, look0, part) => {
            for (let i = 0; i < pieces; i += 1) {
              const a = f(i / pieces)
              const b = f((i + 1) / pieces)
              const m = f((i + 0.5) / pieces)
              const seg = Math.hypot(b[0] - a[0], b[1] - a[1])
              const o = look0(i, m, seg * 0.62 + 0.4)
              if (o) {
                out(
                  k0 + i,
                  { x: m[0], y: m[1], long: seg * 0.62 + 0.4, turn: Math.atan2(b[1] - a[1], b[0] - a[0]), ...o },
                  part,
                )
              }
            }
          }
          const k = (base, i = 0) => base * 1000 + i
          const crownAt = (s, inset = 0, shrink = 1) => {
            const x = -R * shrink * Math.cos(Math.PI * s)
            return [x, crown(x) + inset]
          }
          const pieces = Math.max(6, Math.round(look.pieces * Math.max(0.5, fine)))
          // the light round it, in two soft layers
          const mid = (top0 + front(0)) / 2
          out(
            k(1),
            {
              x: 0,
              y: mid,
              long: len * 0.6,
              wide: 0.75,
              blur: len * 0.3,
              paints: [look.halo, look.halo],
              load: look.haloLoad,
              kind: LG_HAZE_MIST,
              order: -0.004,
            },
            0,
          )
          out(
            k(1, 1),
            {
              x: 0,
              y: mid + 0.2 * R,
              long: len * 1.0,
              wide: 0.85,
              blur: len * 0.55,
              paints: [look.haloFar, look.haloFar],
              load: look.haloLoad * 0.5,
              kind: LG_HAZE_MIST,
              order: -0.005,
            },
            0,
          )
          // its translucent bell, a soft body in either half, and a soft light under its crown
          for (const side of [-1, 1]) {
            const x = side * 0.42 * R
            const yt = crown(x)
            const yb = front(x)
            out(k(2, side + 1), {
              x,
              y: (yt + yb) / 2,
              long: 0.56 * R,
              wide: clamp((yb - yt) / 2 / (0.56 * R), 0.25, 1.1),
              blur: 0.3 * R,
              paints: [look.fill, look.fillDeep],
              load: look.fillLoad,
              kind: LG_HAZE_MIST,
              order: 0,
            })
          }
          out(
            k(2, 5),
            {
              x: 0,
              y: top0 + 0.24 * (front(0) - top0),
              long: 0.45 * R,
              wide: 0.42,
              blur: 0.25 * R,
              paints: [look.rimGlow, look.rimGlow],
              load: look.fillLoad * 1.1,
              kind: LG_HAZE_MIST,
              order: 0.0001,
            },
            0,
          )
          // its four frilled arms, hanging from under its middle, gently wavy, thinning to nothing; they hang down the middle
          // and stay still as the bell pulses over them (part 0), rather than swinging out and in with its halves
          if (fine > 0.3) {
            for (let a = 0; a < 4; a += 1) {
              const q = seed * 17 + a * 3.7
              const x0 = (a - 1.5) * 0.1 * R
              const reach = len * (0.3 + 0.32 * hashed(q * 1.3)) * fine
              const many = fine > 0.8 ? 8 : 3
              along(
                k(3, a * 10),
                (s) => [
                  x0 + (a - 1.5) * 0.09 * R * s + Math.sin(s * 7 + q) * 0.07 * R * s,
                  front(0) * 0.6 + 0.04 * R + s * reach,
                ],
                many,
                (i, m, long) => ({
                  wide: clamp((0.06 * R * (1 - 0.5 * (i / many)) * (0.6 + 0.8 * hashed(q + i))) / long, 0.05, 0.8),
                  blur: Math.max(0.8, 0.025 * R),
                  paints: i % 2 ? [look.armPink, look.arm] : [look.arm, look.armPink],
                  load: look.armLoad * (1 - 0.8 * (i / many)),
                  kind: LG_HAZE_MIST,
                  order: 0.001 + a * 1e-5,
                }),
                0,
              )
            }
          }
          /* its tentacles, from its margin's near side and its ends, hanging and trailing back the way it has come (it
             drifts to the right), fine and thinning out. They hang still as the bell pulses (part 0), rather than opening
             and shutting as scissors with its halves: so each comes from a little up inside the bell, as far as its margin
             there rises as the bell opens, and comes in softly there, so that the margin never lifts off its tentacles. */
          const tents = Math.round(look.tents * fine)
          for (let t = 0; t < tents; t += 1) {
            const q = seed * 31 + t * 2.3
            const ang = Math.PI * (0.01 + 0.98 * ((t + 0.6 * hashed(q)) / tents))
            const mx = R * Math.cos(ang)
            const my = R * se * Math.sin(ang)
            const reach = len * (0.15 + 0.9 * hashed(q * 1.7) ** 1.7) * (0.5 + 0.5 * fine)
            const splay = (mx / R) * 0.16 * len
            const curl = (hashed(q * 2.9) - 0.5) * 0.12 * len
            const wave = 0.03 * len * (0.5 + hashed(q * 4.1))
            const trail = (0.06 + 0.1 * hashed(q * 5.3)) * reach
            const up = 0.9 * flap * Math.abs(mx) + 0.02 * R
            const many = reach > 0.35 * len && fine > 0.6 ? 4 : reach > 0.2 * len ? 2 : 1
            along(
              k(4, t * 5),
              (s) => [
                mx + splay * s * s - trail * s * s + curl * Math.sin(s * 3.1) + wave * Math.sin(s * 7 + q) * s,
                my - up + (reach + up) * s,
              ],
              many,
              (i, m, long) => ({
                wide: clamp((px * 0.38) / long, 0.004, 0.3),
                blur: 0.45,
                paints: [look.tent, look.tent],
                load: look.tentLoad * (1 - 0.65 * (i / many)) * (i === 0 ? (many > 1 ? 0.5 : 0.7) : 1),
                kind: LG_LINE,
                order: 0.002 + t * 1e-6,
              }),
              0,
            )
          }
          // the fine canals running out over its bell from its middle to its margin, hardly to be seen
          if (fine > 0.6) {
            const canals = 16
            for (let c = 0; c < canals; c += 1) {
              const phi = ((c + 0.5) / canals) * Math.PI * 2 + seed
              along(
                k(13, c * 3),
                (s) => {
                  const r = R * (0.14 + 0.84 * s)
                  return [r * Math.cos(phi), -(zAt(r) * ce + r * Math.sin(phi) * se)]
                },
                2,
                (i, m, long) => ({
                  wide: clamp((px * 0.3) / long, 0.004, 0.2),
                  blur: 0.6,
                  paints: [look.rimGlow, look.rimGlow],
                  load: look.canalLoad * (Math.sin(phi) < 0 ? 1 : 0.6),
                  kind: LG_LINE,
                  order: 0.0025 + c * 1e-6,
                }),
                Math.abs(Math.cos(phi)) < 0.3 ? 0 : Math.cos(phi) < 0 ? 0.2 : 0.4,
              )
            }
          }
          // the margin's far side, seen through the bell, faint
          along(
            k(5),
            (s) => [-R * Math.cos(Math.PI * s), -R * se * Math.sin(Math.PI * s)],
            pieces,
            (i, m, long) =>
              m[1] < crown(m[0]) + 0.6
                ? null
                : {
                    wide: clamp((px * 0.45) / long, 0.01, 0.4),
                    blur: 0.5,
                    paints: [look.rim, look.rim],
                    load: look.rimLoad * 0.26,
                    kind: LG_LINE,
                    order: 0.003 + i * 1e-6,
                  },
          )
          // the four rings in a clover through the bell under its crown, each with a soft pink light behind it; laid out as
          // if seen a little more from above than the bell is, as the dome's top faces the eye, so that they never stack
          const seR = Math.max(se, 0.72)
          const ringY = top0 + 0.52 * (front(0) * 0.5 - top0)
          const spin = hashed(seed * 2.3) * Math.PI * 0.5
          for (let r = 0; r < 4; r += 1) {
            const th = spin + Math.PI * 0.5 * r
            // (each a loop drawn out from the middle, its inner end, open, close to the middle, as a petal of the flower)
            const rr = 0.25 * R
            const cx = rr * Math.cos(th)
            const cy = ringY - rr * Math.sin(th) * seR
            const radial = (0.155 + 0.02 * hashed(seed * 7 + r)) * R
            const across = (0.078 + 0.01 * hashed(seed * 5 + r)) * R
            // (the flower stays whole as the bell pulses round it, rather than parting in two with the bell's halves)
            const ringPart = 0
            // its two conjugate half-diameters, along and across the way out from the middle, foreshortened
            const a1 = [radial * Math.cos(th), -radial * Math.sin(th) * seR]
            const a2 = [-across * Math.sin(th), -across * Math.cos(th) * seR]
            const sxx = a1[0] * a1[0] + a2[0] * a2[0]
            const syy = a1[1] * a1[1] + a2[1] * a2[1]
            const sxy = a1[0] * a1[1] + a2[0] * a2[1]
            const tr = (sxx + syy) / 2
            const dt = Math.sqrt(Math.max(0, tr * tr - (sxx * syy - sxy * sxy)))
            const major = Math.sqrt(tr + dt)
            const minor = Math.sqrt(Math.max(1e-4, tr - dt))
            const turn = 0.5 * Math.atan2(2 * sxy, sxx - syy)
            if (look.ringGlow && fine < 0.6) {
              out(
                k(6, r),
                {
                  x: cx,
                  y: cy,
                  long: major,
                  wide: clamp(minor / major, 0.2, 1),
                  turn,
                  blur: Math.max(2, major * 0.55),
                  paints: [look.ringGlow, look.ringGlow],
                  load: look.ringGlowLoad,
                  kind: LG_RING,
                  order: 0.004,
                },
                ringPart,
              )
            }
            if (fine < 0.6) {
              out(
                k(6, r + 10),
                {
                  x: cx,
                  y: cy,
                  long: major,
                  wide: clamp(minor / major, 0.2, 1),
                  turn,
                  blur: look.ringBlur,
                  paints: [look.ring, look.ring],
                  load: look.ringLoad,
                  kind: LG_RING,
                  order: 0.005,
                },
                ringPart,
              )
            } else {
              /* a near one's is a horseshoe, as a moon jelly's are, nearly closed, its gap towards the bell's middle, brushed
                 round in short strokes, fuller in the middle of its bow and thinning towards its ends */
              const ct = Math.cos(turn)
              const st = Math.sin(turn)
              const dx = -cx
              const dy = ringY - cy
              const gap = Math.atan2((-dx * st + dy * ct) / minor, (dx * ct + dy * st) / major)
              const open = 0.38 + 0.1 * hashed(seed * 9 + r)
              const many = 12
              const bow = (s) => {
                const a = gap + open + s * (Math.PI * 2 - 2 * open)
                const lx = major * Math.cos(a)
                const ly = minor * Math.sin(a)
                return [cx + lx * ct - ly * st, cy + lx * st + ly * ct]
              }
              // its soft pink light, along the horseshoe itself so that its gap stays open
              if (look.ringGlow) {
                along(
                  k(6, 300 + r * 10),
                  bow,
                  6,
                  (i, m, long) => ({
                    wide: clamp((0.07 * R) / long, 0.1, 0.9),
                    blur: Math.max(2, 0.06 * R),
                    paints: [look.ringGlow, look.ringGlow],
                    load: look.ringGlowLoad * 0.7 * (0.6 + 0.4 * Math.sin(((i + 0.5) / 6) * Math.PI)),
                    kind: LG_HAZE_MIST,
                    order: 0.004 + i * 1e-6,
                  }),
                  ringPart,
                )
              }
              along(
                k(6, 20 + r * 20),
                bow,
                many,
                (i, m, long) => {
                  const bow = Math.sin(((i + 0.5) / many) * Math.PI)
                  return {
                    wide: clamp((px * (0.42 + 0.5 * bow) * look.ringWidth) / long, 0.02, 0.6),
                    blur: look.ringBlur * 0.55,
                    paints: [look.ring, look.ring],
                    load: look.ringLoad * (0.62 + 0.38 * bow),
                    kind: LG_LINE,
                    order: 0.005 + i * 1e-6,
                  }
                },
                ringPart,
              )
            }
          }
          // the light inside its crown, as the bell's curve catches it, brightest at its shoulders
          along(
            k(7),
            (s) => crownAt(s, 0.09 * R, 0.93),
            Math.max(4, Math.round(pieces * 0.6)),
            (i, m, long) => ({
              wide: clamp((0.08 * R) / long, 0.05, 0.7),
              blur: 0.08 * R,
              paints: [look.rimGlow, look.rimGlow],
              load: look.rimLoad * 0.36 * (0.3 + 0.7 * Math.abs(m[0] / R) ** 1.2),
              kind: LG_HAZE_MIST,
              order: 0.006,
            }),
          )
          // a soft glow along its rim
          if (fine > 0.5) {
            along(
              k(9),
              (s) => crownAt(s),
              Math.max(4, Math.round(pieces * 0.5)),
              (i, m, long) => ({
                wide: clamp((0.045 * R) / long, 0.04, 0.6),
                blur: 0.06 * R,
                paints: [look.rimGlow, look.rimGlow],
                load: look.rimLoad * 0.5 * (0.5 + 0.5 * Math.abs(m[0] / R)),
                kind: LG_HAZE_MIST,
                order: 0.0065,
              }),
            )
          }
          // its rim along the crown, fine and bright, brightest on its shoulders
          along(
            k(8),
            (s) => crownAt(s),
            pieces,
            (i, m, long) => ({
              wide: clamp((px * 0.5) / long, 0.01, 0.5),
              blur: 0.5,
              paints: [look.rim, look.rim],
              load: look.rimLoad * (0.32 + 0.5 * Math.abs(m[0] / R) ** 1.4),
              kind: LG_LINE,
              order: 0.007 + i * 1e-6,
            }),
          )
          // and its margin's near side, a fainter frilled edge, with a fringe of short tentacles hanging from it
          along(
            k(10),
            (s) => [
              -R * Math.cos(Math.PI * s),
              front(-R * Math.cos(Math.PI * s)) + Math.sin(s * 37 + seed) * 0.012 * R,
            ],
            pieces,
            (i, m, long) => ({
              wide: clamp((px * 0.5) / long, 0.01, 0.5),
              blur: 0.9,
              paints: [look.rim, look.rim],
              load: look.rimLoad * 0.42,
              kind: LG_LINE,
              order: 0.008 + i * 1e-6,
            }),
          )
          if (fine > 0.6) {
            const fringe = Math.round(pieces * 2.2)
            for (let f = 0; f < fringe; f += 1) {
              const s = (f + 0.5) / fringe
              const x = -R * Math.cos(Math.PI * s)
              const l = (0.025 + 0.035 * hashed(seed * 3 + f * 1.7)) * len
              out(k(12, f), {
                x: x + (x / R) * l * 0.3,
                y: front(x) + l,
                long: l,
                wide: clamp((px * 0.32) / l, 0.01, 0.3),
                turn: Math.PI / 2 - (x / R) * 0.3,
                blur: 0.45,
                paints: [look.tent, look.tent],
                load: look.tentLoad * 0.7,
                kind: LG_LINE,
                order: 0.0085,
              })
            }
          }
          // now and then a star of light on a shoulder
          if (look.glint && hashed(seed * 5.3) < 0.5) {
            const x = (hashed(seed * 6.1) < 0.5 ? -0.7 : 0.66) * R
            const y = crown(x)
            for (const [j, turn] of [
              [0, 0.3],
              [1, 0.3 + Math.PI / 2],
            ]) {
              out(k(11), {
                x,
                y,
                long: (j ? 0.045 : 0.06) * len,
                wide: 0.06,
                turn: turn - tilt,
                blur: 0.5,
                paints: ['lgSpark', 'lgSpark'],
                load: 0.8,
                kind: LG_TWINKLE,
                order: 0.009,
              })
            }
            out(k(11), {
              x,
              y,
              long: 0.05 * len,
              wide: 1,
              blur: 0.05 * len,
              paints: ['lgSparkGlow', 'lgSparkGlow'],
              load: 0.6,
              kind: LG_GLIMMER,
              order: 0.0091,
            })
          }
        }
        // the looks of the three depths: paints, how much paint, how many tentacles and pieces along the rim
        const LOOKS = [
          {
            rim: 'lgRim',
            rimGlow: 'lgRimGlow',
            fill: 'lgFill',
            fillDeep: 'lgFillDeep',
            halo: 'lgHalo',
            haloFar: 'lgHaloFar',
            tent: 'lgTent',
            arm: 'lgArm',
            armPink: 'lgArmPink',
            ring: 'lgRing',
            ringGlow: 'lgRingGlow',
            dome: 0.48,
            rimLoad: 0.92,
            fillLoad: 0.17,
            haloLoad: 0.15,
            tentLoad: 0.5,
            armLoad: 0.24,
            ringLoad: 0.62,
            ringGlowLoad: 0.55,
            ringBlur: 1.8,
            tents: 34,
            pieces: 24,
            glint: true,
            canalLoad: 0.2,
            ringWidth: 1.1,
          },
          {
            rim: 'lgRimMid',
            rimGlow: 'lgRimGlow',
            fill: 'lgFillMid',
            fillDeep: 'lgFillDeep',
            halo: 'lgHalo',
            haloFar: 'lgHaloFar',
            tent: 'lgTent',
            arm: 'lgArm',
            armPink: 'lgArmPink',
            ring: 'lgRing',
            ringGlow: 'lgRingGlow',
            dome: 0.46,
            rimLoad: 0.85,
            fillLoad: 0.16,
            haloLoad: 0.12,
            tentLoad: 0.44,
            armLoad: 0.22,
            ringLoad: 0.56,
            ringGlowLoad: 0.45,
            ringBlur: 1.3,
            tents: 22,
            pieces: 14,
            glint: false,
            canalLoad: 0.16,
            ringWidth: 1.1,
          },
          {
            rim: 'lgRimFar',
            rimGlow: 'lgRimFar',
            fill: 'lgFillFar',
            fillDeep: 'lgFillFar',
            halo: 'lgHaloFar',
            haloFar: 'lgHaloFar',
            tent: 'lgTentFar',
            arm: 'lgArm',
            armPink: 'lgArmPink',
            ring: 'lgRingFar',
            ringGlow: null,
            dome: 0.42,
            rimLoad: 0.58,
            fillLoad: 0.24,
            haloLoad: 0.08,
            tentLoad: 0.34,
            armLoad: 0.2,
            ringLoad: 0.25,
            ringGlowLoad: 0,
            ringBlur: 1.05,
            tents: 10,
            pieces: 10,
            glint: false,
            canalLoad: 0,
            ringWidth: 1,
          },
        ]

        /* The jellies of the school. Each painted round the canvas's middle (the shader carries it where it is, see
           schoolVertex), its strokes numbered and ordered by its index, so that far ones are painted first. */
        const hx = half
        const hy = h / 2
        const js = LG_JELLY_SCALE(w)
        LG_JELLIES.forEach((b, i) => {
          const len = b.size * js
          const phase = 400 + i
          const base = 2000 + i * 0.1
          const id = 200000 + i * 20000
          jelly(
            {
              len,
              tilt: b.tilt,
              el: b.el,
              flap: b.flap,
              look: LOOKS[b.depth],
              fine: b.depth === 0 ? 1 : b.depth === 1 ? 0.7 : 0.35,
              seed: b.seed * 100 + i,
            },
            (kk, o, part) => {
              put(id + kk, { ...o, x: hx + o.x, y: hy + o.y, order: base + o.order, phase: phase + part })
            },
          )
        })
      },
    }

    /* --- the telecom page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/telecom, after Cameron's two pictures: a pond seen from above, under the calls to action. Its
       water is turquoise, in the land's own fine lines, coming in from nothing just under the buttons as the overview's
       forest's mist does; soft pink clouds lie reflected in it, fine wavy lines of light run over it as in the folk-art
       pond, lily pads float in drifts low in it and at its sides, and now and then a drop falls into it under the words and
       sends rings of ripples spreading out, as a signal does, each a crest of light beside a trough of shade with glints
       of sun riding it, crisp near the middle and wider, softer and fainter as they spread. Koi swim through it, orange
       and white, each with its shadow on the pond's floor under it, swaying their tails and paddling their fins, coming in
       and going out through the glass at the sides as the forest's egrets do. At night it is the same pond under the
       moon, deep teal, the clouds' reflections dusky, the glints stars, and the koi still glowing orange. */
    const TC_EVEN = 0.005
    const TC_MIST = 0.0025
    const TC_HAZE = 0.4 + TC_EVEN
    // paint with no bristles, its soft edge breaking into the grain's specks as dry gouache does; and the same thinning
    // into the grain upward across the band garden.mist gives
    const TC_LEAF = 0.25
    const TC_LEAF_MIST = 0.25 + TC_MIST
    const TC_HAZE_MIST = 0.4 + TC_EVEN + TC_MIST
    // the glints: a light whose heart comes and goes, and a soft glow round it that does so a little
    const TC_TWINKLE = 3.25 + TC_EVEN
    const TC_GLIMMER = 3.4 + TC_EVEN
    // and the same light marked as mist, for the glints that ride the ripple's rings: a ring can spread up to the top of the
    // pond, where they thin away into the grain as everything there does, rather than riding on up beside the buttons
    const TC_GLIMMER_MIST = TC_GLIMMER + TC_MIST
    // (its own, as in a one-file build the engine's hashed and clamp come after this, worked out as it loads)
    const tcHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    /* The pond's inks, light and dark: a pale aqua where its lines come in under the buttons, deepening to the turquoise
       of the reference down in the pond; at night a deep moonlit teal. Close in value below the top, so that its lines,
       each a little nearer one or the other, never stripe the water. */
    const TC_INKS = {
      ...LAND_INK,
      tcTop: ['#cfeef1', '#10202a'],
      tcHigh: ['#93d7e1', '#11303c'],
      tcMid: ['#6ac6d8', '#133846'],
      tcLow: ['#4fb6cf', '#153f4f'],
      tcFoot: ['#43aac8', '#143b4b'],
    }
    /* How large the pond's strokes are drawn on a canvas this wide; past a laptop's they grow only slowly, so that a
       wide screen's pond is still a few large pads and koi rather than a carpet of small ones. */
    const TC_SCALE = (w) => Math.max(0.5, Math.min(w / 1232, 1.15 + Math.max(0, w - 1600) / 2600))
    // and the koi, a little larger on a phone than that alone would make them, and no larger on a wide screen
    const TC_KOI_SCALE = (w) => Math.max(0.72, Math.min(1.15, TC_SCALE(w)))
    const TC_NEAR_FROM = 700
    /* The band the koi swim in: from a little under the buttons, so that none swims close under them, to about two
       thirds of the way down the pond, falling a little across the canvas to the right. The lily pads float under it and
       at the sides, so that no koi swims over one. */
    const tcBand = ({ w, h, words }) => {
      const under = words.y + words.b
      const s = TC_KOI_SCALE(w)
      const fall = (h - under) * 0.1 * Math.min(1, w / 1232)
      const top = under + 72 * s + fall / 2
      const foot = Math.max(top + 90, under + 0.62 * (h - under))
      return [top, foot, fall]
    }
    /* The koi's coats: the body, its patches (as saddles across its back: where along it, from the head back, how much
       of its width each covers and, for one that must lie to one side, which) and its fins and tail (translucent, paler at their edges); after the reference's,
       mostly orange with white, and a few white with red or orange and a gold one. No black: a pair of dark spots on a
       koi seen from above reads as a face. */
    const TC_COATS = [
      {
        body: 'tcKoiOrange',
        patch: 'tcKoiWhite',
        saddles: [
          [0.13, 0.03, 0.55, -1],
          [-0.1, -0.26, 0.9],
        ],
        fin: 'tcKoiFinWhite',
      },
      {
        body: 'tcKoiWhite',
        patch: 'tcKoiRed',
        saddles: [
          [0.2, 0.04, 1],
          [-0.06, -0.22, 0.85],
        ],
        fin: 'tcKoiFinWhite',
      },
      {
        body: 'tcKoiOrange',
        patch: 'tcKoiWhite',
        saddles: [
          [0.26, 0.17, 0.9],
          [-0.02, -0.1, 0.6],
          [-0.26, -0.34, 1],
        ],
        fin: 'tcKoiFinOrange',
      },
      {
        body: 'tcKoiWhite',
        patch: 'tcKoiOrange',
        saddles: [
          [0.16, -0.02, 0.95],
          [-0.14, -0.26, 0.7],
        ],
        fin: 'tcKoiFinWhite',
      },
      { body: 'tcKoiGold', patch: 'tcKoiFinGold', saddles: [[0.08, -0.06, 0.45]], fin: 'tcKoiFinGold' },
      {
        body: 'tcKoiWhite',
        patch: 'tcKoiRed',
        saddles: [
          [0.25, 0.16, 0.75],
          [0.06, -0.08, 0.9],
          [-0.2, -0.3, 0.6],
        ],
        fin: 'tcKoiFinWhite',
      },
      { body: 'tcKoiOrange', patch: 'tcKoiWhite', saddles: [[0.04, -0.16, 0.75]], fin: 'tcKoiFinOrange' },
    ]
    /* The ripple (see `ripple`). A drop falls now and then, five in a round of 13.9 seconds, from two to three and a half
       seconds apart and never evenly, each a little larger or smaller than the last: for each, when it falls, how far
       its rings spread (a share of the ripple's reach) and how strong they are. Each sends out four rings, the outer ones
       faster, as the longer waves of a real ripple are, so that they draw apart as they spread: for each, how long after
       its drop it starts, how far it spreads (a share of its drop's) and how strong it is, the second the strongest, as a
       drop's second ring is. A ring lives 7.5 seconds, so that two or three drops' rings, eight to twelve, are out at a
       time; but they fade quickly as they go, so that what one sees is the last drop's rings, crisp, with the one before
       it wider, softer and fainter round them. The still picture (at the composition's still clock, 5.75) has a drop's
       rings a second out round the middle, and the rings of the drop before it halfway out round them. */
    const TC_DROPS = [
      [0, 1, 0.95],
      [2.15, 0.88, 0.8],
      [4.7, 1.04, 1],
      [8.25, 0.92, 0.85],
      [10.65, 0.97, 0.9],
    ]
    const TC_DROP_RINGS = [
      [0, 1, 0.75],
      [0.05, 0.8, 1],
      [0.1, 0.63, 0.75],
      [0.15, 0.48, 0.5],
    ]
    // the pond's view: seen from above and a little from the front, so rings and pads are a little flattened
    const TC_FLAT = 0.52
    const TC_RIPPLE = {
      // from under the words, in the middle of the koi's band
      at: ({ w, h, words }) => {
        const [top, foot] = tcBand({ w, h, words })
        return [words.x, (top + foot) / 2]
      },
      flat: TC_FLAT,
      period: 13.9,
      rings: TC_DROPS.flatMap(([at, reach, much]) =>
        TC_DROP_RINGS.map(([after, pace, strength]) => [at + after, pace * reach, strength * much]),
      ),
      life: 7.5,
      // about a quarter of the canvas across at its furthest, never so far on a wide screen that it fills the pond
      reach: (w) => Math.max(150, Math.min(440, 0.28 * w)),
      ease: 1.4,
      width: [1, 4.5],
      soft: [1, 4],
      fade: [0.04, 1.8],
      // and the fine wavy lines on the water bent a little as a ring crosses them
      bend: [2, 3],
    }
    // the order the coats go to the koi in: mostly orange and white, as the reference's are
    const TC_COAT_ORDER = [0, 1, 2, 6, 3, 0, 4, 2, 1, 5, 6, 0]
    /* A koi seen from above, its half-width at each place along it (in its length, from its snout at the front): round at
       the head, broadest behind it and narrowing to the root of its tail. */
    const TC_BODY = [
      [0.31, 0],
      [0.285, 0.04],
      [0.25, 0.066],
      [0.2, 0.084],
      [0.12, 0.096],
      [0.04, 0.098],
      [-0.06, 0.09],
      [-0.16, 0.074],
      [-0.26, 0.052],
      [-0.34, 0.034],
      [-0.41, 0.024],
    ]
    const tcHalfAt = (lx) => {
      for (let k = 1; k < TC_BODY.length; k += 1) {
        const [x0, w0] = TC_BODY[k - 1]
        const [x1, w1] = TC_BODY[k]
        if (lx >= x1) {
          return w0 + ((w1 - w0) * (x0 - lx)) / (x0 - x1)
        }
      }
      return TC_BODY[TC_BODY.length - 1][1]
    }
    /* The koi: three loose groups, a third of their round apart, so that one is always crossing the pond, each at the
       same calm pace so that it stays together, its koi in lanes of their own across the band and spaced along the round
       as the golden ratio spaces them, each weaving slowly up and down (the school turns it with its way), surging a
       little, its tail swaying slowly and its fins paddling now and then. Every third of a group swims only on a canvas
       wider than a phone's. For each: its length (CSS pixels at 1232), pace, lane, place in the round, how far it weaves
       and how often, how far it surges and how often, its tail's beats a second and how far it swings, how far its fins
       paddle and how often it glides on them held still, its coat and a seed of its own. */
    const TC_GROUPS = [4, 4, 3]
    const TC_KOI = TC_GROUPS.flatMap((count, g) =>
      Array.from({ length: count }, (_, j) => {
        const i = TC_GROUPS.slice(0, g).reduce((a, b) => a + b, 0) + j
        const h = (k) => tcHash(i * 13.7 + k * 3.1 + 0.9)
        const lane = Math.min(1, Math.max(0, ((j * 0.618034 + g * 0.37) % 1) * 0.9 + 0.05 + (h(3) - 0.5) * 0.06))
        return {
          size: 88 + 36 * h(1),
          speed: 26,
          lane,
          phase: g / TC_GROUPS.length + 0.05 + (j / Math.max(1, count - 1) - 0.5) * 0.16 + (h(4) - 0.5) * 0.03,
          drift: 12 + 12 * h(5),
          period: 8 + 6 * h(6),
          surge: 4 + 5 * h(11),
          surgePeriod: 3 + 2 * h(12),
          beat: 0.9 + 0.5 * h(7),
          wag: 0.07 + 0.03 * h(8),
          flap: 0.16 + 0.08 * h(13),
          glide: 3 + 3 * h(9),
          coat: TC_COAT_ORDER[i % TC_COAT_ORDER.length],
          from: j === count - 1 ? TC_NEAR_FROM : 0,
          seed: h(10),
        }
      }),
    )
    const UC_TELECOM = {
      ...HERO,
      intro: false,
      words: '.uc-copy, .dc-copy, .hl-copy',
      /* Its still picture is painted where a group is crossing the middle of the pond: a little before it is in the middle,
         so that the one ahead of it, near the right, is still clear of the glass's band, which a still picture leaves out,
         and a laptop's still keeps its five koi and a phone's its three. */
      stillAt: 5.75,
      // a few beads, the oval of page kept round the words shallow, and every line carried to the canvas's edges
      lines: { ...LINES, lift: 0.08, veil: [80, 18], beadChance: 0.05, whole: true },
      film: FOOTER.film,
      // drawn at a little less than the screen's density on a canvas wider than any laptop's, as the sky is
      dprCap: (w) => Math.min(2, 2 * Math.sqrt(1800 / w)),
      inks: TC_INKS,
      twinkle: true,
      marks: true,
      glyphs: true,
      onPage: true,
      /* the water's lines come in from nothing under the buttons, pale and few, so that where they start is no edge:
         slowly, over more than half the picture, as the overview's forest's mist does; never a lone hairline across the
         whole canvas, and never a striped band */
      fade: {
        at: (stage) => {
          const foot = stage.words.y + stage.words.b
          return [foot - 2, foot + (stage.h - foot) * 0.6]
        },
        ease: 1.15,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      land: {
        ...HERO.land,
        profile: [
          [-1.6, 0],
          [1.6, 0],
        ],
        crest: 0,
        relief: [1, 1],
        sheets: [
          // the pond, from just under the buttons' foot down, in the land's fine lines
          {
            name: 'air',
            top: (stage) => {
              const under = Math.min((stage.words.y + stage.words.b + 3 - stage.base) / stage.room, 0.12)
              return [
                [-1.6, under],
                [1.6, under],
              ]
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'tcTop', 0.4],
              [0.13, 'tcTop', 1],
              [0.28, 'tcHigh', 1],
              [0.52, 'tcMid', 1],
              [0.8, 'tcLow', 1],
              [1, 'tcFoot', 1],
            ],
            fade: true,
            fill: 0.9,
            under: 0.95,
            patch: 0.05,
            flow: 1.1,
            breath: 2,
            beads: [1, 0],
          },
          // the land's foot: it lays the land out and draws nothing
          {
            name: 'meadow',
            top: [
              [-1.6, 1.24],
              [1.6, 1.24],
            ],
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'tcFoot', 0],
              [1, 'tcFoot', 0],
            ],
            fill: 0,
            under: 0,
          },
        ],
        least: 110,
      },
      grass: null,
      flowers: null,
      passer: null,
      pointer: false,
      clouds: [],
      flock: [],
      /* The koi come in and go out through glass at the sides as every hero's creatures do: the home's band and softening,
         even (drawn out only across, so that a koi is never shown twice or tipped), bent a little more than the forest's
         egrets, which a koi a hundred pixels long carries as a soft wisp drawn out level; and a hair of colour split, which
         an orange koi takes as a warm and cool fringe where white egrets would have come apart into a rainbow. (Twice as
         much is already a rainbow fish at the edge: the glass magnifies the split with the koi.) */
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.8,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 3,
        halo: [2.6, 0.2],
      },
      ripple: TC_RIPPLE,
      school: {
        fish: TC_KOI,
        size: TC_KOI_SCALE,
        turn: 0.5,
        band: tcBand,
        // its tail reaches about three quarters of a length behind its middle and its shadow a little further, its snout
        // a third ahead; the last of its glow about half a length beyond either
        reach: [0.8, 0.45],
        glow: [1.2, 0.9],
        scatter: { radius: 120, push: 300, back: 1.2 },
      },
      paints: {
        ...PAINTS,
        // the wash over the water, from under the buttons down
        tcWashTop: ['#d8f2f4', '#0f1e27'],
        tcWashHigh: ['#b6e6ec', '#112a35'],
        tcWash: ['#94d8e3', '#13323f'],
        tcWashDeep: ['#7ccddc', '#153a48'],
        // the water's light and its depths, washed across it
        tcPoolLight: ['#c8f0f2', '#1c4a58'],
        tcPoolDeep: ['#3ba3c2', '#0b2531'],
        tcPoolGreen: ['#8fd3c4', '#164540'],
        // the clouds' reflections: rose, lighter in their upper parts; at night one dusky slate, the same in their strokes
        // and in the wash under them, so that on the dark water no row of strokes stands out from the next as a stripe
        tcCloud: ['#f3bcc3', '#2e3a4d'],
        tcCloudLit: ['#f9d2d4', '#2e3a4d'],
        // and the soft wash under them, so that what shows between their strokes is their colour and not the water's
        tcCloudWash: ['#f5c3c9', '#2e3a4d'],
        // the fine wavy lines on the water, light and in its shade
        tcWave: ['#f4fdfe', '#6aa9bd'],
        tcWaveDeep: ['#3896b6', '#081c25'],
        // the ripples' rings: the light on a crest, by day the sun's and at night the moon's, and the shade in its trough,
        // as much darker than the water as the light is lighter, so that a ring is no darker or lighter than the water
        // round it, only livelier
        tcRipple: ['#f4fdff', '#50c3d6'],
        tcRippleShade: ['#66bfcb', '#010509'],
        // the glints: sun on the water by day, stars in it at night
        tcGlint: ['#ffffff', '#fff8e2'],
        tcGlintGlow: ['#e6fbfd', '#ffe9b0'],
        // the lily pads, from their shade to their lit rims, in a cool jade and a warmer sage, their veins, rims and
        // shadows on the water
        tcPad0: ['#3a6650', '#0c231f'],
        tcPad1: ['#477559', '#102c27'],
        tcPad2: ['#578563', '#15352e'],
        tcPad3: ['#69956d', '#1b3f36'],
        tcPad4: ['#7fa77c', '#234a3f'],
        tcPad5: ['#9abb90', '#2f5749'],
        tcPad6: ['#b9d1aa', '#416c5b'],
        tcPadW0: ['#4c6a3c', '#122620'],
        tcPadW1: ['#5b7a44', '#172e26'],
        tcPadW2: ['#6d8b4e', '#1d372c'],
        tcPadW3: ['#819c5c', '#244133'],
        tcPadW4: ['#97ae6e', '#2d4c3b'],
        tcPadW5: ['#b0c288', '#3a5947'],
        tcPadW6: ['#cad8a8', '#4e6e58'],
        tcPadVein: ['#a3c495', '#2c5446'],
        tcPadRim: ['#d3e5bf', '#5a8a72'],
        tcPadShadow: ['#2c8aa8', '#061820'],
        // the koi: their coats, fins, shadows and the light round them, a glow at night
        tcKoiOrange: ['#f07e2c', '#f88a34'],
        tcKoiRed: ['#e0502a', '#ec5c30'],
        tcKoiGold: ['#f3ab48', '#f8b44e'],
        tcKoiWhite: ['#fdf8f0', '#f4ede2'],
        tcKoiInk: ['#2a2729', '#1c1c22'],
        tcKoiFinOrange: ['#f6b07a', '#f6a46a'],
        tcKoiFinWhite: ['#fbf4ec', '#ece0d2'],
        tcKoiFinGold: ['#f8d59e', '#f2c482'],
        tcKoiShade: ['#cf6029', '#c85a26'],
        tcKoiSheen: ['#fff8ea', '#fff1dc'],
        tcKoiShadow: ['#2c8cab', '#04121a'],
        tcKoiGlow: ['#dcf4f6', '#ff9a48'],
      },
      plant: (garden) => {
        const { w, h, rand, ground, words } = garden
        const half = w / 2
        const sc = TC_SCALE(w)
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it); the same seed gives
        // the same dice, so the heart and the glow of a glint twinkle together
        const put = (n, { x, y, ...o }) => {
          rand.reseed(71001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: TC_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        const top = ground('air', half)
        const pic = h - top
        const at = (f) => top + f * pic
        // sizes keep more of their size on a narrow canvas than the width alone would give them
        const rs = Math.max(sc, Math.min(0.8, pic / 420))
        // the finest mark: a CSS pixel, or a little more on a large canvas
        const px = Math.max(0.8, Math.sqrt(rs))
        // how far the pond has come in at a height, from the page (0) to its full (1): sooner than its lines, so that the
        // koi swim in water and not over the page
        const inn = (y) => smooth(top + 0.02 * pic, top + 0.4 * pic, y) ** 1.2
        // strokes marked as mist thin into the grain upward across this band, so nothing near the top stands on the page
        garden.mist(top + 0.02 * pic, top + 0.3 * pic)
        const [bandTop, bandFoot, bandFall] = tcBand({ w, h, words })
        // the foot of the koi's band at a place across (it falls to the right)
        const bandFootAt = (x) => bandFoot + (bandFall * (x - half)) / Math.max(1, w)
        const flat = TC_FLAT
        let n = 0

        /* The water's body: a wash over its lines in rows deepening down it, so that they show through only as a grain;
           coming in slowly under the buttons, over where the lines come in. */
        const washStep = 0.05 * w + 40
        // (thick enough below its first row that the water's sparse lines, where they come in, show as a grain and never
        // as a ruled band of stripes, and more so on a phone, where they are fewest and furthest apart)
        const washMore = w < 700 ? 1.2 : 1
        const WASH = [
          [0.04, 'tcWashTop', 0.14],
          [0.11, 'tcWashHigh', Math.min(0.6, 0.36 * washMore)],
          [0.19, 'tcWash', Math.min(0.6, 0.46 * washMore)],
          [0.28, 'tcWash', Math.min(0.6, 0.5 * washMore)],
          [0.38, 'tcWashDeep', Math.min(0.6, 0.5 * washMore)],
          [0.5, 'tcWashDeep', Math.min(0.6, 0.46 * washMore)],
          [0.64, 'tcWashDeep', 0.36 * washMore],
          [0.8, 'tcWashDeep', 0.34 * washMore],
        ]
        WASH.forEach(([f, paint, most], row) => {
          const cols = Math.ceil(w / washStep) + 2
          for (let i = 0; i < cols; i += 1) {
            const q = row * 131 + i * 17 + 3
            const x = (i - 0.5 + (row % 2) * 0.5 + (hashed(q * 1.3) - 0.5) * 0.4) * washStep
            const yy = f + (hashed(q * 2.1) - 0.5) * 0.025
            put((n += 1), {
              x,
              y: at(yy),
              long: washStep * 0.95,
              wide: 0.5,
              blur: washStep * 0.55,
              paints: [paint, paint],
              load: most * (0.85 + 0.3 * hashed(q * 4.3)),
              order: 556,
            })
          }
        })
        // and the water's light and depths, broad and soft across it, flatter towards the top
        for (let k = 0; k < 18; k += 1) {
          const f = 0.22 + 0.72 * hashed(k * 4.3 + 2.1)
          const y = at(f)
          const x = hashed(k * 6.7 + 0.8) * w
          const long = (0.06 + 0.1 * f) * w * (0.7 + 0.6 * hashed(k * 2.9))
          const pick = hashed(k * 8.1 + 0.3)
          const paint = pick < 0.45 ? 'tcPoolLight' : pick < 0.8 ? 'tcPoolDeep' : 'tcPoolGreen'
          put((n += 1), {
            x,
            y,
            long,
            wide: 0.2 + 0.12 * f,
            blur: long * 0.6,
            paints: [paint, paint],
            load: (0.16 + 0.12 * hashed(k * 5.5)) * inn(y),
            order: 557,
          })
        }

        /* The clouds' reflections: rose shapes lying flat on the water, broad and lobed, their edges irregular with bays
           and now and then a little island off them, as the folk-art pond's are; painted, as a reflection is, in level
           strokes long and close over a soft wash of their own colour, so that the water shows between them only as fine
           breaks and never as rows; one at either side and smaller ones between, and on a canvas wider than any laptop's
           two more, so that its middle is not a bare sheet of water. For each: where across and down it lies, its size,
           and the narrowest canvas it is on. */
        const CLOUDS = [
          [0.1, 0.45, 0.17],
          [0.87, 0.37, 0.15],
          [0.6, 0.83, 0.13],
          [0.3, 0.9, 0.1],
          [0.98, 0.79, 0.09],
          [0.3, 0.66, 0.07, 1600],
          [0.71, 0.6, 0.07, 1600],
        ]
        CLOUDS.forEach(([fx, fy, size, least = 0], c) => {
          if (w < least) {
            return
          }
          const cx = fx * w
          const cy = at(fy)
          // (no larger on a wide screen than on a laptop's, where they would fill the pond, and no smaller on a phone than
          // on a small tablet's, where one would be a koi's size and shape, a pink fish among the others)
          const R = size * clamp(w, 640, 1300) * Math.min(1, 0.6 + 0.4 * sc)
          // its shape: lobes along it, a few smaller ones off its edges and now and then a little island
          const lobes = []
          const many = 9 + Math.round(5 * hashed(c * 3.3))
          for (let k = 0; k < many; k += 1) {
            const u = (k / (many - 1)) * 2 - 1
            const q = c * 50 + k
            const lr = R * (0.2 + 0.16 * hashed(q * 1.7)) * (1 - 0.45 * u * u)
            const x = cx + u * R * 0.9 + (hashed(q * 2.3) - 0.5) * R * 0.1
            const y = cy + (hashed(q * 3.1) - 0.5) * R * flat * 0.36 - (1 - u * u) * R * flat * 0.1
            lobes.push([x, y, lr * 1.15, lr * flat * 0.95])
            for (let j = 0; j < 2; j += 1) {
              const a = hashed(q * 5.1 + j) * Math.PI * 2
              const br = lr * (0.3 + 0.2 * hashed(q * 6.7 + j))
              lobes.push([x + Math.cos(a) * lr, y + Math.sin(a) * lr * flat, br * 1.2, br * flat])
            }
            if (hashed(q * 8.3) < 0.25) {
              const a = hashed(q * 9.1) * Math.PI * 2
              const br = lr * (0.15 + 0.1 * hashed(q * 6.1))
              lobes.push([x + Math.cos(a) * lr * 1.6, y + Math.sin(a) * lr * flat * 1.5, br * 1.4, br * flat])
            }
          }
          const inside = (x, y) => lobes.some(([lx, ly, a, b]) => ((x - lx) / a) ** 2 + ((y - ly) / b) ** 2 < 1)
          const x0 = Math.min(...lobes.map(([lx, , a]) => lx - a))
          const x1 = Math.max(...lobes.map(([lx, , a]) => lx + a))
          const y0 = Math.min(...lobes.map(([, ly, , b]) => ly - b))
          const y1 = Math.max(...lobes.map(([, ly, , b]) => ly + b))
          // its soft wash, lobe by lobe, so that what shows between its strokes is its own colour and not the water
          lobes.forEach(([lx, ly, a, b]) => {
            put((n += 1), {
              x: lx,
              y: ly,
              long: a * 0.95,
              wide: b / a,
              blur: a * 0.3,
              paints: ['tcCloudWash', 'tcCloudWash'],
              load: 0.85 * inn(ly),
              kind: TC_HAZE,
              order: 559.5,
            })
          })
          const pitch = 3.6 * px
          const scan = 2
          let row = 0
          for (let y = y0 + pitch / 2; y < y1; y += pitch, row += 1) {
            // its runs along this row, each broken into strokes with a little water between them now and then
            let start = null
            for (let x = x0; x <= x1 + scan; x += scan) {
              const isIn = x <= x1 && inside(x, y)
              if (isIn && start === null) {
                start = x
              } else if (!isIn && start !== null) {
                let a = start
                let k = 0
                while (a < x - 2) {
                  const q = c * 7919 + row * 131 + k * 17 + Math.round(start)
                  const piece = (70 + 120 * hashed(q * 1.3)) * sc
                  const b = Math.min(x, a + piece)
                  const long = (b - a) / 2
                  if (long > 1.5) {
                    const yy = y + (hashed(q * 2.9) - 0.5) * 0.35 * pitch
                    const lit = clamp(0.5 - (yy - cy) / (R * flat) + (hashed(q * 4.1) - 0.5) * 0.6, 0, 1)
                    /* (Each laid as a stroke standing upright and far wider than it is long, so that it is level on the
                       water: the strokes' shader lights every stroke from above across its width, paler along its upper
                       side and deeper along its lower, which on rows of level strokes is a stripe a row, and on an upright
                       one runs along its short length instead, where it hardly shows. One paint a stroke, for the same
                       reason.) */
                    const thick = pitch * 0.95
                    const paint = lit > 0.55 ? 'tcCloudLit' : 'tcCloud'
                    put((n += 1), {
                      x: (a + b) / 2,
                      y: yy,
                      long: thick,
                      wide: long / thick,
                      turn: Math.PI / 2,
                      blur: 0.9,
                      paints: [paint, paint],
                      load: 0.94 * inn(yy),
                      kind: TC_HAZE,
                      order: 560,
                    })
                  }
                  a = b + (1 + 2 * hashed(q * 3.7)) * sc
                  k += 1
                }
                start = null
              }
            }
          }
        })

        /* The ripples (see `ripple`): every ring a crest of light beside a trough of shade. Water mirrors the sky, which
           is brightest where the sun is, up to the left, so the slope of a crest that faces that way is lit and the other
           is in shade: on the far side of a ring its outer slope, on the near side its inner one, and at its two ends,
           whose slopes face across, it is faint, so that a ring reads as two long arcs, as a real one seen at a slant does.
           Along it the light comes and goes as the sky it mirrors does, brightest towards the sun, so that it breaks into
           arcs of light as the reference's swirl does. The light is a fine bright line and the shade broader and softer,
           as much of the one as of the other, so that the ripple is no lighter or darker than the water, only livelier.
           Each ring is laid in strokes overlapping three deep, so that they join into one line, a little uneven as a brush
           leaves it. (Laid under the lily pads, which float on the ripples, and over the fine lines, the clouds'
           reflections and the water's body; and marked as mist, so that where a ring spreads up to the top of the pond it
           thins away into the grain as everything there does.) */
        const RIPPLE_STEPS = 120
        const rippleStep = (Math.PI * 2) / RIPPLE_STEPS
        const sunWay = Math.atan2(-0.9, -0.45)
        // (on a narrow canvas the rings run closer together, and where the shade of one lies over the next's it darkens
        // less than the two would apart, so it is laid a little deeper there to keep the light and the shade even)
        const deep = 1 + 0.35 * clamp((1232 - w) / 842, 0, 1)
        TC_RIPPLE.rings.forEach(([, , strength], ring) => {
          const from = hashed(ring * 3.7 + 0.4) * Math.PI * 2
          for (let j = 0; j < RIPPLE_STEPS; j += 1) {
            const way = from + (j + 0.5) * rippleStep
            const toSun = way - sunWay
            // how squarely its slopes face the sun (1 the outer, -1 the inner), and how bright the sky it mirrors there is
            const facing = clamp(Math.cos(toSun) * 1.5, -1, 1)
            const sky = clamp(
              0.58 + 0.32 * Math.cos(toSun) + 0.16 * Math.sin(toSun * 3 + 1.3) + 0.14 * Math.sin(way * 4 + ring * 2.3),
              0.12,
              1.15,
            )
            const much = 0.2 + 0.8 * Math.abs(facing)
            // (the light on the slope that faces the sun and the shade on the other, crossing over smoothly at the ends)
            const side = clamp(facing * 3, -1, 1)
            const q = ring * 1000 + j
            rand.reseed(73001 + q * 7919)
            rippleDab(garden, TC_RIPPLE, {
              ring,
              way,
              arc: rippleStep * 3,
              out: 0.6 * side,
              thick: 0.85 * (0.8 + 0.4 * hashed(q * 2.9)),
              blur: 0.35,
              paints: ['tcRipple', 'tcRipple'],
              load: Math.min(1, 0.94 * sky * much * (0.85 + 0.3 * hashed(q * 1.3))),
              kind: TC_LEAF_MIST,
              order: 561.8 + ring * 0.0001,
            })
            rippleDab(garden, TC_RIPPLE, {
              ring,
              way,
              arc: rippleStep * 3,
              out: -1.7 * side,
              thick: 1.4,
              blur: 1.1,
              paints: ['tcRippleShade', 'tcRippleShade'],
              load: 0.48 * deep * much * (0.9 + 0.2 * hashed(q * 4.7)),
              kind: TC_LEAF_MIST,
              order: 561.75 + ring * 0.0001,
            })
            // and the shaded slope, a broad soft swell of the shade out beyond the trough, every third step
            if (j % 3 === 0) {
              rippleDab(garden, TC_RIPPLE, {
                ring,
                way,
                arc: rippleStep * 7.5,
                out: -3.6 * side,
                thick: 2.4,
                blur: 2.6,
                paints: ['tcRippleShade', 'tcRippleShade'],
                load: 0.16 * deep * much,
                kind: TC_HAZE_MIST,
                order: 561.7 + ring * 0.0001,
              })
            }
          }
          /* and glints of sun on its crest, a few to a strong ring, riding out with it: only where the crest faces the sun,
             so that from ring to ring they line up on the way from the middle towards it, as the sun's glitter on real
             water does; as a drop falls they flash in the middle, where its rings start */
          if (strength < 0.7) {
            return
          }
          for (let k = 0; k < 3; k += 1) {
            const q = ring * 31 + k
            const way = sunWay + (hashed(q * 2.3 + 0.7) - 0.5) * 0.8
            const r = (1.7 + 1.6 * hashed(q * 4.1) ** 2) * Math.max(0.8, sc)
            const id = 60000 + q
            // (a fleck drawn out along the crest, on its light)
            const glint = { ring, way, out: 0.6 }
            rand.reseed(71001 + id * 7919)
            rippleDab(garden, TC_RIPPLE, {
              ...glint,
              long: r * 1.8,
              thick: r,
              blur: r * 0.8,
              paints: ['tcGlintGlow', 'tcGlintGlow'],
              load: 0.22,
              kind: TC_GLIMMER_MIST,
              order: 570,
            })
            rand.reseed(71001 + id * 7919)
            rippleDab(garden, TC_RIPPLE, {
              ...glint,
              long: r * 2,
              thick: r * 0.45,
              blur: r * 0.15,
              paints: ['tcGlint', 'tcGlint'],
              load: 1,
              kind: TC_GLIMMER_MIST,
              order: 570.001,
            })
          }
        })
        /* (The count of strokes runs on past the eight rings this pond had when its ripple was painted standing still, so
           that every stroke after them keeps the seed, and so the brush, it had then: its fine lines and pads are as they
           were.) */
        const rcx = words.x
        const rcy = (bandTop + bandFoot) / 2
        for (let ring = 0; ring < 8; ring += 1) {
          const rx = (9 + 19 * ring + 3.1 * ring * ring) * rs
          const ry = rx * flat
          const steps = Math.max(
            8,
            Math.floor((Math.PI * 2 * Math.sqrt((rx * rx + ry * ry) / 2)) / ((6 + ring * 0.7) * rs)),
          )
          const fadeOut = (1 - ring / (8 + 0.3)) ** 1.35
          const arcs = 1 + Math.floor(hashed(ring * 7.1) * 3)
          const from = hashed(ring * 3.7) * Math.PI * 2
          for (let j = 0; j < steps; j += 1) {
            const a = from + ((j + 0.3 * hashed((ring * 1000 + j) * 2.3)) / steps) * Math.PI * 2
            const y = rcy + Math.sin(a) * ry * (1 + 0.03 * Math.sin(a * 3 + ring * 1.3) + 0.02 * Math.sin(a * 5 + ring))
            if (
              (((a - from) / (Math.PI * 2)) * arcs) % 1 <= 0.86 - 0.04 * ring &&
              inn(y) * fadeOut >= 0.03 &&
              y <= h - 4
            ) {
              n += 2
            }
          }
        }

        /* The fine wavy lines of light on the water, as in the folk-art pond: long and low, each a crest or two, many and
           small far off and fewer and longer near, a few in the water's shade; under the pads, which lie on them, and
           bent by the ripple's rings where they cross them. */
        const WAVES = Math.round(220 * Math.min(1.6, w / 1232))
        for (let k = 0; k < WAVES; k += 1) {
          const f = 0.04 + 0.94 * hashed(k * 3.7 + 1.1) ** 0.8
          const y = at(f)
          const x = hashed(k * 5.9 + 0.3) * w
          const fade = inn(y)
          if (fade < 0.05 || hashed(k * 9.3) > fade + 0.15) {
            continue
          }
          const len = (20 + 26 * hashed(k * 2.3)) * (0.55 + 0.6 * f) * sc
          const amp = (0.75 + 0.55 * f) * px
          const crests = 1.25 + 1.25 * hashed(k * 4.1)
          const deep = hashed(k * 7.7) < 0.3
          const pieces = Math.ceil(crests * 5)
          const shift = hashed(k * 6.3) * Math.PI * 2
          const yAt = (u) => y + Math.sin(u * crests * Math.PI * 2 + shift) * amp
          for (let p = 0; p < pieces; p += 1) {
            const u0 = p / pieces
            const u1 = (p + 1) / pieces
            const x0 = x + (u0 - 0.5) * len
            const x1 = x + (u1 - 0.5) * len
            const y0 = yAt(u0)
            const y1 = yAt(u1)
            const seg = Math.hypot(x1 - x0, y1 - y0)
            // thinner at its two ends
            const taper = Math.sin(Math.PI * ((p + 0.5) / pieces)) ** 0.7
            put((n += 1), {
              x: (x0 + x1) / 2,
              y: (y0 + y1) / 2,
              long: seg * 0.62,
              wide: clamp(((0.5 + 0.25 * f) * px * taper) / Math.max(0.5, seg * 0.62), 0.05, 0.7),
              turn: Math.atan2(y1 - y0, x1 - x0),
              blur: 0.45,
              paints: deep ? ['tcWaveDeep', 'tcWaveDeep'] : ['tcWave', 'tcWave'],
              load: (deep ? 0.45 : 0.75) * fade,
              kind: TC_LEAF_MIST,
              order: 561.5,
              // (bent by the ripple's rings as they cross it, see `ripple`)
              phase: 600,
            })
          }
        }

        /* The lily pads: drifts of them low in the pond, under the koi's band, larger near and smaller far, and a few at
           the sides; each round, a little flattened as the pond is, with its notch, lit along its upper left from the sun
           and deep at its lower right, its veins running out from its middle, its rim catching the light, and its shadow
           on the water under it. Painted far to near. */
        const pads = []
        const DRIFTS = [
          [0.02, 1.3],
          [0.15, 1],
          [0.3, 0.5],
          [0.66, 0.45],
          [0.83, 1],
          [0.98, 1.3],
        ]
        DRIFTS.forEach(([fx, much], d) => {
          const many = Math.round((1 + 3 * much) * Math.min(1.3, w / 1232) ** 0.5)
          for (let k = 0; k < many; k += 1) {
            const q = d * 41 + k
            const x0 = fx * w + (hashed(q * 3.3) - 0.5) * (0.12 * w + 80)
            const r = (12 + 17 * hashed(q * 2.7) ** 1.3) * rs * (0.8 + 0.4 * much) * Math.min(1, 0.6 + (0.4 * w) / 1232)
            // (clear of the koi's band, and of the shadows the lowest of them cast as they weave down in it)
            const from = bandFootAt(x0) + 44 * rs + r * flat
            // (and wholly out of the picture's last tenth, where they would heap into a bank as it thins into the grain)
            const to = h - 0.1 * pic - r * flat
            if (from > to - 4) {
              continue
            }
            const y = from + (0.05 + 0.75 * hashed(q * 1.9)) * Math.max(4, to - from)
            const near = clamp((y - top) / pic, 0, 1)
            pads.push({ x: x0 + (hashed(q * 4.4) - 0.5) * r, y, r: r * (0.75 + 0.45 * near), q })
          }
        })
        pads.sort((a, b) => a.y - b.y)
        // a pad that a nearer one would cover much of is left out, so that they float apart, singly and in twos, as the
        // folk-art pond's do, and never heap into a hedge
        const kept = []
        pads
          .slice()
          .reverse()
          .forEach((p) => {
            if (!kept.some((o) => Math.hypot(o.x - p.x, (o.y - p.y) / flat) < (o.r + p.r) * 0.75)) {
              kept.push(p)
            }
          })
        kept.reverse()
        kept.forEach((p) => {
          const { x: cx, y: cy, r, q } = p
          const fade = inn(cy)
          const notch = -Math.PI / 2 + (hashed(q * 5.7) - 0.5) * 4.4
          const notchHalf = 0.2 + 0.1 * hashed(q * 6.1)
          const base = 562 + (cy / h) * 0.9
          const inNotch = (a, margin = 0) =>
            Math.abs(((a - notch + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < notchHalf + margin
          const warm = hashed(q * 9.1) < 0.35
          const P = (g) => `${warm ? 'tcPadW' : 'tcPad'}${clamp(Math.round(g), 0, 6)}`
          const tone = (hashed(q * 7.9) - 0.5) * 1.4
          // its shadow on the water, below and to the right
          put((n += 1), {
            x: cx + 0.1 * r,
            y: cy + 0.22 * r * flat,
            long: r * 1.04,
            wide: flat,
            blur: r * 0.2,
            paints: ['tcPadShadow', 'tcPadShadow'],
            load: 0.34 * fade,
            order: base,
          })
          // its body, ring by ring out from its middle, round the notch, each dab laid along the way out, as the veins run,
          // in paint with a clean edge, so that it floats flat on the water rather than heaping up as moss does
          const s = Math.max(3.4 * px, r * 0.24)
          for (let rho = 0.1; rho < 0.98; rho += (s / r) * 0.85) {
            const ringCount = Math.max(3, Math.ceil((Math.PI * 2 * rho * r) / (s * 0.85)))
            for (let j = 0; j < ringCount; j += 1) {
              const a = ((j + 0.5 * (Math.round(rho * 10) % 2)) / ringCount) * Math.PI * 2
              // (clear of the notch by half a dab, so that its edges stay clean)
              if (inNotch(a, (0.45 * s) / Math.max(1, rho * r))) {
                continue
              }
              const qq = q * 977 + Math.round(rho * 40) * 31 + j * 7
              const u = Math.cos(a) * rho
              const v = Math.sin(a) * rho
              // lit a little from the upper left, a little lighter towards its rim, and a few blotches of its own: flat, as
              // a pad floating on the water is, and not domed
              const g = 2.9 + tone - 0.6 * u - 0.7 * v + 0.3 * rho + (hashed(qq * 0.13) - 0.5) * 0.5
              const dab = s * (0.72 + 0.3 * hashed(qq * 0.17))
              // (the outer ones laid along the rim, so that its edge is smooth)
              const rim = rho > 0.7
              put((n += 1), {
                x: cx + u * r,
                y: cy + v * r * flat,
                long: dab * (rim ? 1.1 : 1),
                wide: rim ? 0.6 : 0.7,
                turn: rim ? Math.atan2(Math.cos(a) * flat, -Math.sin(a)) : Math.atan2(Math.sin(a) * flat, Math.cos(a)),
                blur: dab * 0.22,
                paints: [P(g + 0.2), P(g - 0.2)],
                load: 0.96 * fade,
                kind: TC_HAZE,
                order: base + 0.001,
              })
            }
          }
          // the middle, where the veins meet
          put((n += 1), {
            x: cx,
            y: cy,
            long: s * 0.7,
            wide: flat * 1.15,
            blur: s * 0.2,
            paints: [P(3.2 + tone), P(2.4 + tone)],
            load: 0.96 * fade,
            kind: TC_HAZE,
            order: base + 0.002,
          })
          // the veins, out from the middle, fine and a little lighter than the pad, as the folk-art pond's are
          const veins = 9 + Math.floor(hashed(q * 8.3) * 4)
          if (r > 9 * px) {
            for (let k = 0; k < veins; k += 1) {
              const a = notch + notchHalf + 0.18 + (k / (veins - 1)) * (Math.PI * 2 - 2 * notchHalf - 0.36)
              const x0 = cx + Math.cos(a) * r * 0.1
              const y0 = cy + Math.sin(a) * r * flat * 0.1
              const x1 = cx + Math.cos(a) * r * 0.86
              const y1 = cy + Math.sin(a) * r * flat * 0.86
              const long = Math.hypot(x1 - x0, y1 - y0) / 2
              put((n += 1), {
                x: (x0 + x1) / 2,
                y: (y0 + y1) / 2,
                long,
                wide: clamp((0.6 * px) / long, 0.005, 0.2),
                turn: Math.atan2(y1 - y0, x1 - x0),
                blur: 0.45,
                paints: ['tcPadVein', 'tcPadVein'],
                load: 0.42 * fade,
                kind: TC_LEAF_MIST,
                order: base + 0.003,
              })
            }
          }
          // its rim, a fine light edge, brightest on the side the sun is on
          const rimCount = Math.ceil((Math.PI * 2 * r) / (s * 0.7))
          for (let j = 0; j < rimCount; j += 1) {
            const a = ((j + 0.5) / rimCount) * Math.PI * 2
            if (inNotch(a)) {
              continue
            }
            const lit = clamp(-(Math.cos(a) * 0.6 + Math.sin(a) * 0.8), 0, 1)
            const dab = s * 0.5
            put((n += 1), {
              x: cx + Math.cos(a) * r * 0.97,
              y: cy + Math.sin(a) * r * flat * 0.97,
              long: dab,
              wide: clamp((0.7 * px) / dab, 0.08, 0.5),
              turn: Math.atan2(Math.cos(a) * flat, -Math.sin(a)),
              blur: 0.5,
              paints: lit > 0.2 ? ['tcPadRim', 'tcPadRim'] : [P(1.5 + tone), P(1.5 + tone)],
              load: (0.2 + 0.25 * lit) * fade,
              kind: TC_LEAF_MIST,
              order: base + 0.004,
            })
          }
        })

        /* The glints: sun sparkling on the water by day, half of them round the ripple, and stars in it at night (and more
           riding the ripple's rings). */
        for (let k = 0; k < 80; k += 1) {
          const onRings = hashed(k * 6.1 + 0.2) < 0.5
          let x
          let y
          if (onRings) {
            const a = hashed(k * 3.3) * Math.PI * 2
            const rr = (10 + 230 * hashed(k * 2.9) ** 1.6) * sc
            x = rcx + Math.cos(a) * rr
            y = rcy + Math.sin(a) * rr * flat
          } else {
            x = hashed(k * 4.7 + 0.9) * w
            y = at(0.08 + 0.88 * hashed(k * 2.1 + 0.7))
          }
          const fade = inn(y)
          if (fade < 0.15) {
            continue
          }
          const r = (1.2 + 2 * hashed(k * 7.3) ** 2) * Math.max(0.8, sc)
          const id = 50000 + k
          // now and then a fleck drawn out across the water rather than a point
          const fleck = hashed(k * 8.9) < 0.4
          // (its glow small and faint, so that at night it reads as a star in the water and not as a firefly over it)
          put(id, {
            x,
            y,
            long: r * 1.4,
            wide: 1,
            blur: r * 0.8,
            paints: ['tcGlintGlow', 'tcGlintGlow'],
            load: 0.14 * fade,
            kind: TC_GLIMMER,
            order: 570,
          })
          put(id, {
            x,
            y,
            long: r * (fleck ? 1.6 : 0.6),
            wide: fleck ? 0.3 : 1,
            blur: r * 0.2,
            paints: ['tcGlint', 'tcGlint'],
            load: fade,
            kind: TC_TWINKLE,
            order: 570.001,
          })
        }

        /* The koi. Each painted facing right round the canvas's middle (the shader carries it where it is, see
           schoolVertex), seen from above: a soft light round it, its shadow on the pond's floor below and to the right, its
           tail's two lobes and its fins, translucent, a slender body round at the head and narrowing to its tail, the
           saddles of its coat across its back, and a sheen along its head. Its pectoral fins paddle (phases
           400.2 and 400.4 swing either way) and its tail sways with the school's wag. */
        const hx = half
        const hy = h / 2
        const koiScale = TC_KOI_SCALE(w)
        TC_KOI.forEach((f, i) => {
          const len = f.size * koiScale
          const coat = TC_COATS[f.coat]
          const phase = 400 + i
          const base = 2000 + i * 0.1
          const id = 90000 + i * 80
          const kAt = (lx, ly) => ({ x: hx + lx * len, y: hy + ly * len })
          const hk = (k) => tcHash(i * 7.31 + k * 1.93 + 0.17)
          let m = 0
          const part = (o) => put(id + (m += 1), { blur: len * 0.012, kind: TC_LEAF, ...o, phase: o.phase ?? phase })
          part({
            ...kAt(-0.05, 0.02),
            long: len * 0.66,
            wide: 0.46,
            blur: len * 0.42,
            paints: ['tcKoiGlow', 'tcKoiGlow'],
            load: 0.2,
            kind: TC_HAZE,
            order: base,
          })
          // its shadow, on the floor of the pond
          const sx = 0.07
          const sy = 0.17
          part({
            ...kAt(-0.02 + sx, sy),
            long: len * 0.36,
            wide: 0.24,
            blur: len * 0.07,
            paints: ['tcKoiShadow', 'tcKoiShadow'],
            load: 0.3,
            kind: TC_HAZE,
            order: base + 0.0005,
          })
          part({
            ...kAt(-0.47 + sx, sy),
            long: len * 0.14,
            wide: 0.48,
            blur: len * 0.06,
            paints: ['tcKoiShadow', 'tcKoiShadow'],
            load: 0.16,
            kind: TC_HAZE,
            order: base + 0.0006,
          })
          // its tail, two lobes fanned out behind, a streak of its colour along each, and the root of it between them
          ;[-1, 1].forEach((side) => {
            part({
              ...kAt(-0.5, side * 0.055),
              long: len * 0.16,
              wide: 0.34,
              turn: side * 0.36,
              blur: len * 0.02,
              paints: ['tcKoiFinWhite', coat.fin],
              load: 0.66,
              order: base + 0.001,
            })
            part({
              ...kAt(-0.47, side * 0.04),
              long: len * 0.1,
              wide: 0.12,
              turn: side * 0.3,
              blur: len * 0.012,
              paints: [coat.body, coat.fin],
              load: 0.32,
              order: base + 0.0011,
            })
          })
          part({
            ...kAt(-0.41, 0),
            long: len * 0.055,
            wide: 0.55,
            blur: len * 0.012,
            paints: [coat.body, coat.fin],
            load: 0.8,
            order: base + 0.0012,
          })
          // its pectoral fins, broad and rounded, out and back from behind its head, paddling; its pelvic fins behind them
          ;[-1, 1].forEach((side) => {
            part({
              ...kAt(0.1, side * 0.13),
              long: len * 0.09,
              wide: 0.6,
              turn: side * 0.85,
              blur: len * 0.016,
              paints: ['tcKoiFinWhite', coat.fin],
              load: 0.66,
              order: base + 0.0015,
              phase: phase + (side < 0 ? 0.2 : 0.4),
            })
            part({
              ...kAt(-0.15, side * 0.08),
              long: len * 0.05,
              wide: 0.5,
              turn: side * 0.7,
              blur: len * 0.012,
              paints: ['tcKoiFinWhite', coat.fin],
              load: 0.55,
              order: base + 0.0016,
            })
          })
          // its body, snout to tail, in round dabs along it, each as wide as the koi is there
          for (let lx = 0.255; lx > -0.4; lx -= 0.034) {
            const hw = tcHalfAt(lx)
            const long = lx > 0.2 ? 0.06 : 0.055
            part({
              ...kAt(lx, 0),
              long: len * long,
              wide: clamp(hw / long, 0.3, 1.4),
              paints: [coat.body, coat.body],
              load: 0.97,
              kind: TC_HAZE,
              order: base + 0.002,
            })
          }
          // the saddles of its coat across its back, each in dabs along it, ragged at their edges and now and then
          // leaving a little of one side
          coat.saddles.forEach(([lx0, lx1, much, side], j) => {
            // each lies a little to one side, and is broadest in its middle and rounded at its ends, as a blotch is
            const lean = side ?? (hk(j * 19 + 3) - 0.5) * 2
            const steps = Math.max(2, Math.round((lx0 - lx1) / 0.036))
            for (let k = 0; k <= steps; k += 1) {
              const t = k / steps
              const lx = lx0 - t * (lx0 - lx1)
              const hw = tcHalfAt(lx)
              const cover =
                hw *
                clamp(
                  much * (0.5 + 0.5 * Math.sin(Math.PI * (0.1 + 0.8 * t)) ** 0.5) * (0.6 + 0.6 * hk(j * 9 + k * 1.7)),
                  0.25,
                  1,
                )
              const off = Math.max(0, hw - cover) * (lean + (hk(j * 5 + k * 2.3) - 0.5) * 0.4)
              const long = 0.04 + 0.014 * hk(j * 3 + k * 2.9)
              part({
                ...kAt(lx + (hk(j * 7 + k * 3.1) - 0.5) * 0.012, off),
                long: len * long,
                wide: clamp(cover / long, 0.3, 1.6),
                turn: (hk(j * 11 + k * 1.3) - 0.5) * 0.5,
                blur: len * 0.018,
                paints: [coat.patch, coat.patch],
                load: 0.9,
                kind: TC_HAZE,
                order: base + 0.003,
              })
            }
          })
          // the shade along its far side from the sun
          part({
            ...kAt(-0.04, 0.062),
            long: len * 0.24,
            wide: 0.08,
            blur: len * 0.025,
            paints: ['tcKoiShade', 'tcKoiShade'],
            load: coat.body === 'tcKoiWhite' ? 0.08 : 0.24,
            kind: TC_HAZE,
            order: base + 0.0035,
          })
          // the sheen along its head and back, wet in the sun
          part({
            ...kAt(0.13, -0.022),
            long: len * 0.12,
            wide: 0.14,
            paints: ['tcKoiSheen', 'tcKoiSheen'],
            load: 0.45,
            order: base + 0.005,
          })
        })
      },
    }

    /* --- the travel page's hero ------------------------------------------------------------------------------ */

    /* The hero of /use-cases/travel, after Cameron's two pictures: a broad golden hill rising from the left under a deep
       blue sky, lit gold with a deep orange-gold shadow sweeping across it, its knoll on the left and a pale rose-gold hill
       far off at the right; and at its foot, after the second picture, a bed of soft yellow and cream flowers in flat dabs
       with a small white cat peeking out of it. The sky comes in from nothing under the buttons, as the overview's forest's
       mist does; the hill's crest rises beside the words on the left, against the page there, never over them. Now and
       then the wind runs through the bed from the left, as the e-commerce hero's dog does through its meadow (it is the
       home page's unseen passer, see `passer`): the flowers and the grass among them part round it and spring back after
       it, a swath of the bed just behind it lies swept over with it, its stems dark against the bed and lit at their tips (painted, as the
       e-commerce hero's swept grass is, so that a still shows it too), and a few pale petals fly after it, a little
       behind it and above, rising and falling. Along its way the bed is calm in the breeze, so that the wind's parting
       stands out. By day it is a golden afternoon; at night the same hill at dusk under a moon, still glowing, the cat
       still white. */
    const TR_EVEN = 0.005
    const TR_HAZE = 0.4 + TR_EVEN
    const TR_LEAF = 0.25
    const TR_ROUND = 0.25 + TR_EVEN
    const TR_TWINKLE = 3.25 + TR_EVEN
    const TR_GLIMMER = 3.4 + TR_EVEN
    // (its own, as in a one-file build the engine's smooth and clamp come after this, worked out as it loads)
    const trSmooth = (a, b, v) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }
    const trLerp = (a, b, t) => a + (b - a) * t
    // (and its hashed likewise)
    const trHash = (value) => {
      const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    // how large the scene's strokes are drawn on a canvas this wide, as the forest's are
    const TR_SCALE = (w) => Math.max(0.5, Math.min(w / 1232, 1.15 + Math.max(0, w - 1600) / 2600))
    /* Where the sky's lines come in from the page, down the canvas, as the overview's forest's mist does: from nothing just
       under the buttons' foot to their full more than halfway down the picture. */
    const trFadeAt = (stage) => {
      const foot = stage.words.y + stage.words.b
      return [foot - 2, foot + (stage.h - foot) * 0.6]
    }
    /* The scene's layout on a stage, in CSS pixels: the picture under the buttons, the knoll (`r` is its breadth, `ox` where
       it is across and `by` how high), the hill's crest and the far hill's. On a canvas with room beside the words the
       knoll rises at the left, up against the page beside them; where the words take the canvas's width, as on a phone,
       it comes down into the picture. */
    const trLayout = ({ w, h, words }) => {
      const top = words.y + words.b + 3
      const pic = h - top
      const sc = TR_SCALE(w)
      const side = words.x - words.a - 70 * Math.min(1, sc)
      const rWide = Math.min(105 * sc, side / 2.1)
      const low = 1 - trSmooth(46, 70, rWide)
      const r = trLerp(rWide, Math.min(104, Math.max(60, 0.21 * w)), low)
      const ox = trLerp(Math.max(1.05 * rWide, side - rWide), 0.27 * w, low)
      // (on a phone it rises well into the picture, so that the sky over it is no wider than the picture needs)
      const by = trLerp(top - 0.035 * pic, top + 0.05 * pic + 0.85 * r, low)
      // the crest: highest a little left of the knoll's middle, falling gently to the left and in a long slope to the right
      const px = ox - 0.2 * r
      const foot = top + trLerp(0.46, 0.62, low) * pic
      // (rounded over to the left as a knoll is, rather than lying level out to the canvas's edge)
      const lDrop = Math.min(trLerp(0.2, 0.08, low) * pic, trLerp(34, 18, low) * sc)
      const lLen = trLerp(2.4, 1.6, low) * r
      const edge = words.x - words.a
      // (falling a little faster beside the words, so the gold slope keeps well under the buttons' foot)
      const rLen = trLerp(0.82 * Math.min((words.x - px) / 0.8, Math.max(60, edge - px) / 0.55), (w - px) / 1.5, low)
      const x0 = px + 0.9 * rLen
      const crest = (x) => {
        if (x <= px) {
          return by - 2 + lDrop * (1 - Math.exp(-(((px - x) / lLen) ** 2)))
        }
        const s = (x - px) / rLen
        return (
          by -
          2 +
          (foot - by + 2) * (1 - Math.exp(-s * s)) +
          0.08 * pic * Math.max(0, (x - x0) / Math.max(1, w - x0)) ** 1.7
        )
      }
      // the far hill, a pale dome at the right behind the long slope
      const fx = trLerp(0.96, 0.9, low) * w
      const fy = top + trLerp(0.3, 0.48, low) * pic
      const fw = trLerp(0.28, 0.42, low) * w
      const far = (x) => {
        const u = (x - fx) / fw
        return fy + (0.5 * pic * u * u) / (1 + 0.6 * u * u)
      }
      // the flower bed's top along the front, the cat, and the wind's way through the bed (see `passer`)
      const bed = h - trLerp(0.32, 0.29, low) * pic
      const catX = trLerp(0.8, 0.76, low) * w
      const pass = bed + 0.36 * (h - bed)
      return { top, pic, sc, low, r, ox, by, crest, far, bed, catX, pass }
    }
    /* How the wind runs through the bed, so that the passer keeps pace with its petals on any canvas (as the e-commerce
       hero's dog does): the school is scaled with the canvas's width (see `size`), so its round takes the same time on all
       of them, and the passer's walk across and its round are those times. The wind crosses any canvas in TR_CROSS
       seconds; at the clock's start it is TR_START of the width across (off the left, so it comes in a moment after the
       page opens). TR_LEN is the swept wake's length to the school (the school's first fish, see TR_FISH), more than it
       is ever drawn: it sets the run in and out at the sides, which must be at least the passer's own (it walks 1.15
       widths a round), so that the two come round together, and more than the wake reaches behind the wind (see trWakeD),
       so that the wake is out of sight, all of it, before it comes round again. */
    const TR_UNIT = 1232
    const TR_CROSS = 15
    const TR_LEN = 90
    const TR_MARGIN = (2.5 * TR_LEN) / TR_UNIT
    const TR_SPAN = 1 + 2 * TR_MARGIN
    const TR_START = -0.1
    const TR_PHASE = (TR_START + TR_MARGIN) / TR_SPAN
    /* The width of the canvas the school last flew over (set as it is placed). The school's pace goes with the width, and
       so would its petals' rise and fall and their surge ahead and back, which on a phone would leave them all but still:
       those are given back in the page's pixels instead, as the scene's strokes are sized. */
    let trW = TR_UNIT
    const trFlutter = () => Math.max(0.8, TR_SCALE(trW)) / (trW / TR_UNIT)
    // where the wind's way lies, as one of the passer's lanes (from its top, 0, to its foot, 1), set as the land is laid out
    let trLane = 0.9
    /* How large the swept wake is drawn on a canvas this wide (its unit, D, in CSS pixels): as the bed's flowers are,
       and never so large that it reaches further behind the wind than the school's run at the sides hides (it reaches
       about 1.45 D behind; see TR_LEN). */
    const trWakeD = (w) => Math.min(62 * Math.max(0.8, TR_SCALE(w)), (0.55 * 2.5 * TR_LEN * w) / TR_UNIT)
    /* The school: first the swept wake, riding level on the wind's way with it, its blades flicking a little (a wave
       running back along them); then the petals after the wind, each a petal of the bed's, at the wind's pace, a little
       behind it and above, rising and falling slowly and turning over as it goes (its `flap`, about its own middle). */
    const TR_PETALS = 7
    // the petals' lanes, from the band's top (0) down to the wind's way (1), keep to the top 70 of its 92 pixels
    const TR_PETAL_DEPTH = 70 / 92
    const TR_FISH = [
      {
        size: TR_LEN,
        speed: TR_UNIT / TR_CROSS,
        lane: 1,
        phase: TR_PHASE,
        drift: 0,
        period: 4,
        surge: 0,
        surgePeriod: 0,
        beat: 0.7,
        wag: 0.015,
        flap: 0,
        glide: 0,
        seed: 0.31,
      },
      ...Array.from({ length: TR_PETALS }, (_, k) => {
        const g = (j) => trHash(k * 7.9 + j * 3.3 + 1.7)
        const drift = 5 + 7 * g(2)
        const surge = 4 + 7 * g(4)
        return {
          size: 8,
          speed: TR_UNIT / TR_CROSS,
          lane: (0.12 + 0.68 * g(1)) * TR_PETAL_DEPTH,
          phase: TR_PHASE - (0.015 + 0.085 * ((k * 0.618034 + 0.2) % 1)) / TR_SPAN,
          get drift() {
            return drift * trFlutter()
          },
          period: 2.6 + 1.8 * g(3),
          get surge() {
            return surge * trFlutter()
          },
          surgePeriod: 3 + 2.5 * g(5),
          beat: 0.45 + 0.4 * g(6),
          wag: 0,
          flap: 0.9 + 0.5 * g(7),
          glide: 0,
          seed: g(8),
          ...(k >= 5 ? { from: 700 } : {}),
        }
      }),
    ]
    // a line of the layout as a guide of the land, in its rooms, from one place across to another
    const trGuide =
      (line, from = -1.6) =>
      (stage) => {
        const f = line(trLayout(stage))
        const count = Math.round((1.6 - from) / 0.05)
        return Array.from({ length: count + 1 }, (_, k) => {
          const across = from + k * 0.05
          return [across, (f(((across + 1) * stage.w) / 2) - stage.base) / stage.room]
        })
      }
    const TR_INKS = {
      ...SK_INKS,
      // the sky: pale where it comes in under the buttons, a deep blue, and lilac at the horizon; at night a dusk indigo
      // with a rose afterglow low down
      trTop: ['#c4d4f5', '#161b3a'],
      trHigh: ['#4a72cf', '#1a2150'],
      trMid: ['#3b67c8', '#1e2656'],
      trLow: ['#7393dc', '#242b5e'],
      trHorizon: ['#9db2e6', '#2e3064'],
      // the golden hill, lit along its crest, and its deep orange-gold shade; at dusk still glowing, deeper
      trCrest: ['#ffd98c', '#f2c070'],
      trGoldLit: ['#fcc552', '#e2a548'],
      trGold: ['#f5b23c', '#d4913a'],
      trAmber: ['#ea9a30', '#bc7834'],
      trShadow: ['#d27a24', '#9a5a2e'],
      trDeep: ['#b8621e', '#7a4228'],
      // the far hill, rose-gold in the sun and mauve in its shade
      trFarLit: ['#f6d0b0', '#c4949a'],
      trFar: ['#e8b49a', '#9a7084'],
      trFarShade: ['#cfa0a0', '#6a5074'],
      // where the wind has just been through the hill's grass, and where a gust goes over it, it shows its paler side
      sheen: ['#ffe9b4', '#f0c682'],
    }
    /* The sky's wash as a ramp of eight, from where it comes in under the buttons down to the horizon, so that it deepens
       smoothly rather than in steps (see skyInk): pale, then the deep blue, a little lighter towards the hills; at dusk
       an indigo. */
    const TR_SKY = {
      day: ['#d2def7', '#a9bdee', '#7f9ce2', '#5a7ed5', '#4a72cf', '#557bd2', '#7090da', '#93abe3'],
      night: ['#171c3c', '#181e42', '#191f48', '#1a214e', '#1c2452', '#1e2656', '#202858', '#22295a'],
    }
    const UC_TRAVEL = {
      ...SKY,
      words: '.uc-copy, .dc-copy, .hl-copy',
      lines: { ...SKY.lines, lift: 0.02, veil: [80, 18], beadChance: 0.025, whole: true },
      inks: TR_INKS,
      fade: {
        at: trFadeAt,
        ease: 1.15,
        pale: 1,
        sparse: 0.95,
        specks: 2.5,
      },
      // the knoll stands up against the page beside the words
      onPage: true,
      flowers: { ...FLOWERS, drifts: [], strays: 0, gorse: 0, slant: 0.86 },
      land: {
        ...SKY.land,
        sheets: [
          // the sky, from just under the buttons' foot down, in the land's fine lines, coming in from nothing
          {
            ...SKY.land.sheets[0],
            fade: true,
            fill: 0.9,
            under: 0.9,
            patch: 0.06,
            paint: [
              [0, 'trTop', 0.4],
              [0.14, 'trTop', 1],
              [0.3, 'trHigh', 1],
              [0.55, 'trMid', 1],
              [0.8, 'trLow', 1],
              [1, 'trHorizon', 1],
            ],
          },
          {
            name: 'far',
            opaque: true,
            laid: true,
            top: trGuide((l) => l.far, 0),
            foot: [
              [0, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'trFarLit', 0],
              [0.006, 'trFarLit', 0.92],
              [0.14, 'trFarLit', 1],
              [0.32, 'trFar', 1],
              [0.55, 'trFarShade', 1],
              [1, 'trFarShade', 1],
            ],
            lean: 0.3,
            fill: 0.88,
            under: 0.85,
            patch: 0.15,
            flow: 0.2,
            breath: 1,
            beads: [1, 0],
          },
          {
            name: 'hill',
            opaque: true,
            // (and the wind's way through the bed, as one of the passer's lanes: it walks from 0.03 under the land's line,
            // here its top, to 0.05 over its foot, 1.3 rooms down)
            top: (stage) => {
              trLane = ((trLayout(stage).pass - stage.base) / stage.room - 0.03) / 1.22
              return trGuide((l) => l.crest)(stage)
            },
            foot: [
              [-1.6, 1.3],
              [1.6, 1.3],
            ],
            paint: [
              [0, 'trGoldLit', 0],
              [0.005, 'trGoldLit', 0.95],
              [0.03, 'trCrest', 1],
              [0.12, 'trGoldLit', 1],
              [0.4, 'trGold', 1],
              [0.75, 'trAmber', 1],
              [1, 'trShadow', 1],
            ],
            lean: 0.34,
            fill: 0.9,
            under: 0.9,
            patch: 0.1,
            flow: 0.3,
            breath: 1.2,
            beads: [1, 0],
            // the grass shows its paler side a little where a gust goes over it and where the wind has just been through
            sheen: 0.55,
          },
          SKY.land.sheets[1],
        ],
      },
      /* The wind through the bed is the home page's unseen passer: it walks the wind's way at the petals' pace, starting
         where the wind is at the clock's start (TR_START) and coming round with them, so the flowers and the grass part
         wherever it goes, and the petals fly after it. */
      passer: {
        first: (-0.075 - TR_START) * TR_CROSS,
        every: TR_SPAN * TR_CROSS,
        across: 1.15 * TR_CROSS,
        get lane() {
          return trLane
        },
        wander: 0,
        // (a breeze, not a body: it leans the flowers by it a little less than the e-commerce hero's dog does)
        push: 1.05,
      },
      /* Broad, as a breath of wind is, and laid at a steady time apart rather than a steady distance, so that on a phone,
         where it goes slower across, its parting runs on smoothly instead of coming and going in pulses. */
      stir: {
        ...STIR,
        reach: 68,
        life: 3,
        get every() {
          return Math.max(2.4, Math.min(9, (9 * trW) / TR_UNIT))
        },
      },
      // the forest's glass: soft frosted wisps at the sides as the petals come in and go out, no long bars, no doubling
      lens: {
        ...LENS,
        foot: 'ease',
        always: true,
        even: true,
        bend: 1.3,
        bandMost: [170, 62],
        split: 0,
        along: 0,
        soften: 2.6,
        halo: [2.6, 0.2],
      },
      school: {
        fish: TR_FISH,
        // scaled with the canvas's width, so that a round takes the same time on any (see TR_CROSS)
        size: (w) => {
          trW = w
          return w / TR_UNIT
        },
        turn: 0.3,
        // the wake on the wind's way, at the band's foot, and the petals from a little over it up to a few flowers' height
        // above it (see TR_PETAL_DEPTH), level, so that most fly over the hill's shade at the bed's top, where they show
        band: ({ w, h, words }) => {
          const { pass } = trLayout({ w, h, words })
          const fs = Math.max(0.8, TR_SCALE(w))
          return [pass - 92 * fs, pass, 0]
        },
        // (the wake reaches far behind the wind and only a little ahead of it, as far as it is drawn on any canvas (see
        // trWakeD), and a petal is drawn about as long as its length to the school)
        reach: [1.75, 0.6],
        // they never swerve from the pointer: the wind does not see it, and the wake keeps with the wind
        scatter: { radius: 1, push: 0, back: 1 },
      },
      paints: {
        ...PAINTS,
        ...Object.fromEntries(TR_SKY.day.map((day, i) => [`trSky${i}`, [day, TR_SKY.night[i]]])),
        // the hill's own shadow sweeping across it, in its shade's inks
        trSweep: ['#d27a24', '#9a5a2e'],
        trSweepDeep: ['#b8621e', '#7a4228'],
        // the grass along the crest
        trBladeLit: ['#ffe0a0', '#ffe2aa'],
        trBlade: ['#f0b048', '#ecb866'],
        trBladeShade: ['#c88634', '#a8702e'],
        // the flower bed: cream, butter, lemon and yolk, their shade and hearts, and the leaves between them
        trCream: ['#fdf6da', '#b8ad88'],
        trButter: ['#fae590', '#b39d58'],
        trLemon: ['#f7d958', '#a8903e'],
        trYolk: ['#f2bd3c', '#a27a32'],
        trPetalShade: ['#ead07e', '#8a7446'],
        trBedLeaf: ['#8aa666', '#3a5434'],
        // the bed's own light under its flowers, butter by day and a dim gold at dusk
        trBedGlow: ['#f4d679', '#86703a'],
        trBedGlowDeep: ['#e9bf58', '#765c30'],
        trBedLeafDeep: ['#62845a', '#24382a'],
        trBedTeal: ['#73a294', '#2c4a44'],
        // the grass among the flowers along the wind's way, and its lit tips
        trWisp: ['#7e9c56', '#344c30'],
        trWispTip: ['#f2df8e', '#9a8a52'],
        // the swath the wind has just swept: its stems' tips catching the light, and the shade between them where the heads
        // have bowed apart
        trWakeTip: ['#fbf3c4', '#b4a670'],
        trWakeShade: ['#5d7c4e', '#1f3126'],
        // the petals the wind carries: cream and butter, pale in the dusk
        trPetalFly: ['#fffcf0', '#f0e8cc'],
        trPetalFlyButter: ['#fff0b0', '#eadcaa'],
        trPetalFlyShade: ['#f1e6c0', '#cfc3a0'],
        trCorn: ['#5574d8', '#5a76d4'],
        trCornDeep: ['#3c56c0', '#3e54aa'],
        // the cat, white by day and by night
        trCat: ['#ffffff', '#f8f6f0'],
        trCatShade: ['#ebe7de', '#d8d3c8'],
        trCatEar: ['#f3dcd4', '#e2c8c0'],
        trCatEye: ['#2a2420', '#1a1512'],
        trCatNose: ['#c4867c', '#b47a72'],
        trWhisker: ['#7a7068', '#b8b0a2'],
        // the afterglow low over the hills at dusk: by day the sky's own blue there
        trDusk: ['#4f78d2', '#5e4672'],
        // the moon and the stars: faint in the afternoon's blue, bright at dusk
        trMoon: ['#ffffff', '#fff6dc'],
        trMoonGlow: ['#ffffff', '#f6e2b0'],
        trMoonSky: ['#f6f8fd', '#fff6dc'],
        trMoonSkyGlow: ['#f6f8fd', '#f6e2b0'],
        trStar: ['#c3d2f2', '#fffaf0'],
        trStarGlow: ['#bccbee', '#fff1cc'],
      },
      plant: (garden) => {
        const { w, h, rand, ground, words } = garden
        const L = trLayout(garden)
        const { top, pic, low } = L
        const sc = L.sc
        // flowers and the cat keep more of their size on a narrow canvas than the width alone would give them
        const fs = Math.max(0.8, sc)
        const crestAt = (x) => ground('hill', x)
        // the horizon: the higher of the hill's crest and the far hill's
        const horizon = (x) => Math.min(crestAt(x), L.far(x))
        let n = 0
        // a stroke standing still where it is painted (rooted under the canvas, its stem up to it)
        const put = ({ x, y, ...o }) => {
          n += 1
          rand.reseed(71001 + n * 7919)
          const root = h + 40
          garden.dab({
            kind: TR_HAZE,
            blur: 0.6,
            load: 0.9,
            turn: 0,
            ...o,
            x,
            y: root,
            stem: root - y,
            lean: 0,
            stiff: 1,
          })
        }
        // a stroke swaying about a root of its own, as one with every other stroke of its phase rooted there
        const swing = ({ x, y, rx, ry, give = 0.1, phase, turn = 0, ...o }) => {
          n += 1
          rand.reseed(71001 + n * 7919)
          const lean = Math.atan2(x - rx, ry - y)
          garden.dab({
            kind: TR_LEAF,
            blur: 0.6,
            load: 0.9,
            ...o,
            turn: turn - 0.7 * lean,
            x: rx,
            y: ry,
            stem: Math.max(0.01, Math.hypot(x - rx, ry - y)),
            lean,
            stiff: 1 - give,
            phase,
          })
        }
        // value noise and a few octaves of it, from the engine's hash
        const noise = (x, y) => {
          const xi = Math.floor(x)
          const yi = Math.floor(y)
          const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
          const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
          const q = (i, j) => hashed(i * 157.31 + j * 311.73 + 0.53)
          const a = q(xi, yi) + (q(xi + 1, yi) - q(xi, yi)) * u
          const b = q(xi, yi + 1) + (q(xi + 1, yi + 1) - q(xi, yi + 1)) * u
          return a + (b - a) * v
        }
        const fbm = (x, y) =>
          (noise(x, y) * 0.5 +
            noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.25 +
            noise(x * 4.07 + 9.7, y * 4.07 + 7.1) * 0.125) /
          0.875

        /* The sky's body: a soft wash over its lines from where it comes in under the buttons down to the horizon, in the
           sky's own colour at each height and as much as it has come in there (a little sooner than the lines), so that its
           lines show through it only as a grain and never as stripes, and none stands alone over the page. Each stroke
           keeps above the horizon under it, so that none lies over the hills. */
        const fade = trFadeAt(garden)
        const body = (y) => trSmooth(fade[0] + 4, fade[0] + 0.42 * (fade[1] - fade[0]), y) ** 1.1
        const skyInk = (y, q, x) => {
          const p = clamp(((y - top) / (0.5 * pic)) * 7, 0, 5)
          const near = x === undefined ? 0 : 1 - trSmooth(0, 26 * fs, horizonUnder(x, 0) - y)
          return `trSky${clamp(Math.round(p + (7 - p) * near + (hashed(q) - 0.5) * 1), 0, 7)}`
        }
        /* Its dabs lie in rows, each as large as the room over the horizon under it allows (small close over the hills,
           broad in the open sky) and as much paint as keeps the wash as solid as it is anywhere else at that height, so
           that it meets the hills with no seam and no band along them. */
        const horizonUnder = (x, half) => {
          let under = 1e9
          for (let u = -1; u <= 1; u += 0.25) {
            const at = x + u * half
            under = Math.min(under, crestAt(at) + 1, L.far(at) + 3)
          }
          return under
        }
        const washTop = top + 4
        const washFoot = Math.max(...Array.from({ length: 33 }, (_, k) => horizon((k / 32) * w)))
        const step = 7
        for (let y = washTop, row = 0; y < washFoot; y += step, row += 1) {
          let x = -30 - hashed(row * 3.3) * 20
          let k = 0
          while (x < w + 30) {
            k += 1
            const q = row * 131.7 + k * 7.3
            const wy = y + (hashed(q * 1.3) - 0.5) * step * 0.8
            let rr = 24 * fs
            let room = 0
            for (let tries = 0; tries < 5; tries += 1) {
              room = horizonUnder(x, rr * 1.6) - wy
              if (rr <= room - 1 || rr <= 2.5) {
                break
              }
              rr = Math.max(2.5, room - 1)
            }
            const sx = clamp(1.25 * rr, 5, 32)
            if (room < 2.2) {
              x += 5
              continue
            }
            const veil = Math.hypot((x - words.x) / (words.a + 80), (wy - words.y) / (words.b + 18))
            const want = 0.85 * body(wy) * trSmooth(0.95, 1.15, veil)
            if (want > 0.01) {
              const long = 1.6 * rr
              const lay = ((Math.PI * long * 0.72 * rr) / (step * sx)) * 0.55
              const ink = skyInk(wy, q, x)
              put({
                x: x + (hashed(q * 2.1) - 0.5) * sx * 0.4,
                y: wy,
                long,
                wide: 0.45,
                blur: 0.6 * rr,
                paints: [ink, ink],
                load: 1 - (1 - want) ** (1 / Math.max(1, lay)),
                order: 500,
              })
            }
            x += sx * (0.8 + 0.4 * hashed(q * 1.9))
          }
        }
        /* and close along the horizon, small soft dabs side by side, so that the sky comes right down to the hills: as
           much of each as the wash above lacks there (it thins out over the last few dozen pixels, where its dabs grow
           small), so that the two together are as solid as the sky beside them and no chain of dabs shows along a slope */
        ;[
          [4, 0],
          [4.5, 3],
          [5.5, 7.5],
          [7, 13],
          [8.5, 20],
        ].forEach(([rr0, up], j) => {
          const rr = rr0 * fs
          const lack = 1 - trSmooth(2, 28, up)
          for (let x = -8, k = 0; x < w + 8; x += rr * 0.8, k += 1) {
            const at = x + (hashed(k * 1.7 + j * 9.1) - 0.5) * rr * 0.5
            const y = horizonUnder(at, rr * 1.6) - up * fs
            const veil = Math.hypot((at - words.x) / (words.a + 80), (y - words.y) / (words.b + 18))
            const want = 0.85 * body(y) * trSmooth(0.95, 1.15, veil)
            if (y < washTop || want < 0.01) {
              continue
            }
            const ink = skyInk(y, k * 2.9 + j, at)
            put({
              x: at,
              y,
              long: 1.6 * rr,
              wide: 0.45,
              blur: 0.9 * rr,
              paints: [ink, ink],
              load: 1 - (1 - want * lack) ** 0.4,
              order: 500.02,
            })
          }
        })
        // the afterglow at dusk, low over the hills (by day the sky's own blue there)
        for (let x = -20, k = 0; x < w + 20; x += 22 * fs, k += 1) {
          let hz = 1e9
          for (let u = -1; u <= 1; u += 0.5) {
            hz = Math.min(hz, crestAt(x + u * 26 * fs) + 1, L.far(x + u * 26 * fs) + 3)
          }
          const y = hz - 13 * fs
          if (y < top + 0.12 * pic) {
            continue
          }
          put({
            x,
            y,
            long: 34 * fs,
            wide: 0.45,
            blur: 14 * fs,
            paints: ['trDusk', 'trDusk'],
            load: 0.2 * body(y),
            order: 500.08,
          })
        }

        /* The moon at dusk, with a soft light round it, and a few stars. Where there is room beside the words it hangs up
           there over the far hill, in the page, which is the night's sky at dusk and by day the page's white, so that by day
           it is gone; on a phone it hangs in the top of the picture, where the sky has hardly come in. */
        // (on a phone out at the canvas's right edge, clear of the buttons, smaller and with less light round it, and still
        // in the top of the picture, where the sky has hardly come in, so that by day it is gone)
        const moonX = trLerp(Math.min(w - 46 * fs, Math.max(words.x + words.a + 110, 0.85 * w)), w - 26 * fs, low)
        const moonY = trLerp(words.y + 0.3 * words.b, top + 0.032 * pic, low)
        const moonR = 7 * fs * (1 - 0.22 * low)
        /* By day the moon must leave the page exactly white. Every stroke is painted a few hundredths lighter or darker,
           warmer or cooler than its paint, by its dice, so each of the moon's is drawn from a seed whose dice leave white
           white; and a brush stroke is shaded a little deeper on its lower side, so the moon's face is laid as rings of
           flat paint, one inside the next (the glyphs' ring, which takes its paint as it is), rather than as a dab. */
        const whiteSeed = (from) => {
          for (let seed = from; seed < from + 4000; seed += 1) {
            rand.reseed(seed)
            rand()
            rand()
            rand()
            const dice = rand()
            if (
              dice * 91.7 - Math.floor(dice * 91.7) > 0.55 &&
              Math.abs(dice * 37.3 - Math.floor(dice * 37.3) - 0.5) < 0.03
            ) {
              return seed
            }
          }
          return from
        }
        let seedAt = 70000
        const still = (o) => {
          seedAt = whiteSeed(seedAt + 1)
          rand.reseed(seedAt)
          n += 1
          const root = h + 40
          garden.dab({ blur: 0.6, turn: 0, ...o, y: root, stem: root - o.y, lean: 0, stiff: 1 })
        }
        still({
          x: moonX,
          y: moonY,
          long: moonR * (3.4 - 1.1 * low),
          wide: 1,
          blur: moonR * (2.8 - 0.9 * low),
          paints: low > 0.5 ? ['trMoonSkyGlow', 'trMoonSkyGlow'] : ['trMoonGlow', 'trMoonGlow'],
          load: 0.2,
          kind: TR_GLIMMER,
          order: 501,
        })
        // (a soft disc under the rings, which at dusk fills between them, and by day they cover)
        const moonInk = low > 0.5 ? 'trMoonSky' : 'trMoon'
        still({
          x: moonX,
          y: moonY,
          long: moonR - 0.3,
          wide: 1,
          blur: 1.2,
          paints: [moonInk, moonInk],
          load: 0.95,
          kind: TR_HAZE,
          order: 501.05,
        })
        for (let ring = 0.3; ring < moonR; ring += 0.5) {
          still({
            x: moonX,
            y: moonY,
            long: ring,
            wide: 1,
            blur: 0.8,
            paints: [moonInk, moonInk],
            load: 0.95,
            kind: 2,
            order: 501.1 + ring * 1e-4,
          })
        }
        for (let k = 0; k < 18; k += 1) {
          const x = hashed(k * 5.1 + 0.4) * w
          const y = top + (0.04 + 0.26 * hashed(k * 3.7 + 0.9)) * pic
          if (y > horizon(x) - 10 || Math.abs(x - words.x) < words.a + 40 || Math.hypot(x - moonX, y - moonY) < 30) {
            continue
          }
          const s = (0.7 + 1.1 * hashed(k * 7.3) ** 2) * fs
          put({
            x,
            y,
            long: s * 1.6,
            wide: 1,
            blur: s * 1.1,
            paints: ['trStarGlow', 'trStarGlow'],
            load: 0.1,
            kind: TR_GLIMMER,
            order: 501.2,
          })
          put({
            x,
            y,
            long: s * 0.5,
            wide: 1,
            blur: s * 0.2,
            paints: ['trStar', 'trStar'],
            load: 0.8,
            kind: TR_TWINKLE,
            order: 501.3,
          })
        }

        /* The grass along the crest: fine blades against the sky, lit gold at their tips, swaying in the breeze, larger
           on the knoll, which is nearer, and smaller on the long slope going away to the right. */
        for (let x = -6; x < w + 6; ) {
          const q = Math.round(x * 13.1)
          const y = crestAt(x)
          const near = trSmooth(L.by + 0.5 * pic, L.by, y)
          const tall = (2.4 + 4.2 * hashed(q * 0.37) ** 1.5) * (0.65 + 0.55 * near) * fs
          n += 1
          rand.reseed(73001 + n * 7919)
          garden.dab({
            kind: TR_LEAF,
            x,
            y: y + 2.2,
            stem: tall / 2,
            long: tall / 2 + 0.5,
            wide: Math.max(0.16, (0.5 + 0.3 * near) / (tall / 2 + 0.5)),
            turn: -Math.PI / 2,
            blur: 0.4,
            paints: hashed(q * 0.71) < 0.6 ? ['trBladeLit', 'trBlade'] : ['trBlade', 'trBladeLit'],
            load: 0.85,
            stiff: 0.55,
            lean: (hashed(q * 0.53) - 0.5) * 0.75,
            phase: 30 + Math.floor(x / 90),
            order: 530 + x * 1e-6,
          })
          x += (1.3 + 1.6 * hashed(q * 0.91)) * Math.max(0.8, fs * 0.9)
        }

        /* The flower bed along the front, after the second picture: soft yellow and cream flowers in flat dabs, heaped in
           drifts with their leaves between, coming in a few at a time out of the hill's shade at its top, small there and
           larger towards the front, where the picture goes into the page; dark leaves of green and blue-green, a cornflower
           now and then, all of it nodding a little in the breeze. Higher round the cat, so that it peeks out of a drift. */
        const catHW = 13 * fs
        const bedAt = (x) =>
          L.bed + (fbm(x / (130 * fs), 3.3) - 0.5) * 30 * fs - 12 * fs * Math.exp(-(((x - L.catX) / (110 * fs)) ** 2))
        const catY = bedAt(L.catX) + 0.18 * (h - bedAt(L.catX)) + 4 * fs
        const FLOWER_INKS = [
          ['trCream', 'trPetalShade', 2.4],
          ['trButter', 'trPetalShade', 3],
          ['trLemon', 'trButter', 2.2],
          ['trYolk', 'trLemon', 0.9],
        ]
        const pick = (v) => {
          let acc = v * FLOWER_INKS.reduce((sum, ink) => sum + ink[2], 0)
          for (const ink of FLOWER_INKS) {
            acc -= ink[2]
            if (acc < 0) {
              return ink
            }
          }
          return FLOWER_INKS[0]
        }
        const sizeAt = (d) => trLerp(4, 15, clamp(d, 0, 1) ** 0.85) * fs
        // the drifts: where the flowers heap up and where the leaves show between them
        const drift = (x, y) => fbm(x / (70 * fs) + 7.1, y / (34 * fs) + 2.3)
        /* The bed's own light under its flowers: a soft butter haze coming in a little under its top, so that between the
           heads there is warm light rather than the hill's shade, and the bed reads as one soft mass. */
        for (let y = L.bed - 4 * fs, row = 0; y < h + 10; y += 9 * fs, row += 1) {
          for (let x = -30 + (row % 2) * 20 * fs, k = 0; x < w + 30; x += 40 * fs, k += 1) {
            const q = row * 31.7 + k * 5.3
            const gy = y + (hashed(q) - 0.5) * 6 * fs
            const d = (gy - bedAt(x)) / Math.max(20, h - bedAt(x))
            const come = trSmooth(-0.05, 0.35, d)
            if (come < 0.02) {
              continue
            }
            put({
              x: x + (hashed(q * 1.7) - 0.5) * 16 * fs,
              y: gy,
              long: 34 * fs,
              wide: 0.42,
              blur: 12 * fs,
              paints: hashed(q * 2.3) < 0.6 ? ['trBedGlow', 'trBedGlow'] : ['trBedGlowDeep', 'trBedGlowDeep'],
              load: 0.42 * come,
              order: 559,
            })
          }
        }
        let row = 0
        for (let y = L.bed - 26 * fs; y < h + 4; row += 1) {
          const s = sizeAt((y - L.bed) / (h - L.bed))
          for (let x = -14 + (row % 2) * s; x < w + 14; ) {
            const q = row * 977 + Math.round(x * 3.7)
            const jx = x + (hashed(q * 0.11) - 0.5) * s * 1.1
            const jy = y + (hashed(q * 0.13) - 0.5) * s * 0.8
            const b0 = bedAt(jx)
            const d = (jy - b0) / Math.max(20, h - b0)
            x += s * (1.45 + 0.6 * hashed(q * 0.17))
            // its top comes in a head at a time out of the shade, never along a line
            if (hashed(q * 0.19) > trSmooth(-0.18, 0.25, d)) {
              continue
            }
            // none over the cat's face, which peeks out between them (its chin's own are laid with it)
            if (Math.hypot((jx - L.catX) / (catHW * 1.2), (jy - catY) / (catHW * 1.0)) < 1) {
              continue
            }
            const heap = drift(jx, jy)
            const ss = sizeAt(d) * (0.78 + 0.44 * hashed(q * 0.23))
            const order = 560 + jy * 1e-4
            const sway = 50 + Math.floor(jx / 70)
            /* (along the wind's way they hardly sway in the breeze, so that the wind's parting stands out when it comes
               through: stiff in the breeze, a stroke still gives to a stir a little more than half as much as a supple
               one does, and its head is carried aside as far) */
            const calm = Math.exp(-(((jy - L.pass) / (40 * fs)) ** 2))
            // leaves, more of them between the drifts, where the flowers thin out
            const leafy = heap < 0.37
            if (hashed(q * 0.29) < (leafy ? 0.4 : 0.18)) {
              const teal = hashed(q * 0.31) < 0.35
              const lx = jx + (hashed(q * 0.37) - 0.5) * ss
              swing({
                x: lx,
                y: jy + ss * 0.45,
                rx: lx,
                ry: jy + ss * 2,
                give: 0.13 - 0.08 * calm,
                phase: sway,
                long: ss * 1.1,
                wide: 0.7,
                turn: -Math.PI / 2 + (hashed(q * 0.41) - 0.5) * 2.4,
                blur: 0.5 + ss * 0.15,
                paints: teal ? ['trBedTeal', 'trBedLeafDeep'] : ['trBedLeaf', 'trBedLeafDeep'],
                load: 0.85,
                kind: TR_ROUND,
                order: order - 5e-5,
              })
            }
            if (leafy && hashed(q * 0.67) < 0.55) {
              continue
            }
            const corn = false
            // far back the flowers are small and warmer, so that they come out of the gold softly rather than as beads
            const [ink, shade] = corn
              ? ['trCorn', 'trCornDeep']
              : d < 0.12
                ? hashed(q * 0.47) < 0.6
                  ? ['trLemon', 'trYolk']
                  : ['trButter', 'trLemon']
                : pick(hashed(q * 0.47))
            n += 1
            rand.reseed(75001 + n * 7919)
            if (ss > 2.4 * fs) {
              garden.bloom({
                x: jx,
                y: jy + ss * 1.5,
                stem: ss * 1.5,
                reach: ss,
                petals: 5 + Math.floor(hashed(q * 0.53) * 2),
                blur: 0.5 + ss * 0.08,
                paints: [ink, shade],
                turn: hashed(q * 0.59) * 6.28,
                stiff: 0.88 + 0.08 * calm,
                lean: 0,
                phase: sway,
                order,
              })
            } else {
              swing({
                x: jx,
                y: jy,
                rx: jx,
                ry: jy + ss * 1.5,
                give: 0.12 - 0.08 * calm,
                phase: sway,
                long: ss * 0.85,
                wide: 0.82 + 0.15 * hashed(q * 0.61),
                turn: 1.3,
                blur: 0.4 + ss * 0.1,
                paints: [ink, shade],
                load: 0.95,
                kind: TR_ROUND,
                order,
              })
            }
          }
          y += s * 0.85
        }
        /* Along the wind's way the grass among the flowers stands taller and closer, giving to the wind more than the
           flowers do and swaying a little in the breeze, its tips lit, so that the ripple the wind leaves in it shows:
           pushed on after it, springing back past upright, settling. Most of it right along the way and less out to either side, and broken
           into tufts, so that it never lies across the bed as a band. */
        for (let x = -6, k = 0; x < w + 6; x += 4.4 * fs, k += 1) {
          for (let j = 0; j < 2; j += 1) {
            const q = k * 31 + j * 104729 + 7
            const bx = x + (hashed(q * 0.11) - 0.5) * 3 * fs
            if (fbm(bx / (80 * fs), j * 3.1 + 0.7) < 0.42 && hashed(q * 0.07) < 0.8) {
              continue
            }
            const off = (hashed(q * 0.13) + hashed(q * 0.17) + hashed(q * 0.19) - 1.5) * 30 * fs
            const y = L.pass + off + (j - 0.5) * 6 * fs
            const b0 = bedAt(bx)
            const d = (y - b0) / Math.max(20, h - b0)
            // never at the bed's top, where it comes out of the hill's shade a head at a time, nor in front of the cat
            if (
              d < 0.1 + 0.25 * hashed(q * 0.23) ||
              Math.hypot((bx - L.catX) / (catHW * 1.5), (y - catY) / (catHW * 1.3)) < 1
            ) {
              continue
            }
            const tall = (9 + 9 * hashed(q * 0.29) ** 1.3) * fs * (0.75 + 0.5 * clamp(d, 0, 1))
            n += 1
            rand.reseed(76001 + n * 7919)
            garden.dab({
              kind: TR_LEAF,
              x: bx,
              y,
              stem: tall / 2,
              long: tall / 2,
              wide: clamp((1 + 0.5 * d) / (tall / 2), 0.05, 0.3),
              turn: -Math.PI / 2,
              blur: 0.45,
              paints: hashed(q * 0.31) < 0.3 ? ['trBedTeal', 'trWispTip'] : ['trWisp', 'trWispTip'],
              load: 0.82,
              stiff: 0.66,
              lean: (hashed(q * 0.37) - 0.5) * 0.5 + 0.1,
              phase: 50 + Math.floor(bx / 70),
              order: 560 + y * 1e-4 - 3e-5,
            })
          }
        }
        /* The hill's shadow, sweeping across it as the first picture's does: a broad soft band low on the left that rises
           across the slope to just under the far hill at the right, and never up to the crest, so no shade lies over the
           sky. */
        for (let x = -40, k = 0; x < w + 40; x += 16 * fs, k += 1) {
          const hc = crestAt(x)
          const hb = bedAt(x) + 14 * fs
          const span = hb - hc
          if (span < 30) {
            continue
          }
          const t = clamp(x / w, 0, 1)
          // where the shade begins, lower on the left and higher towards the right, wandering a little
          const edge = hc + (trLerp(0.5, 0.26, t) + (fbm(x / (160 * fs) + 3.7, 0.4) - 0.5) * 0.22) * span
          const long = clamp(0.22 * span, 12, 34 * fs)
          const blur = 0.5 * long
          for (let y = edge, j = 0; y < hb; y += 0.55 * long, j += 1) {
            const q = k * 17.3 + j * 3.1
            const yy = y + (hashed(q) - 0.5) * 0.3 * long
            // fully in a little under the edge, and never up near the crest, so no shade lies over the sky
            const deep = trSmooth(edge - 0.1 * span, edge + 0.3 * span, yy)
            const keep = trSmooth(0, 10, yy - hc - 0.5 * long - blur)
            put({
              x: x + (hashed(q * 1.7) - 0.5) * 12 * fs,
              y: yy,
              long,
              wide: 0.48,
              blur,
              paints: hashed(q * 2.9) < 0.75 ? ['trSweep', 'trSweep'] : ['trSweepDeep', 'trSweepDeep'],
              load: 0.3 * deep * keep,
              order: 534 + j * 1e-4,
            })
          }
        }
        /* The cat, peeking out of the flowers on the right: a small white face, its ears up, two dark eyes, a little nose
           and fine whiskers, still and calm, with flowers in front of its chin. */
        const cat = () => {
          const x = L.catX
          const y = catY
          const hw = catHW
          const hh = hw * 0.8
          ;[-1, 1].forEach((k) => {
            put({
              x: x + k * hw * 0.56,
              y: y - hh * 0.74,
              long: hw * 0.4,
              wide: 0.78,
              turn: -Math.PI / 2 + k * 0.42,
              blur: 0.6,
              paints: ['trCat', 'trCatShade'],
              load: 0.99,
              kind: TR_LEAF,
              order: 570,
            })
            put({
              x: x + k * hw * 0.55,
              y: y - hh * 0.7,
              long: hw * 0.2,
              wide: 0.6,
              turn: -Math.PI / 2 + k * 0.42,
              blur: 0.5,
              paints: ['trCatEar', 'trCatEar'],
              load: 0.55,
              kind: TR_LEAF,
              order: 570.01,
            })
          })
          put({
            x,
            y,
            long: hw,
            wide: hh / hw,
            turn: 0,
            blur: 0.8,
            paints: ['trCat', 'trCat'],
            load: 0.99,
            kind: TR_ROUND,
            order: 570.1,
          })
          // a little shade low on its face, where the flowers stand in front of it
          put({
            x,
            y: y + hh * 0.55,
            long: hw * 0.8,
            wide: 0.3,
            turn: 0,
            blur: hw * 0.3,
            paints: ['trCatShade', 'trCatShade'],
            load: 0.5,
            kind: TR_HAZE,
            order: 570.15,
          })
          ;[-1, 1].forEach((k) => {
            put({
              x: x + k * hw * 0.34,
              y: y + hh * 0.04,
              long: Math.max(0.95, hw * 0.1),
              wide: 1,
              blur: 0.4,
              paints: ['trCatEye', 'trCatEye'],
              load: 0.95,
              kind: TR_ROUND,
              order: 570.2,
            })
            ;[-0.1, 0.12].forEach((tilt, j) => {
              put({
                x: x + k * hw * (0.86 + 0.04 * j),
                y: y + hh * (0.3 + 0.13 * j),
                long: hw * 0.36,
                wide: 0.05,
                turn: k > 0 ? tilt : Math.PI - tilt,
                blur: 0.3,
                paints: ['trWhisker', 'trWhisker'],
                load: 0.75,
                kind: TR_LEAF,
                order: 570.3,
              })
            })
          })
          put({
            x,
            y: y + hh * 0.27,
            long: Math.max(0.8, hw * 0.075),
            wide: 0.8,
            blur: 0.3,
            paints: ['trCatNose', 'trCatNose'],
            load: 0.9,
            kind: TR_ROUND,
            order: 570.2,
          })
          // the flowers in front of its chin
          for (let k = 0; k < 5; k += 1) {
            const u = (k / 4) * 2 - 1
            const ss = (4.6 + 1.4 * hashed(k * 3.3)) * fs
            const [ink, shade] = pick(hashed(k * 5.7 + 0.2))
            n += 1
            rand.reseed(77001 + n * 7919)
            garden.bloom({
              x: x + u * hw * 1.0,
              y: y + hh * (1.0 + 0.2 * Math.abs(u)) + ss * 1.5,
              stem: ss * 1.5,
              reach: ss,
              petals: 5 + (k % 2),
              blur: 0.5 + ss * 0.08,
              paints: [ink, shade],
              turn: k * 1.7,
              stiff: 0.8,
              lean: 0,
              phase: 50 + Math.floor(x / 70),
              order: 571 + k * 0.01,
            })
          }
        }
        cat()

        /* The swath of the bed the wind has just gone through, swept over with it: painted round the canvas's middle (the
           shader carries it where the wind is, see schoolVertex), its middle on the wind's way. Just behind the wind the
           stems lie right over, downwind, dark against the bed with their tips catching the light, and further back they
           rise again, fading as they go; under them a soft shade, where the heads have bowed apart, and a few heads bowed
           over at the stems' tips. Part of the wind, so it is in every still; in motion the flowers round it bow and spring
           back too. Rooted far under the canvas, where nothing that goes by can stir it. */
        const hx = w / 2
        const hy = h / 2
        const D = trWakeD(w)
        let f = 0
        const wake = (lx, ly, r, paints, o = {}) => {
          f += 1
          rand.reseed(79001 + f * 7919)
          const root = h + 400
          garden.dab({
            kind: o.kind ?? TR_LEAF,
            x: hx + lx * D,
            y: root,
            stem: root - (hy + ly * D),
            long: r * D,
            wide: o.wide ?? 0.9,
            turn: o.turn ?? 0,
            blur: (o.blur ?? 0.1) * r * D + 0.3,
            paints,
            load: o.load ?? 0.9,
            lean: 0,
            stiff: 1,
            order: 2000 + f * 1e-4,
            phase: 400,
          })
        }
        wake(-0.68, 0.2, 0.76, ['trWakeShade', 'trWakeShade'], { wide: 0.3, blur: 0.7, load: 0.4, kind: TR_HAZE })
        // (a stem's breadth, in pixels, as the grass along the wind's way is drawn)
        const thin = (px, r) => (px * fs) / Math.max(0.5, r * D)
        /* None of it rises higher over the wind's way than the cat's nose, so that as the wind goes by the cat no stem
           lies across its eyes: a stem that would is rooted that much further down in the bed instead. */
        const roof = clamp((L.pass - (catY + 0.3 * 0.8 * catHW)) / D, 0.08, 0.2)
        const STEMS = 62
        for (let j = 0; j < STEMS; j += 1) {
          const s = j / (STEMS - 1)
          const g = (m) => trHash(j * 5.7 + m * 1.9 + 0.3)
          const lx = -0.02 - 1.45 * s + (g(1) - 0.5) * 0.05
          const tall = (0.8 - 0.42 * s) * (0.7 + 0.6 * g(2))
          const lean = 1.2 - 0.75 * s + (g(3) - 0.5) * 0.3
          const fade = 1 - 0.6 * s ** 1.4
          // each stem in two strokes, its tip bent over further than its foot, so that it curves as grass in the wind does
          const l1 = lean * 0.65
          const a1 = tall * 0.55
          const l2 = Math.min(1.45, lean * 1.3)
          const a2 = tall * 0.5
          const rise = a1 * Math.cos(l1) + a2 * Math.cos(l2)
          const ly = Math.max(0.2 + (g(4) - 0.5) * 0.24, rise - roof * (0.85 + 0.15 * g(5)))
          const mx = lx + Math.sin(l1) * a1
          const my = ly - Math.cos(l1) * a1
          wake((lx + mx) / 2, (ly + my) / 2, a1 / 2, [j % 3 ? 'trBedLeafDeep' : 'trBedTeal', 'trWisp'], {
            wide: thin(1.55, a1 / 2),
            blur: 0.04,
            turn: -Math.PI / 2 + l1,
            load: 0.95 * fade,
          })
          wake(
            mx + Math.sin(l2) * a2 * 0.5,
            my - Math.cos(l2) * a2 * 0.5,
            a2 / 2,
            ['trWisp', j % 3 ? 'trWispTip' : 'trWakeTip'],
            { wide: thin(1.3, a2 / 2), blur: 0.04, turn: -Math.PI / 2 + l2, load: 0.95 * fade },
          )
        }
        // and a few of the bed's flowers tossed up in it, as the e-commerce hero's dog tosses up daisies, no higher over the
        // wind's way than the stems (the roof), so that none of them passes over the cat's face either
        ;[
          [-0.3, -0.42, 0.085, 'trCream'],
          [-0.62, -0.3, 0.075, 'trButter'],
          [-0.16, -0.62, 0.065, 'trLemon'],
        ].forEach(([lx, toss, r, ink], k) => {
          const ly = Math.max(toss, -roof * 0.85)
          f += 1
          rand.reseed(79001 + f * 7919)
          const root = h + 400
          garden.bloom({
            x: hx + lx * D,
            y: root,
            stem: root - (hy + ly * D),
            reach: r * D,
            petals: 5 + (k % 2),
            blur: 0.5 + r * D * 0.08,
            paints: [ink, 'trPetalShade'],
            turn: k * 1.9,
            stiff: 1,
            lean: 0,
            phase: 400,
            order: 2000.5 + k * 1e-3,
          })
        })

        /* The petals after the wind, painted round the canvas's middle likewise, each a petal of the bed's, cream or
           butter, turning over about its own middle as it flies (the school's fish after the wake). */
        for (let i = 0; i < TR_PETALS; i += 1) {
          const long = (3.6 + 1.3 * hashed(i * 3.3 + 0.4)) * fs
          rand.reseed(78001 + i * 7919)
          const root = h + 400
          garden.dab({
            kind: TR_LEAF,
            x: w / 2,
            y: root,
            stem: root - h / 2,
            long,
            wide: 0.4,
            turn: hashed(i * 5.1) * Math.PI,
            blur: 0.55,
            paints: i % 3 === 2 ? ['trPetalFlyButter', 'trPetalFlyShade'] : ['trPetalFly', 'trPetalFlyShade'],
            load: 0.95,
            lean: 0,
            stiff: 1,
            order: 2001 + i * 0.01,
            phase: 401 + i + 0.2,
          })
        }
      },
    }

    return {
      forest: FOREST,
      'uc-ai-platforms': UC_AI_PLATFORMS,
      'uc-developer-tools': UC_DEVELOPER_TOOLS,
      'uc-ecommerce': UC_ECOMMERCE,
      'uc-fintech': UC_FINTECH,
      'uc-healthcare': UC_HEALTHCARE,
      'uc-logistics': UC_LOGISTICS,
      'uc-telecom': UC_TELECOM,
      'uc-travel': UC_TRAVEL,
    }
  })

  // An engine that has run and left the queue as it found it is one from before plugins: it draws its meadow here.
  if (window.__scalarHeadlessHero && Array.isArray(window.__scalarHeroModes)) {
    console.warn('[use-cases-hero]', 'this headless-hero.js takes no plugins; it and use-cases-hero.js ship together')
  }
})()
