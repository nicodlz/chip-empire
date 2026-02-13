import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getCraftingProgress } from '@/engine/fabrication'
import { WAFERS } from '@/data/wafers'
import { CHIPS } from '@/data/chips'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

function getItemDef(type: 'wafer' | 'chip', itemId: string) {
  return type === 'wafer'
    ? WAFERS[itemId as keyof typeof WAFERS]
    : CHIPS[itemId as keyof typeof CHIPS]
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

  // Empty state placeholder to maintain height
  if (!crafting && craftingQueue.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a wafer or chip to craft</p>
      </div>
    )
  }

  const item = crafting ? getItemDef(crafting.type, crafting.itemId) : null
  const remainingMs = crafting ? Math.max(0, (crafting.startedAt + crafting.duration) - Date.now()) : 0
  const remainingSec = (remainingMs / 1000).toFixed(1)

  return (
    <div className="space-y-2">
      {/* Current crafting - compact */}
      {crafting && item && (
        <Card className="bg-card/80">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {item.name}
                    {crafting.amount > 1 && <span className="text-muted-foreground"> ×{crafting.amount}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{remainingSec}s</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
              <Button variant="ghost" size="sm" onClick={cancelCrafting} className="h-7 px-2 text-destructive">
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue - inline compact */}
      {autoFabUnlocked && craftingQueue.length > 0 && (
        <div className="flex items-center gap-2 px-1 overflow-x-auto">
          <span className="text-xs text-muted-foreground flex-shrink-0">📋 {craftingQueue.length}:</span>
          {craftingQueue.map((qItem) => {
            const def = getItemDef(qItem.type, qItem.itemId)
            if (!def) return null
            return (
              <Badge 
                key={qItem.id} 
                variant="secondary" 
                className="flex-shrink-0 gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => cancelQueueItem(qItem.id)}
              >
                {def.emoji} {qItem.amount > 1 && `×${qItem.amount}`}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
