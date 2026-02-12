import Decimal from 'break_eternity.js'

export type MineralId = 
  | 'silicon' | 'copper' | 'aluminum'  // Tier 1
  | 'gold' | 'silver' | 'tin'          // Tier 2
  | 'lithium' | 'cobalt' | 'tantalum'  // Tier 3
  | 'neodymium' | 'gallium' | 'indium' // Tier 4
  | 'germanium' | 'hafnium'            // Tier 5

export interface MineralDef {
  id: MineralId
  name: string
  symbol: string
  emoji: string
  tier: 1 | 2 | 3 | 4 | 5
  color: string
  baseRate: number
}

export interface MineralState {
  amount: Decimal
  total: Decimal
  unlocked: boolean
}

export interface GameState {
  minerals: Record<MineralId, MineralState>
  miningPower: Decimal
  lastTick: number
}
