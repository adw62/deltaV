# deltaV — Procedural Solar System Generator

A standalone browser toy that generates unique solar systems from a seed. No build step, no dependencies beyond a CDN import — just open `index.html`.

## Usage

Open `index.html` in any modern browser (Chrome, Firefox, Safari).

| Control | Action |
|---|---|
| Drag | Orbit camera |
| Scroll | Zoom |
| Click planet (sidebar) | Warp to planet and lock camera |
| Click again / click Star | Unlock camera |
| **Generate** | Rebuild system from current seed |
| **Random Seed** | Pick a random seed and generate |
| **Orbits** | Toggle orbital path rings |
| **Asteroid Belt** | Toggle mid-system asteroid field |
| **Corona** | Toggle solar particle effect |

## How it works

### Seeded RNG
All generation uses a Mulberry32 PRNG keyed to the seed input, so the same seed always produces the same system.

### Star
Randomly one of four spectral types (G/B/M/F), each with a distinct colour palette. The star uses a `decay:0` point light so planets at any distance receive consistent illumination.

### Planet placement
Planets are placed from inner to outer orbit with randomised gaps. Each planet's type is sampled from a weighted catalog where probabilities shift with orbital position `t ∈ [0,1]`:

- **Inner** (t≈0): lava, desert, rocky, obsidian dominate
- **Middle** (t≈0.5): continental and ocean worlds peak here
- **Outer** (t≈1): gas giants, storm giants, frozen worlds dominate

### Planet types

| Type | Notes |
|---|---|
| Gas Giant | HSL-banded canvas texture, polar shimmer |
| Storm Giant | Pixel-row sine bands, storm ovals with bright eyes |
| Rocky | FBM heightmap, red/grey hue bias, Sobel normal map |
| Obsidian | Dark FBM, high-contrast normals |
| Continental | FBM with ~40% land cover, water/beach/highland biomes |
| Ocean World | Same FBM remapped so ~85% stays below sea level — only island chains emerge |
| Desert | Three-band gradient, wind-scoured ridgelines from secondary noise |
| Volcanic | Lava-pool → cooling crust → basalt; emissive map on low-height pixels |
| Toxic | Dark sludge → sickly yellow-green; crystalline mineral highlights |
| Frozen | High-shininess ice, warm bloom on secondary noise peaks |

All rocky types share a seamless cylinder-wrap trick for the FBM so the texture tiles without a visible seam on the sphere.

### Rings & moons
Gas giants have a high ring chance; inner rocky planets have none (ring chance scales linearly with `zoneT`). Rings are either a flat `RingGeometry` or a *doomed moon* — a small moon being tidally disrupted into a particle stream of 3000 points that smoothstep-interpolate from the moon's position to target ring positions and recycle continuously.

### Atmosphere
Continental, ocean, frozen, toxic, and ocean worlds get a backside `AdditiveBlending` glow sphere tinted to their atmosphere colour.

### Asteroid belt
Toggled off by default. Placed between the planets at index 45% through the list.

### Corona
1800 additive-blended particles spawned at the star surface, drifting outward and recycling when they pass 3.8× the star radius.

## Tech

- **Three.js r0.160.0** via CDN importmap (no bundler needed)
- All textures generated at runtime on `<canvas>` elements
- Single file — `index.html` is the entire project
