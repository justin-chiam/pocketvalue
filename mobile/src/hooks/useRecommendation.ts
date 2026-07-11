import { useState } from 'react'
import { requestRecommendation } from '../api'
import type { PreviewForm, Recommendation } from '../types'

// Owns the recommendation view's lifecycle: submitting the confirmed form
// for a fix/sell/trade-in/donate/recycle verdict.
export function useRecommendation() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Recommendation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (form: PreviewForm) => {
    setLoading(true)
    setError(null)
    try {
      setData(await requestRecommendation(form))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
  }

  const isOpen = loading || data !== null || error !== null

  return { loading, data, error, isOpen, submit, reset }
}

export type RecommendationState = ReturnType<typeof useRecommendation>
