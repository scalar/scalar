<div class="relative flex flex-col gap-3 hero small-test small-test-marc">
  <a
    class="absolute z-10 inline-flex max-w-full items-center gap-2 rounded-full bg-b-2 hover:bg-b-3 px-3 py-2 text-xs leading-none text-c-1 no-underline"
    style="top: -36px; left: 0"
    href="/resources/migration/stainless">
    <span class="font-medium">Migrate off Stainless</span>
    <span class="text-c-3" aria-hidden="true">•</span>
    <span class="inline-flex items-center gap-2 text-c-2">
      Read more
      <span aria-hidden="true">→</span>
    </span>
  </a>
  <scalar-heading level="1" slug="introduction" class="text-balance">
    API interfaces built for developers and agents
  </scalar-heading>
  <p>
    Create beautiful docs, SDKs and secure MCP servers from your API. Scalar keeps every interface in sync as your API evolves.
  </p>
  <div class="flex gap-2">
    <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get Started</a>
    <a class="t-editor__button" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a Demo</a>
  </div>
  <!--
  <div class="stickers stickers-marc">
    <div class="draggable sticker-5">
      <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/SiTCkdsfi2287iQBEGzN2.svg"></scalar-icon>
    </div>
    <div class="draggable sticker-1">
      <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/JXS6tZ4EbKIkeGpjP6QKc.svg"></scalar-icon>
    </div>
    <div class="draggable sticker-6">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/sticker-6.svg"></scalar-icon>
    </div>
    <div class="draggable sticker-7">
      <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/-dJduqbPTJP5xwDRhB5VS.svg"></scalar-icon>
    </div>
  </div>
  -->
</div>

<div class="hero-tabs">
<button type="button" class="active" data-hero-scene="profound-sdk">Profound SDK</button>
<button type="button" data-hero-scene="zoom-api">Zoom API</button>
<button type="button" data-hero-scene="clerk-api">Clerk API</button>
<button type="button" data-hero-scene="warp-sdk">Warp SDK</button>
</div>
<div class="hero-visual">
<div class="hero-glass" data-hero-scene-panel="profound-sdk">
<div class="hero-glass-tabs">
<button type="button" class="active" data-sdk-lang="typescript" data-sdk-abbr="TS">TypeScript</button>
<button type="button" data-sdk-lang="python" data-sdk-abbr="PY">Python</button>
<button type="button" data-sdk-lang="java" data-sdk-abbr="JV">Java</button>
<button type="button" data-sdk-lang="kotlin" data-sdk-abbr="KT">Kotlin</button>
<button type="button" data-sdk-lang="rust" data-sdk-abbr="RS">Rust</button>
</div>
<div class="hero-glass-codewrap dark-mode" data-sdk-lang="typescript" data-sdk-abbr="TS">

```typescript
import Profound from '@profoundai/client';

const client = new Profound({
  apiKey: process.env['PROFOUND_API_KEY'], // defaults to the PROFOUND_API_KEY env var
  environment: 'production',
});

const category = await client.organizations.categories.list();

console.log(category);
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="python" data-sdk-abbr="PY">

```python
import os

from profound import Profound

client = Profound(
    api_key=os.environ.get("PROFOUND_API_KEY"),
)

category = client.organizations.categories.list()

print(category)
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="java" data-sdk-abbr="JV">

```java
import com.profound.api.client.ProfoundClient;
import com.profound.api.client.okhttp.ProfoundOkHttpClient;

ProfoundClient client =
    ProfoundOkHttpClient.builder().apiKey(System.getenv("PROFOUND_API_KEY")).build();

var category = client.organizations().categories().list();

System.out.println(category);
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="kotlin" data-sdk-abbr="KT">

```kotlin
import com.profound.api.client.ProfoundClient
import com.profound.api.client.okhttp.ProfoundOkHttpClient
import com.profound.api.models.organizations.categories.CategoryListParams

val client: ProfoundClient =
    ProfoundOkHttpClient.builder().apiKey(System.getenv("PROFOUND_API_KEY")).build()

val category = client.organizations().categories().list(CategoryListParams.none())

println(category)
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="rust" data-sdk-abbr="RS">

```rust
use profound_rust::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ProfoundClient::builder()
        .api_key(std::env::var("PROFOUND_API_KEY")?)
        .build()?;

    let response = client.organizations().categories().list().send().await?;

    println!("{:?}", response);

    Ok(())
}
```

