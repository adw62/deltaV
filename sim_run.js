'use strict';
const fs = require('fs');

globalThis.window = globalThis;
globalThis.THREE  = {};

eval(fs.readFileSync('./narrative.js', 'utf8') +
  '\nglobalThis.NarrativeEntry=NarrativeEntry;' +
  '\nglobalThis.TransferConfig=TransferConfig;' +
  '\nglobalThis.NEvent=NEvent;' +
  '\nglobalThis.Action=Action;' +
  '\nglobalThis.Faction=Faction;' +
  '\nglobalThis.World=World;'
);
eval(fs.readFileSync('./colony_data.js', 'utf8') +
  '\nglobalThis.EVENT_EFFECTS=EVENT_EFFECTS;' +
  '\nglobalThis.EVENT_FLAVORS=EVENT_FLAVORS;' +
  '\nglobalThis.TRANSFER_LEVELS=TRANSFER_LEVELS;' +
  '\nglobalThis.makeHomeWorld=makeHomeWorld;' +
  '\nglobalThis.makeColonyWorld=makeColonyWorld;'
);

// ── RANDOM_EVENTS (mirrored from index.html) ─────────────────────────────────
const RANDOM_EVENTS = [
  { type: 'solar_flare',              negative: true,  needs: { colony: true }, weight: 2,   minTick: 5,  cooldown: 18,
    onFire: w => {
      const d = w.factions['miners']?.disposition;
      if (d === 'restless' || d === 'striking' || d === 'revolutionary')
        w.push(new NEvent('solar_flare_unrest', { source: 'world', flavor: '' }));
    }},
  { type: 'mining_accident',          negative: true,  needs: { colony: true, structure: 'mining_rig' },      weight: 3,   minTick: 5,  cooldown: 12,
    onFire: w => { w.attrs.miner_pop = Math.max(5, (w.attrs.miner_pop ?? 20) - 1); }},
  { type: 'resource_vein_discovered',                  needs: { colony: true, structure: 'mining_rig' },      weight: 2,   minTick: 8,  cooldown: 35, maxFires: 3 },
  { type: 'resource_vein_depleted',   negative: true,  needs: { colony: true, structure: 'mining_rig' },      weight: 2,   minTick: 18, cooldown: 25 },
  { type: 'disease_outbreak',         negative: true,  needs: { colony: true, structure: 'life_support' },    weight: 2,   minTick: 10, cooldown: 22,
    onFire: w => { w.attrs.miner_pop = Math.max(5, (w.attrs.miner_pop ?? 20) - 2); }},
  { type: 'disease_contained',                         needs: { colony: true, structure: 'life_support', minFires: 'disease_outbreak' }, weight: 1.5, minTick: 5, cooldown: 18 },
  { type: 'government_policy_favorable',               needs: { colony: true }, weight: 2,   minTick: 8,  cooldown: 20 },
  { type: 'government_policy_hostile', negative: true, needs: { colony: true }, weight: 2,   minTick: 8,  cooldown: 20 },
  { type: 'media_expose',             negative: true,  needs: { colony: true }, weight: 1.5, minTick: 12, cooldown: 25 },
  { type: 'whistleblower_defects',    negative: true,  needs: { colony: true }, weight: 1,   minTick: 18, cooldown: 40 },
  { type: 'first_human_child_born',                    needs: { colony: true, structure: 'life_support' },    weight: 2,   minTick: 22, maxFires: 1,
    onFire: w => { w.attrs.has_colony_children = true; }},
  { type: 'miner_community_forms',                     needs: { colony: true, structure: 'mining_rig' },      weight: 2,   minTick: 18, maxFires: 1,
    onFire: w => { w.attrs.has_miner_community = true; }},
  { type: 'miner_synth_relationship',                  needs: { colony: true, attr: 'synths_ever_deployed' }, weight: 1,   minTick: 28, maxFires: 1 },
  { type: 'weapons_cache_miners',     negative: true,  needs: { colony: true, structure: 'mining_rig' },      weight: 1,   minTick: 15, cooldown: 35 },
  { type: 'weapons_cache_synths',     negative: true,  needs: { colony: true, attr: 'synths_ever_deployed' }, weight: 1,   minTick: 20, cooldown: 35 },
  { type: 'synth_child_born',                          needs: { colony: true, attr: 'synths_ever_deployed' }, weight: 1,   minTick: 35, maxFires: 1,
    onFire: w => { w.attrs.has_colony_children = true; }},
  { type: 'human_synth_hybrid_born',                   needs: { colony: true, attr: 'synths_ever_deployed', minFires: 'miner_synth_relationship' }, weight: 0.8, minTick: 40, maxFires: 1 },
  { type: 'alien_bacteria_discovered',                 needs: { colony: true }, weight: 0.5, minTick: 40, maxFires: 1,
    onFire: w => { w.attrs.alien_life_present = true; }},
  { type: 'alien_contamination',      negative: true,  needs: { colony: true, attr: 'alien_life_present' },   weight: 2,   minTick: 5,  cooldown: 28 },
  { type: 'ancient_civilization_discovered',           needs: { colony: true }, weight: 0.4, minTick: 50, maxFires: 1,
    onFire: w => { w.attrs.ancient_ruins_present = true; }},
  { type: 'ancient_tech_recovered',                    needs: { colony: true, attr: 'ancient_ruins_present', structure: 'ruins_station' }, weight: 2, minTick: 5, cooldown: 22 },
  { type: 'alien_warning_decoded',                     needs: { colony: true, attr: 'ancient_ruins_present' }, weight: 1,  minTick: 8,  cooldown: 32 },
  { type: 'remnants_show_synthetic_beings',            needs: { colony: true, attr: 'ancient_ruins_present' }, weight: 1,  minTick: 10, maxFires: 1 },
  { type: 'nuclear_meltdown',         negative: true,  needs: { colony: true, structure: 'nuclear_plant' },   weight: 0.4, minTick: 25, cooldown: 60,
    onFire: w => { w.attrs.planet_irradiated = true; delete w.attrs.structures.nuclear_plant; }},
  { type: 'kessler_syndrome',         negative: true,  needs: { colony: true },                               weight: 0.1, minTick: 60, maxFires: 1,
    onFire: w => { w.attrs.kessler_active = true; w.attrs.miner_pop = Math.max(5, (w.attrs.miner_pop ?? 20) - 5); }},
];

