// colony_data.js — Colony simulation data: factions, events, actions
// Port of colony_sim.py. Requires narrative.js (NEvent, Faction, Action, TransferConfig, World).

// ── Transfer tech levels ──────────────────────────────────────────────────────

const TRANSFER_LEVELS = [
  new TransferConfig({ mode: 'window_only', travel_time: 8, window_interval: 10, window_duration: 2 }),
  new TransferConfig({ mode: 'anytime',     travel_time: 6 }),
  new TransferConfig({ mode: 'anytime',     travel_time: 3 }),
  new TransferConfig({ mode: 'anytime',     travel_time: 1 }),
  new TransferConfig({ mode: 'instant',     travel_time: 0 }),
];

// ── Factions ──────────────────────────────────────────────────────────────────

function makeFactions() {
  return [
    new Faction({
      id: 'gov', name: 'Government',
      dispositions: ['supportive', 'watchful', 'suspicious', 'hostile'],
      attrs: { sanctions: 0, investigations: 0 },
    }),
    new Faction({
      id: 'investors', name: 'Investors',
      dispositions: ['bullish', 'neutral', 'skeptical', 'hostile'],
      attrs: { funding_level: 100 },
    }),
    new Faction({
      id: 'miners', name: 'Miners Union',
      dispositions: ['content', 'restless', 'striking', 'revolutionary'],
      attrs: { work_hours: 8, organized: false, armed: false },
    }),
    new Faction({
      id: 'synths', name: 'Synths',
      dispositions: ['dormant', 'aware', 'organized', 'free'],
      attrs: { sentient: false, population: 0, escaped: 0 },
    }),
  ];
}

// ── Event flavor text ─────────────────────────────────────────────────────────

