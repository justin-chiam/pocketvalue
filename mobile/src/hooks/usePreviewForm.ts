import { useEffect, useRef, useState } from 'react'
import { requestEstimate, requestPreview } from '../api'
import type { PreviewForm, Slot } from '../types'

// Owns the preview sheet's lifecycle: submitting the photos for analysis,
// the auto-filled editable form, and debounced resale re-estimation.
export function usePreviewForm() {
  const [submitting, setSubmitting] = useState(false)
  const [form, setFormState] = useState<PreviewForm | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimating, setEstimating] = useState(false)
  // Inputs the current resale estimate was computed from, to skip
  // re-estimating when nothing relevant changed (or on the initial fill).
  const lastEstimatedRef = useRef<string | null>(null)

  const model = form?.model
  const ramGb = form?.ramGb
  const storageGb = form?.storageGb
  const condition = form?.condition

  // Debounced re-estimation when model / RAM / storage / condition are edited.
  useEffect(() => {
    if (!form) return
    const ram = Number(ramGb)
    const storage = Number(storageGb)
    const valid = !!model?.trim() && Number.isFinite(ram) && Number.isFinite(storage)
    // Invalid input (e.g. "hello" for storage): keep the previous estimate.
    if (!valid) return
    const inputsKey = JSON.stringify([model!.trim(), ram, storage, condition])
    if (inputsKey === lastEstimatedRef.current) return

    const timer = setTimeout(async () => {
      setEstimating(true)
      try {
        const data = await requestEstimate({
          model: model!.trim(),
          ramGb: ram,
          storageGb: storage,
          condition: condition!,
        })
        lastEstimatedRef.current = inputsKey
        setFormState((p) =>
          p ? { ...p, resaleLow: String(data.low), resaleHigh: String(data.high) } : p,
        )
      } catch {
        // Estimation failed: keep the previous value.
      } finally {
        setEstimating(false)
      }
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, ramGb, storageGb, condition])

  const submit = async (photos: Record<Slot, string | null>) => {
    if (!photos.front || !photos.back) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await requestPreview({
        front: photos.front,
        back: photos.back,
        settings: photos.settings,
      })
      // Seed the ref so the debounced effect doesn't immediately re-estimate
      // the values Gemini just produced.
      lastEstimatedRef.current = JSON.stringify([
        (data.model ?? '').trim(),
        Number(data.ramGb),
        Number(data.storageGb),
        data.condition ?? 'good',
      ])
      setFormState({
        model: data.model ?? '',
        resaleLow: String(data.resaleValueAud?.low ?? ''),
        resaleHigh: String(data.resaleValueAud?.high ?? ''),
        ramGb: String(data.ramGb ?? ''),
        storageGb: String(data.storageGb ?? ''),
        condition: data.condition ?? 'good',
        description: data.description ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const setForm = (patch: Partial<PreviewForm>) =>
    setFormState((p) => (p ? { ...p, ...patch } : p))

  const reset = () => {
    setFormState(null)
    setError(null)
    lastEstimatedRef.current = null
  }

  const isOpen = submitting || error !== null || form !== null

  return { submitting, form, error, estimating, isOpen, submit, setForm, reset }
}

export type PreviewFormState = ReturnType<typeof usePreviewForm>
