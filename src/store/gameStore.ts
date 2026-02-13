import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
import Decimal from 'break_eternity.js'
import type { GameState, MineralId, MineralState } from '../types/game'
import type { WaferId, ChipId, WaferState, ChipState, FabState } from '../types/fabrication'
import type { ResearchId, ResearchState } from '../types/research'
import type { AutoMinerId, AutoMinerState, OfflineProgress } from '../types/automation'
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
import { AUTO_MINERS, AUTO_MINER_ORDER, getAutoMinerCost } from '../data/automations'

interface FullGameState extends GameState, FabState {
  // Research state
  research: ResearchState
  // Multipliers from research
  miningMultiplier: number
  fabSpeedMultiplier: number
  flopsMultiplier: number
  // Automation state
  autoMiners: Record<AutoMinerId, AutoMinerState>
  autoMiningUnlocked: boolean
  // Offline progress
  offlineProgress: OfflineProgress | null
  // Tab state
  activeTab: 'mine' | 'fab' | 'chips' | 'research' | 'auto'
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
  
  // Automation actions
  buyAutoMiner: (minerId: AutoMinerId) => void
  canBuyAutoMiner: (minerId: AutoMinerId) => boolean
  getAutoMinerCost: (minerId: AutoMinerId) => Decimal
  
