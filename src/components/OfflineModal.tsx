import { useGameStore } from '../store/gameStore'
import { formatFlops } from '../engine/fabrication'
import { MINERALS } from '../data/minerals'
import type { MineralId } from '../types/game'
import Decimal from 'break_eternity.js'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} seconds`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
  return `${Math.floor(seconds / 86400)} days`
}

function formatNumber(n: Decimal | null | undefined): string {
  if (!n || typeof n.toNumber !== 'function') return '0'
  const num = n.toNumber()
  if (isNaN(num)) return '0'
  if (num < 1000) return num.toFixed(0)
  if (num < 1e6) return `${(num / 1000).toFixed(1)}K`
  if (num < 1e9) return `${(num / 1e6).toFixed(2)}M`
  return `${(num / 1e9).toFixed(2)}B`
}

export function OfflineModal() {
  const offlineProgress = useGameStore((s) => s.offlineProgress)
  const dismissOfflineProgress = useGameStore((s) => s.dismissOfflineProgress)
  
  if (!offlineProgress) return null
  
  const mineralEntries = Object.entries(offlineProgress.minerals)
    .filter(([, amount]) => amount instanceof Decimal && amount.gt(0)) as [MineralId, Decimal][]
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-bold text-white">Welcome Back!</h2>
          <p className="text-slate-400 text-sm">
            You were away for {formatDuration(offlineProgress.duration)}
          </p>
        </div>
        
        <div className="space-y-4">
          {/* FLOPS gained */}
          {offlineProgress.flops instanceof Decimal && offlineProgress.flops.gt(0) && (
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-slate-400">Compute Generated</div>
              <div className="text-2xl font-mono text-[--neon-green]">
                +{formatFlops(offlineProgress.flops)}
              </div>
            </div>
          )}
          
          {/* Minerals gained */}
          {mineralEntries.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-2 text-center">Minerals Mined</div>
              <div className="grid grid-cols-3 gap-2">
                {mineralEntries.map(([mineralId, amount]) => {
                  const mineral = MINERALS[mineralId]
                  if (!mineral) return null
                  return (
                    <div key={mineralId} className="text-center">
                      <span className="text-lg">{mineral.emoji}</span>
                      <div className="text-xs text-[--neon-blue]">+{formatNumber(amount)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={dismissOfflineProgress}
          className="w-full mt-6 bg-[--neon-blue] text-slate-950 py-3 rounded-xl font-bold text-lg hover:brightness-110 active:scale-98 transition-all"
        >
          Collect!
        </button>
      </div>
    </div>
  )
}
