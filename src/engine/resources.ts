import Decimal from 'break_eternity.js'
import type { MineralState, MineralId } from '../types/game'
import { MINERALS } from '../data/minerals'

export function createMineralState(unlocked = false): MineralState {
  return {
    amount: new Decimal(0),
    total: new Decimal(0),
    unlocked,
  }
}

export function addMineral(state: MineralState, amount: Decimal): MineralState {
  return {
    ...state,
    amount: state.amount.plus(amount),
    total: state.total.plus(amount),
  }
}

export function mineMineral(mineralId: MineralId, power: Decimal): Decimal {
  const def = MINERALS[mineralId]
  if (!def) return new Decimal(0)
  return power.times(def.baseRate)
}

export function formatNumber(n: Decimal): string {
  if (n.lt(1000)) return n.toFixed(n.lt(10) ? 1 : 0)
  if (n.lt(1e6)) return n.div(1000).toFixed(1) + 'K'
  if (n.lt(1e9)) return n.div(1e6).toFixed(1) + 'M'
  if (n.lt(1e12)) return n.div(1e9).toFixed(1) + 'B'
  if (n.lt(1e15)) return n.div(1e12).toFixed(1) + 'T'
  if (n.lt(1e18)) return n.div(1e15).toFixed(1) + 'P'
  return n.toExponential(2)
}
