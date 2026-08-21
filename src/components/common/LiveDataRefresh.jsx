import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Active data screens stay current without polling hidden browser tabs. Chat and
// incoming-call views retain their own faster refresh intervals where needed.
const LIVE_DATA_REFRESH_INTERVAL_MS = 15_000
const REFRESH_DEBOUNCE_MS = 750

const isRefreshEligible = (query) => query.meta?.liveRefresh !== false

const LiveDataRefresh = () => {
  const queryClient = useQueryClient()
  const lastRefreshAtRef = useRef(0)

  const refreshActiveData = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return
    }

    const now = Date.now()
    if (now - lastRefreshAtRef.current < REFRESH_DEBOUNCE_MS) {
      return
    }
    lastRefreshAtRef.current = now

    // Only refresh mounted queries. This prevents needless background requests
    // while still updating whichever Doctor or Patient screen is open.
    void queryClient.refetchQueries(
      {
        type: 'active',
        predicate: isRefreshEligible,
      },
      { cancelRefetch: false }
    ).catch(() => {
      // Individual views continue to render their existing error state. The API
      // layer and toast deduplication prevent background retries from spamming UI.
    })
  }, [queryClient])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshActiveData()
    }

    const intervalId = window.setInterval(refreshWhenVisible, LIVE_DATA_REFRESH_INTERVAL_MS)
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refreshActiveData])

  return null
}

export default LiveDataRefresh
