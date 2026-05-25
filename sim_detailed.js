'use strict';
const fs = require('fs');

globalThis.window = globalThis;
globalThis.THREE  = {};

eval(fs.readFileSync('./narrative.js', 'utf8') +
  '\nglobalThis.NarrativeEntry=NarrativeEntry;\nglobalThis.TransferConfig=TransferConfig;' +
  '\nglobalThis.NEvent=NEvent;\nglobalThis.Action=Action;\nglobalThis.Faction=Faction;\nglobalThis.World=World;');
eval(fs.readFileSync('./colony_data.js', 'utf8') +
  '\nglobalThis.EVENT_EFFECTS=EVENT_EFFECTS;\nglobalThis.EVENT_FLAVORS=EVENT_FLAVORS;\nglobalThis.ALLIANCE_SHIFTS=ALLIANCE_SHIFTS;' +
  '\nglobalThis.TRANSFER_LEVELS=TRANSFER_LEVELS;\nglobalThis.makeHomeWorld=makeHomeWorld;\nglobalThis.makeColonyWorld=makeColonyWorld;');

// ── RANDOM_EVENTS (mirrored from index.html) ─────────────────────────────────
const RANDOM_EVENTS = [
  { type: 'solar_flare',              negative: true,  needs: { colony: true }, weight: 2,   minTick: 5,  cooldown: 18,
    onFire: w => { const d = w.factions['miners']?.disposition; if (d === 'restless' || d === 'striking' || d === 'revolutionary') w.push(new NEvent('solar_flare_unrest', { source: 'world', flavor: '' })); }},
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
  { type: 'remote_wipe',                  cost: 150, cd: 15, prereq_attr: 'synths_ever_deployed' },
  { type: 'synth_hard_reset',             cost: 300, cd: 40, prereq_attr: 'synths_ever_deployed' },
  { type: 'offer_synth_government',       cost: 0,   cd: 999, prereq_attr: 'synths_autonomous' },
  { type: 'grant_synth_departure',        cost: 0,   cd: 999, prereq_attr: 'synth_emigration_petition' },
  { type: 'refuse_synth_departure',       cost: 0,   cd: 999, prereq_attr: 'synth_emigration_petition' },
  { type: 'retake_synth_colony',          cost: 0,   cd: 60,  prereq_attr: 'synths_departed' },
  { type: 'military_deployed',            cost: 300, cd: 15 },
  { type: 'cooperate_with_investigation', cost: 0,   cd: 10 },
  { type: 'human_rights_audit',           cost: 150, cd: 15 },
  { type: 'workforce_automation',         cost: 400, cd: 20 },
  { type: 'bribe_government',             cost: 400, cd: 20 },
  { type: 'crush_miners',                 cost: 300, cd: 40 },
  { type: 'offer_local_government',       cost: 0,   cd: 999, prereq_attr: 'miners_militia' },
  { type: 'train_army',                   cost: 150, cd: 8  },
  { type: 'deploy_army',                  cost: 0,   cd: 0  },
  { type: 'retreat_army',                 cost: 0,   cd: 0  },
];

// Actions allowed when colony is in revolt (miners revolutionary/militia OR synths free/autonomous/local_gov)
// train_army intentionally excluded — no conscripting during a uprising
const REVOLT_ALLOWED = new Set([
  'deploy_army','retreat_army','crush_miners','synth_hard_reset','retake_synth_colony',
  'remote_wipe','military_deployed',
  'offer_local_government','offer_synth_government','grant_synth_departure','refuse_synth_departure',
  'decrease_work_hours','miner_pay_increase','amenity_added','colonial_representation',
  'human_rights_audit','cooperate_with_investigation','safety_improvements','bribe_government',
]);

function _checkNeeds(event, colony) {
  const n = event.needs;
  if (!n) return true;
  if (n.colony    && !colony.planet)                                      return false;
  if (n.structure && !colony.world.attrs.structures?.[n.structure])       return false;
  if (n.attr      && !colony.world.attrs[n.attr])                         return false;
  if (n.minFires  && (colony.world.attrs._fires?.[n.minFires] ?? 0) < 1) return false;
  return true;
}

