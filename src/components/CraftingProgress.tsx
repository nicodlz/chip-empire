import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getCraftingProgress } from '@/engine/fabrication'
import { WAFERS } from '@/data/wafers'
import { CHIPS } from '@/data/chips'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { QueuedCraft } from '@/types/fabrication'

function getItemDef(type: 'wafer' | 'chip', itemId: string) {
  return type === 'wafer'
    ? WAFERS[itemId as keyof typeof WAFERS]
    : CHIPS[itemId as keyof typeof CHIPS]
}

function QueueItem({ item, onCancel }: { item: QueuedCraft; onCancel: () => void }) {
  const def = getItemDef(item.type, item.itemId)
  if (!def) return null

  return (
    <div className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded">
      <div className="flex items-center gap-2">
        <span className="text-base">{def.emoji}</span>
        <span className="text-sm">
          {def.name}
          {item.amount > 1 && <span className="text-muted-foreground"> ×{item.amount}</span>}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5">
          {(item.duration / 1000).toFixed(1)}s
        </Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0 text-destructive">
        ✕
      </Button>
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

  // Empty state placeholder to maintain height
  if (!crafting && craftingQueue.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Select a wafer or chip to craft
        </CardContent>
      </Card>
    )
  }

  const item = crafting ? getItemDef(crafting.type, crafting.itemId) : null
  const remainingMs = crafting ? Math.max(0, (crafting.startedAt + crafting.duration) - Date.now()) : 0
  const remainingSec = (remainingMs / 1000).toFixed(1)

  return (
    <div className="space-y-2">
      {/* Current crafting */}
      {crafting && item && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <div className="font-medium">
                    Crafting {item.name}
                    {crafting.amount > 1 && <span className="text-muted-foreground"> ×{crafting.amount}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {remainingSec}s remaining
                  </div>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={cancelCrafting}>
                Cancel
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      {autoFabUnlocked && craftingQueue.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              📋 Queue ({craftingQueue.length})
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
