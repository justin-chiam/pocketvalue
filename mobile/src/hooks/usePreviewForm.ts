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
  const batteryPct = form?.batteryPct
  const condition = form?.condition

  // Debounced re-estimation when model / RAM / storage / battery / condition are edited.
  useEffect(() => {
    if (!form) return
    const ram = Number(ramGb)
    const storage = Number(storageGb)
    const battery = Number(batteryPct)
    const valid =
      !!model?.trim() &&
      !!ramGb?.trim() &&
      !!storageGb?.trim() &&
      !!batteryPct?.trim() &&
      Number.isFinite(ram) &&
      Number.isFinite(storage) &&
      Number.isFinite(battery) &&
      ram > 0 &&
      storage > 0 &&
      battery >= 1 &&
      battery <= 100
    // Invalid input (e.g. "hello" for storage): keep the previous estimate.
    if (!valid) return
    const inputsKey = JSON.stringify([model!.trim(), ram, storage, battery, condition])
    if (inputsKey === lastEstimatedRef.current) return

    const timer = setTimeout(async () => {
      setEstimating(true)
      try {
        const data = await requestEstimate({
          model: model!.trim(),
          ramGb: ram,
          storageGb: storage,
          batteryPct: battery,
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
  }, [model, ramGb, storageGb, batteryPct, condition])

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
      // Battery health isn't visible in photos, so the user must enter it
      // before continuing. Re-estimation begins once a valid value is entered.
      lastEstimatedRef.current = null
      setFormState({
        model: data.model ?? '',
        resaleLow: String(data.resaleValueAud?.low ?? ''),
        resaleHigh: String(data.resaleValueAud?.high ?? ''),
        ramGb: String(data.ramGb ?? ''),
        storageGb: String(data.storageGb ?? ''),
        batteryPct: '',
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