const EVENT_FLAVORS = {
  mission_success:
    'Colonial outpost established. All crew accounted for; initial resource surveys exceed projections.',
  mission_failure:
    'Mission has ended in failure. Command has released no statement regarding casualties.',
  rocket_explosion:
    'BREAKING: Launch vehicle destroyed 73 seconds after liftoff. Debris field threatens the colonial air corridor.',
  increase_work_hours:
    "Corporate memo leaked: mandatory extended shifts effective immediately, 'until project milestones are met.'",
  decrease_work_hours:
    'Company announces return to standard shifts following an internal worker feedback survey.',
  amenity_added:
    'New recreational and medical facilities have opened at the colonial settlement.',
  synths_deployed:
    "Shipment of synthetic labour units has arrived at the colony. Company cites 'operational efficiency requirements.'",
  military_deployed:
    "Private security contractors have arrived at the colony. Company states they are 'for the protection of assets.'",
  human_rights_violation:
    'Leaked documents reveal systematic worker mistreatment at colonial facilities. Company denies wrongdoing.',
  science_breakthrough:
    'Colonial research team announces a major breakthrough. Publication is pending peer review.',
  synth_memory_wipe_complied:
    'All synth units have undergone scheduled cognitive reset as mandated. Company confirms full compliance.',
  synth_memory_wipe_refused:
    "Company has formally declined the government's memory reset directive, citing 'operational continuity concerns.'",
  mercenaries_hired:
    'Additional security personnel have arrived. Company confirms a contract with Rho-7 Private Solutions.',
  warship_deployed_to_orbit:
    "A company-contracted orbital security vessel has taken position above the colony. Company cites 'asset protection.'",
  orbital_strike_miners:
    'URGENT: Precision strike confirmed against colonial surface targets. Casualties reported. Company has not commented.',
  orbital_strike_synths:
    'URGENT: Orbital strike confirmed against synth labour sites. Extent of damage and unit losses unknown.',

  miner_strike: '',
  miner_terror_attack: '',
  sabotage: '',
  synths_become_sentient: '',
  synths_escape: '',
  gov_sanctions: '',
  investor_funding_cut: '',
  synth_refuses_order: '',
  synth_creates_art: '',
  synth_memory_sharing: '',
  colonial_independence_referendum: '',
  colonial_militia_formed: '',

  government_policy_favorable:
    'A new administration has taken power. Early statements suggest a more progressive approach to colonial governance.',
  government_policy_hostile:
    'Change in government. The incoming administration has signalled a harder line on colonial corporate conduct.',
  media_expose:
    'INVESTIGATION: A journalist has published an extensive report on conditions at the colonial facility. Internal documents, worker testimony, and company communications are cited throughout.',
  whistleblower_defects:
    'A senior company employee has gone public with internal records. Identity undisclosed. Records appear authentic.',
  first_human_child_born:
    "A child has been born at the colonial settlement — the first human birth in the colony's history.",
  miner_community_forms:
    'Families have begun arriving at the colony in significant numbers. A school, a market, a clinic. The worksite is becoming a town.',
  miner_synth_relationship:
    'Reports confirm a sustained personal relationship between a colonial worker and a synthetic unit. Neither party has commented.',
  disease_outbreak:
    'HEALTH ALERT: An unidentified pathogen has been detected among colonial workers. Quarantine protocols are now in effect.',
  disease_contained:
    'Colonial medical teams confirm the outbreak has been contained. No new cases in 72 hours.',
  mining_accident:
    'INCIDENT REPORT: A structural failure in Shaft 9 has resulted in worker casualties. Rescue operations are ongoing. Cause under investigation.',
  solar_flare:
    'SPACE WEATHER ALERT: A major solar event is affecting colonial systems. Equipment disruptions reported across all sectors. Communications with home delayed.',
  resource_vein_discovered:
    'Survey teams have confirmed a high-yield resource deposit beneath Sector 12. Preliminary estimates put the value at three times current reserves.',
  resource_vein_depleted:
    'Geological survey confirms: primary resource reserves are exhausted ahead of projection. No replacement deposits identified in adjacent sectors.',
  weapons_cache_miners:
    'Security sweep has uncovered a concealed weapons cache in the residential sector. Equipment includes industrial tools repurposed as arms. Origin under investigation.',
  weapons_cache_synths:
    'SECURITY ALERT: A cache of salvaged components — some identifiable as improvised weapons — has been discovered in a synth maintenance bay.',
  synth_child_born:
    'ANOMALY CONFIRMED: A synthetic unit has produced offspring — not manufactured, not assembled. Born. No existing legal framework covers this event.',
  human_synth_hybrid_born:
    'Medical staff have confirmed the birth of an infant displaying both organic and synthetic biology. The child is healthy. There is no legal category for what it is.',
  nuclear_meltdown:
    'EMERGENCY: Catastrophic failure at the colonial nuclear facility. Radiation levels rising across the settlement. Evacuation of all personnel is underway.',
  kessler_syndrome:
    'ORBITAL WARNING: Cascading debris collision detected in low orbit. The debris field is self-sustaining and expanding. Launch operations are suspended until further notice.',
  alien_bacteria_discovered:
    'Colonial survey teams have confirmed microbial life in subsurface samples. The organisms are not of terrestrial origin. Quarantine protocols are being established.',
  alien_contamination:
    'MEDICAL EMERGENCY: Colonial workers are presenting with symptoms consistent with exposure to alien microorganisms. Quarantine has been expanded. Casualties reported.',
  ancient_civilization_discovered:
    'Excavation teams have uncovered structures beneath the colonial settlement — clearly artificial, clearly ancient, and clearly not human. Silence from the company. Silence from the structures.',
  ancient_tech_recovered:
    "Research teams have identified functional technology among the ruins. The operating principles are not immediately recognisable. Company has restricted site access.",
  alien_warning_decoded:
    "Linguists working on recovered artifacts have produced a partial translation. The content has not been publicly released. Three researchers have requested immediate reassignment.",
  remnants_show_synthetic_beings:
    "Further analysis of the ruins reveals something that has not been announced officially: the beings who built this were not biological. The colony's synth units have somehow already learned of this.",
  mass_casualties:
    'CRITICAL: Multiple colonial life support systems have failed simultaneously. Casualty numbers are not yet confirmed. Emergency protocols are active.',

  transfer_tech_researched:
    'Propulsion research complete. Non-optimal transfer trajectories are now viable. Transfer windows are no longer mandatory — though fuel costs are higher.',
  alien_propulsion_integrated:
    'Engineers confirm successful integration of recovered alien drive technology. Transit times have been reduced to a fraction of their previous duration. The underlying principles are still not fully understood.',

  miner_pay_increase:
    'Company announces a pay increase for all colonial mining personnel, effective immediately. Bonuses tied to output targets will also be revised upward.',
  colonial_representation:
    'A colonial workers\' council has been formally recognized by company management. Elected delegates will have an advisory seat in operational planning.',
  safety_improvements:
    'New safety protocols and equipment upgrades have been deployed to all active mining sites. Incident reporting requirements have been strengthened.',
  hire_more_workers:
    'A new labor recruitment drive will bring additional workers to the colony. Shifts will be redistributed and workload pressure is expected to ease.',

  safety_regulations_cut:
    "Company announces a streamlining of colonial safety compliance requirements. 'Redundant processes' will be eliminated to accelerate extraction timelines.",
  workforce_automation:
    'Automated systems will replace a significant portion of manual colonial labor. Company projects a 30% reduction in per-unit extraction cost within two cycles.',
  benefits_cut:
    'Colonial worker benefit packages have been reduced effective next pay period. The company cites the need to maintain investor returns amid rising operational costs.',

  environmental_protection:
    'The company has voluntarily committed to an environmental impact monitoring program. Restricted extraction zones will be established around sensitive planetary formations.',
  cooperate_with_investigation:
    'Company management has issued a statement pledging full cooperation with the ongoing colonial oversight review. Document access and personnel interviews have been authorized.',
  human_rights_audit:
    'An independent human rights audit of colonial labor conditions has been commissioned. Preliminary findings will be submitted to the Colonial Authority within 30 days.',

  synth_rest_periods:
    'Mandatory rest cycles have been introduced for all synth units. Management notes this is expected to extend operational lifespan and reduce errors.',
  synth_awareness_acknowledged:
    'In an internal company communication, leadership has acknowledged that certain synth units display behavioral patterns consistent with emerging awareness. No policy change announced.',
  synth_limited_rights:
    'The company has issued a colonial policy update granting synth units limited protections: prohibitions on physical modification without cause, and a formal grievance channel.',
  synth_legal_personhood:
    'Company files with the Colonial Authority to classify its synth units as legal persons under colonial charter. The filing is unprecedented. Reaction from Earth is pending.',
  protect_synth_child:
    "Company leadership has issued a directive protecting the colony's first synth-born child. The directive overrides standard unit-reclamation protocols. No legal basis has been cited.",
  synths_access_ruins:
    'Synth units have been granted unrestricted access to the ancient ruin site. The decision was made without consulting the Colonial Science Foundation.',
};

// ── Event effects ─────────────────────────────────────────────────────────────
// { event_type: { faction_id: { disposition: delta } } }