const PLAYER_ACTIONS = [
  { type: 'increase_work_hours',          cost: 0,   cd: 5  },
  { type: 'decrease_work_hours',          cost: 0,   cd: 5  },
  { type: 'amenity_added',                cost: 200, cd: 10 },
  { type: 'miner_pay_increase',           cost: 150, cd: 8  },
  { type: 'benefits_cut',                 cost: 0,   cd: 8  },
  { type: 'safety_improvements',          cost: 100, cd: 10 },
  { type: 'colonial_representation',      cost: 0,   cd: 15 },
  { type: 'hire_more_workers',            cost: 200, cd: 10 },
  { type: 'science_breakthrough',         cost: 300, cd: 20 },
  { type: 'synths_deployed',              cost: 250, cd: 25, prereq: 'synth_workshop' },
  { type: 'military_deployed',            cost: 300, cd: 15 },
  { type: 'cooperate_with_investigation', cost: 0,   cd: 10 },
  { type: 'human_rights_audit',           cost: 150, cd: 15 },
  { type: 'workforce_automation',         cost: 400, cd: 20 },
  { type: 'bribe_government',             cost: 400, cd: 20 },
  { type: 'crush_miners',                 cost: 300, cd: 40 },
  { type: 'offer_local_government',       cost: 0,   cd: 999, prereq_attr: 'miners_militia' },
  { type: 'train_army',                   cost: 150, cd: 8  },
  { type: 'deploy_army',                  cost: 0,   cd: 0  },
];

// ── Game logic (replicated from index.html) ──────────────────────────────────

function _checkNeeds(event, colony) {
  const n = event.needs;
  if (!n) return true;
  if (n.colony    && !colony.planet)                                      return false;
  if (n.structure && !colony.world.attrs.structures?.[n.structure])       return false;
  if (n.attr      && !colony.world.attrs[n.attr])                         return false;
  if (n.minFires  && (colony.world.attrs._fires?.[n.minFires] ?? 0) < 1) return false;
  return true;
}

