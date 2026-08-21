import { toast } from 'react-toastify'

const DEDUPE_WINDOW_MS = 12000
const supportedMethods = ['error', 'warning', 'info', 'success']
const lastShownAt = new Map()
let installed = false

const messageKey = (content) => {
  if (typeof content === 'string' || typeof content === 'number') {
    return String(content).trim().replace(/\s+/g, ' ')
  }
  return ''
}

/**
 * React-Toastify only prevents duplicate toasts while the current toast is
 * visible. Chat polling can otherwise queue the same failure every few
 * seconds. Install one shared guard so every existing toast call benefits
 * without changing the behaviour of distinct messages.
 */
export const installToastDeduplication = () => {
  if (installed) return
  installed = true

  supportedMethods.forEach((method) => {
    const original = toast[method]
    if (typeof original !== 'function') return

    toast[method] = (content, options = {}) => {
      const explicitToastId = options?.toastId
      const contentKey = messageKey(content)
      const generatedToastId = contentKey ? `deduped-${method}-${contentKey}` : undefined
      const toastId = explicitToastId ?? generatedToastId

      // Explicit IDs are controlled by their caller (for example, one
      // incoming-message notification per conversation). For normal toasts,
      // also keep a brief cooldown after dismissal to suppress polling noise.
      if (toastId && toast.isActive(toastId)) return toastId
      if (!explicitToastId && contentKey) {
        const key = `${method}:${contentKey}`
        const now = Date.now()
        const lastShown = lastShownAt.get(key) || 0
        if (now - lastShown < DEDUPE_WINDOW_MS) return toastId
        lastShownAt.set(key, now)
      }

      return original(content, toastId ? { ...options, toastId } : options)
    }
  })
}
