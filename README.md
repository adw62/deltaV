# ΔV (deltaV) — Procedural Solar System / Colony Sim

A standalone browser game. No build step, no server, no dependencies beyond a CDN Three.js import. Open `index.html` directly.

Found colonies across a procedurally generated solar system, manage money, factions and synthetic labour, and reach a victory before the government, the investors, or your own workforce end you.

## Win / lose conditions

| Outcome | Condition |
|---|---|
| **Industrial Titan** (win) | ₡12,000 credits |
| **Master of the System** (win) | 3+ colonies and 90+ total settlers |
| **Synthesis** (win) | Synth co-government recognised with miner↔synth alliance ≥ 60% |
| **Bankruptcy** (lose) | Funds fall to −₡400 |
| **Charter Revoked** (lose) | Government sanctions reach 5 (unless gov is your puppet) |
| **Hostile Takeover** (lose) | Investors fully divested *and* hostile for 12 consecutive ticks |

Progress is tracked in the **Directives** widget (top right), which doubles as a getting-started tutorial for new games. Endgame shows a procedural epilogue assembled from the final state of every colony.

## Colony site strategy (`COLONY_TRAITS` in `index.html`)

Planet type matters when choosing where to colonize — an **Orbital Survey** block appears in the panel once a rocket is in orbit:

| Type | Yield | Notes |
|---|---|---|
| Volcanic | ×1.50 | 2.2× mining accidents, meltdown risk |
| Toxic | ×1.35 | 2.2× disease, alien bacteria likely |
| Desert | ×1.20 | More resource veins, 2× ruins chance |
| Obsidian | ×1.15 | 2.5× ancient ruins chance |
| Rocky | ×1.00 | Baseline |
| Frozen | ×0.95 | Low disease, preserved ruins |
| Continental / Ocean | ×0.85 / ×0.80 | Population grows ~2× faster |
| Gas giants | — | Cannot be colonized |

Colony income also scales with a drifting **ore market** (±~40%, shown in the topbar).

---

## File structure

| File | Role |
|---|---|
| `index.html` | Everything — Three.js scene, orbital mechanics, all UI, all gameplay logic (~3600 lines) |
| `narrative.js` | Game-agnostic faction simulation engine (World, Faction, NEvent, Action, TransferConfig). **Do not modify** — treat as a library. |
| `colony_data.js` | Colony-specific data wired to narrative.js: factions, event effects, event flavors, faction actions, transfer levels |
| `GAMEPLAY_PLAN.md` | Original design doc listing all planned features with implementation priority order |

---

## What is built

### Orbital layer (`index.html`)

- **Procedural solar system** — seeded RNG, 10 planet types with canvas-generated textures, moons, rings, asteroid belt, corona particles
- **Rocket mechanics** — rockets orbit planets on elliptical Keplerian orbits with osculating element display; transfer window calculation (phase angle); "Skip to Window" button snaps planets to alignment
- **Mission queue** — player queues N rockets to a target; they auto-launch at the next transfer window
- **Flight FX** — departure burn (multi-layer cone plume + world-space exhaust particles), coast phase, arrival retro-burn (rocket flips anti-prograde, fires identical plume, particles trail prograde)
- **Transfer window flash** — when a window is < 60 sim-seconds away (or open), sim slows to 10× and a pulsing banner fires; works for both queued missions and direct transfers, before and after colony
- **Sim speed controls** — 0.1× to 100×; window detection is frame-accurate (runs every frame, not throttled)

### Colony layer (`index.html` + `colony_data.js`)

