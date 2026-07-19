import { useEffect, useState } from 'react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useNetworkBusy } from '@/shared/lib/networkActivity'
import { LoadingState } from './LoadingState'
import styles from './QueryLoadingOverlay.module.css'

const SHOW_DELAY_MS = 150

/**
 * Global brand loading while TanStack Query fetches/mutations or tracked
 * `apiFetch` / other server calls are in flight. Debounces show to avoid flicker.
 */
export function QueryLoadingOverlay() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const networkBusy = useNetworkBusy()
  const busy = fetching + mutating > 0 || networkBusy

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!busy) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [busy])

  if (!visible) return null

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingState variant="overlay" label="Cargando…" />
    </div>
  )
}
