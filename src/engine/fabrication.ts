import Decimal from 'break_eternity.js'
import type { MineralId } from '../types/game'
import type { WaferId, ChipId, WaferState, ChipState, CraftingJob, ProcessNode } from '../types/fabrication'
import { WAFERS } from '../data/wafers'
import { CHIPS } from '../data/chips'
import { PROCESS_NODES, NODE_ORDER } from '../data/nodes'

// Check if we can afford a wafer recipe
export function canCraftWafer(
  waferId: WaferId,
  minerals: Record<MineralId, { amount: Decimal }>,
  amount: number = 1
): boolean {
  const wafer = WAFERS[waferId]
  if (!wafer) return false

  for (const [mineralId, cost] of Object.entries(wafer.recipe)) {
    const mineral = minerals[mineralId as MineralId]
    if (!mineral || mineral.amount.lt(cost * amount)) {
      return false
    }
  }
  return true
}

// Check if we can craft a chip
export function canCraftChip(
  chipId: ChipId,
  minerals: Record<MineralId, { amount: Decimal }>,
  wafers: Record<WaferId, WaferState>,
  currentNode: ProcessNode,
  amount: number = 1
): boolean {
  const chip = CHIPS[chipId]
  if (!chip) return false

  // Check node requirement
  const nodeIndex = NODE_ORDER.indexOf(currentNode)
  const requiredIndex = NODE_ORDER.indexOf(chip.node)
  if (nodeIndex < requiredIndex) return false

  // Check wafer cost
  const wafer = wafers[chip.waferCost.type]
  if (!wafer || wafer.amount.lt(chip.waferCost.amount * amount)) {
    return false
  }

  // Check extra mineral costs
  if (chip.extraCosts) {
    for (const [mineralId, cost] of Object.entries(chip.extraCosts)) {
      const mineral = minerals[mineralId as MineralId]
      if (!mineral || mineral.amount.lt(cost * amount)) {
        return false
      }
    }
  }

  return true
}

// Deduct wafer crafting costs
export function deductWaferCosts(
  waferId: WaferId,
  minerals: Record<MineralId, { amount: Decimal }>,
  amount: number = 1
): Record<MineralId, { amount: Decimal }> {
  const wafer = WAFERS[waferId]
  if (!wafer) return minerals
  
  const newMinerals = { ...minerals }

  for (const [mineralId, cost] of Object.entries(wafer.recipe)) {
    const id = mineralId as MineralId
    const mineral = newMinerals[id]
    if (!mineral?.amount?.sub) continue
    newMinerals[id] = {
      ...mineral,
      amount: mineral.amount.sub(cost * amount),
    }
  }

  return newMinerals
}

// Deduct chip crafting costs
export function deductChipCosts(
  chipId: ChipId,
  minerals: Record<MineralId, { amount: Decimal }>,
  wafers: Record<WaferId, WaferState>,
  amount: number = 1
): { minerals: Record<MineralId, { amount: Decimal }>; wafers: Record<WaferId, WaferState> } {
  const chip = CHIPS[chipId]
  if (!chip) return { minerals, wafers }
  
  const newMinerals = { ...minerals }
  const newWafers = { ...wafers }

  // Deduct wafer
  const waferState = newWafers[chip.waferCost?.type]
  if (waferState?.amount?.sub) {
    newWafers[chip.waferCost.type] = {
      ...waferState,
      amount: waferState.amount.sub(chip.waferCost.amount * amount),
    }
  }

  // Deduct extra minerals
  if (chip.extraCosts) {
    for (const [mineralId, cost] of Object.entries(chip.extraCosts)) {
      const id = mineralId as MineralId
      const mineral = newMinerals[id]
      if (!mineral?.amount?.sub) continue
      newMinerals[id] = {
        ...mineral,
        amount: mineral.amount.sub(cost * amount),
      }
    }
  }

  return { minerals: newMinerals, wafers: newWafers }
}

// Create initial wafer state
export function createWaferState(unlocked: boolean = false): WaferState {
  return {
    amount: new Decimal(0),
    total: new Decimal(0),
    unlocked,
  }
}

// Create initial chip state
export function createChipState(unlocked: boolean = false): ChipState {
  return {
    amount: new Decimal(0),
    total: new Decimal(0),
    unlocked,
  }
}

// Add wafers after crafting
export function addWafer(state: WaferState, amount: number): WaferState {
  const dec = new Decimal(amount)
  return {
    ...state,
    amount: state.amount.add(dec),
    total: state.total.add(dec),
  }
}

// Add chips after crafting
export function addChip(state: ChipState, amount: number): ChipState {
  const dec = new Decimal(amount)
  return {
    ...state,
    amount: state.amount.add(dec),
    total: state.total.add(dec),
  }
}

// Calculate FLOPS per second from all chips
export function calculateFlopsPerSecond(
  chips: Record<ChipId, ChipState>,
  nodeEfficiency: number = 1
): Decimal {
  let total = new Decimal(0)

  for (const [chipId, state] of Object.entries(chips)) {
    if (!state?.amount?.gt?.(0)) continue
    const chip = CHIPS[chipId as ChipId]
    if (!chip?.flopsPerSecond) continue
    total = total.add(chip.flopsPerSecond.mul(state.amount).mul(nodeEfficiency))
  }

  return total
}

// Check crafting job completion
export function isCraftingComplete(job: CraftingJob): boolean {
  return Date.now() >= job.startedAt + job.duration
}

// Get crafting progress (0-1)
export function getCraftingProgress(job: CraftingJob): number {
  const elapsed = Date.now() - job.startedAt
  return Math.min(1, elapsed / job.duration)
}

// Check if a process node can be unlocked
export function canUnlockNode(
  node: ProcessNode,
  totalFlops: Decimal,
  unlockedNodes: ProcessNode[]
): boolean {
  const nodeDef = PROCESS_NODES[node]
  if (!nodeDef) return false
  
  // Already unlocked?
  if (unlockedNodes.includes(node)) return false
  
  // Must unlock in order
  const nodeIndex = NODE_ORDER.indexOf(node)
  if (nodeIndex > 0) {
    const prevNode = NODE_ORDER[nodeIndex - 1]
    if (!unlockedNodes.includes(prevNode)) return false
  }
  
  return totalFlops.gte(nodeDef.unlockCost.flops)
}

// Format FLOPS for display
export function formatFlops(flops: Decimal): string {
  if (flops.lt(1e3)) return `${flops.toFixed(0)} FLOPS`
  if (flops.lt(1e6)) return `${flops.div(1e3).toFixed(2)} KFLOPS`
  if (flops.lt(1e9)) return `${flops.div(1e6).toFixed(2)} MFLOPS`
  if (flops.lt(1e12)) return `${flops.div(1e9).toFixed(2)} GFLOPS`
  if (flops.lt(1e15)) return `${flops.div(1e12).toFixed(2)} TFLOPS`
  if (flops.lt(1e18)) return `${flops.div(1e15).toFixed(2)} PFLOPS`
  if (flops.lt(1e21)) return `${flops.div(1e18).toFixed(2)} EFLOPS`
  return `${flops.div(1e21).toFixed(2)} ZFLOPS`
}
