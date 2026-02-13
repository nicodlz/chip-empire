/**
 * Hook to track Zustand store hydration status
 * Uses Zustand's built-in persist API
 */
import { useEffect, useState } from 'react'
import { useGameStore } from './gameStore'

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    // Check if already hydrated
    const unsubFinishHydration = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    
    // Also check synchronously in case it already finished
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    
    return unsubFinishHydration
  }, [])
  
  return hydrated
}