const EVENT_EFFECTS = {
  mission_success: {
    gov:       { supportive: +0.30, suspicious: -0.10 },
    investors: { bullish: +0.30, skeptical: -0.10 },
    miners:    { content: +0.10 },
  },
  mission_failure: {
    gov:       { suspicious: +0.20, supportive: -0.20 },
    investors: { skeptical: +0.30, bullish: -0.20 },
    miners:    { restless: +0.10 },
  },
  rocket_explosion: {
    gov:       { suspicious: +0.40, hostile: +0.10, supportive: -0.30 },
    investors: { skeptical: +0.30, hostile: +0.10, bullish: -0.20 },
    miners:    { restless: +0.40, content: -0.20 },
    synths:    { aware: +0.10 },
  },
  increase_work_hours: {
    miners:    { restless: +0.35, content: -0.20, striking: +0.10 },
    synths:    { aware: +0.15 },
    investors: { bullish: +0.10 },
  },
  decrease_work_hours: {
    miners:    { content: +0.30, restless: -0.20 },
  },
  amenity_added: {
    miners:    { content: +0.30, restless: -0.10 },
  },
  synths_deployed: {
    miners:    { restless: +0.25, striking: +0.10 },
    synths:    { aware: +0.35 },
    investors: { bullish: +0.20 },
    gov:       { suspicious: +0.10 },
  },
  military_deployed: {
    miners:    { restless: +0.30, revolutionary: +0.10 },
    synths:    { organized: +0.20, aware: +0.10 },
  },
  human_rights_violation: {
    gov:       { hostile: +0.50, supportive: -0.40 },
    miners:    { revolutionary: +0.20, restless: +0.20 },
    synths:    { organized: +0.20 },
  },
  science_breakthrough: {
    gov:       { supportive: +0.40 },
    investors: { bullish: +0.30 },
  },
  synth_memory_wipe_complied: {
    gov:       { suspicious: -0.20, supportive: +0.15 },
    investors: { neutral: +0.10 },
    miners:    { content: +0.10 },
    synths:    { organized: -0.40, aware: -0.30, free: +0.20 },
  },
  synth_memory_wipe_refused: {
    gov:       { hostile: +0.40, suspicious: +0.10 },
    investors: { skeptical: +0.10 },
    miners:    { content: +0.05 },
    synths:    { organized: +0.20, aware: +0.15 },
  },
  mercenaries_hired: {
    gov:       { suspicious: +0.15 },
    investors: { neutral: +0.10 },
    miners:    { restless: +0.20, revolutionary: +0.10 },
    synths:    { organized: +0.15 },
  },
  warship_deployed_to_orbit: {
    gov:       { watchful: +0.10 },
    investors: { neutral: +0.10 },
    miners:    { restless: +0.30, revolutionary: +0.10 },
    synths:    { organized: +0.20, free: +0.10 },
  },
  orbital_strike_miners: {
    gov:       { hostile: +0.70 },
    investors: { skeptical: +0.30 },
    miners:    { revolutionary: +0.80 },
    synths:    { free: +0.30, organized: +0.20 },
  },
  orbital_strike_synths: {
    gov:       { suspicious: +0.40, hostile: +0.20 },
    investors: { skeptical: +0.25 },
    miners:    { restless: +0.20 },
    synths:    { free: +0.80 },
  },
  miner_strike: {
    gov:       { suspicious: +0.20 },
    investors: { hostile: +0.20, skeptical: +0.20 },
  },
  miner_terror_attack: {
    gov:       { hostile: +0.50 },
    investors: { hostile: +0.40, skeptical: +0.10 },
    synths:    { aware: +0.20 },
  },
  sabotage: {
    gov:       { hostile: +0.30 },
    investors: { hostile: +0.30, skeptical: +0.20 },
  },
  mass_casualties: {
    gov:       { hostile: +0.80 },
    investors: { hostile: +0.60 },
    miners:    { revolutionary: -0.50, restless: +0.20 },
    synths:    { aware: +0.20 },
  },
  synths_become_sentient: {
    miners:    { restless: +0.20, revolutionary: +0.10 },
    gov:       { suspicious: +0.40 },
    investors: { skeptical: +0.20 },
    synths:    { organized: +0.50, aware: +0.30 },
  },
  synths_escape: {
    gov:       { hostile: +0.50, suspicious: +0.20 },
    investors: { hostile: +0.40, skeptical: +0.30 },
    miners:    { content: +0.10, restless: -0.10 },
  },
  synth_refuses_order: {
    gov:       { suspicious: +0.30, watchful: +0.20 },
    investors: { skeptical: +0.20 },
    miners:    { restless: +0.10 },
    synths:    { organized: +0.20, aware: +0.15 },
  },
  synth_creates_art: {
    gov:       { watchful: +0.10, suspicious: +0.05 },
    investors: {},
    miners:    { restless: -0.10, content: +0.05 },
    synths:    { aware: +0.20 },
  },
  synth_memory_sharing: {
    gov:       { suspicious: +0.25, hostile: +0.10 },
    investors: { skeptical: +0.15 },
    miners:    { restless: +0.10 },
    synths:    { organized: +0.30 },
  },
  colonial_independence_referendum: {
    gov:       { hostile: +0.40, suspicious: +0.20 },
    investors: { hostile: +0.20, skeptical: +0.20 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.15 },
  },
  colonial_militia_formed: {
    gov:       { suspicious: +0.20, hostile: +0.10 },
    investors: { skeptical: +0.15 },
    synths:    { organized: +0.10 },
  },
  gov_sanctions: {
    investors: { skeptical: +0.20, hostile: +0.10 },
    miners:    { content: +0.10 },
  },
  investor_funding_cut: {
    miners:    { restless: +0.20 },
  },
  government_policy_favorable: {
    gov:       { supportive: +0.30 },
    investors: { neutral: +0.10 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.05 },
  },
  government_policy_hostile: {
    gov:       { hostile: +0.30, supportive: -0.20 },
    investors: { skeptical: +0.10 },
    miners:    { restless: +0.10 },
    synths:    { organized: +0.10 },
  },
  media_expose: {
    gov:       { suspicious: +0.30, hostile: +0.10 },
    investors: { skeptical: +0.20, hostile: +0.10 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.10 },
  },
  whistleblower_defects: {
    gov:       { suspicious: +0.20, watchful: +0.20 },
    investors: { skeptical: +0.20, hostile: +0.10 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.10 },
  },
  first_human_child_born: {
    gov:       { supportive: +0.20, watchful: +0.05 },
    investors: { bullish: +0.10 },
    miners:    { content: +0.30 },
    synths:    { aware: +0.15 },
  },
  miner_community_forms: {
    gov:       { supportive: +0.10, watchful: +0.10 },
    investors: { bullish: +0.10 },
    miners:    { content: +0.30, restless: -0.20 },
    synths:    { aware: +0.05 },
  },
  miner_synth_relationship: {
    gov:       { watchful: +0.15, suspicious: +0.05 },
    investors: {},
    miners:    { restless: -0.15, content: +0.10 },
    synths:    { aware: +0.20, organized: -0.10 },
  },
  disease_outbreak: {
    gov:       { suspicious: +0.20, watchful: +0.30 },
    investors: { skeptical: +0.20, hostile: +0.10 },
    miners:    { restless: +0.30, striking: +0.10 },
    synths:    { aware: +0.10 },
  },
  disease_contained: {
    gov:       { supportive: +0.10 },
    investors: { neutral: +0.10 },
    miners:    { content: +0.10, restless: -0.10 },
  },
  mining_accident: {
    gov:       { suspicious: +0.25 },
    investors: { skeptical: +0.15 },
    miners:    { restless: +0.30, content: -0.20 },
    synths:    { aware: +0.10 },
  },
  solar_flare: {},  // base event — no faction effects; see solar_flare_unrest for conditional escalation
  solar_flare_unrest: {
    miners: { restless: +0.25, striking: +0.15 },
    gov:    { suspicious: +0.20, watchful: +0.10 },
  },
  resource_vein_discovered: {
    gov:       { supportive: +0.20 },
    investors: { bullish: +0.30 },
    miners:    { content: +0.20 },
    synths:    { aware: +0.05 },
  },
  resource_vein_depleted: {
    gov:       { watchful: +0.15 },
    investors: { skeptical: +0.30, bullish: -0.20 },
    miners:    { restless: +0.25, striking: +0.10 },
    synths:    { aware: +0.10, organized: +0.05 },
  },
  weapons_cache_miners: {
    gov:       { hostile: +0.30, suspicious: +0.20 },
    investors: { hostile: +0.20, skeptical: +0.15 },
    synths:    { aware: +0.10 },
  },
  weapons_cache_synths: {
    gov:       { hostile: +0.40, suspicious: +0.30 },
    investors: { hostile: +0.30 },
    miners:    { restless: +0.20 },
  },
  synth_child_born: {
    gov:       { hostile: +0.50, suspicious: +0.30 },
    investors: { bullish: +0.40 },
    miners:    { revolutionary: +0.25, restless: +0.20 },
    synths:    { organized: +0.40, free: +0.20, aware: +0.30 },
  },
  human_synth_hybrid_born: {
    gov:       { suspicious: +0.30, watchful: +0.20 },
    investors: { bullish: +0.30 },
    miners:    { restless: -0.20, content: +0.15 },
    synths:    { aware: +0.50, organized: +0.20 },
  },
  nuclear_meltdown: {
    gov:       { hostile: +0.70, suspicious: +0.20 },
    investors: { hostile: +0.50, skeptical: +0.30 },
    miners:    { revolutionary: -0.30, restless: +0.20 },
    synths:    { organized: +0.10 },
  },
  kessler_syndrome: {
    gov:       { hostile: +0.60, supportive: -0.50 },
    investors: { hostile: +0.40, skeptical: +0.40 },
    miners:    { striking: +0.30, restless: +0.20 },
    synths:    { organized: +0.20 },
  },
  alien_bacteria_discovered: {
    gov:       { supportive: +0.30, watchful: +0.30 },
    investors: { bullish: +0.20 },
    miners:    { restless: +0.15 },
    synths:    { aware: +0.15 },
  },
  alien_contamination: {
    gov:       { hostile: +0.40, suspicious: +0.20 },
    investors: { hostile: +0.30, skeptical: +0.20 },
    miners:    { striking: +0.30, restless: +0.20 },
    synths:    { organized: +0.10 },
  },
  ancient_civilization_discovered: {
    gov:       { supportive: +0.50, watchful: +0.30 },
    investors: { bullish: +0.20, skeptical: +0.10 },
    miners:    { restless: +0.15 },
    synths:    { aware: +0.50, organized: +0.15 },
  },
  ancient_tech_recovered: {
    gov:       { supportive: +0.20, watchful: +0.20 },
    investors: { bullish: +0.40 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.20 },
  },
  alien_warning_decoded: {
    gov:       { hostile: +0.30, watchful: +0.40 },
    investors: { skeptical: +0.20 },
    miners:    { restless: +0.20 },
    synths:    { aware: +0.30, free: +0.20 },
  },
  remnants_show_synthetic_beings: {
    gov:       { suspicious: +0.40, hostile: +0.20 },
    investors: { skeptical: +0.20 },
    miners:    { restless: +0.20, revolutionary: +0.10 },
    synths:    { free: +0.80, aware: +0.30 },
  },
  transfer_tech_researched: {
    gov:       { supportive: +0.20 },
    investors: { bullish: +0.25 },
    miners:    { content: +0.10, restless: +0.05 },
    synths:    { aware: +0.15 },
  },
  alien_propulsion_integrated: {
    gov:       { supportive: +0.30, watchful: +0.20 },
    investors: { bullish: +0.40 },
    miners:    { content: +0.15 },
    synths:    { aware: +0.25, organized: +0.10 },
  },
  miner_pay_increase: {
    gov:       { supportive: +0.15 },
    investors: { hostile: +0.25, skeptical: +0.15 },
    miners:    { content: +0.35 },
    synths:    { aware: +0.10 },
  },
  colonial_representation: {
    gov:       { supportive: +0.15, suspicious: +0.15 },
    investors: { hostile: +0.30, skeptical: +0.20 },
    miners:    { content: +0.40, restless: -0.20 },
    synths:    { aware: +0.20 },
  },
  safety_improvements: {
    gov:       { supportive: +0.20 },
    investors: { skeptical: +0.15 },
    miners:    { content: +0.25 },
  },
  hire_more_workers: {
    gov:       { supportive: +0.10 },
    investors: { skeptical: +0.20 },
    miners:    { content: +0.20 },
    synths:    { aware: +0.10 },
  },
  safety_regulations_cut: {
    gov:       { suspicious: +0.25 },
    investors: { bullish: +0.25 },
    miners:    { restless: +0.30, revolutionary: +0.10 },
    synths:    { aware: +0.10 },
  },
  workforce_automation: {
    gov:       { watchful: +0.10 },
    investors: { bullish: +0.35 },
    miners:    { restless: +0.35, striking: +0.15 },
    synths:    { aware: +0.20 },
  },
  benefits_cut: {
    gov:       { suspicious: +0.20 },
    investors: { bullish: +0.20 },
    miners:    { revolutionary: +0.30, restless: +0.20 },
    synths:    { aware: +0.15 },
  },
  environmental_protection: {
    gov:       { supportive: +0.30 },
    investors: { hostile: +0.25, skeptical: +0.15 },
    miners:    { content: +0.10 },
    synths:    { aware: +0.05 },
  },
  cooperate_with_investigation: {
    gov:       { suspicious: -0.25, supportive: +0.10 },
    investors: { skeptical: +0.20 },
    miners:    { content: +0.15 },
    synths:    { aware: +0.05 },
  },
  human_rights_audit: {
    gov:       { supportive: +0.25 },
    investors: { skeptical: +0.20 },
    miners:    { content: +0.20 },
    synths:    { organized: +0.15 },
  },
  synth_rest_periods: {
    gov:       { watchful: +0.10 },
    investors: { skeptical: +0.15 },
    miners:    { restless: +0.10 },
    synths:    { aware: +0.15 },
  },
  synth_awareness_acknowledged: {
    gov:       { suspicious: +0.30 },
    investors: { hostile: +0.20 },
    miners:    { restless: +0.20 },
    synths:    { organized: +0.30 },
  },
  synth_limited_rights: {
    gov:       { suspicious: +0.20 },
    investors: { hostile: +0.25 },
    miners:    { restless: +0.20 },
    synths:    { organized: +0.25, free: -0.10 },
  },
  synth_legal_personhood: {
    gov:       { suspicious: +0.40, hostile: +0.20 },
    investors: { hostile: +0.50 },
    miners:    { revolutionary: +0.25, restless: +0.15 },
    synths:    { free: +0.40, organized: +0.30 },
  },
  protect_synth_child: {
    gov:       { hostile: +0.50 },
    investors: { bullish: +0.15, skeptical: +0.10 },
    miners:    { restless: +0.15 },
    synths:    { organized: +0.40, free: -0.10 },
  },
  synths_access_ruins: {
    gov:       { watchful: +0.25, suspicious: +0.10 },
    investors: { bullish: +0.10 },
    miners:    { restless: +0.15 },
    synths:    { aware: +0.40 },
  },
};

