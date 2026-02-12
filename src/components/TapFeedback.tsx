import { motion, AnimatePresence } from 'framer-motion'
import { formatNumber } from '../engine/resources'
import Decimal from 'break_eternity.js'

export interface TapData {
  id: number
  x: number
  y: number
  amount: Decimal
  emoji: string
}

interface Props {
  taps: TapData[]
  onComplete: (id: number) => void
}

export function TapFeedback({ taps, onComplete }: Props) {
  return (
    <AnimatePresence>
      {taps.map(tap => (
        <motion.div
          key={tap.id}
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 0, y: -100, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={() => onComplete(tap.id)}
          className="absolute pointer-events-none flex items-center gap-1 font-bold text-xl"
          style={{ 
            left: tap.x, 
            top: tap.y, 
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 10px var(--neon-green)',
            color: 'var(--neon-green)',
          }}
        >
          <span>+{formatNumber(tap.amount)}</span>
          <span>{tap.emoji}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
