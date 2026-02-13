import Decimal from 'break_eternity.js'
import type { ResearchDef, ResearchId } from '../types/research'

export const RESEARCH: Record<ResearchId, ResearchDef> = {
  // === NODE UNLOCKS ===
  node_65nm: {
    id: 'node_65nm',
    name: '65nm Process',
    emoji: '🔬',
    category: 'nodes',
    description: 'Unlock 65nm lithography. Smaller transistors, more power.',
    cost: new Decimal(1e9), // 1 GFLOPS
    effects: [{ type: 'unlock_node', node: '65nm' }],
  },
  node_45nm: {
    id: 'node_45nm',
    name: '45nm Process',
    emoji: '🔬',
    category: 'nodes',
    description: 'High-K metal gate technology.',
    cost: new Decimal(1e11),
    requires: ['node_65nm'],
    effects: [{ type: 'unlock_node', node: '45nm' }],
  },
  node_28nm: {
    id: 'node_28nm',
    name: '28nm Process',
    emoji: '🔬',
    category: 'nodes',
    description: 'Mature node, excellent efficiency.',
    cost: new Decimal(1e13),
    requires: ['node_45nm'],
    effects: [{ type: 'unlock_node', node: '28nm' }],
  },
  node_14nm: {
    id: 'node_14nm',
    name: '14nm FinFET',
    emoji: '⚡',
    category: 'nodes',
    description: 'First FinFET process. 3D transistors!',
    cost: new Decimal(1e15),
    requires: ['node_28nm'],
    effects: [{ type: 'unlock_node', node: '14nm' }],
  },
  node_7nm: {
    id: 'node_7nm',
    name: '7nm EUV',
    emoji: '⚡',
    category: 'nodes',
    description: 'Extreme ultraviolet lithography.',
    cost: new Decimal(1e17),
    requires: ['node_14nm'],
    effects: [{ type: 'unlock_node', node: '7nm' }],
  },
  node_5nm: {
    id: 'node_5nm',
    name: '5nm EUV',
    emoji: '💠',
    category: 'nodes',
    description: 'Bleeding edge. Used in top smartphones.',
    cost: new Decimal(1e19),
    requires: ['node_7nm'],
    effects: [{ type: 'unlock_node', node: '5nm' }],
  },
  node_3nm: {
    id: 'node_3nm',
    name: '3nm GAA',
    emoji: '🌟',
    category: 'nodes',
    description: 'Gate-All-Around. The pinnacle.',
    cost: new Decimal(1e21),
    requires: ['node_5nm'],
    effects: [{ type: 'unlock_node', node: '3nm' }],
  },

  // === MINERAL UNLOCKS ===
  tier2_minerals: {
    id: 'tier2_minerals',
    name: 'Precious Metals',
    emoji: '🥇',
    category: 'exotic',
    description: 'Unlock Gold, Silver, and Tin for advanced circuits.',
    cost: new Decimal(1e8),
    effects: [{ type: 'unlock_minerals', tier: 2 }],
  },
  tier3_minerals: {
    id: 'tier3_minerals',
    name: 'Rare Earths',
    emoji: '🔋',
    category: 'exotic',
    description: 'Unlock Lithium, Cobalt, and Tantalum.',
    cost: new Decimal(1e12),
    requires: ['tier2_minerals', 'node_45nm'],
    effects: [{ type: 'unlock_minerals', tier: 3 }],
  },
  tier4_minerals: {
    id: 'tier4_minerals',
    name: 'Exotic Elements',
    emoji: '🧲',
    category: 'exotic',
    description: 'Unlock Neodymium, Gallium, and Indium.',
    cost: new Decimal(1e16),
    requires: ['tier3_minerals', 'node_14nm'],
    effects: [{ type: 'unlock_minerals', tier: 4 }],
  },
  tier5_minerals: {
    id: 'tier5_minerals',
    name: 'Ultra-Rare',
    emoji: '💎',
    category: 'exotic',
    description: 'Unlock Germanium and Hafnium for quantum wafers.',
    cost: new Decimal(1e20),
    requires: ['tier4_minerals', 'node_5nm'],
    effects: [{ type: 'unlock_minerals', tier: 5 }],
  },

  // === EFFICIENCY UPGRADES ===
  mining_2x: {
    id: 'mining_2x',
    name: 'Better Picks',
    emoji: '⛏️',
    category: 'efficiency',
    description: 'Double mining yield.',
    cost: new Decimal(1e7),
    effects: [{ type: 'mining_multiplier', value: 2 }],
  },
  mining_5x: {
    id: 'mining_5x',
    name: 'Diamond Drills',
    emoji: '💎',
    category: 'efficiency',
    description: '5x mining yield.',
    cost: new Decimal(1e11),
    requires: ['mining_2x'],
    effects: [{ type: 'mining_multiplier', value: 5 }],
  },
  fab_speed_2x: {
    id: 'fab_speed_2x',
    name: 'Faster Fab',
    emoji: '⚡',
    category: 'efficiency',
    description: 'Fabrication takes half the time.',
    cost: new Decimal(5e8),
    effects: [{ type: 'fab_speed_multiplier', value: 2 }],
  },
  fab_speed_5x: {
    id: 'fab_speed_5x',
    name: 'Turbo Fab',
    emoji: '🚀',
    category: 'efficiency',
    description: 'Fabrication is 5x faster.',
    cost: new Decimal(1e13),
    requires: ['fab_speed_2x'],
    effects: [{ type: 'fab_speed_multiplier', value: 5 }],
  },
  flops_mult_2x: {
    id: 'flops_mult_2x',
    name: 'Optimized Code',
    emoji: '📊',
    category: 'efficiency',
    description: 'Chips generate 2x FLOPS.',
    cost: new Decimal(1e10),
    effects: [{ type: 'flops_multiplier', value: 2 }],
  },
  flops_mult_5x: {
    id: 'flops_mult_5x',
    name: 'Parallel Processing',
    emoji: '🔄',
    category: 'efficiency',
    description: 'Chips generate 5x FLOPS.',
    cost: new Decimal(1e14),
    requires: ['flops_mult_2x'],
    effects: [{ type: 'flops_multiplier', value: 5 }],
  },
  flops_mult_10x: {
    id: 'flops_mult_10x',
    name: 'Neural Networks',
    emoji: '🧠',
    category: 'efficiency',
    description: 'Chips generate 10x FLOPS.',
    cost: new Decimal(1e18),
    requires: ['flops_mult_5x'],
    effects: [{ type: 'flops_multiplier', value: 10 }],
  },

  // === AUTOMATION ===
  auto_miner: {
    id: 'auto_miner',
    name: 'Auto-Miners',
    emoji: '🤖',
    category: 'automation',
    description: 'Automatically mine resources over time.',
    cost: new Decimal(1e9),
    effects: [{ type: 'unlock_feature', feature: 'auto_miner' }],
  },
  auto_fab: {
    id: 'auto_fab',
    name: 'Auto-Fab',
    emoji: '🏭',
    category: 'automation',
    description: 'Queue multiple crafting jobs.',
    cost: new Decimal(1e12),
    requires: ['auto_miner'],
    effects: [{ type: 'unlock_feature', feature: 'auto_fab' }],
  },
  datacenter: {
    id: 'datacenter',
    name: 'Datacenter',
    emoji: '🏢',
    category: 'automation',
    description: 'Massive passive FLOPS generation.',
    cost: new Decimal(1e15),
    requires: ['auto_fab'],
    effects: [{ type: 'unlock_feature', feature: 'datacenter' }],
  },

  // === EXOTIC ===
  quantum_computing: {
    id: 'quantum_computing',
    name: 'Quantum Computing',
    emoji: '🌀',
    category: 'exotic',
    description: 'Unlock the Quantum Processor.',
    cost: new Decimal(1e20),
    requires: ['node_3nm', 'tier5_minerals'],
    effects: [{ type: 'unlock_feature', feature: 'quantum' }],
  },
  singularity: {
    id: 'singularity',
    name: 'Singularity',
    emoji: '♾️',
    category: 'exotic',
    description: 'The end... or the beginning?',
    cost: new Decimal(1e24),
    requires: ['quantum_computing'],
    effects: [{ type: 'unlock_feature', feature: 'singularity' }],
  },
}