function colonyControl(colony, homeOrbitR, transferLevel) {
  if (homeOrbitR == null) return 1;
  const rawDist  = Math.abs(colony.planet.orbitR - homeOrbitR);
  const effDist  = rawDist * Math.max(0.2, 1 - (transferLevel ?? 0) * 0.2);
  const norm     = effDist / Math.max(1, homeOrbitR);
  const distCtrl = 1 / (1 + norm);
  const secLevel = Math.min(3, colony.world.attrs.security_level ?? 0);
  return Math.min(1.0, distCtrl + secLevel * 0.12);
}

function _forwardEventToHome(eventType, magnitude, homeWorld) {
  if (!homeWorld) return;
  const effects = EVENT_EFFECTS[eventType] || {};
  for (const f of Object.values(homeWorld.factions))
    for (const [disp, delta] of Object.entries(effects[f.id] || {}))
      f.shift(disp, delta * magnitude);
}

function tickRandomEvents(colony, homeOrbitR, transferLevel) {
  const w    = colony.world;
  const tick = w.tick;
  if (tick < colony.nextEventTick) return;

  if (!w.attrs._fires)   w.attrs._fires   = {};
  if (!w.attrs._eventCd) w.attrs._eventCd = {};
  const fires = w.attrs._fires;
  const cds   = w.attrs._eventCd;
  const colonyTick = tick - (w.attrs._colonyEstablishedTick ?? tick);

  const eligible = RANDOM_EVENTS.filter(e => {
    if (!_checkNeeds(e, colony)) return false;
    const origin = e.needs?.colony ? colonyTick : tick;
    if (origin < e.minTick) return false;
    if (e.maxFires !== undefined && (fires[e.type] ?? 0) >= e.maxFires) return false;
    if (e.cooldown !== undefined && (cds[e.type] ?? 0) > tick) return false;
    return true;
  });

  colony.nextEventTick = tick + 6 + Math.floor(Math.random() * 7);
  if (!eligible.length) return;

  const total  = eligible.reduce((s, e) => s + e.weight, 0);
  let r        = Math.random() * total;
  const chosen = eligible.find(e => { r -= e.weight; return r <= 0; }) ?? eligible[eligible.length - 1];

  fires[chosen.type] = (fires[chosen.type] ?? 0) + 1;
  if (chosen.cooldown !== undefined) cds[chosen.type] = tick + chosen.cooldown;
  if (chosen.onFire) chosen.onFire(w);

  const ctrl      = colonyControl(colony, homeOrbitR, transferLevel);
  const magnitude = chosen.negative ? Math.max(0.05, 1 - ctrl) : 1.0;
  w.push(new NEvent(chosen.type, { source: 'world', magnitude }));
}

function _stepColony(colony, homeWorld) {
  const w    = colony.world;
  const snap = {};
  for (const f of Object.values(w.factions)) snap[f.id] = f.disposition;
  const prevLen = w.narrative.length;
  w.step();

  // Lock miner scores after each step if suppressed or in militia
  if (w.attrs.miners_suppressed) {
    const mf = w.factions['miners'];
    for (const d of mf.dispositions) mf.scores[d] = 0;
    mf.scores['content'] = 1.0;
  }
  if (w.attrs.miners_militia) {
    const mf = w.factions['miners'];
    for (const d of mf.dispositions) mf.scores[d] = 0;
    mf.scores['revolutionary'] = 1.0;
  }
  for (const f of Object.values(w.factions)) {
    if (f.id === 'synths' && !w.attrs.synths_ever_deployed) continue;
    if (f.disposition === snap[f.id]) continue;
    w.narrative.push(new NarrativeEntry(w.tick, 'NEWS',
      `${f.name}: ${snap[f.id].toUpperCase()} → ${f.disposition.toUpperCase()}`, `shift:${f.id}`));
  }
  for (const entry of w.narrative.slice(prevLen))
    if (entry.speaker === 'NEWS' && entry.source && !entry.source.startsWith('shift:'))
      _forwardEventToHome(entry.source, 1.0, homeWorld);
}

function _stepHomeWorld(homeWorld) {
  if (!homeWorld) return;
  const snap = {};
  for (const f of Object.values(homeWorld.factions)) snap[f.id] = f.disposition;
  homeWorld.step();

  if (homeWorld.attrs.gov_puppet) {
    const gf = homeWorld.factions['gov'];
    for (const d of gf.dispositions) gf.scores[d] = 0;
    gf.scores['supportive'] = 1.0;
  }
  for (const f of Object.values(homeWorld.factions)) {
    if (f.disposition === snap[f.id]) continue;
    homeWorld.narrative.push(new NarrativeEntry(homeWorld.tick, 'NEWS',
      `${f.name}: ${snap[f.id].toUpperCase()} → ${f.disposition.toUpperCase()}`, `shift:${f.id}`));
  }
}

