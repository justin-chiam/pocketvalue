export type Slot = 'front' | 'back' | 'settings'

export const SLOT_LABELS: Record<Slot, string> = {
  front: 'Front',
  back: 'Back',
  settings: 'About screen',
}

export type PhoneCondition = 'good' | 'poor' | 'excellent' | 'new'
export const CONDITIONS: PhoneCondition[] = ['new', 'excellent', 'good', 'poor']

// Editable form values, auto-filled from POST /api/preview.
// Numbers are kept as strings because they back TextInputs.
export type PreviewForm = {
  model: string
  resaleLow: string
  resaleHigh: string
  ramGb: string
  storageGb: string
  condition: PhoneCondition
  description: string
}
