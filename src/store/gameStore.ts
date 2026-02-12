import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
import Decimal from 'break_eternity.js'
import type { GameState, MineralId, MineralState } from '../types/game'
import type { WaferId, ChipId, WaferState, ChipState, ProcessNode, FabState } from '../types/fabrication'
import { createMineralState, addMineral, mineMineral } from '../engine/resources'
import { 
  createWaferState, createChipState, addWafer, addChip,
  canCraftWafer, canCraftChip, deductWaferCosts, deductChipCosts,
  calculateFlopsPerSecond, isCraftingComplete,
} from '../engine/fabrication'
import { MINERALS, TIER_1_MINERALS } from '../data/minerals'
import { WAFERS, WAFER_ORDER } from '../data/wafers'
import { CHIPS, STARTER_CHIPS, CHIP_ORDER } from '../data/chips'
import { PROCESS_NODES, NODE_ORDER } from '../data/nodes'

interface FullGameState extends GameState, FabState {
  // Tab state
  activeTab: 'mine' | 'fab' | 'chips' | 'research'
}

interface GameStore extends FullGameState {
  // Mining actions
  mine: (mineralId: MineralId) => void
  unlockMineral: (mineralId: MineralId) => void
  
  // Fabrication actions
  startCraftWafer: (waferId: WaferId, amount?: number) => void
  startCraftChip: (chipId: ChipId, amount?: number) => void
  completeCrafting: () => void
  cancelCrafting: () => void
  
  // Node progression
  unlockNode: (node: ProcessNode) => void
  
  // FLOPS generation
  tick: () => void
  
  // UI
  setActiveTab: (tab: FullGameState['activeTab']) => void
  
  // System
  reset: () => void
}

const createInitialFabState = (): FabState => ({
  wafers: Object.fromEntries(
    WAFER_ORDER.map(id => [id, createWaferState(id === 'basic_wafer')])
  ) as Record<WaferId, WaferState>,
  chips: Object.fromEntries(
    CHIP_ORDER.map(id => [id, createChipState(STARTER_CHIPS.includes(id))])
  ) as Record<ChipId, ChipState>,
  currentNode: '90nm',
  unlockedNodes: ['90nm'],
  totalFlops: new Decimal(0),
  flopsPerSecond: new Decimal(0),
  crafting: null,
})

const createInitialState = (): FullGameState => ({
  // Mining state
  minerals: Object.fromEntries(
    Object.keys(MINERALS).map(id => [
      id,
      createMineralState(TIER_1_MINERALS.includes(id as MineralId))
    ])
  ) as Record<MineralId, MineralState>,
  miningPower: new Decimal(1),
  lastTick: Date.now(),
  
  // Fab state
  ...createInitialFabState(),
  
  // UI state
  activeTab: 'mine',
})

// Decimal serialization for localStorage
const serialize = (state: StorageValue<FullGameState>) => 
  JSON.stringify(state, (_, v) => v instanceof Decimal ? `__D__${v.toString()}` : v)