// Research order for display
export const RESEARCH_ORDER: ResearchId[] = [
  // Efficiency first
  'mining_2x', 'fab_speed_2x', 'flops_mult_2x',
  // Tier 2 minerals
  'tier2_minerals',
  // Node progression
  'node_65nm', 'node_45nm',
  // More efficiency
  'mining_5x', 'fab_speed_5x', 'flops_mult_5x',
  // Higher tiers
  'tier3_minerals', 'node_28nm', 'node_14nm',
  // Automation
  'auto_miner', 'auto_fab',
  // Advanced
  'tier4_minerals', 'node_7nm', 'node_5nm',
  'datacenter', 'flops_mult_10x',
  // Endgame
  'tier5_minerals', 'node_3nm',
  'quantum_computing', 'singularity',
]

export const RESEARCH_BY_CATEGORY: Record<string, ResearchId[]> = {
  nodes: ['node_65nm', 'node_45nm', 'node_28nm', 'node_14nm', 'node_7nm', 'node_5nm', 'node_3nm'],
  efficiency: ['mining_2x', 'mining_5x', 'fab_speed_2x', 'fab_speed_5x', 'flops_mult_2x', 'flops_mult_5x', 'flops_mult_10x'],
  automation: ['auto_miner', 'auto_fab', 'datacenter'],
  exotic: ['tier2_minerals', 'tier3_minerals', 'tier4_minerals', 'tier5_minerals', 'quantum_computing', 'singularity'],
}