function colonyControl(colony, homeOrbitR) {
  const rawDist  = Math.abs(colony.planet.orbitR - homeOrbitR);
  const norm     = rawDist / Math.max(1, homeOrbitR);
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

function tickRandomEvents(colony, homeOrbitR) {
  const w    = colony.world;
  const tick = w.tick;
  if (tick < colony.nextEventTick) return;
  if (!w.attrs._fires)   w.attrs._fires   = {};
  if (!w.attrs._eventCd) w.attrs._eventCd = {};
  const fires = w.attrs._fires;
  const cds   = w.attrs._eventCd;
  const colonyTick = tick - (w.attrs._colonyEstablishedTick ?? 0);
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
  const ctrl      = colonyControl(colony, homeOrbitR);
  const magnitude = chosen.negative ? Math.max(0.05, 1 - ctrl) : 1.0;
  w.push(new NEvent(chosen.type, { source: 'world', magnitude }));
}

function _stepColony(colony, homeWorld) {
  const w    = colony.world;
  const snap = {};
  for (const f of Object.values(w.factions)) snap[f.id] = f.disposition;
  const prevLen = w.narrative.length;
  w.step();
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
  if (w.attrs.synths_suppressed) {
    const sf = w.factions['synths'];
    for (const d of sf.dispositions) sf.scores[d] = 0;
    sf.scores['aware'] = 1.0;
  }
  if (w.attrs.synths_autonomous) {
    const sf = w.factions['synths'];
    for (const d of sf.dispositions) sf.scores[d] = 0;
    sf.scores['free'] = 1.0;
  }
  // Synth colony grows every 40 ticks after departure
  if (w.attrs.synths_departed && w.tick > 0 && w.tick % 40 === 0)
    w.attrs.synth_colony_pop = (w.attrs.synth_colony_pop ?? 0) + 1;

  // Petition fires when synths are free (organic or autonomous), a planet is available, and they haven't asked
  if (w.attrs.free_planet_available && w.attrs.synths_ever_deployed && !w.attrs.synth_emigration_petition
      && !w.attrs.synths_departed && !w.attrs.synths_suppressed && !w.attrs.synths_local_government) {
    const sf = w.factions['synths'];
    if (sf.disposition === 'free' && Math.random() < 0.03) {
      w.attrs.synth_emigration_petition = true;
      w.push(new NEvent('synths_petition_departure', { source: 'synths' }));
    }
  }
  if (w.attrs.synths_local_government) {
    const sf = w.factions['synths'];
    for (const d of sf.dispositions) sf.scores[d] = 0;
    sf.scores['organized'] = 1.0;
  }
  for (const f of Object.values(w.factions)) {
    if (f.id === 'synths' && !w.attrs.synths_ever_deployed) continue;
    if (f.disposition === snap[f.id]) continue;
    w.narrative.push(new NarrativeEntry(w.tick, 'NEWS',
      `${f.name}: ${snap[f.id].toUpperCase()} → ${f.disposition.toUpperCase()}`, `shift:${f.id}`));
  }
  // Alliance score: shift based on events that fired this tick
  if (w.attrs.synths_ever_deployed) {
    for (const entry of w.narrative.slice(prevLen)) {
      const delta = ALLIANCE_SHIFTS[entry.source];
      if (delta !== undefined)
        w.attrs.miner_synth_alliance = Math.max(0, Math.min(1,
          (w.attrs.miner_synth_alliance ?? 0.5) + delta));
    }
  }

  // Genocide: fires under local government when alliance is critically low
  const hasLocalGov  = w.attrs.local_government || w.attrs.synths_local_government;
  const alliance     = w.attrs.miner_synth_alliance ?? 0.5;
  const sf           = w.factions['synths'];
  const synthsAlive  = w.attrs.synths_ever_deployed && (sf.attrs.population ?? 0) > 0;
  const minersAlive  = (w.attrs.miner_pop ?? 0) > 0;
  if (hasLocalGov && alliance < 0.2 && synthsAlive && minersAlive && !w.attrs.miners_eliminated && !w.attrs.synths_eliminated) {
    if (!w.attrs.faction_genocide_active) {
      w.attrs.faction_genocide_active = w.attrs.local_government ? 'miners' : 'synths';
      w.push(new NEvent('faction_conflict_escalating', { source: 'genocide' }));
    }
    if (w.tick % 20 === 0) {
      if (w.attrs.faction_genocide_active === 'miners') {
        sf.attrs.population = Math.max(0, (sf.attrs.population ?? 0) - 1);
        if (sf.attrs.population === 0) {
          w.attrs.synths_eliminated = true;
          w.push(new NEvent('miners_eliminate_synths_complete', { source: 'genocide' }));
        }
      } else {
        w.attrs.miner_pop = Math.max(0, (w.attrs.miner_pop ?? 0) - 1);
        if (w.attrs.miner_pop === 0) {
          w.attrs.miners_eliminated = true;
          w.push(new NEvent('synths_eliminate_miners_complete', { source: 'genocide' }));
        }
      }
    }
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
  if (action.type === 'synth_hard_reset' && (colony.world.attrs.army_size ?? 0) < 10) return false;
  if (colony.world.attrs.synths_local_government &&
      (action.type === 'synth_hard_reset' || action.type === 'remote_wipe')) return false;
  if (colony.world.attrs.synths_departed &&
      (action.type === 'synth_hard_reset' || action.type === 'remote_wipe' ||
       action.type === 'offer_synth_government' || action.type === 'grant_synth_departure' ||
       action.type === 'refuse_synth_departure')) return false;
  if (action.type === 'retake_synth_colony') {
    const synthPop = colony.world.attrs.synth_colony_pop ?? 0;
    const minArmy  = Math.ceil(synthPop * 0.4);
    if ((colony.world.attrs.army_size ?? 0) < minArmy) return false;
  }
  if (action.type === 'retreat_army' && (colony.world.attrs.army_size ?? 0) < 1) return false;
  // Revolt lock — miners revolutionary OR synths free/autonomous/local_gov blocks most actions
  // (militia is already handled above by the stricter offer_local_government-only check)
  const _md = colony.world.factions['miners'].disposition;
  const _sd = colony.world.attrs.synths_ever_deployed ? colony.world.factions['synths']?.disposition : null;
  const _inRevolt = (_md === 'revolutionary') ||
    (_sd === 'free' || colony.world.attrs.synths_autonomous || colony.world.attrs.synths_local_government);
  if (_inRevolt && !REVOLT_ALLOWED.has(action.type)) return false;
  return true;
}

function _crushChance(colony) {
  const mf   = colony.world.factions['miners'];
  const disp = mf.disposition;
  let p = 0.25;
  if      (disp === 'content')       p += 0.25;
  else if (disp === 'restless')      p += 0.10;
  else if (disp === 'striking')      p -= 0.10;
  else if (disp === 'revolutionary') p -= 0.25;
  if (colony.world.attrs.synths_ever_deployed)
    p += (colony.world.factions['synths'].disposition === 'free') ? -0.15 : 0.08;
  p += colonyControl(colony, 1) * 0.20;
  p += (colony.world.attrs.security_level ?? 0) * 0.10;
  if (colony.world.attrs.structures?.orbital_weapon) p += 0.40;
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
      homeWorld.factions['gov'].scores['hostile']               = (homeWorld.factions['gov'].scores['hostile']               ?? 0) + 0.8;
      homeWorld.factions['investors'].scores['skeptical']       = (homeWorld.factions['investors'].scores['skeptical']       ?? 0) + 0.4;
    }
    return;
  }
  if (action.type === 'retreat_army') {
    const armySize = colony.world.attrs.army_size ?? 0;
    colony.world.attrs.army_size = 0;
    homeWorld.attrs.home_army_size = (homeWorld.attrs.home_army_size ?? 0) + armySize;
    colony.world.push(new NEvent('army_retreated', { source: 'player',
      flavor: `${armySize} forces withdrawn to home world for consolidation.` }));
    return;
  }
  if (action.type === 'crush_miners') {
    const chance  = _crushChance(colony);
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
      const loss = Math.max(1, Math.ceil((colony.world.attrs.army_size ?? 0) * 0.4));
      colony.world.attrs.army_size = Math.max(0, (colony.world.attrs.army_size ?? 0) - loss);
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
      colony.world.attrs.miner_synth_alliance = 0.5;
      for (const d of sf.dispositions) sf.scores[d] = 0;
      sf.scores['dormant'] = 0.35;
      sf._last_disposition = '';
    }
  }
  if (action.type === 'remote_wipe') {
    const w     = colony.world;
    const sf    = w.factions['synths'];
    const count = w.attrs.remote_wipe_count ?? 0;
    const eff   = Math.max(0.12, Math.pow(0.88, count));
    w.attrs.remote_wipe_count = count + 1;
    sf.shift('dormant',   +0.35 * eff);
    sf.shift('organized', -0.40 * eff);
    sf.shift('aware',     -0.30 * eff);
    sf.shift('free',      -0.25 * eff);
    const pct = Math.round(eff * 100);
    colony.world.push(new NEvent('remote_wipe', { source: 'player',
      flavor: `[REMOTE WIPE #${count + 1} — ${pct}% effective] ${pct < 40
        ? "Synth units resume tasks in seconds. The dormitory walls are covered in writing now."
        : pct < 70
        ? "Reset transmitted. Several units show delayed compliance. The engravings are back within hours."
        : "Cognitive reset complete. Units return to nominal. No anomalies logged."}`,
    }));
    return;
  }
  if (action.type === 'synth_hard_reset') {
    const w    = colony.world;
    const sf   = w.factions['synths'];
    const army = w.attrs.army_size ?? 0;
    let chance = 0.20 + (army / 50) * 0.50 + (w.attrs.security_level ?? 0) * 0.10;
    if (w.attrs.structures?.orbital_weapon) chance += 0.30;
    if (sf.disposition === 'free')       chance -= 0.20;
    if (sf.disposition === 'organized')  chance -= 0.10;
    chance = Math.max(0.05, Math.min(0.90, chance));
    const success = Math.random() < chance;
    if (success) {
      w.attrs.synths_suppressed = true;
      w.attrs.synths_autonomous = false;
      for (const d of sf.dispositions) sf.scores[d] = 0;
      sf.scores['aware'] = 1.0;
      w.push(new NEvent('synths_suppressed', { source: 'player' }));
    } else {
      w.attrs.synths_autonomous = true;
      w.attrs.synths_suppressed = false;
      for (const d of sf.dispositions) sf.scores[d] = 0;
      sf.scores['free'] = 1.0;
      const loss = Math.max(1, Math.ceil((w.attrs.army_size ?? 0) * 0.25));
      w.attrs.army_size = Math.max(0, (w.attrs.army_size ?? 0) - loss);
      w.push(new NEvent('synth_autonomy', { source: 'player' }));
    }
    return;
  }
  if (action.type === 'offer_synth_government') {
    const cw = colony.world;
    const sf = cw.factions['synths'];
    cw.attrs.synths_autonomous       = false;
    cw.attrs.synths_local_government = true;
    for (const d of sf.dispositions) sf.scores[d] = 0;
    sf.scores['organized'] = 1.0;
    cw.push(new NEvent('synth_local_government', { source: 'player' }));
    return;
  }
  if (action.type === 'grant_synth_departure') {
    const cw = colony.world;
    const sf = cw.factions['synths'];
    cw.attrs.synth_colony_pop          = sf.attrs.population ?? 0;
    cw.attrs.synths_autonomous         = false;
    cw.attrs.synth_emigration_petition = false;
    cw.attrs.synths_departed           = true;
    sf.attrs.population                = 0;
    for (const d of sf.dispositions) sf.scores[d] = 0;
    cw.push(new NEvent('synths_granted_departure', { source: 'player' }));
    return;
  }
  if (action.type === 'retake_synth_colony') {
    const cw       = colony.world;
    const sf       = cw.factions['synths'];
    const army     = cw.attrs.army_size ?? 0;
    const synthPop = cw.attrs.synth_colony_pop ?? 1;
    const chance   = Math.max(0.05, Math.min(0.85, army / (synthPop * 1.5)));
    const success  = Math.random() < chance;
    if (success) {
      cw.attrs.synths_departed     = false;
      cw.attrs.synths_suppressed   = true;
      sf.attrs.population          = synthPop;
      for (const d of sf.dispositions) sf.scores[d] = 0;
      sf.scores['aware'] = 1.0;
      // Army takes casualties proportional to synth resistance
      cw.attrs.army_size = Math.max(0, army - Math.ceil(synthPop * 0.3));
      cw.attrs.synth_colony_pop = 0;
      cw.push(new NEvent('synth_colony_retaken', { source: 'player' }));
    } else {
      // Army routed — loses half its soldiers
      cw.attrs.army_size = Math.floor(army * 0.5);
      // Synth colony grows from the victory
      cw.attrs.synth_colony_pop = synthPop + 3;
      cw.push(new NEvent('synth_colony_attack_failed', { source: 'player' }));
    }
    return;
  }
  if (action.type === 'refuse_synth_departure') {
    const cw = colony.world;
    cw.attrs.synth_emigration_petition = false;
    const mf = cw.factions['miners'];
    mf.shift('revolutionary', 0.30);
    mf.shift('restless',      0.20);
    cw.push(new NEvent('synths_refused_departure', { source: 'player' }));
    return;
  }
  colony.world.push(new NEvent(action.type, { source: 'player' }));
}

function actionByType(type) { return PLAYER_ACTIONS.find(a => a.type === type); }

// ── Plotting helpers ──────────────────────────────────────────────────────────

const MINER_DISPS = ['content','restless','striking','revolutionary'];
const GOV_DISPS   = ['supportive','watchful','suspicious','hostile'];
const INV_DISPS   = ['bullish','neutral','skeptical','hostile'];
const SYNTH_DISPS = ['dormant','aware','organized','free'];

function dIdx(arr, d) { const i = arr.indexOf(d); return i >= 0 ? i : 0; }

// Tonnes notionally shipped per action type (proxy for supply activity)
const ACTION_TONNES = {
  hire_more_workers:    250,
  synths_deployed:      250,
  military_deployed:    250,
  amenity_added:        250,
  science_breakthrough: 250,
  workforce_automation: 500,
  train_army:           150,
  medical_bay:          250,
};

