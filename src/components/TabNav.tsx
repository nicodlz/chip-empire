import { useGameStore } from '../store/gameStore'

const tabs = [
  { id: 'mine' as const, label: '⛏️ Mine', emoji: '⛏️' },
  { id: 'fab' as const, label: '🔧 Fab', emoji: '🔧' },
  { id: 'chips' as const, label: '💾 Chips', emoji: '💾' },
  { id: 'research' as const, label: '🔬 R&D', emoji: '🔬' },
]

export function TabNav() {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const totalFlops = useGameStore((s) => s.totalFlops)
  const hasChips = useGameStore((s) => 
    Object.values(s.chips).some(c => c.amount.gt(0))
  )
  const hasUnlockedFab = useGameStore((s) => 
    s.minerals.silicon.total.gte(50) // Show fab after some mining
  )

  return (
    <nav className="flex gap-1 p-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
      {tabs.map((tab) => {
        // Progressive unlock
        if (tab.id === 'fab' && !hasUnlockedFab) return null
        if (tab.id === 'chips' && !hasChips && totalFlops.eq(0)) return null
        if (tab.id === 'research' && totalFlops.lt(1e6)) return null

        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all
              ${isActive 
                ? 'bg-[--neon-blue] text-slate-950 shadow-lg shadow-[--neon-blue]/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            <span className="sm:hidden">{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
