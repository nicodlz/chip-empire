import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
import Decimal from 'break_eternity.js'
import type { GameState, MineralId, MineralState } from '../types/game'
import type { WaferId, ChipId, WaferState, ChipState, FabState } from '../types/fabrication'
import type { ResearchId, ResearchState } from '../types/research'
import { createMineralState, addMineral, mineMineral } from '../engine/resources'
import { 
  createWaferState, createChipState, addWafer, addChip,
  canCraftWafer, canCraftChip, deductWaferCosts, deductChipCosts,
  calculateFlopsPerSecond, isCraftingComplete,
} from '../engine/fabrication'
import { MINERALS, TIER_1_MINERALS, MINERAL_ORDER } from '../data/minerals'
import { WAFERS, WAFER_ORDER } from '../data/wafers'
import { CHIPS, STARTER_CHIPS, CHIP_ORDER } from '../data/chips'
import { PROCESS_NODES } from '../data/nodes'
import { RESEARCH } from '../data/research'

interface FullGameState extends GameState, FabState {
  // Research state
  research: ResearchState
  // Multipliers from research
  miningMultiplier: number
  fabSpeedMultiplier: number
  flopsMultiplier: number
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
  
  // Research actions
  buyResearch: (researchId: ResearchId) => void
  canBuyResearch: (researchId: ResearchId) => boolean
  
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
  
  // Research state
  research: {
    completed: [],
    totalSpent: new Decimal(0),
  },
  miningMultiplier: 1,
  fabSpeedMultiplier: 1,
  flopsMultiplier: 1,
  
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
        
        const baseGain = mineMineral(mineralId, state.miningPower)
        const gained = baseGain.mul(state.miningMultiplier)
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
        if (state.crafting) return state
        if (!canCraftWafer(waferId, state.minerals, amount)) return state
        
        const wafer = WAFERS[waferId]
        const newMinerals = deductWaferCosts(waferId, state.minerals, amount)
        const adjustedDuration = (wafer.craftTime * amount) / state.fabSpeedMultiplier
        
        return {
          minerals: newMinerals as Record<MineralId, MineralState>,
          crafting: {
            type: 'wafer',
            itemId: waferId,
            startedAt: Date.now(),
            duration: adjustedDuration,
            amount,
          },
        }
      }),

      startCraftChip: (chipId, amount = 1) => set((state) => {
        if (state.crafting) return state
        if (!canCraftChip(chipId, state.minerals, state.wafers, state.currentNode, amount)) return state
        
        const chip = CHIPS[chipId]
        const { minerals, wafers } = deductChipCosts(chipId, state.minerals, state.wafers, amount)
        const adjustedDuration = (chip.craftTime * amount) / state.fabSpeedMultiplier
        
        return {
          minerals: minerals as Record<MineralId, MineralState>,
          wafers,
          crafting: {
            type: 'chip',
            itemId: chipId,
            startedAt: Date.now(),
            duration: adjustedDuration,
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
          const newChips = { ...state.chips, [itemId]: chipState }
          const efficiency = PROCESS_NODES[state.currentNode].efficiency
          const flopsPerSecond = calculateFlopsPerSecond(newChips, efficiency).mul(state.flopsMultiplier)
          
          return {
            chips: newChips,
            flopsPerSecond,
            crafting: null,
          }
        }
      }),

      cancelCrafting: () => set({ crafting: null }),

      // === RESEARCH ===
      canBuyResearch: (researchId) => {
        const state = get()
        const research = RESEARCH[researchId]
        if (!research) return false
        
        // Already completed?
        if (state.research.completed.includes(researchId)) return false
        
        // Check prerequisites
        if (research.requires) {
          for (const reqId of research.requires) {
            if (!state.research.completed.includes(reqId)) return false
          }
        }
        
        // Check cost
        return state.totalFlops.gte(research.cost)
      },

      buyResearch: (researchId) => set((state) => {
        const research = RESEARCH[researchId]
        if (!research) return state
        if (state.research.completed.includes(researchId)) return state
        if (!get().canBuyResearch(researchId)) return state
        
        // Deduct FLOPS
        const newTotalFlops = state.totalFlops.sub(research.cost)
        const newCompleted = [...state.research.completed, researchId]
        const newTotalSpent = state.research.totalSpent.add(research.cost)
        
        // Apply effects
        let newState: Partial<FullGameState> = {
          totalFlops: newTotalFlops,
          research: {
            completed: newCompleted,
            totalSpent: newTotalSpent,
          },
        }
        
        for (const effect of research.effects) {
          switch (effect.type) {
            case 'unlock_node': {
              const node = effect.node
              if (!state.unlockedNodes.includes(node)) {
                const nodeDef = PROCESS_NODES[node]
                const newWafers = { ...(newState.wafers || state.wafers) }
                const newChips = { ...(newState.chips || state.chips) }
                
                for (const waferId of nodeDef.unlocksWafers) {
                  newWafers[waferId] = { ...newWafers[waferId], unlocked: true }
                }
                for (const chipId of nodeDef.unlocksChips) {
                  newChips[chipId] = { ...newChips[chipId], unlocked: true }
                }
                
                newState = {
                  ...newState,
                  unlockedNodes: [...state.unlockedNodes, node],
                  currentNode: node,
                  wafers: newWafers,
                  chips: newChips,
                }
              }
              break
            }
            case 'unlock_minerals': {
              const tier = effect.tier
              const newMinerals = { ...(newState.minerals || state.minerals) }
              for (const mineralId of MINERAL_ORDER) {
                if (MINERALS[mineralId].tier === tier) {
                  newMinerals[mineralId] = { ...newMinerals[mineralId], unlocked: true }
                }
              }
              newState = { ...newState, minerals: newMinerals }
              break
            }
            case 'mining_multiplier': {
              newState = {
                ...newState,
                miningMultiplier: (newState.miningMultiplier || state.miningMultiplier) * effect.value,
              }
              break
            }
            case 'fab_speed_multiplier': {
              newState = {
                ...newState,
                fabSpeedMultiplier: (newState.fabSpeedMultiplier || state.fabSpeedMultiplier) * effect.value,
              }
              break
            }
            case 'flops_multiplier': {
              const newMultiplier = (newState.flopsMultiplier || state.flopsMultiplier) * effect.value
              // Recalculate FLOPS per second
              const efficiency = PROCESS_NODES[newState.currentNode || state.currentNode].efficiency
              const baseFlops = calculateFlopsPerSecond(newState.chips || state.chips, efficiency)
              newState = {
                ...newState,
                flopsMultiplier: newMultiplier,
                flopsPerSecond: baseFlops.mul(newMultiplier),
              }
              break
            }
          }
        }
        
        return newState
      }),

      // === FLOPS GENERATION ===
      tick: () => set((state) => {
        const now = Date.now()
        const delta = (now - state.lastTick) / 1000
        
        if (delta < 0.1) return state
        
        // Auto-complete crafting
        if (state.crafting && isCraftingComplete(state.crafting)) {
          get().completeCrafting()
          return get()
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
      name: 'chip-empire-save-v3',
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