// ── Player action execution ───────────────────────────────────────────────────

function canFire(action, colony, homeWorld) {
  const tick  = colony.world.tick;
  const funds = homeWorld.attrs.player_funds ?? 0;
  if ((colony.playerCooldowns[action.type] ?? 0) > tick) return false;
  if (action.cost > funds) return false;
  if (action.prereq      && !colony.world.attrs.structures?.[action.prereq]) return false;
  if (action.prereq_attr && !colony.world.attrs[action.prereq_attr])         return false;
  if (action.type === 'crush_miners' &&
      (colony.world.attrs.miners_suppressed || colony.world.attrs.miners_militia)) return false;
  if (colony.world.attrs.miners_militia && action.type !== 'offer_local_government') return false;
  if (action.type === 'deploy_army' && (colony.world.attrs.army_size ?? 0) < 5) return false;
  return true;
}

function _crushChance(colony, homeOrbitR, transferLevel) {
  const w  = colony.world;
  const mf = w.factions['miners'];
  let p = 0.25;
  const disp = mf.disposition;
  if      (disp === 'content')       p += 0.25;
  else if (disp === 'restless')      p += 0.10;
  else if (disp === 'striking')      p -= 0.10;
  else if (disp === 'revolutionary') p -= 0.25;
  if (w.attrs.synths_ever_deployed) {
    p += (w.factions['synths'].disposition === 'free') ? -0.15 : 0.08;
  }
  p += colonyControl(colony, homeOrbitR, transferLevel) * 0.20;
  p += (w.attrs.security_level ?? 0) * 0.10;
  if (w.attrs.structures?.orbital_weapon) p += 0.40;
  return Math.max(0.05, Math.min(0.95, p));
}

function executeAction(action, colony, homeWorld) {
  const tick = colony.world.tick;
  homeWorld.attrs.player_funds = (homeWorld.attrs.player_funds ?? 0) - action.cost;
  colony.playerCooldowns[action.type] = tick + action.cd;
  if (action.type === 'military_deployed')
    colony.world.attrs.security_level = Math.min(3, (colony.world.attrs.security_level ?? 0) + 1);
  if (action.type === 'hire_more_workers')
    colony.world.attrs.miner_pop = Math.min(50, (colony.world.attrs.miner_pop ?? 20) + 3);
  if (action.type === 'train_army') {
    colony.world.attrs.army_size = Math.min(50, (colony.world.attrs.army_size ?? 0) + 5);
    return;
  }
  if (action.type === 'deploy_army') {
    const armySize = colony.world.attrs.army_size ?? 0;
    colony.world.attrs.army_size = 0;
    const chance = Math.min(0.90, 0.15 + armySize * 0.02);
    if (!homeWorld.attrs.gov_puppet && Math.random() < chance) {
      homeWorld.attrs.gov_puppet = true;
      const gf = homeWorld.factions['gov'];
      for (const d of gf.dispositions) gf.scores[d] = 0;
      gf.scores['supportive'] = 1.0;
      _forwardEventToHome('government_overthrown', 1.0, homeWorld);
    } else {
      homeWorld.factions['gov'].scores['hostile'] = (homeWorld.factions['gov'].scores['hostile'] ?? 0) + 0.8;
      homeWorld.factions['investors'].scores['skeptical'] = (homeWorld.factions['investors'].scores['skeptical'] ?? 0) + 0.4;
    }
    return;
  }
  if (action.type === 'crush_miners') {
    const chance  = _crushChance(colony, homeWorld.attrs._homeOrbitR ?? 1, 0);
    const success = Math.random() < chance;
    const mf      = colony.world.factions['miners'];
    if (success) {
      colony.world.attrs.miners_suppressed = true;
      for (const d of mf.dispositions) mf.scores[d] = 0;
      mf.scores['content'] = 1.0;
      colony.world.push(new NEvent('miners_crushed', { source: 'player' }));
    } else {
      colony.world.attrs.miners_militia = true;
      for (const d of mf.dispositions) mf.scores[d] = 0;
      mf.scores['revolutionary'] = 1.0;
      colony.world.push(new NEvent('crush_miners_failed', { source: 'player' }));
    }
    return;
  }
  if (action.type === 'offer_local_government') {
    colony.world.attrs.miners_militia    = false;
    colony.world.attrs.miners_suppressed = false;
    colony.world.attrs.local_government  = true;
    colony.world.attrs.local_gov_tax     = colony.world.attrs.local_gov_tax ?? 'medium';
    const mf = colony.world.factions['miners'];
    for (const d of mf.dispositions) mf.scores[d] = 0;
    mf.scores['content'] = 0.6;
    colony.world.push(new NEvent('local_government_established', { source: 'player' }));
    return;
  }
  if (action.type === 'synths_deployed') {
    const sf = colony.world.factions['synths'];
    sf.attrs.population = (sf.attrs.population ?? 0) + 3;
    if (!colony.world.attrs.synths_ever_deployed) {
      colony.world.attrs.synths_ever_deployed = true;
      for (const d of sf.dispositions) sf.scores[d] = 0;
      sf.scores['aware'] = 0.35;
      sf._last_disposition = '';
    }
  }
  colony.world.push(new NEvent(action.type, { source: 'player' }));
}

