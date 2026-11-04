/**
 * The hero on /products/sdk-generator: a few thousand very fine lines running left to right under the
 * calls to action, in Warp's colours, drawn together to a pinch under the car and thrown wide behind it.
 *
 * Where the lines run is not worked out by a formula. It was traced from the picture this hero is
 * after, by following the direction of its lines from pixel to pixel, and the guides below are those
 * traces. A sheet is lofted between its guides, and a line is simply a place across a sheet, so the
 * fragment shader can draw any number of them, hairline thin, for the price of one mesh.
 *
 * The look of a line comes from the same picture: a long run of colour, broken here and there, with a
 * hair of space between it and the next, and small pale beads strung along it that carry on as a field
 * of stars after the line itself has faded out. The grain over it all is the planets' on the home page,
 * the same tile laid on with the same overlay.
 *
 * The car stands on them. Its art is in the page, not here; this file only says where it stands, and
 * draws what it does to the ground: warm light and a shadow under it, and hot streaks thrown back from
 * its tyres, all placed in the units of the car's art so that they stay with it at any size.
 *
 * Pages on scalar.com render on the client and hydrate over the first copy of the hero, so binding
 * goes through a MutationObserver with a dataset flag on the element: a node replaced by hydration
 * comes back unbound and heals itself.
 */
