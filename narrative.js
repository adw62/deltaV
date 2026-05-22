// narrative.js — Faction Simulation Engine
// Port of faction_system.py. Game-agnostic: wire your own factions, events, and actions on top.

class NarrativeEntry {
  constructor(tick, speaker, message, source) {
    this.tick    = tick;
    this.speaker = speaker;
    this.message = message;
    this.source  = source;
  }
}

class TransferConfig {
  constructor({ mode = 'window_only', travel_time = 8, window_interval = 10, window_duration = 2 } = {}) {
    this.mode            = mode;
    this.travel_time     = travel_time;
    this.window_interval = window_interval;
    this.window_duration = window_duration;
  }
}

// NEvent — avoids collision with browser's built-in Event
class NEvent {
  constructor(type, { source = null, target = null, magnitude = 1.0, tick = 0, flavor = '', data = {} } = {}) {
    this.type      = type;
    this.source    = source;
    this.target    = target;
    this.magnitude = magnitude;
    this.tick      = tick;
    this.flavor    = flavor;
    this.data      = data;
  }
  toString() {
    const p = [this.type];
    if (this.source)           p.push(`from=${this.source}`);
    if (this.target)           p.push(`to=${this.target}`);
    if (this.magnitude !== 1.0) p.push(`x${this.magnitude.toFixed(1)}`);
    return `[${p.join(' ')}]`;
  }
}

class Action {
  constructor({ name, faction_id, disposition, weight = 1.0, cooldown = 0, preconditions = [], effects = [], flavor = '' }) {
    this.name         = name;
    this.faction_id   = faction_id;
    this.disposition  = disposition;
    this.weight       = weight;
    this.cooldown     = cooldown;
    this.preconditions = preconditions;
    this.effects      = effects;
    this.flavor       = flavor;
  }
}

class Faction {
  constructor({ id, name, dispositions, attrs = {}, cooldowns = {} }) {
    this.id           = id;
    this.name         = name;
    this.dispositions = dispositions;
    this.scores       = {};
    for (const d of dispositions) this.scores[d] = 0.0;
    this.scores[dispositions[0]] = 0.3;  // start leaning toward default state
    this.attrs        = { ...attrs };
    this.cooldowns    = { ...cooldowns };
    this.current_message    = '';
    this._last_disposition  = '';
  }

  get disposition() {
    let best = this.dispositions[0], bestScore = -Infinity;
    for (const d of this.dispositions) {
      if (this.scores[d] > bestScore) { bestScore = this.scores[d]; best = d; }
    }
    return best;
  }

  shift(disposition, delta) {
    if (disposition in this.scores)
      this.scores[disposition] = Math.max(0, Math.min(1, this.scores[disposition] + delta));
  }

  decay(rate = 0.02) {
    for (const d of this.dispositions)
      if (this.scores[d] > 0.01)
        this.scores[d] = Math.max(0, this.scores[d] * (1 - rate));
  }
}

function _weightedChoice(candidates) {
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of candidates) { r -= c.weight; if (r <= 0) return c; }
  return candidates[candidates.length - 1];
}

class World {
  constructor({ factions, event_effects, actions, event_flavors = {}, transfer = null, attrs = {} }) {
    this.factions      = {};
    for (const f of factions) this.factions[f.id] = f;
    this.event_effects = event_effects;
    this.event_flavors = event_flavors;
    this._actionsByFaction = {};
    for (const f of factions) this._actionsByFaction[f.id] = [];
    for (const a of actions)  this._actionsByFaction[a.faction_id].push(a);
    this.tick      = 0;
    this.queue     = [];
    this.narrative = [];
    this.attrs     = { ...attrs };
    this.transfer  = transfer || new TransferConfig();
    this._pending  = [];   // [{ arrival_tick, event }]
    this._nextWindow = this.transfer.window_interval;
  }

  // ── Player dispatch ─────────────────────────────────────────────────────────

  dispatch(...events) {
    if (this.transfer.mode === 'instant') {
      for (const e of events) { e.source = e.source || 'player'; this.queue.push(e); }
      return true;
    }
    let allImmediate = true;
    for (const e of events) {
      e.source = e.source || 'player';
      if (this.transfer.mode === 'window_only' && !this._windowIsOpen()) {
        const departure = this._nextWindow;
        const arrival   = departure + this.transfer.travel_time;
        allImmediate = false;
        this._record('COMMS',
          `[QUEUED] ${e.type} — no window open. Departs tick ${departure}, arrives tick ${arrival}.`,
          'dispatch_queued');
        this._pending.push({ arrival_tick: arrival, event: e });
      } else {
        const arrival = this.tick + this.transfer.travel_time;
        this._record('COMMS',
          `[DISPATCHED] ${e.type} — in transit. Arrives tick ${arrival}.`,
          'dispatch_sent');
        this._pending.push({ arrival_tick: arrival, event: e });
      }
    }
    return allImmediate;
  }

