import Decimal from 'break_eternity.js'
import type { MineralId } from './game'

// Process nodes - real semiconductor progression
export type ProcessNode = '90nm' | '65nm' | '45nm' | '28nm' | '14nm' | '7nm' | '5nm' | '3nm'

// Wafer types - intermediate products
export type WaferId = 'basic_wafer' | 'refined_wafer' | 'pure_wafer' | 'quantum_wafer'

// Chip categories
export type ChipCategory = 'cpu' | 'gpu' | 'memory' | 'asic' | 'quantum'

// Chip identifiers
export type ChipId = 
  | 'cpu_basic' | 'cpu_core' | 'cpu_server'
  | 'gpu_basic' | 'gpu_gaming' | 'gpu_compute'
  | 'ram_basic' | 'ram_ddr5' | 'ram_hbm'
  | 'asic_miner' | 'asic_ai'
  | 'qpu_basic'

export interface WaferDef {
  id: WaferId
  name: string
  emoji: string
  tier: number
  recipe: Partial<Record<MineralId, number>>
  craftTime: number // ms
  unlockedAt?: ProcessNode
}

export interface ChipDef {
  id: ChipId
  name: string
  emoji: string
  category: ChipCategory
  tier: number
  node: ProcessNode
  waferCost: { type: WaferId; amount: number }
  extraCosts?: Partial<Record<MineralId, number>>
  craftTime: number // ms
  flopsPerSecond: Decimal // FLOPS generated
  description: string
}

export interface ProcessNodeDef {
  id: ProcessNode
  name: string
  year: number // real-world intro year
  unlocksChips: ChipId[]
  unlocksWafers: WaferId[]
  unlockCost: { flops: Decimal }
  efficiency: number // multiplier for FLOPS
}

export interface WaferState {
  amount: Decimal
  total: Decimal
  unlocked: boolean
}

export interface ChipState {
  amount: Decimal
  total: Decimal
  unlocked: boolean
}

export interface FabState {
  wafers: Record<WaferId, WaferState>
  chips: Record<ChipId, ChipState>
  currentNode: ProcessNode
  unlockedNodes: ProcessNode[]
  totalFlops: Decimal
  flopsPerSecond: Decimal
  crafting: CraftingJob | null
}

export interface CraftingJob {
  type: 'wafer' | 'chip'
  itemId: WaferId | ChipId
  startedAt: number
  duration: number
  amount: number
}

export interface QueuedCraft {
  id: string // unique id for removal
  type: 'wafer' | 'chip'
  itemId: WaferId | ChipId
  amount: number
  duration: number // pre-calculated with fab speed
}
