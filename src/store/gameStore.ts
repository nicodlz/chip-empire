import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

// ============================================
// TYPES
// ============================================

interface FullGameState extends GameState, FabState {
  research: ResearchState
  miningMultiplier: number
  fabSpeedMultiplier: number
  flopsMultiplier: number
  autoMiners: Record<AutoMinerId, AutoMinerState>
  autoMiningUnlocked: boolean
  offlineProgress: OfflineProgress | null
  activeTab: 'mine' | 'fab' | 'chips' | 'research' | 'auto'
}

interface GameStore extends FullGameState {
  mine: (mineralId: MineralId) => void
  unlockMineral: (mineralId: MineralId) => void
  startCraftWafer: (waferId: WaferId, amount?: number) => void
  startCraftChip: (chipId: ChipId, amount?: number) => void
  completeCrafting: () => void
  cancelCrafting: () => void
  buyResearch: (researchId: ResearchId) => void
  canBuyResearch: (researchId: ResearchId) => boolean
  buyAutoMiner: (minerId: AutoMinerId) => void
  canBuyAutoMiner: (minerId: AutoMinerId) => boolean
  getAutoMinerCost: (minerId: AutoMinerId) => Decimal
  dismissOfflineProgress: () => void
  tick: () => void
  setActiveTab: (tab: FullGameState['activeTab']) => void
  reset: () => void
}

// ============================================
// INITIAL STATE CREATORS
// ============================================

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
  minerals: Object.fromEntries(
    Object.keys(MINERALS).map(id => [
      id,
      createMineralState(TIER_1_MINERALS.includes(id as MineralId))
    ])
  ) as Record<MineralId, MineralState>,
  miningPower: new Decimal(1),
  lastTick: Date.now(),
  ...createInitialFabState(),
  research: { completed: [], totalSpent: new Decimal(0) },
  miningMultiplier: 1,
  fabSpeedMultiplier: 1,
  flopsMultiplier: 1,
  ...createInitialAutoState(),
  offlineProgress: null,
  activeTab: 'mine',
})

// ============================================
// HELPERS
// ============================================

function ensureDecimal(value: unknown, fallback: number = 0): Decimal {
  if (value instanceof Decimal) return value
  if (typeof value === 'object' && value !== null && typeof (value as any).add === 'function') {
    return value as Decimal
  }
  try {
    return new Decimal(value as any || fallback)
  } catch {
    return new Decimal(fallback)
  }
}

function calculateOfflineProgress(state: FullGameState, offlineSeconds: number): OfflineProgress {
  const minerals: Partial<Record<MineralId, Decimal>> = {}
  
  if (state.autoMiningUnlocked && state.autoMiners) {
    for (const [minerId, minerState] of Object.entries(state.autoMiners)) {
      if (!minerState || minerState.owned <= 0) continue
      const def = AUTO_MINERS[minerId as AutoMinerId]
      if (!def) continue
      const production = def.ratePerSecond * minerState.owned * offlineSeconds * (state.miningMultiplier || 1)
      
      for (const mineralId of def.targets) {
        const mineral = state.minerals?.[mineralId]
        if (!mineral?.unlocked) continue
        const existing = minerals[mineralId] || new Decimal(0)
        minerals[mineralId] = existing.add(production)
      }
    }
  }
  
  const flops = ensureDecimal(state.flopsPerSecond).mul(offlineSeconds)
  return { minerals, flops, duration: offlineSeconds }
}

// ============================================
// SERIALIZATION
// ============================================

const serialize = (state: { state: FullGameState; version?: number }) => 
  JSON.stringify(state, (_, v) => v instanceof Decimal ? `__D__${v.toString()}` : v)

const deserialize = (str: string): { state: FullGameState; version?: number } =>
  JSON.parse(str, (_, v) => typeof v === 'string' && v.startsWith('__D__') ? new Decimal(v.slice(5)) : v)

