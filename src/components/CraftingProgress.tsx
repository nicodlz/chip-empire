import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getCraftingProgress } from '../engine/fabrication'
import { WAFERS } from '../data/wafers'
import { CHIPS } from '../data/chips'

export function CraftingProgress() {
  const crafting = useGameStore((s) => s.crafting)
  const cancelCrafting = useGameStore((s) => s.cancelCrafting)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!crafting) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress(getCraftingProgress(crafting) * 100)
    }, 50)

    return () => clearInterval(interval)
  }, [crafting])

  if (!crafting) return null

  const item = crafting.type === 'wafer' 
    ? WAFERS[crafting.itemId as keyof typeof WAFERS]
    : CHIPS[crafting.itemId as keyof typeof CHIPS]
  
  // Safety check for corrupted crafting state
  if (!item) {
    console.error('Invalid crafting item:', crafting.itemId)
    return null
  }
  
  const remainingMs = Math.max(0, (crafting.startedAt + crafting.duration) - Date.now())
  const remainingSec = (remainingMs / 1000).toFixed(1)

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{item.emoji}</span>
          <div>
            <div className="font-medium text-white">
              Crafting {item.name}
              {crafting.amount > 1 && <span className="text-slate-400"> ×{crafting.amount}</span>}
            </div>
            <div className="text-xs text-slate-400">
              {remainingSec}s remaining
            </div>
          </div>
        </div>
        <button
          onClick={cancelCrafting}
          className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10"
        >
          Cancel
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[--neon-blue] to-[--neon-purple] transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