function actionByType(type) { return PLAYER_ACTIONS.find(a => a.type === type); }

// ── Player profiles ───────────────────────────────────────────────────────────

const PROFILES = {

  neglectful: () => null,

  hostile: (colony, homeWorld) => {
    // Aggressively extract: cut costs, raise hours, automate whenever possible
    const priority = ['workforce_automation', 'increase_work_hours', 'benefits_cut'];
    for (const t of priority) {
      const a = actionByType(t);
      if (a && canFire(a, colony, homeWorld)) return a;
    }
    return null;
  },

  optimal: (colony, homeWorld) => {
    // Appease whoever is most stressed; keep everyone calm
    const minerDisp = colony.world.factions['miners'].disposition;
    const govDisp   = homeWorld.factions['gov'].disposition;
    const invDisp   = homeWorld.factions['investors'].disposition;

    let priority;
    if (minerDisp === 'revolutionary' || minerDisp === 'striking') {
      priority = ['decrease_work_hours', 'miner_pay_increase', 'amenity_added',
                  'hire_more_workers', 'safety_improvements', 'colonial_representation'];
    } else if (minerDisp === 'restless') {
      priority = ['safety_improvements', 'decrease_work_hours', 'amenity_added',
                  'cooperate_with_investigation', 'human_rights_audit'];
    } else if (govDisp === 'hostile' || govDisp === 'suspicious') {
      priority = ['cooperate_with_investigation', 'safety_improvements',
                  'human_rights_audit', 'science_breakthrough'];
    } else if (invDisp === 'hostile' || invDisp === 'skeptical') {
      priority = ['science_breakthrough', 'safety_improvements', 'amenity_added'];
    } else {
      priority = ['hire_more_workers', 'science_breakthrough', 'amenity_added', 'safety_improvements'];
    }

    for (const t of priority) {
      const a = actionByType(t);
      if (a && canFire(a, colony, homeWorld)) return a;
    }
    return null;
  },

  optimal_bribe: (colony, homeWorld) => {
    // Like optimal but adds government bribes to stay out of suspicious
    const govDisp  = homeWorld.factions['gov'].disposition;
    const minerDisp = colony.world.factions['miners'].disposition;
    if ((govDisp === 'suspicious' || govDisp === 'hostile') && Math.random() < 0.6) {
      const bribe = actionByType('bribe_government');
      if (bribe && canFire(bribe, colony, homeWorld)) return bribe;
    }
    if (minerDisp === 'revolutionary' || minerDisp === 'striking') {
      const priority = ['decrease_work_hours', 'miner_pay_increase', 'amenity_added',
                        'hire_more_workers', 'safety_improvements', 'colonial_representation'];
      for (const t of priority) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    }
    const priority = ['hire_more_workers', 'cooperate_with_investigation', 'safety_improvements',
                      'human_rights_audit', 'science_breakthrough', 'amenity_added'];
    for (const t of priority) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    return null;
  },

  hostile_crusher: (colony, homeWorld) => {
    // Hostile + will attempt to crush miners; resolves militia with local govt if forced
    const militia = actionByType('offer_local_government');
    if (militia && canFire(militia, colony, homeWorld)) return militia;
    const crush = actionByType('crush_miners');
    if (crush && canFire(crush, colony, homeWorld)) return crush;
    const priority = ['workforce_automation', 'increase_work_hours', 'benefits_cut', 'military_deployed'];
    for (const t of priority) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    return null;
  },

  overthrower: (colony, homeWorld) => {
    // Train army to 20+ then deploy it against the home government
    const armySize = colony.world.attrs.army_size ?? 0;
    if (armySize >= 20 && !homeWorld.attrs.gov_puppet) {
      const deploy = actionByType('deploy_army');
      if (deploy && canFire(deploy, colony, homeWorld)) return deploy;
    }
    if (armySize < 50) {
      const train = actionByType('train_army');
      if (train && canFire(train, colony, homeWorld)) return train;
    }
    // Keep miners content so the colony stays productive while building the army
    const minerDisp = colony.world.factions['miners'].disposition;
    if (minerDisp === 'revolutionary' || minerDisp === 'striking') {
      const appease = ['decrease_work_hours', 'miner_pay_increase', 'amenity_added', 'colonial_representation'];
      for (const t of appease) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    }
    const priority = ['safety_improvements', 'amenity_added', 'cooperate_with_investigation'];
    for (const t of priority) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    return null;
  },

  synth_deployer: (colony, homeWorld) => {
    // Deploy synths early and often; otherwise mostly neutral management
    const synths = actionByType('synths_deployed');
    if (synths && canFire(synths, colony, homeWorld)) return synths;

    const minerDisp = colony.world.factions['miners'].disposition;
    if (minerDisp === 'revolutionary' || minerDisp === 'striking') {
      const appease = ['decrease_work_hours', 'miner_pay_increase', 'amenity_added'];
      for (const t of appease) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    }
    // Otherwise do nothing — let synths drive the story
    return null;
  },

  terraformer: (colony, homeWorld) => {
    // Build a large terraformed population; keep miners content for maximum growth
    const minerDisp = colony.world.factions['miners'].disposition;
    if (minerDisp === 'revolutionary' || minerDisp === 'striking') {
      const appease = ['decrease_work_hours', 'miner_pay_increase', 'amenity_added', 'colonial_representation'];
      for (const t of appease) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    }
    const priority = ['hire_more_workers', 'safety_improvements', 'amenity_added',
                      'miner_pay_increase', 'science_breakthrough', 'cooperate_with_investigation'];
    for (const t of priority) { const a = actionByType(t); if (a && canFire(a, colony, homeWorld)) return a; }
    return null;
  },

  realistic: (colony, homeWorld) => {
    // Acts most ticks, mixes good and bad decisions
    if (Math.random() > 0.65) return null;

    const weights = {
      increase_work_hours:          0.20,
      decrease_work_hours:          0.55,
      amenity_added:                0.50,
      miner_pay_increase:           0.40,
      benefits_cut:                 0.25,
      safety_improvements:          0.65,
      colonial_representation:      0.35,
      hire_more_workers:            0.45,
      science_breakthrough:         0.55,
      military_deployed:            0.25,
      cooperate_with_investigation: 0.55,
      human_rights_audit:           0.40,
      workforce_automation:         0.15,
    };

    const available = PLAYER_ACTIONS.filter(a => canFire(a, colony, homeWorld));
    if (!available.length) return null;

    const total = available.reduce((s, a) => s + (weights[a.type] ?? 0.4), 0);
    let r = Math.random() * total;
    for (const a of available) {
      r -= weights[a.type] ?? 0.4;
      if (r <= 0) return a;
    }
    return available[available.length - 1];
  },
};

