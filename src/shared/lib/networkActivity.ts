import { useSyncExternalStore } from 'react'

let pending = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function beginNetworkActivity() {
  pending += 1
  emit()
}

export function endNetworkActivity() {
  pending = Math.max(0, pending - 1)
  emit()
}

export function getNetworkPendingCount() {
  return pending
}

export function subscribeNetworkActivity(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Tracks a server request for the global loading overlay. */
export async function withNetworkActivity<T>(fn: () => Promise<T>): Promise<T> {
  beginNetworkActivity()
  try {
    return await fn()
  } finally {
    endNetworkActivity()
  }
}

export function useNetworkBusy(): boolean {
  return (
    useSyncExternalStore(
      subscribeNetworkActivity,
      getNetworkPendingCount,
      () => 0,
    ) > 0
  )
}