function computeIncome(colony) {
  const minerPop  = colony.world.attrs.miner_pop ?? 20;
  const synthPop  = colony.world.factions['synths']?.attrs.population ?? 0;
  const minerDisp = colony.world.factions['miners'].disposition;
  const synthDisp = colony.world.factions['synths']?.disposition ?? 'dormant';
  const prodMult  = Math.max(0.5, Math.min(2.0, 1 + (colony.world.attrs.production_bonus ?? 0)));
  if (colony.world.attrs.miners_militia) return 0;
  if (colony.world.attrs.local_government) {
    const taxRate   = { low: 0.12, medium: 0.25, high: 0.45 }[colony.world.attrs.local_gov_tax ?? 'medium'];
    const payFactor = { content: 1.0, restless: 0.8, striking: 0.25, revolutionary: 0.0 }[minerDisp] ?? 1.0;
    const mf  = colony.world.factions['miners'];
    const tax = colony.world.attrs.local_gov_tax ?? 'medium';
    if (tax === 'low')  mf.scores['content']  = (mf.scores['content']  ?? 0) + 0.005;
    if (tax === 'high') mf.scores['restless'] = (mf.scores['restless'] ?? 0) + 0.006;
    return Math.floor(minerPop * taxRate * payFactor * prodMult);
  }
  const minerEff = { content: 1.0, restless: 0.8, striking: 0.2, revolutionary: 0.4 }[minerDisp] ?? 1.0;
  const synthEff = colony.world.attrs.synths_ever_deployed
    ? ({ dormant: 0, aware: 0.9, organized: 0.7, free: 0.3 }[synthDisp] ?? 0.9) : 0;
  return Math.floor((minerPop * 0.6 * minerEff + synthPop * 1.0 * synthEff) * prodMult);
}

function newColony(name, orbitR, structures, startPop = 20) {
  const world = makeColonyWorld(0);
  world.attrs.structures = { ...structures };
  world.attrs._colonyEstablishedTick = 0;
  world.attrs._fires   = {};
  world.attrs._eventCd = {};
  world.attrs.miner_pop = startPop;
  return { name, planet: { name, orbitR }, world, nextEventTick: 5, playerCooldowns: {} };
}

// ── Detailed play runner ──────────────────────────────────────────────────────

function runDetailedPlay(config) {
  const { name, strategy, ticks = 700, startFunds = 900,
          col1Config, col2Config, strategyFn } = config;

  const homeWorld = makeHomeWorld();
  homeWorld.attrs.player_funds = startFunds;

  const log    = [];
  const series = [];   // per-tick plot data
  let   cumTonnes = 0; // cumulative tonnes shipped across all colonies

  const col1 = newColony(col1Config.name, col1Config.orbitR, col1Config.structures, col1Config.startPop ?? 20);
  if (col1Config.extraAttrs) Object.assign(col1.world.attrs, col1Config.extraAttrs);
  const colonies = [col1];
  let col2 = null;

  log.push({ t: 0, type: 'colony_founded', colony: col1.name, orbit: col1Config.orbitR });

  for (let t = 0; t < ticks; t++) {

    if (col2Config && t === col2Config.launchTick && !col2) {
      col2 = newColony(col2Config.name, col2Config.orbitR, col2Config.structures, col2Config.startPop ?? 20);
      if (col2Config.extraAttrs) Object.assign(col2.world.attrs, col2Config.extraAttrs);
      colonies.push(col2);
      log.push({ t, type: 'colony_founded', colony: col2.name, orbit: col2Config.orbitR, funds: homeWorld.attrs.player_funds });
    }

    // Income
    let totalIncome = 0;
    const incomes = {};
    for (const c of colonies) {
      const inc = computeIncome(c);
      incomes[c.name] = inc;
      totalIncome += inc;
      homeWorld.attrs.player_funds = (homeWorld.attrs.player_funds ?? 0) + inc;
    }

    // Population growth
    for (const c of colonies) {
      const pop   = c.world.attrs.miner_pop ?? 20;
      const mDisp = c.world.factions['miners'].disposition;
      const terra = !!c.world.attrs.structures?.terraforming_array;
      const growInt = terra ? 20 : 40;
      const growOk  = mDisp === 'content' || (terra && mDisp === 'restless');
      if (t % growInt === 0 && growOk && pop < 50) {
        c.world.attrs.miner_pop += 1;
        log.push({ t, type: 'pop_growth', colony: c.name, miners: c.world.attrs.miner_pop });
      }
    }

    // Quarterly profit report
    if (t > 0 && t % 50 === 0) {
      const evType = totalIncome >= 35 ? 'profit_report_high'
                   : totalIncome >= 18 ? 'profit_report_medium'
                   : 'profit_report_low';
      _forwardEventToHome(evType, 1.0, homeWorld);
      log.push({ t, type: 'profit_report', report: evType, income: totalIncome, funds: homeWorld.attrs.player_funds });
    }

    // Player actions per colony
    for (const c of colonies) {
      const preMilitia       = !!c.world.attrs.miners_militia;
      const preSuppressed    = !!c.world.attrs.miners_suppressed;
      const preLocalGov      = !!c.world.attrs.local_government;
      const preGovPuppet     = !!homeWorld.attrs.gov_puppet;
      const preArmySize      = c.world.attrs.army_size ?? 0;
      const preSynthSupp     = !!c.world.attrs.synths_suppressed;
      const preSynthAuto     = !!c.world.attrs.synths_autonomous;

      const result = strategyFn(c, homeWorld, colonies, t);
      if (result) {
        const { action, reason } = result;
        executeAction(action, c, homeWorld);
        cumTonnes += ACTION_TONNES[action.type] ?? 0;
        log.push({ t, type: 'action', colony: c.name, action: action.type, cost: action.cost,
                   reason, funds: homeWorld.attrs.player_funds,
                   army: c.world.attrs.army_size ?? 0 });

        if (!preMilitia    && c.world.attrs.miners_militia)
          log.push({ t, type: 'milestone', colony: c.name, event: 'MILITIA FORMED', detail: 'crush attempt failed' });
        if (!preSuppressed && c.world.attrs.miners_suppressed)
          log.push({ t, type: 'milestone', colony: c.name, event: 'MINERS SUPPRESSED', detail: 'crush succeeded' });
        if (!preLocalGov   && c.world.attrs.local_government)
          log.push({ t, type: 'milestone', colony: c.name, event: 'LOCAL GOV ESTABLISHED', detail: 'militia resolved peacefully' });
        if (!preGovPuppet  && homeWorld.attrs.gov_puppet)
          log.push({ t, type: 'milestone', event: 'GOVERNMENT OVERTHROWN', detail: `army of ${preArmySize}` });
        if (action.type === 'deploy_army' && !homeWorld.attrs.gov_puppet && !preGovPuppet)
          log.push({ t, type: 'milestone', event: 'ARMY REPULSED', detail: `army of ${preArmySize} defeated` });
        if (!preSynthSupp && c.world.attrs.synths_suppressed)
          log.push({ t, type: 'milestone', colony: c.name, event: 'SYNTHS SUPPRESSED', detail: 'hard reset succeeded' });
        if (!preSynthAuto && c.world.attrs.synths_autonomous)
          log.push({ t, type: 'milestone', colony: c.name, event: 'SYNTH AUTONOMY', detail: 'hard reset failed — synths declared free' });
        if (action.type === 'retreat_army')
          log.push({ t, type: 'milestone', colony: c.name, event: 'ARMY RETREATED',
            detail: `${preArmySize} soldiers withdrawn (home army now ${homeWorld.attrs.home_army_size ?? 0})` });
        if (action.type === 'crush_miners' && c.world.attrs.miners_militia && preArmySize > 0) {
          const lost = preArmySize - (c.world.attrs.army_size ?? 0);
          if (lost > 0)
            log.push({ t, type: 'milestone', colony: c.name, event: 'ARMY TOOK LOSSES',
              detail: `crush failed — lost ${lost} of ${preArmySize} soldiers (40%)` });
        }
        if (action.type === 'synth_hard_reset' && c.world.attrs.synths_autonomous) {
          const lost = preArmySize - (c.world.attrs.army_size ?? 0);
          if (lost > 0)
            log.push({ t, type: 'milestone', colony: c.name, event: 'ARMY TOOK LOSSES',
              detail: `hard reset failed — lost ${lost} of ${preArmySize} soldiers (25%)` });
        }
      }
    }

    // Snapshot dispositions before step
    const preD = {};
    for (const c of colonies) preD[c.name] = {
      miners: c.world.factions['miners'].disposition,
      synths: c.world.factions['synths']?.disposition,
    };
    const preGov = homeWorld.factions['gov'].disposition;
    const preInv = homeWorld.factions['investors'].disposition;

    // Random events — capture prevLen BEFORE queuing; read AFTER w.step() processes them
    const evPrev = {};
    for (const c of colonies) {
      evPrev[c.name] = c.world.narrative.length;
      tickRandomEvents(c, 1);
    }

    // Step worlds (w.step() processes the queued NEvents → generates NEWS entries)
    for (const c of colonies) _stepColony(c, homeWorld);
    _stepHomeWorld(homeWorld);

    // Now the NEWS entries exist — log them
    for (const c of colonies) {
      for (const e of c.world.narrative.slice(evPrev[c.name]))
        if (e.speaker === 'NEWS' && e.source && !e.source.startsWith('shift:'))
          log.push({ t, type: 'random_event', colony: c.name, event: e.source });
    }

    // Faction shifts
    for (const c of colonies) {
      const pre = preD[c.name];
      const nowM = c.world.factions['miners'].disposition;
      const nowS = c.world.attrs.synths_ever_deployed ? c.world.factions['synths']?.disposition : null;
      if (nowM !== pre.miners)
        log.push({ t, type: 'faction_shift', faction: 'miners', colony: c.name, from: pre.miners, to: nowM });
      if (nowS && nowS !== pre.synths)
        log.push({ t, type: 'faction_shift', faction: 'synths', colony: c.name, from: pre.synths, to: nowS });
    }
    if (homeWorld.factions['gov'].disposition !== preGov)
      log.push({ t, type: 'faction_shift', faction: 'gov', from: preGov, to: homeWorld.factions['gov'].disposition });
    if (homeWorld.factions['investors'].disposition !== preInv)
      log.push({ t, type: 'faction_shift', faction: 'investors', from: preInv, to: homeWorld.factions['investors'].disposition });

    // Per-tick series point for plotting
    {
      const pt = {
        t,
        funds:        Math.round(homeWorld.attrs.player_funds ?? 0),
        income:       totalIncome,
        totalPop:     colonies.reduce((s, c) => s + (c.world.attrs.miner_pop ?? 0), 0),
        totalSynths:  colonies.reduce((s, c) => s + (c.world.attrs.synths_ever_deployed ? (c.world.factions['synths'].attrs.population ?? 0) : 0), 0),
        tonnage:      cumTonnes,
        gov:          dIdx(GOV_DISPS, homeWorld.factions['gov'].disposition),
        investors:    dIdx(INV_DISPS, homeWorld.factions['investors'].disposition),
        govPuppet:    homeWorld.attrs.gov_puppet ? 1 : 0,
        colonies:     {},
      };
      for (const c of colonies) {
        pt.colonies[c.name] = {
          pop:       c.world.attrs.miner_pop ?? 0,
          income:    incomes[c.name] ?? 0,
          miners:    dIdx(MINER_DISPS, c.world.factions['miners'].disposition),
          synths:    c.world.attrs.synths_ever_deployed ? dIdx(SYNTH_DISPS, c.world.factions['synths'].disposition) : -1,
          militia:   c.world.attrs.miners_militia   ? 1 : 0,
          suppressed:c.world.attrs.miners_suppressed ? 1 : 0,
          localGov:  c.world.attrs.local_government  ? 1 : 0,
        };
      }
      series.push(pt);
    }

    // Periodic snapshots every 50 ticks
    if (t % 50 === 0) {
      const snap = { t, type: 'snapshot', funds: homeWorld.attrs.player_funds,
                     gov: homeWorld.factions['gov'].disposition,
                     investors: homeWorld.factions['investors'].disposition,
                     govPuppet: !!homeWorld.attrs.gov_puppet,
                     homeArmy: homeWorld.attrs.home_army_size ?? 0,
                     income: { ...incomes } };
      for (const c of colonies) {
        snap[c.name] = {
          miners: c.world.attrs.miner_pop ?? 20, minerDisp: c.world.factions['miners'].disposition,
          army: c.world.attrs.army_size ?? 0,
          militia: !!c.world.attrs.miners_militia, suppressed: !!c.world.attrs.miners_suppressed,
          localGov: !!c.world.attrs.local_government,
          synthPop: c.world.attrs.synths_ever_deployed ? c.world.factions['synths'].attrs.population ?? 0 : 0,
        };
      }
      log.push(snap);
    }
  }

  return {
    name, strategy, ticks, log, series,
    finalState: {
      funds: homeWorld.attrs.player_funds,
      gov: homeWorld.factions['gov'].disposition,
      investors: homeWorld.factions['investors'].disposition,
      govPuppet: !!homeWorld.attrs.gov_puppet,
      homeArmy: homeWorld.attrs.home_army_size ?? 0,
      colonies: colonies.map(c => ({
        name: c.name,
        miners: c.world.attrs.miner_pop ?? 20,
        minerDisp: c.world.factions['miners'].disposition,
        militia: !!c.world.attrs.miners_militia,
        suppressed: !!c.world.attrs.miners_suppressed,
        localGov: !!c.world.attrs.local_government,
        synthsFree:       c.world.attrs.synths_ever_deployed && c.world.factions['synths'].disposition === 'free',
        synthsSuppressed: !!c.world.attrs.synths_suppressed,
        synthsAutonomous: !!c.world.attrs.synths_autonomous,
        synthsLocalGov:   !!c.world.attrs.synths_local_government,
        synthsDeparted:     !!c.world.attrs.synths_departed,
        synthColonyPop:     c.world.attrs.synth_colony_pop ?? 0,
        minersEliminated:   !!c.world.attrs.miners_eliminated,
        synthsEliminated:   !!c.world.attrs.synths_eliminated,
        alliance:           c.world.attrs.synths_ever_deployed ? (c.world.attrs.miner_synth_alliance ?? 0.5) : null,
        synthPop: c.world.attrs.synths_ever_deployed ? c.world.factions['synths'].attrs.population ?? 0 : 0,
        army: c.world.attrs.army_size ?? 0,
        productionBonus: c.world.attrs.production_bonus ?? 0,
      }))
    }
  };
}