- **Colony designation** — click any non-home planet to establish; creates a fresh `colonyWorld` at tick 0 with `_simTimeAccum` reset (no pre-colony faction history)
- **Narrative tick** — `TICK_INTERVAL = 30` sim-seconds per tick; `colonyWorld.step()` called once per tick; `_stepWorld()` wrapper emits faction-shift NEWS entries whenever a faction changes disposition
- **Funds** — displayed in HUD; +20 credits/tick (modified by `production_bonus`); costs paid by player actions and structures; fines levied by government faction
- **Structures** (`STRUCTURES` array, 8 entries) — Mining Rig, Transport Hub, Comms Array (free/instant), Life Support, Medical Bay, Synth Workshop, Nuclear Plant, Ruins Research Station; each has `cost`, `buildTime` in ticks, and adds its key to `world.attrs.structures`; `ruinsOnly: true` items only appear if `ancient_ruins_present`
- **Transfer tech research** (`COMMS_UPGRADES`) — 4 levels: Reserve Burns → Ion Drives → Alien Propulsion (requires ruins) → Quantum Relay (instant); each upgrades `colonyWorld.transfer` and changes narrative transit time; at level 0 the Hohmann window UI is live; at level 4 windows are eliminated
- **Factions** (defined in `colony_data.js`) — Government (supportive→watchful→suspicious→hostile), Investors (bullish→neutral→skeptical→hostile), Miners Union (content→restless→striking→revolutionary), Synths (dormant→aware→organized→free); Synths are hidden until first deployment
- **Random events** — 27 events in `RANDOM_EVENTS` array in `index.html`; each has `type`, `weight`, `minTick` (colony-relative), optional `cooldown`, `maxFires`, `needs` preconditions, and optional `onFire(world)` callback for conditional effects
- **`needs` precondition system** — `{ colony, structure, attr, minFires }` — checked in `_checkNeeds()`; `minTick` is measured from `_colonyEstablishedTick` for colony-gated events, from world start for system events
- **Player actions** (`PLAYER_ACTIONS` array, 14 entries) — workforce management, relations, synth policy; each has `cost`, `cd` (cooldown in ticks), `prereq` (optional structure id), and dispatches an NEvent through the transfer system
- **Visual hooks** — `_syncColonyVisuals()` checks `world.attrs` each tick: `kessler_active` adds orange debris torus rings, `planet_irradiated` adds red additive overlay + darkens mesh, `ancient_ruins_present` adds a gold surface marker + halo ring
- **Log panel** — 3 tabs (News / Factions / Comms); `recentNarrative(120)`; does not auto-scroll if user has scrolled up; synth entries suppressed until `synths_ever_deployed`
- **Mission events** — `mission_success` pushed on colony establishment and rocket capture; `rocket_explosion` on 8% capture failure

---

## Polish layer (all in `index.html`)

- **Win/lose system** — `_checkEndConditions()` runs each tick; `_showEndgame()` renders the overlay; `_buildEpilogue()` assembles per-colony epilogue lines from world attrs
- **Event toasts** — `_emitToastsFor()` scans new narrative entries each tick; severity sets `_TOAST_GOOD/_TOAST_WARN/_TOAST_DANGER`; faction shift entries colored by target disposition; synth news suppressed pre-reveal (same rule as the log)
- **Procedural audio** — `AudioSys` (WebAudio, no assets): ambient drone, UI clicks, launch rumble (filtered noise sweep), explosions, window-open alarm, toast pings, victory/defeat stings; `M` or 🔊 toggles mute; starts on first pointer interaction (autoplay policy)
- **Visuals** — nebula sprite backdrop, additive star-glow sprite, settlement city-lights that grow with colony population (`_updateSettlementVisuals`), explosion debris sparks via the shared particle pool, funds pulse animation
- **Objectives widget** — `_updateObjectives()`; tutorial checklist until first colony tech-up, then directives mode with win progress bars and lose-condition warnings
- **Ore market** — `homeWorld.attrs.ore_market`, two overlapping sine cycles, clamped 0.6–1.5, multiplies corporate colony income
- **Keyboard** — Space pause · +/− speed · L log · F factions · M mute

---

## Key state variables (`index.html`)

| Variable | Purpose |
|---|---|
| `colonyPlanet` | The designated colony planet object; `null` until established |
| `colonyWorld` | `World` instance from narrative.js; `null` until establish; created fresh at tick 0 |
| `_simTimeAccum` | Accumulates `dt` (sim-seconds) until `TICK_INTERVAL` is reached; reset to 0 on establish |
| `_nextRandomEventTick` | Next tick at which a random event may fire; starts at 5 post-establishment |
| `simSpeed` / `simSpeedIdx` | Current playback speed; `SIM_SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 50, 100]` |
| `_windowSavedSpeedIdx` | Speed saved before window slowdown; ref-counted via `_openWindowCount` |
| `_orbitWindowWasOpen` | Tracks orbital alignment state to detect open/close transitions |
| `_missionWindowWasOpen` | Same for queued missions in `checkScheduledMissions()` |
| `_logTab` | Active log tab: `'news'` / `'factions'` / `'comms'` |
| `_flightStates` | Array of in-flight rocket objects (phase: `'flying'` or `'capturing'`) |
| `scheduledMissions` | Queue of `{ id, from, to, remaining, total, status }` objects |