// Deep merge loaded state with defaults, ensuring all Decimals are valid
function mergeState(persisted: Partial<FullGameState> | undefined): FullGameState {
  const defaults = createInitialState()
  
  if (!persisted) return defaults
  
  // Merge minerals
  const minerals = { ...defaults.minerals }
  if (persisted.minerals) {
    for (const id of MINERAL_ORDER) {
      if (persisted.minerals[id]) {
        minerals[id] = {
          amount: ensureDecimal(persisted.minerals[id].amount),
          total: ensureDecimal(persisted.minerals[id].total),
          unlocked: persisted.minerals[id].unlocked ?? defaults.minerals[id].unlocked,
        }
      }
    }
  }
  
  // Merge wafers
  const wafers = { ...defaults.wafers }
  if (persisted.wafers) {
    for (const id of WAFER_ORDER) {
      if (persisted.wafers[id]) {
        wafers[id] = {
          amount: ensureDecimal(persisted.wafers[id].amount),
          total: ensureDecimal(persisted.wafers[id].total),
          unlocked: persisted.wafers[id].unlocked ?? defaults.wafers[id].unlocked,
        }
      }
    }
  }
  
  // Merge chips
  const chips = { ...defaults.chips }
  if (persisted.chips) {
    for (const id of CHIP_ORDER) {
      if (persisted.chips[id]) {
        chips[id] = {
          amount: ensureDecimal(persisted.chips[id].amount),
          total: ensureDecimal(persisted.chips[id].total),
          unlocked: persisted.chips[id].unlocked ?? defaults.chips[id].unlocked,
        }
      }
    }
  }
  
  // Merge autoMiners
  const autoMiners = { ...defaults.autoMiners }
  if (persisted.autoMiners) {
    for (const id of AUTO_MINER_ORDER) {
      if (persisted.autoMiners[id]) {
        autoMiners[id] = {
          owned: persisted.autoMiners[id].owned ?? 0,
          unlocked: persisted.autoMiners[id].unlocked ?? defaults.autoMiners[id].unlocked,
        }
      }
    }
  }
  
  // Merge research
  const research = {
    completed: persisted.research?.completed ?? [],
    totalSpent: ensureDecimal(persisted.research?.totalSpent),
  }
  
  return {
    minerals,
    wafers,
    chips,
    autoMiners,
    research,
    miningPower: ensureDecimal(persisted.miningPower, 1),
    totalFlops: ensureDecimal(persisted.totalFlops),
    flopsPerSecond: ensureDecimal(persisted.flopsPerSecond),
    currentNode: persisted.currentNode ?? defaults.currentNode,
    unlockedNodes: persisted.unlockedNodes ?? defaults.unlockedNodes,
    crafting: persisted.crafting ?? null,
    lastTick: persisted.lastTick ?? Date.now(),
    miningMultiplier: persisted.miningMultiplier ?? 1,
    fabSpeedMultiplier: persisted.fabSpeedMultiplier ?? 1,
    flopsMultiplier: persisted.flopsMultiplier ?? 1,
    autoMiningUnlocked: persisted.autoMiningUnlocked ?? false,
    offlineProgress: persisted.offlineProgress ?? null,
    activeTab: persisted.activeTab ?? 'mine',
  }
}