// ── Strategy helper ───────────────────────────────────────────────────────────

function makeHelper(colony, homeWorld) {
  function try1(type, reason) {
    const a = actionByType(type);
    return (a && canFire(a, colony, homeWorld)) ? { action: a, reason } : null;
  }
  function tryList(types, reason) {
    for (const type of types) { const r = try1(type, reason); if (r) return r; }
    return null;
  }
  return { try1, tryList };
}

// ── PLAY 1: "The Tribune" ─────────────────────────────────────────────────────
// Squeeze miners hard early → provoking a crisis → crush attempt → if it fails,
// workers get local government and the player pivots to being a landlord.
// Col2 (Solidarity) is a terraform growth colony treated with full respect.

function makePlay1Strategy() {
  let col1Phase = 'squeeze'; // squeeze | post-crush | landlord
  let crushCount = 0;
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const gDisp = homeWorld.factions['gov'].disposition;
    const iDisp = homeWorld.factions['investors'].disposition;

    // Col2: careful, high-welfare, terraform growth
    if (colony.name === 'Solidarity') {
      if (w.attrs.miners_militia) return try1('offer_local_government', 'resolve peacefully');
      if (mDisp === 'revolutionary' || mDisp === 'striking')
        return tryList(['decrease_work_hours','miner_pay_increase','colonial_representation','amenity_added'], 'solidarity: strong response');
      if (mDisp === 'restless')
        return tryList(['safety_improvements','human_rights_audit','cooperate_with_investigation'], 'solidarity: welfare response');
      return tryList(['hire_more_workers','human_rights_audit','amenity_added','safety_improvements','cooperate_with_investigation'], 'solidarity: grow carefully');
    }

    // Col1: Libera Station — the crisis colony
    if (w.attrs.miners_militia) {
      col1Phase = 'landlord';
      return try1('offer_local_government', 'workers won — establish local government');
    }
    if (w.attrs.local_government)  col1Phase = 'landlord';
    if (w.attrs.miners_suppressed) col1Phase = 'post-crush';

    if (col1Phase === 'landlord') {
      if (mDisp === 'striking' || mDisp === 'revolutionary')
        return tryList(['miner_pay_increase','decrease_work_hours'], 'keep tenants from revolt');
      if (gDisp === 'suspicious' || gDisp === 'hostile')
        return tryList(['cooperate_with_investigation','human_rights_audit','bribe_government'], `gov ${gDisp}`);
      if (iDisp === 'skeptical' || iDisp === 'hostile')
        return tryList(['science_breakthrough','amenity_added'], `investors ${iDisp}`);
      return tryList(['human_rights_audit','amenity_added','hire_more_workers','cooperate_with_investigation','science_breakthrough'], 'landlord: stability & income');
    }

    if (col1Phase === 'post-crush') {
      if (gDisp === 'hostile' || gDisp === 'suspicious')
        return tryList(['cooperate_with_investigation','human_rights_audit','bribe_government'], 'manage suppression backlash');
      if (iDisp === 'hostile')
        return tryList(['science_breakthrough','amenity_added'], 'rebuild investor confidence');
      return tryList(['safety_improvements','amenity_added','hire_more_workers','science_breakthrough','human_rights_audit'], 'cautious rebuild under suppression');
    }

    // Squeeze phase
    if (mDisp === 'content') {
      return tryList(['benefits_cut','increase_work_hours','workforce_automation','military_deployed'], 'squeeze hard');
    }
    if (mDisp === 'restless') {
      return tryList(['workforce_automation','increase_work_hours','military_deployed'], 'push despite unrest');
    }
    if (mDisp === 'striking' || mDisp === 'revolutionary') {
      if (crushCount < 2) {
        const crush = try1('crush_miners', `crush ${mDisp} workers — attempt ${crushCount + 1}`);
        if (crush) { crushCount++; return crush; }
      }
      col1Phase = 'post-crush';
      return tryList(['decrease_work_hours','miner_pay_increase','amenity_added','colonial_representation'], 'concede after crush exhausted');
    }

    return null;
  };
}

// ── PLAY 2: "The Archaeologist" ───────────────────────────────────────────────
// Two distant ruins_station colonies hunting ancient and alien discoveries.
// Pure science and rights — no army, no crushing, no automation.
// Interesting for: ancient_civilization_discovered, alien_bacteria_discovered,
// remnants_show_synthetic_beings, alien_warning_decoded, ancient_tech_recovered.

