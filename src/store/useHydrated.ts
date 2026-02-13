/**
 * Hook to track Zustand store hydration status
 * Components can use this to avoid rendering until store is ready
 */
import { useEffect, useState } from 'react'

let hydrated = false
const listeners = new Set<() => void>()

export function setHydrated() {
  hydrated = true
  listeners.forEach(fn => fn())
}

export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(hydrated)
  
  useEffect(() => {
    if (hydrated) {
      setIsHydrated(true)
      return
    }
    
    const listener = () => setIsHydrated(true)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])
  
  return isHydrated
}
