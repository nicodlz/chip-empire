import { useState, useCallback, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { TapFeedback } from './TapFeedback'
import type { TapData } from './TapFeedback'
import { mineMineral } from '../engine/resources'
import { MINERALS, MINERAL_ORDER } from '../data/minerals'
import type { MineralId } from '../types/game'

export function MineArea() {
  const mine = useGameStore(s => s.mine)
  const miningPower = useGameStore(s => s.miningPower)
  const minerals = useGameStore(s => s.minerals)
  const [taps, setTaps] = useState<TapData[]>([])
  const [tapId, setTapId] = useState(0)
  const [currentMineral, setCurrentMineral] = useState<MineralId>('silicon')
  
  // Get all unlocked minerals in order
  const unlockedMinerals = useMemo(() => 
    MINERAL_ORDER.filter(id => minerals[id]?.unlocked),
    [minerals]
  )

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top

    const gained = mineMineral(currentMineral, miningPower)
    const def = MINERALS[currentMineral]
    
    setTaps(prev => [...prev, { id: tapId, x, y, amount: gained, emoji: def.emoji }])
    setTapId(prev => prev + 1)
    mine(currentMineral)
  }, [mine, miningPower, tapId, currentMineral])

  const removeTap = useCallback((id: number) => {
    setTaps(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {/* Mineral selector */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center max-w-md">
        {unlockedMinerals.map(id => {
          const def = MINERALS[id]
          const isActive = currentMineral === id
          return (
            <button
              key={id}
              onClick={() => setCurrentMineral(id)}
              className={`px-3 py-2 rounded-xl text-xl transition-all ${
                isActive 
                  ? 'bg-slate-700 ring-2 ring-[--neon-blue] scale-110' 
                  : 'bg-slate-800/50 hover:bg-slate-700/50 active:scale-95'
              }`}
              title={def.name}
            >
              {def.emoji}
            </button>
          )
        })}
      </div>

      {/* Tap area */}
      <div 
        className="relative w-full max-w-md aspect-square flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform bg-slate-800/30 rounded-3xl border border-slate-700/50 overflow-hidden"
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        <div className="text-[120px] animate-pulse drop-shadow-2xl">
          {MINERALS[currentMineral].emoji}
        </div>
        <TapFeedback taps={taps} onComplete={removeTap} />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-radial from-[--neon-blue]/10 to-transparent pointer-events-none" />
      </div>

      <p className="mt-4 text-slate-500 text-sm">
        Tap to mine <span className="text-slate-300">{MINERALS[currentMineral].name}</span>
      </p>
    </div>
  )
}