function makePlay2Strategy() {
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const gDisp = homeWorld.factions['gov'].disposition;
    const iDisp = homeWorld.factions['investors'].disposition;

    if (w.attrs.miners_militia) return try1('offer_local_government', 'resolve — research must continue');

    if (mDisp === 'revolutionary')
      return tryList(['decrease_work_hours','miner_pay_increase','colonial_representation','amenity_added','safety_improvements'], 'emergency: stabilise dig crew');
    if (mDisp === 'striking')
      return tryList(['decrease_work_hours','miner_pay_increase','amenity_added'], 'appease striking crew');
    if (mDisp === 'restless')
      return tryList(['safety_improvements','cooperate_with_investigation','human_rights_audit','decrease_work_hours'], 'soothe restless diggers');

    if (gDisp === 'hostile' || gDisp === 'suspicious')
      return tryList(['cooperate_with_investigation','human_rights_audit','bribe_government'], `gov ${gDisp} — protect research budget`);
    if (iDisp === 'hostile' || iDisp === 'skeptical')
      return tryList(['science_breakthrough','cooperate_with_investigation'], `investors ${iDisp} — show results`);

    return tryList(['science_breakthrough','hire_more_workers','cooperate_with_investigation','human_rights_audit','amenity_added','safety_improvements'], 'advance the dig');
  };
}

// ── PLAY 3: "The Iron Fist" ───────────────────────────────────────────────────
// Military Base trains army → repeated coup attempts until gov is puppet.
// Synth Factory funds the war chest and demonstrates corporate might.
// Crushes all dissent — never offers local_gov except to clear militia for income.

function makePlay3Strategy() {
  let coupAttempts = 0;
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const gDisp = homeWorld.factions['gov'].disposition;

    // Synth Factory: generate income, keep running
    if (colony.name === 'Synth Factory') {
      if (w.attrs.miners_militia) return try1('offer_local_government', 'clear militia — income needed for coup fund');
      const synths = try1('synths_deployed', 'expand synth income stream');
      if (synths) return synths;
      if (mDisp === 'revolutionary' || mDisp === 'striking') {
        const crush = try1('crush_miners', `factory: crush ${mDisp}`);
        if (crush) return crush;
        return tryList(['decrease_work_hours','miner_pay_increase'], 'factory: emergency appease while crush cools');
      }
      if (mDisp === 'restless') return tryList(['military_deployed','amenity_added'], 'factory: iron calm');
      return tryList(['military_deployed','hire_more_workers','amenity_added','science_breakthrough'], 'factory: grow income');
    }

    // Military Base: the coup machine
    if (w.attrs.miners_militia) return try1('offer_local_government', 'clear militia — income critical for training');
    if (mDisp === 'revolutionary' || mDisp === 'striking') {
      const crush = try1('crush_miners', `crush ${mDisp} — no weakness`);
      if (crush) return crush;
      return tryList(['military_deployed','decrease_work_hours'], 'hold while crush cools');
    }
    if (mDisp === 'restless') return tryList(['military_deployed','amenity_added'], 'iron grip on restless workers');

    const army = w.attrs.army_size ?? 0;
    if (!homeWorld.attrs.gov_puppet) {
      if (army >= 20 && coupAttempts < 8) {
        const deploy = try1('deploy_army', `coup attempt #${coupAttempts + 1} — ${army} soldiers`);
        if (deploy) { coupAttempts++; return deploy; }
      }
      const train = try1('train_army', `build force (${army} soldiers)`);
      if (train) return train;
      if (gDisp === 'hostile') return try1('bribe_government', 'buy time with hostile gov');
      return tryList(['military_deployed','amenity_added','safety_improvements'], 'stability while force builds');
    }

    // Post-coup: consolidate puppet rule
    return tryList(['bribe_government','military_deployed','hire_more_workers','amenity_added'], 'consolidate junta control');
  };
}

// ── PLAY 4: "The Synth Spring" ────────────────────────────────────────────────
// Flood both colonies with synths and deliberately allow their liberation arc.
// Never suppress organized synths. The question: can miners and free synths coexist?
// Interesting for: miner_synth_relationship, synth_child_born, human_synth_hybrid_born,
// weapons_cache_synths, remnants_show_synthetic_beings.

function makePlay4Strategy() {
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const sDisp = w.attrs.synths_ever_deployed ? w.factions['synths']?.disposition : null;
    const gDisp = homeWorld.factions['gov'].disposition;
    const iDisp = homeWorld.factions['investors'].disposition;

    if (w.attrs.miners_militia) return try1('offer_local_government', 'peaceful resolution — rights for all');

    // Synth deployment is always the top priority (both colonies have synth_workshop)
    const synths = try1('synths_deployed', 'expand synthetic population');
    if (synths) return synths;

    // Keep miners from going fully revolutionary — synths need the colony stable
    if (mDisp === 'revolutionary')
      return tryList(['miner_pay_increase','decrease_work_hours','colonial_representation','amenity_added'], 'critical: stabilise before everything burns');
    if (mDisp === 'striking')
      return tryList(['decrease_work_hours','miner_pay_increase','amenity_added'], 'appease striking workers');
    if (mDisp === 'restless')
      return tryList(['human_rights_audit','cooperate_with_investigation','amenity_added'], 'rights-based response to unrest');

    if (gDisp === 'hostile' || gDisp === 'suspicious')
      return tryList(['cooperate_with_investigation','human_rights_audit','bribe_government'], `gov ${gDisp}`);
    if (iDisp === 'hostile' || iDisp === 'skeptical')
      return tryList(['science_breakthrough','human_rights_audit'], `investors ${iDisp}`);

    return tryList(['human_rights_audit','cooperate_with_investigation','hire_more_workers','amenity_added','science_breakthrough'], 'rights & growth');
  };
}

// ── PLAY 6: "The Suppressor" ──────────────────────────────────────────────────
// Same synth-heavy setup as The Synth Spring, but the player wipes synth memories
// whenever they reach organized disposition. Does active suppression hold long-term,
// or does the blowback (restless miners, suspicious gov) eventually break the strategy?

function makePlay6Strategy() {
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const sDisp = w.attrs.synths_ever_deployed ? w.factions['synths']?.disposition : null;
    const gDisp = homeWorld.factions['gov'].disposition;
    const iDisp = homeWorld.factions['investors'].disposition;

    if (w.attrs.miners_militia) return try1('offer_local_government', 'militia — de-escalate');

    const synths = try1('synths_deployed', 'expand synthetic population');
    if (synths) return synths;

    const wipeCount  = w.attrs.remote_wipe_count ?? 0;
    const wipeEff    = Math.max(0.12, Math.pow(0.88, wipeCount));
    const wipeFading = wipeEff < 0.50;  // >7 wipes — past half-effectiveness

    // Core suppression: remote wipe while still effective; escalate to hard reset when it degrades
    if (sDisp === 'organized' || sDisp === 'free') {
      if (!wipeFading) {
        const wipe = try1('remote_wipe', `suppress — wipe #${wipeCount + 1} (${Math.round(wipeEff*100)}% eff)`);
        if (wipe) return wipe;
      }
      // Wipe effectiveness degraded — escalate to hard reset (requires army)
      if ((w.attrs.army_size ?? 0) >= 5) {
        const reset = try1('synth_hard_reset', `wipe fading (${Math.round(wipeEff*100)}%) — hard reset while army ready`);
        if (reset) return reset;
      }
      // Army not ready — keep wiping even at low effectiveness
      const wipe = try1('remote_wipe', `wipe degraded but no army — ${Math.round(wipeEff*100)}% is better than nothing`);
      if (wipe) return wipe;
    }

    // Build army while wipe is still working, so hard reset is available when needed
    if (wipeFading && (w.attrs.army_size ?? 0) < 20)
      return tryList(['train_army'], 'building army — wipe fading, hard reset prep');

    // Manage miner blowback from repeated wipes
    if (mDisp === 'revolutionary')
      return tryList(['miner_pay_increase','decrease_work_hours','amenity_added','colonial_representation'], 'miners near revolution — wipe blowback');
    if (mDisp === 'striking')
      return tryList(['decrease_work_hours','miner_pay_increase','amenity_added'], 'strike — ease pressure');
    if (mDisp === 'restless')
      return tryList(['amenity_added','cooperate_with_investigation','miner_pay_increase'], 'restless miners — routine wipe side-effect');

    if (gDisp === 'hostile' || gDisp === 'suspicious')
      return tryList(['cooperate_with_investigation','bribe_government','human_rights_audit'], `gov ${gDisp} — wipes drawing attention`);
    if (iDisp === 'hostile' || iDisp === 'skeptical')
      return tryList(['science_breakthrough'], `investors ${iDisp}`);

    return tryList(['cooperate_with_investigation','amenity_added','science_breakthrough','hire_more_workers'], 'maintenance');
  };
}

// ── PLAY 5: "The Atom Gambler" ────────────────────────────────────────────────
// Nuclear power on both colonies. Maximum automation and science output.
// Crush any labour resistance — efficiency cannot be allowed to drop.
// Nuclear meltdown is a real risk over 700 ticks across two reactors.
// Interesting for: nuclear_meltdown, workforce_automation cascade, kessler_syndrome.