// ============================================
// STORE
// ============================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      mine: (mineralId) => set((state) => {
        const mineral = state.minerals[mineralId]
        if (!mineral?.unlocked) return state
        
        const baseGain = mineMineral(mineralId, state.miningPower)
        const gained = baseGain.mul(state.miningMultiplier)
        return {
          minerals: {
            ...state.minerals,
            [mineralId]: addMineral(mineral, gained),
          },
        }
      }),

      unlockMineral: (mineralId) => set((state) => {
        const mineral = state.minerals[mineralId]
        if (!mineral) return state
        return {
          minerals: {
            ...state.minerals,
            [mineralId]: { ...mineral, unlocked: true },
          },
        }
      }),

      startCraftWafer: (waferId, amount = 1) => set((state) => {
        if (state.crafting) return state
        const wafer = WAFERS[waferId]
        if (!wafer) return state
        if (!canCraftWafer(waferId, state.minerals, amount)) return state
        
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
        const chip = CHIPS[chipId]
        if (!chip) return state
        if (!canCraftChip(chipId, state.minerals, state.wafers, state.currentNode, amount)) return state
        
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
          const currentWafer = state.wafers[itemId as WaferId]
          if (!currentWafer) return { crafting: null }
          const waferState = addWafer(currentWafer, amount)
          return {
            wafers: { ...state.wafers, [itemId]: waferState },
            crafting: null,
          }
        } else {
          const currentChip = state.chips[itemId as ChipId]
          if (!currentChip) return { crafting: null }
          const chipState = addChip(currentChip, amount)
          const newChips = { ...state.chips, [itemId]: chipState }
          const nodeDef = PROCESS_NODES[state.currentNode]
          const efficiency = nodeDef?.efficiency ?? 1
          const flopsPerSecond = calculateFlopsPerSecond(newChips, efficiency).mul(state.flopsMultiplier)
          
          return {
            chips: newChips,
            flopsPerSecond,
            crafting: null,
          }
        }
      }),

      cancelCrafting: () => set({ crafting: null }),

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
              const nodeDef = PROCESS_NODES[node]
              if (!nodeDef) break
              if (!state.unlockedNodes.includes(node)) {
                const newWafers = { ...(newState.wafers || state.wafers) }
                const newChips = { ...(newState.chips || state.chips) }
                
                for (const waferId of nodeDef.unlocksWafers || []) {
                  if (newWafers[waferId]) {
                    newWafers[waferId] = { ...newWafers[waferId], unlocked: true }
                  }
                }
                for (const chipId of nodeDef.unlocksChips || []) {
                  if (newChips[chipId]) {
                    newChips[chipId] = { ...newChips[chipId], unlocked: true }
                  }
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
              const currentNode = newState.currentNode || state.currentNode
              const nodeDef = PROCESS_NODES[currentNode]
              const efficiency = nodeDef?.efficiency ?? 1
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

      canBuyAutoMiner: (minerId) => {
        const state = get()
        if (!state.autoMiningUnlocked) return false
        const minerState = state.autoMiners[minerId]
        if (!minerState?.unlocked) return false
        const cost = get().getAutoMinerCost(minerId)
        return state.minerals.silicon.amount.gte(cost)
      },

      getAutoMinerCost: (minerId) => {
        const state = get()
        const def = AUTO_MINERS[minerId]
        const owned = state.autoMiners[minerId]?.owned ?? 0
        return getAutoMinerCost(def, owned)
      },

      buyAutoMiner: (minerId) => set((state) => {
        if (!get().canBuyAutoMiner(minerId)) return state
        
        const cost = get().getAutoMinerCost(minerId)
        const newSilicon = {
          ...state.minerals.silicon,
          amount: state.minerals.silicon.amount.sub(cost),
        }
        
        const newMinerState = {
          ...state.autoMiners[minerId],
          owned: state.autoMiners[minerId].owned + 1,
        }
        
        const newAutoMiners = { ...state.autoMiners, [minerId]: newMinerState }
        const tierIndex = AUTO_MINER_ORDER.indexOf(minerId)
        if (tierIndex < AUTO_MINER_ORDER.length - 1) {
          const nextTier = AUTO_MINER_ORDER[tierIndex + 1]
          if (newMinerState.owned >= 10 && !newAutoMiners[nextTier].unlocked) {
            newAutoMiners[nextTier] = { ...newAutoMiners[nextTier], unlocked: true }
          }
        }
        
        return {
          minerals: { ...state.minerals, silicon: newSilicon },
          autoMiners: newAutoMiners,
        }
      }),

      dismissOfflineProgress: () => set((state) => {
        if (!state.offlineProgress) return state
        
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

      tick: () => set((state) => {
        const now = Date.now()
        const delta = (now - state.lastTick) / 1000
        
        if (delta < 0.1) return state
        
        if (state.crafting && isCraftingComplete(state.crafting)) {
          get().completeCrafting()
          return get()
        }
        
        let newMinerals = state.minerals
        if (state.autoMiningUnlocked && state.autoMiners) {
          newMinerals = { ...state.minerals }
          for (const [minerId, minerState] of Object.entries(state.autoMiners)) {
            if (!minerState || minerState.owned <= 0) continue
            const def = AUTO_MINERS[minerId as AutoMinerId]
            if (!def) continue
            const production = def.ratePerSecond * minerState.owned * delta * state.miningMultiplier
            
            for (const mineralId of def.targets) {
              const mineral = newMinerals[mineralId]
              if (!mineral?.unlocked) continue
              newMinerals[mineralId] = {
                ...mineral,
                amount: mineral.amount.add(production),
                total: mineral.total.add(production),
              }
            }
          }
        }
        
        const flopsGained = state.flopsPerSecond.mul(delta)
        
        return {
          lastTick: now,
          minerals: newMinerals,
          totalFlops: state.totalFlops.add(flopsGained),
        }
      }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      reset: () => set(createInitialState()),
    }),
    {
      name: 'chip-empire-save-v5', // New version to force fresh start
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name)
            if (!str) return null
            
            const parsed = deserialize(str)
            const merged = mergeState(parsed.state)
            
            // Calculate offline progress
            if (merged.lastTick) {
              const offlineSeconds = (Date.now() - merged.lastTick) / 1000
              if (offlineSeconds > 60) {
                try {
                  const progress = calculateOfflineProgress(merged, offlineSeconds)
                  if (progress.flops.gt(0) || Object.keys(progress.minerals).length > 0) {
                    merged.offlineProgress = progress
                  }
                } catch (e) {
                  console.warn('Failed to calculate offline progress:', e)
                }
                merged.lastTick = Date.now()
              }
            }
            
            return { state: merged, version: parsed.version }
          } catch (e) {
            console.error('Failed to load save:', e)
            localStorage.removeItem(name)
            return null
          }
        },
        setItem: (name, value) => localStorage.setItem(name, serialize(value as any)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)

// Ticker
let tickerStarted = false
export function startTicker() {
  if (tickerStarted) return
  tickerStarted = true
  setInterval(() => useGameStore.getState().tick(), 100)
}
