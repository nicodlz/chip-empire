import type { WaferDef, WaferId } from '../types/fabrication'

export const WAFERS: Record<WaferId, WaferDef> = {
  basic_wafer: {
    id: 'basic_wafer',
    name: 'Basic Wafer',
    emoji: '💿',
    tier: 1,
    recipe: {
      silicon: 100,
      copper: 20,
      aluminum: 10,
    },
    craftTime: 2000, // 2 seconds
  },
  refined_wafer: {
    id: 'refined_wafer',
    name: 'Refined Wafer',
    emoji: '📀',
    tier: 2,
    recipe: {
      silicon: 500,
      copper: 100,
      gold: 10,
      silver: 20,
    },
    craftTime: 5000,
    unlockedAt: '65nm',
  },
  pure_wafer: {
    id: 'pure_wafer',
    name: 'Pure Wafer',
    emoji: '💎',
    tier: 3,
    recipe: {
      silicon: 2000,
      gold: 50,
      lithium: 20,
      cobalt: 10,
    },
    craftTime: 10000,
    unlockedAt: '28nm',
  },
  quantum_wafer: {
    id: 'quantum_wafer',
    name: 'Quantum Wafer',
    emoji: '🌌',
    tier: 4,
    recipe: {
      silicon: 10000,
      gold: 200,
      neodymium: 50,
      gallium: 30,
      germanium: 10,
    },
    craftTime: 30000,
    unlockedAt: '5nm',
  },
}

export const WAFER_ORDER: WaferId[] = ['basic_wafer', 'refined_wafer', 'pure_wafer', 'quantum_wafer']