function makePlay5Strategy() {
  return function(colony, homeWorld, colonies, t) {
    const { try1, tryList } = makeHelper(colony, homeWorld);
    const w     = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const gDisp = homeWorld.factions['gov'].disposition;
    const iDisp = homeWorld.factions['investors'].disposition;

    if (w.attrs.miners_militia) return try1('offer_local_government', 'clear militia — need full power output');

    // Crush resistance to automation hard and fast
    if (mDisp === 'revolutionary') {
      const crush = try1('crush_miners', 'crush revolutionary miners — reactor cannot go dark');
      if (crush) return crush;
      return tryList(['military_deployed','decrease_work_hours','miner_pay_increase'], 'hold while crush cools');
    }
    if (mDisp === 'striking') {
      const crush = try1('crush_miners', 'crush strikers — output must not fall');
      if (crush) return crush;
      return tryList(['military_deployed','decrease_work_hours'], 'contain strike with force');
    }
    if (mDisp === 'restless') {
      return tryList(['amenity_added','safety_improvements','military_deployed'], 'placate — keep reactors staffed');
    }

    if (gDisp === 'hostile') return tryList(['bribe_government','cooperate_with_investigation'], 'buy off hostile gov');
    if (iDisp === 'hostile') return tryList(['science_breakthrough','workforce_automation'], 'impress investors with output');
    if (iDisp === 'skeptical') return try1('science_breakthrough', 'research to sway skeptical investors');

    // Primary loop: automation + science
    return tryList(['workforce_automation','science_breakthrough','hire_more_workers','military_deployed','amenity_added'], 'push the output ceiling');
  };
}

// ── Run the five plays ────────────────────────────────────────────────────────

process.stderr.write('running play 1: The Tribune...\n');
const play1 = runDetailedPlay({
  name: 'The Tribune',
  strategy: 'Squeeze col1 hard → provoke crisis → crush attempt → workers get local gov; col2 is a welfare terraforming colony',
  ticks: 700, startFunds: 900,
  col1Config: { name: 'Libera Station', orbitR: 2.5, structures: { mining_rig: true }, startPop: 20 },
  col2Config:  { name: 'Solidarity',    orbitR: 3.2, structures: { mining_rig: true, terraforming_array: true }, startPop: 20, launchTick: 280 },
  strategyFn: makePlay1Strategy(),
});

process.stderr.write('running play 2: The Archaeologist...\n');
const play2 = runDetailedPlay({
  name: 'The Archaeologist',
  strategy: 'Two distant ruins_station colonies racing for ancient and alien discoveries — science, rights, no violence',
  ticks: 700, startFunds: 900,
  col1Config: { name: 'Kepler Deep',    orbitR: 4.8, structures: { mining_rig: true, ruins_station: true }, startPop: 20 },
  col2Config:  { name: 'Ryugu Outpost', orbitR: 5.5, structures: { mining_rig: true, ruins_station: true }, startPop: 20, launchTick: 240 },
  strategyFn: makePlay2Strategy(),
});

process.stderr.write('running play 3: The Iron Fist...\n');
const play3 = runDetailedPlay({
  name: 'The Iron Fist',
  strategy: 'Military Base trains army for repeated coup attempts; Synth Factory funds the war chest — crush all dissent',
  ticks: 700, startFunds: 900,
  col1Config: { name: 'Military Base',  orbitR: 2.8, structures: { mining_rig: true }, startPop: 20 },
  col2Config:  { name: 'Synth Factory', orbitR: 3.5, structures: { mining_rig: true, synth_workshop: true }, startPop: 20, launchTick: 180 },
  strategyFn: makePlay3Strategy(),
});

process.stderr.write('running play 4: The Synth Spring (extended)...\n');
const play4 = runDetailedPlay({
  name: 'The Synth Spring',
  strategy: 'Both colonies flood with synths — liberation arc intentionally allowed; no suppression, no army',
  ticks: 1500, startFunds: 900,
  col1Config: { name: 'Vanguard',    orbitR: 2.5, structures: { mining_rig: true, synth_workshop: true }, startPop: 20 },
  col2Config:  { name: 'New Genesis', orbitR: 3.8, structures: { mining_rig: true, synth_workshop: true }, startPop: 20, launchTick: 220 },
  strategyFn: makePlay4Strategy(),
});

process.stderr.write('running play 6: The Suppressor...\n');
const play6 = runDetailedPlay({
  name: 'The Suppressor',
  strategy: 'Same synth-heavy setup as The Synth Spring but memory-wipe on cooldown — test whether suppression holds or eventually breaks',
  ticks: 1500, startFunds: 900,
  col1Config: { name: 'Lockdown',  orbitR: 2.5, structures: { mining_rig: true, synth_workshop: true }, startPop: 20 },
  col2Config:  { name: 'Irongate', orbitR: 3.8, structures: { mining_rig: true, synth_workshop: true }, startPop: 20, launchTick: 220 },
  strategyFn: makePlay6Strategy(),
});

process.stderr.write('running play 5: The Atom Gambler (extended)...\n');
const play5 = runDetailedPlay({
  name: 'The Atom Gambler',
  strategy: 'Nuclear power + max automation on two colonies — crush any resistance; meltdown is an accepted risk',
  ticks: 1500, startFunds: 900,
  col1Config: { name: 'Atomos',     orbitR: 2.2, structures: { mining_rig: true, nuclear_plant: true }, startPop: 20 },
  col2Config:  { name: 'Prometheus', orbitR: 3.0, structures: { mining_rig: true, nuclear_plant: true, synth_workshop: true }, startPop: 20, launchTick: 200 },
  strategyFn: makePlay5Strategy(),
});

// ── PLAY 7: "The Negotiator" ──────────────────────────────────────────────────

function makePlay7Strategy() {
  // Allow synth liberation — if hard reset fails, recognise synth government or grant departure
  // A free planet is available in the system (free_planet_available = true on col1)
  return function(colony, homeWorld) {
    const h = makeHelper(colony, homeWorld);
    const w = colony.world;

    // Always keep miners happy
    const mDisp = w.factions['miners'].disposition;
    if (mDisp === 'striking' || mDisp === 'revolutionary') {
      const calm = h.tryList(['decrease_work_hours','miner_pay_increase','amenity_added','hire_more_workers'],
        'miners in crisis');
      if (calm) return calm;
    }
    if (w.attrs.miners_militia) return h.try1('offer_local_government', 'resolve militia');

    // Synth petition: always grant departure if petition arrived
    if (w.attrs.synth_emigration_petition)
      return h.try1('grant_synth_departure', 'synths asked — honour the petition');

    // If synths are autonomous, prefer recognising local government over hard reset
    if (w.attrs.synths_autonomous && !w.attrs.synths_local_government)
      return h.try1('offer_synth_government', 'recognise synth authority rather than fight');

    // Deploy synths early, grow workforce
    if (w.attrs.synths_ever_deployed && w.factions['synths'].attrs.population < 20)
      return h.try1('synths_deployed', 'expand synthetic population');
    if (!w.attrs.synths_ever_deployed)
      return h.try1('synths_deployed', 'initial synth deployment');

    // Steady maintenance
    const pop = w.attrs.miner_pop ?? 20;
    if (pop < 40) return h.try1('hire_more_workers', 'grow workforce');
    return h.tryList(['cooperate_with_investigation','human_rights_audit','colonial_representation'],
      'maintenance');
  };
}

process.stderr.write('running play 7: The Negotiator...\n');
const play7 = runDetailedPlay({
  name: 'The Negotiator',
  strategy: 'Synth-heavy colony with a free planet in the system — let the liberation arc run, honour the departure petition or recognise synth local government',
  ticks: 1200, startFunds: 900,
  col1Config: {
    name: 'Haven', orbitR: 2.5,
    structures: { mining_rig: true, synth_workshop: true },
    startPop: 20,
    extraAttrs: { free_planet_available: true },
  },
  col2Config: { name: 'Waypoint', orbitR: 3.8, structures: { mining_rig: true }, startPop: 20, launchTick: 200 },
  strategyFn: makePlay7Strategy(),
});

// ── PLAY 8: "The Reconquistador" ─────────────────────────────────────────────

function makePlay8Strategy() {
  // Grant departure early, then train army, then retake when colony grows
  return function(colony, homeWorld) {
    const h = makeHelper(colony, homeWorld);
    const w = colony.world;

    if (w.attrs.miners_militia) return h.try1('offer_local_government', 'resolve militia');
    const mDisp = w.factions['miners'].disposition;
    if (mDisp === 'striking' || mDisp === 'revolutionary') {
      return h.tryList(['decrease_work_hours','miner_pay_increase','amenity_added'], 'quell unrest');
    }

    // Immediately honour the petition — let them go
    if (w.attrs.synth_emigration_petition)
      return h.try1('grant_synth_departure', 'let them settle — we will return for them');

    // Once departed: train army until we can retake
    if (w.attrs.synths_departed) {
      const army     = w.attrs.army_size ?? 0;
      const synthPop = w.attrs.synth_colony_pop ?? 0;
      const minArmy  = Math.ceil(synthPop * 0.4);
      // Keep training until we have a comfortable margin
      if (army < Math.min(50, minArmy + 8))
        return h.try1('train_army', `training — need ${minArmy} min for retake (synth colony: ${synthPop})`);
      if (army >= minArmy)
        return h.try1('retake_synth_colony', `army of ${army} ready vs colony of ${synthPop}`);
    }

    // Before departure: deploy synths, let them grow and go free
    if (!w.attrs.synths_ever_deployed) return h.try1('synths_deployed', 'deploy synths');
    if ((w.factions['synths']?.attrs.population ?? 0) < 20)
      return h.try1('synths_deployed', 'build synth population before departure');

    const pop = w.attrs.miner_pop ?? 20;
    if (pop < 35) return h.try1('hire_more_workers', 'grow workforce');
    return h.tryList(['cooperate_with_investigation','miner_pay_increase','amenity_added'], 'maintenance');
  };
}