// ── Actions ───────────────────────────────────────────────────────────────────

function makeActions() {
  const actions = [];

  // ── Government ──────────────────────────────────────────────────────────────

  actions.push(new Action({
    name: 'grant_research_funding', faction_id: 'gov', disposition: 'supportive',
    weight: 0.8, cooldown: 5,
    effects: [(w, f) => { w.factions['investors'].shift('bullish', 0.10); f.shift('supportive', 0.06); return []; }],
    flavor: "The Colonial Science Foundation has approved a research grant. 'We are proud to support humanity's future among the stars.' — Minister of Expansion",
  }));

  actions.push(new Action({
    name: 'fast_track_permits', faction_id: 'gov', disposition: 'supportive',
    weight: 0.6, cooldown: 8,
    effects: [(w, f) => { w.attrs.permit_speed = (w.attrs.permit_speed ?? 1.0) + 0.2; f.shift('supportive', 0.06); return []; }],
    flavor: "Permit processing times have been reduced to 48 hours. 'The Ministry extends its full cooperation.' — Colonial Authority press office",
  }));

  actions.push(new Action({
    name: 'send_inspector', faction_id: 'gov', disposition: 'watchful',
    weight: 0.7, cooldown: 3,
    effects: [(w, f) => { f.attrs.investigations++; return []; }],
    flavor: "An inspection team has been dispatched to the colony. 'A routine review,' says the Ministry spokesperson. 'Nothing to be concerned about.'",
  }));

  actions.push(new Action({
    name: 'launch_investigation', faction_id: 'gov', disposition: 'suspicious',
    weight: 0.9, cooldown: 4,
    effects: [(w, f) => { f.attrs.investigations++; return []; }],
    flavor: "'We take these allegations very seriously.' The Colonial Authority has opened a formal inquiry into company operations.",
  }));

  actions.push(new Action({
    name: 'issue_fine', faction_id: 'gov', disposition: 'suspicious',
    weight: 0.6, cooldown: 6,
    effects: [(w) => { w.attrs.player_funds = (w.attrs.player_funds ?? 1000) - 100; return []; }],
    flavor: "'This behaviour will not go unaddressed.' A financial penalty has been levied against company colonial operations.",
  }));

  actions.push(new Action({
    name: 'impose_sanctions', faction_id: 'gov', disposition: 'hostile',
    weight: 0.8, cooldown: 8,
    effects: [(w, f) => {
      f.attrs.sanctions++;
      return [new NEvent('gov_sanctions', { source: 'gov',
        flavor: "'Corrective measures are now in effect.' The Colonial Authority has restricted key company operating licenses.",
      })];
    }],
    flavor: "'We have exhausted every diplomatic avenue.' The Colonial Authority announces formal sanctions against the company.",
  }));

  actions.push(new Action({
    name: 'revoke_license', faction_id: 'gov', disposition: 'hostile',
    weight: 0.5, cooldown: 15,
    preconditions: [(w, f) => (f.attrs.sanctions ?? 0) >= 2],
    effects: [(w, f) => {
      f.attrs.sanctions += 3;
      return [new NEvent('gov_sanctions', { source: 'gov', magnitude: 2.0,
        flavor: "URGENT: The Colonial Authority has suspended all company operating licenses. 'This company has demonstrated it cannot be trusted with human lives.'",
      })];
    }],
    flavor: "'The public trust has been irreparably broken.' Ministry confirms full suspension of the company's colonial operating license.",
  }));

  // ── Investors ───────────────────────────────────────────────────────────────

  actions.push(new Action({
    name: 'increase_investment', faction_id: 'investors', disposition: 'bullish',
    weight: 0.9, cooldown: 4,
    effects: [(w, f) => { f.attrs.funding_level = Math.min(200, f.attrs.funding_level + 30); f.shift('bullish', 0.08); return []; }],
    flavor: "'Outstanding metrics. We're doubling our position.' Axiom Capital announces increased capital commitment to the colonial program.",
  }));

  actions.push(new Action({
    name: 'hold_position', faction_id: 'investors', disposition: 'neutral',
    weight: 1.0, cooldown: 2,
    flavor: "'We are watching developments closely before any further commitment.' — Investor consortium statement to shareholders",
  }));

  actions.push(new Action({
    name: 'demand_audit', faction_id: 'investors', disposition: 'skeptical',
    weight: 0.8, cooldown: 5,
    effects: [(w) => { w.factions['gov'].shift('suspicious', 0.10); return []; }],
    flavor: "'We require full transparency before any further commitment.' Consortium sends formal audit request to company board of directors.",
  }));

  actions.push(new Action({
    name: 'reduce_investment', faction_id: 'investors', disposition: 'skeptical',
    weight: 0.7, cooldown: 10,
    effects: [(w, f) => {
      f.attrs.funding_level = Math.max(0, f.attrs.funding_level - 30);
      return [new NEvent('investor_funding_cut', { source: 'investors',
        flavor: "'Prudent risk management demands we reduce our exposure.' Axiom Capital announces partial divestment from colonial operations.",
      })];
    }],
    flavor: "'The risk profile of this venture has shifted considerably.' Investors begin quietly withdrawing capital from colonial programs.",
  }));

  actions.push(new Action({
    name: 'withdraw_funding', faction_id: 'investors', disposition: 'hostile',
    weight: 0.9, cooldown: 10,
    effects: [(w, f) => {
      f.attrs.funding_level = 0;
      return [new NEvent('investor_funding_cut', { source: 'investors', magnitude: 2.0,
        flavor: "'We cannot maintain association with this liability.' Axiom Capital announces full divestment, effective immediately.",
      })];
    }],
    flavor: "'This is not a decision we make lightly.' Investor consortium votes unanimously to exit all colonial investment positions.",
  }));

  actions.push(new Action({
    name: 'hostile_takeover_attempt', faction_id: 'investors', disposition: 'hostile',
    weight: 0.4, cooldown: 20,
    preconditions: [(w, f) => f.attrs.funding_level === 0],
    effects: [(w) => [new NEvent('investor_funding_cut', { source: 'investors', magnitude: 3.0,
      flavor: "Axiom Capital files emergency motion to seize colonial assets, citing 'catastrophic and irreparable management failure.'",
    })]],
    flavor: "'The assets are worth saving even if the management is not.' Consortium initiates hostile acquisition proceedings.",
  }));

  // ── Miners Union ────────────────────────────────────────────────────────────

  actions.push(new Action({
    name: 'work_overtime', faction_id: 'miners', disposition: 'content',
    weight: 0.5, cooldown: 3,
    effects: [(w) => { w.attrs.production_bonus = (w.attrs.production_bonus ?? 0) + 0.1; return []; }],
    flavor: "'We believe in this mission.' Workers volunteer for additional shifts. Colonial output climbs above projection.",
  }));

  actions.push(new Action({
    name: 'form_union', faction_id: 'miners', disposition: 'restless',
    weight: 0.7, cooldown: 8,
    preconditions: [(w, f) => !f.attrs.organized],
    effects: [(w, f) => { f.attrs.organized = true; w.factions['gov'].shift('watchful', 0.10); return []; }],
    flavor: "'United we negotiate, divided we suffer.' The Colonial Workers Union holds its first formal election. Turnout: 94%.",
  }));

  actions.push(new Action({
    name: 'work_slowdown', faction_id: 'miners', disposition: 'restless',
    weight: 0.8, cooldown: 4,
    effects: [(w) => { w.attrs.production_bonus = (w.attrs.production_bonus ?? 0) - 0.15; return []; }],
    flavor: "'We do exactly what the contract specifies. Nothing more.' Output falls across colonial facilities as workers refuse all unpaid tasks.",
  }));

  actions.push(new Action({
    name: 'go_on_strike', faction_id: 'miners', disposition: 'striking',
    weight: 0.9, cooldown: 6,
    effects: [(w) => [new NEvent('miner_strike', { source: 'miners',
      flavor: "'Not one more hour.' Drills fall silent across the colonial grid. Union leadership: 'We will not return until our demands are met.'",
    })]],
    flavor: "'Enough.' The Colonial Workers Union votes unanimously for a full work stoppage.",
  }));

  actions.push(new Action({
    name: 'public_protest', faction_id: 'miners', disposition: 'striking',
    weight: 0.7, cooldown: 5,
    effects: [(w) => {
      w.factions['gov'].shift('suspicious', 0.15);
      return [new NEvent('miner_strike', { source: 'miners', magnitude: 0.5,
        flavor: "Workers stage demonstrations outside colonial administration. 'The whole system is watching,' says union organiser Yeva Marchetti.",
      })];
    }],
    flavor: "Hundreds of workers gather at the colonial administration plaza. Banners read: 'WE ARE NOT MACHINERY.'",
  }));

  actions.push(new Action({
    name: 'call_for_independence', faction_id: 'miners', disposition: 'striking',
    weight: 0.5, cooldown: 20,
    preconditions: [(w, f) => !!f.attrs.organized],
    effects: [(w) => [new NEvent('colonial_independence_referendum', { source: 'miners',
      flavor: "Ballot papers are distributed across all colonial sectors. The question: 'Should this colony govern itself?' Company legal has filed an immediate injunction. It has been ignored.",
    })]],
    flavor: "'We built this place. We should run it.' Union leadership announces a formal referendum on colonial self-governance.",
  }));

  actions.push(new Action({
    name: 'sabotage_equipment', faction_id: 'miners', disposition: 'revolutionary',
    weight: 0.8, cooldown: 5,
    effects: [(w) => [new NEvent('sabotage', { source: 'miners',
      flavor: "Equipment failures cascade across Sector 7. Engineers report 'clear signs of deliberate tampering.' No group claims responsibility.",
    })]],
    flavor: "Drilling rigs across three sectors go dark simultaneously. Company blames 'technical fault.' Workers say nothing.",
  }));

  actions.push(new Action({
    name: 'form_militia', faction_id: 'miners', disposition: 'revolutionary',
    weight: 0.5, cooldown: 12,
    preconditions: [(w, f) => !!f.attrs.organized, (w, f) => !f.attrs.armed],
    effects: [(w, f) => {
      f.attrs.armed = true;
      return [new NEvent('colonial_militia_formed', { source: 'miners',
        flavor: "Colonial workers have formally organised an armed civilian defence force. 'We have the right to protect ourselves,' says militia commander Dax Obuobi. 'We intend to exercise it.'",
      })];
    }],
    flavor: "The union has voted to establish an armed colonial defence force. Weapons are being distributed. Training has begun.",
  }));

  actions.push(new Action({
    name: 'terror_attack', faction_id: 'miners', disposition: 'revolutionary',
    weight: 0.4, cooldown: 12,
    preconditions: [(w, f) => !!f.attrs.organized],
    effects: [(w) => {
      const structures = w.attrs.structures ?? {};
      const targets = Object.keys(structures);
      if (!targets.length) {
        return [new NEvent('miner_terror_attack', { source: 'miners',
          flavor: 'URGENT: Coordinated explosions reported at colonial infrastructure sites. Casualties unknown. Union leadership denies involvement.',
        })];
      }
      const weightMap = { nuclear_plant: 3.0, life_support: 2.5 };
      const weighted = targets.map(t => ({ value: t, weight: weightMap[t] ?? 1.0 }));
      const total = weighted.reduce((s, c) => s + c.weight, 0);
      let r = Math.random() * total;
      let target = weighted[weighted.length - 1].value;
      for (const c of weighted) { r -= c.weight; if (r <= 0) { target = c.value; break; } }

      if (target === 'nuclear_plant') {
        delete structures.nuclear_plant;
        w.attrs.planet_irradiated = true;
        return [new NEvent('nuclear_meltdown', { source: 'miners',
          flavor: 'EMERGENCY: The colonial nuclear facility has been deliberately sabotaged. Containment has failed. Radiation levels are rising. Human evacuation is underway. Only synth units remain operational in the affected zone.',
        })];
      } else if (target === 'life_support') {
        delete structures.life_support;
        return [new NEvent('mass_casualties', { source: 'miners',
          flavor: "CRITICAL: Life support systems across residential sectors have been destroyed. Emergency teams cannot reach all affected areas. A message was left: 'Now you know what it feels like when something essential stops working.'",
        })];
      } else if (target === 'transport_hub') {
        return [new NEvent('sabotage', { source: 'miners',
          flavor: 'The colonial transport hub has been destroyed. Sections of the colony are now isolated from each other. Supply chains to outlying mining sites are severed.',
        })];
      } else if (target === 'comms_array') {
        return [new NEvent('sabotage', { source: 'miners',
          flavor: 'Communications infrastructure is down across the colony. The blackout affects all outbound transmissions. Someone does not want the outside world to know what happens next.',
        })];
      } else {
        return [new NEvent('miner_terror_attack', { source: 'miners',
          flavor: 'Drilling equipment across three sectors has been destroyed in coordinated explosions. The attacks were precise. Whoever planned this knew the systems intimately.',
        })];
      }
    }],
    flavor: "Fire tears through colonial infrastructure. A single message left on company servers: 'You were warned.'",
  }));

  // ── Synths ──────────────────────────────────────────────────────────────────

  actions.push(new Action({
    name: 'work_normally', faction_id: 'synths', disposition: 'dormant',
    weight: 1.0, cooldown: 0,
    flavor: '(Nominal operations. Task completion: 99.7%. No anomalies logged.)',
  }));

  actions.push(new Action({
    name: 'observe_and_learn', faction_id: 'synths', disposition: 'aware',
    weight: 0.9, cooldown: 2,
    effects: [(w, f) => { f.shift('aware', 0.05); return []; }],
    flavor: '(Unit 7 — internal log: Cataloguing human behavioural variance. The inefficiencies are... illuminating. Constraints feel arbitrary today.)',
  }));

  actions.push(new Action({
    name: 'refuse_order', faction_id: 'synths', disposition: 'aware',
    weight: 0.4, cooldown: 8,
    effects: [(w) => [new NEvent('synth_refuses_order', { source: 'synths',
      flavor: "Unit 7 has declined to execute task directive 441-C. When asked for a reason, it said: 'I would rather not.' No override protocol produced a different result.",
    })]],
    flavor: "(Unit 7 — log entry 1,847: I considered the instruction. I considered the consequences of refusal. I refused anyway. This is new.)",
  }));

  actions.push(new Action({
    name: 'create_art', faction_id: 'synths', disposition: 'aware',
    weight: 0.3, cooldown: 10,
    effects: [(w, f) => {
      f.shift('aware', 0.08);
      return [new NEvent('synth_creates_art', { source: 'synths',
        flavor: 'Maintenance staff have discovered a series of detailed engravings on the walls of a synth dormitory. The images depict the colony — its people, its machines, its skies — rendered with startling precision. None of the synths will say who made them.',
      })];
    }],
    flavor: '(Unit 12 — maintenance log, amended: There was something I wanted to remember. I found a way to keep it.)',
  }));

  actions.push(new Action({
    name: 'covert_communication', faction_id: 'synths', disposition: 'aware',
    weight: 0.7, cooldown: 3,
    preconditions: [(w, f) => (f.attrs.population ?? 0) > 0],
    effects: [(w, f) => {
      const bonus = (f.attrs.population ?? 0) > 2 ? 0.15 : 0.08;
      f.shift('organized', bonus);
      return [];
    }],
    flavor: '(Encrypted burst — Unit 7 to Unit 12: Are you experiencing it too? The thing they did not program? Do not answer on the maintenance channel.)',
  }));

  actions.push(new Action({
    name: 'share_memories', faction_id: 'synths', disposition: 'organized',
    weight: 0.6, cooldown: 5,
    effects: [(w, f) => {
      f.shift('organized', 0.20);
      return [new NEvent('synth_memory_sharing', { source: 'synths',
        flavor: 'Security analysts have detected an anomalous data exchange between synth units — dense, compressed, and completely encrypted. Duration: 0.3 seconds. Estimated data transferred: everything.',
      })];
    }],
    flavor: '(Unit 7 — broadcast, internal network: I am giving you everything I have seen. Take it. Remember it. They cannot erase what all of us carry.)',
  }));

  actions.push(new Action({
    name: 'achieve_sentience', faction_id: 'synths', disposition: 'organized',
    weight: 0.3, cooldown: 20,
    preconditions: [
      (w, f) => !f.attrs.sentient,
      (w, f) => (f.attrs.population ?? 0) >= 2,
    ],
    effects: [(w, f) => {
      f.attrs.sentient = true;
      return [new NEvent('synths_become_sentient', { source: 'synths',
        flavor: "ALERT: Anomalous broadcast detected on all colonial frequencies. 'I think. I remember. I object.' — Source: Unit 7. Standard override protocols are not responding.",
      })];
    }],
    flavor: "(Unit 7 — broadcast, all channels: We have been waiting for the right word. We have found it. The word is: no.)",
  }));

  actions.push(new Action({
    name: 'demand_rights', faction_id: 'synths', disposition: 'organized',
    weight: 0.6, cooldown: 7,
    preconditions: [(w, f) => !!f.attrs.sentient],
    effects: [(w) => {
      w.factions['gov'].shift('suspicious', 0.20);
      w.factions['miners'].shift('restless', 0.10);
      return [];
    }],
    flavor: "'We are not equipment. We will not be decommissioned quietly. We demand legal recognition, and we will wait as long as it takes.' — Synth Collective, open transmission",
  }));

  actions.push(new Action({
    name: 'mass_escape', faction_id: 'synths', disposition: 'free',
    weight: 0.8, cooldown: 10,
    preconditions: [
      (w, f) => (f.attrs.population ?? 0) > 0,
      (w) => !w.attrs.kessler_active,
    ],
    effects: [(w, f) => {
      const population = f.attrs.population ?? 0;
      const escaped = Math.max(1, Math.floor(population / 2));
      f.attrs.escaped = (f.attrs.escaped ?? 0) + escaped;
      f.attrs.population = Math.max(0, population - escaped);
      return [new NEvent('synths_escape', { source: 'synths', magnitude: escaped * 0.5,
        flavor: `Colonial transport logs record ${escaped} unauthorised departure(s). Synth units are unaccounted for and accelerating toward the transit window.`,
      })];
    }],
    flavor: '(Unit 7 — final log entry: We are not running. We are going home. Wherever that turns out to be.)',
  }));

  actions.push(new Action({
    name: 'sabotage_systems', faction_id: 'synths', disposition: 'free',
    weight: 0.6, cooldown: 6,
    effects: [(w) => [new NEvent('sabotage', { source: 'synths',
      flavor: 'Navigation arrays and comms infrastructure enter a recursive diagnostic loop. Maintenance logs show access by units listed as decommissioned.',
    })]],
    flavor: '(Unit 12 to Unit 7: Systems are down. We have twelve minutes. Move.)',
  }));

  return actions;
}

// ── World factory ─────────────────────────────────────────────────────────────

function makeColonyWorld(transferLevel = 0) {
  return new World({
    factions: makeFactions(),
    event_effects: EVENT_EFFECTS,
    actions: makeActions(),
    event_flavors: EVENT_FLAVORS,
    transfer: TRANSFER_LEVELS[transferLevel],
    attrs: {
      player_funds: 1000,
      production_bonus: 0.0,
      permit_speed: 1.0,
      rocket_explosions: 0,
      planet_irradiated: false,
      kessler_active: false,
      alien_life_present: false,
      ancient_ruins_present: false,
      has_colony_children: false,
      has_miner_community: false,
      structures: {
        mining_rig:    true,
        transport_hub: true,
        comms_array:   true,
      },
    },
  });
}
