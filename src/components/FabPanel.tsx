import { useGameStore } from '@/store/gameStore'
import { canCraftWafer, canCraftChip } from '@/engine/fabrication'
import { WAFERS, WAFER_ORDER } from '@/data/wafers'
import { CHIPS, CHIP_ORDER } from '@/data/chips'
import { MINERALS } from '@/data/minerals'
import { CraftingProgress } from './CraftingProgress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WaferId, ChipId } from '@/types/fabrication'
import type { MineralId } from '@/types/game'

function safeToNumber(val: unknown): number {
  if (val && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber()
  }
  return 0
}

function ResourceBadge({ emoji, have, need }: { emoji: string; have: number; need: number }) {
  const enough = have >= need
  return (
    <Badge variant={enough ? 'secondary' : 'destructive'} className="text-xs gap-1">
      {emoji} {Math.floor(have)}/{need}
    </Badge>
  )
}

function WaferCard({ waferId }: { waferId: WaferId }) {
  const wafer = WAFERS[waferId]
  const minerals = useGameStore((s) => s.minerals)
  const waferState = useGameStore((s) => s.wafers?.[waferId])
  const crafting = useGameStore((s) => s.crafting)
  const autoFabUnlocked = useGameStore((s) => s.autoFabUnlocked)
  const startCraftWafer = useGameStore((s) => s.startCraftWafer)

  if (!wafer || !waferState?.unlocked) return null

  const hasResources = canCraftWafer(waferId, minerals)
  const canCraft = hasResources && (!crafting || autoFabUnlocked)

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{wafer.emoji}</span>
            <div className="min-w-0">
              <div className="font-medium truncate">{wafer.name}</div>
              <div className="text-xs text-muted-foreground">
                Owned: {safeToNumber(waferState.amount).toFixed(0)}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => startCraftWafer(waferId)}
            disabled={!canCraft}
            className="flex-shrink-0 w-20"
          >
            {crafting && autoFabUnlocked ? 'Queue' : 'Craft'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(wafer.recipe).map(([mineralId, cost]) => {
            const mineral = MINERALS[mineralId as MineralId]
            const have = safeToNumber(minerals?.[mineralId as MineralId]?.amount)
            if (!mineral) return null
            return (
              <ResourceBadge key={mineralId} emoji={mineral.emoji} have={have} need={cost} />
            )
          })}
        </div>
      </CardContent>
    </Card>
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

  if (!chip || !chipState?.unlocked) return null

  const hasResources = canCraftChip(chipId, minerals, wafers, currentNode)
  const canCraft = hasResources && (!crafting || autoFabUnlocked)
  const waferState = wafers?.[chip.waferCost?.type]
  const waferDef = WAFERS[chip.waferCost?.type]

  if (!waferState) return null

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{chip.emoji}</span>
            <div className="min-w-0">
              <div className="font-medium truncate">{chip.name}</div>
              <div className="text-xs text-muted-foreground">
                {chip.node} • Owned: {safeToNumber(chipState.amount).toFixed(0)}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => startCraftChip(chipId)}
            disabled={!canCraft}
            className="flex-shrink-0 w-20"
          >
            {crafting && autoFabUnlocked ? 'Queue' : 'Fab'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">{chip.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {/* Wafer cost */}
          <ResourceBadge 
            emoji={waferDef?.emoji ?? '?'} 
            have={safeToNumber(waferState?.amount)} 
            need={chip.waferCost?.amount ?? 0} 
          />
          {/* Extra mineral costs */}
          {chip.extraCosts && Object.entries(chip.extraCosts).map(([mineralId, cost]) => {
            const mineral = MINERALS[mineralId as MineralId]
            const have = safeToNumber(minerals?.[mineralId as MineralId]?.amount)
            if (!mineral) return null
            return (
              <ResourceBadge key={mineralId} emoji={mineral.emoji} have={have} need={cost} />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function FabPanel() {
  const wafers = useGameStore((s) => s.wafers)
  const chips = useGameStore((s) => s.chips)

  const unlockedWafers = WAFER_ORDER.filter(id => wafers?.[id]?.unlocked)
  const unlockedChips = CHIP_ORDER.filter(id => chips?.[id]?.unlocked)

  return (
    <div className="space-y-6">
      {/* Fixed height crafting area so buttons don't move */}
      <div className="h-[120px] overflow-y-auto">
        <CraftingProgress />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          💿 Wafers
        </h2>
        <div className="space-y-2">
          {unlockedWafers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No wafers unlocked yet</p>
          ) : (
            unlockedWafers.map(id => <WaferCard key={id} waferId={id} />)
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          🔲 Chips
        </h2>
        <div className="space-y-2">
          {unlockedChips.length === 0 ? (
            <p className="text-muted-foreground text-sm">No chips unlocked yet</p>
          ) : (
            unlockedChips.map(id => <ChipCard key={id} chipId={id} />)
          )}
        </div>
      </section>
    </div>
  )
}