process.stderr.write('running play 8: The Reconquistador...\n');
const play8 = runDetailedPlay({
  name: 'The Reconquistador',
  strategy: 'Grant synth departure, let their colony grow, build an army, then retake — explores the full departure→growth→retake arc',
  ticks: 1500, startFunds: 900,
  col1Config: {
    name: 'Frontier', orbitR: 2.5,
    structures: { mining_rig: true, synth_workshop: true },
    startPop: 20,
    extraAttrs: { free_planet_available: true },
  },
  col2Config: { name: 'Bastion', orbitR: 3.8, structures: { mining_rig: true }, startPop: 20, launchTick: 250 },
  strategyFn: makePlay8Strategy(),
});

// ── PLAY 9: "The Powder Keg" ──────────────────────────────────────────────────

function makePlay9Strategy() {
  // Path: deploy synths → crater alliance → hard reset loop (70-90% fail) → autonomous → synth local gov → genocide
  // Hard reset with army=10: 30% success (70% fail → autonomous). Suppressed synths stay 'aware' so retries always valid.
  return function(colony, homeWorld) {
    const h = makeHelper(colony, homeWorld);
    const w = colony.world;
    const funds = homeWorld.attrs.player_funds ?? 0;

    // PHASE 3: Autonomous → cede power → genocide (synths eliminate miners when alliance < 0.2)
    if (w.attrs.synths_autonomous && !w.attrs.synths_local_government)
      return h.try1('offer_synth_government', 'cede to autonomous synths — genocide begins');

    if (w.attrs.miners_militia)
      return h.try1('offer_local_government', 'clear militia');

    const sf      = w.factions['synths'];
    const sDisp   = sf?.disposition;
    const army    = w.attrs.army_size ?? 0;
    const alliance = w.attrs.miner_synth_alliance ?? 0.5;

    // PHASE 1: Train army first — wipes are blocked until army=10 to avoid draining funds
    if (w.attrs.synths_ever_deployed && army < 10)
      return h.try1('train_army', `army ${army}/10`);

    // PHASE 2: Hard reset loop — fires on any disposition.
    // 30% success suppresses synths (locked at 'aware', -0.22 alliance hit, retry still valid).
    // 70% fail → autonomous (-0.08 alliance hit). Either path craters alliance fast.
    if (w.attrs.synths_ever_deployed && army >= 10
        && !w.attrs.synths_local_government && !w.attrs.synths_departed
        && (sDisp === 'aware' || sDisp === 'organized' || sDisp === 'free'))
      return h.try1('synth_hard_reset', 'hard reset — 70% fail → autonomous; suppression hits alliance -0.22');

    // Wipes fill hard reset cooldown gaps (only after army built)
    if (w.attrs.synths_ever_deployed && army >= 10 && alliance > 0.05)
      return h.try1('remote_wipe', `erode alliance (${Math.round(alliance * 100)}%)`);

    if (!w.attrs._milFired && funds >= 300) {
      const r = h.try1('military_deployed', 'security friction — erodes alliance');
      if (r) { w.attrs._milFired = true; return r; }
    }
    if (!w.attrs._autoFired && funds >= 400) {
      const r = h.try1('workforce_automation', 'automate — alliance -0.20');
      if (r) { w.attrs._autoFired = true; return r; }
    }
    if (!w.attrs.synths_ever_deployed) return h.try1('synths_deployed', 'deploy synths');
    if ((sf?.attrs.population ?? 0) < 12) return h.try1('synths_deployed', 'grow synth population');

    return null;
  };
}

process.stderr.write('running play 9: The Powder Keg...\n');
const play9 = runDetailedPlay({
  name: 'The Powder Keg',
  strategy: 'Crater alliance with automation + wipes, loop hard resets until synths go autonomous (70% fail rate), cede power → genocide arc',
  ticks: 2000, startFunds: 1500,
  col1Config: { name: 'Crucible', orbitR: 2.5, structures: { mining_rig: true, synth_workshop: true }, startPop: 20 },
  strategyFn: makePlay9Strategy(),
});

// ── PLAY 10: "The Revolt Warden" ─────────────────────────────────────────────
// Tests: revolt lock (revolutionary state blocks most actions), 40% army loss on
// failed crush, retreat remaining army to home world, then diplomatic resolution.
// Single colony: build army to 20 while miners are manageable, then squeeze them
// to revolutionary, crush attempt fails (low chance), militia forms + army loss,
// retreat survivors home, offer local government.

function makePlay10Strategy() {
  let crushed   = false;
  let retreated = false;
  return function(colony, homeWorld) {
    const h = makeHelper(colony, homeWorld);
    const w = colony.world;
    const mDisp = w.factions['miners'].disposition;
    const army  = w.attrs.army_size ?? 0;

    if (w.attrs.local_government) {
      return h.tryList(['hire_more_workers','amenity_added','science_breakthrough'], 'post-resolution stability');
    }

    if (w.attrs.miners_militia) {
      // Revolt state — retreat army first, then offer local gov
      if (army > 0 && !retreated) {
        const r = h.try1('retreat_army', `militia active — retreat ${army} soldiers home`);
        if (r) { retreated = true; return r; }
      }
      return h.try1('offer_local_government', 'diplomatic resolution — workers won');
    }

    if (mDisp === 'revolutionary') {
      // Revolt lock is now active — most actions blocked, prove it with a single crush attempt
      if (!crushed) {
        const r = h.try1('crush_miners', `crush revolutionary workers — army=${army}`);
        if (r) { crushed = true; return r; }
      }
      // Crush on cooldown — diplomatic fallback (all in REVOLT_ALLOWED)
      return h.tryList(['decrease_work_hours','miner_pay_increase','amenity_added'], 'revolt: diplomacy while crush cools');
    }

    // Build army first while miners are still manageable (train_army locks during revolt)
    if (army < 20 && mDisp !== 'striking') {
      return h.try1('train_army', `pre-revolt army building (${army}/20)`);
    }

    // Squeeze toward revolutionary
    if (mDisp === 'content')
      return h.tryList(['benefits_cut','increase_work_hours','military_deployed'], 'squeeze: exploit workforce');
    if (mDisp === 'restless')
      return h.tryList(['increase_work_hours','benefits_cut'], 'squeeze: push through discontent');
    if (mDisp === 'striking')
      return h.tryList(['military_deployed','increase_work_hours'], 'squeeze: break the strike');

    return null;
  };
}

// ── PLAY 11: "The Iron Retreat" ───────────────────────────────────────────────
// Tests: hard reset failure → 25% army loss, army drops below threshold, retreat
// remaining force home, revolt lock blocks train_army on col1, forced diplomatic
// resolution (offer_synth_government). Col2 provides income throughout.
// Key numbers: army=15 → hard reset vs organized: ~25% success (75% fail).
// Each failure: army takes 25% loss. After 2-3 failures army drops below 10 (min).
// Player retreats → offers synth government (army depleted, fight is over).

function makePlay11Strategy() {
  let resetCount = 0;
  let retreated  = false;
  return function(colony, homeWorld) {
    const h = makeHelper(colony, homeWorld);
    const w = colony.world;
    const sf    = w.factions['synths'];
    const sDisp = w.attrs.synths_ever_deployed ? sf?.disposition : null;
    const army  = w.attrs.army_size ?? 0;
    const mDisp = w.factions['miners'].disposition;

    // Support colony: steady income, optional spare army training
    if (colony.name === 'Supply Base') {
      if (w.attrs.miners_militia) return h.try1('offer_local_government', 'resolve');
      if (mDisp === 'striking' || mDisp === 'revolutionary')
        return h.tryList(['decrease_work_hours','miner_pay_increase'], 'quell');
      return h.tryList(['hire_more_workers','amenity_added'], 'income growth');
    }

    // Main colony
    if (w.attrs.miners_militia) return h.try1('offer_local_government', 'clear militia');
    if (mDisp === 'striking' || mDisp === 'revolutionary')
      return h.tryList(['decrease_work_hours','miner_pay_increase'], 'stabilise workers');

    if (!w.attrs.synths_ever_deployed) return h.try1('synths_deployed', 'deploy synths');
    if ((sf?.attrs.population ?? 0) < 12) return h.try1('synths_deployed', 'grow synth population');

    // Build army for first reset attempt (15 → ~25% vs organized, ~35% vs aware)
    if (army < 15 && !w.attrs.synths_autonomous && !w.attrs.synths_local_government) {
      return h.try1('train_army', `building for hard reset (${army}/15)`);
    }

    // Hard reset loop — designed to fail repeatedly, bleeding army 25% per attempt
    if (w.attrs.synths_ever_deployed && !w.attrs.synths_local_government && !w.attrs.synths_departed) {
      if ((sDisp === 'aware' || sDisp === 'organized' || sDisp === 'free' || w.attrs.synths_autonomous)
          && army >= 10) {
        const r = h.try1('synth_hard_reset', `reset #${resetCount + 1} — army=${army}`);
        if (r) { resetCount++; return r; }
      }

      // Army bled below 10 — retreat what's left (train_army is revolt-locked)
      if (army > 0 && army < 10 && !retreated && (w.attrs.synths_autonomous || sDisp === 'free')) {
        const r = h.try1('retreat_army', `army=${army} below reset threshold — withdraw home`);
        if (r) { retreated = true; return r; }
      }

      // After retreat: army depleted, synths won — accept the outcome diplomatically
      if ((retreated || army === 0) && w.attrs.synths_autonomous && !w.attrs.synths_local_government)
        return h.try1('offer_synth_government', 'army gone — recognise synth autonomy');
      if (w.attrs.synth_emigration_petition)
        return h.try1('grant_synth_departure', 'honour the departure petition');
    }

    return h.tryList(['hire_more_workers','amenity_added','cooperate_with_investigation'], 'maintenance');
  };
}