</div>
</div>
<svg id="hero-art" preserveAspectRatio="xMidYMid slice" data-hero-scene-panel="profound-sdk" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dark charcoal gradient artwork" style="width: 100%; height: auto; display: block">
<defs>
<clipPath id="hero-art-clip"><rect width="1600" height="1000"/></clipPath>
<linearGradient id="hero-art-grad" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#43474e"/>
<stop offset="0.4" stop-color="#2b2e34"/>
<stop offset="1" stop-color="#0f1114"/>
</linearGradient>
<radialGradient id="hero-art-glow" cx="0.5" cy="0" r="0.85">
<stop offset="0" stop-color="#5f656e" stop-opacity="0.5"/>
<stop offset="0.45" stop-color="#5f656e" stop-opacity="0.12"/>
<stop offset="1" stop-color="#5f656e" stop-opacity="0"/>
</radialGradient>
<filter id="hero-art-grain-fine" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="7" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer>
<feFuncR type="linear" slope="1.6" intercept="-0.3"/>
<feFuncG type="linear" slope="1.6" intercept="-0.3"/>
<feFuncB type="linear" slope="1.6" intercept="-0.3"/>
<feFuncA type="linear" slope="0" intercept="1"/>
</feComponentTransfer>
</filter>
</defs>
<g clip-path="url(#hero-art-clip)">
<rect width="1600" height="1000" fill="url(#hero-art-grad)"/>
<rect width="1600" height="1000" fill="url(#hero-art-glow)"/>
<rect class="hero-art-noise" width="1600" height="1000" filter="url(#hero-art-grain-fine)" style="mix-blend-mode:soft-light;opacity:.12"/>
</g>
<style>@supports (-moz-appearance:none){#hero-art .hero-art-noise{display:none}}</style>
</svg>
<svg id="hero-art-zoom" class="scene-hidden" preserveAspectRatio="xMidYMid slice" data-hero-scene-panel="zoom-api" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Abstract blue streaked artwork" style="width: 100%; height: auto; display: block">
<defs>
<clipPath id="hero-art-zoom-clip"><rect width="1600" height="1000"/></clipPath>
<filter id="hero-art-zoom-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="hero-art-zoom-streak" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="110 18"/></filter>
<filter id="hero-art-zoom-core" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="55 7"/></filter>
<filter id="hero-art-zoom-grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="9" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer>
<feFuncR type="linear" slope="1.4" intercept="-0.2"/>
<feFuncG type="linear" slope="1.4" intercept="-0.2"/>
<feFuncB type="linear" slope="1.4" intercept="-0.2"/>
<feFuncA type="linear" slope="0" intercept="1"/>
</feComponentTransfer>
</filter>
</defs>
<g clip-path="url(#hero-art-zoom-clip)">
<g filter="url(#hero-art-zoom-soft)">
<rect x="-160" y="-160" width="1920" height="1320" fill="#16a8e0"/>
<ellipse cx="120" cy="120" rx="560" ry="350" fill="#0a7fc4"/>
<ellipse cx="700" cy="0" rx="620" ry="170" fill="#0c8ecd"/>
<ellipse cx="1470" cy="120" rx="440" ry="250" fill="#0973b8"/>
<ellipse cx="1120" cy="500" rx="420" ry="260" fill="#109ad6"/>
<ellipse cx="1000" cy="560" rx="350" ry="200" fill="#0e97d2"/>
<ellipse cx="430" cy="540" rx="420" ry="250" fill="#0fa2dc"/>
<ellipse cx="1560" cy="1010" rx="420" ry="210" fill="#0e97d0"/>
</g>
<g transform="rotate(-22 800 500)">
<g filter="url(#hero-art-zoom-streak)">
<ellipse cx="675" cy="169" rx="420" ry="95" fill="#c9ecfa"/>
<ellipse cx="605" cy="103" rx="280" ry="55" fill="#e6f7fd"/>
<ellipse cx="948" cy="161" rx="400" ry="40" fill="#9fdcf4"/>
<ellipse cx="1256" cy="253" rx="430" ry="42" fill="#d9f2fb"/>
<ellipse cx="1458" cy="259" rx="380" ry="55" fill="#b7e6f7"/>
<ellipse cx="1533" cy="527" rx="400" ry="30" fill="#c4eaf8"/>
<ellipse cx="1749" cy="474" rx="320" ry="60" fill="#a9e0f5"/>
<ellipse cx="115" cy="407" rx="320" ry="24" fill="#8fd8f2"/>
<ellipse cx="131" cy="715" rx="430" ry="48" fill="#ade2f6"/>
<ellipse cx="544" cy="866" rx="480" ry="45" fill="#c9ecf9"/>
<ellipse cx="1021" cy="967" rx="500" ry="58" fill="#daf3fc"/>
<ellipse cx="1178" cy="1165" rx="420" ry="38" fill="#a9dff4"/>
<ellipse cx="1396" cy="1161" rx="340" ry="42" fill="#c4eaf7"/>
</g>
<g filter="url(#hero-art-zoom-core)">
<ellipse cx="606" cy="98" rx="270" ry="16" fill="#f4fcfe"/>
<ellipse cx="1248" cy="244" rx="300" ry="12" fill="#eef9fd"/>
<ellipse cx="1535" cy="522" rx="240" ry="10" fill="#ddf3fb"/>
<ellipse cx="1023" cy="962" rx="330" ry="16" fill="#f6fdfe"/>
<ellipse cx="546" cy="861" rx="290" ry="13" fill="#eaf8fd"/>
<ellipse cx="170" cy="725" rx="240" ry="11" fill="#d8f1fb"/>
</g>
</g>
<rect class="hero-art-noise" width="1600" height="1000" filter="url(#hero-art-zoom-grain)" style="mix-blend-mode:soft-light;opacity:.2"/>
</g>
<style>@supports (-moz-appearance:none){#hero-art-zoom .hero-art-noise{display:none}}</style>
</svg>
<div class="hero-zoom-docs scene-hidden" data-hero-scene-panel="zoom-api">
<img class="light-image" src="/api-docs-static-zoom-glass.svg" alt="Zoom API documentation preview" />
<img class="dark-image" src="/api-docs-static-zoom-glass-dark.svg" alt="Zoom API documentation preview" />
</div>
<svg id="hero-art-clerk" class="scene-hidden" preserveAspectRatio="xMidYMid slice" data-hero-scene-panel="clerk-api" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Abstract violet streaked artwork" style="width: 100%; height: auto; display: block">
<defs>
<clipPath id="hero-art-clerk-clip"><rect width="1600" height="1000"/></clipPath>
<filter id="hero-art-clerk-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="hero-art-clerk-streak" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="110 18"/></filter>
<filter id="hero-art-clerk-core" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="55 7"/></filter>
<filter id="hero-art-clerk-grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="13" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer>
<feFuncR type="linear" slope="1.4" intercept="-0.2"/>
<feFuncG type="linear" slope="1.4" intercept="-0.2"/>
<feFuncB type="linear" slope="1.4" intercept="-0.2"/>
<feFuncA type="linear" slope="0" intercept="1"/>
</feComponentTransfer>
</filter>
</defs>
<g clip-path="url(#hero-art-clerk-clip)">
<g filter="url(#hero-art-clerk-soft)">
<rect x="-160" y="-160" width="1920" height="1320" fill="#453a8c"/>
<ellipse cx="800" cy="-40" rx="900" ry="260" fill="#987aa8"/>
<ellipse cx="200" cy="60" rx="480" ry="240" fill="#8f74a4"/>
<ellipse cx="1450" cy="20" rx="360" ry="180" fill="#87709f"/>
<ellipse cx="1580" cy="240" rx="280" ry="160" fill="#64559f"/>
<ellipse cx="400" cy="400" rx="500" ry="240" fill="#5b4fa4"/>
<ellipse cx="1250" cy="600" rx="480" ry="280" fill="#3c3280"/>
<ellipse cx="700" cy="900" rx="520" ry="240" fill="#372e78"/>
<ellipse cx="120" cy="900" rx="360" ry="220" fill="#453b8b"/>
</g>
<g transform="rotate(-34 800 500)">
<g filter="url(#hero-art-clerk-streak)">
<ellipse cx="551" cy="-114" rx="400" ry="70" fill="#9a7fbe"/>
<ellipse cx="1029" cy="160" rx="500" ry="80" fill="#a687c0"/>
<ellipse cx="1452" cy="517" rx="420" ry="70" fill="#9880ba"/>
<ellipse cx="1643" cy="538" rx="300" ry="60" fill="#ab8bc2"/>
<ellipse cx="374" cy="237" rx="350" ry="35" fill="#7c6fbe"/>
<ellipse cx="922" cy="498" rx="400" ry="30" fill="#6f63b4"/>
<ellipse cx="1226" cy="763" rx="380" ry="40" fill="#7d70c0"/>
<ellipse cx="531" cy="451" rx="400" ry="45" fill="#362e6f"/>
<ellipse cx="959" cy="800" rx="420" ry="40" fill="#342c6b"/>
<ellipse cx="1111" cy="1023" rx="400" ry="40" fill="#332b68"/>
<ellipse cx="600" cy="618" rx="300" ry="22" fill="#565a82"/>
<ellipse cx="172" cy="269" rx="300" ry="30" fill="#8579c2"/>
<ellipse cx="171" cy="449" rx="400" ry="45" fill="#7a6cba"/>
<ellipse cx="258" cy="677" rx="420" ry="50" fill="#8073c0"/>
<ellipse cx="930" cy="1022" rx="450" ry="50" fill="#6f61b2"/>
<ellipse cx="1145" cy="1276" rx="380" ry="45" fill="#7d6fbe"/>
</g>
<g filter="url(#hero-art-clerk-core)">
<ellipse cx="1065" cy="196" rx="320" ry="14" fill="#c4a6d6"/>
<ellipse cx="140" cy="405" rx="240" ry="10" fill="#9184c8"/>
<ellipse cx="206" cy="594" rx="280" ry="14" fill="#978ac9"/>
<ellipse cx="983" cy="1034" rx="300" ry="12" fill="#8c7ec4"/>
</g>
</g>
<rect class="hero-art-noise" width="1600" height="1000" filter="url(#hero-art-clerk-grain)" style="mix-blend-mode:soft-light;opacity:.18"/>
</g>
<style>@supports (-moz-appearance:none){#hero-art-clerk .hero-art-noise{display:none}}</style>
</svg>
<div class="hero-clerk-docs scene-hidden" data-hero-scene-panel="clerk-api">
<img class="light-image" src="/clerk-docs-glass.svg" alt="Clerk API documentation preview" />
<img class="dark-image" src="/clerk-docs-glass-dark.svg" alt="Clerk API documentation preview" />
</div>
<svg id="hero-art-warp" class="scene-hidden" preserveAspectRatio="xMidYMid slice" data-hero-scene-panel="warp-sdk" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Abstract red-orange silk artwork" style="width: 100%; height: auto; display: block">
<defs>
<clipPath id="hero-art-warp-clip"><rect width="1600" height="1000"/></clipPath>
<filter id="hero-art-warp-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="70"/></filter>
<filter id="hero-art-warp-crest" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="28"/></filter>
<filter id="hero-art-warp-grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="17" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer>
<feFuncR type="linear" slope="1.4" intercept="-0.2"/>
<feFuncG type="linear" slope="1.4" intercept="-0.2"/>
<feFuncB type="linear" slope="1.4" intercept="-0.2"/>
<feFuncA type="linear" slope="0" intercept="1"/>
</feComponentTransfer>
</filter>
</defs>
<g clip-path="url(#hero-art-warp-clip)">
<g filter="url(#hero-art-warp-soft)">
<rect x="-160" y="-160" width="1920" height="1320" fill="#f0821c"/>
<ellipse cx="700" cy="40" rx="700" ry="220" fill="#f5a029"/>
<ellipse cx="60" cy="-10" rx="260" ry="100" fill="#f6ecd8"/>
<ellipse cx="1450" cy="80" rx="420" ry="200" fill="#f2911f"/>
<ellipse cx="500" cy="420" rx="620" ry="220" fill="#d94e12" transform="rotate(-14 500 420)"/>
<ellipse cx="1200" cy="520" rx="560" ry="240" fill="#dd5514" transform="rotate(-10 1200 520)"/>
<ellipse cx="800" cy="560" rx="900" ry="150" fill="#d04a10" transform="rotate(-11 800 560)"/>
<ellipse cx="250" cy="800" rx="440" ry="260" fill="#f9b53f" transform="rotate(-18 250 800)"/>
<ellipse cx="900" cy="920" rx="520" ry="200" fill="#ee7317" transform="rotate(-8 900 920)"/>
<ellipse cx="1500" cy="900" rx="420" ry="240" fill="#f07d1a" transform="rotate(-12 1500 900)"/>
</g>
<g filter="url(#hero-art-warp-crest)">
<ellipse cx="380" cy="700" rx="380" ry="46" fill="#fbc954" transform="rotate(-20 380 700)"/>
<ellipse cx="240" cy="850" rx="300" ry="34" fill="#fdda75" transform="rotate(-22 240 850)"/>
<ellipse cx="720" cy="330" rx="420" ry="36" fill="#ec6d13" transform="rotate(-14 720 330)"/>
<ellipse cx="520" cy="770" rx="360" ry="30" fill="#c9430e" transform="rotate(-20 520 770)"/>
<ellipse cx="1150" cy="700" rx="420" ry="40" fill="#f7a832" transform="rotate(-9 1150 700)"/>
<ellipse cx="1050" cy="180" rx="380" ry="42" fill="#f8ad38" transform="rotate(-8 1050 180)"/>
</g>
<rect class="hero-art-noise" width="1600" height="1000" filter="url(#hero-art-warp-grain)" style="mix-blend-mode:soft-light;opacity:.2"/>
</g>
<style>@supports (-moz-appearance:none){#hero-art-warp .hero-art-noise{display:none}}</style>
</svg>
<div class="hero-glass scene-hidden" data-hero-scene-panel="warp-sdk">
<div class="hero-glass-tabs">
<button type="button" class="active" data-sdk-lang="typescript" data-sdk-abbr="TS">TypeScript</button>
<button type="button" data-sdk-lang="python" data-sdk-abbr="PY">Python</button>
<button type="button" data-sdk-lang="go" data-sdk-abbr="GO">Go</button>
<button type="button" data-sdk-lang="bash" data-sdk-abbr="CLI">CLI</button>
</div>
<div class="hero-glass-codewrap dark-mode" data-sdk-lang="typescript" data-sdk-abbr="TS">

```typescript
import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["WARP_API_KEY"], // defaults to the WARP_API_KEY env var
});

// Auto-paginating: the next cursor page is fetched as you iterate.
for await (const assignment of client.timeOff.listAssignments({ limit: 50 })) {
  console.log(assignment.id, assignment.policy.name);
}
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="python" data-sdk-abbr="PY">

```python
import os

from warp import Warp

client = Warp(api_key=os.environ.get("WARP_API_KEY"))

# Auto-paginating: the next cursor page is fetched as you iterate.
for assignment in client.time_off.list_assignments(limit=50):
    print(assignment.id, assignment.policy.name)
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="go" data-sdk-abbr="GO">

```go
package main

import (
	"context"
	"fmt"
	"os"

	sdk "github.com/TeamWarp/warp-go-sdk"
	"github.com/TeamWarp/warp-go-sdk/option"
)

func main() {
	client := sdk.NewClient(option.WithAPIKey(os.Getenv("WARP_API_KEY")))

	iter := client.TimeOff.ListAssignmentsAutoPaging(context.Background(),
		sdk.TimeOffListAssignmentsParams{Limit: sdk.Int(50)})

	for iter.Next() {
		assignment := iter.Current()
		fmt.Println(assignment.ID, assignment.Policy.Name)
	}

	if err := iter.Err(); err != nil {
		panic(err)
	}
}
```

</div>
<div class="hero-glass-codewrap dark-mode is-hidden" data-sdk-lang="bash" data-sdk-abbr="CLI">

```bash
# Install from Homebrew, or run it with npx warp
brew install teamwarp/tap/warp

export WARP_API_KEY="wrp_live_..."

# Flags are typed from the OpenAPI parameters
warp time-off list-assignments --limit 50 --output table

# Every command speaks JSON too, so it composes
warp time-off list-assignments --output json | jq '.data[].policy.name'
```

</div>
</div>
</div>

<div class="logowall">
  <div class="gradient-blur">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tr.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-maersk.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-tailscale.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-supabase.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-flyio.svg"></scalar-icon>
  </div>
  <div class="logowall-item">
    <scalar-icon src="https://cdn.scalar.com/marketing/landing/logo-clerk.svg?v=2"></scalar-icon>
  </div>
</div>

<div class="quotes">
  <h2>Take their word for it</h2>
  <div class="flex flex-wrap quotes-container">
    <div class="quotes-item">
      <p>
        <strong>“After years of helping enterprises implement API strategies at SmartBear, I can confidently say Scalar is what the industry has been waiting for.</strong>
      </p>
      <p>
        The strict OpenAPI compliance, robust CLI/API registry, and seamless CI/CD integration solve the exact pain points I watched customers struggle with daily. This is the modern API platform developers deserve.”
      </p>
      <p class="text-c-3">
        Michael, Former Solutions Architect @ Smartbear
      </p>
    </div>
    <div class="quotes-item">
      <p>
        “One of my most recent favorites is a in-browser ad hoc testing UI called Scalar.
      </p>
      <p>
        One of the things that I really love about Scalar, it's got this modern UI experience, and it provides <b>built-in test generation code for a variety of targets, from cURL to HttpClient in C#.</b>”
      </p>
      <p class="text-c-3">Captain Safia, Engineer @ Microsoft ASP.NET</p>
    </div>
    <div class="quotes-item">
      <p>
        “Scalar's ‘golden ticket’ is… Scalar!
      </p>
      <p>
        <strong>They are (in my own words) building a product ecosystem for API design, docs, testing, and governance</strong> – with offerings at every price point.
      </p>
      <p>
        They are open source. So I can get in on free features and stay with Scalar no matter how big my API needs blow up.”
      </p>
      <p class="text-c-3">Eron, Documentation Engineer @ Qrvey</p>
    </div>
  </div>
</div>

<div>
  <div class="product product-reversed">
    <div class="product-copy">
      <span class="font-bold text-blue">Docs</span>
      <scalar-heading level="2" slug="scalar-docs" class="c">
        The Modern Documentation Platform for Your API and Everything Else
      </scalar-heading>
      <p>
        Write documentation with Markdown and MDX, generate API references from OpenAPI and AsyncAPI, and keep everything up to date with two-way Git sync.
      </p>
      <div class="flex flex-wrap text-blue gap-y-2">
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/brackets-angle"></scalar-icon>
          Markdown and MDX
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
          OpenAPI + AsyncAPI
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/arrows-clockwise"></scalar-icon>
          Two-Way Git Sync
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/brackets-curly"></scalar-icon>
          <span><span class="lg-only">Custom </span>HTML/CSS/JS</span>
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/headset"></scalar-icon>
          Chat with AI/MCP
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/lock-simple"></scalar-icon>
          Private or Public
        </b>
      </div>
      <div class="product-actions mt-3">
        <a class="product-action t-editor__anchor" href="https://dashboard.scalar.com/register" aria-label="Create documentation with Scalar">
          Create Docs &rarr;
        </a>
        <a class="product-action t-editor__anchor" data-scalar-type="page-link" href="/products/docs" aria-label="Learn more about Scalar Docs">
          Learn More &rarr;
        </a>
      </div>
    </div>
    <div class="product-image">
      <div class="product-image-transform">
        <img alt="Docs" class="light-image" src="/api-docs-static-zoom.svg"/>
        <img alt="Docs" class="dark-image" src="/api-docs-static-zoom-dark.svg"/>
      </div>
    </div>
    <div class="draggable sticker-3">
      <scalar-icon src="https://cdn.scalar.com/marketing/landing/sticker-3.v3.svg"></scalar-icon>
    </div>
  </div>
  <div class="product">
    <div class="product-copy">
      <span class="font-bold text-purple">Scalar SDK Generation</span>
      <scalar-heading level="2" slug="scalar-sdk-generation" class="c">
        One Commit To Update All Your SDKs
      </scalar-heading>
      <p>
        Bring your OpenAPI document and get type-safe client libraries for TypeScript, Python, Golang, PHP, Java and Ruby with more languages coming soon.
      </p>
      <div class="flex flex-wrap text-purple gap-y-2">
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/arrow-up-right"></scalar-icon>
          OpenAPI-First
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/brackets-square"></scalar-icon>
          Custom-code
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/code"></scalar-icon>
          Code Samples
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/fingerprint"></scalar-icon>
          <span><span class="lg-only">OpenAPI </span>Authentication</span>
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/cloud-check"></scalar-icon>
          Syncs with Docs
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/file-cloud"></scalar-icon>
          File Streaming Support
        </b>
      </div>
      <div class="product-actions mt-3">
        <a class="product-action t-editor__anchor" href="https://dashboard.scalar.com/register" aria-label="Generate an SDK with Scalar">
          Generate SDK &rarr;
        </a>
        <a class="product-action t-editor__anchor" data-scalar-type="page-link" href="/products/sdk-generator" aria-label="Learn more about Scalar SDK Generation">
          Learn More &rarr;
        </a>
      </div>
    </div>
    <div class="product-image">
      <div class="product-image-transform">
        <img alt="SDKs" class="light-image" src="/sdks-static.svg" />
        <img alt="SDKs" class="dark-image" src="/sdks-static-dark.svg" />
      </div>
    </div>
    <div class="draggable sticker-2">
      <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/gM-mqYTBYMkqpnexTIr-r.svg"></scalar-icon>
    </div>
  </div>
  <div class="product product-reversed">
    <div class="product-copy">
      <span class="font-bold text-orange">API Client</span>
      <scalar-heading level="2" slug="scalar-api-client" class="c">
        The Postman Alternative Your Team Is Dreaming Of
      </scalar-heading>
      <p>
        Fully open-source & offline first API Client built on the OpenAPI standard, by us & our community.
      </p>
      <div class="flex flex-wrap text-orange gap-y-2">
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/wifi-slash"></scalar-icon>
          Offline-first
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/globe"></scalar-icon>
          Sync your local API
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/graph"></scalar-icon>
          OpenAPI by Heart
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/users"></scalar-icon>
          Collaborate with Others
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/lock-simple-open"></scalar-icon>
          No Vendor Lock-In
        </b>
        <b class="flex items-center icon-text gap-3 font-medium w-1/2 min-h-8">
          <scalar-icon src="phosphor/bold/desktop-tower"></scalar-icon>
          Linux, Windows, macOS
        </b>
      </div>
      <div class="product-actions mt-3">
        <a class="product-action t-editor__anchor" href="https://client.scalar.com/" target="_blank" rel="noopener noreferrer" aria-label="Send an API request with Scalar">
          Send Request &rarr;
        </a>
        <a class="product-action t-editor__anchor" data-scalar-type="page-link" href="/products/api-client" aria-label="Learn more about Scalar API Client">
          Learn More &rarr;
        </a>
      </div>
    </div>
    <div class="product-image">
      <div class="product-image-transform">
        <img alt="API Client" class="light-image" src="/api-client-static.svg"/>
        <img alt="API Client" class="dark-image" src="/api-client-static-dark.svg"/>
      </div>
    </div>
    <div class="draggable sticker-8">
      <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/JXS6tZ4EbKIkeGpjP6QKc.svg"></scalar-icon>
    </div>
  </div>
</div>

<div class="founder-quote border rounded-lg p-12 relative">
  <scalar-icon src="https://cdn.scalar.com/marketing/landing/scalar-logomark.svg?cache=1234"></scalar-icon>
  <br />
  <br />
  <p>Marc from Scalar here,</p>
  <br />
  <p>
    There's no better feeling than building and being enabled by the software you are integrating with.
  </p>
  <br />
  <p>
    We've all experienced friction with out-of-date docs, no client SDKs in your favorite language, and no one to talk to about your struggles on-boarding.
  </p>
  <br />
  <p>
    But we've also experienced those magical APIs that just work with everything you need right there. This drives our simple three tenants at Scalar: Accessibility, Open-Source, and API First. Making on-boarding easier and  magical enables people to build, and being API first means your business can scale for the future (LLMs).
  </p>
  <br />
  <p>
    Why Open-Source? If done right, it’s transparent, builds industry standards (OpenAPI), accelerates innovation, and fosters collaboration. We love Open-Source and keep it core to our values.
  </p>
  <br />
  <p>
    We are fans of “show don't tell here” at Scalar: so try our Docs (this page), our SDKs for our API that includes our API Client, Agent to chat with APIs, and our GitHub for all our open-source products. As always, we love your feedback so drop us a line in our discord, email, or book a call with me to see how we can help.
  </p>
  <br />
  <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/rzLt5QLobG1QcqnrhdAor.svg"></scalar-icon>
  <br />
  <div>
    <b>Marc Laventure</b>
    <br />
    <span>CEO, Scalar</span>
  </div>
  <div class="draggable sticker-9">
    <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/jSSY0fRlk7g_HdR7i7BIu.svg"></scalar-icon>
  </div>
</div>

<div class="cta flex flex-col gap-3 small-test">
  <scalar-heading level="2" class="text-balance" slug="what-are-you-waiting-for">What are you waiting for?</scalar-heading>
  <p>
    We're committed to enabling developers and companies to practice the highest
    of API industry standards.
  </p>
  <div class="flex gap-2 mb-11">
    <a class="t-editor__button" href="https://dashboard.scalar.com/register">Get Started</a>
    <a class="t-editor__button" href="https://scalar.cal.com/forms/142d1e65-97d2-4d03-94c3-96f98ddef95a" target="_blank">Book a Demo</a>
  </div>
  <a class="expander-hover-link" href="https://discord.gg/scalar" target="_blank" aria-label="Join Scalar community on Discord">Community →</a>
  <a class="expander-hover-link" href="https://github.com/scalar/scalar" target="_blank" aria-label="View Scalar on GitHub">GitHub →</a>
  <a class="expander-hover-link" href="mailto:support@scalar.com" target="_blank" aria-label="Contact Scalar support">Contact Us →</a>
</div>

<div class="expander-container">
  <div class="expander-hover">
    <div class="expander-hover-preview">
      <img alt="API Docs Preview" class="light-image" src="/api-docs-static-zoom.svg" />
      <img alt="API Docs Preview" class="dark-image" src="/api-docs-static-zoom-dark.svg" />
    </div>
    <div class="relative">
      <div class="expander-hover-sticker">
        <object class="sticker-clip-docs" width="113" height="143" data="https://cdn.scalar.com/marketing/landing/sticker-3.v3.svg"></object>
      </div>
      <div class="expander-hover-title">API Docs</div>
      <div class="expander">
        <div class="expander-content">
          Write beautiful documentation with Markdown, MDX, OpenAPI, AsyncAPI, and two-way Git sync.
        </div>
      </div>
      <a class="expander-hover-link" href="/products/docs" aria-label="Learn more about API Docs">Learn More</a>
    </div>
  </div>
  <div class="expander-hover">
    <div class="expander-hover-preview">
      <img alt="SDKs Preview" class="light-image" src="/sdks-static.svg" />
      <img alt="SDKs Preview" class="dark-image" src="/sdks-static-dark.svg" />
    </div>
    <div class="relative">
      <div class="expander-hover-sticker">
        <object class="sticker-clip-sdk" width="145" height="145"
          data="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/gM-mqYTBYMkqpnexTIr-r.svg"></object>
      </div>
      <div class="expander-hover-title">SDKs</div>
      <div class="expander">
        <div class="expander-content">
          Bring your OpenAPI document and get type-safe client libraries for TypeScript, Python and more.
        </div>
      </div>
      <a class="expander-hover-link" href="/products/sdk-generator" aria-label="Learn more about SDKs">Learn More</a>
    </div>
  </div>
  <div class="expander-hover">
    <div class="expander-hover-preview">
      <img alt="API Registry Preview" class="light-image" src="/registry-static.svg" />
      <img alt="API Registry Preview" class="dark-image" src="/registry-static-dark.svg" />
    </div>
    <div class="relative">
      <div class="expander-hover-sticker">
      <object class="sticker-clip-registry" width="136" height="186"
          data="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/jgGF_IKsu-T_irS-6MMOy.svg"></object>
      </div>
      <div class="expander-hover-title">API Registry</div>
      <div class="expander">
        <div class="expander-content">
          Managing & versioning OpenAPI Documents with a deep Git integration.
        </div>
      </div>
      <a class="expander-hover-link" href="/products/registry" aria-label="Learn more about API Registry">Learn More</a>
    </div>
  </div>
  <div class="expander-hover">
    <div class="expander-hover-preview">
      <img alt="API Client Preview" class="light-image" src="/api-client-static.svg" />
      <img alt="API Client Preview" class="dark-image" src="/api-client-static-dark.svg" />
    </div>
    <div class="relative">
      <div class="expander-hover-sticker">
        <object class="sticker-clip-client" width="156" height="110"
          data="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/JXS6tZ4EbKIkeGpjP6QKc.svg"></object>
      </div>
      <div class="expander-hover-title">API Client</div>
      <div class="expander">
        <div class="expander-content">
          Minimal, powerful, fully open-source API Client built on open standards by us + our community.
        </div>
      </div>
      <a class="expander-hover-link" href="https://client.scalar.com/" target="_blank" aria-label="Learn more about API Client">Learn More</a>
    </div>
  </div>
</div>
<div class="sticker-filter-effect">
  <scalar-icon src="https://api.scalar.com/cdn/images/LByt7m02eR-6wZrXUk5d5/utn6gGF3Iucolqx4jmXmY.svg"></scalar-icon>
</div>

<style>
  :root {
    --scalar-text-decoration: underline;
    --scalar-text-decoration-hover: underline;
  }
  .t-editor__page-title,
  .t-editor__page-nav,
  .notify-container,
  .subheading,
  .page-nav,
  .t-editor .page-header {
    display: none;
  }
  main.content {
    overflow-x: clip;
  }
  .t-doc .layout-header {
    z-index: 10000;
  }
  .t-editor__anchor {
    --font-visited: none;
  }
  .t-editor__button {
    min-width: 160px;
    justify-content: center;
  }
  .t-editor .editor-content,
  .t-editor {
    padding-bottom: 0;
  }
  h3.t-editor__heading,
  h2.t-editor__heading {
    --font-size: var(--scalar-heading-1);
      margin-top: 0;
  }
  :root {
    --scalar-container-width: 960px;
  }
  .hero.hero {
    margin-top: 88px;
  }
  .small-test {
    max-width: 440px;
    text-wrap: balance;
    margin-top: 44px;
    position: relative;
  }
  .small-test-marc {
    max-width: 680px;
  }
  @media only screen and (min-width: 1000px) {
    .stickers-marc {
      right: 240px;
    }
  }
  .t-editor.page {
    margin-right: unset;
  }
  .t-editor .slider,
  .t-editor .hero-visual {
    margin-top: unset;
  }
  .t-editor .editor-static .page-node,
  .t-editor .page-node,
  .t-editor .content {
    max-width: var(--scalar-container-width);
    padding-bottom: 0;
    margin-bottom: 0;
    margin-top: 0;
  }
  .container {
    width: var(--scalar-container-width);
    margin: auto;
    position: relative;
  }
  .container-full {
    --scalar-container-sidebar-gap: calc(
      (
        (100dvw - var(--scalar-container-width) - var(--scalar-sidebar-width)) /
          2
      )
    );
    width: calc(100dvw - var(--scalar-sidebar-width));
    margin-left: min(-1 * var(--scalar-container-sidebar-gap), -50px);
  }
  .gallery {
    display: flex;
    --scalar-gallery-item-offset: 140px;
    overflow: scroll;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding: 0 max(var(--scalar-container-sidebar-gap) - 70px, 50px) !important;
    position: relative;
    margin-top: 32px;
  }
  .gallery::-webkit-scrollbar {
    display: none;
  }
  .gallery li {
    max-width: calc(100dvw - var(--scalar-sidebar-width) - 50px);
    scroll-snap-align: start;
    display: inline-block;
    font-size: 0;
    aspect-ratio: 16/9;
    padding-left: 50px;
    margin-right: 50px;
  }
  .gallery li img {
    min-width: 100%;
    max-width: unset;
    height: 100%;
    max-height: 600px;
    object-fit: cover;
  }
  .slider {
    padding-top: 100px;
  }
  .hero-visual {
    position: relative;
    padding-top: 14px;
    /* Up to 150px wider per side than the content column, shrinking when the
       viewport cannot fit the full overhang, and always centred on the column. */
    --hero-art-overhang: max(
      0px,
      min(
        150px,
        (100dvw - var(--scalar-sidebar-width) - 100%) / 2 - 20px
      )
    );
    width: calc(100% + 2 * var(--hero-art-overhang));
    margin-left: calc(-1 * var(--hero-art-overhang));
  }
  /* Zoom API docs mock over the blue artwork: glass topbar baked into the
     asset, bottom fade identical to the Profound SDK card. */
  .hero-zoom-docs,
  .hero-clerk-docs {
    position: absolute;
    top: calc(14px + 50px);
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    width: min(1000px, 96%);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-360%22 y=%22-360%22 width=%222320%22 height=%221720%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2230%22/%3E%3C/filter%3E%3C/defs%3E%3Crect x=%22-200%22 y=%22-200%22 width=%222000%22 height=%221080%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-360%22 y=%22-360%22 width=%222320%22 height=%221720%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2230%22/%3E%3C/filter%3E%3C/defs%3E%3Crect x=%22-200%22 y=%22-200%22 width=%222000%22 height=%221080%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .hero-zoom-docs img,
  .hero-clerk-docs img {
    width: 100%;
    height: auto;
  }
  /* Glass SDK card over the hero art, matching the frosted panel in
     Lightspark's B2B hero: translucent white + backdrop blur + hairline
     light border, with a solid code block inside (visual placeholder). */
  .hero-glass {
    /* dark editor panel, anchored like the API mocks with the same bottom fade */
    position: absolute;
    top: calc(14px + 50px);
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    width: min(1000px, 96%);
    border-radius: 16px;
    overflow: hidden;
    background: #101114;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-360%22 y=%22-360%22 width=%222320%22 height=%221720%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2230%22/%3E%3C/filter%3E%3C/defs%3E%3Crect x=%22-200%22 y=%22-200%22 width=%222000%22 height=%221080%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-360%22 y=%22-360%22 width=%222320%22 height=%221720%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2230%22/%3E%3C/filter%3E%3C/defs%3E%3Crect x=%22-200%22 y=%22-200%22 width=%222000%22 height=%221080%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .hero-glass-tabs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  /* no copy chrome on the SDK panes */
  .hero-glass-codewrap .t-editor__language-picker {
    display: none;
  }
  .hero-glass-codewrap code {
    counter-reset: line;
  }
  .hero-glass-codewrap .t-code__line {
    display: block;
    counter-increment: line;
  }
  .hero-glass-codewrap .t-code__line::before {
    content: counter(line);
    display: inline-block;
    width: 2ch;
    margin-right: 18px;
    text-align: right;
    color: rgba(255, 255, 255, 0.32);
  }
  .hero-glass::before {
    left: calc(50% - var(--hero-code-w) / 2 - 1px);
  }
  .hero-glass::after {
    right: calc(50% - var(--hero-code-w) / 2 - 1px);
  }
  .hero-glass-tabs::before {
    left: calc(50% - var(--hero-code-w) / 2 - 1px);
  }
  .hero-glass-tabs::after {
    right: calc(50% - var(--hero-code-w) / 2 - 1px);
  }
  .hero-glass-tabs button {
    appearance: none;
    background: none;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    padding: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    white-space: nowrap;
    color: rgba(255, 255, 255, 0.4);
  }
  .hero-glass-tabs button:hover {
    color: rgb(255, 255, 255);
  }
  .hero-glass-tabs button.active {
    color: rgba(255, 255, 255, 0.95);
  }
  .hero-glass-codewrap.is-hidden {
    display: none;
  }
  .hero-glass-codewrap {
    position: relative;
    width: 100%;
  }
  .hero-glass-codewrap pre {
    margin: 0;
    padding: 18px 20px 20px 6px;
    background: transparent;
    font-size: 14px;
    line-height: 1.75;
    box-shadow: none;
  }
  /* Scene tabs above the hero art, in the old slider's position: in-flow,
     left-aligned to the content column (the overhang padding re-aligns them). */
  .hero-tabs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 64px 0 0;
  }
  .hero-tabs button {
    appearance: none;
    background: none;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    margin-right: 16px;
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
    white-space: nowrap;
    color: var(--scalar-color-3);
  }
  .hero-tabs button:hover {
    color: var(--scalar-color-1);
  }
  .hero-tabs button.active {
    color: var(--scalar-color-1);
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: var(--scalar-border-color);
    text-underline-offset: 8px;
  }
  /* Non-default scenes stay invisible until the scene switcher takes over,
     so first paint shows only the default scene instead of a stack */
  .hero-visual .scene-hidden {
    display: none !important;
  }
  /* All scene artworks: crisp 6px corners at the product-mock width
     (1100px, matching .product-image img). Direct child only, so nested
     icon svgs inside the cards are unaffected. The important beats the
     svg root's inline width. */
  .hero-visual > svg {
    /* slightly larger frame, melted edges via the blurred-squircle mask */
    width: min(100%, 1200px) !important;
    height: 680px !important;
    margin-inline: auto;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-160%22 y=%22-160%22 width=%221920%22 height=%221320%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2241%22/%3E%3C/filter%3E%3C/defs%3E%3Cpath transform=%22translate(95 95)%22 d=%22M 183 0 L 1227 0 L 1247.38 0.00 L 1265.18 0.04 L 1281.95 0.22 L 1297.94 0.65 L 1313.15 1.52 L 1327.54 3.07 L 1341.00 5.45 L 1353.41 8.86 L 1364.68 13.47 L 1374.67 19.39 L 1383.32 26.68 L 1390.61 35.33 L 1396.53 45.32 L 1401.14 56.59 L 1404.55 69.00 L 1406.93 82.46 L 1408.47 96.85 L 1409.35 112.06 L 1409.78 128.05 L 1409.96 144.82 L 1410.00 162.62 L 1410.00 183.00 L 1410 627 L 1410.00 627.00 L 1410.00 647.38 L 1409.96 665.18 L 1409.78 681.95 L 1409.35 697.94 L 1408.47 713.15 L 1406.93 727.54 L 1404.55 741.00 L 1401.14 753.41 L 1396.53 764.68 L 1390.61 774.67 L 1383.32 783.32 L 1374.67 790.61 L 1364.68 796.53 L 1353.41 801.14 L 1341.00 804.55 L 1327.54 806.93 L 1313.15 808.48 L 1297.94 809.35 L 1281.95 809.78 L 1265.18 809.96 L 1247.38 810.00 L 183 810 L 162.62 810.00 L 144.82 809.96 L 128.05 809.78 L 112.06 809.35 L 96.85 808.48 L 82.46 806.93 L 69.00 804.55 L 56.59 801.14 L 45.32 796.53 L 35.33 790.61 L 26.68 783.32 L 19.39 774.67 L 13.47 764.68 L 8.86 753.41 L 5.45 741.00 L 3.07 727.54 L 1.53 713.15 L 0.65 697.94 L 0.22 681.95 L 0.04 665.18 L 0.00 647.38 L 0.00 627.00 L 0 183 L 0.00 183.00 L 0.00 162.62 L 0.04 144.82 L 0.22 128.05 L 0.65 112.06 L 1.53 96.85 L 3.07 82.46 L 5.45 69.00 L 8.86 56.59 L 13.47 45.32 L 19.39 35.33 L 26.68 26.68 L 35.33 19.39 L 45.32 13.47 L 56.59 8.86 L 69.00 5.45 L 82.46 3.07 L 96.85 1.52 L 112.06 0.65 L 128.05 0.22 L 144.82 0.04 L 162.62 0.00 Z%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1600 1000%22 preserveAspectRatio=%22none%22%3E%3Cdefs%3E%3Cfilter id=%22f%22 x=%22-160%22 y=%22-160%22 width=%221920%22 height=%221320%22 filterUnits=%22userSpaceOnUse%22%3E%3CfeGaussianBlur stdDeviation=%2241%22/%3E%3C/filter%3E%3C/defs%3E%3Cpath transform=%22translate(95 95)%22 d=%22M 183 0 L 1227 0 L 1247.38 0.00 L 1265.18 0.04 L 1281.95 0.22 L 1297.94 0.65 L 1313.15 1.52 L 1327.54 3.07 L 1341.00 5.45 L 1353.41 8.86 L 1364.68 13.47 L 1374.67 19.39 L 1383.32 26.68 L 1390.61 35.33 L 1396.53 45.32 L 1401.14 56.59 L 1404.55 69.00 L 1406.93 82.46 L 1408.47 96.85 L 1409.35 112.06 L 1409.78 128.05 L 1409.96 144.82 L 1410.00 162.62 L 1410.00 183.00 L 1410 627 L 1410.00 627.00 L 1410.00 647.38 L 1409.96 665.18 L 1409.78 681.95 L 1409.35 697.94 L 1408.47 713.15 L 1406.93 727.54 L 1404.55 741.00 L 1401.14 753.41 L 1396.53 764.68 L 1390.61 774.67 L 1383.32 783.32 L 1374.67 790.61 L 1364.68 796.53 L 1353.41 801.14 L 1341.00 804.55 L 1327.54 806.93 L 1313.15 808.48 L 1297.94 809.35 L 1281.95 809.78 L 1265.18 809.96 L 1247.38 810.00 L 183 810 L 162.62 810.00 L 144.82 809.96 L 128.05 809.78 L 112.06 809.35 L 96.85 808.48 L 82.46 806.93 L 69.00 804.55 L 56.59 801.14 L 45.32 796.53 L 35.33 790.61 L 26.68 783.32 L 19.39 774.67 L 13.47 764.68 L 8.86 753.41 L 5.45 741.00 L 3.07 727.54 L 1.53 713.15 L 0.65 697.94 L 0.22 681.95 L 0.04 665.18 L 0.00 647.38 L 0.00 627.00 L 0 183 L 0.00 183.00 L 0.00 162.62 L 0.04 144.82 L 0.22 128.05 L 0.65 112.06 L 1.53 96.85 L 3.07 82.46 L 5.45 69.00 L 8.86 56.59 L 13.47 45.32 L 19.39 35.33 L 26.68 26.68 L 35.33 19.39 L 45.32 13.47 L 56.59 8.86 L 69.00 5.45 L 82.46 3.07 L 96.85 1.52 L 112.06 0.65 L 128.05 0.22 L 144.82 0.04 L 162.62 0.00 Z%22 fill=%22white%22 filter=%22url(%23f)%22/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .slider button {
    margin-right: 16px;
    margin-bottom: 10px;
    color: var(--scalar-color-3);
  }
  .slider button.active {
    color: var(--scalar-oclor-1);
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: var(--scalar-border-color);
    text-underline-offset: 8px;
  }
  .slider button:hover {
    color: var(--scalar-color-1);
  }
  .container {
    width: 900px;
    margin: auto;
    position: relative;
  }
  .founder-quote {
    padding: 80px 160px 260px 160px;
  }
  .founder-quote.founder-quote {
    margin-top: 120px;
  }
  /* product */
  .product {
    display: flex;
    position: relative;
    border-top: var(--scalar-border-width) solid var(--scalar-border-color);
    gap: 44px;
    padding: 80px 0;
  }
  .product > * {
    flex: 1;
  }
  .product-reversed {
    flex-direction: row-reverse;
  }
  .product:last-of-type {
    border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  }
  .product-copy {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 100px 0;
    position: relative;
  }
  .product-image {
    position: relative;
    border-radius: var(--scalar-radius-lg);
    pointer-events: none;
  }
  .product-image-transform {
    position: absolute;
    mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
    left: 0;
  }
  .product-reversed .product-image-transform {
    left: -76px;
  }
  .product-image img {
    all: unset;
    width: 1100px;
    pointer-events: none;
    mask-image: linear-gradient(to right, black 20%, transparent 45%);
  }
  object.product-image-sticker {
    all: unset;
    position: absolute;
    left: -93px;
    bottom: 90px;
    transform: rotate(-7deg);
  }
  object.product-image-sticker-right {
    transform: rotate(7deg);
    left: initial;
    right: -80px;
  }
  .product-copy h2 {
    margin-top: 0;
  }
  .product-actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }
  .product-action {
    display: inline-block;
    width: fit-content;
  }
  .icon-text svg {
    width: 18px;
  }
  .gap-y-2 {
    row-gap: 8px;
  }
  .gap-y-3 {
    row-gap: 12px;
  }
  /* logos */
  .logowall.logowall {
    padding: 24px 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    align-items: center;
    gap: 40px;
    position: sticky;
    bottom: 0;
    z-index: 100;
  }
  .logowall.logowall:before,
  .gradient-blur {
    position: absolute;
    left: 0;
    top: 0;
    --scalar-container-sidebar-gap: calc(
      (
        (100dvw - var(--scalar-container-width) - var(--scalar-sidebar-width)) /
          2
      )
    );
    width: calc(100dvw - var(--scalar-sidebar-width));
    margin-left: min(-1 * var(--scalar-container-sidebar-gap), -50px);
    height: 100%;
  }
  @media screen and (max-width: 1000px) {
    .logowall.logowall:before {
      width: 100dvw;
      margin-left: -24px;
    }
  }
  .logowall.logowall:before {
    content: "";
    background: linear-gradient(transparent,var(--scalar-background-1) 55%);
  }
  .gradient-blur {
    background: color-mix(in srgb, var(--scalar-background-1), transparent);
  }
  .gradient-blur > div,
  .gradient-blur::before,
  .gradient-blur::after {
    position: absolute;
    inset: 0;
  }
  .gradient-blur::before {
    content: "";
    z-index: 1;
    backdrop-filter: blur(0.5px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 1) 12.5%,
      rgba(0, 0, 0, 1) 25%,
      rgba(0, 0, 0, 0) 37.5%
    );
  }
  .gradient-blur > div:nth-of-type(1) {
    z-index: 2;
    backdrop-filter: blur(1px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 12.5%,
      rgba(0, 0, 0, 1) 25%,
      rgba(0, 0, 0, 1) 37.5%,
      rgba(0, 0, 0, 0) 50%
    );
  }
  .gradient-blur > div:nth-of-type(2) {
    z-index: 3;
    backdrop-filter: blur(2px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 25%,
      rgba(0, 0, 0, 1) 37.5%,
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 0) 62.5%
    );
  }
  .gradient-blur > div:nth-of-type(3) {
    z-index: 4;
    backdrop-filter: blur(4px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 37.5%,
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 1) 62.5%,
      rgba(0, 0, 0, 0) 75%
    );
  }
  .gradient-blur > div:nth-of-type(4) {
    z-index: 5;
    backdrop-filter: blur(8px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 1) 62.5%,
      rgba(0, 0, 0, 1) 75%,
      rgba(0, 0, 0, 0) 87.5%
    );
  }
  .gradient-blur > div:nth-of-type(5) {
    z-index: 6;
    backdrop-filter: blur(16px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 62.5%,
      rgba(0, 0, 0, 1) 75%,
      rgba(0, 0, 0, 1) 87.5%,
      rgba(0, 0, 0, 0) 100%
    );
  }
  .gradient-blur > div:nth-of-type(6) {
    z-index: 7;
    backdrop-filter: blur(32px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 75%,
      rgba(0, 0, 0, 1) 87.5%,
      rgba(0, 0, 0, 1) 100%
    );
  }
  .gradient-blur::after {
    content: "";
    z-index: 8;
    backdrop-filter: blur(64px);
    mask: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 87.5%,
      rgba(0, 0, 0, 1) 100%
    );
  }

  .logowall-item {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 10;
  }
  .logowall-item svg {
    width: 100%;
    height: auto;
    max-height: 24px;
  }
  .ign-logo__fill {
    fill: var(--scalar-color-1);
  }
  .fill-current-bg {
    fill: var(--scalar-background-1);
  }
  /* quotes */
  .quotes {
    padding: 120px 0 !important;
  }
  .quotes-container {
    gap: 44px;
    margin-top: 32px;
  }
  .quotes-item {
    flex: 0 0 calc(50% - 22px);
  }
  .quotes-item p {
    margin-bottom: 10px;
  }

  /* new stuff  */
  .expander {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    opacity: 0;
    transition: grid-template-rows 0.25s, opacity 0.25s ease-in-out;
  }
  .expander-content {
    min-height: 0;
    margin-bottom: 12px;
    margin-top: 6px;
    line-height: 1.45;
    font-size: 14px;
  }
  .expander-hover {
    height: 370px;
    position: relative;
  }
  .expander-hover:hover .expander {
    grid-template-rows: 1fr;
    opacity: 1;
    transition: grid-template-rows 0.5s, opacity 0.5s ease-in-out;
  }
  .expander.expanded .expander-content {
    visibility: visible;
  }
  .expander-hover-title {
    font-size: 20px;
    font-weight: var(--scalar-semibold);
    margin-top: 24px;
  }
  .expander-hover-link {
    --font-color: var(--scalar-color-2);
    --font-visited: var(--scalar-color-2);
    color: var(--font-color, var(--scalar-color-1));
    font-weight: var(--scalar-semibold);
    text-underline-offset: 0.25rem;
    text-decoration-thickness: 1px;
    text-decoration: underline;
    text-decoration-color: color-mix(
      in srgb,
      var(--font-color, var(--scalar-color-1)) 30%,
      transparent
    );
    margin-top: 6px;
  }
  .expander-hover:hover .expander-hover-link {
    --font-color: var(--scalar-color-1);
  }
  .expander-hover-preview {
    position: absolute;
    left: -120px;
    top: -220px;
    width: 1100px;
    mask-image: radial-gradient(circle at top left, black 25%, transparent 40%);
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    transform: rotate(1deg) translate3d(-10px, -10px, 0);
    max-height: 500px;
    overflow: hidden;
  }
  .expander-hover .relative {
    z-index: 1;
  }
  .expander-hover:hover .expander-hover-preview {
    opacity: 1;
    transform: rotate(2deg) translate3d(0, 0, 0);
    transition: all 0.3s ease-in-out 0.2s;
  }
  .expander-hover-preview img {
    margin-left: 0;
    mask-image: linear-gradient(black, transparent);
    width: 100%;
  }
  .expander-hover-sticker {
    height: 143px;
    width: 100%;
    display: flex;
    align-items: center;
    position: relative;
    margin-left: -12px;
    transition: transform 0.3s ease-in-out;
    justify-content: flex-start;
  }
  .expander-hover-sticker object {
    pointer-events: none;
  }
  .expander-hover-sticker img {
    max-height: initial;
    margin-left: initial;
  }
  .expander-hover:hover .expander-hover-sticker {
    transform: rotate(-3deg);
  }
  .expander-container {
    display: flex;
    gap: 44px;
  }
  .cta {
    padding: 80px 0;
    margin-top: 0 !important;
  }
  .mb-11 {
    margin-bottom: 44px;
  }
  .light-mode .dark-image {
    display: none;
  }
  .dark-mode .light-image {
    display: none;
  }
  .sticker-clip-client {
    clip-path: path("M158 91.9102C158 95.8908 154.773 99.1172 150.792 99.1172L147.269 99.1172L147.269 105.78C147.268 107.948 145.511 109.705 143.343 109.705L86.2051 109.705C84.0373 109.705 82.2795 107.948 82.2793 105.78L82.2793 99.1172L7.208 99.1172C3.22741 99.1172 1.10673e-05 95.8908 -4.01752e-06 91.9101L-3.50643e-06 80.2178C-3.47119e-06 79.4117 0.135571 78.6109 0.400387 77.8496L25.7949 4.83984C26.8028 1.94219 29.5346 -5.6154e-06 32.6025 -5.4813e-06L150.792 -3.15072e-07C154.773 -1.41078e-07 158 3.22654 158 7.20703L158 91.9102Z")
  }
  .sticker-clip-sdk {
    clip-path: path("M60.0562 8.61129C65.9233 -1.83053 81.0294 -1.61478 86.5955 8.99068L142.416 115.353C144.543 119.406 141.567 124.259 136.991 124.201L114.679 123.918L114.138 135.797C113.962 139.654 110.761 142.678 106.9 142.634L32.9393 141.782C29.1212 141.738 26.0084 138.707 25.864 134.891L25.406 122.787L6.28841 122.544C1.70363 122.486 -1.1476 117.543 1.09835 113.545L60.0562 8.61129Z")
  }
  .sticker-clip-registry {
    clip-path: path("M71.0986 1.13334C75.8537 -0.596969 81.1116 1.85514 82.8428 6.6099L90.3037 27.1079H98.5059C104.199 27.108 108.814 31.7235 108.814 37.4165V77.9663L121.32 112.329C119.703 112.128 118.003 112.298 116.351 112.899C110.96 114.861 108.12 120.659 110.009 125.848C111.898 131.038 117.8 133.654 123.191 131.692C124.844 131.091 126.254 130.127 127.364 128.933L134.608 148.835C136.339 153.591 133.887 158.849 129.132 160.58L73.3945 180.866C68.6393 182.596 63.3816 180.145 61.6504 175.39L58.958 167.994H2.29102C1.02582 167.994 0 166.968 0 165.703V29.398C0.000538247 28.1333 1.02616 27.1079 2.29102 27.1079H9.8125C10.6721 24.5603 12.6383 22.4116 15.3613 21.4204L71.0986 1.13334Z")
  }
  .sticker-clip-docs {
    overflow: hidden;
    border-radius: 20px;
  }

  @media screen and (max-width: 590px) {
    .gallery li {
      padding-left: 0 !important;
      margin-right: 25px;
    }
  }

  @media screen and (max-width: 1000px) {
    .t-doc {
      --scalar-sidebar-width: 0px;
    }
    .hero.hero {
      margin-top: 188px;
    }
    .sticker-1,
    .sticker-2,
    .sticker-3,
    .sticker-4,
    .sticker-5,
    .sticker-6,
    .sticker-7,
    .sticker-8,
    .sticker-9 {
      transform: scale(0.8);
    }
    .sticker-1 {
      top: -140px;
      left: -280px;
    }
    .sticker-2 {
      left: 220px;
      bottom: 80px;
    }
    .sticker-3 {
      left: 90px;
      bottom: 20px;
    }
    .sticker-4 {
      left: 60px;
      bottom: 20px;
      --sticker-rotate: 15deg;
    }
    .sticker-5 {
      top: -220px;
      left: -440px;
    }
    .sticker-6 {
      top: 160px;
      left: -30px;
      --sticker-rotate: -10deg;
    }
    .sticker-7 {
      top: -220px;
      left: -100px;
    }
    .sticker-8 {
      top: 840px;
      left: 260px;
    }
    .sticker-9 {
      bottom: 70px;
      right: 30px;
    }
    .t-editor.page {
      padding-inline: 30px;
    }
    .container-full {
      --scalar-container-sidebar-gap: 30px;
      width: 100dvw;
      padding-inline: 30px;
      margin-inline: -30px;
    }
    .hero-visual {
      width: 100%;
      margin-left: unset;
    }
    .gallery {
      --scalar-gallery-item-offset: 10px;
      margin-top: 14px;
    }

    .gallery li img {
      height: 300px;
     }
    .gallery li {
      max-width: unset;
      max-height: 300px;
      padding-left: 30px;
      margin-right: 30px;
    }
    .logowall.logowall {
      grid-template-columns: repeat(3, 1fr);
      column-gap: 20px;
      row-gap: 40px;
    }
    .logowall-item {
      justify-content: start;
    }
    .logowall-item svg {
      max-width: 100%;
      height: 100%;
      max-height: 20px;
    }
    .quotes-item {
      flex: 0 0 calc(100% - 22px);
    }
    .product,
    .product-reversed {
      flex-direction: column;
      gap: 60px;
    }
    .product > * {
      flex: initial;
    }
    .product-copy {
      padding-block: 0;
    }
    .product-copy .lg-only {
      display: none;
    }
    .product-image {
      height: 500px;
    }
    .product-image-transform.product-image-transform {
      inset: 0;
      mask-image: none;
    }
    .product-image img {
      height: 100%;
      width: auto;
      mask-image: linear-gradient(to right, black 40%, transparent 60%);
    }
    .founder-quote {
      padding: 40px 40px 60px 40px;
      margin-inline: -10px;
    }
    .expander-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      row-gap: 0;
    }
    .expander-hover {
      width: auto;
    }
    .expander-hover .expander {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .expander .expander-content {
      visibility: visible;
    }
  }
</style>
