import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StorageValue } from 'zustand/middleware'
import Decimal from 'break_eternity.js'
import type { GameState, MineralId } from '../types/game'
import { createMineralState, addMineral, mineMineral } from '../engine/resources'
import { MINERALS, TIER_1_MINERALS } from '../data/minerals'

interface GameStore extends GameState {
  mine: (mineralId: MineralId) => void
  unlockMineral: (mineralId: MineralId) => void
  reset: () => void
}

const createInitialState = (): GameState => ({
  minerals: Object.fromEntries(
    Object.keys(MINERALS).map(id => [
      id,
      createMineralState(TIER_1_MINERALS.includes(id as MineralId))
    ])
  ) as Record<MineralId, any>,
  miningPower: new Decimal(1),
  lastTick: Date.now(),
})

// Decimal serialization for localStorage
const serialize = (state: StorageValue<GameState>) => 
  JSON.stringify(state, (_, v) => v instanceof Decimal ? `__D__${v.toString()}` : v)

const deserialize = (str: string): StorageValue<GameState> =>
  JSON.parse(str, (_, v) => typeof v === 'string' && v.startsWith('__D__') ? new Decimal(v.slice(5)) : v)

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...createInitialState(),

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

      reset: () => set(createInitialState()),
    }),
    {
      name: 'chip-empire-save',
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
