import Decimal from 'break_eternity.js'
import type { ProcessNode } from './fabrication'

export type ResearchCategory = 'nodes' | 'efficiency' | 'automation' | 'exotic'

export type ResearchId = 
  // Node unlocks
  | 'node_65nm' | 'node_45nm' | 'node_28nm' | 'node_14nm' | 'node_7nm' | 'node_5nm' | 'node_3nm'
  // Efficiency upgrades
  | 'mining_2x' | 'mining_5x' | 'fab_speed_2x' | 'fab_speed_5x'
  | 'flops_mult_2x' | 'flops_mult_5x' | 'flops_mult_10x'
  // Mineral unlocks
  | 'tier2_minerals' | 'tier3_minerals' | 'tier4_minerals' | 'tier5_minerals'
  // Automation
  | 'auto_miner' | 'auto_fab' | 'datacenter'
  // Exotic
  | 'quantum_computing' | 'singularity'

export interface ResearchDef {
  id: ResearchId
  name: string
  emoji: string
  category: ResearchCategory
  description: string
  cost: Decimal
  requires?: ResearchId[]
  effects: ResearchEffect[]
}

export type ResearchEffect =
  | { type: 'unlock_node'; node: ProcessNode }
  | { type: 'unlock_minerals'; tier: number }
  | { type: 'mining_multiplier'; value: number }
  | { type: 'fab_speed_multiplier'; value: number }
  | { type: 'flops_multiplier'; value: number }
  | { type: 'unlock_feature'; feature: string }

export interface ResearchState {
  completed: ResearchId[]
  totalSpent: Decimal
}
