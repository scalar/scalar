/**
 * The hero on /products/agent: agent marks drifting down both sides of the page, seen through a
 * lens that bends the top and the bottom of the picture. The field is Vitra's chair finder, the
 * lens is after n233.com.
 *
 * Vitra's chairs sit on two very large circles round the middle of the window, turning slowly
 * clockwise. The circles are taller than the window, so their tops and bottoms are off screen
 * and all that shows is their left and right arcs: two loose columns down each side and an
 * empty middle. The same geometry here, sized by width as theirs is, with every mark upright.
 *
 * It is drawn in two passes:
 *
 * 1. The marks, crisp, into a texture.
 * 2. That texture to the screen through one lens. Towards the top and bottom edges the lens
 *    magnifies more and more, and it bends red, green and blue by slightly different amounts.
 *    A dark mark on a light page drawn out like that comes apart into black, red, yellow and
 *    white on one side and blue and cyan on the other: the chromatic aberration of real glass.
 *    So where an arc leaves the window, its marks stretch into comets on their way out. Nothing
 *    is tinted — the colour is all optics, which is why it has to be one lens over the whole
 *    picture rather than an effect drawn on each mark.
 *
 * The marks live in agent-marks.js, which sets window.__scalarAgentMarks. Pages on scalar.com
 * render on the client, so binding goes through a MutationObserver with a dataset flag on the
 * element, after landing.js: a node replaced by hydration comes back unbound and heals itself.
 */
