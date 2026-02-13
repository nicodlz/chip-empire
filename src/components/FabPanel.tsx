import { useGameStore } from '../store/gameStore'
import { canCraftWafer, canCraftChip } from '../engine/fabrication'
import { WAFERS, WAFER_ORDER } from '../data/wafers'
import { CHIPS, CHIP_ORDER } from '../data/chips'
import { MINERALS } from '../data/minerals'
import { CraftingProgress } from './CraftingProgress'
import type { WaferId, ChipId } from '../types/fabrication'
import type { MineralId } from '../types/game'

// Safe number formatting
function formatCost(cost: number, have: number | undefined): string {
  const h = have ?? 0
  if (h >= cost) return `${cost}`
  return `${Math.floor(h)}/${cost}`
}

// Safe Decimal to number
function safeToNumber(val: unknown): number {
  if (val && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber()
  }
  return 0
}

function WaferCard({ waferId }: { waferId: WaferId }) {
  const wafer = WAFERS[waferId]
  const minerals = useGameStore((s) => s.minerals)
  const waferState = useGameStore((s) => s.wafers?.[waferId])
  const crafting = useGameStore((s) => s.crafting)
  const autoFabUnlocked = useGameStore((s) => s.autoFabUnlocked)
  const startCraftWafer = useGameStore((s) => s.startCraftWafer)

  // Skip if no wafer data
  if (!wafer || !waferState) return null
  if (!waferState.unlocked) return null

  const hasResources = canCraftWafer(waferId, minerals)
  const canCraft = hasResources && (!crafting || autoFabUnlocked)

  return (
    <div className={`
      bg-slate-800/30 rounded-xl p-4 border transition-all
      ${canCraft ? 'border-[--neon-blue]/50 hover:border-[--neon-blue]' : 'border-slate-700/30 opacity-60'}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{wafer.emoji}</span>
          <div>
            <div className="font-medium text-white">{wafer.name}</div>
            <div className="text-xs text-slate-400">
              Owned: {safeToNumber(waferState.amount).toFixed(0)}
            </div>
          </div>
        </div>
        <button
          onClick={() => startCraftWafer(waferId)}
          disabled={!canCraft}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${canCraft 
              ? 'bg-[--neon-blue] text-slate-950 hover:brightness-110 active:scale-95' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {crafting && autoFabUnlocked ? 'Queue' : 'Craft'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(wafer.recipe).map(([mineralId, cost]) => {
          const mineral = MINERALS[mineralId as MineralId]
          const mineralState = minerals?.[mineralId as MineralId]
          if (!mineral) return null
          const have = safeToNumber(mineralState?.amount)
          const enough = have >= cost
          return (
            <span
              key={mineralId}
              className={`text-xs px-2 py-1 rounded-full ${
                enough ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {mineral.emoji} {formatCost(cost, have)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ChipCard({ chipId }: { chipId: ChipId }) {
  const chip = CHIPS[chipId]
  const minerals = useGameStore((s) => s.minerals)
  const wafers = useGameStore((s) => s.wafers)
  const chipState = useGameStore((s) => s.chips?.[chipId])
  const currentNode = useGameStore((s) => s.currentNode)
  const crafting = useGameStore((s) => s.crafting)
  const autoFabUnlocked = useGameStore((s) => s.autoFabUnlocked)
  const startCraftChip = useGameStore((s) => s.startCraftChip)

  // Skip if no chip data
  if (!chip || !chipState) return null
  if (!chipState.unlocked) return null

  const hasResources = canCraftChip(chipId, minerals, wafers, currentNode)
  const canCraft = hasResources && (!crafting || autoFabUnlocked)
  const waferState = wafers?.[chip.waferCost?.type]
  
  if (!waferState) return null

  return (
    <div className={`
      bg-slate-800/30 rounded-xl p-4 border transition-all
      ${canCraft ? 'border-[--neon-purple]/50 hover:border-[--neon-purple]' : 'border-slate-700/30 opacity-60'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{chip.emoji}</span>
          <div>
            <div className="font-medium text-white">{chip.name}</div>
            <div className="text-xs text-slate-400">
              {chip.node} • Owned: {safeToNumber(chipState.amount).toFixed(0)}
            </div>
          </div>
        </div>
        <button
          onClick={() => startCraftChip(chipId)}
          disabled={!canCraft}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${canCraft 
              ? 'bg-[--neon-purple] text-white hover:brightness-110 active:scale-95' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {crafting && autoFabUnlocked ? 'Queue' : 'Fab'}
        </button>
      </div>
      
      <p className="text-xs text-slate-500 mb-2 italic">{chip.description}</p>
      
      <div className="flex flex-wrap gap-2">
        {/* Wafer cost */}
        {(() => {
          const waferDef = WAFERS[chip.waferCost?.type]
          const waferAmount = safeToNumber(waferState?.amount)
          const needed = chip.waferCost?.amount ?? 0
          const hasEnough = waferAmount >= needed
          return (
            <span className={`text-xs px-2 py-1 rounded-full ${
              hasEnough ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {waferDef?.emoji ?? '?'} {formatCost(needed, waferAmount)}
            </span>
          )
        })()}
        
        {/* Extra mineral costs */}
        {chip.extraCosts && Object.entries(chip.extraCosts).map(([mineralId, cost]) => {
          const mineral = MINERALS[mineralId as MineralId]
          const mineralState = minerals?.[mineralId as MineralId]
          if (!mineral) return null
          const have = safeToNumber(mineralState?.amount)
          return (
            <span
              key={mineralId}
              className={`text-xs px-2 py-1 rounded-full ${
                have >= cost ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {mineral.emoji} {formatCost(cost, have)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function FabPanel() {
  const wafers = useGameStore((s) => s.wafers)
  const chips = useGameStore((s) => s.chips)
  
  // Safe filtering
  const unlockedWafers = WAFER_ORDER.filter(id => wafers?.[id]?.unlocked)
  const unlockedChips = CHIP_ORDER.filter(id => chips?.[id]?.unlocked)

  return (
    <div className="space-y-6">
      <CraftingProgress />
      
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span>💿</span> Wafers
        </h2>
        <div className="space-y-3">
          {unlockedWafers.length === 0 ? (
            <p className="text-slate-500 text-sm">No wafers unlocked yet</p>
          ) : (
            unlockedWafers.map(id => <WaferCard key={id} waferId={id} />)
          )}
        </div>
      </section>
      
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span>🔲</span> Chips
        </h2>
        <div className="space-y-3">
          {unlockedChips.length === 0 ? (
            <p className="text-slate-500 text-sm">No chips unlocked yet</p>
          ) : (
            unlockedChips.map(id => <ChipCard key={id} chipId={id} />)
          )}
        </div>
      </section>
    </div>
  )
}