  upgradeTransfer(config) {
    const reduction = this.transfer.travel_time - config.travel_time;
    if (reduction > 0)
      this._pending = this._pending.map(({ arrival_tick, event }) =>
        ({ arrival_tick: Math.max(this.tick + 1, arrival_tick - reduction), event }));
    this.transfer = config;
  }

  push(...events) {
    for (const e of events) { e.tick = this.tick; this.queue.push(e); }
  }

  // ── Tick ────────────────────────────────────────────────────────────────────

  step() {
    this.tick++;

    if (this.transfer.mode === 'window_only') {
      if (this.tick === this._nextWindow) {
        this._record('COMMS',
          `Transfer window OPEN — optimal trajectory until tick ${this._nextWindow + this.transfer.window_duration}. Transit: ${this.transfer.travel_time} ticks.`,
          'transfer_window_opens');
      } else if (this.tick === this._nextWindow + this.transfer.window_duration) {
        this._record('COMMS',
          `Transfer window CLOSED. Next: tick ${this._nextWindow + this.transfer.window_interval}.`,
          'transfer_window_closes');
        this._nextWindow += this.transfer.window_interval;
      }
    }

    // Release in-transit events
    const arriving = this._pending.filter(p => p.arrival_tick <= this.tick);
    this._pending  = this._pending.filter(p => p.arrival_tick  > this.tick);
    for (const { event } of arriving) {
      this._record('COMMS', `[ARRIVED] ${event.type} — transit complete.`, 'dispatch_arrived');
      this.queue.push(event);
    }

    // Process queued events
    const events = this.queue.splice(0);
    for (const event of events) this._applyEvent(event);

    // Factions act and decay
    for (const faction of Object.values(this.factions)) {
      faction.decay();
      const newEvents = this._factionAct(faction);
      const current = faction.disposition;
      if (current !== faction._last_disposition) {
        faction._last_disposition = current;
        if (faction.current_message)
          this._record(faction.name, faction.current_message, `disposition:${current}`);
      }
      this.push(...newEvents);
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  _windowIsOpen() {
    return this._nextWindow <= this.tick && this.tick < this._nextWindow + this.transfer.window_duration;
  }

  _applyEvent(event) {
    const effects = this.event_effects[event.type] || {};
    const targets = (event.target && this.factions[event.target])
      ? [this.factions[event.target]]
      : Object.values(this.factions);
    for (const faction of targets) {
      for (const [disp, delta] of Object.entries(effects[faction.id] || {}))
        faction.shift(disp, delta * event.magnitude);
    }
    const msg = event.flavor || this.event_flavors[event.type] || event.toString();
    if (msg) this._record('NEWS', msg, event.type);
  }

  _factionAct(faction) {
    const current    = faction.disposition;
    const candidates = (this._actionsByFaction[faction.id] || []).filter(a =>
      a.disposition === current &&
      (faction.cooldowns[a.name] || 0) <= this.tick &&
      a.preconditions.every(p => p(this, faction))
    );
    if (!candidates.length) return [];

    const action = _weightedChoice(candidates);
    faction.cooldowns[action.name] = this.tick + action.cooldown;
    if (action.flavor) faction.current_message = action.flavor;

    const newEvents = [];
    for (const fn of action.effects) {
      const result = fn(this, faction);
      if (result) {
        if (Array.isArray(result)) newEvents.push(...result);
        else newEvents.push(result);
      }
    }
    return newEvents;
  }

  _record(speaker, message, source) {
    this.narrative.push(new NarrativeEntry(this.tick, speaker, message, source));
  }

  recentNarrative(n = 20) { return this.narrative.slice(-n); }

  windowStatus() {
    if (this.transfer.mode === 'instant') return { open: true, label: 'Instant relay' };
    if (this.transfer.mode === 'anytime') return { open: true, label: `Anytime — ${this.transfer.travel_time} ticks transit` };
    const open = this._windowIsOpen();
    const ticksToNext = open
      ? (this._nextWindow + this.transfer.window_duration) - this.tick
      : this._nextWindow - this.tick;
    return { open, label: open ? `Window open — closes in ${ticksToNext} tick(s)` : `Window closed — opens in ${ticksToNext} tick(s)` };
  }
}
