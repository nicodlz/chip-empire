import { useGameStore } from '../store/gameStore'
import { formatFlops } from '../engine/fabrication'
import { RESEARCH, RESEARCH_BY_CATEGORY } from '../data/research'
import type { ResearchId, ResearchCategory } from '../types/research'

const CATEGORY_INFO: Record<ResearchCategory, { name: string; emoji: string; color: string }> = {
  nodes: { name: 'Process Nodes', emoji: '🔬', color: 'blue' },
  efficiency: { name: 'Efficiency', emoji: '⚡', color: 'green' },
  automation: { name: 'Automation', emoji: '🤖', color: 'purple' },
  exotic: { name: 'Exotic', emoji: '💎', color: 'pink' },
}

function ResearchCard({ researchId }: { researchId: ResearchId }) {
  const research = RESEARCH[researchId]
  const completed = useGameStore((s) => s.research.completed.includes(researchId))
  const canBuy = useGameStore((s) => s.canBuyResearch(researchId))
  const buyResearch = useGameStore((s) => s.buyResearch)
  
  // Check if prerequisites are met
  const prereqsMet = !research.requires || 
    research.requires.every(id => useGameStore.getState().research.completed.includes(id))
  
  // Hidden if prerequisites not met
  if (!prereqsMet && !completed) {
    return (
      <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/20 opacity-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <span className="text-slate-500">???</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`
      rounded-xl p-4 border transition-all
      ${completed 
        ? 'bg-green-500/10 border-green-500/30' 
        : canBuy 
          ? 'bg-slate-800/50 border-[--neon-blue]/50 hover:border-[--neon-blue]' 
          : 'bg-slate-800/30 border-slate-700/30 opacity-70'
      }
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{research.emoji}</span>
          <div>
            <div className={`font-medium ${completed ? 'text-green-400' : 'text-white'}`}>
              {research.name}
              {completed && <span className="ml-2 text-xs">✓</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">{research.description}</p>
          </div>
        </div>
        
        {!completed && (
          <button
            onClick={() => buyResearch(researchId)}
            disabled={!canBuy}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all shrink-0
              ${canBuy 
                ? 'bg-[--neon-blue] text-slate-950 hover:brightness-110 active:scale-95' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {formatFlops(research.cost)}
          </button>
        )}
      </div>
      
      {/* Prerequisites */}
      {research.requires && !completed && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <div className="text-xs text-slate-500">
            Requires: {research.requires.map(id => RESEARCH[id].name).join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

function CategorySection({ category }: { category: ResearchCategory }) {
  const info = CATEGORY_INFO[category]
  const researchIds = RESEARCH_BY_CATEGORY[category]
  const completedCount = useGameStore((s) => 
    researchIds.filter(id => s.research.completed.includes(id)).length
  )
  
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
          <span>{info.emoji}</span>
          {info.name}
        </h3>
        <span className="text-xs text-slate-500">
          {completedCount}/{researchIds.length}
        </span>
      </div>
      <div className="space-y-2">
        {researchIds.map(id => (
          <ResearchCard key={id} researchId={id} />
        ))}
      </div>
    </section>
  )
}

export function ResearchPanel() {
  const totalFlops = useGameStore((s) => s.totalFlops)
  const totalSpent = useGameStore((s) => s.research.totalSpent)
  const completedCount = useGameStore((s) => s.research.completed.length)
  const totalResearch = Object.keys(RESEARCH).length
  
  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Available</div>
            <div className="font-mono text-[--neon-green] font-bold">
              {formatFlops(totalFlops)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Spent</div>
            <div className="font-mono text-[--neon-purple]">
              {formatFlops(totalSpent)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Researched</div>
            <div className="font-mono text-[--neon-blue]">
              {completedCount}/{totalResearch}
            </div>
          </div>
        </div>
      </div>
      
      {/* Research Categories */}
      <div className="space-y-8">
        <CategorySection category="efficiency" />
        <CategorySection category="exotic" />
        <CategorySection category="nodes" />
        <CategorySection category="automation" />
      </div>
    </div>
  )
}
