import { useGameStore } from '../store/gameStore'
import { formatFlops } from '../engine/fabrication'
import { CHIPS, CHIP_ORDER } from '../data/chips'
import type { ChipId } from '../types/fabrication'

function ChipRow({ chipId }: { chipId: ChipId }) {
  const chip = CHIPS[chipId]
  const chipState = useGameStore((s) => s.chips[chipId])
  
  if (chipState.amount.eq(0)) return null

  const flopsFromThis = chip.flopsPerSecond.mul(chipState.amount)

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{chip.emoji}</span>
        <div>
          <div className="font-medium text-white">{chip.name}</div>
          <div className="text-xs text-slate-400">
            {chip.category.toUpperCase()} • {chip.node}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[--neon-green] text-lg">
          ×{chipState.amount.toFixed(0)}
        </div>
        <div className="text-xs text-slate-400">
          {formatFlops(flopsFromThis)}/s
        </div>
      </div>
    </div>
  )
}

export function ChipsPanel() {
  const totalFlops = useGameStore((s) => s.totalFlops)
  const flopsPerSecond = useGameStore((s) => s.flopsPerSecond)
  const currentNode = useGameStore((s) => s.currentNode)
  const ownedChips = useGameStore((s) => 
    CHIP_ORDER.filter(id => s.chips[id].amount.gt(0))
  )

  return (
    <div className="space-y-6">
      {/* FLOPS Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            Total Compute Power
          </div>
          <div className="text-3xl font-bold font-mono text-[--neon-green] mb-2">
            {formatFlops(totalFlops)}
          </div>
          <div className="text-sm text-slate-400">
            +{formatFlops(flopsPerSecond)}/s
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-slate-400">Process Node</div>
            <div className="font-mono text-[--neon-blue]">{currentNode}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Total Chips</div>
            <div className="font-mono text-[--neon-purple]">{ownedChips.length}</div>
          </div>
        </div>
      </div>
      
      {/* Chip inventory */}
      {ownedChips.length > 0 ? (
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          {ownedChips.map(id => (
            <ChipRow key={id} chipId={id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">🔲</div>
          <p>No chips fabricated yet.</p>
          <p className="text-sm">Craft wafers and fab your first chip!</p>
        </div>
      )}
    </div>
  )
}
