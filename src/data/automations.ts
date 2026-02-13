import Decimal from 'break_eternity.js'
import type { AutoMinerDef, AutoMinerId } from '../types/automation'

export const AUTO_MINERS: Record<AutoMinerId, AutoMinerDef> = {
  drill_1: {
    id: 'drill_1',
    name: 'Basic Drill',
    emoji: '🔩',
    tier: 1,
    targets: ['silicon', 'copper', 'aluminum'],
    ratePerSecond: 1,
    baseCost: new Decimal(100),
    costMultiplier: 1.15,
  },
  drill_2: {
    id: 'drill_2',
    name: 'Precision Drill',
    emoji: '🔧',
    tier: 2,
    targets: ['silicon', 'copper', 'aluminum', 'gold', 'silver', 'tin'],
    ratePerSecond: 5,
    baseCost: new Decimal(1000),
    costMultiplier: 1.18,
  },
  drill_3: {
    id: 'drill_3',
    name: 'Deep Core Drill',
    emoji: '⛏️',
    tier: 3,
    targets: ['silicon', 'copper', 'aluminum', 'gold', 'silver', 'tin', 'lithium', 'cobalt', 'tantalum'],
    ratePerSecond: 25,
    baseCost: new Decimal(50000),
    costMultiplier: 1.20,
  },
  excavator: {
    id: 'excavator',
    name: 'Mega Excavator',
    emoji: '🚜',
    tier: 4,
    targets: ['silicon', 'copper', 'aluminum', 'gold', 'silver', 'tin', 'lithium', 'cobalt', 'tantalum', 'neodymium', 'gallium', 'indium'],
    ratePerSecond: 100,
    baseCost: new Decimal(1e7),
    costMultiplier: 1.25,
  },
  quantum_drill: {
    id: 'quantum_drill',
    name: 'Quantum Drill',
    emoji: '🌀',
    tier: 5,
    targets: ['silicon', 'copper', 'aluminum', 'gold', 'silver', 'tin', 'lithium', 'cobalt', 'tantalum', 'neodymium', 'gallium', 'indium', 'germanium', 'hafnium'],
    ratePerSecond: 500,
    baseCost: new Decimal(1e10),
    costMultiplier: 1.30,
  },
}

export const AUTO_MINER_ORDER: AutoMinerId[] = ['drill_1', 'drill_2', 'drill_3', 'excavator', 'quantum_drill']

// Calculate cost for next miner purchase
export function getAutoMinerCost(def: AutoMinerDef, owned: number): Decimal {
  return def.baseCost.mul(Math.pow(def.costMultiplier, owned))
}
