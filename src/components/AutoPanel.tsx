import { useGameStore } from '../store/gameStore'
import { AUTO_MINERS, AUTO_MINER_ORDER } from '../data/automations'
import { MINERALS } from '../data/minerals'
import type { AutoMinerId } from '../types/automation'
import Decimal from 'break_eternity.js'

function formatNumber(n: Decimal | number | null | undefined): string {
  if (n == null) return '0'
  const num = n instanceof Decimal ? n.toNumber() : n
  if (isNaN(num)) return '0'
  if (num < 1000) return num.toFixed(0)
  if (num < 1e6) return `${(num / 1000).toFixed(1)}K`
  if (num < 1e9) return `${(num / 1e6).toFixed(2)}M`
  if (num < 1e12) return `${(num / 1e9).toFixed(2)}B`
  return `${(num / 1e12).toFixed(2)}T`
}

function AutoMinerCard({ minerId }: { minerId: AutoMinerId }) {
  const def = AUTO_MINERS[minerId]
  const minerState = useGameStore((s) => s.autoMiners[minerId])
  const canBuy = useGameStore((s) => s.canBuyAutoMiner(minerId))
  const getCost = useGameStore((s) => s.getAutoMinerCost)
  const buyAutoMiner = useGameStore((s) => s.buyAutoMiner)
  const miningMultiplier = useGameStore((s) => s.miningMultiplier)
  
  if (!minerState?.unlocked) return null
  
  const cost = getCost(minerId)
  const productionPerSec = def.ratePerSecond * minerState.owned * miningMultiplier
  
  return (
    <div className={`
      bg-slate-800/30 rounded-xl p-4 border transition-all
      ${canBuy ? 'border-[--neon-green]/50 hover:border-[--neon-green]' : 'border-slate-700/30'}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{def.emoji}</span>
          <div>
            <div className="font-medium text-white">{def.name}</div>
            <div className="text-xs text-slate-400">
              Tier {def.tier} • Mines {def.targets.length} minerals
            </div>
            <div className="text-xs text-[--neon-green] mt-1">
              {minerState.owned > 0 && `+${formatNumber(productionPerSec)}/s each mineral`}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-mono text-2xl text-[--neon-blue]">
            ×{minerState.owned}
          </div>
        </div>
      </div>
      
      {/* Target minerals preview */}
      <div className="mt-3 flex flex-wrap gap-1">
        {def.targets.slice(0, 6).map(mineralId => (
          <span key={mineralId} className="text-sm" title={MINERALS[mineralId].name}>
            {MINERALS[mineralId].emoji}
          </span>
        ))}
        {def.targets.length > 6 && (
          <span className="text-xs text-slate-500">+{def.targets.length - 6}</span>
        )}
      </div>
      
      {/* Buy button */}
      <button
        onClick={() => buyAutoMiner(minerId)}
        disabled={!canBuy}
        className={`
          w-full mt-4 px-4 py-3 rounded-lg font-medium text-sm transition-all
          flex items-center justify-center gap-2
          ${canBuy 
            ? 'bg-[--neon-green] text-slate-950 hover:brightness-110 active:scale-98' 
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        <span>Buy</span>
        <span className="opacity-80">🔷 {formatNumber(cost)} Silicon</span>
      </button>
    </div>
  )
}

function ProductionOverview() {
  const autoMiners = useGameStore((s) => s.autoMiners)
  const miningMultiplier = useGameStore((s) => s.miningMultiplier)
  
  // Calculate total production per mineral
  const production: Record<string, number> = {}
  
  for (const [minerId, minerState] of Object.entries(autoMiners)) {
    if (minerState.owned > 0) {
      const def = AUTO_MINERS[minerId as AutoMinerId]
      const rate = def.ratePerSecond * minerState.owned * miningMultiplier
      
      for (const mineralId of def.targets) {
        production[mineralId] = (production[mineralId] || 0) + rate
      }
    }
  }
  
  const entries = Object.entries(production).filter(([, rate]) => rate > 0)
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500 text-sm">
        Buy auto-miners to start passive production
      </div>
    )
  }
  
  return (
    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
      <h3 className="text-sm font-medium text-slate-400 mb-3">Passive Production</h3>
      <div className="grid grid-cols-3 gap-2">
        {entries.map(([mineralId, rate]) => (
          <div key={mineralId} className="text-center">
            <span className="text-lg">{MINERALS[mineralId as keyof typeof MINERALS].emoji}</span>
            <div className="text-xs text-[--neon-green]">+{formatNumber(rate)}/s</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AutoPanel() {
  const autoMiningUnlocked = useGameStore((s) => s.autoMiningUnlocked)
  const unlockedMiners = useGameStore((s) => 
    AUTO_MINER_ORDER.filter(id => s.autoMiners[id].unlocked)
  )
  
  if (!autoMiningUnlocked) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">🔒</div>
        <p>Auto-mining locked</p>
        <p className="text-sm mt-2">Research "Auto-Miners" to unlock</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <ProductionOverview />
      
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span>🤖</span> Auto-Miners
        </h2>
        <div className="space-y-3">
          {unlockedMiners.map(id => (
            <AutoMinerCard key={id} minerId={id} />
          ))}
        </div>
      </section>
      
      <p className="text-xs text-slate-500 text-center">
        Buy 10 of a tier to unlock the next tier
      </p>
    </div>
  )
}
