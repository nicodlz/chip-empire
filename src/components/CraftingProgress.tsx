import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getCraftingProgress } from '../engine/fabrication'
import { WAFERS } from '../data/wafers'
import { CHIPS } from '../data/chips'
import type { QueuedCraft } from '../types/fabrication'

function getItemDef(type: 'wafer' | 'chip', itemId: string) {
  return type === 'wafer'
    ? WAFERS[itemId as keyof typeof WAFERS]
    : CHIPS[itemId as keyof typeof CHIPS]
}

function QueueItem({ item, onCancel }: { item: QueuedCraft; onCancel: () => void }) {
  const def = getItemDef(item.type, item.itemId)
  if (!def) return null
  
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">{def.emoji}</span>
        <span className="text-sm text-slate-300">
          {def.name}
          {item.amount > 1 && <span className="text-slate-500"> ×{item.amount}</span>}
        </span>
        <span className="text-xs text-slate-500">
          ({(item.duration / 1000).toFixed(1)}s)
        </span>
      </div>
      <button
        onClick={onCancel}
        className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1"
      >
        ✕
      </button>
    </div>
  )
}

export function CraftingProgress() {
  const crafting = useGameStore((s) => s.crafting)
  const craftingQueue = useGameStore((s) => s.craftingQueue)
  const autoFabUnlocked = useGameStore((s) => s.autoFabUnlocked)
  const cancelCrafting = useGameStore((s) => s.cancelCrafting)
  const cancelQueueItem = useGameStore((s) => s.cancelQueueItem)
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

  if (!crafting && craftingQueue.length === 0) return null

  const item = crafting ? getItemDef(crafting.type, crafting.itemId) : null
  
  const remainingMs = crafting ? Math.max(0, (crafting.startedAt + crafting.duration) - Date.now()) : 0
  const remainingSec = (remainingMs / 1000).toFixed(1)

  return (
    <div className="space-y-2">
      {/* Current crafting */}
      {crafting && item && (
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
      )}
      
      {/* Queue */}
      {autoFabUnlocked && craftingQueue.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <span>📋</span> Queue ({craftingQueue.length})
          </div>
          <div className="space-y-1">
            {craftingQueue.map((qItem) => (
              <QueueItem 
                key={qItem.id} 
                item={qItem} 
                onCancel={() => cancelQueueItem(qItem.id)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