  // Offline progress
  dismissOfflineProgress: () => void
  
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

const createInitialAutoState = () => ({
  autoMiners: Object.fromEntries(
    AUTO_MINER_ORDER.map(id => [id, { owned: 0, unlocked: id === 'drill_1' }])
  ) as Record<AutoMinerId, AutoMinerState>,
  autoMiningUnlocked: false,
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
  
  // Automation state
  ...createInitialAutoState(),
  offlineProgress: null,
  
  // UI state
  activeTab: 'mine',
})

// Calculate offline progress
function calculateOfflineProgress(
  state: FullGameState,
  offlineSeconds: number
): OfflineProgress {
  const minerals: Partial<Record<MineralId, Decimal>> = {}
  
  // Auto-miner production
  if (state.autoMiningUnlocked) {
    for (const [minerId, minerState] of Object.entries(state.autoMiners)) {
      if (minerState.owned > 0) {
        const def = AUTO_MINERS[minerId as AutoMinerId]
        const production = def.ratePerSecond * minerState.owned * offlineSeconds * state.miningMultiplier
        
        for (const mineralId of def.targets) {
          if (state.minerals[mineralId].unlocked) {
            const existing = minerals[mineralId] || new Decimal(0)
            minerals[mineralId] = existing.add(production)
          }
        }
      }
    }
  }
  
  // FLOPS generation
  const flops = state.flopsPerSecond.mul(offlineSeconds)
  
  return { minerals, flops, duration: offlineSeconds }
}

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
        if (state.research.completed.includes(researchId)) return false
        if (research.requires) {
          for (const reqId of research.requires) {
            if (!state.research.completed.includes(reqId)) return false
          }
        }
        return state.totalFlops.gte(research.cost)
      },

      buyResearch: (researchId) => set((state) => {
        const research = RESEARCH[researchId]
        if (!research) return state
        if (state.research.completed.includes(researchId)) return state
        if (!get().canBuyResearch(researchId)) return state
        
        const newTotalFlops = state.totalFlops.sub(research.cost)
        const newCompleted = [...state.research.completed, researchId]
        const newTotalSpent = state.research.totalSpent.add(research.cost)
        
        let newState: Partial<FullGameState> = {
          totalFlops: newTotalFlops,
          research: { completed: newCompleted, totalSpent: newTotalSpent },
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
              const efficiency = PROCESS_NODES[newState.currentNode || state.currentNode].efficiency
              const baseFlops = calculateFlopsPerSecond(newState.chips || state.chips, efficiency)
              newState = {
                ...newState,
                flopsMultiplier: newMultiplier,
                flopsPerSecond: baseFlops.mul(newMultiplier),
              }
              break
            }
            case 'unlock_feature': {
              if (effect.feature === 'auto_miner') {
                newState = { ...newState, autoMiningUnlocked: true }
              }
              break
            }
          }
        }
        
        return newState
      }),

      // === AUTOMATION ===
      canBuyAutoMiner: (minerId) => {
        const state = get()
        if (!state.autoMiningUnlocked) return false
        const minerState = state.autoMiners[minerId]
        if (!minerState.unlocked) return false
        
        const cost = get().getAutoMinerCost(minerId)
        // Cost is paid in silicon
        return state.minerals.silicon.amount.gte(cost)
      },

      getAutoMinerCost: (minerId) => {
        const state = get()
        const def = AUTO_MINERS[minerId]
        return getAutoMinerCost(def, state.autoMiners[minerId].owned)
      },

      buyAutoMiner: (minerId) => set((state) => {
        if (!get().canBuyAutoMiner(minerId)) return state
        
        const cost = get().getAutoMinerCost(minerId)
        
        // Deduct silicon
        const newSilicon = {
          ...state.minerals.silicon,
          amount: state.minerals.silicon.amount.sub(cost),
        }
        
        // Increment owned
        const newMinerState = {
          ...state.autoMiners[minerId],
          owned: state.autoMiners[minerId].owned + 1,
        }
        
        // Unlock next tier if needed
        const newAutoMiners = { ...state.autoMiners, [minerId]: newMinerState }
        const tierIndex = AUTO_MINER_ORDER.indexOf(minerId)
        if (tierIndex < AUTO_MINER_ORDER.length - 1) {
          const nextTier = AUTO_MINER_ORDER[tierIndex + 1]
          // Unlock next tier after buying 10 of current
          if (newMinerState.owned >= 10 && !newAutoMiners[nextTier].unlocked) {
            newAutoMiners[nextTier] = { ...newAutoMiners[nextTier], unlocked: true }
          }
        }
        
        return {
          minerals: { ...state.minerals, silicon: newSilicon },
          autoMiners: newAutoMiners,
        }
      }),

      // === OFFLINE PROGRESS ===
      dismissOfflineProgress: () => set((state) => {
        if (!state.offlineProgress) return state
        
        // Apply offline minerals
        const newMinerals = { ...state.minerals }
        for (const [mineralId, amount] of Object.entries(state.offlineProgress.minerals)) {
          if (amount && newMinerals[mineralId as MineralId]) {
            newMinerals[mineralId as MineralId] = {
              ...newMinerals[mineralId as MineralId],
              amount: newMinerals[mineralId as MineralId].amount.add(amount),
              total: newMinerals[mineralId as MineralId].total.add(amount),
            }
          }
        }
        
        return {
          minerals: newMinerals,
          totalFlops: state.totalFlops.add(state.offlineProgress.flops),
          offlineProgress: null,
        }
      }),

      // === TICK ===
      tick: () => set((state) => {
        const now = Date.now()
        const delta = (now - state.lastTick) / 1000
        
        if (delta < 0.1) return state
        
        // Auto-complete crafting
        if (state.crafting && isCraftingComplete(state.crafting)) {
          get().completeCrafting()
          return get()
        }
        
        // Auto-mining
        let newMinerals = state.minerals
        if (state.autoMiningUnlocked) {
          newMinerals = { ...state.minerals }
          for (const [minerId, minerState] of Object.entries(state.autoMiners)) {
            if (minerState.owned > 0) {
              const def = AUTO_MINERS[minerId as AutoMinerId]
              const production = def.ratePerSecond * minerState.owned * delta * state.miningMultiplier
              
              for (const mineralId of def.targets) {
                if (newMinerals[mineralId].unlocked) {
                  newMinerals[mineralId] = {
                    ...newMinerals[mineralId],
                    amount: newMinerals[mineralId].amount.add(production),
                    total: newMinerals[mineralId].total.add(production),
                  }
                }
              }
            }
          }
        }
        
        // Generate FLOPS
        const flopsGained = state.flopsPerSecond.mul(delta)
        
        return {
          lastTick: now,
          minerals: newMinerals,
          totalFlops: state.totalFlops.add(flopsGained),
        }
      }),

      // === UI ===
      setActiveTab: (tab) => set({ activeTab: tab }),

      // === SYSTEM ===
      reset: () => set(createInitialState()),
    }),
    {
      name: 'chip-empire-save-v4',
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name)
            if (!str) return null
            
            const data = deserialize(str)
            
            // Ensure critical Decimal fields exist (migration safety)
            if (data.state) {
              const defaults = createInitialState()
              // Ensure Decimal fields have proper instances
              if (!data.state.flopsPerSecond || typeof data.state.flopsPerSecond.mul !== 'function') {
                data.state.flopsPerSecond = new Decimal(data.state.flopsPerSecond || 0)
              }
              if (!data.state.totalFlops || typeof data.state.totalFlops.add !== 'function') {
                data.state.totalFlops = new Decimal(data.state.totalFlops || 0)
              }
              if (!data.state.miningPower || typeof data.state.miningPower.mul !== 'function') {
                data.state.miningPower = new Decimal(data.state.miningPower || 1)
              }
              // Ensure research state exists
              if (!data.state.research) {
                data.state.research = defaults.research
              }
              if (!data.state.research.totalSpent || typeof data.state.research.totalSpent.add !== 'function') {
                data.state.research.totalSpent = new Decimal(data.state.research.totalSpent || 0)
              }
              // Ensure autoMiners exist
              if (!data.state.autoMiners) {
                data.state.autoMiners = defaults.autoMiners
              }
              // Ensure multipliers exist
              data.state.miningMultiplier = data.state.miningMultiplier ?? 1
              data.state.fabSpeedMultiplier = data.state.fabSpeedMultiplier ?? 1
              data.state.flopsMultiplier = data.state.flopsMultiplier ?? 1
              data.state.autoMiningUnlocked = data.state.autoMiningUnlocked ?? false
              
              // Ensure wafers exist with proper Decimal amounts
              if (!data.state.wafers) {
                data.state.wafers = defaults.wafers
              } else {
                for (const waferId of WAFER_ORDER) {
                  if (!data.state.wafers[waferId]) {
                    data.state.wafers[waferId] = defaults.wafers[waferId]
                  } else if (!data.state.wafers[waferId].amount || typeof data.state.wafers[waferId].amount.add !== 'function') {
                    data.state.wafers[waferId].amount = new Decimal(data.state.wafers[waferId].amount || 0)
                  }
                }
              }
              
              // Ensure chips exist with proper Decimal amounts
              if (!data.state.chips) {
                data.state.chips = defaults.chips
              } else {
                for (const chipId of CHIP_ORDER) {
                  if (!data.state.chips[chipId]) {
                    data.state.chips[chipId] = defaults.chips[chipId]
                  } else if (!data.state.chips[chipId].amount || typeof data.state.chips[chipId].amount.add !== 'function') {
                    data.state.chips[chipId].amount = new Decimal(data.state.chips[chipId].amount || 0)
                  }
                }
              }
              
              // Ensure minerals exist with proper Decimal amounts
              if (!data.state.minerals) {
                data.state.minerals = defaults.minerals
              } else {
                for (const mineralId of MINERAL_ORDER) {
                  if (!data.state.minerals[mineralId]) {
                    data.state.minerals[mineralId] = defaults.minerals[mineralId]
                  } else {
                    const m = data.state.minerals[mineralId]
                    if (!m.amount || typeof m.amount.add !== 'function') {
                      m.amount = new Decimal(m.amount || 0)
                    }
                    if (!m.total || typeof m.total.add !== 'function') {
                      m.total = new Decimal(m.total || 0)
                    }
                  }
                }
              }
            }
            
            // Calculate offline progress
            if (data.state && data.state.lastTick) {
              const offlineSeconds = (Date.now() - data.state.lastTick) / 1000
              // Only calculate if offline > 1 minute
              if (offlineSeconds > 60) {
                try {
                  const progress = calculateOfflineProgress(data.state as FullGameState, offlineSeconds)
                  // Only show modal if we gained something
                  if (progress.flops.gt(0) || Object.keys(progress.minerals).length > 0) {
                    data.state.offlineProgress = progress
                  }
                } catch (e) {
                  console.warn('Failed to calculate offline progress:', e)
                }
                data.state.lastTick = Date.now()
              }
            }
            
            return data
          } catch (e) {
            console.error('Failed to load save, resetting:', e)
            localStorage.removeItem(name)
            return null
          }
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