// ── Simulation runner ─────────────────────────────────────────────────────────

function makeColony(orbitR, structures = {}, transferLevel = 0) {
  const world = makeColonyWorld(transferLevel);
  world.attrs.structures = { ...structures };
  world.attrs._colonyEstablishedTick = 0;
  world.attrs._fires   = {};
  world.attrs._eventCd = {};
  return { planet: { name: 'Colony', orbitR }, world, nextEventTick: 5, playerCooldowns: {} };
}

function dispositionIndex(faction) {
  return faction.dispositions.indexOf(faction.disposition);
}

function runGame(config) {
  const { colonyOrbitR, homeOrbitR = 1, transferLevel = 0,
          structures = { mining_rig: true }, ticks = 500, profileFn } = config;

  const homeWorld = makeHomeWorld();
  const colony    = makeColony(colonyOrbitR, structures, transferLevel);

  const eventCounts    = {};
  const shiftLog       = [];   // { tick, faction, from, to, world }
  const dispHistory    = { miners: [], gov: [], investors: [], synths: [] };
  const actionsUsed    = {};

  colony.world.attrs.miner_pop = 20;

  for (let t = 0; t < ticks; t++) {
    // Population-based income
    const minerPop  = colony.world.attrs.miner_pop ?? 20;
    const synthPop  = colony.world.factions['synths']?.attrs.population ?? 0;
    const minerDisp = colony.world.factions['miners'].disposition;
    const synthDisp = colony.world.factions['synths']?.disposition ?? 'dormant';
    const prodMult  = Math.max(0.5, Math.min(2.0, 1 + (colony.world.attrs.production_bonus ?? 0)));
    let income;
    if (colony.world.attrs.miners_militia) {
      income = 0;
    } else if (colony.world.attrs.local_government) {
      const taxRate   = { low: 0.12, medium: 0.25, high: 0.45 }[colony.world.attrs.local_gov_tax ?? 'medium'];
      const payFactor = { content: 1.0, restless: 0.8, striking: 0.25, revolutionary: 0.0 }[minerDisp] ?? 1.0;
      income = Math.floor(minerPop * taxRate * payFactor * prodMult);
      // Tax pressure on miners
      const mf = colony.world.factions['miners'];
      const taxLevel = colony.world.attrs.local_gov_tax ?? 'medium';
      if (taxLevel === 'low')  mf.scores['content']  = (mf.scores['content']  ?? 0) + 0.005;
      if (taxLevel === 'high') mf.scores['restless']  = (mf.scores['restless'] ?? 0) + 0.006;
    } else {
      const minerEff = { content: 1.0, restless: 0.8, striking: 0.2, revolutionary: 0.4 }[minerDisp] ?? 1.0;
      const synthEff = colony.world.attrs.synths_ever_deployed
        ? ({ dormant: 0, aware: 0.9, organized: 0.7, free: 0.0 }[synthDisp] ?? 0.9)
        : 0;
      income = Math.floor((minerPop * 0.6 * minerEff + synthPop * 1.0 * synthEff) * prodMult);
    }
    homeWorld.attrs.player_funds = (homeWorld.attrs.player_funds ?? 0) + income;

    // Population growth — terraforming doubles rate and allows restless growth too
    const terraformed  = !!colony.world.attrs.structures?.terraforming_array;
    const growInterval = terraformed ? 20 : 40;
    const growOk       = minerDisp === 'content' || (terraformed && minerDisp === 'restless');
    if (t % growInterval === 0 && growOk && minerPop < 50)
      colony.world.attrs.miner_pop += 1;

    // Quarterly profit report to investors
    if (t > 0 && t % 50 === 0) {
      const evType = income >= 35 ? 'profit_report_high'
                   : income >= 18 ? 'profit_report_medium'
                   : 'profit_report_low';
      _forwardEventToHome(evType, 1.0, homeWorld);
    }

    // Player action
    const action = profileFn(colony, homeWorld);
    if (action) {
      executeAction(action, colony, homeWorld);
      actionsUsed[action.type] = (actionsUsed[action.type] ?? 0) + 1;
    }

    // Snapshot dispositions before step
    const snapMiners  = colony.world.factions['miners'].disposition;
    const snapGov     = homeWorld.factions['gov'].disposition;
    const snapInv     = homeWorld.factions['investors'].disposition;
    const snapSynths  = colony.world.factions['synths'].disposition;

    tickRandomEvents(colony, homeOrbitR, transferLevel);
    _stepColony(colony, homeWorld);
    _stepHomeWorld(homeWorld);

    // Record shifts
    const tick = colony.world.tick;
    if (colony.world.factions['miners'].disposition !== snapMiners)
      shiftLog.push({ tick, faction: 'miners', from: snapMiners, to: colony.world.factions['miners'].disposition });
    if (homeWorld.factions['gov'].disposition !== snapGov)
      shiftLog.push({ tick, faction: 'gov', from: snapGov, to: homeWorld.factions['gov'].disposition });
    if (homeWorld.factions['investors'].disposition !== snapInv)
      shiftLog.push({ tick, faction: 'investors', from: snapInv, to: homeWorld.factions['investors'].disposition });
    if (colony.world.attrs.synths_ever_deployed &&
        colony.world.factions['synths'].disposition !== snapSynths)
      shiftLog.push({ tick, faction: 'synths', from: snapSynths, to: colony.world.factions['synths'].disposition });

    // Record disposition index history (sampled every 10 ticks)
    if (t % 10 === 0) {
      dispHistory.miners.push(dispositionIndex(colony.world.factions['miners']));
      dispHistory.gov.push(dispositionIndex(homeWorld.factions['gov']));
      dispHistory.investors.push(dispositionIndex(homeWorld.factions['investors']));
      dispHistory.synths.push(
        colony.world.attrs.synths_ever_deployed
          ? dispositionIndex(colony.world.factions['synths'])
          : -1   // -1 = not yet deployed
      );
    }

    // Collect events from colony narrative this tick
    for (const e of colony.world.narrative)
      if (e.tick === tick && e.speaker === 'NEWS' && e.source && !e.source.startsWith('shift:'))
        eventCounts[e.source] = (eventCounts[e.source] ?? 0) + 1;
  }

  return {
    ctrl: colonyControl(colony, homeOrbitR, transferLevel).toFixed(2),
    minerFinal:    colony.world.factions['miners'].disposition,
    govFinal:      homeWorld.factions['gov'].disposition,
    investorFinal: homeWorld.factions['investors'].disposition,
    synthFinal:       colony.world.attrs.synths_ever_deployed
                        ? colony.world.factions['synths'].disposition
                        : null,
    synthsDeployed:   !!colony.world.attrs.synths_ever_deployed,
    finalMinerPop:    colony.world.attrs.miner_pop ?? 20,
    govPuppet:        !!homeWorld.attrs.gov_puppet,
    minersSuppressed: !!colony.world.attrs.miners_suppressed,
    minersMilitia:    !!colony.world.attrs.miners_militia,
    synthPop:       colony.world.factions['synths'].attrs.population ?? 0,
    finalFunds:    homeWorld.attrs.player_funds ?? 0,
    eventCounts,
    shiftLog,
    dispHistory,
    actionsUsed,
    colonyAttrs: {
      irradiated:       colony.world.attrs.planet_irradiated,
      kessler:          colony.world.attrs.kessler_active,
      alienLife:        colony.world.attrs.alien_life_present,
      ruins:            colony.world.attrs.ancient_ruins_present,
      productionBonus:  colony.world.attrs.production_bonus ?? 0,
    },
  };
}