---

## Key functions (`index.html`)

| Function | What it does |
|---|---|
| `generateSystem(seed, n)` | Rebuilds the Three.js scene; resets all state; does NOT create colonyWorld |
| `_stepWorld()` | Calls `colonyWorld.step()` and emits `shift:*` NEWS entries on disposition changes |
| `tickRandomEvents()` | Fires one random event per interval; uses colony-relative tick for gated events |
| `_checkNeeds(event, world)` | Returns false if any `needs` precondition is unmet |
| `updateTransferAlignment()` | Runs every frame when transfer is active; detects approach (60 sim-s lead) and calls `_onWindowOpen/Close` |
| `checkScheduledMissions()` | Runs every frame; checks approach + auto-launches at alignment; calls `_onWindowOpen/Close` |
| `_onWindowOpen()` / `_onWindowClose()` | Ref-counted; saves/restores speed and shows/hides `#launch-flash` banner |
| `_tickRocketFX(rawDt)` | Updates particle pool; controls plume visibility/scale; emits exhaust during departure and arrival burns |
| `_syncColonyVisuals()` | Applies Kessler rings, irradiation overlay, ruins marker based on world attrs |
| `buildStructure(s)` | Deducts funds, starts construction timer or activates immediately |
| `executeTransfer()` | Direct single-rocket launch from orbit panel |
| `launchScheduledRocket(mission, idx)` | Mission-queue launch; staggered by 5% of transfer time per rocket |

---

## Architecture notes

- `narrative.js` is the game-agnostic simulation engine. It has no knowledge of colonies, rockets, or UI. Game logic belongs in `colony_data.js` (data) and `index.html` (wiring). Modify it only to fix engine-level behaviour — not to add game-specific logic.
- `colony_data.js` exports four things used by `index.html`: `TRANSFER_LEVELS`, `makeFactions()`, `EVENT_EFFECTS`, `EVENT_FLAVORS`, `makeActions()`, `makeColonyWorld()`.
- All gameplay constants (`TICK_INTERVAL`, `STRUCTURES`, `COMMS_UPGRADES`, `PLAYER_ACTIONS`, `RANDOM_EVENTS`, `ORBIT_WINDOW_LEAD`) live in `index.html`.
- Random events use a declarative `needs` object. Add new precondition types by extending `_checkNeeds()` — the rest of `tickRandomEvents()` does not need to change.
- The `onFire(world)` callback on a random event is for side-effects that are conditional (e.g. solar flare only escalates if miners are already restless). Pure faction effects belong in `EVENT_EFFECTS` in `colony_data.js`.
- Particle FX (`_pmesh`) is added to `scene` directly, not `systemGroup`, so it survives `generateSystem()` calls.
- `rawDt` (real clock delta, not scaled by simSpeed) is used for particle physics so effects look correct at any playback speed.

---

## Controls

| Control | Action |
|---|---|
| Drag / Scroll | Orbit camera / zoom |
| Click planet (scene or sidebar) | Focus camera; HOME/SAT/COL planets open their panel |
| **System ▾** | Worldgen & display options (seed, planet count, generate, orbits, asteroids, control overlay) |
| **− / + / ⏸** (or `-` `+` Space) | Sim speed and pause; the speed label turns amber while auto-slowed for a window |
| **News / Factions / Directives** (or `L` `F`) | Toggle the log, faction, and objectives panels |
| `M` / 🔊 | Mute |

## Transfer UX

Manual transfers can't be missed: selecting a destination shows the next launch window; **Auto-launch when window opens** arms the rocket to fire itself at alignment (even at 100×), **Skip to Window** jumps time, and an unarmed open window automatically drops the sim to 1× (restoring the previous speed when it closes — manual speed changes during a window cancel the auto-restore). Queued missions on the home planet always auto-launch at their windows. The sim only slows for windows that matter: an open manual-transfer plan or a waiting mission — narrative comms windows never interrupt (dispatches auto-queue). Every in-flight rocket keeps its cyan trajectory line visible for the whole transfer (removed on arrival). The manual orbital-element editor (sliders, Δv budget, burns, SOI capture) was removed — transfers are fully automatic from destination selection. Colony **Actions** are grouped (Workforce / Relations / Synthetics / Security) and situational actions stay hidden until their trigger state exists.