const deserialize = (str: string): StorageValue<FullGameState> =>
  JSON.parse(str, (_, v) => typeof v === 'string' && v.startsWith('__D__') ? new Decimal(v.slice(5)) : v)

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // === MINING ===
      mine: (mineralId) => set((state) => {
        const mineral = state.minerals[mineralId]
        if (!mineral.unlocked) return state
        
        const gained = mineMineral(mineralId, state.miningPower)
        return {
          minerals: {
            ...state.minerals,
            [mineralId]: addMineral(mineral, gained),
          },
        }
      }),

      unlockMineral: (mineralId) => set((state) => ({
        minerals: {
          ...state.minerals,
          [mineralId]: { ...state.minerals[mineralId], unlocked: true },
        },
      })),

      // === FABRICATION ===
      startCraftWafer: (waferId, amount = 1) => set((state) => {
        // Can't start if already crafting
        if (state.crafting) return state
        
        // Check resources
        if (!canCraftWafer(waferId, state.minerals, amount)) return state
        
        const wafer = WAFERS[waferId]
        const newMinerals = deductWaferCosts(waferId, state.minerals, amount)
        
        return {
          minerals: newMinerals as Record<MineralId, MineralState>,
          crafting: {
            type: 'wafer',
            itemId: waferId,
            startedAt: Date.now(),
            duration: wafer.craftTime * amount,
            amount,
          },
        }
      }),

      startCraftChip: (chipId, amount = 1) => set((state) => {
        if (state.crafting) return state
        if (!canCraftChip(chipId, state.minerals, state.wafers, state.currentNode, amount)) return state
        
        const chip = CHIPS[chipId]
        const { minerals, wafers } = deductChipCosts(chipId, state.minerals, state.wafers, amount)
        
        return {
          minerals: minerals as Record<MineralId, MineralState>,
          wafers,
          crafting: {
            type: 'chip',
            itemId: chipId,
            startedAt: Date.now(),
            duration: chip.craftTime * amount,
            amount,
          },
        }
      }),

      completeCrafting: () => set((state) => {
        if (!state.crafting || !isCraftingComplete(state.crafting)) return state
        
        const { type, itemId, amount } = state.crafting
        
        if (type === 'wafer') {
          const waferState = addWafer(state.wafers[itemId as WaferId], amount)
          return {
            wafers: { ...state.wafers, [itemId]: waferState },
            crafting: null,
          }
        } else {
          const chipState = addChip(state.chips[itemId as ChipId], amount)
          // Recalculate FLOPS
          const newChips = { ...state.chips, [itemId]: chipState }
          const efficiency = PROCESS_NODES[state.currentNode].efficiency
          const flopsPerSecond = calculateFlopsPerSecond(newChips, efficiency)
          
          return {
            chips: newChips,
            flopsPerSecond,
            crafting: null,
          }
        }
      }),

      cancelCrafting: () => set({ crafting: null }),

      // === NODE PROGRESSION ===
      unlockNode: (node) => set((state) => {
        const nodeDef = PROCESS_NODES[node]
        if (!nodeDef) return state
        if (state.unlockedNodes.includes(node)) return state
        if (state.totalFlops.lt(nodeDef.unlockCost.flops)) return state
        
        // Must unlock in order
        const nodeIndex = NODE_ORDER.indexOf(node)
        if (nodeIndex > 0 && !state.unlockedNodes.includes(NODE_ORDER[nodeIndex - 1])) {
          return state
        }
        
        // Spend FLOPS and unlock
        const newUnlocked = [...state.unlockedNodes, node]
        
        // Also unlock new wafers and chips
        const newWafers = { ...state.wafers }
        const newChips = { ...state.chips }
        
        for (const waferId of nodeDef.unlocksWafers) {
          newWafers[waferId] = { ...newWafers[waferId], unlocked: true }
        }
        for (const chipId of nodeDef.unlocksChips) {
          newChips[chipId] = { ...newChips[chipId], unlocked: true }
        }
        
        return {
          totalFlops: state.totalFlops.sub(nodeDef.unlockCost.flops),
          unlockedNodes: newUnlocked,
          currentNode: node,
          wafers: newWafers,
          chips: newChips,
        }
      }),

      // === FLOPS GENERATION ===
      tick: () => set((state) => {
        const now = Date.now()
        const delta = (now - state.lastTick) / 1000 // seconds
        
        if (delta < 0.1) return state // Don't tick too fast
        
        // Auto-complete crafting
        if (state.crafting && isCraftingComplete(state.crafting)) {
          get().completeCrafting()
          return get() // Return fresh state after completion
        }
        
        // Generate FLOPS
        const flopsGained = state.flopsPerSecond.mul(delta)
        
        return {
          lastTick: now,
          totalFlops: state.totalFlops.add(flopsGained),
        }
      }),

      // === UI ===
      setActiveTab: (tab) => set({ activeTab: tab }),

      // === SYSTEM ===
      reset: () => set(createInitialState()),
    }),
    {
      name: 'chip-empire-save-v2',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          return str ? deserialize(str) : null
        },
        setItem: (name, value) => localStorage.setItem(name, serialize(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)

// Ticker - runs every 100ms
let tickerStarted = false
export function startTicker() {
  if (tickerStarted) return
  tickerStarted = true
  setInterval(() => useGameStore.getState().tick(), 100)
}
