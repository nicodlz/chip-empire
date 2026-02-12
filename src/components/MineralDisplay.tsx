import { useGameStore } from '../store/gameStore'
import { formatNumber } from '../engine/resources'
import { MINERALS, MINERAL_ORDER } from '../data/minerals'

export function MineralDisplay() {
  const minerals = useGameStore(s => s.minerals)
  
  const unlockedMinerals = MINERAL_ORDER.filter(id => minerals[id].unlocked)
  
  return (
    <div className="w-full max-w-md space-y-2">
      {unlockedMinerals.map(id => {
        const def = MINERALS[id]
        const state = minerals[id]
        return (
          <div 
            key={id}
            className="flex items-center justify-between bg-slate-800/50 backdrop-blur rounded-lg px-4 py-3 border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{def.emoji}</span>
              <div>
                <div className="font-medium">{def.name}</div>
                <div className="text-xs text-slate-500">{def.symbol} • Tier {def.tier}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg text-[--neon-blue]">
                {formatNumber(state.amount)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
