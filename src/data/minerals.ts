import type { MineralDef, MineralId } from '../types/game'

export const MINERALS: Record<MineralId, MineralDef> = {
  // Tier 1 - Common (abundant, easy to mine)
  silicon:   { id: 'silicon',   name: 'Silicon',   symbol: 'Si', emoji: '🔷', tier: 1, color: 'blue',   baseRate: 1 },
  copper:    { id: 'copper',    name: 'Copper',    symbol: 'Cu', emoji: '🟤', tier: 1, color: 'orange', baseRate: 0.8 },
  aluminum:  { id: 'aluminum',  name: 'Aluminum',  symbol: 'Al', emoji: '⬜', tier: 1, color: 'slate',  baseRate: 0.6 },
  
  // Tier 2 - Precious metals (conductors, connectors)
  gold:      { id: 'gold',      name: 'Gold',      symbol: 'Au', emoji: '🥇', tier: 2, color: 'yellow', baseRate: 0.3 },
  silver:    { id: 'silver',    name: 'Silver',    symbol: 'Ag', emoji: '🥈', tier: 2, color: 'gray',   baseRate: 0.4 },
  tin:       { id: 'tin',       name: 'Tin',       symbol: 'Sn', emoji: '🔘', tier: 2, color: 'zinc',   baseRate: 0.5 },
  
  // Tier 3 - Rare Earth (batteries, magnets)
  lithium:   { id: 'lithium',   name: 'Lithium',   symbol: 'Li', emoji: '🔋', tier: 3, color: 'green',  baseRate: 0.15 },
  cobalt:    { id: 'cobalt',    name: 'Cobalt',    symbol: 'Co', emoji: '🔵', tier: 3, color: 'indigo', baseRate: 0.12 },
  tantalum:  { id: 'tantalum',  name: 'Tantalum',  symbol: 'Ta', emoji: '⚫', tier: 3, color: 'violet', baseRate: 0.1 },
  
  // Tier 4 - Exotic (advanced chips)
  neodymium: { id: 'neodymium', name: 'Neodymium', symbol: 'Nd', emoji: '🧲', tier: 4, color: 'pink',   baseRate: 0.05 },
  gallium:   { id: 'gallium',   name: 'Gallium',   symbol: 'Ga', emoji: '💧', tier: 4, color: 'cyan',   baseRate: 0.04 },
  indium:    { id: 'indium',    name: 'Indium',    symbol: 'In', emoji: '✨', tier: 4, color: 'teal',   baseRate: 0.03 },
  
  // Tier 5 - Ultra-rare (bleeding edge nodes)
  germanium: { id: 'germanium', name: 'Germanium', symbol: 'Ge', emoji: '💎', tier: 5, color: 'purple', baseRate: 0.01 },
  hafnium:   { id: 'hafnium',   name: 'Hafnium',   symbol: 'Hf', emoji: '⚡', tier: 5, color: 'rose',   baseRate: 0.005 },
}

export const MINERAL_ORDER: MineralId[] = [
  'silicon', 'copper', 'aluminum',
  'gold', 'silver', 'tin',
  'lithium', 'cobalt', 'tantalum',
  'neodymium', 'gallium', 'indium',
  'germanium', 'hafnium',
]

export const TIER_1_MINERALS: MineralId[] = ['silicon', 'copper', 'aluminum']