;(() => {
  // The docs run a route's scripts again on every visit. The first run watches the page for
  // good, so a later one has nothing to add.
  if (window.__scalarSdkHero) {
    return
  }
  window.__scalarSdkHero = true

  /* All the guides are in the units of the traced picture, which is this big. The car sits over the
     middle of it and the lines come together under its back wheel. `span` is how much of it the guides
     reach across, carried on past its ends: a window wider than that scale can show gets a larger one. */
  const PICTURE = { width: 2000, height: 610, pinch: [1200, 340], car: 793, span: 6900 }

  /* The upper band: across the whole picture and behind the car, rising gently as it goes. The first
     three guides carry nothing but beads, the stars over the top left. */
  const ARCH = [
    [-900, 140, 6, 30, 398, -25, 791, -70, 1500, -170, 2900, -340],
    [-900, 170, 6, 62, 398, 10, 791, -35, 1500, -130, 2900, -300],
    [-900, 200, 6, 88, 398, 40, 791, 0, 1500, -100, 2900, -260],
    [-900, 227, 6, 114, 398, 71, 791, 34, 1020, 0, 1500, -65, 2000, -125, 2900, -225],
    [-900, 253, 6, 140, 399, 91, 792, 44, 1060, 2, 1500, -55, 2000, -112, 2900, -215],
    [-900, 279, 6, 166, 399, 118, 792, 70, 1052, 28, 1190, 2, 1600, -45, 2000, -92, 2900, -195],
    [-900, 305, 6, 192, 399, 143, 792, 99, 1054, 64, 1316, 30, 1501, 0, 2000, -55, 2900, -155],
    [-900, 331, 6, 218, 399, 172, 792, 125, 1054, 94, 1316, 60, 1600, 25, 2000, -15, 2900, -110],
    [-900, 357, 6, 244, 400, 202, 793, 157, 1054, 125, 1316, 95, 1600, 60, 2000, 28, 2900, -60],
    [-900, 385, 6, 270, 399, 240, 660, 209, 900, 178, 1337, 125, 1599, 100, 1994, 72, 2900, -5],
    [-900, 410, 6, 296, 398, 255, 659, 217, 900, 188, 1336, 136, 1599, 112, 1994, 94, 2900, 25],
    [-900, 440, 6, 322, 399, 275, 661, 243, 900, 210, 1335, 147, 1598, 130, 1994, 116, 2900, 50],
    [-900, 452, 6, 335, 399, 292, 661, 263, 900, 232, 1335, 170, 1598, 155, 1994, 140, 2900, 90],
    [-900, 462, 6, 347, 400, 304, 663, 282, 900, 258, 1335, 205, 1598, 195, 1994, 190, 2900, 170],
  ]

  /* The band under it on the left, narrowing into the pinch from the front of the car. */
  const FRONT = [
    [-900, 470, 6, 348, 400, 305, 663, 285, 800, 290, 1000, 325, 1240, 338],
    [-900, 505, 6, 374, 399, 323, 662, 300, 850, 318, 1050, 333, 1240, 339],
    [-900, 540, 6, 400, 397, 340, 660, 312, 850, 325, 1050, 335, 1240, 340],
    [-900, 580, 6, 426, 392, 356, 654, 326, 850, 331, 1050, 337, 1240, 341],
    [-900, 620, 6, 452, 393, 375, 654, 338, 850, 337, 1050, 339, 1240, 342],
    [-900, 700, 6, 500, 393, 400, 654, 350, 850, 342, 1050, 341, 1240, 343],
  ]

  /* The bend, from the inside out: up off the bottom of the picture, round a hairpin, through the
     pinch and away to the right. The inner lines turn tightly, and further out they sweep round from
     far to the left, until the last few are only beads. */
  const BEND = [
    [
      2400, 752, 1900, 632, 1500, 528, 1240, 463, 1130, 430, 1090, 413, 1130, 434, 1240, 471, 1500, 542, 1900, 652,
      2400, 778, 2900, 905,
    ],
    [
      2100, 735, 1686, 609, 1448, 538, 1196, 461, 1092, 425, 1062, 408, 1080, 392, 1210, 404, 1472, 434, 1734, 470,
      1994, 512, 2900, 640,
    ],
    [
      1950, 710, 1640, 604, 1387, 529, 1135, 452, 1030, 405, 1020, 385, 1050, 365, 1114, 359, 1244, 379, 1375, 396,
      1637, 426, 1898, 464, 2000, 489, 2900, 620,
    ],
    [
      1800, 700, 1500, 604, 1392, 560, 1140, 464, 1020, 411, 1000, 385, 1030, 362, 1084, 355, 1215, 363, 1346, 374,
      1478, 383, 1610, 394, 1741, 405, 1873, 417, 2000, 431, 2900, 545,
    ],
    [
      1450, 700, 1291, 608, 1211, 558, 1105, 485, 994, 415, 975, 390, 1005, 365, 1074, 355, 1205, 359, 1336, 369, 1468,
      379, 1600, 389, 1731, 400, 1863, 412, 1994, 424, 2900, 520,
    ],
    [
      1400, 700, 1250, 604, 1130, 530, 1020, 450, 955, 385, 990, 358, 1106, 351, 1237, 352, 1369, 362, 1501, 371, 1632,
      383, 1763, 394, 1895, 405, 1999, 414, 2900, 505,
    ],
    [
      1340, 700, 1220, 620, 1104, 550, 987, 482, 930, 420, 940, 375, 1050, 351, 1138, 344, 1240, 345, 1336, 353, 1468,
      361, 1600, 371, 1731, 383, 1862, 393, 1994, 402, 2900, 490,
    ],
    [
      1250, 700, 1150, 620, 1045, 545, 940, 465, 900, 410, 941, 367, 1070, 347, 1130, 344, 1240, 343, 1335, 349, 1467,
      354, 1599, 358, 1731, 365, 1862, 371, 1994, 380, 2900, 465,
    ],
    [
      1060, 700, 940, 604, 858, 522, 825, 440, 860, 385, 942, 355, 1009, 344, 1130, 342, 1240, 341, 1335, 348, 1467,
      350, 1599, 350, 1731, 348, 1862, 353, 1994, 358, 2900, 425,
    ],
    [
      800, 700, 730, 604, 698, 478, 785, 389, 909, 351, 949, 343, 1100, 340, 1240, 339, 1335, 346, 1467, 346, 1599, 343,
      1730, 338, 1862, 337, 1994, 336, 2900, 360,
    ],
    [
      500, 700, 520, 604, 560, 480, 667, 407, 793, 375, 919, 345, 1100, 338, 1240, 337, 1336, 344, 1467, 339, 1599, 331,
      1730, 321, 1862, 315, 1994, 314, 2900, 300,
    ],
    [
      400, 700, 450, 604, 508, 505, 608, 421, 729, 369, 857, 352, 1000, 340, 1240, 336, 1343, 344, 1474, 335, 1605, 325,
      1735, 306, 1866, 295, 1994, 292, 2900, 230,
    ],
    [
      100, 700, 240, 604, 330, 520, 470, 430, 620, 380, 800, 350, 1000, 339, 1240, 335, 1352, 342, 1483, 330, 1614, 314,
      1740, 295, 1871, 282, 1994, 270, 2900, 160,
    ],
    [
      -300, 700, 0, 600, 150, 520, 350, 440, 600, 375, 800, 348, 1000, 338, 1240, 334, 1360, 338, 1490, 322, 1620, 300,
      1750, 280, 1880, 262, 1994, 248, 2900, 120,
    ],
    [
      -800, 760, -300, 640, 0, 540, 200, 470, 450, 395, 700, 355, 1000, 337, 1240, 333, 1370, 332, 1500, 310, 1630, 285,
      1760, 262, 1890, 242, 1994, 226, 2900, 80,
    ],
  ]

  /* The dust thrown up behind the car, which is more grain than line. */
  const PLUME = [
    [1120, 345, 1240, 290, 1380, 205, 1600, 150, 1900, 135, 2400, 100],
    [1120, 345, 1250, 305, 1410, 240, 1620, 195, 1900, 180, 2400, 160],
    [1120, 345, 1265, 320, 1430, 275, 1640, 240, 1900, 225, 2400, 215],
    [1120, 345, 1280, 335, 1450, 308, 1660, 285, 1900, 270, 2400, 265],
    [1120, 345, 1300, 345, 1460, 338, 1680, 325, 1900, 312, 2400, 310],
  ]

  /* Where the car goes. Its art is in the pixels of the picture it was traced from, and this is the box
     its outline fills. It takes about half the hero's width, right of the middle with the halo tucked
     under the buttons, and stands near the bottom of the lines. These are the concept's own measurements,
     taken at a window of 1512 by 820, and that includes `low`: the concept's car is lower and longer than
     the photo it was traced from, which is what lets the halo clear the buttons at this size. */
  const CAR = {
    box: [1, 82, 1277, 640],
    low: 0.9,
    ofWidth: 0.5057,
    ofRoom: 2.58,
    left: 0.3782,
    foot: 0.8965,
    /* on a narrow screen it is as wide as there is room for and kept in the middle */
    narrow: 760,
    narrowRoom: 140,
    ofNarrowWidth: 0.94,
    ofNarrowRoom: 2.2,
  }

  /* What the car does to the ground under it, in the units of its art. Shadows and warm light are soft
     shapes as [x, y, across, deep, turned by, ink, strength]. */
  const WARMTH = [
    [520, 640, 980, 165, 2, '#ff5f0a', 1],
    [20, 600, 420, 170, 16, '#f23c0a', 0.9],
    [1020, 515, 380, 120, -19, '#ff5f0a', 0.95],
  ]
  const SHADOWS = [
    [140, 592, 250, 38, 21, '#4d0a02', 0.95],
    [510, 664, 370, 40, 2, '#4d0a02', 1],
    [815, 616, 130, 32, -4, '#4d0a02', 1],
    [1010, 505, 230, 44, -20, '#4d0a02', 0.95],
    [1185, 428, 120, 22, -6, '#4d0a02', 0.95],
  ]
  /* the light where a tyre meets the ground, and the glow it leaves along the way */
  const FLARES = [
    [1010, 545, 300, 50, -14, '#ff9f1c', 0.7],
    [1345, 385, 190, 56, -18, '#ff9f1c', 0.75],
    [846, 582, 90, 26, -14, '#fff0c8', 1],
    [1268, 402, 74, 24, -16, '#fff0c8', 1],
  ]
  /* The streaks of heat out from under it: [points, how wide its glow is at the start and at the end, ink, strength] */
  const STREAKS = [
    /* from the near front tyre, under the floor and away to the right */
    [[835, 583, 1051, 533, 1274, 475, 1576, 412, 2300, 262], [22, 60], '#ffbe2e', 1],
    [[846, 552, 1041, 496, 1274, 440, 1580, 385, 2300, 250], [14, 44], '#ff9f1c', 0.55],
    /* fanning out from the back tyre */
    [[1262, 402, 1385, 372, 1483, 335, 1576, 318, 2300, 215], [20, 50], '#ffbe2e', 1],
    [[1264, 398, 1358, 355, 1441, 330, 1576, 300, 2300, 190], [14, 40], '#ff9f1c', 0.7],
    [[1262, 408, 1413, 396, 1576, 366, 2300, 270], [14, 40], '#ff9f1c', 0.7],
    /* low down, thin and pale */
    [[1121, 621, 1274, 593, 1448, 558, 1576, 544, 2300, 420], [8, 26], '#ffc98f', 0.8],
    /* under the wing */
    [[438, 656, 577, 626, 633, 622, 716, 607], [10, 26], '#ffbe2e', 0.85],
    /* the arc beside the wing's tip */
    [[-87, 575, -50, 542, 2, 524, 40, 516], [10, 22], '#ffbe2e', 0.9],
  ]
  /* The same, for the ones that belong to the lines rather than to the car: in the units of the picture */
  const PICTURE_STREAKS = [[[-900, 470, 6, 348, 400, 305, 663, 285, 800, 290, 900, 305], [14, 26], '#ffc98f', 1]]

  /* Warp's colours at full heat and never a brown among them, as [on a light page, on a dark page]. */
  const INK = {
    crimson: ['#e5260a', '#f0300c'],
    red: ['#f23c0a', '#f5420c'],
    orange: ['#ff5f0a', '#ff640f'],
    tangerine: ['#ff7d0f', '#ff8214'],
    amber: ['#ff9f1c', '#ffa420'],
    gold: ['#ffbe2e', '#ffc83c'],
    peach: ['#ff9d5c', '#ffb98a'],
    cream: ['#ffc98f', '#ffe3c0'],
  }

  /* The colour of each sheet: down the list is how far along the sheet, and each row reads from one
     edge of the sheet to the other as [how far across, ink, how much of the line there is]. A body of
     nothing leaves only the beads on it. */
  const SHEETS = [
    {
      guides: ARCH,
      anchor: 1205,
      along: 260,
      runOn: [1600, 1600],
      beads: 0.8,
      paint: [
        [
          0,
          [
            [0.16, 'crimson', 0],
            [0.23, 'crimson', 0.25],
            [0.31, 'crimson', 0.7],
            [0.37, 'red', 1],
            [0.46, 'orange', 1],
            [0.54, 'tangerine', 1],
            [0.6, 'amber', 1],
            [0.66, 'gold', 1],
            [0.72, 'amber', 1],
            [0.78, 'orange', 1],
            [0.88, 'red', 1],
            [0.95, 'peach', 1],
            [1, 'cream', 1],
          ],
        ],
        [
          0.62,
          [
            [0.16, 'crimson', 0],
            [0.23, 'crimson', 0.3],
            [0.31, 'crimson', 0.8],
            [0.37, 'red', 1],
            [0.46, 'orange', 1],
            [0.54, 'tangerine', 1],
            [0.6, 'amber', 1],
            [0.66, 'gold', 1],
            [0.72, 'amber', 1],
            [0.78, 'orange', 1],
            [0.88, 'red', 1],
            [1, 'red', 0.1],
          ],
        ],
      ],
    },
    {
      guides: FRONT,
      along: 190,
      runOn: [1600, 0],
      beads: 0.75,
      paint: [
        [
          0,
          [
            [0, 'gold', 1],
            [0.12, 'peach', 1],
            [0.22, 'amber', 1],
            [0.4, 'orange', 1],
            [0.6, 'red', 1],
            [0.8, 'crimson', 0.5],
            [1, 'crimson', 0],
          ],
        ],
        [
          0.72,
          [
            [0, 'gold', 1],
            [0.12, 'peach', 1],
            [0.22, 'amber', 1],
            [0.4, 'orange', 1],
            [0.6, 'red', 1],
            [0.8, 'crimson', 0.6],
            [1, 'crimson', 0],
          ],
        ],
        [
          1,
          [
            [0, 'cream', 0],
            [1, 'cream', 0],
          ],
        ],
      ],
    },
    {
      guides: BEND,
      anchor: 1205,
      along: 460,
      runOn: [0, 1600],
      beads: 0.82,
      paint: [
        [
          0.36,
          [
            [0, 'red', 1],
            [0.14, 'orange', 1],
            [0.24, 'red', 1],
            [0.3, 'peach', 1],
            [0.36, 'red', 1],
            [0.46, 'crimson', 0.95],
            [0.58, 'crimson', 0.62],
            [0.72, 'orange', 0.34],
            [0.86, 'orange', 0.12],
            [1, 'orange', 0],
          ],
        ],
        [
          0.47,
          [
            [0, 'tangerine', 1],
            [0.14, 'gold', 1],
            [0.24, 'amber', 1],
            [0.3, 'peach', 1],
            [0.36, 'red', 1],
            [0.46, 'crimson', 0.95],
            [0.58, 'crimson', 0.75],
            [0.72, 'orange', 0.4],
            [0.86, 'orange', 0.12],
            [1, 'orange', 0],
          ],
        ],
        [
          0.56,
          [
            [0, 'red', 1],
            [0.09, 'orange', 1],
            [0.2, 'tangerine', 1],
            [0.26, 'amber', 1],
            [0.31, 'gold', 1],
            [0.345, 'cream', 1],
            [0.38, 'red', 1],
            [0.5, 'crimson', 1],
            [0.64, 'crimson', 0.85],
            [0.78, 'orange', 0.4],
            [0.92, 'orange', 0.1],
            [1, 'orange', 0],
          ],
        ],
      ],
    },
    {
      guides: PLUME,
      along: 150,
      runOn: [0, 1600],
      beads: 0.9,
      /* the heat behind the car: thin lines over a soft body, thinning into specks at its edges */
      lines: 0.55,
      soft: true,
      paint: [
        [
          0,
          [
            [0, 'cream', 0],
            [0.16, 'cream', 0.1],
            [0.3, 'gold', 0.72],
            [0.5, 'amber', 1],
            [0.72, 'orange', 1],
            [0.9, 'red', 0.55],
            [1, 'red', 0],
          ],
        ],
        [
          0.8,
          [
            [0, 'cream', 0],
            [0.16, 'cream', 0.1],
            [0.3, 'gold', 0.72],
            [0.5, 'amber', 1],
            [0.72, 'orange', 1],
            [0.9, 'red', 0.55],
            [1, 'red', 0],
          ],
        ],
        [
          1,
          [
            [0, 'orange', 0],
            [1, 'orange', 0],
          ],
        ],
      ],
    },
  ]

  /* How the lines are drawn. Lengths are in CSS pixels unless they say otherwise, so that the lines and
     beads are as fine in a small window as in a large one, where the picture is drawn smaller. */
  const LOOK = {
    /* the space from one line to the next, and the closest they may come in pixels of the screen */
    pitch: 2.4,
    closest: 2.2,
    /* how much of the spread and squeeze of the sheet shows in the space between the lines, the rest
       being taken up by adding and removing lines */
    keep: 0.25,
    /* lines between two guides, before they are added to or taken from */
    perGap: 8,
    /* mesh points between two guides */
    between: 4,
    /* how long a run of colour is, and the break between runs */
    brick: [38, 103],
    gap: 1,
    /* the beads: one chance per this much of a line, and how large */
    beadCell: 8.2,
    beadSize: 0.7,
    /* how much faster than the lines the beads go */
    beadFlow: 1.7,
    /* how far they draw out while the throttle is open */
    streak: 3.5,
    /* the body under the lines, the same colour let through to the page: paler between them on a
       light page, darker on a dark one */
    under: [0.76, 0.66],
    bodyHeat: [1, 0.64, 0.46],
    /* the planets' overlay grain */
    grain: 0.85,
    /* how fast the lines run, a millisecond */
    flow: 0.016,
    /* the slow rise and fall of everything but the pinch */
    breath: 5,
    breathSpeed: 0.00018,
    /* The pointer is a lens. The lines within reach of it swell apart and are dragged along a little, on a
       spring, so they settle when the pointer stops. However hard it is thrown the drag comes up against
       dragCap, in CSS pixels, each pixel further counting for less than the last. Holding it down opens
       the throttle. */
    reach: 140,
    part: 10,
    dragStiffness: 0.045,
    dragDamping: 0.82,
    dragGain: 0.045,
    dragCap: 20,
    throttle: 9,
    /* a press sends a ring through the lines */
    ringSpeed: 0.62,
    ringHeight: 15,
    /* the lines shoot across once, from the left */
    introMs: 1900,
    /* how far the grains thin out over at the bottom edge, and under the words */
    sink: 46,
    wordsFade: 26,
    /* how much higher than the buttons the lines may climb, clear of the words on either side */
    rise: 150,
  }

  /* The tile the planets are grained with, --lp-grain in the home page's styles. */
  const GRAIN =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.25' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 1.015 -0.0075 0 0 0 1.015 -0.0075 0 0 0 1.015 -0.0075 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
  const GRAIN_TILE = 160

  const VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aPlace;
  layout(location = 1) in vec2 aLine;
  layout(location = 2) in vec4 aSheet;
  layout(location = 3) in vec2 aMetric;
  uniform vec2 uCanvas;
  uniform vec3 uView;
  uniform vec2 uPinch;
  uniform float uClock;
  uniform float uBreath;
  uniform vec2 uPointer;
  uniform float uReach;
  uniform float uPart;
  uniform vec2 uDrag;
  uniform float uRing;
  uniform vec2 uRingAt;
  uniform float uRingHeight;
  out vec2 vLine;
  out vec4 vSheet;
  out vec2 vMetric;
  void main() {
    vLine = aLine;
    vSheet = aSheet;
    vMetric = aMetric;
    /* in CSS pixels from the top left of the canvas from here on */
    vec2 pixel = aPlace * uView.x + uView.yz;
    /* it all rises and falls a little, more the further it is from the pinch, which stays under the car */
    float loose = smoothstep(120.0, 1000.0, distance(aPlace, uPinch));
    pixel.y += loose * uBreath * (
      sin(aPlace.x * 0.0033 + aPlace.y * 0.006 + uClock) +
      0.5 * sin(aPlace.x * 0.0079 - aPlace.y * 0.011 - uClock * 0.7)
    );
    vec2 away = pixel - uPointer;
    float far = length(away);
    float near = exp(-far * far / (uReach * uReach));
    /* a lens: pushed out most part way from the pointer and not at all under it, so nothing tears, and
       the lines swell as they are spread */
    pixel += away * near * uPart / uReach * 1.65;
    pixel += uDrag * near;
    if (uRing > 0.0) {
      float front = uRing - distance(pixel, uRingAt);
      pixel.y += sin(front * 0.05) * exp(-front * front / 9000.0) * exp(-uRing * 0.0022) * uRingHeight;
    }
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`

  const FRAGMENT = `#version 300 es
  precision highp float;
  in vec2 vLine;
  in vec4 vSheet;
  in vec2 vMetric;
  uniform sampler2D uAtlas;
  uniform sampler2D uGrain;
  uniform vec2 uRow;
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uUnit;
  uniform float uPitch;
  uniform float uClosest;
  uniform float uKeep;
  uniform float uFlow;
  uniform float uThrottle;
  uniform float uHead;
  uniform vec2 uBrick;
  uniform float uGap;
  uniform float uBeadCell;
  uniform float uBeadChance;
  uniform float uBeadSize;
  uniform float uBeadFlow;
  uniform float uStreak;
  uniform vec3 uBeadBare;
  uniform float uBeadBareAlpha;
  uniform float uUnder;
  uniform float uLines;
  uniform vec2 uBodyRamp;
  uniform vec3 uBodyHeat;
  uniform float uGrainStrength;
  uniform float uTile;
  uniform float uSink;
  uniform vec4 uWords;
  uniform float uWordsFade;
  out vec4 outColor;

  /* Lines are numbered at this many halvings finer than the sheet's own, so a line keeps its number,
     and so its dice, as lines are added around it. */
  const float FINEST = 8.0;

  vec4 dice4(float p) {
    vec4 q = fract(vec4(p) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    q += dot(q, q.wzxy + 33.33);
    return fract((q.xxyz + q.yzzw) * q.zywx);
  }
  vec2 dice2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.xx + q.yz) * q.zy);
  }

  void main() {
    float across = vSheet.x;
    float along = vSheet.y;
    /* How far apart the sheet's own lines are here, on the screen. Lines are added as they spread and
       removed as they close up, so what is drawn keeps close to the pitch wherever it is, and a new
       line grows in from nothing between two others. */
    float spread = max(vSheet.z * uUnit, 0.001);
    float detail = min((1.0 - uKeep) * log2(spread / uPitch), log2(spread / uClosest));
    float level = floor(detail);
    float grow = smoothstep(0.0, 1.0, detail - level);
    float place = vLine.x * exp2(level);
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

    /* How far along the line this is. The mesh's rows do not always cross the lines squarely, so a
       place to one side of a line is taken back to the point on the line beside it, or the runs and
       the beads would come out slanted. */
    float offLine = (isOdd ? place - odd : place - even) * exp2(-level);
    float travelled = vLine.y + offLine * vMetric.y;
    float toPixels = uUnit * vMetric.x;

    /* its colour, with the bands' edges interleaved a little from line to line */
    float t = clamp(across + (dice.x - 0.5) * 0.02 + vSheet.w * 0.018, 0.0, 1.0);
    vec4 paint = texture(uAtlas, vec2(t, uRow.x + clamp(along, 0.0, 1.0) * uRow.y));
    float body = paint.a;

    /* the line itself: a fraction of the room it has, however little that is */
    float fill = uLines * 0.8 * pow(body, 0.7) * (0.82 + 0.36 * dice.y);
    float halfWidth = share * fill * 0.5;
    float cover = (1.0 - smoothstep(halfWidth - 0.6, halfWidth + 0.6, side)) * min(1.0, halfWidth * 1.7);

    /* broken into long runs that slide along it, and more often where it is fading out */
    float run = mix(uBrick.x, uBrick.y, dice.w);
    float runAt = (travelled - uFlow * (0.7 + 0.6 * dice.z)) / run + dice.x * 40.0;
    float runFrom = min(fract(runAt), 1.0 - fract(runAt)) * run * toPixels;
    float gap = uGap * uPixels * (1.0 - uThrottle);
    cover *= smoothstep(gap - 0.5, gap + 0.5, runFrom);
    cover *= step(dice2(vec2(line, floor(runAt))).x, 0.6 + body);

    /* The planets' grain, in pixels of the page, so it holds still while the lines go by under it */
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;

    /* Under the lines lies a body of the same colour. It is dithered by the grain rather than faded,
       so a band thins away into specks. */
    float haze = smoothstep(grain - 0.2, grain + 0.2, smoothstep(uBodyRamp.x, uBodyRamp.y, body));
    vec3 ink = paint.rgb * (0.92 + 0.16 * dice.y);
    vec3 color = mix(paint.rgb * uBodyHeat, ink, cover);
    float alpha = max(cover, haze * uUnder);

    /* overlay, so white stays white and the colours take the grain */
    vec3 overlaid = mix(2.0 * color * grain, 1.0 - 2.0 * (1.0 - color) * (1.0 - grain), step(0.5, color));
    color = mix(color, overlaid, uGrainStrength);

    /* The beads slide along the line a little faster than it does, and draw out into thin dashes at speed */
    float spot = (travelled - uFlow * uBeadFlow * (0.6 + 0.8 * dice.y)) / uBeadCell + dice.z * 57.0;
    vec2 roll = dice2(vec2(line, floor(spot)));
    float beadAt = (fract(spot) - 0.2 - 0.6 * roll.y) * uBeadCell * toPixels;
    float size = fract(roll.y * 7.0);
    float radius = uBeadSize * uPixels * (0.5 + 0.8 * size * size) * (isOdd ? grow : 1.0);
    float stretch = 1.0 + uThrottle * uStreak;
    float tall = mix(1.0, 1.25, body) * (1.0 - 0.45 * uThrottle);
    float bead = 1.0 - smoothstep(radius - 0.6, radius + 0.6, length(vec2(beadAt / stretch, side / tall)));
    /* the rows of a short line lie closer together, so its beads are fewer for the same spacing */
    bead *= step(roll.x, uBeadChance * min(1.0, vMetric.x)) * min(1.0, radius);
    /* pale on the colour, and the page's own kind of speck off it */
    vec3 beadInk = mix(uBeadBare, mix(vec3(1.0, 0.96, 0.9), paint.rgb, 0.1), alpha);
    color = mix(color, beadInk, bead * 0.92);
    alpha = max(alpha, bead * mix(uBeadBareAlpha, 1.0, alpha));

    /* The lines shoot across on the way in, each a little ahead or behind the next */
    float front = uHead * 1.3 - dice.x * 0.3;
    float shown = 1.0 - smoothstep(front - 0.012, front, along);

    /* the grains thin out at the bottom edge and under the words, so nothing is simply cut off */
    vec2 css = vec2(gl_FragCoord.x, uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    float sink = (uCanvas.y - css.y) / uSink;
    float ceiling = uWords.z - uWords.w * smoothstep(uWords.y, uWords.y + 170.0, abs(css.x - uWords.x));
    float stay = clamp(min(sink, (css.y - ceiling + uWordsFade) / uWordsFade), 0.0, 1.0);
    alpha *= shown * smoothstep(grain - 0.25, grain + 0.25, stay);

    color = min(color, vec3(1.0));
    outColor = vec4(color * alpha, alpha);
  }`

  /* The heat: a few soft shapes on the ground and a few streaks, drawn after the lines and under the car. */
  const HEAT_VERTEX = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 aPlace;
  layout(location = 1) in vec2 aMark;
  layout(location = 2) in vec4 aInk;
  layout(location = 3) in vec3 aKind;
  uniform vec2 uCanvas;
  uniform vec4 uView;
  uniform vec2 uPointer;
  uniform float uReach;
  uniform float uPart;
  uniform vec2 uDrag;
  out vec2 vMark;
  out vec4 vInk;
  out vec3 vKind;
  void main() {
    vMark = aMark;
    vInk = aInk;
    vKind = aKind;
    vec2 pixel = aPlace * uView.xy + uView.zw;
    /* the streaks are among the lines and go with them under the pointer; the ground stays put */
    vec2 away = pixel - uPointer;
    float near = exp(-dot(away, away) / (uReach * uReach)) * aKind.x;
    pixel += away * near * uPart / uReach * 1.65 + uDrag * near;
    gl_Position = vec4(pixel.x / uCanvas.x * 2.0 - 1.0, 1.0 - pixel.y / uCanvas.y * 2.0, 0.0, 1.0);
  }`

  const HEAT_FRAGMENT = `#version 300 es
  precision highp float;
  in vec2 vMark;
  in vec4 vInk;
  in vec3 vKind;
  uniform sampler2D uGrain;
  uniform vec2 uCanvas;
  uniform float uPixels;
  uniform float uTile;
  uniform float uClock;
  uniform float uShow;
  uniform float uSink;
  out vec4 outColor;
  void main() {
    float grain = texture(uGrain, gl_FragCoord.xy / uTile).r;
    vec3 color = vInk.rgb;
    float strength;
    if (vKind.x > 0.5) {
      /* along it from 0 to 1, across it from -1 to 1: a white-hot hair inside a soft glow, thinning away */
      float off = vMark.y * vMark.y;
      float core = exp(-off * 70.0);
      float glow = exp(-off * 9.0) * 0.7 + exp(-off * 2.6) * 0.22;
      float ends = smoothstep(0.0, 0.05, vMark.x) * pow(1.0 - vMark.x, 1.3);
      float live = 0.82 + 0.18 * sin(vMark.x * 60.0 - uClock * 2.2 + vInk.a * 40.0);
      strength = (core + glow) * ends * live;
      color = mix(color, vec3(1.0, 0.97, 0.9), core * ends);
    } else {
      strength = exp(-dot(vMark, vMark) * 2.6) - 0.02;
    }
    strength = max(strength, 0.0) * vInk.a * uShow;
    /* thinned by the grain like everything else on the page, as much as this shape asks */
    float amount = mix(strength, smoothstep(grain - 0.25, grain + 0.25, strength), vKind.z);
    /* and nothing is simply cut off at the bottom edge */
    float css = uCanvas.y - (uCanvas.y * uPixels - gl_FragCoord.y) / uPixels;
    float stay = clamp(css / uSink, 0.0, 1.0);
    amount *= mix(stay, smoothstep(grain - 0.25, grain + 0.25, stay), vKind.z);
    /* part laid on and part added, so it burns over the lines and still shows on the bare page */
    outColor = vec4(color * amount, amount * (1.0 - vKind.y));
  }`

  /* --- the shape ---------------------------------------------------------------------------------- */

  /* A smooth line through a guide's points. The spacing of the points is not even, and a hairpin in a
     plain Catmull-Rom curve loops, so this is the centripetal kind. */
  const smoothGuide = (flat, perPoint = 14) => {
    const points = []
    for (let index = 0; index < flat.length; index += 2) {
      points.push([flat[index], flat[index + 1]])
    }
    const last = points.length - 1
    const at = (index) => {
      if (index < 0) {
        return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]]
      }
      if (index > last) {
        return [2 * points[last][0] - points[last - 1][0], 2 * points[last][1] - points[last - 1][1]]
      }
      return points[index]
    }
    const knot = (a, b) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5)
    const between = (a, b, ta, tb, t) => {
      const f = (t - ta) / (tb - ta)
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    const line = []
    for (let index = 0; index < last; index += 1) {
      const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)]
      const t0 = 0
      const t1 = t0 + knot(p0, p1)
      const t2 = t1 + knot(p1, p2)
      const t3 = t2 + knot(p2, p3)
      for (let step = 0; step < perPoint; step += 1) {
        const t = t1 + ((t2 - t1) * step) / perPoint
        const a1 = between(p0, p1, t0, t1, t)
        const a2 = between(p1, p2, t1, t2, t)
        const a3 = between(p2, p3, t2, t3, t)
        const b1 = between(a1, a2, t0, t2, t)
        const b2 = between(a2, a3, t1, t3, t)
        line.push(between(b1, b2, t1, t2, t))
      }
    }
    line.push(points[last])
    return line
  }

  /* So many points evenly spaced along a stretch of a line */
  const spaceEvenly = (line, from, to, count) => {
    const lengths = [0]
    for (let index = from + 1; index <= to; index += 1) {
      lengths.push(
        lengths[lengths.length - 1] +
          Math.hypot(line[index][0] - line[index - 1][0], line[index][1] - line[index - 1][1]),
      )
    }
    const total = lengths[lengths.length - 1]
    const out = []
    let segment = 0
    for (let index = 0; index < count; index += 1) {
      const wanted = (total * index) / (count - 1)
      while (segment < lengths.length - 2 && lengths[segment + 1] < wanted) {
        segment += 1
      }
      const span = lengths[segment + 1] - lengths[segment] || 1
      const f = (wanted - lengths[segment]) / span
      const a = line[from + segment]
      const b = line[from + segment + 1]
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
    }
    return out
  }

  /* A guide carried on in a straight line past either end of it, so that the widest window never sees
     where the lines stop. */
  const runOn = (flat, before, after) => {
    const carry = (x, y, fromX, fromY, by) => {
      const length = Math.hypot(x - fromX, y - fromY) || 1
      return [x + ((x - fromX) / length) * by, y + ((y - fromY) / length) * by]
    }
    const last = flat.length - 2
    return [
      ...(before ? carry(flat[0], flat[1], flat[2], flat[3], before) : []),
      ...flat,
      ...(after ? carry(flat[last], flat[last + 1], flat[last - 2], flat[last - 1], after) : []),
    ]
  }

  /* A guide laid out as a row of the mesh. Where a sheet has an anchor, every guide reaches the middle
     of its row where it last crosses that column of the picture, so a row runs square across the lines
     through the pinch, whichever way each of them got there. */
  const layGuide = (flat, along, anchor, [before, after] = [0, 0]) => {
    const line = smoothGuide(runOn(flat, before, after))
    if (anchor === undefined) {
      return spaceEvenly(line, 0, line.length - 1, along + 1)
    }
    let cross = line.length - 2
    while (cross > 0 && (line[cross][0] - anchor) * (line[cross + 1][0] - anchor) > 0) {
      cross -= 1
    }
    const half = Math.round(along / 2)
    return [...spaceEvenly(line, 0, cross, half), ...spaceEvenly(line, cross, line.length - 1, along + 1 - half)]
  }

  /* From one guide to the next on a curve, kept from overshooting where the guides are unevenly spaced */
  const blendGuides = (a, b, c, d, f) => {
    const slope = (before, here, after) => {
      const x = (after[0] - before[0]) / 2
      const y = (after[1] - before[1]) / 2
      const most = Math.min(
        Math.hypot(after[0] - here[0], after[1] - here[1]),
        Math.hypot(here[0] - before[0], here[1] - before[1]),
      )
      const scale = Math.min(1, most / (Math.hypot(x, y) || 1))
      return [x * scale, y * scale]
    }
    const mb = slope(a, b, c)
    const mc = slope(b, c, d)
    const f2 = f * f
    const f3 = f2 * f
    const h00 = 2 * f3 - 3 * f2 + 1
    const h10 = f3 - 2 * f2 + f
    const h01 = -2 * f3 + 3 * f2
    const h11 = f3 - f2
    return [h00 * b[0] + h10 * mb[0] + h01 * c[0] + h11 * mc[0], h00 * b[1] + h10 * mb[1] + h01 * c[1] + h11 * mc[1]]
  }

  /* Soft, slow noise for the blotches in the colour, always the same */
  const blotches = (columns, rows) => {
    const stepAcross = 3
    const stepAlong = 9
    const lattice = new Float32Array((Math.ceil(columns / stepAcross) + 2) * (Math.ceil(rows / stepAlong) + 2))
    const wide = Math.ceil(columns / stepAcross) + 2
    let seed = 7
    for (let index = 0; index < lattice.length; index += 1) {
      seed = (seed * 16807) % 2147483647
      lattice[index] = (seed / 2147483647) * 2 - 1
    }
    return (column, row) => {
      const x = column / stepAcross
      const y = row / stepAlong
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      const fx = x - xi
      const fy = y - yi
      const sx = fx * fx * (3 - 2 * fx)
      const sy = fy * fy * (3 - 2 * fy)
      const top = lattice[yi * wide + xi] * (1 - sx) + lattice[yi * wide + xi + 1] * sx
      const bottom = lattice[(yi + 1) * wide + xi] * (1 - sx) + lattice[(yi + 1) * wide + xi + 1] * sx
      return top * (1 - sy) + bottom * sy
    }
  }

  /* Loft a sheet between its guides. Each mesh point knows where it lies, which line it is on and how
     far along that line, where it is on the sheet, and how far apart the lines are there. */
  const loftSheet = ({ guides, along, anchor, runOn: reach }) => {
    const rows = guides.map((flat) => layGuide(flat, along, anchor, reach))
    const gaps = rows.length - 1
    const columns = gaps * LOOK.between + 1
    const places = []
    for (let column = 0; column < columns; column += 1) {
      const gap = Math.min(gaps - 1, Math.floor(column / LOOK.between))
      const f = column / LOOK.between - gap
      const a = rows[Math.max(0, gap - 1)]
      const b = rows[gap]
      const c = rows[gap + 1]
      const d = rows[Math.min(gaps, gap + 2)]
      const row = []
      for (let index = 0; index <= along; index += 1) {
        row.push(blendGuides(a[index], b[index], c[index], d[index], f))
      }
      places.push(row)
    }
    /* Distance along a line is counted in rows, one row being this many units on the average line: a
       row is the same row on every line, so the count runs true along the lines and does not creep
       from one line to the next. */
    let length = 0
    for (let index = 1; index <= along; index += 1) {
      const row = places[Math.floor(columns / 2)]
      length += Math.hypot(row[index][0] - row[index - 1][0], row[index][1] - row[index - 1][1])
    }
    const meanRow = length / along
    const noise = blotches(columns, along + 1)
    const linesPerColumn = LOOK.perGap / LOOK.between
    const vertices = new Float32Array(columns * (along + 1) * 10)
    let write = 0
    for (let column = 0; column < columns; column += 1) {
      for (let index = 0; index <= along; index += 1) {
        const here = places[column][index]
        const firstRow = Math.max(0, index - 1)
        const lastRow = Math.min(along, index + 1)
        const firstColumn = Math.max(0, column - 1)
        const lastColumn = Math.min(columns - 1, column + 1)
        /* the way the line runs here and the way the next line lies, both per step of their own */
        const rows = lastRow - firstRow
        const lines = (lastColumn - firstColumn) * linesPerColumn
        const tx = (places[column][lastRow][0] - places[column][firstRow][0]) / rows
        const ty = (places[column][lastRow][1] - places[column][firstRow][1]) / rows
        const ax = (places[lastColumn][index][0] - places[firstColumn][index][0]) / lines
        const ay = (places[lastColumn][index][1] - places[firstColumn][index][1]) / lines
        const rowLength = Math.hypot(tx, ty) || 1e-3
        const scale = rowLength / meanRow
        vertices[write] = here[0]
        vertices[write + 1] = here[1]
        vertices[write + 2] = (column / LOOK.between) * LOOK.perGap
        vertices[write + 3] = index * meanRow
        vertices[write + 4] = column / (columns - 1)
        vertices[write + 5] = index / along
        /* how far apart the lines are, square to them */
        vertices[write + 6] = Math.abs(ax * ty - ay * tx) / rowLength
        vertices[write + 7] = noise(column, index)
        vertices[write + 8] = scale
        /* how far along the line the next line's same row lies */
        vertices[write + 9] = (ax * tx + ay * ty) / rowLength / scale
        write += 10
      }
    }
    const indices = new Uint32Array((columns - 1) * along * 6)
    let point = 0
    for (let column = 0; column < columns - 1; column += 1) {
      for (let index = 0; index < along; index += 1) {
        const a = column * (along + 1) + index
        const b = a + along + 1
        indices.set([a, b, a + 1, b, b + 1, a + 1], point)
        point += 6
      }
    }
    return { vertices, indices }
  }

  /* The heat's shapes, as flat lists of place, mark, ink and kind. Everything in them is in the units of
     its own space, the car's or the picture's, which is why there are two lists. */
  const shapeHeat = (streaks, grounds = []) => {
    const vertices = []
    const indices = []
    const toInk = (hex) => toColor(hex).map((value) => value / 255)
    const blob = ([x, y, across, deep, turned, hex, strength], add, dither) => {
      const first = vertices.length / 11
      const angle = (turned * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      for (const [u, v] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        /* the soft shape has all but gone by the corners of this */
        const px = u * across * 1.5
        const py = v * deep * 1.5
        vertices.push(
          x + px * cos - py * sin,
          y + px * sin + py * cos,
          u * 1.5,
          v * 1.5,
          ...toInk(hex),
          strength,
          0,
          add,
          dither,
        )
      }
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3)
    }
    const streak = ([flat, [from, to], hex, strength]) => {
      const line = smoothGuide(flat, 12)
      const lengths = [0]
      for (let index = 1; index < line.length; index += 1) {
        lengths.push(
          lengths[index - 1] + Math.hypot(line[index][0] - line[index - 1][0], line[index][1] - line[index - 1][1]),
        )
      }
      const total = lengths[lengths.length - 1]
      const first = vertices.length / 11
      line.forEach(([x, y], index) => {
        const before = line[Math.max(0, index - 1)]
        const after = line[Math.min(line.length - 1, index + 1)]
        const tx = after[0] - before[0]
        const ty = after[1] - before[1]
        const size = Math.hypot(tx, ty) || 1
        const along = lengths[index] / total
        const wide = from + (to - from) * along
        for (const side of [-1, 1]) {
          vertices.push(
            x - (ty / size) * wide * side,
            y + (tx / size) * wide * side,
            along,
            side,
            ...toInk(hex),
            strength,
            1,
            0.3,
            0.15,
          )
        }
      })
      for (let index = 0; index < line.length - 1; index += 1) {
        const a = first + index * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    grounds.forEach(([shapes, add, dither]) => shapes.forEach((shape) => blob(shape, add, dither)))
    streaks.forEach(streak)
    return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) }
  }

  /* --- the colour --------------------------------------------------------------------------------- */

  const ATLAS = { wide: 256, rows: 24 }

  const toColor = (hex) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]

  /* one row of a sheet's paint, at a place across it, as red, green, blue and body */
  const readStops = (stops, t, theme) => {
    let index = 0
    while (index < stops.length - 2 && stops[index + 1][0] < t) {
      index += 1
    }
    const [ta, inkA, bodyA] = stops[index]
    const [tb, inkB, bodyB] = stops[Math.min(stops.length - 1, index + 1)]
    const f = Math.max(0, Math.min(1, tb === ta ? 0 : (t - ta) / (tb - ta)))
    const a = toColor(INK[inkA][theme])
    const b = toColor(INK[inkB][theme])
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
      (bodyA + (bodyB - bodyA) * f) * 255,
    ]
  }

  /* All the sheets' paint, in both themes, in one small picture read by the fragment shader */
  const paintAtlas = () => {
    const high = ATLAS.rows * SHEETS.length * 2
    const data = new Uint8Array(ATLAS.wide * high * 4)
    let write = 0
    for (let theme = 0; theme < 2; theme += 1) {
      for (const { paint } of SHEETS) {
        for (let row = 0; row < ATLAS.rows; row += 1) {
          const along = row / (ATLAS.rows - 1)
          let index = 0
          while (index < paint.length - 2 && paint[index + 1][0] < along) {
            index += 1
          }
          const [sa, stopsA] = paint[index]
          const [sb, stopsB] = paint[Math.min(paint.length - 1, index + 1)]
          const f = Math.max(0, Math.min(1, sb === sa ? 0 : (along - sa) / (sb - sa)))
          for (let column = 0; column < ATLAS.wide; column += 1) {
            const across = column / (ATLAS.wide - 1)
            const a = readStops(stopsA, across, theme)
            const b = readStops(stopsB, across, theme)
            for (let channel = 0; channel < 4; channel += 1) {
              data[write] = a[channel] + (b[channel] - a[channel]) * f
              write += 1
            }
          }
        }
      }
    }
    return { data, high }
  }

  const compile = (gl, vertex, fragment) => {
    const program = gl.createProgram()
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ]) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'shader did not compile')
      }
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'program did not link')
    }
    const uniforms = {}
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let index = 0; index < count; index += 1) {
      const { name } = gl.getActiveUniform(program, index)
      uniforms[name] = gl.getUniformLocation(program, name)
    }
    return { program, uniforms }
  }

  /* What the hero currently bound is holding, so a page that drops any of it can be noticed */
  let release = () => {}
  let holding = []
  /* What a hero the page has just swapped hands to the one that replaced it: the lines' clocks, so they
     carry on where they were, and what is slow to work out, so the page does not pay for it twice. */
  let carried = null
  /* how many times it has bound again after losing the context; it does so twice, and the next loss
     leaves the car alone */
  let rebuilds = 0
  let noLines = false

  const bind = () => {
    const flow = document.querySelector('.sh-flow')
    if (!flow || flow.dataset.shBound === 'true') {
      return
    }
    const hero = flow.closest('.dh-hero')
    if (!hero) {
      return
    }
    flow.dataset.shBound = 'true'

    /* Where the car stands. It is here rather than with the rest of the sizing because it stands there
       with or without the lines. */
    const car = { scale: 1, down: 1, x: 0, y: 0 }
    /* The room ends 48px above the logos. Under reduced motion they lie out in rows and the foot grows,
       and the car and the lines have to give way to it. Writing this moves the flow, and whatever watches
       the flow does the rest. There is nothing to fit until the flow is open: before that the page's
       styles may not have arrived, and the foot would measure thousands of pixels. */
    const fitRoom = () => {
      const foot = hero.querySelector('.dh-foot')
      if (foot && flow.getClientRects().length) {
        const clear = hero.getBoundingClientRect().bottom - foot.getBoundingClientRect().top + 48
        hero.style.setProperty('--dh-foot', `${Math.round(clear)}px`)
      }
    }
    /* The foot can change with the flow's box staying put, as when reduced motion is switched. It is
       fitted on the next frame, so that the flow's own observer hears of the move in that frame and does
       not count it as a loop. */
    const footWatcher = new ResizeObserver(() => {
      requestAnimationFrame(fitRoom)
    })
    /* landing.js opens the flow by measuring the hero. Fitting straight after it means the first thing
       the flow's observer sees is already right, and nothing has to move once it is on the screen. */
    const onOpened = () => {
      const foot = hero.querySelector('.dh-foot')
      if (foot && flow.getClientRects().length) {
        footWatcher.observe(foot)
        fitRoom()
      }
    }
    const opened = new MutationObserver(onOpened)
    opened.observe(hero, { attributes: true, attributeFilter: ['data-dh-bleed'] })
    onOpened()
    const placeCar = () => {
      const box = flow.getBoundingClientRect()
      if (!box.width || !box.height) {
        return
      }
      const buttons = hero.querySelector('.dh-cta')
      const under = buttons ? buttons.getBoundingClientRect().bottom - box.top : box.height / 2
      const room = box.height - under
      /* a landscape phone is wide, but there is as little under its buttons as there is on a narrow screen */
      const narrow = box.width < CAR.narrow || room < CAR.narrowRoom
      const across = narrow
        ? Math.min(box.width * CAR.ofNarrowWidth, room * CAR.ofNarrowRoom)
        : Math.min(box.width * CAR.ofWidth, room * CAR.ofRoom)
      car.scale = across / (CAR.box[2] - CAR.box[0])
      car.down = car.scale * CAR.low
      car.x = (narrow ? (box.width - across) / 2 : box.width * CAR.left) - CAR.box[0] * car.scale
      car.y = under + room * CAR.foot - CAR.box[3] * car.down
      flow.style.setProperty('--sh-car-s', car.scale)
      flow.style.setProperty('--sh-car-sy', car.down)
      flow.style.setProperty('--sh-car-x', `${car.x}px`)
      flow.style.setProperty('--sh-car-y', `${car.y}px`)
      /* the car waits for this: laid out any earlier it would stand in the corner, and moving it from
         there counts against the page as a layout shift even though it is never painted there */
      flow.dataset.shPlaced = 'true'
    }

    const canvas = document.createElement('canvas')
    flow.append(canvas)
    const gl = noLines
      ? null
      : canvas.getContext('webgl2', {
          alpha: true,
          antialias: false,
          depth: false,
          premultipliedAlpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: true,
        })
    /* A context can still fail to compile, or be lost while it does. Asked here, that is simply one more
       machine that cannot draw, and not a throw halfway through binding with nothing on the page. */
    let shaders = null
    if (gl) {
      try {
        shaders = [compile(gl, VERTEX, FRAGMENT), compile(gl, HEAT_VERTEX, HEAT_FRAGMENT)]
      } catch {
        shaders = null
      }
    }
    if (!shaders) {
      /* no pattern on a machine that cannot draw it: the words, the car and the logos stand by themselves */
      canvas.remove()
      flow.style.cursor = 'auto'
      const alone = new ResizeObserver(() => {
        fitRoom()
        placeCar()
      })
      alone.observe(flow)
      holding = [flow]
      release = () => {
        release = () => {}
        holding = []
        alone.disconnect()
        opened.disconnect()
        footWatcher.disconnect()
        flow.style.removeProperty('cursor')
        delete flow.dataset.shBound
      }
      return
    }
    holding = [flow, canvas]

    /* The browser can take the context back: a GPU reset, or too many pages holding one. It lets go and
       binds again on a fresh canvas, twice at most; after that the car and the words stand by themselves.
       Removing the canvas is what binds it again, through the page's watcher. The old context is not
       asked for back, since nothing would use it. Taking it back here is also how release() ends, which
       is not a loss. */
    canvas.addEventListener('webglcontextlost', () => {
      if (holding.includes(canvas)) {
        noLines = rebuilds >= 2
        rebuilds += 1
        release()
      }
    })

    const [program, heatProgram] = shaders
    const lofts = carried ? carried.lofts : SHEETS.map(loftSheet)
    const sheets = SHEETS.map((sheet, index) => {
      const { vertices, indices } = lofts[index]
      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 40, 0)
      gl.enableVertexAttribArray(1)
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 40, 8)
      gl.enableVertexAttribArray(2)
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 16)
      gl.enableVertexAttribArray(3)
      gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 40, 32)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
      gl.bindVertexArray(null)
      return { vao, count: indices.length, beads: sheet.beads, lines: sheet.lines ?? 1, soft: sheet.soft === true }
    })

    /* The heat is one buffer: what lies under the lines, what belongs to the lines, and what is over them. */
    const heatParts = [
      shapeHeat([], [[WARMTH, 0, 0.9]]),
      shapeHeat(PICTURE_STREAKS),
      shapeHeat(STREAKS, [
        [SHADOWS, 0, 0],
        [FLARES, 0.55, 0.1],
      ]),
    ]
    const heatVertices = new Float32Array(heatParts.reduce((sum, part) => sum + part.vertices.length, 0))
    const heatIndices = new Uint32Array(heatParts.reduce((sum, part) => sum + part.indices.length, 0))
    const heatRanges = []
    let heatVertexAt = 0
    let heatIndexAt = 0
    for (const part of heatParts) {
      heatVertices.set(part.vertices, heatVertexAt)
      heatIndices.set(
        part.indices.map((index) => index + heatVertexAt / 11),
        heatIndexAt,
      )
      heatRanges.push([heatIndexAt, part.indices.length])
      heatVertexAt += part.vertices.length
      heatIndexAt += part.indices.length
    }
    const heatVao = gl.createVertexArray()
    gl.bindVertexArray(heatVao)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, heatVertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 44, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 44, 8)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 16)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 44, 32)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, heatIndices, gl.STATIC_DRAW)
    gl.bindVertexArray(null)

    const painted = carried ? carried.painted : paintAtlas()
    const { data: atlasData, high: atlasHigh } = painted
    const atlas = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, atlas)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ATLAS.wide, atlasHigh, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlasData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    /* Plain mid-grey does nothing under an overlay, so the lines are simply clean until the tile is in */
    const grainTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, grainTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

    let width = 0
    let height = 0
    let pixels = 1
    /* the most pixels to a CSS pixel it may draw */
    let finest = 2
    let slowFrames = 0
    let unit = 1
    let viewX = 0
    let viewY = 0
    let words = [0, 0, 0, 0]
    let dark = document.body.classList.contains('dark-mode')
    /* it can be switched with the page open, and the lines follow at once */
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motion.matches
    /* A swap of the page while it hydrates carries on from where the lines had got to. The clock itself
       starts on the first frame with room to draw in: the room is held back until it has its real width. */
    let flowed = carried ? carried.flowed : 0
    let clockAt = carried ? carried.clockAt : 0
    let began = carried ? carried.began : 0

    /* The pointer, and what it has done to the lines */
    const pointer = { x: -9999, y: -9999, tx: 0, ty: 0, lastX: 0, lastY: 0, inside: false }
    const drag = { x: 0, y: 0, vx: 0, vy: 0 }
    let part = 0
    let throttle = 0
    let held = false
    let ring = 0
    let ringX = 0
    let ringY = 0
    let wheel = 0

    /* Drawn at the size of the screen's pixels, so a tile of it is as fine here as on the planets. */
    const grainImage = new Image()
    const loadGrain = () => {
      const side = GRAIN_TILE * pixels
      const paper = document.createElement('canvas')
      paper.width = side
      paper.height = side
      const context = paper.getContext('2d', { willReadFrequently: true })
      context.drawImage(grainImage, 0, 0, side, side)
      /* a browser that will not draw an SVG filter on a canvas gets noise of the same size and contrast */
      const image = context.getImageData(0, 0, side, side)
      let total = 0
      for (let index = 0; index < image.data.length; index += 4) {
        total += image.data[index]
      }
      const mean = total / (image.data.length / 4)
      if (mean < 70 || mean > 190) {
        for (let index = 0; index < image.data.length; index += 4) {
          const grey = 128 + (Math.random() + Math.random() - 1) * 90
          image.data[index] = grey
          image.data[index + 1] = grey
          image.data[index + 2] = grey
          image.data[index + 3] = 255
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, grainTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, side, side, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data)
    }
    grainImage.onload = () => {
      if (holding.includes(canvas)) {
        loadGrain()
        draw()
      }
    }

    const size = () => {
      fitRoom()
      const box = flow.getBoundingClientRect()
      if (!box.width || !box.height) {
        return false
      }
      if (!began) {
        began = performance.now()
      }
      const wasPixels = pixels
      pixels = Math.min(window.devicePixelRatio || 1, finest)
      width = box.width
      height = box.height
      canvas.width = Math.round(width * pixels)
      canvas.height = Math.round(height * pixels)
      /* The picture stands on the bottom edge with its top just touching the buttons, but never so
         large that the car would not fit across the screen. */
      const buttons = hero.querySelector('.dh-cta')
      const under = buttons ? buttons.getBoundingClientRect() : null
      const room = under ? height - (under.bottom - box.top) : height / 2
      unit = Math.max(Math.min((room * 1.03) / PICTURE.height, width / PICTURE.car), width / PICTURE.span)
      /* on a narrow screen the car is what is kept in the middle */
      const focus = width < 760 ? 1075 : PICTURE.width / 2
      viewX = width / 2 - focus * unit
      viewY = height - PICTURE.height * unit
      placeCar()
      const lede = hero.querySelector('.dh-lede')
      const copy = lede ? lede.getBoundingClientRect() : box
      words = [copy.left + copy.width / 2 - box.left, copy.width / 2 + 24, under ? under.top - box.top : 0, LOOK.rise]
      if (wasPixels !== pixels && grainImage.complete && grainImage.naturalWidth) {
        loadGrain()
      }
      return true
    }

    /* the lines shooting across, fast and then settling */
    const headNow = (now) => {
      const through = reduced ? 1 : Math.min(1, (now - began) / LOOK.introMs)
      return through >= 1 ? 1 : 1 - 2 ** (-7 * through)
    }

    const draw = () => {
      if (!width) {
        return
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      const pulled = Math.hypot(drag.x, drag.y)
      const shown = pulled ? (LOOK.dragCap * (1 - Math.exp(-pulled / LOOK.dragCap))) / pulled : 1
      const dragX = drag.x * shown
      const dragY = drag.y * shown
      const h = heatProgram.uniforms
      gl.useProgram(heatProgram.program)
      gl.uniform2f(h.uCanvas, width, height)
      gl.uniform2f(h.uPointer, pointer.x, pointer.y)
      gl.uniform1f(h.uReach, LOOK.reach)
      gl.uniform1f(h.uPart, LOOK.part * part)
      gl.uniform2f(h.uDrag, dragX, dragY)
      gl.uniform1f(h.uPixels, pixels)
      gl.uniform1f(h.uTile, GRAIN_TILE * pixels)
      gl.uniform1f(h.uClock, clockAt * 0.001)
      /* it comes up as the lines arrive */
      gl.uniform1f(h.uShow, Math.max(0, Math.min(1, (headNow(performance.now()) - 0.55) / 0.45)))
      gl.uniform1f(h.uSink, LOOK.sink)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, grainTexture)
      gl.uniform1i(h.uGrain, 1)
      const drawHeat = (range, across, down, x, y) => {
        gl.useProgram(heatProgram.program)
        gl.bindVertexArray(heatVao)
        gl.uniform4f(h.uView, across, down, x, y)
        gl.drawElements(gl.TRIANGLES, heatRanges[range][1], gl.UNSIGNED_INT, heatRanges[range][0] * 4)
      }
      drawHeat(0, car.scale, car.down, car.x, car.y)
      gl.useProgram(program.program)
      const u = program.uniforms
      const theme = dark ? 1 : 0
      gl.uniform2f(u.uCanvas, width, height)
      gl.uniform3f(u.uView, unit, viewX, viewY)
      gl.uniform2f(u.uPinch, PICTURE.pinch[0], PICTURE.pinch[1])
      gl.uniform1f(u.uClock, clockAt * LOOK.breathSpeed)
      gl.uniform1f(u.uBreath, LOOK.breath * Math.min(1, unit / 0.5))
      gl.uniform2f(u.uPointer, pointer.x, pointer.y)
      gl.uniform1f(u.uReach, LOOK.reach)
      gl.uniform1f(u.uPart, LOOK.part * part)
      gl.uniform2f(u.uDrag, dragX, dragY)
      gl.uniform1f(u.uRing, ring)
      gl.uniform2f(u.uRingAt, ringX, ringY)
      gl.uniform1f(u.uRingHeight, LOOK.ringHeight)
      gl.uniform1f(u.uPixels, pixels)
      gl.uniform1f(u.uUnit, unit * pixels)
      gl.uniform1f(u.uPitch, LOOK.pitch * pixels)
      gl.uniform1f(u.uClosest, LOOK.closest)
      gl.uniform1f(u.uKeep, LOOK.keep)
      gl.uniform1f(u.uFlow, flowed / unit)
      gl.uniform1f(u.uThrottle, throttle)
      gl.uniform1f(u.uHead, headNow(performance.now()))
      gl.uniform2f(u.uBrick, LOOK.brick[0] / unit, LOOK.brick[1] / unit)
      gl.uniform1f(u.uGap, LOOK.gap)
      gl.uniform1f(u.uBeadCell, LOOK.beadCell / unit)
      gl.uniform1f(u.uBeadSize, LOOK.beadSize)
      gl.uniform1f(u.uBeadFlow, LOOK.beadFlow)
      gl.uniform1f(u.uStreak, LOOK.streak)
      if (dark) {
        gl.uniform3f(u.uBeadBare, 1, 0.94, 0.88)
        gl.uniform1f(u.uBeadBareAlpha, 0.8)
      } else {
        gl.uniform3f(u.uBeadBare, 1, 0.4, 0.05)
        gl.uniform1f(u.uBeadBareAlpha, 0.85)
      }

      gl.uniform1f(u.uGrainStrength, LOOK.grain)
      gl.uniform1f(u.uTile, GRAIN_TILE * pixels)
      gl.uniform1f(u.uSink, LOOK.sink)
      gl.uniform4f(u.uWords, words[0], words[1], words[2], words[3])
      gl.uniform1f(u.uWordsFade, LOOK.wordsFade)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, atlas)
      gl.uniform1i(u.uAtlas, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, grainTexture)
      gl.uniform1i(u.uGrain, 1)
      sheets.forEach((sheet, index) => {
        /* the middle of the sheet's first row of paint, and how far it is to the middle of its last */
        const first = (theme * SHEETS.length + index) * ATLAS.rows + 0.5
        gl.uniform2f(u.uRow, first / atlasHigh, (ATLAS.rows - 1) / atlasHigh)
        gl.uniform1f(u.uBeadChance, sheet.beads)
        gl.uniform1f(u.uLines, sheet.lines)
        gl.uniform1f(u.uUnder, sheet.soft ? 1 : LOOK.under[theme])
        gl.uniform2f(u.uBodyRamp, sheet.soft ? 0 : 0.5, 1)
        /* the body runs hotter than the line over it, so a gap in gold shows orange and not a dull olive */
        gl.uniform3fv(u.uBodyHeat, sheet.soft ? [1, 1, 1] : LOOK.bodyHeat)
        gl.bindVertexArray(sheet.vao)
        gl.drawElements(gl.TRIANGLES, sheet.count, gl.UNSIGNED_INT, 0)
      })
      drawHeat(1, unit, unit, viewX, viewY)
      drawHeat(2, car.scale, car.down, car.x, car.y)
      gl.bindVertexArray(null)
    }

    /* --- running it ------------------------------------------------------------------------- */

    let running = false
    let inView = false
    let previous = 0
    /* The frame that has already been asked for. A tab sent to the background stops running its
       frame callbacks but keeps the last one it was given, so asking for another on the way back
       would leave two chains of frames driving the lines. */
    let frame = 0

    const step = (now) => {
      frame = 0
      if (!running) {
        return
      }
      const elapsed = Math.min(64, now - previous) || 1000 / 60
      previous = now
      const sixtieths = elapsed / (1000 / 60)

      /* A machine that cannot keep up draws one pixel to the CSS pixel: a quarter of the work, and the
         lines are no wider for it. That means slower than about 25 a second, because a browser saving its
         battery holds frames at 30, however much the machine has to spare. */
      slowFrames = elapsed > 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
      if (slowFrames > 40 && finest > 1) {
        finest = 1
        size()
      }
      /* a window dragged to a sharper screen keeps its size, so no observer will mention it */
      if (Math.min(window.devicePixelRatio || 1, finest) !== pixels) {
        size()
      }

      /* the pointer eases to where it is, and what it pulled springs back */
      const follow = 1 - 0.82 ** sixtieths
      const movedX = pointer.tx - pointer.lastX
      const movedY = pointer.ty - pointer.lastY
      pointer.lastX = pointer.tx
      pointer.lastY = pointer.ty
      pointer.x += (pointer.tx - pointer.x) * follow
      pointer.y += (pointer.ty - pointer.y) * follow
      part += ((pointer.inside ? 1 : 0) - part) * (1 - 0.9 ** sixtieths)
      drag.vx =
        (drag.vx + movedX * LOOK.dragGain - drag.x * LOOK.dragStiffness * sixtieths) * LOOK.dragDamping ** sixtieths
      drag.vy =
        (drag.vy + movedY * LOOK.dragGain - drag.y * LOOK.dragStiffness * sixtieths) * LOOK.dragDamping ** sixtieths
      drag.x += drag.vx * sixtieths
      drag.y += drag.vy * sixtieths

      /* holding it down opens the throttle, and the wheel gives it a shove */
      throttle += ((held ? 1 : 0) - throttle) * (1 - (held ? 0.93 : 0.96) ** sixtieths)
      wheel *= 0.92 ** sixtieths
      clockAt += elapsed * (1 + throttle * 2)
      flowed += elapsed * LOOK.flow * (1 + throttle * LOOK.throttle + wheel)
      if (ring > 0) {
        ring += elapsed * LOOK.ringSpeed
        if (ring > 2600) {
          ring = 0
        }
      }
      draw()
      frame = requestAnimationFrame(step)
    }
    const sync = () => {
      const wanted = inView && !document.hidden && !reduced
      if (wanted !== running) {
        running = wanted
        if (running && !frame) {
          previous = performance.now()
          frame = requestAnimationFrame(step)
        }
      }
    }

    const toCanvas = (event) => {
      const box = flow.getBoundingClientRect()
      return { x: event.clientX - box.left, y: event.clientY - box.top }
    }
    const onPointerMove = (event) => {
      /* a release this never saw: it went to a context menu, or to another tab */
      if (held && !event.buttons) {
        onPointerUp()
      }
      const at = toCanvas(event)
      if (!pointer.inside) {
        /* no jump on the way in: it starts from where it arrived */
        pointer.x = at.x
        pointer.y = at.y
        pointer.lastX = at.x
        pointer.lastY = at.y
      }
      pointer.inside = true
      pointer.tx = at.x
      pointer.ty = at.y
      /* with no frames running nothing keeps up with it, and the first frame back would read all of this as one move */
      if (!running) {
        pointer.x = at.x
        pointer.y = at.y
        pointer.lastX = at.x
        pointer.lastY = at.y
      }
    }
    const onPointerLeave = (event) => {
      pointer.inside = false
      /* A release it never saw, again. A real hold has captured the pointer and hears no leave at all. */
      if (held && !event.buttons) {
        onPointerUp()
      }
    }
    const onPointerDown = (event) => {
      /* a control-click is a right click on a Mac, and the menu it opens keeps the mouse-up */
      if (reduced || (event.pointerType === 'mouse' && (event.button !== 0 || event.ctrlKey))) {
        return
      }
      onPointerMove(event)
      held = true
      ring = 1
      ringX = pointer.tx
      ringY = pointer.ty
      flow.classList.add('is-held')
      try {
        flow.setPointerCapture(event.pointerId)
      } catch {
        /* a pointer that has already gone */
      }
    }
    const onPointerUp = () => {
      held = false
      flow.classList.remove('is-held')
    }
    /* The wheel alone: the page scrolls as it always did, and nothing is taken from it. */
    const onWheel = (event) => {
      if (running) {
        wheel = Math.min(6, wheel + Math.abs(event.deltaY + event.deltaX) * 0.012)
      }
    }
    flow.addEventListener('pointermove', onPointerMove)
    flow.addEventListener('pointerleave', onPointerLeave)
    flow.addEventListener('pointerdown', onPointerDown)
    flow.addEventListener('pointerup', onPointerUp)
    flow.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('wheel', onWheel, { passive: true })

    /* Drawn in the observer's callback: resizing a canvas clears it, and observers run after frames. */
    const watcher = new ResizeObserver(() => {
      if (size()) {
        draw()
      }
    })
    watcher.observe(flow)
    /* the theme is a class on the body */
    const themeWatcher = new MutationObserver(() => {
      const next = document.body.classList.contains('dark-mode')
      if (next !== dark) {
        dark = next
        draw()
      }
    })
    themeWatcher.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting
        })
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(flow)
    const onVisibility = () => {
      if (document.hidden) {
        onPointerUp()
      }
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const onMotion = () => {
      reduced = motion.matches
      /* the still picture keeps no trace of the pointer */
      if (reduced) {
        onPointerUp()
        part = 0
        throttle = 0
        ring = 0
        wheel = 0
        drag.x = 0
        drag.y = 0
        drag.vx = 0
        drag.vy = 0
      }
      sync()
      draw()
    }
    motion.addEventListener('change', onMotion)
    /* Standing still there are no frames to notice a window dragged to a sharper screen in. Each of
       these queries only says when this one density stops being true, so it is asked again each time. */
    let density = null
    const onDensity = () => {
      /* Printing sets this off as well, and resetting the canvas then would print an empty room. Only a
         real change of pixels is worth a redraw. */
      if (Math.min(window.devicePixelRatio || 1, finest) !== pixels && size()) {
        draw()
      }
      watchDensity()
    }
    const watchDensity = () => {
      density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      density.addEventListener('change', onDensity, { once: true })
    }
    watchDensity()
    if (size()) {
      draw()
    }
    grainImage.src = GRAIN

    /* The site is one page, so all of this is thrown away on the way to another, and everything hung
       on the document has to go with it. */
    release = () => {
      carried = { began, flowed, clockAt, lofts, painted }
      running = false
      release = () => {}
      holding = []
      observer.disconnect()
      watcher.disconnect()
      opened.disconnect()
      footWatcher.disconnect()
      themeWatcher.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
      density.removeEventListener('change', onDensity)
      window.removeEventListener('wheel', onWheel)
      flow.removeEventListener('pointermove', onPointerMove)
      flow.removeEventListener('pointerleave', onPointerLeave)
      flow.removeEventListener('pointerdown', onPointerDown)
      flow.removeEventListener('pointerup', onPointerUp)
      flow.removeEventListener('pointercancel', onPointerUp)
      flow.classList.remove('is-held')
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
      delete flow.dataset.shBound
    }
  }

  const check = () => {
    if (holding.some((held) => !held.isConnected)) {
      release()
    }
    bind()
    carried = null
  }
  check()
  new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length || record.removedNodes.length)) {
      check()
    }
  }).observe(document.documentElement, { childList: true, subtree: true })
})()
