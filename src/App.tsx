import { useEffect } from 'react'
import { useGameStore, startTicker } from './store/gameStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MineralDisplay } from './components/MineralDisplay'
import { MineArea } from './components/MineArea'
import { TabNav } from './components/TabNav'
import { FabPanel } from './components/FabPanel'
import { ChipsPanel } from './components/ChipsPanel'
import { ResearchPanel } from './components/ResearchPanel'
import { AutoPanel } from './components/AutoPanel'
import { OfflineModal } from './components/OfflineModal'
import { formatFlops } from './engine/fabrication'

function MineTab() {
  return (
    <>
      <MineralDisplay />
      <MineArea />
    </>
  )
}

function FlopsCounter() {
  const totalFlops = useGameStore((s) => s.totalFlops)
  const flopsPerSecond = useGameStore((s) => s.flopsPerSecond)
  
  // Safety check
  if (!flopsPerSecond || typeof flopsPerSecond.eq !== 'function') return null
  if (flopsPerSecond.eq(0)) return null
  
  return (
    <div className="text-center py-2 px-4 bg-slate-900/50 rounded-lg border border-slate-800/30">
      <div className="text-xs text-slate-400">COMPUTE</div>
      <div className="font-mono text-[--neon-green] font-bold">
        {formatFlops(totalFlops)}
      </div>
      <div className="text-xs text-slate-500">
        +{formatFlops(flopsPerSecond)}/s
      </div>
    </div>
  )
}

function TabContent({ tab }: { tab: string }) {
  switch (tab) {
    case 'mine': return <MineTab />
    case 'fab': return <FabPanel />
    case 'chips': return <ChipsPanel />
    case 'research': return <ResearchPanel />
    case 'auto': return <AutoPanel />
    default: return <MineTab />
  }
}

export default function App() {
  const activeTab = useGameStore((s) => s.activeTab)
  
  useEffect(() => {
    startTicker()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      <OfflineModal />
      
      <header className="p-4 border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold tracking-wider">
            <span className="text-[--neon-blue]">⚡</span> CHIP EMPIRE
          </h1>
          <FlopsCounter />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto w-full">
        <ErrorBoundary>
          <TabNav />
        </ErrorBoundary>
      </div>

      <main className="flex-1 flex flex-col p-4 gap-6 max-w-lg mx-auto w-full pb-20">
        <ErrorBoundary>
          <TabContent tab={activeTab} />
        </ErrorBoundary>
      </main>

      <footer className="p-3 text-center text-slate-600 text-xs border-t border-slate-800/50">
        Mine minerals • Build chips • Unlock research
      </footer>
    </div>
  )
}