### Propulsion tech and launch windows (`TRANSFER_PROFILES`)

Researching propulsion frees the orbital layer from Hohmann windows, not just the narrative one:

| Level | Launch | Off-window cost | Transit time |
|---|---|---|---|
| 0 Hohmann | window only | — | ×1.0 |
| 1 Reserve Burns | **anytime** | ×1.75 | ×0.9 |
| 2 Ion Drives | anytime | ×1.4 | ×0.65 |
| 3 Alien Propulsion | anytime | ×1.15 | ×0.45 |
| 4 Quantum Relay | anytime | none | ×0.25 |

At level ≥ 1: Launch Now is always enabled (the window row shows "optimal in ~Xs" — launching at the optimal moment still pays base cost, and arming auto-launch waits for it), queued missions **depart immediately**, no window banners or sim slowdowns fire, and flights follow `buildPoweredArc` — a prograde arc swept to the target's *predicted* position at arrival (also used for army launches at every level, fixing the old misaligned-endpoint visual).

## Orbital Bombardment

Orbital weapons are directly fireable: the **Orbital Bombardment** action (Security category, ₡250, 30-tick cooldown) requires a completed weapon stationed at the colony. It kills 4–7 workers, has a 30% chance of levelling a non-core structure, and breaks an active militia 65% of the time (suppressing the miners); the `orbital_strike_miners` event enrages the government (+0.7 hostile) and radicalises survivors on a miss. Visuals: beam lance from the weapon plus the staged nuke flash.

## Event & world visuals (`_fxList` system in `index.html`)

Real-time visual effects driven by narrative events via the `_EVENT_FX` dispatcher (effects run on real clock time, so they look right at any sim speed):

- **Solar flare** — plasma jet erupts from the star with a glow pulse
- **Meteor strike** — rock streaks in with a glowing trail and impacts the colony
- **Comet flyby** — sun-grazing comet crosses the system, tail always anti-sunward
- **Aurora storm** — shimmering polar rings on the colony planet
- **Nuclear meltdown / mass casualties** — staged white flash, orange shell, lingering surface fire
- **Orbital strike** — stationed orbital weapons visibly fire a beam at the surface when supporting Crush Miners / Synth Hard Reset (weapons track their target planet)
- Sabotage, terror attacks and mining accidents flash explosions on the surface

World-generation upgrades: drifting cloud decks on continental/ocean/toxic worlds, drifting band overlays + fast rotation on (oblate) gas giants, banded canvas-textured planetary rings with Cassini gaps, flickering lava emissive, rotating Kessler debris and asteroid belt, and proper multi-part station/weapon models (hub-and-ring station with solar wings; rail-cannon weapon that aims at the planet).

The sun is a layered system: a **seamless equirectangular FBM plasma texture** (`makeStarSurfaceTex` — convection structure, fine granulation, sunspots with penumbra; the old radial-disk texture bunched at one UV point and left black gaps), a counter-rotating additive churn layer on a tilted axis, a pulsing glow sprite, a subtly flickering point light, and corona particles. **Ambient prominences** (`_fxProminence`, every 4–12 s): a cubic-bezier magnetic loop anchored at two surface footpoints with plasma particles flowing along the field line in the star's own palette, plus a faint filament line so it reads at a distance — the radial jet (`_fxSolarFlare`) is reserved for actual solar-flare events. Effects are sized relative to the star/planet radius so they read correctly at gameplay zoom.

Gas giants: both catalog entries use the band+storm `_makeGasTex`, with a translucent banded shimmer layer (`_makeGasOverlayTex`) rotating at a different rate for visible churn, and fast oblate rotation.

Rockets are multi-part (accent band, tapered upper stage, swept fins, open engine bell) with a pulsing nav beacon and flickering idle engine glow — shared materials mean in-flight clones pulse too.

---

## Tech

- **Three.js r0.160.0** via CDN importmap — no bundler
- All planet textures generated at runtime on `<canvas>` elements
- Single HTML file — `index.html` is the entire game except data files
