import Decimal from 'break_eternity.js'
import type { MineralId } from './game'

export type AutoMinerId = 'drill_1' | 'drill_2' | 'drill_3' | 'excavator' | 'quantum_drill'

export interface AutoMinerDef {
  id: AutoMinerId
  name: string
  emoji: string
  tier: number
  targets: MineralId[] // Which minerals it can mine
  ratePerSecond: number // Base rate per miner
  baseCost: Decimal
  costMultiplier: number // Cost scales with owned
}

export interface AutoMinerState {
  owned: number
  unlocked: boolean
}

// Offline progress tracking
export interface OfflineProgress {
  minerals: Partial<Record<MineralId, Decimal>>
  flops: Decimal
  duration: number // seconds offline
}