// ── Run all profiles ──────────────────────────────────────────────────────────

const N     = 100;
const TICKS = 500;
const STRUCTS             = { mining_rig: true };
const SYNTH_STRUCTS       = { mining_rig: true, synth_workshop: true };
const OVERTHROW_STRUCTS   = { mining_rig: true, rocket_factory: true };
const TERRAFORM_STRUCTS   = { mining_rig: true, terraforming_array: true };

const SYNTH_PROFILES      = new Set(['synth_deployer']);
const OVERTHROW_PROFILES  = new Set(['overthrower']);
const TERRAFORM_PROFILES  = new Set(['terraformer']);

const output = {};

for (const [profileName, profileFn] of Object.entries(PROFILES)) {
  process.stderr.write(`running ${profileName}...\n`);
  const structs = SYNTH_PROFILES.has(profileName)      ? SYNTH_STRUCTS
               : OVERTHROW_PROFILES.has(profileName)  ? OVERTHROW_STRUCTS
               : TERRAFORM_PROFILES.has(profileName)  ? TERRAFORM_STRUCTS
               : STRUCTS;
  const runs = [];
  for (let i = 0; i < N; i++) {
    runs.push(runGame({
      colonyOrbitR:  1.5 + (i / N) * 6,
      homeOrbitR:    1,
      transferLevel: Math.floor(i / 20) % 5,
      structures:    structs,
      ticks:         TICKS,
      profileFn,
    }));
  }
  output[profileName] = runs;
}

process.stdout.write(JSON.stringify(output));
process.stderr.write('\ndone\n');
