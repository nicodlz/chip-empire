import { useGameStore } from '../store/gameStore'

export function SingularityModal() {
  const singularityReached = useGameStore((s) => s.singularityReached)
  const totalFlops = useGameStore((s) => s.totalFlops)
  const reset = useGameStore((s) => s.reset)

  if (!singularityReached) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-violet-950 to-slate-950 rounded-2xl p-8 max-w-lg mx-4 border border-violet-500/50 shadow-2xl shadow-violet-500/20">
        <div className="text-center">
          <div className="text-8xl mb-4 animate-pulse">♾️</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            SINGULARITY
          </h1>
          <p className="text-xl text-violet-300 mb-6">
            You have transcended.
          </p>
          
          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <p className="text-slate-400 text-sm mb-2">Total Compute Achieved</p>
            <p className="text-2xl font-mono text-cyan-400">
              {totalFlops.toExponential(2)} FLOPS
            </p>
          </div>
          
          <p className="text-slate-400 text-sm mb-6 italic">
            "Any sufficiently advanced technology is indistinguishable from magic."
            <br />— Arthur C. Clarke
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold rounded-xl hover:brightness-110 transition-all"
            >
              🔄 Prestige (Coming Soon)
            </button>
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-all"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
