# deltaV — Procedural Solar System / Colony Sim

A standalone browser game. No build step, no server, no dependencies beyond a CDN Three.js import. Open `index.html` directly.

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

## What is NOT yet built (from `GAMEPLAY_PLAN.md`)

- **§13 Win/lose conditions** — investor collapse, miner independence declaration, government charter revocation; the factions reach hostile/revolutionary states but nothing happens yet
- **Terror attack targeting** — `miner_terror_attack` and `sabotage` events exist in `colony_data.js` faction actions but no structure-destruction logic is wired in `index.html`; nuclear plant is flagged as a terror target in its description but not in code
- **Population counter** — `GAMEPLAY_PLAN.md §5` describes slow population growth tied to life support; referenced in faction preconditions in `colony_data.js` but not implemented
- **Synth count display** — synths are deployed via player action but the count is not tracked or shown
- **Rocket explosion visual** — `_spawnExplosionFlash` fires but there is no debris field or persistent damage marker

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
| Drag | Orbit camera |
| Scroll | Zoom |
| Click planet (sidebar) | Warp and lock camera |
| Click again / click star | Unlock |
| **Generate** | Rebuild system from seed |
| **Random Seed** | New random seed and rebuild |
| **Orbits** | Toggle orbit rings |
| **Asteroid Belt** | Toggle asteroid field |
| **Corona** | Toggle solar particle effect |
| **◀◀ / ▶▶** | Slower / faster sim speed |
| **Log** | Open narrative log panel |
| Click colony planet | Open colony management panel |

---

## Tech

- **Three.js r0.160.0** via CDN importmap — no bundler
- All planet textures generated at runtime on `<canvas>` elements
- Single HTML file — `index.html` is the entire game except data files
