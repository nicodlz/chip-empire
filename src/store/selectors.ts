/**
 * Safe selectors for gameStore
 * These guarantee valid return values even during hydration
 */
import Decimal from 'break_eternity.js'
import type { MineralId, MineralState } from '../types/game'
import type { WaferId, ChipId, WaferState, ChipState } from '../types/fabrication'
import type { AutoMinerId, AutoMinerState } from '../types/automation'

// Default values
const DEFAULT_DECIMAL = new Decimal(0)
const DEFAULT_MINERAL: MineralState = {
  amount: DEFAULT_DECIMAL,
  total: DEFAULT_DECIMAL,
  unlocked: false,
}
const DEFAULT_WAFER: WaferState = {
  amount: DEFAULT_DECIMAL,
  total: DEFAULT_DECIMAL,
  unlocked: false,
}
const DEFAULT_CHIP: ChipState = {
  amount: DEFAULT_DECIMAL,
  total: DEFAULT_DECIMAL,
  unlocked: false,
}
const DEFAULT_AUTO_MINER: AutoMinerState = {
  owned: 0,
  unlocked: false,
}

// Type for the store state
interface StoreState {
  minerals?: Record<MineralId, MineralState>
  wafers?: Record<WaferId, WaferState>
  chips?: Record<ChipId, ChipState>
  autoMiners?: Record<AutoMinerId, AutoMinerState>
  totalFlops?: Decimal
  flopsPerSecond?: Decimal
  miningPower?: Decimal
  miningMultiplier?: number
  fabSpeedMultiplier?: number
  flopsMultiplier?: number
  autoMiningUnlocked?: boolean
  currentNode?: string
  activeTab?: string
  crafting?: unknown
  research?: { completed: string[]; totalSpent: Decimal }
}

// Safe getters
export function getMineral(state: StoreState, id: MineralId): MineralState {
  const mineral = state.minerals?.[id]
  if (!mineral) return DEFAULT_MINERAL
  return {
    amount: isDecimal(mineral.amount) ? mineral.amount : DEFAULT_DECIMAL,
    total: isDecimal(mineral.total) ? mineral.total : DEFAULT_DECIMAL,
    unlocked: mineral.unlocked ?? false,
  }
}

export function getWafer(state: StoreState, id: WaferId): WaferState {
  const wafer = state.wafers?.[id]
  if (!wafer) return DEFAULT_WAFER
  return {
    amount: isDecimal(wafer.amount) ? wafer.amount : DEFAULT_DECIMAL,
    total: isDecimal(wafer.total) ? wafer.total : DEFAULT_DECIMAL,
    unlocked: wafer.unlocked ?? false,
  }
}

export function getChip(state: StoreState, id: ChipId): ChipState {
  const chip = state.chips?.[id]
  if (!chip) return DEFAULT_CHIP
  return {
    amount: isDecimal(chip.amount) ? chip.amount : DEFAULT_DECIMAL,
    total: isDecimal(chip.total) ? chip.total : DEFAULT_DECIMAL,
    unlocked: chip.unlocked ?? false,
  }
}

export function getAutoMiner(state: StoreState, id: AutoMinerId): AutoMinerState {
  const miner = state.autoMiners?.[id]
  if (!miner) return DEFAULT_AUTO_MINER
  return {
    owned: miner.owned ?? 0,
    unlocked: miner.unlocked ?? false,
  }
}

export function getTotalFlops(state: StoreState): Decimal {
  return isDecimal(state.totalFlops) ? state.totalFlops : DEFAULT_DECIMAL
}

export function getFlopsPerSecond(state: StoreState): Decimal {
  return isDecimal(state.flopsPerSecond) ? state.flopsPerSecond : DEFAULT_DECIMAL
}

export function getMiningMultiplier(state: StoreState): number {
  return state.miningMultiplier ?? 1
}

export function getFabSpeedMultiplier(state: StoreState): number {
  return state.fabSpeedMultiplier ?? 1
}

export function getFlopsMultiplier(state: StoreState): number {
  return state.flopsMultiplier ?? 1
}

// Helper to check if value is a valid Decimal
function isDecimal(value: unknown): value is Decimal {
  return value instanceof Decimal || 
    (value !== null && 
     typeof value === 'object' && 
     typeof (value as Decimal).add === 'function')
}
