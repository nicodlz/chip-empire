import { MineralDisplay } from './components/MineralDisplay'
import { MineArea } from './components/MineArea'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-10 bg-slate-950/80">
        <h1 className="text-xl font-bold text-center tracking-wider">
          <span className="text-[--neon-blue]">⚡</span> CHIP EMPIRE
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 gap-6 max-w-lg mx-auto w-full">
        <MineralDisplay />
        <MineArea />
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-slate-600 text-xs border-t border-slate-800/50">
        Mine minerals • Build chips • Unlock research
      </footer>
    </div>
  )
}