;(() => {
  // The docs run a route's scripts again on every visit. The first run watches the page for
  // good, so a later one has nothing to add.
  if (window.__scalarAgentHero) {
    return
  }
  window.__scalarAgentHero = true

  const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)')

  /** The camera distance, in stage heights. The marks all sit at it, so nothing is skewed. */
  const FOCAL = 1.43

  /**
   * The two circles, measured from Vitra's page at 1440 by 814: radii of 515 and 748 px, which
   * is 0.358 and 0.52 of the width, and 1.27 and 1.84 times the half-height. Across, the radius
   * is kept as a share of the width, so the columns stand where Vitra's do; down, as a share of
   * the half-height, so the arcs leave the top and bottom of any stage at Vitra's angle. Count
   * is how many marks share a circle, speed is degrees a second (both clockwise, as theirs), and
   * size is a mark's radius as a share of the width.
   */
  const RINGS = [
    { across: 0.358, down: 1.27, count: 15, speed: 3, size: 0.04 },
    { across: 0.52, down: 1.84, count: 30, speed: 4.5, size: 0.04 },
  ]

  /**
   * How far apart neighbouring marks are at least, centre to centre, in marks' widths, where a
   * ring runs down a side of the stage. The marks grow with the stage's width and the rings with
   * its height, and the stage stops growing taller at 560px, so on a wide screen the outer ring's
   * marks ran into each other down the sides (1.09 widths apart at 1512 by 820, overlapping from
   * 1920 across). A ring is made at least tall enough to keep this, which is the inner ring's own
   * spacing at 1512 by 820, and turns more slowly by as much, so its marks move as fast as before.
   */
  const SPACING = 1.5

  /**
   * On a phone the copy fills the width and there is no room beside it for the arcs. Vitra's
   * page, measured at 390 by 844 and 430 by 932, then turns its circles into true circles of
   * 0.636 and 0.886 of the width, a little wider than the screen, so their tops and bottoms
   * frame the copy and their sides run off the edges. Its chairs grow to about twice their
   * desktop share of the width, and the marks here grow with them.
   */
  const NARROW = { radii: [0.636, 0.886], size: 0.075 }

  /**
   * The lens, as a fraction of the half-height measured from the middle of the stage. Below
   * LENS_IN nothing moves. Above it, a point at height v shows the picture from height
   *   vs = in + (1 - in) * (1 - exp(-b * t)) / b,   t = (v - in) / (1 - in)
   * which joins the untouched middle smoothly and magnifies by e^b at the edge.
   */
  const LENS_IN = 0.72
  const BEND = 3.2
  /**
   * How far apart the lens pulls the colours at the edge, as a share of the radius. It has to
   * be about the size of a pebble there, or a comet stays a dark ribbon with a thin rim; in the
   * reference the whole length of a comet is coloured.
   */
  const SPLIT = 0.05
  /** How far the softening reaches along a comet at the edge, in stage heights of picture. */
  const ALONG = 0.05
  /** How soft the lens makes the picture at the edge, as a mip level at 1x density. */
  const SOFTEN = 3

  /** The opening: each pebble fades in on its own, sweeping round its ring, inner ring first. */
  const INTRO = { inner: 0.0, outer: 0.55, step: 0.045, fade: 0.34 }

  /**
   * The pebbles' own colours, after the reference's photographs: mostly deep, earthy tones,
   * a few light ones and one vivid blue. Each is lit from the upper left.
   */
  const LOOKS = {
    ink: { light: '#3a3a3a', base: '#141414', deep: '#050505', mark: '#ece6dc' },
    coffee: { light: '#8c5434', base: '#4a2a19', deep: '#1a0d07', mark: '#efd9c4' },
    clay: { light: '#e0825f', base: '#a3482a', deep: '#41160a', mark: '#fbe6da' },
    fern: { light: '#6b7f3c', base: '#232d18', deep: '#0b1007', mark: '#e3ead2' },
    oxblood: { light: '#a8432c', base: '#5c1811', deep: '#22070a', mark: '#f6ddd4' },
    cobalt: { light: '#5a8cff', base: '#1236a8', deep: '#050d36', mark: '#ffffff' },
    navy: { light: '#3d5482', base: '#141f38', deep: '#060a14', mark: '#e4e9f4' },
    pine: { light: '#4c7d6c', base: '#183530', deep: '#06120f', mark: '#dcebe4' },
    aubergine: { light: '#6e5470', base: '#2c1f2e', deep: '#100a11', mark: '#eadfe9' },
    graphite: { light: '#8a929c', base: '#363b42', deep: '#121417', mark: '#eef0f3' },
    cream: { light: '#fdf8ec', base: '#e3d7bb', deep: '#a99872', mark: '#3a2c1a' },
    stone: { light: '#e9e2d4', base: '#a69c8a', deep: '#57503f', mark: '#2d271d', speckle: true },
    metal: { light: '#f4f6f9', base: '#8d949e', deep: '#252a31', mark: '#15181c', sheen: true },
  }

  /**
   * The agents that have a globe of their own colour (as the old home page's planets did), painted
   * here the same in either theme. A globe is its tint, a little lighter towards the middle, unless `body` gives the
   * brand's own two colours; `glow` is a second colour along the bottom, `light` how strong the
   * white sheen along the bottom is, and `ink` the colour its mark takes.
   */
  const GLASS = {
    body: [
      [0.72, '#f8f8f8'],
      [1, '#f4f4f4'],
    ],
    light: 0.9,
    shade: 'glass',
    ink: '#0d0d0d',
  }
  const CORAL = {
    body: [
      [0.36, '#f36a40'],
      [0.76, '#f0582a'],
    ],
    glow: '#ffb27a',
  }
  const GLOBES = {
    chatgpt: GLASS,
    codex: GLASS,
    claude: CORAL,
    claudecode: CORAL,
    gemini: { tint: '#2d6bff' },
    geminicli: { tint: '#9168c0' },
    copilot: { tint: '#7a5cf0' },
    cursor: { tint: '#94a3b8' },
    windsurf: { tint: '#1fb28a' },
    cline: { tint: '#5b8def' },
    opencode: {
      body: [
        [0.36, '#ffc43a'],
        [0.76, '#ffb000'],
      ],
      glow: '#ffe56b',
      ink: '#0d0d0d',
    },
    devin: { tint: '#21c19a' },
    kiro: { tint: '#9046ff' },
    replit: { tint: '#fd5402' },
    amp: { tint: '#f34e3f' },
    t3: {
      body: [
        [0.36, '#f052ae'],
        [0.76, '#e5399b'],
      ],
      glow: '#ff8ad0',
    },
    grok: {
      body: [
        [0.55, '#4a4a50'],
        [1, '#3a3a40'],
      ],
      light: 0.22,
      shade: 'dark',
    },
  }

  /**
   * The globes' inset shadows, as [x, y, blur, spread, colour] in the introduction's pixels on a
   * globe 100px across: a faint crescent along the top and a darker edge at the bottom. The dark
   * globe's rim catches the light instead, and the dark and the glass globes keep a hairline edge.
   */
  const SHADE = {
    ball: [
      [4, 16, 18, -12, 'rgba(0, 0, 0, 0.14)'],
      [0, -5, 8, -5, 'rgba(0, 0, 0, 0.1)'],
    ],
    dark: [
      [4, 16, 18, -12, 'rgba(255, 255, 255, 0.1)'],
      [0, -5, 8, -5, 'rgba(0, 0, 0, 0.15)'],
      [0, 0, 0, 1, 'rgba(255, 255, 255, 0.12)'],
    ],
    glass: [
      [4, 16, 18, -12, 'rgba(28, 32, 36, 0.18)'],
      [0, -5, 8, -5, 'rgba(0, 0, 0, 0.04)'],
      [0, 0, 0, 1, 'rgba(0, 0, 0, 0.035)'],
    ],
  }

  /**
   * Marks whose one-colour form needs holes, by the fills to cut away so the globe or pebble shows
   * through, as in the brands' one-colour marks. Inked whole, each was a blank shape.
   */
  const CUT = {
    // The white tile under the cloud.
    codex: ['#fff'],
    // The purple tile, and the ghost's eyes.
    kiro: ['#9046FF', '#000'],
    // The terminal's face, inside its frame.
    geminicli: ['#1E1E2E'],
    // The cat's face, out of its tile.
    codebuddy: ['#fff'],
    // The white stroke inside the C.
    crewai: ['#fff'],
    // The face's darker greys: the eyes, the mouth and the line across it.
    lobehub: ['#4F4F4F', '#1A1A1A', '#838383'],
  }

  /**
   * Every other agent's pebble: a brand's own colour where it has one, and otherwise a look that
   * keeps neighbours apart. A mark added later without a look here is graphite.
   */
  const PEBBLE = {
    antigravity: 'coffee',
    roocode: 'coffee',
    kilocode: 'fern',
    goose: 'stone',
    openhands: 'oxblood',
    junie: 'fern',
    trae: 'ink',
    zencoder: 'cream',
    codebuddy: 'graphite',
    codegeex: 'metal',
    qoder: 'coffee',
    manus: 'pine',
    vscode: 'cobalt',
    zed: 'graphite',
    jetbrains: 'ink',
    warp: 'graphite',
    raycast: 'oxblood',
    v0: 'metal',
    lovable: 'ink',
    perplexity: 'pine',
    poe: 'aubergine',
    monica: 'coffee',
    cherrystudio: 'stone',
    lobehub: 'fern',
    openwebui: 'ink',
    ollama: 'cream',
    lmstudio: 'oxblood',
    obsidian: 'aubergine',
    notion: 'cream',
    linear: 'navy',
    slack: 'aubergine',
    n8n: 'oxblood',
    make: 'cream',
    dify: 'graphite',
    langchain: 'metal',
    langgraph: 'coffee',
    llamaindex: 'metal',
    crewai: 'pine',
    mastra: 'ink',
    pydanticai: 'aubergine',
    openai: 'graphite',
    anthropic: 'clay',
    vercel: 'ink',
    deepseek: 'navy',
    qwen: 'coffee',
    mistral: 'ink',
    kimi: 'stone',
    metaai: 'navy',
    openrouter: 'fern',
  }

  /**
   * Pebbles whose marks' colours are the brand: drawn as they are. Every other pebble's mark is a
   * silhouette in its own ink, which is what makes the set read as one family.
   */
  const IN_COLOUR = new Set(['slack', 'lovable', 'metaai', 'mistral', 'llamaindex', 'trae', 'qoder', 'monica'])

  /** Agents dealt first, to the marks in view when the hero opens: the ones people know first. */
  const FIRST = [
    'claude',
    'chatgpt',
    'cursor',
    'copilot',
    'gemini',
    'claudecode',
    'codex',
    'windsurf',
    'vscode',
    'zed',
    'perplexity',
    'grok',
  ]

  // ---------------------------------------------------------------------------------- shaders

  const SCENE_VERT = `#version 300 es
  precision highp float;
  in vec2 a_corner;        // -1..1 across the disc
  in vec3 a_pos;           // centre, in px from the stage centre; z is depth from the camera
  in vec3 a_right;         // the mark's own axes: upright and square to the screen
  in vec3 a_up;
  in float a_size;         // disc radius, in px
  in vec2 a_cell;          // the pebble's image in the atlas
  in float a_alpha;
  uniform vec2 u_res;
  uniform vec2 u_centre;
  uniform float u_focal;
  out vec2 v_local;
  out vec2 v_cell;
  out float v_alpha;
  void main() {
    vec3 p = a_pos + a_right * (a_corner.x * a_size) + a_up * (a_corner.y * a_size);
    // Written in homogeneous form so the GPU interpolates the image with perspective.
    float x = (u_centre.x * p.z + p.x * u_focal) / u_res.x * 2.0 - p.z;
    float y = p.z - (u_centre.y * p.z + p.y * u_focal) / u_res.y * 2.0;
    gl_Position = vec4(x, y, 0.0, p.z);
    v_local = a_corner;
    v_cell = a_cell;
    v_alpha = a_alpha;
  }`

  const SCENE_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_local;
  in vec2 v_cell;
  in float v_alpha;
  uniform sampler2D u_atlas;
  uniform float u_cellSize;
  out vec4 o;
  void main() {
    // Sampled before anything is discarded, so the mip level the GPU picks from neighbouring
    // pixels is defined right up to the rim.
    vec2 uv = v_cell + vec2(v_local.x * 0.5 + 0.5, 0.5 - v_local.y * 0.5) * u_cellSize;
    vec3 image = texture(u_atlas, uv).rgb;
    float d = length(v_local);
    float cover = clamp((1.0 - d) / max(fwidth(d), 1e-4) + 0.5, 0.0, 1.0) * v_alpha;
    if (cover <= 0.0) discard;
    o = vec4(image, 1.0) * cover;
  }`

  const LENS_VERT = `#version 300 es
  void main() {
    // One triangle that covers the screen.
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
    gl_Position = vec4(p, 0.0, 1.0);
  }`

  const LENS_FRAG = `#version 300 es
  precision highp float;
  uniform sampler2D u_scene;
  uniform vec2 u_res;
  uniform vec2 u_centre;
  uniform float u_half;
  uniform float u_in;
  uniform float u_bend;
  uniform float u_split;
  uniform float u_along;
  uniform float u_soften;
  out vec4 o;

  const int TAPS = 7;

  vec2 uvOf(vec2 px) {
    return vec2(px.x / u_res.x, 1.0 - px.y / u_res.y);
  }

  void main() {
    vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
    vec2 d = px - u_centre;
    float v = max(abs(d.y) / u_half, 1e-4);
    // How far into the lens this pixel is: 0 anywhere in the untouched middle.
    float t = clamp((v - u_in) / (1.0 - u_in), 0.0, 1.0);
    // The level is always explicit: a derivative-chosen one breaks down where neighbouring
    // pixels sit either side of the lens edge, and drew a line across the picture there.
    if (t <= 0.0) {
      o = vec4(textureLod(u_scene, uvOf(px), 0.0).rgb, 1.0);
      return;
    }

    // Where the lens takes its picture from: magnified more and more towards the edge, and
    // joined to the untouched middle without a seam.
    float vs = u_in + (1.0 - u_in) * (1.0 - exp(-u_bend * t)) / u_bend;
    vec2 src = d * (vs / v);
    vec2 dir = normalize(d);

    // Lateral chromatic aberration: the channels are magnified by slightly different amounts,
    // so a dark pebble on a light page comes apart into red and yellow on its outer side and
    // blue and cyan on its inner one. Kept under a pebble's width, or the middle channel is
    // left on its own and the comet turns magenta.
    float split = u_split * sqrt(t);
    // The softening runs along the comet, not across it: taps spread down the radius, and
    // only a light blur sideways, so a comet stays a long flame instead of a cloud.
    float along = u_along * t;
    float lod = u_soften * t * t;

    vec3 acc = vec3(0.0);
    for (int i = 0; i < TAPS; i++) {
      float f = (float(i) + 0.5) / float(TAPS) - 0.5;
      vec2 off = dir * (f * along);
      acc.r += textureLod(u_scene, uvOf(u_centre + src * (1.0 + split) + off), lod).r;
      acc.g += textureLod(u_scene, uvOf(u_centre + src + off), lod).g;
      acc.b += textureLod(u_scene, uvOf(u_centre + src * (1.0 - split) + off), lod).b;
    }
    o = vec4(acc / float(TAPS), 1.0);
  }`

  const compile = (gl, type, src) => {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }

  const link = (gl, vert, frag, attributes = []) => {
    const p = gl.createProgram()
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert))
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
    attributes.forEach((name, i) => gl.bindAttribLocation(p, i, name))
    gl.linkProgram(p)
    return p
  }

  /**
   * Shaders compile on other threads, and it is asking how it went that makes the page wait for them: a good part of a
   * second on a first visit. So nothing is asked until the browser says there is an answer, which it also says of a
   * context it has lost. A browser without the extension says nothing, and the page waits at the first question, as it
   * always has.
   */
  const whenCompiled = async (gl, parallel, programs, wanted) => {
    while (parallel && wanted() && !programs.every((p) => gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))) {
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
  }

  // ------------------------------------------------------------------------------- the pebbles

  /** A small deterministic random, so every visit paints the same pebbles. */
  const seeded = (seed) => {
    let state = seed >>> 0
    return () => {
      // (state * 1664525 + 1013904223) mod 2^32, in 32-bit integer maths: the same sequence,
      // four times faster over the 65,536 grain draws of a pebble.
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 4294967296
    }
  }

  /**
   * Hands the main thread back between pieces of a long job, as an ordinary task, so frames go
   * first. A scheduler.yield() continuation is served ahead of rendering: with it, frames waited
   * up to a tenth of a second at a time while the pebbles were painted.
   */
  const yieldToPage = () =>
    globalThis.scheduler?.postTask
      ? globalThis.scheduler.postTask(() => {
          // Nothing to do: the turn in the queue is the point.
        })
      : new Promise((resolve) => {
          const { port1, port2 } = new MessageChannel()
          port1.onmessage = () => {
            port1.close()
            resolve()
          }
          port2.postMessage(null)
        })

  const loadMark = (svg, fill) =>
    new Promise((resolve) => {
      let doc = svg.replace(/currentColor/g, fill)
      if (!/xmlns=/.test(doc)) {
        doc = doc.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      doc = doc.replace('<svg', '<svg width="256" height="256"')
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`
    })

  /** How a pebble's mark is drawn: see paintPebble. */
  const inkFor = (slug) => {
    if (IN_COLOUR.has(slug)) {
      return 'colour'
    }
    return CUT[slug] ? 'cut' : 'silhouette'
  }

  /**
   * Paints one pebble's image into its atlas cell: a deep colour lit from the upper left, a
   * couple of soft blooms and a little grain so the lens has texture to draw out, and the mark,
   * drawn as `how` says: in its own colours, in the pebble's ink with CUT's fills cut away, or
   * as a silhouette in that ink.
   */
  const paintPebble = (ctx, scratch, x0, y0, size, look, mark, how, random) => {
    const glow = ctx.createRadialGradient(
      x0 + size * 0.34,
      y0 + size * 0.28,
      size * 0.02,
      x0 + size * 0.5,
      y0 + size * 0.56,
      size * 0.74,
    )
    glow.addColorStop(0, look.light)
    glow.addColorStop(0.46, look.base)
    glow.addColorStop(1, look.deep)
    ctx.fillStyle = glow
    ctx.fillRect(x0, y0, size, size)

    if (look.sheen) {
      // Brushed metal: a bright band across the upper half, like the reference's chrome.
      const band = ctx.createLinearGradient(x0, y0 + size * 0.15, x0 + size * 0.3, y0 + size * 0.85)
      band.addColorStop(0, `${look.deep}00`)
      band.addColorStop(0.38, `${look.light}cc`)
      band.addColorStop(0.5, `${look.light}ff`)
      band.addColorStop(0.62, `${look.base}66`)
      band.addColorStop(1, `${look.deep}aa`)
      ctx.fillStyle = band
      ctx.fillRect(x0, y0, size, size)
    }
    if (look.speckle) {
      // Stone: soft darker flecks, like the reference's leopard print and grit.
      for (let i = 0; i < 70; i++) {
        const fx = x0 + random() * size
        const fy = y0 + random() * size
        const fr = size * (0.012 + random() * 0.03)
        ctx.fillStyle = `${look.deep}${random() > 0.5 ? '88' : '44'}`
        ctx.beginPath()
        ctx.ellipse(fx, fy, fr * 1.4, fr, random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < 3; i++) {
      const bx = x0 + size * (0.2 + random() * 0.6)
      const by = y0 + size * (0.2 + random() * 0.6)
      const br = size * (0.16 + random() * 0.22)
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, br)
      bloom.addColorStop(0, i === 0 ? `${look.light}55` : `${look.deep}66`)
      bloom.addColorStop(1, `${look.base}00`)
      ctx.fillStyle = bloom
      ctx.fillRect(x0, y0, size, size)
    }

    if (mark) {
      const m = size * 0.4
      const mx = x0 + (size - m) / 2
      const my = y0 + (size - m) / 2
      if (how === 'colour') {
        ctx.drawImage(mark, mx, my, m, m)
      } else if (how === 'cut') {
        ctx.drawImage(inked(scratch, mark, look.mark), mx, my, m, m)
      } else {
        // A silhouette in the pebble's own ink, cut out on the build's scratch canvas.
        scratch.globalCompositeOperation = 'source-over'
        scratch.clearRect(0, 0, 256, 256)
        scratch.drawImage(mark, 0, 0, 256, 256)
        scratch.globalCompositeOperation = 'source-in'
        scratch.fillStyle = look.mark
        scratch.fillRect(0, 0, 256, 256)
        ctx.drawImage(scratch.canvas, mx, my, m, m)
      }
    }

    const grain = ctx.getImageData(x0, y0, size, size)
    for (let i = 0; i < grain.data.length; i += 4) {
      const n = (random() - 0.5) * 14
      grain.data[i] += n
      grain.data[i + 1] += n
      grain.data[i + 2] += n
    }
    ctx.putImageData(grain, x0, y0)
  }

  /** Mixes a hex colour towards another, for the lighter pebbles a dark page needs. */
  const mix = (hex, to, amount) => {
    const a = Number.parseInt(hex.slice(1), 16)
    const b = Number.parseInt(to.slice(1), 16)
    const ch = (v, shift) => (v >> shift) & 255
    const c = (shift) => Math.round(ch(a, shift) + (ch(b, shift) - ch(a, shift)) * amount)
    return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`
  }

  /**
   * On a dark page the deep pebbles sink into the page. Each coloured look is lifted within its
   * own hue there, so the brand colours stay true; ink gets a charcoal of its own, still the
   * darkest stone in the set but with an edge that reads; the light looks stay as they are.
   */
  const INK_ON_DARK = { light: '#666666', base: '#383838', deep: '#242424' }
  const LIGHT_LOOKS = new Set(['cream', 'stone', 'metal'])
  const forDark = (name) => {
    const look = LOOKS[name]
    if (name === 'ink') {
      return { ...look, ...INK_ON_DARK }
    }
    if (LIGHT_LOOKS.has(name)) {
      return look
    }
    return {
      ...look,
      light: mix(look.light, '#ffffff', 0.15),
      base: mix(look.base, look.light, 0.4),
      deep: mix(look.deep, look.base, 0.6),
    }
  }

  /**
   * A colour mixed with white in oklab, as CSS color-mix() mixes it: the introduction lightens the
   * middle of a globe so.
   */
  const towardsWhite = (hex, amount) => {
    const n = Number.parseInt(hex.slice(1), 16)
    const [r, g, b] = [16, 8, 0].map((shift) => {
      const c = ((n >> shift) & 255) / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    // Oklab is linear in the cube roots of LMS, where white is 1, 1, 1, so the mix is made there.
    const [l, m, s] = [
      0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
      0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
      0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
    ].map((v) => (Math.cbrt(v) * (1 - amount) + amount) ** 3)
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((v) => {
      const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
      return Math.round(Math.min(1, Math.max(0, c)) * 255)
    })
    return `rgb(${rgb.join(', ')})`
  }

  /**
   * The introduction's grain: a tile of grey noise round mid-grey, laid over a globe with overlay,
   * so white stays white and the colours take the grain. It is worked out once, as grey levels, at
   * the scale that puts as many grains across a globe here as across one of the introduction's
   * 100px globes.
   */
  let grained = null
  const grainFor = (cell) => {
    if (!grained) {
      const side = Math.round((160 * cell) / 100)
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 160 160"><filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0.805 0.0975 0 0 0 0.805 0.0975 0 0 0 0.805 0.0975 0 0 0 0 1"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
      grained = new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const tile = document.createElement('canvas')
          tile.width = side
          tile.height = side
          const pen = tile.getContext('2d', { willReadFrequently: true })
          pen.drawImage(img, 0, 0)
          const rgba = pen.getImageData(0, 0, side, side).data
          const grey = new Uint8Array(side * side)
          let sum = 0
          for (let i = 0; i < grey.length; i++) {
            grey[i] = rgba[i * 4]
            sum += grey[i]
          }
          tile.width = 0
          tile.height = 0
          // Noise round mid-grey averages near 128. A browser that cannot draw the filter draws
          // the square black instead, which would darken every globe: those get no grain.
          const mean = sum / grey.length
          resolve(mean > 96 && mean < 160 ? { side, grey } : null)
        }
        img.onerror = () => resolve(null)
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      })
    }
    return grained
  }

  /** A mark for inking: every fill in white, and in black where CUT cuts it away. */
  const inkable = (slug, svg) => {
    const cut = CUT[slug] || []
    return svg.replace(/fill="([^"]*)"/g, (fill, value) =>
      value === 'none' ? fill : `fill="${cut.includes(value) ? '#000' : '#fff'}"`,
    )
  }

  /** A mark from inkable() in its ink: how bright it is, is how much ink a pixel takes. */
  const inked = (scratch, mark, ink) => {
    scratch.globalCompositeOperation = 'source-over'
    scratch.clearRect(0, 0, 256, 256)
    scratch.drawImage(mark, 0, 0, 256, 256)
    const image = scratch.getImageData(0, 0, 256, 256)
    const n = Number.parseInt(ink.slice(1), 16)
    const px = image.data
    for (let i = 0; i < px.length; i += 4) {
      px[i + 3] = (px[i + 3] * px[i]) / 255
      px[i] = n >> 16
      px[i + 1] = (n >> 8) & 255
      px[i + 2] = n & 255
    }
    scratch.putImageData(image, 0, 0)
    return scratch.canvas
  }

  /**
   * Paints one globe into its atlas cell, in the introduction's layers: the body and its glow, the
   * white sheen along the bottom, the inset shadows, the grain over all of them, and the mark in
   * the globe's ink on top.
   */
  const paintGlobe = (ctx, scratch, x0, y0, size, globe, mark, grain, random) => {
    const r = size / 2
    const cx = x0 + r
    const cy = y0 + r
    // The introduction's pixels, on a globe 100px across.
    const k = size / 100
    // A radial gradient with radii rx and ry: a circular one, drawn squashed.
    const ellipse = (ex, ey, rx, ry, stops) => {
      ctx.save()
      ctx.translate(ex, ey)
      ctx.scale(1, ry / rx)
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
      for (const [at, colour] of stops) {
        gradient.addColorStop(at, colour)
      }
      ctx.fillStyle = gradient
      ctx.fillRect(-2 * size, -4 * size, 4 * size, 8 * size)
      ctx.restore()
    }

    ctx.save()
    // The paint fills the whole cell, so the texture's smaller mip levels have no dark corners
    // to blend into the rim.
    ctx.beginPath()
    ctx.rect(x0, y0, size, size)
    ctx.clip()
    ellipse(
      cx,
      cy,
      r,
      r,
      globe.body || [
        [0.4, towardsWhite(globe.tint, 0.1)],
        [0.8, globe.tint],
      ],
    )
    if (globe.glow) {
      ellipse(cx, cy + 0.48 * size, 0.66 * size, 0.54 * size, [
        [0.16, globe.glow],
        [1, `${globe.glow}00`],
      ])
    }
    const light = globe.light ?? 0.45
    ellipse(cx, cy + 0.54 * size, 0.7 * size, 0.6 * size, [
      [0, `rgba(255, 255, 255, ${light})`],
      [0.7, 'rgba(255, 255, 255, 0)'],
    ])

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    // An inset shadow is everything outside the disc, grown by the spread, moved by the offset
    // and blurred. Its shape is drawn far off to the left, so only the shadow lands here.
    const away = size * 8
    for (const [x, y, blur, spread, colour] of SHADE[globe.shade || 'ball']) {
      const hole = r - spread * k
      ctx.shadowColor = colour
      ctx.shadowBlur = blur * k
      ctx.shadowOffsetX = away + x * k
      ctx.shadowOffsetY = y * k
      ctx.beginPath()
      ctx.rect(cx - away - 2 * size, cy - 2 * size, 4 * size, 4 * size)
      ctx.moveTo(cx - away + hole, cy)
      ctx.arc(cx - away, cy, hole, 0, Math.PI * 2)
      ctx.fill('evenodd')
    }
    ctx.restore()

    if (grain) {
      // Overlay, worked out here rather than by the canvas, whose first overlay in a build held up
      // a frame: a dark channel is multiplied by the grain and a light one screened. Each globe
      // starts from its own place in the tile, so neighbours do not share their grain.
      const { side, grey } = grain
      const over = (b, g) => (b <= 127.5 ? (2 * g * b) / 255 : 255 - (2 * (255 - g) * (255 - b)) / 255)
      const ox = Math.floor(random() * side)
      const oy = Math.floor(random() * side)
      const image = ctx.getImageData(x0, y0, size, size)
      const px = image.data
      for (let y = 0; y < size; y++) {
        const row = ((y + oy) % side) * side
        for (let x = 0; x < size; x++) {
          const g = grey[row + ((x + ox) % side)]
          const i = (y * size + x) * 4
          px[i] = over(px[i], g)
          px[i + 1] = over(px[i + 1], g)
          px[i + 2] = over(px[i + 2], g)
        }
      }
      ctx.putImageData(image, x0, y0)
    }

    if (mark) {
      const m = size * 0.4
      ctx.drawImage(inked(scratch, mark, globe.ink || '#ffffff'), cx - m / 2, cy - m / 2, m, m)
    }
    // The browser keeps a canvas's drawing and does it at the next read. Reading a pixel does this
    // globe's now, inside its own turn, so the atlas still hands the page back between them.
    ctx.getImageData(x0, y0, 1, 1)
  }

  /** Each agent's mark, decoded once: both themes paint the same ones. */
  const decoded = new Map()
  const markFor = (slug, svg) => {
    if (!decoded.has(slug)) {
      decoded.set(
        slug,
        GLOBES[slug] || CUT[slug]
          ? loadMark(inkable(slug, svg), '#ffffff')
          : loadMark(svg, IN_COLOUR.has(slug) ? '#ffffff' : '#000000'),
      )
    }
    return decoded.get(slug)
  }

  /**
   * Paints every agent's pebble into one atlas, in the order given. It hands the page back every
   * few milliseconds, so a theme switch never holds up a frame, and gives up, returning null, as
   * soon as stale() says a newer paint has started.
   */
  const buildAtlas = async (agents, cell, dark, stale) => {
    const [marks, grain] = await Promise.all([
      Promise.all(agents.map(([slug, , , svg]) => markFor(slug, svg))),
      grainFor(cell),
    ])
    if (stale()) {
      return null
    }
    const cols = Math.ceil(Math.sqrt(agents.length))
    const canvas = document.createElement('canvas')
    canvas.width = cols * cell
    canvas.height = cols * cell
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const cut = document.createElement('canvas')
    cut.width = 256
    cut.height = 256
    const scratch = cut.getContext('2d', { willReadFrequently: true })
    // An abandoned build lets go of its canvases at once rather than at the next collection.
    const abandon = () => {
      for (const c of [canvas, cut]) {
        c.width = 0
        c.height = 0
      }
      return null
    }
    let since = performance.now()
    for (const [i, [slug]] of agents.entries()) {
      if (performance.now() - since > 8) {
        await yieldToPage()
        if (stale()) {
          return abandon()
        }
        since = performance.now()
      }
      const x = (i % cols) * cell
      const y = Math.floor(i / cols) * cell
      const random = seeded(i * 7919 + 17)
      if (GLOBES[slug]) {
        paintGlobe(ctx, scratch, x, y, cell, GLOBES[slug], marks[i], grain, random)
      } else {
        const look = PEBBLE[slug] || 'graphite'
        paintPebble(ctx, scratch, x, y, cell, dark ? forDark(look) : LOOKS[look], marks[i], inkFor(slug), random)
      }
    }
    cut.width = 0
    cut.height = 0
    // The upload that follows gets a task of its own.
    await yieldToPage()
    if (stale()) {
      return abandon()
    }
    return { canvas, cols, cell: 1 / cols }
  }

  // -------------------------------------------------------------------------------- geometry

  /**
   * Where on its ring each mark starts, the agents dealt to the marks (FIRST first, shared out
   * by the first picture) and the queue of the rest.
   */
  const layout = (agents) => {
    const order = [...FIRST.filter((slug) => agents.some((a) => a[0] === slug))]
    for (const a of agents) {
      if (!order.includes(a[0])) {
        order.push(a[0])
      }
    }
    const index = new Map(agents.map((a, i) => [a[0], i]))
    const pebbles = []
    let next = 0
    RINGS.forEach((ring, r) => {
      for (let j = 0; j < ring.count; j++) {
        pebbles.push({
          ring: r,
          slot: j,
          // Odd rings are set half a step round, so the two never line up into spokes.
          angle: ((j + (r % 2) * 0.5) / ring.count) * Math.PI * 2,
          agent: index.get(order[next++ % order.length]),
          hidden: false,
        })
      }
    })
    return { pebbles, queue: order.slice(next).map((slug) => index.get(slug)) }
  }

  // ------------------------------------------------------------------------------------ init

  const init = (root) => {
    if (root.dataset.agHeroBound === 'true') {
      return
    }
    const canvas = root.querySelector('[data-ag-canvas]')
    const agents = window.__scalarAgentMarks
    if (!canvas || !Array.isArray(agents) || agents.length === 0) {
      return
    }
    root.dataset.agHeroBound = 'true'

    // Transparent until the first frame is drawn: an opaque canvas shows black while the
    // pebbles are still being painted, which flashed a black box over the page on load.
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true })
    if (!gl) {
      root.dataset.agFallback = 'true'
      return
    }

    let scene
    let lens
    let parallel
    try {
      parallel = gl.getExtension('KHR_parallel_shader_compile')
      scene = link(gl, SCENE_VERT, SCENE_FRAG, ['a_corner'])
      lens = link(gl, LENS_VERT, LENS_FRAG)
    } catch (error) {
      root.dataset.agFallback = 'true'
      console.warn('[agent-hero]', error)
      return
    }

    // While they compile the hero holds nothing but the context. Hydration can replace it in that time, and the browser
    // can take the context back. Either way it lets go and leaves a fresh canvas, as teardown() does once it is running.
    let waiting = true
    const letGo = () => {
      waiting = false
      canvas.removeEventListener('webglcontextlost', lost)
      heroes.delete(release)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.replaceWith(canvas.cloneNode(false))
      delete root.dataset.agHeroBound
    }
    const release = () => {
      if (!canvas.isConnected) {
        letGo()
      }
    }
    const lost = (event) => {
      event.preventDefault()
      letGo()
      if (rebuilds < 2) {
        rebuilds += 1
        requestAnimationFrame(run)
      } else {
        root.dataset.agHeroBound = 'true'
        root.dataset.agFallback = 'true'
      }
    }
    canvas.addEventListener('webglcontextlost', lost)
    heroes.add(release)

    whenCompiled(gl, parallel, [scene, lens], () => waiting)
      .then(() => {
        // A lost context says it has finished too, and the event that says it was lost is on its way.
        if (!waiting || gl.isContextLost()) {
          return
        }
        waiting = false
        canvas.removeEventListener('webglcontextlost', lost)
        heroes.delete(release)
        for (const p of [scene, lens]) {
          if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            const logs = gl.getAttachedShaders(p).map((sh) => gl.getShaderInfoLog(sh))
            throw new Error([gl.getProgramInfoLog(p), ...logs].filter(Boolean).join('\n') || 'link failed')
          }
        }
        start(root, canvas, gl, agents, scene, lens)
      })
      .catch((error) => {
        root.dataset.agFallback = 'true'
        console.warn('[agent-hero]', error)
      })
  }

  /** Everything else about a hero, once its shaders have compiled. */
  const start = (root, canvas, gl, agents, scene, lens) => {
    const { pebbles, queue } = layout(agents)
    let cursor = 0
    let dealt = false
    const FLOATS = 16
    const data = new Float32Array(pebbles.length * FLOATS)

    // The pebble quads: one corner buffer, one instance buffer.
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const instances = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, instances)
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    for (const [name, size, offset] of [
      ['a_pos', 3, 0],
      ['a_right', 3, 12],
      ['a_up', 3, 24],
      ['a_size', 1, 36],
      ['a_cell', 2, 40],
      ['a_alpha', 1, 48],
    ]) {
      const loc = gl.getAttribLocation(scene, name)
      if (loc < 0) {
        continue
      }
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, FLOATS * 4, offset)
      gl.vertexAttribDivisor(loc, 1)
    }
    gl.bindVertexArray(null)
    const lensVao = gl.createVertexArray()

    const sceneU = {}
    for (const name of ['u_res', 'u_centre', 'u_focal', 'u_atlas', 'u_cellSize']) {
      sceneU[name] = gl.getUniformLocation(scene, name)
    }
    const lensU = {}
    for (const name of ['u_scene', 'u_res', 'u_centre', 'u_half', 'u_in', 'u_bend', 'u_split', 'u_along', 'u_soften']) {
      lensU[name] = gl.getUniformLocation(lens, name)
    }

    // The rings are drawn into this, and the lens reads it back with mipmaps for the blur.
    const sceneTex = gl.createTexture()
    const fbo = gl.createFramebuffer()
    let w = 0
    let h = 0
    let dpr = 1

    // The copy the rings keep clear of. Its box is its own text and buttons: the stage inside
    // it is positioned absolutely and takes no room.
    const copy = root.querySelector('.ag-copy')
    let holeW = 0
    let holeH = 0
    let holeY = 0

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const box = copy ? copy.getBoundingClientRect() : { width: 0, height: 0 }
      holeW = Math.round(box.width * dpr)
      holeH = Math.round(box.height * dpr)
      holeY = copy ? Math.round((box.top + box.height / 2 - rect.top) * dpr) : 0
      const nw = Math.max(2, Math.round(rect.width * dpr))
      const nh = Math.max(2, Math.round(rect.height * dpr))
      if (nw === w && nh === h) {
        return false
      }
      w = nw
      h = nh
      canvas.width = w
      canvas.height = h
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return true
    }

    let page = [1, 1, 1]
    const readPage = () => {
      const probe = document.createElement('canvas')
      probe.width = 1
      probe.height = 1
      const ctx = probe.getContext('2d', { willReadFrequently: true })
      // The theme's page colour. A value the canvas cannot parse, light-dark() for one, leaves
      // the sentinel in place, and the body's resolved background stands in. A hero drawn on a
      // surface of its own (data-ag-surface, the card on the home page) takes that surface's
      // colour instead, so the marks sit on the card and not on a page-coloured box inside it.
      const sentinel = '#010203'
      ctx.fillStyle = sentinel
      let surface = ''
      if (root.dataset.agSurface === 'true') {
        // A change of theme can start a transition on the surface's colour (the site gives everything a .01ms one
        // under reduced motion), and until it ends the surface still reports the old theme's colour. The canvas
        // covers the surface, so finishing it costs nothing, and the colour read is the new theme's.
        for (const animation of root.getAnimations()) {
          if (animation.transitionProperty === 'background-color') {
            animation.finish()
          }
        }
        surface = getComputedStyle(root).backgroundColor
      }
      ctx.fillStyle = surface || getComputedStyle(root).getPropertyValue('--scalar-background-1').trim() || sentinel
      if (ctx.fillStyle === sentinel) {
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor
      }
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      // A transparent colour says nothing about the page, and white is the safer guess.
      page = a === 0 ? [1, 1, 1] : [r / 255, g / 255, b / 255]
    }
    readPage()

    // Judged by the page's own colour rather than a class name, so it does not matter which
    // element carries the theme. The docs put theirs on the body.
    const isDark = () => 0.2126 * page[0] + 0.7152 * page[1] + 0.0722 * page[2] < 0.5

    /** The highest point of the picture the lens still shows, as a share of the half-height. */
    const reach = (LENS_IN + ((1 - LENS_IN) * (1 - Math.exp(-BEND))) / BEND) * (1 + SPLIT)

    let atlas = null
    // How far each ring has turned, in degrees. It is kept, and not worked out from a clock,
    // because a stretched ring turns more slowly: worked out from the time so far, a resize that
    // changed the pace would send every mark round to wherever the new pace would have had it.
    let turns = RINGS.map(() => 0)
    // How fast each ring turns, as a share of its speed: under 1 where SPACING stretches it.
    let pace = RINGS.map(() => 1)
    let intro = 0
    let last = null
    let raf = 0
    let inView = true
    let settled = false
    let alive = true
    // Something on screen has changed since the last picture was drawn.
    let dirty = true

    // One picture with the rings as they have turned. frame() below turns them and calls this; a
    // resize, or a change while the hero is away, calls it straight away.
    const draw = () => {
      if (!atlas) {
        return
      }
      dirty = false
      const still = PREFERS_REDUCED.matches

      const H = h
      const half = H / 2
      const cx = w / 2
      const cy = h / 2
      const focal = FOCAL * H

      // The circles never close in on the copy. On a wide stage they are well clear of it; when
      // the inner one cannot pass beside the copy on screen, the stage takes the phone layout.
      const clear = Math.hypot(holeW / 2, holeH / 2) + RINGS[0].size * w * 1.4
      const narrow = clear > w / 2
      const innerX = Math.max(RINGS[0].across * w, clear)
      // On a phone the circles are centred on the copy, as Vitra centres them on its title, so
      // the inner one frames it. The lens stays on the stage's own middle.
      const ringY = narrow && copy ? holeY : cy
      // Down, each ring is at least tall enough to keep its marks SPACING apart along its sides.
      const heights = [Math.max(RINGS[0].down * half, clear), RINGS[1].down * half]
      const spaced = heights.map((down, r) =>
        Math.max(down, (SPACING * 2 * RINGS[r].size * w * RINGS[r].count) / (Math.PI * 2)),
      )
      // A stretched ring runs straighter, so its marks would meet the glass further out, at the very
      // edge of the stage, where little of their comets shows. It is pulled in by as much, so that they
      // meet the glass, halfway into the lens, where they did before. The copy and the gap between the
      // two rings still hold it out, and a ring that was not stretched stays where it was.
      const glassY = ((LENS_IN + 1) / 2) * half
      const outAt = (down) => Math.sqrt(Math.max(0, 1 - (glassY / down) ** 2))
      const pulled = (rx, r) => (rx * outAt(heights[r])) / Math.max(outAt(spaced[r]), 1e-3)
      const innerRx = Math.max(pulled(innerX, 0), clear)
      const radii = narrow
        ? NARROW.radii.map((share) => [share * w, share * w])
        : [
            [innerRx, spaced[0]],
            [Math.max(pulled(RINGS[1].across * w, 1), innerRx + RINGS[1].size * w * 3.2), spaced[1]],
          ]
      pace = narrow ? RINGS.map(() => 1) : spaced.map((down, r) => heights[r] / down)

      // Where a mark is as its ring has turned, and whether it is out of sight: beyond the lens, or
      // past a side of a phone. Judged by the disc's near edge, so no part of it is still in view.
      const place = (p) => {
        const ring = RINGS[p.ring]
        const a = p.angle + turns[p.ring] * (Math.PI / 180)
        const [rx, ry] = radii[p.ring]
        const x = rx * Math.cos(a)
        const y = ry * Math.sin(a)
        const size = (narrow ? NARROW.size : ring.size) * w
        const v = Math.abs(y + ringY - cy) / half
        const gone = v - size / half > reach + 0.06 || Math.abs(x) > w / 2 + size * 1.1
        return { x, y, size, v, gone }
      }

      // The agents people know first go to the marks the reader sees first: those in view on the
      // first picture, the inner ring's before the outer's, the middle's before the edges'. Which
      // marks those are depends on the stage, so the deal waits for one with a size.
      if (!dealt && w > 2 && h > 2) {
        dealt = true
        const hands = pebbles.map((p) => p.agent)
        pebbles
          .map((p) => ({ p, at: place(p) }))
          .sort((s, t) => Number(s.at.gone) - Number(t.at.gone) || s.p.ring - t.p.ring || s.at.v - t.at.v)
          .forEach(({ p }, k) => {
            p.agent = hands[k]
          })
      }

      pebbles.forEach((p, i) => {
        const { x, y, size, v, gone } = place(p)

        // Out of sight, a mark takes the next agent in the queue, so every agent comes round in
        // time and none ever changes in view.
        if (queue.length) {
          if (gone && !p.hidden) {
            p.hidden = true
            const k = cursor % queue.length
            const swap = queue[k]
            queue[k] = p.agent
            p.agent = swap
            cursor += 1
          } else if (!gone && v < LENS_IN) {
            p.hidden = false
          }
        }

        const delay = (p.ring === 0 ? INTRO.inner : INTRO.outer) + p.slot * INTRO.step
        const rise = still ? 1 : Math.min(1, Math.max(0, (intro - delay) / INTRO.fade))
        const o = i * FLOATS
        data[o] = x
        data[o + 1] = y
        data[o + 2] = focal
        // Upright and square to the screen: no tilt, no skew.
        data[o + 3] = 1
        data[o + 4] = 0
        data[o + 5] = 0
        data[o + 6] = 0
        data[o + 7] = -1
        data[o + 8] = 0
        data[o + 9] = size
        data[o + 10] = (p.agent % atlas.cols) * atlas.cell
        data[o + 11] = Math.floor(p.agent / atlas.cols) * atlas.cell
        data[o + 12] = rise * rise * (3 - 2 * rise)
      })

      // Pass 1: the rings, crisp, into the scene texture.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.viewport(0, 0, w, h)
      gl.clearColor(page[0], page[1], page[2], 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(scene)
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, instances)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, atlas.texture)
      gl.uniform1i(sceneU.u_atlas, 0)
      gl.uniform1f(sceneU.u_cellSize, atlas.cell)
      gl.uniform2f(sceneU.u_res, w, h)
      gl.uniform2f(sceneU.u_centre, cx, ringY)
      gl.uniform1f(sceneU.u_focal, focal)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, pebbles.length)
      gl.bindVertexArray(null)

      // The lens blurs by reading lower mip levels, so they are rebuilt from this frame.
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.generateMipmap(gl.TEXTURE_2D)

      // Pass 2: the scene through the lens, onto the screen.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, w, h)
      gl.disable(gl.BLEND)
      gl.useProgram(lens)
      gl.bindVertexArray(lensVao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, sceneTex)
      gl.uniform1i(lensU.u_scene, 0)
      gl.uniform2f(lensU.u_res, w, h)
      gl.uniform2f(lensU.u_centre, cx, cy)
      gl.uniform1f(lensU.u_half, half)
      gl.uniform1f(lensU.u_in, LENS_IN)
      gl.uniform1f(lensU.u_bend, BEND)
      gl.uniform1f(lensU.u_split, SPLIT)
      gl.uniform1f(lensU.u_along, ALONG * H)
      gl.uniform1f(lensU.u_soften, SOFTEN + Math.log2(dpr))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!atlas) {
        return
      }
      const still = PREFERS_REDUCED.matches
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05)
      last = now
      if (still) {
        // The still picture shows the opening finished, so motion switched on later carries on
        // from it instead of replaying it from an empty stage.
        intro = Math.max(intro, 99)
      } else {
        turns = turns.map((turned, r) => turned + RINGS[r].speed * pace[r] * dt)
        intro += dt
      }
      draw()
      if (still) {
        settled = true
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    // A hero that is scrolled away, or in a background tab, costs nothing. A change made while
    // it is away, a theme switch say, is still drawn at once: otherwise its first frame back
    // would show the old picture.
    const sync = () => {
      if (!alive) {
        return
      }
      if (inView && !document.hidden && atlas && !settled) {
        if (!raf) {
          last = null
          raf = requestAnimationFrame(frame)
        }
        return
      }
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      if (dirty) {
        draw()
      }
    }

    let dark = isDark()
    let painting = 0
    const paint = () => {
      const run = ++painting
      return buildAtlas(agents, 256, dark, () => run !== painting)
        .then((built) => {
          // Flipping the theme twice in a row starts two paints, and only the last may land.
          if (!built) {
            return
          }
          if (run !== painting) {
            built.canvas.width = 0
            built.canvas.height = 0
            return
          }
          const texture = atlas ? atlas.texture : gl.createTexture()
          gl.bindTexture(gl.TEXTURE_2D, texture)
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, built.canvas)
          gl.generateMipmap(gl.TEXTURE_2D)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          // The texture holds the picture now, and the build canvas is a good few megabytes.
          built.canvas.width = 0
          built.canvas.height = 0
          atlas = { cols: built.cols, cell: built.cell, texture }
          dirty = true
          settled = false
          sync()
        })
        .catch((error) => {
          // A build that fails, out of canvas memory say, leaves the last picture up; with none
          // yet, the copy stands on its own.
          console.warn('[agent-hero]', error)
          if (!atlas) {
            root.dataset.agFallback = 'true'
          }
        })
    }
    void paint()

    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting
        })
        sync()
      },
      { threshold: 0 },
    )
    seen.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    // The hero reaches its real size after this runs, so it is watched for the page's life.
    // Resizing a canvas clears it, and this runs after the frame was drawn, so the resize is
    // redrawn here at once; otherwise that frame would reach the screen empty.
    const resized = new ResizeObserver(() => {
      dirty = true
      if (measure()) {
        draw()
      }
      settled = false
      sync()
    })
    // In device pixels where the browser reports them, so a move to a sharper screen counts.
    try {
      resized.observe(canvas, { box: 'device-pixel-content-box' })
    } catch {
      resized.observe(canvas)
    }
    // Web fonts can land after the canvas has its size, and change the copy's.
    if (copy) {
      resized.observe(copy)
    }
    measure()

    // The page colour is part of the picture, and the pebbles are painted for it, so a change
    // of theme repaints both. The docs switch theme with a class on the body; the root and the
    // system setting are watched as well.
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    const retheme = () => {
      if (!canvas.isConnected) {
        teardown()
        return
      }
      const before = page.join()
      readPage()
      const next = isDark()
      if (next !== dark) {
        dark = next
        void paint()
      }
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

    // Reduced motion can be switched with the page open, and the hero follows at once.
    const motion = () => {
      dirty = true
      settled = false
      sync()
    }
    PREFERS_REDUCED.addEventListener('change', motion)

    // The browser can take the context back: a GPU reset, or too many pages holding one. The
    // hero lets go and binds again on a fresh canvas, twice at most; after that the copy
    // stands on its own.
    const lost = (event) => {
      if (!alive) {
        return
      }
      event.preventDefault()
      teardown()
      if (rebuilds < 2) {
        rebuilds += 1
        requestAnimationFrame(run)
      } else {
        root.dataset.agHeroBound = 'true'
        root.dataset.agFallback = 'true'
      }
    }
    canvas.addEventListener('webglcontextlost', lost)

    // A hero the page has navigated away from lets go of all it holds, its drawing context most
    // of all: a browser keeps only a handful alive. The page watcher below calls release() on
    // every change to the page, which catches the hero leaving even while it is scrolled away.
    // It leaves a fresh canvas and no bound flag behind, so a root that comes back binds anew.
    const teardown = () => {
      if (!alive) {
        return
      }
      alive = false
      painting += 1
      cancelAnimationFrame(raf)
      raf = 0
      seen.disconnect()
      resized.disconnect()
      themed.disconnect()
      scheme.removeEventListener('change', retheme)
      PREFERS_REDUCED.removeEventListener('change', motion)
      document.removeEventListener('visibilitychange', sync)
      canvas.removeEventListener('webglcontextlost', lost)
      atlas = null
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      heroes.delete(release)
      canvas.replaceWith(canvas.cloneNode(false))
      delete root.dataset.agHeroBound
      delete root.dataset.agReady
    }
    const release = () => {
      if (!canvas.isConnected) {
        teardown()
      }
    }
    heroes.add(release)

    // A hook for captures and tests: jump the turn to a moment, with the opening finished.
    root.agSeek = (seconds) => {
      turns = RINGS.map((ring, r) => ring.speed * pace[r] * seconds)
      intro = 99
      dirty = true
      settled = false
      sync()
    }

    root.dataset.agReady = 'true'
  }

  /** Each bound hero's release(), which lets the hero go once it has left the page. */
  const heroes = new Set()
  /** How many times a hero has bound again after the browser took its context. */
  let rebuilds = 0

  const run = () => {
    heroes.forEach((release) => release())
    document.querySelectorAll('[data-ag-hero]').forEach(init)
  }

  const observe = () => {
    const target = document.documentElement || document.body
    if (!target) {
      requestAnimationFrame(observe)
      return
    }
    new MutationObserver(run).observe(target, { childList: true, subtree: true })
    // The marks come in a script of their own, which can run after this one.
    window.addEventListener('scalar-agent-marks', run)
    run()
  }

  observe()
})()