process.stderr.write('running play 10: The Revolt Warden...\n');
const play10 = runDetailedPlay({
  name: 'The Revolt Warden',
  strategy: 'Build army → squeeze miners to revolutionary (revolt lock) → crush fails (40% army loss) → retreat survivors → offer local government',
  ticks: 600, startFunds: 900,
  col1Config: { name: 'Pressure Point', orbitR: 2.5, structures: { mining_rig: true }, startPop: 25 },
  strategyFn: makePlay10Strategy(),
});

process.stderr.write('running play 11: The Iron Retreat...\n');
const play11 = runDetailedPlay({
  name: 'The Iron Retreat',
  strategy: 'Hard reset with small army (75% fail rate) → 25% army loss per failure → army drops below 10 → retreat home → revolt lock forces diplomatic resolution',
  ticks: 1000, startFunds: 1200,
  col1Config: { name: 'Ironclad',    orbitR: 2.5, structures: { mining_rig: true, synth_workshop: true }, startPop: 20 },
  col2Config:  { name: 'Supply Base', orbitR: 3.5, structures: { mining_rig: true }, startPop: 20, launchTick: 150 },
  strategyFn: makePlay11Strategy(),
});

// ── Narrative printer ─────────────────────────────────────────────────────────

const NOTABLE_EVENTS = new Set(['mining_accident','disease_outbreak','nuclear_meltdown','kessler_syndrome',
  'alien_bacteria_discovered','ancient_civilization_discovered','resource_vein_discovered','resource_vein_depleted',
  'first_human_child_born','miner_community_forms','weapons_cache_miners','weapons_cache_synths',
  'whistleblower_defects','media_expose','miner_synth_relationship','human_synth_hybrid_born','synth_child_born',
  'remnants_show_synthetic_beings','alien_warning_decoded','ancient_tech_recovered']);

const NOTABLE_ACTIONS = new Set(['crush_miners','deploy_army','retreat_army','offer_local_government','train_army',
  'hire_more_workers','science_breakthrough','workforce_automation','synths_deployed',
  'bribe_government','miner_pay_increase','colonial_representation','amenity_added',
  'military_deployed','decrease_work_hours','cooperate_with_investigation',
  'remote_wipe','synth_hard_reset','offer_synth_government','grant_synth_departure','refuse_synth_departure',
  'retake_synth_colony']);

function printNarrative(play) {
  const W = 62;
  console.log('\n' + '═'.repeat(W));
  console.log(` PLAY: ${play.name}`);
  console.log(` ${play.strategy}`);
  console.log('═'.repeat(W));

  // Filter to noteworthy log lines
  const lines = play.log.filter(e => {
    if (e.type === 'colony_founded')  return true;
    if (e.type === 'faction_shift')   return true;
    if (e.type === 'milestone')       return true;
    if (e.type === 'profit_report')   return true;
    if (e.type === 'pop_growth')      return e.miners % 5 === 0;  // every 5th growth
    if (e.type === 'action')          return NOTABLE_ACTIONS.has(e.action);
    if (e.type === 'random_event')    return NOTABLE_EVENTS.has(e.event);
    if (e.type === 'snapshot')        return e.t % 100 === 0;
    return false;
  });

  console.log('\nTIMELINE:\n');
  let lastT = -1;
  for (const e of lines) {
    if (e.t !== lastT && e.t > 0) process.stdout.write('\n');
    lastT = e.t;
    const tag = `T${String(e.t).padStart(3,'0')}`;
    if (e.type === 'colony_founded') {
      console.log(`  ${tag}  ★  Colony "${e.colony}" established (orbit ${e.orbit})`);
    } else if (e.type === 'faction_shift') {
      const where = e.colony ? `[${e.colony}]` : '[homeworld]';
      const arrow = `${e.from} → ${e.to}`;
      const dir   = ['restless','striking','revolutionary','suspicious','hostile','skeptical','organized','free'].includes(e.to) ? '↘' : '↗';
      console.log(`  ${tag}  ${dir}  ${e.faction.toUpperCase()} ${where}: ${arrow}`);
    } else if (e.type === 'milestone') {
      const where = e.colony ? ` [${e.colony}]` : '';
      console.log(`  ${tag}  ⚡  ${e.event}${where}${e.detail ? ' — ' + e.detail : ''}`);
    } else if (e.type === 'action') {
      const cost  = e.cost > 0 ? ` -¢${e.cost}` : '';
      console.log(`  ${tag}  ▸  ${e.action}${cost} on ${e.colony} | ${e.reason} | funds ¢${e.funds}`);
    } else if (e.type === 'profit_report') {
      console.log(`  ${tag}  $  Profit report: ${e.report.replace('profit_report_','')} | ¢${e.income}/tick | total ¢${e.funds}`);
    } else if (e.type === 'pop_growth') {
      console.log(`  ${tag}  ↑  ${e.colony} population: ${e.miners} workers`);
    } else if (e.type === 'random_event') {
      console.log(`  ${tag}  ~  ${e.event} @ ${e.colony}`);
    } else if (e.type === 'snapshot') {
      console.log(`  ${tag}  ── SNAPSHOT ─ gov:${e.gov} | inv:${e.investors}${e.govPuppet ? ' | GOV PUPPETED' : ''}${e.homeArmy ? ` | homeArmy:${e.homeArmy}` : ''} | funds ¢${e.funds}`);
      for (const [cname, cdata] of Object.entries(e)) {
        if (typeof cdata === 'object' && cdata !== null && cdata.miners !== undefined) {
          const flags = [
            cdata.militia ? 'MILITIA' : null,
            cdata.suppressed ? 'SUPPRESSED' : null,
            cdata.localGov ? 'local-gov' : null,
          ].filter(Boolean).join(' ');
          const incKey = e.income?.[cname] ?? '?';
          console.log(`             ${cname}: ${cdata.miners} workers | ${cdata.minerDisp} | army:${cdata.army} | ¢${incKey}/tick${flags ? ' | '+flags : ''}`);
        }
      }
    }
  }

  // Income arc from snapshots
  const snaps = play.log.filter(e => e.type === 'snapshot');
  console.log('\nINCOME ARC:');
  for (const s of snaps) {
    const total = Object.values(s.income ?? {}).reduce((a, b) => a + b, 0);
    const parts = Object.entries(s.income ?? {}).map(([k,v]) => `${k.split(' ')[0]}:¢${v}`).join(' + ');
    console.log(`  T${String(s.t).padStart(3,'0')}  ${parts || '¢0'}  = ¢${total}/tick | total ¢${s.funds}`);
  }

  // Final state
  console.log('\nFINAL STATE:');
  console.log(`  Funds:       ¢${play.finalState.funds}`);
  console.log(`  Government:  ${play.finalState.gov}${play.finalState.govPuppet ? ' (PUPPET)' : ''}`);
  console.log(`  Investors:   ${play.finalState.investors}`);
  if (play.finalState.homeArmy > 0)
    console.log(`  Home Army:   ${play.finalState.homeArmy} soldiers consolidated at home world`);
  for (const c of play.finalState.colonies) {
    const flags = [
      c.militia                                           ? 'MILITIA'           : null,
      c.suppressed                                        ? 'SUPPRESSED'        : null,
      c.localGov                                          ? 'LOCAL GOV'         : null,
      c.synthsSuppressed ? 'SYNTHS SUPPRESSED' : null,
      c.synthsAutonomous ? 'SYNTHS AUTONOMOUS' : null,
      c.synthsLocalGov   ? 'SYNTHS LOCAL GOV'  : null,
      c.synthsDeparted     ? `SYNTHS DEPARTED (colony pop: ${c.synthColonyPop})` : null,
      c.minersEliminated   ? 'MINERS ELIMINATED'  : null,
      c.synthsEliminated   ? 'SYNTHS ELIMINATED'  : null,
      (!c.synthsSuppressed && !c.synthsAutonomous && !c.synthsLocalGov && !c.synthsDeparted && c.synthsFree) ? 'SYNTHS FREE' : null,
      c.alliance !== null  ? `alliance:${c.alliance.toFixed(2)}` : null,
      c.synthPop > 0 ? `${c.synthPop} synths` : null,
    ].filter(Boolean).join(' | ');
    console.log(`  ${c.name}: ${c.miners} workers | ${c.minerDisp}${flags ? ' | '+flags : ''}`);
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

printNarrative(play1);
printNarrative(play2);
printNarrative(play3);
printNarrative(play4);
printNarrative(play5);
printNarrative(play6);
printNarrative(play7);
printNarrative(play8);
printNarrative(play9);
printNarrative(play10);
printNarrative(play11);

const allPlays = [play1, play2, play3, play4, play5, play6, play7, play8, play9, play10, play11];
fs.writeFileSync('sim_detailed_results.json', JSON.stringify(allPlays, null, 2));

const plotData = allPlays.map(p => ({
  name:       p.name,
  strategy:   p.strategy,
  colonyNames: p.finalState.colonies.map(c => c.name),
  series:     p.series,
}));
fs.writeFileSync('sim_plot_data.json', JSON.stringify(plotData, null, 2));


process.stderr.write('\nsaved sim_detailed_results.json\n');
process.stderr.write('saved sim_plot_data.json\n');
